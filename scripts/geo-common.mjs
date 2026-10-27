/**
 * 행정동 경계 → data/regions.json 공통 뼈대.
 * 사이트마다 다른 것은 `api` 로 넘기는 측정 함수뿐이다.
 *   api.META                     { axis, method, coverageFrom, params }
 *   api.CLASSES                  갈래 이름 순서
 *   api.measureSpot(rec, ctx)    동 하나 → { v:[3], a, b, x } | null
 *   api.measureGu(g, ctx)        시군구 하나(읍면 포함 전체 경계)
 *   api.measureSido(s, ctx)      시도 하나
 *   api.classify(m, tier)        갈래 키
 *   api.kinDist(g, o)            두 시군구가 얼마나 닮았는지(작을수록 닮음)
 * ctx 에는 시도·시군구의 한가운데(centroid)와 반지름이 들어 있다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { adminSlug } from './romanize.mjs';

export const VERSION = '2026년 7월 판(ver20260701) 경계에서 동 땅 무게중심의 북위만 뽑아 한 줄 눈금에 올린 값';

const MAIN = {
  서울: { full: '서울특별시', alias: '서울시', slug: 'seoul', iso: 'KR-11', src: '서울특별시' },
  인천: { full: '인천광역시', alias: '인천시', slug: 'incheon', iso: 'KR-28', src: '인천광역시' },
  경기: { full: '경기도', alias: '경기', slug: 'gyeonggi', iso: 'KR-41', src: '경기도' },
  부산: { full: '부산광역시', alias: '부산시', slug: 'busan', iso: 'KR-26', src: '부산광역시' },
};
const SUB = {
  대전: { full: '대전광역시', alias: '대전시', slug: 'daejeon', iso: 'KR-30', src: '대전광역시', all: true },
  대구: { full: '대구광역시', alias: '대구시', slug: 'daegu', iso: 'KR-27', src: '대구광역시', all: true },
  울산: { full: '울산광역시', alias: '울산시', slug: 'ulsan', iso: 'KR-31', src: '울산광역시', all: true },
  광주: { full: '광주광역시', alias: '광주시', slug: 'gwangju', iso: 'KR-29', src: '전남광주통합특별시', only: ['광산구'] },
  충남: { full: '충청남도', alias: '충남', slug: 'chungnam', iso: 'KR-44', src: '충청남도', only: ['천안시', '당진시', '공주시', '논산시'] },
  충북: { full: '충청북도', alias: '충북', slug: 'chungbuk', iso: 'KR-43', src: '충청북도', only: ['청주시', '제천시', '진천군', '증평군', '옥천군'] },
  강원: { full: '강원특별자치도', alias: '강원', slug: 'gangwon', iso: 'KR-42', src: '강원특별자치도', only: ['강릉시'] },
  전북: { full: '전북특별자치도', alias: '전북', slug: 'jeonbuk', iso: 'KR-45', src: '전북특별자치도', only: ['전주시', '군산시', '익산시', '정읍시'] },
  전남: { full: '전라남도', alias: '전남', slug: 'jeonnam', iso: 'KR-46', src: '전남광주통합특별시', only: ['여수시', '순천시', '광양시', '나주시', '함평군', '영광군'] },
  경북: { full: '경상북도', alias: '경북', slug: 'gyeongbuk', iso: 'KR-47', src: '경상북도', only: ['포항시', '구미시', '김천시', '성주군', '경주시', '영천시', '경산시'] },
  경남: { full: '경상남도', alias: '경남', slug: 'gyeongnam', iso: 'KR-48', src: '경상남도', only: ['양산시', '김해시'] },
};
const GWANGJU_GU = new Set(['광산구', '남구', '동구', '북구', '서구']);
const DROP_GU = new Set(['인천|옹진군', '대구|군위군']);

/* ── 기하 도구 ─────────────────────────────────────────────── */
const rad = (d) => (d * Math.PI) / 180;
export const r6 = (v) => Math.round(v * 1e6) / 1e6;
export const r1 = (v) => Math.round(v * 10) / 10;
export const r2 = (v) => Math.round(v * 100) / 100;
const pretty = (n) => n.replace(/^(.+?시)(.+구)$/, '$1 $2');
const kindOf = (n) => (/읍$/.test(n) ? '읍' : /면$/.test(n) ? '면' : '동');

export function signedArea(pts) {
  let a = 0;
  for (let i = 0, n = pts.length; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a / 2;
}

function ringsOf(geom, lat0) {
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  const kx = Math.cos(rad(lat0)) * 111320, ky = 110574;
  const rings = [];
  for (const poly of polys) {
    poly.forEach((ring, idx) => {
      const pts = ring.slice(0, -1).map((c) => [c[0] * kx, c[1] * ky]);
      if (pts.length < 3) return;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const p of pts) {
        if (p[0] < minX) minX = p[0]; if (p[0] > maxX) maxX = p[0];
        if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1];
      }
      rings.push({ pts, outer: idx === 0, minX, maxX, minY, maxY, area: Math.abs(signedArea(pts)) });
    });
  }
  return { rings, kx, ky };
}

/** 중심점·넓이(구멍은 음수). 반환 { A(㎡), gx, gy } 는 미터 평면 좌표 */
export function centroidOf(rings) {
  let A = 0, X = 0, Y = 0;
  for (const r of rings) {
    const sgn = r.outer ? 1 : -1;
    const sa = signedArea(r.pts);
    const a = Math.abs(sa);
    if (!a) continue;
    let sx = 0, sy = 0;
    for (let i = 0, n = r.pts.length; i < n; i++) {
      const p = r.pts[i], o = r.pts[(i + 1) % n];
      const f = p[0] * o[1] - o[0] * p[1];
      sx += (p[0] + o[0]) * f; sy += (p[1] + o[1]) * f;
    }
    A += sgn * a; X += sgn * a * (sx / (6 * sa)); Y += sgn * a * (sy / (6 * sa));
  }
  if (A <= 0) return null;
  return { A, gx: X / A, gy: Y / A };
}

/**
 * 격자 마스크. 경계를 theta 만큼 돌린 평면에서 cell(m) 간격 격자의 칸 중심이 땅 안인지 적는다.
 * 줄마다 경계와 만나는 점을 모아 안쪽 구간을 잇고, gap(m) 이하로 벌어진 틈(이웃 동 사이)은 메운다.
 * 반환 { W, H, mask(Uint8Array H×W), x0, y0 }  — 행 0 이 가장 작은 y(남쪽)
 */
export function rasterMask(rings, theta, cell, gap) {
  const co = Math.cos(theta), si = Math.sin(theta);
  const P = [];
  let lx = Infinity, hx = -Infinity, ly = Infinity, hy = -Infinity;
  for (const r of rings) {
    const q = r.pts.map((p) => [co * p[0] + si * p[1], -si * p[0] + co * p[1]]);
    P.push(q);
    for (const p of q) {
      if (p[0] < lx) lx = p[0]; if (p[0] > hx) hx = p[0];
      if (p[1] < ly) ly = p[1]; if (p[1] > hy) hy = p[1];
    }
  }
  const W = Math.max(1, Math.ceil((hx - lx) / cell)), H = Math.max(1, Math.ceil((hy - ly) / cell));
  const mask = new Uint8Array(W * H);
  const rows = Array.from({ length: H }, () => []);
  for (const q of P) {
    for (let i = 0, n = q.length; i < n; i++) {
      const a = q[i], b = q[(i + 1) % n];
      if (a[1] === b[1]) continue;
      const y0 = Math.min(a[1], b[1]), y1 = Math.max(a[1], b[1]);
      let k0 = Math.ceil((y0 - ly) / cell - 0.5), k1 = Math.floor((y1 - ly) / cell - 0.5);
      if (k0 < 0) k0 = 0; if (k1 > H - 1) k1 = H - 1;
      for (let k = k0; k <= k1; k++) {
        const y = ly + (k + 0.5) * cell;
        if ((a[1] <= y) !== (b[1] <= y)) rows[k].push(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
      }
    }
  }
  for (let k = 0; k < H; k++) {
    const xs = rows[k];
    if (xs.length < 2) continue;
    xs.sort((p, q) => p - q);
    const spans = [];
    let s = xs[0], e = xs[1];
    for (let i = 2; i + 1 < xs.length; i += 2) {
      if (xs[i] - e <= gap) e = xs[i + 1];
      else { spans.push([s, e]); s = xs[i]; e = xs[i + 1]; }
    }
    spans.push([s, e]);
    for (const [a, b] of spans) {
      let c0 = Math.ceil((a - lx) / cell - 0.5), c1 = Math.floor((b - lx) / cell - 0.5);
      if (c0 < 0) c0 = 0; if (c1 > W - 1) c1 = W - 1;
      for (let c = c0; c <= c1; c++) mask[k * W + c] = 1;
    }
  }
  return { W, H, mask, x0: lx, y0: ly };
}

/* ── 실행 ─────────────────────────────────────────────────── */
export function run(api, argv = process.argv) {
  const SRC = argv[2] || '/tmp/hjd.geojson';
  const OUT = path.join(process.cwd(), 'data', 'regions.json');
  const geo = JSON.parse(fs.readFileSync(SRC, 'utf8'));

  function sidoOf(p) {
    for (const [short, m] of Object.entries(MAIN)) {
      if (m.src !== p.sidonm) continue;
      if (DROP_GU.has(`${short}|${p.sggnm}`)) return [null, null, false];
      return [short, m, true];
    }
    for (const [short, m] of Object.entries(SUB)) {
      if (m.src !== p.sidonm) continue;
      if (m.src === '전남광주통합특별시') {
        const isGwangju = GWANGJU_GU.has(p.sggnm);
        if (short === '광주' && !isGwangju) continue;
        if (short === '전남' && isGwangju) continue;
      }
      if (m.only && !m.only.some((x) => p.sggnm.startsWith(x))) continue;
      if (DROP_GU.has(`${short}|${p.sggnm}`)) continue;
      return [short, m, false];
    }
    return [null, null, false];
  }

  /* 시도별 투영 기준 위도 — 한 시도 안은 같은 평면을 쓴다 */
  const LAT0 = new Map();
  {
    const acc = new Map();
    for (const ft of geo.features) {
      const [sidoKey] = sidoOf(ft.properties);
      if (!sidoKey) continue;
      const g = ft.geometry;
      const first = g.type === 'Polygon' ? g.coordinates[0][0] : g.coordinates[0][0][0];
      const a = acc.get(sidoKey) || [0, 0];
      a[0] += first[1]; a[1] += 1;
      acc.set(sidoKey, a);
    }
    for (const [k, [s, n]] of acc) LAT0.set(k, s / n);
  }

  /* 레코드 */
  const buckets = new Map();
  for (const ft of geo.features) {
    const p = ft.properties;
    const [sidoKey, , isMain] = sidoOf(p);
    if (!sidoKey) continue;
    const name = String(p.adm_nm).trim().split(/\s+/).pop();
    const { rings, kx, ky } = ringsOf(ft.geometry, LAT0.get(sidoKey));
    const kind = kindOf(name);
    const rec = { code: String(p.adm_cd2), name, kind, sidoKey, isMain, sggnm: p.sggnm, rings, kx, ky, wantSpot: isMain && kind === '동' };
    const k = `${sidoKey}|${p.sggnm}`;
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k).push(rec);
  }

  /* 시도·시군구 한가운데 — 동을 재기 전에 먼저 구한다 */
  const sidoCtx = new Map();
  const guCtx = new Map();
  for (const [k, list] of buckets) {
    const [sidoKey] = k.split('|');
    const allRings = [];
    for (const d of list) for (const r of d.rings) allRings.push(r);
    const c = centroidOf(allRings);
    if (!c) continue;
    guCtx.set(k, { c, rings: allRings, kx: list[0].kx, r: Math.sqrt(c.A / Math.PI) });
    const s = sidoCtx.get(sidoKey) || { rings: [], gus: [] };
    for (const r of allRings) s.rings.push(r);
    s.gus.push(guCtx.get(k));
    sidoCtx.set(sidoKey, s);
  }
  for (const [key, s] of sidoCtx) {
    const isMain = !!MAIN[key];
    if (isMain) s.c = centroidOf(s.rings);
    else {
      const A = s.gus.reduce((t, g) => t + g.c.A, 0);
      s.c = { A, gx: s.gus.reduce((t, g) => t + g.c.gx * g.c.A, 0) / A, gy: s.gus.reduce((t, g) => t + g.c.gy * g.c.A, 0) / A };
    }
    s.r = Math.sqrt(s.c.A / Math.PI);
    s.isMain = isMain;
  }

  /* 동 측정 */
  for (const [k, list] of buckets) {
    const gc = guCtx.get(k);
    if (!gc) continue;
    const sc = sidoCtx.get(k.split('|')[0]);
    for (const rec of list) {
      if (!rec.wantSpot) continue;
      const c = centroidOf(rec.rings);
      if (!c) continue;
      const t = api.measureSpot(rec, { c, gu: gc, sido: sc });
      if (!t) continue;
      Object.assign(rec, {
        lat: r6(c.gy / rec.ky), lng: r6(c.gx / rec.kx), area: r2(c.A / 1e6),
        v: t.v, a: t.a, b: t.b, x: t.x, cls: api.classify(t, 'spot'), ok: true,
      });
    }
  }

  /* 시군구 묶기 */
  const guAll = [];
  const spotAll = [];
  for (const [k, list] of buckets) {
    const [sidoKey, rawName] = k.split('|');
    const isMain = !!MAIN[sidoKey];
    const name = pretty(rawName);
    const dongs = list.filter((d) => d.kind === '동');
    const rural = list.filter((d) => d.kind !== '동')
      .map((d) => ({ name: d.name, kind: d.kind }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    const gc = guCtx.get(k);
    if (!gc) continue;
    const gt = api.measureGu({ rings: gc.rings, c: gc.c, list }, { gu: gc, sido: sidoCtx.get(sidoKey) });
    const ky = 110574, kx = list[0].kx;
    const g = {
      sidoKey, main: isMain, name, raw: rawName, slug: adminSlug(name),
      lat: r6(gc.c.gy / ky), lng: r6(gc.c.gx / kx),
      area: r1(gc.c.A / 1e6),
      dongCount: list.length,
      plainCount: dongs.length,
      rural, ruralCount: rural.length,
      eupCount: rural.filter((x) => x.kind === '읍').length,
      myeonCount: rural.filter((x) => x.kind === '면').length,
      spots: [],
      dongNames: isMain ? [] : dongs.map((d) => d.name).sort((a, b) => a.localeCompare(b, 'ko')),
      v: gt.v, a: gt.a, b: gt.b, x: gt.x, cls: api.classify(gt, 'gu'),
    };
    if (isMain) {
      const used = new Set();
      for (const d of dongs) {
        if (!d.ok) continue;
        let sl = adminSlug(d.name);
        if (used.has(sl)) { let i = 2; while (used.has(`${sl}-${i}`)) i++; sl = `${sl}-${i}`; }
        used.add(sl);
        const s = {
          name: d.name, kind: d.kind, slug: sl, code: d.code,
          lat: d.lat, lng: d.lng, area: d.area,
          v: d.v, a: d.a, b: d.b, x: d.x, cls: d.cls,
        };
        g.spots.push(s); spotAll.push(s);
      }
    }
    g.spotCount = g.spots.length;
    guAll.push(g);
  }

  /* 시군구 안 차례 */
  const byName = (a, b) => a.name.localeCompare(b.name, 'ko');
  for (const g of guAll) {
    if (!g.spots.length) continue;
    const byA = g.spots.slice().sort((x, y) => y.a - x.a || byName(x, y));
    byA.forEach((s, i) => { s.gRank = i + 1; });
    const lo = byA[byA.length - 1];
    g.hi = byA[0].name; g.hiSlug = byA[0].slug; g.hiV = byA[0].a;
    g.lo = lo.name; g.loSlug = lo.slug; g.loV = lo.a;
    const byB = g.spots.slice().sort((x, y) => y.b - x.b || byName(x, y));
    const lb = byB[byB.length - 1];
    g.bHi = byB[0].name; g.bHiSlug = byB[0].slug; g.bHiV = byB[0].b;
    g.bLo = lb.name; g.bLoSlug = lb.slug; g.bLoV = lb.b;
    const cnt = {};
    for (const s of g.spots) cnt[s.cls] = (cnt[s.cls] || 0) + 1;
    g.clsCount = cnt;
  }

  /* 읽는 값이 닮은 시군구 — 이 사이트의 '옆 동네' */
  {
    const sidoSlug = (key) => (MAIN[key] || SUB[key]).slug;
    for (const g of guAll) {
      const pool = guAll.filter((o) => o !== g).map((o) => ({
        o, same: o.sidoKey === g.sidoKey, gap: Math.round(api.kinDist(g, o) * 10) / 10,
      }));
      pool.sort((x, y) => (x.same === y.same ? (x.gap - y.gap || x.o.name.localeCompare(y.o.name, 'ko')) : x.same ? -1 : 1));
      g.kin = pool.slice(0, 8).map(({ o, same, gap }) => ({
        sidoSlug: sidoSlug(o.sidoKey), gu: o.name, slug: o.slug, same, gap, cls: o.cls, a: o.a, b: o.b,
      }));
      g.kinCount = g.kin.length;
    }
  }

  /* 전국 차례 */
  spotAll.slice().sort((x, y) => y.a - x.a || byName(x, y)).forEach((s, i) => { s.rank = i + 1; });
  spotAll.slice().sort((x, y) => y.b - x.b || byName(x, y)).forEach((s, i) => { s.bRank = i + 1; });

  /* 시도 묶기 */
  const sido = [];
  for (const [key, m] of [...Object.entries(MAIN), ...Object.entries(SUB)]) {
    const gus = guAll.filter((g) => g.sidoKey === key);
    if (!gus.length) continue;
    const isMain = !!MAIN[key];
    const sc = sidoCtx.get(key);
    const kx = guCtx.get(`${key}|${gus[0].raw}`).kx, ky = 110574;
    gus.sort(byName);
    const allSpots = [];
    for (const g of gus) for (const s of g.spots) allSpots.push(s);
    const units = isMain ? allSpots : gus;
    const st = api.measureSido({ rings: sc.rings, c: sc.c, gus, spots: allSpots, isMain }, { sido: sc });
    for (const g of gus) {
      g.spots.sort(byName);
      delete g.sidoKey;
    }
    const cnt = {};
    for (const s of units) cnt[s.cls] = (cnt[s.cls] || 0) + 1;
    const byA = units.slice().sort((x, y) => y.a - x.a || byName(x, y));
    const hi = byA[0], lo = byA[byA.length - 1];
    const avg = (f) => Math.round((units.reduce((s, x) => s + f(x), 0) / units.length) * 100) / 100;
    sido.push({
      name: key, full: m.full, alias: m.alias, slug: m.slug, iso: m.iso, main: isMain,
      lat: isMain ? r6(sc.c.gy / ky) : r6(gus.reduce((s, g) => s + g.lat, 0) / gus.length),
      lng: isMain ? r6(sc.c.gx / kx) : r6(gus.reduce((s, g) => s + g.lng, 0) / gus.length),
      area: isMain ? r1(sc.c.A / 1e6) : r1(gus.reduce((s, g) => s + g.area, 0)),
      dongCount: gus.reduce((s, g) => s + g.dongCount, 0),
      spotCount: gus.reduce((s, g) => s + g.spotCount, 0),
      ruralCount: gus.reduce((s, g) => s + g.ruralCount, 0),
      eupCount: gus.reduce((s, g) => s + g.eupCount, 0),
      myeonCount: gus.reduce((s, g) => s + g.myeonCount, 0),
      v: st.v, a: st.a, b: st.b, x: st.x, cls: api.classify(st, 'sido'),
      clsCount: cnt, avgA: avg((x) => x.a), avgB: avg((x) => x.b),
      hiName: hi.name, hiV: hi.a, loName: lo.name, loV: lo.a, hiSlug: hi.slug, loSlug: lo.slug,
      unitKind: isMain ? '동' : '시군구',
      gu: gus,
    });
  }

  const qs = (arr) => { const t = arr.slice().sort((x, y) => x - y); const at = (p) => t[Math.min(t.length - 1, Math.floor(t.length * p))]; return { min: t[0], p10: at(0.1), p25: at(0.25), mid: at(0.5), p75: at(0.75), p90: at(0.9), max: t[t.length - 1] }; };
  const aq = qs(spotAll.map((s) => s.a)), bq = qs(spotAll.map((s) => s.b));
  const cntAll = {};
  for (const s of spotAll) cntAll[s.cls] = (cntAll[s.cls] || 0) + 1;
  const topBy = (key, dir) => spotAll.slice().sort((x, y) => dir * (y[key] - x[key]) || byName(x, y))[0].name;
  const out = {
    version: VERSION,
    source: api.META.source,
    built: new Date().toISOString().slice(0, 10),
    axis: api.META.axis,
    method: api.META.method,
    coverageFrom: api.META.coverageFrom,
    params: api.META.params,
    classes: api.CLASSES,
    counts: {
      sido: sido.length,
      sidoMain: sido.filter((s) => s.main).length,
      gu: guAll.length,
      guMain: guAll.filter((g) => g.main).length,
      spot: spotAll.length,
      rural: guAll.reduce((s, g) => s + g.ruralCount, 0),
      eup: guAll.reduce((s, g) => s + g.eupCount, 0),
      myeon: guAll.reduce((s, g) => s + g.myeonCount, 0),
      admin: guAll.reduce((s, g) => s + g.dongCount, 0),
      aq, bq,
      hiName: topBy('a', 1), loName: topBy('a', -1), bHiName: topBy('b', 1), bLoName: topBy('b', -1),
      clsCount: api.CLASSES.map((q) => cntAll[q] || 0),
      featAll: geo.features.length,
      extra: typeof api.extraCounts === 'function' ? api.extraCounts(spotAll, guAll) : null,
    },
    sido,
  };
  fs.writeFileSync(OUT, JSON.stringify(out));
  const C = out.counts;
  console.log(`시도 ${C.sido}(메인 ${C.sidoMain}) · 시군구 ${C.gu}(메인 ${C.guMain}) · 거점(동) ${C.spot} · 이름만 ${C.rural}(읍 ${C.eup}·면 ${C.myeon})`);
  console.log('a 분포', JSON.stringify(aq), '\nb 분포', JSON.stringify(bq));
  console.log(`a 최고 ${C.hiName} · 최저 ${C.loName} · b 최고 ${C.bHiName} · b 최저 ${C.bLoName}`);
  console.log(`갈래 ${api.CLASSES.map((q, i) => `${q} ${C.clsCount[i]}`).join(' · ')}`);
  for (const s of sido) console.log(`   ${s.main ? '■' : '□'} ${s.name.padEnd(3)} 시군구 ${String(s.gu.length).padStart(2)} · 동 ${String(s.spotCount).padStart(4)} · a ${s.a} · b ${s.b} · ${s.cls}`);
  if (C.extra) console.log('extra', JSON.stringify(C.extra));
}
