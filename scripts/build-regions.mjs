/**
 * 오아시스노트가 재는 값 — 북위 눈금.
 *   동 땅의 무게중심이 북위 몇 도에 놓였는지만 본다. 길이가 아니라 '자리'다.
 *   동        lat 북위(°, 소수 넷째 자리까지 저장하고 화면에는 둘째 자리) · gRank 시군구 안 북쪽부터 몇 번째 ·
 *             drop 시군구에서 가장 북쪽 동으로부터 남쪽으로 내려앉은 거리(km, 위도 차 × 111.2)
 *   시군구    소속 동(동이 없으면 읍·면) 무게중심의 평균 북위 · 최북단~최남단 폭(km) · 시도 안 북쪽부터 순위
 *   시도      소속 시군구 평균 북위의 평균과 그 폭(최북단 시군구~최남단 시군구, km)
 *   a  북위 × 10,000 (정수. 순서를 가르는 열쇠이고 클수록 북쪽)
 *   b  동은 drop × 10, 시군구는 폭 × 10 (정수. 100m 단위)
 *   x  { lat, drop|spread, n, ... }  — 아래 finish() 가 마저 채운다
 * 갈래 일곱 가지는 '시군구 안 북쪽 몫(위·가운데·아래 3등분)'과 '폭이 넓은가'로 나눈다.
 * 검산: 두 동이 위도 0.01° 차이면 drop 은 1.1km, 같은 위도면 0 이다(README 의 점검 표).
 */
import fs from 'node:fs';
import path from 'node:path';
import { run, centroidOf, r1 } from './geo-common.mjs';

const CLASSES = ['top', 'upw', 'upt', 'mid', 'lot', 'low', 'bot'];
const KM = 111.2;
const r4 = (v) => Math.round(v * 1e4) / 1e4;
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const WIDE = { spot: 6, gu: 10, sido: 60 };

function band(n, m, t, wide) {
  if (n < 2) return 'mid';
  if (m === 1) return 'top';
  if (m === n) return 'bot';
  if (t < 1 / 3) return wide ? 'upw' : 'upt';
  if (t < 2 / 3) return 'mid';
  return wide ? 'low' : 'lot';
}

const api = {
  CLASSES,
  META: {
    source: '경계 자료는 admdongkor 행정동 경계(CC BY 4.0)를 쓰고, 국가공간정보포털 원본을 이 저장소에서 다듬어 사용합니다.',
    axis: '북위 눈금 — 동 땅의 무게중심이 북위 몇 도에 놓였고, 같은 시군구 안에서 북쪽부터 몇 번째이며, 가장 북쪽 동에서 남쪽으로 몇 킬로미터 내려앉았는가',
    method: '행정동 경계에서 무게중심을 구해 위도로 되돌린 뒤 북위를 소수 둘째 자리까지 적습니다. 같은 시군구 동들의 북위를 큰 순서로 세워 몇 번째인지 매기고, 가장 북쪽 동과의 위도 차에 111.2km를 곱해 남쪽으로 내려앉은 거리를 냅니다. 시군구는 소속 동 무게중심의 평균 북위와 최북단에서 최남단까지의 폭, 시도는 소속 시군구 평균 북위의 평균과 폭으로 적습니다. 경도는 쓰지 않습니다.',
    coverageFrom: '동마다 쪽을 내는 곳은 서울·인천·경기·부산이고, 대전·대구·울산과 광주 광산구, 고른 시·군은 시군구 쪽 하나로 받습니다. 읍·면은 쪽 없이 시군구 목록에 이름만 올립니다.',
    params: { degreeKm: KM, decimals: 2, wideSpot: WIDE.spot, wideGu: WIDE.gu },
  },
  measureSpot(rec, { c }) {
    const lat = c.gy / rec.ky;
    const a = Math.round(lat * 1e4);
    return { v: [a, 0, 0], a, b: 0, x: { lat: r4(lat) } };
  },
  measureGu({ list }) {
    const dongs = list.filter((d) => d.kind === '동');
    const units = dongs.length ? dongs : list;
    const pts = [];
    for (const d of units) {
      const cc = centroidOf(d.rings);
      if (cc) pts.push({ name: d.name, lat: cc.gy / d.ky });
    }
    const lats = pts.map((p) => p.lat);
    const hi = pts.reduce((m, p) => (p.lat > m.lat ? p : m), pts[0]);
    const lo = pts.reduce((m, p) => (p.lat < m.lat ? p : m), pts[0]);
    const mid = mean(lats);
    const spread = (hi.lat - lo.lat) * KM;
    return {
      v: [Math.round(mid * 1e4), 0, 0], a: Math.round(mid * 1e4), b: Math.round(spread * 10),
      x: {
        lat: r4(mid), spread: r1(spread), n: pts.length, kind: dongs.length ? '동' : '읍·면',
        nName: hi.name, nLat: r4(hi.lat), sName: lo.name, sLat: r4(lo.lat),
        lats: lats.map((v) => Math.round(v * 1e3) / 1e3).sort((p, q) => q - p),
      },
    };
  },
  measureSido({ gus }) {
    const lats = gus.map((g) => g.x.lat);
    const hi = gus.reduce((m, g) => (g.x.lat > m.x.lat ? g : m), gus[0]);
    const lo = gus.reduce((m, g) => (g.x.lat < m.x.lat ? g : m), gus[0]);
    const mid = mean(lats);
    const spread = (hi.x.lat - lo.x.lat) * KM;
    return {
      v: [Math.round(mid * 1e4), 0, 0], a: Math.round(mid * 1e4), b: Math.round(spread * 10),
      x: {
        lat: r4(mid), spread: r1(spread), nGu: gus.length, nName: hi.name, nSlug: hi.slug, nLat: hi.x.lat,
        sName: lo.name, sSlug: lo.slug, sLat: lo.x.lat,
        lats: lats.map((v) => Math.round(v * 1e3) / 1e3).sort((p, q) => q - p),
      },
    };
  },
  classify() { return 'mid'; },
  kinDist: (g, o) => Math.abs(Math.log((g.x.spread + 1) / (o.x.spread + 1))) * 12 + Math.abs(g.x.lat - o.x.lat) * 3
    + Math.abs(g.x.n - o.x.n) * 0.15 + Math.abs(Math.log(g.area / o.area)) * 1.5,
  extraCounts() { return null; },
};

run(api);

/* ── 마무리 — 시군구·시도 맥락이 있어야 정해지는 값 ─────────────────────── */
const OUT = path.join(process.cwd(), 'data', 'regions.json');
const out = JSON.parse(fs.readFileSync(OUT, 'utf8'));
const byName = (p, q) => p.name.localeCompare(q.name, 'ko');
const tally = {};
const spotAll = [];
let widestGu = null;

for (const sd of out.sido) {
  /* 시군구: 시도 안 북쪽부터 순위, 갈래 */
  const gus = sd.gu.slice().sort((p, q) => q.a - p.a || byName(p, q));
  const top = gus[0].x.lat, bot = gus[gus.length - 1].x.lat, span = top - bot;
  gus.forEach((g, i) => {
    g.x.rank = i + 1; g.x.nGu = gus.length;
    g.x.drop = r1((top - g.x.lat) * KM);
    g.x.t = span > 0 ? (top - g.x.lat) / span : 0;
    g.x.wide = g.x.spread >= WIDE.gu;
    g.cls = band(gus.length, i + 1, g.x.t, g.x.wide);
    if (g.main && (!widestGu || g.x.spread > widestGu.x.spread)) widestGu = { ...g, sido: sd.name };
  });
  /* 동 */
  for (const g of sd.gu) {
    delete g.bHi; delete g.bHiSlug; delete g.bHiV; delete g.bLo; delete g.bLoSlug; delete g.bLoV;
    if (!g.spots.length) continue;
    const mx = Math.max(...g.spots.map((s) => s.lat)), mn = Math.min(...g.spots.map((s) => s.lat));
    const spread = r1((mx - mn) * KM);
    const wide = spread >= WIDE.spot;
    const cnt = {};
    for (const s of g.spots) {
      const drop = r1((mx - s.lat) * KM);
      const t = mx > mn ? (mx - s.lat) / (mx - mn) : 0;
      s.x = { lat: r4(s.lat), drop, spread, n: g.spots.length, t, wide };
      s.b = Math.round(drop * 10);
      s.cls = band(g.spots.length, s.gRank, t, wide);
      delete s.bRank;
      cnt[s.cls] = (cnt[s.cls] || 0) + 1;
      spotAll.push(s);
    }
    g.clsCount = cnt;
  }
  /* 시도 */
  const cnt = {};
  const units = sd.main ? sd.gu.flatMap((g) => g.spots) : sd.gu;
  for (const u of units) cnt[u.cls] = (cnt[u.cls] || 0) + 1;
  sd.clsCount = cnt;
  delete sd.avgB;
}
/* 시도끼리: 평균 북위 순서 */
{
  const ord = out.sido.slice().sort((p, q) => q.a - p.a || byName(p, q));
  const top = ord[0].x.lat, bot = ord[ord.length - 1].x.lat;
  ord.forEach((sd, i) => {
    sd.x.rank = i + 1; sd.x.nSido = ord.length;
    sd.x.t = top > bot ? (top - sd.x.lat) / (top - bot) : 0;
    sd.x.wide = sd.x.spread >= WIDE.sido;
    sd.cls = band(ord.length, i + 1, sd.x.t, sd.x.wide);
  });
}
/* 전국 차례(북쪽부터)와 통계 */
spotAll.slice().sort((p, q) => q.a - p.a || byName(p, q)).forEach((s, i) => { s.rank = i + 1; });
const lats = spotAll.map((s) => s.lat).sort((p, q) => p - q);
const north = spotAll.reduce((m, s) => (s.a > m.a ? s : m), spotAll[0]);
const south = spotAll.reduce((m, s) => (s.a < m.a ? s : m), spotAll[0]);
const owner = (s) => { for (const sd of out.sido) for (const g of sd.gu) if (g.spots.includes(s)) return { sido: sd.name, gu: g.name }; return {}; };
const cntAll = {};
for (const s of spotAll) cntAll[s.cls] = (cntAll[s.cls] || 0) + 1;
const C = out.counts;
delete C.bq; delete C.bHiName; delete C.bLoName; delete C.extra; delete C.aq;
C.clsCount = CLASSES.map((k) => cntAll[k] || 0);
C.lat = { max: north.lat, min: south.lat, mid: lats[Math.floor(lats.length / 2)] };
C.north = { name: north.name, lat: north.lat, ...owner(north) };
C.south = { name: south.name, lat: south.lat, ...owner(south) };
C.span = r1((north.lat - south.lat) * KM);
C.widestGu = widestGu ? { name: widestGu.name, sido: widestGu.sido, spread: widestGu.x.spread } : null;
C.mainGu = out.sido.filter((s) => s.main).reduce((t, s) => t + s.gu.length, 0);
fs.writeFileSync(OUT, JSON.stringify(out));
console.log(`북위 ${C.lat.min.toFixed(2)}~${C.lat.max.toFixed(2)} · 가장 북쪽 ${C.north.gu} ${C.north.name} · 가장 남쪽 ${C.south.gu} ${C.south.name} · 폭 ${C.span}km`);
console.log('갈래 분포', CLASSES.map((k, i) => `${k} ${C.clsCount[i]}`).join(' · '), '· 가장 넓은 시군구', JSON.stringify(C.widestGu));
const gcls = {};
for (const sd of out.sido) for (const g of sd.gu) gcls[g.cls] = (gcls[g.cls] || 0) + 1;
console.log('시군구 갈래', JSON.stringify(gcls));
