/**
 * 오아시스노트가 내놓는 값 — 북위 눈금.
 *   a  북위 × 10,000 (정수, 클수록 북쪽)
 *   b  동은 시군구 최북단 동으로부터 내려앉은 거리 × 10, 시군구는 폭 × 10
 *   x  동 { lat, drop(km), spread(소속 시군구 폭, km), n, t(0 북 ~ 1 남), wide }
 *      시군구 { lat(평균), spread(km), n, kind, nName, nLat, sName, sLat, lats[], rank, nGu, drop, t, wide }
 *      시도 { lat(소속 시군구 평균 북위의 평균), spread(km), nGu, nName, sName, lats[], rank, nSido }
 * 순서는 늘 북쪽이 앞이다. 거리는 위도 차에 111.2km 를 곱한 값이라 동서 방향은 전혀 들어가지 않는다.
 */
import { esc, hash } from '../lib/util.mjs';
import { stat } from '../lib/skin.mjs';
import { P } from '../site.mjs';

/** 북위 표기 — a(×10,000) 또는 도 단위 실수 어느 쪽이든 받는다. */
export const lat2 = (v) => (v > 1000 ? v / 1e4 : v).toFixed(2);
export const fl = lat2;
export const fa = (a) => `북위 ${lat2(a)}`;
export const fm = fa;
export const kmf = (v) => `${(Math.round(v * 10) / 10).toFixed(1)}km`;
/** 도·분 표기 — 37.55 → 37°33′ */
export const dm = (v) => { const d = Math.floor(v); return `${d}°${String(Math.round((v - d) * 60)).padStart(2, '0')}′`; };

export const CLS_ORDER = ['top', 'upw', 'upt', 'mid', 'lot', 'low', 'bot'];
export const CLS_NAME = {
  top: '맨 위 눈금', upw: '북쪽 넓은 구간', upt: '북쪽 좁은 구간', mid: '가운데 구간', lot: '남쪽 좁은 구간', low: '남쪽 넓은 구간', bot: '맨 아래 눈금',
};
export const clsName = (k) => CLS_NAME[k] || CLS_NAME.mid;
export const CLS_SHORT = {
  top: '가장 북쪽', upw: '북쪽 삼분의 일, 폭 넓음', upt: '북쪽 삼분의 일, 폭 좁음', mid: '가운데 삼분의 일', lot: '남쪽 삼분의 일, 폭 좁음', low: '남쪽 삼분의 일, 폭 넓음', bot: '가장 남쪽',
};
export const CLS_HEAD = {
  top: '맨 위 눈금을 차지한', upw: '북쪽 넓은 구간에 오른', upt: '북쪽 좁은 구간에 오른', mid: '가운데 구간에 놓인',
  lot: '남쪽 좁은 구간에 놓인', low: '남쪽 넓은 구간에 놓인', bot: '맨 아래 눈금에 내려앉은',
};
/** 갈래 풀이 — scope 는 '시군구'(동 기준) · '시도'(시군구 기준) */
export function clsTalk(k, scope = '시군구') {
  const w = scope === '시군구' ? 6 : 10;
  return {
    top: `${scope} 안에서 가장 북쪽 눈금을 차지하는 자리입니다`,
    upw: `${scope}를 북쪽에서 남쪽으로 삼등분했을 때 맨 위 구간에 들고, 폭이 ${w}km 이상인 ${scope}라 눈금 간격이 넓습니다`,
    upt: `${scope}를 북쪽에서 남쪽으로 삼등분했을 때 맨 위 구간에 들고, 폭이 ${w}km 미만인 ${scope}라 눈금 간격이 촘촘합니다`,
    mid: `${scope}를 삼등분했을 때 가운데 구간에 듭니다`,
    lot: `${scope}를 삼등분했을 때 맨 아래 구간에 들고, 폭이 ${w}km 미만인 ${scope}라 눈금 간격이 촘촘합니다`,
    low: `${scope}를 삼등분했을 때 맨 아래 구간에 들고, 폭이 ${w}km 이상인 ${scope}라 눈금 간격이 넓습니다`,
    bot: `${scope} 안에서 가장 남쪽 눈금에 내려앉은 자리입니다`,
  }[k] || '';
}
export const sideOf = (t) => (t < 1 / 3 ? '북쪽' : t < 2 / 3 ? '가운데' : '남쪽');

const baseCtx = (cfg, courses, place) => ({
  place, hours: cfg.hours, pay: cfg.pay, arrive: cfg.arrive, tel: cfg.tel, telLabel: cfg.telLabel,
  minPrice: `${new Intl.NumberFormat('ko-KR').format(Math.min(...courses.map((c) => c.price)))}원`,
});

export function spotCtx(ctx, sd, g, s) {
  const { cfg, courses, counts } = ctx;
  const x = s.x;
  const n = g.spotCount, m = s.gRank;
  const meanGap = (g.x.lat - s.x.lat) * 111.2;
  const solo = n === 1;
  return {
    ...baseCtx(cfg, courses, `${g.name} ${s.name}`),
    sd, g, s,
    nm: s.name, gu: g.name, sido: sd.name,
    lat: lat2(x.lat), dmLat: dm(x.lat), n, m, solo, topSpot: m === 1 && !solo, botSpot: m === n && !solo,
    drop: kmf(x.drop), dropV: x.drop, flat: x.drop < 0.05,
    spread: kmf(x.spread), spreadV: x.spread, wide: x.wide,
    rank: s.rank, allSpots: counts.spot, below: n - m, above: m - 1,
    north: g.hi, northSlug: g.hiSlug, northLat: lat2(g.hiV), south: g.lo, southSlug: g.loSlug, southLat: lat2(g.loV),
    guLat: lat2(g.x.lat), meanSide: meanGap > 0.05 ? '남쪽' : meanGap < -0.05 ? '북쪽' : '', meanGap: kmf(Math.abs(meanGap)),
    side: solo ? '가운데' : sideOf(x.t),
    clsN: clsName(s.cls), clsT: solo ? `${g.name}에는 동이 이곳 하나뿐이라 눈금을 가운데에 놓았습니다` : clsTalk(s.cls, '시군구'), clsK: s.cls,
    clsSame: (g.clsCount[s.cls] || 1) - 1,
    guRank: g.x.rank, nGu: sd.gu.length, sidoLat: lat2(sd.x.lat),
  };
}

export function guCtx(ctx, sd, g, mode) {
  const { cfg, courses } = ctx;
  const x = g.x;
  return {
    ...baseCtx(cfg, courses, `${sd.name} ${g.name}`),
    sido: sd.name, name: g.name, gu: g.name, mode, mainSite: g.main,
    unitN: mode === 'spot' ? g.spotCount : mode === 'rural' ? g.ruralCount : g.dongNames.length,
    spotCount: g.spotCount, dongCount: g.dongCount,
    ruralCount: g.ruralCount, eupCount: g.eupCount, myeonCount: g.myeonCount,
    lat: lat2(x.lat), dmLat: dm(x.lat), n: x.n, kind: x.kind, spread: kmf(x.spread), spreadV: x.spread, wide: x.wide,
    nName: x.nName, nLat: lat2(x.nLat), sName: x.sName, sLat: lat2(x.sLat), oneUnit: x.n === 1, flatGu: x.spread < 0.05,
    rank: x.rank, nGu: x.nGu, sidoLat: lat2(sd.x.lat), lone: x.nGu === 1,
    gapSido: kmf(Math.abs(x.lat - sd.x.lat) * 111.2), gapSide: x.lat - sd.x.lat > 0.0005 ? '북쪽' : x.lat - sd.x.lat < -0.0005 ? '남쪽' : '',
    dropGu: kmf(x.drop),
    clsN: clsName(g.cls), clsT: x.nGu === 1 ? `${sd.name}에서 다루는 시군구가 이곳 하나뿐이라 눈금을 가운데에 놓았습니다` : clsTalk(g.cls, '시도'),
    far: g.hi || '', farLat: g.hi ? lat2(g.hiV) : '', near: g.lo || '', nearLat: g.lo ? lat2(g.loV) : '', kinCount: g.kinCount,
  };
}

export function sidoCtx(ctx, sd) {
  const { cfg, courses } = ctx;
  const x = sd.x;
  return {
    ...baseCtx(cfg, courses, sd.name),
    name: sd.name, full: sd.full, guCount: sd.gu.length,
    spotCount: sd.spotCount, dongCount: sd.dongCount, ruralCount: sd.ruralCount,
    lat: lat2(x.lat), dmLat: dm(x.lat), spread: kmf(x.spread), spreadV: x.spread, rank: x.rank, nSido: x.nSido,
    nName: x.nName, nLat: lat2(x.nLat), sName: x.sName, sLat: lat2(x.sLat),
    topDong: sd.hiName, topDongLat: lat2(sd.hiV), lowDong: sd.loName, lowDongLat: lat2(sd.loV),
    clsN: clsName(sd.cls), single: sd.gu.length === 1,
  };
}

/* ── 라디오 다이얼 ────────────────────────────────────────────────
   왼쪽 끝이 북쪽, 오른쪽 끝이 남쪽이다. 가는 눈금은 같은 묶음의 다른 곳, 굵은 붉은 바늘이 지금 보는 곳이다.
   아래 눈금자는 맨 왼쪽(가장 북쪽)에서 남쪽으로 몇 km 내려왔는지를 센다. */
const STEPS = [0.5, 1, 2, 5, 10, 20, 50, 100];
export function dial({ lats, cur, mini = false, label = '', tag = '' }) {
  const all = lats.slice();
  if (cur != null) all.push(cur);
  const hi = Math.max(...all), lo = Math.min(...all);
  const W = mini ? 132 : 320, H = mini ? 40 : 108;
  const x0 = mini ? 8 : 20, x1 = W - x0;
  const spanKm = (hi - lo) * 111.2;
  const px = (v) => (hi === lo ? (x0 + x1) / 2 : x0 + ((hi - v) / (hi - lo)) * (x1 - x0));
  const base = mini ? 30 : 78;
  const parts = [`<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="${mini ? 5 : 8}" class="${P}-dl-glass"/>`, `<path d="M${x0} ${base}H${x1}" class="${P}-dl-axis"/>`];
  if (!mini && spanKm > 0) {
    const step = STEPS.find((s) => spanKm / s <= 9) || 100;
    for (let k = 0; k * step <= spanKm + 1e-9; k++) {
      const v = hi - (k * step) / 111.2;
      const tx = px(v);
      parts.push(`<path d="M${tx.toFixed(1)} ${base}v${k % 2 ? 6 : 9}" class="${P}-dl-tk"/>`);
      if (k % 2 === 0 || step >= 5) parts.push(`<text x="${tx.toFixed(1)}" y="${base + 21}" class="${P}-dl-n" text-anchor="middle">${k * step % 1 ? (k * step).toFixed(1) : k * step}</text>`);
    }
    parts.push(`<text x="${W - x0}" y="${H - 5}" class="${P}-dl-n" text-anchor="end">km ↓ 남쪽</text>`);
  }
  for (const v of lats) parts.push(`<path d="M${px(v).toFixed(1)} ${base - (mini ? 14 : 24)}V${base}" class="${P}-dl-nd"/>`);
  if (cur != null) {
    const cx = px(cur);
    parts.push(`<path d="M${cx.toFixed(1)} ${base - (mini ? 18 : 34)}V${base + (mini ? 4 : 6)}" class="${P}-dl-cur"/><path d="M${(cx - 4.5).toFixed(1)} ${base - (mini ? 22 : 40)}h9l-4.5 7z" class="${P}-dl-cap"/>`);
    if (!mini) {
      const anchor = cx < 70 ? 'start' : cx > W - 70 ? 'end' : 'middle';
      parts.push(`<text x="${cx.toFixed(1)}" y="${base - 46}" class="${P}-dl-v" text-anchor="${anchor}">${esc(tag ? `${tag} ` : '')}${lat2(cur)}</text>`);
    }
  }
  if (!mini) parts.push(`<text x="${x0}" y="15" class="${P}-dl-e">북 ${lat2(hi)}</text><text x="${W - x0}" y="15" class="${P}-dl-e" text-anchor="end">${lat2(lo)} 남</text>`);
  const aria = label || `북위 ${lat2(cur != null ? cur : hi)}도`;
  const svg = `<svg class="${P}-dl-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(aria)}">${parts.join('')}</svg>`;
  return mini ? `<span class="${P}-dl ${P}-dl-mini">${svg}</span>` : svg;
}
/** 갈래 견본 — 눈금 위 대표 바늘 자리만 그린다 */
export function classGlyph(k) {
  const at = { top: 0, upw: 0.17, upt: 0.2, mid: 0.5, lot: 0.8, low: 0.83, bot: 1 }[k];
  const W = 132, x0 = 8, x1 = W - 8, cx = x0 + at * (x1 - x0);
  const pins = [0, 0.3, 0.55, 0.78, 1].map((p) => `<path d="M${(x0 + p * (x1 - x0)).toFixed(1)} 14V30" class="${P}-dl-nd"/>`).join('');
  return `<span class="${P}-dl ${P}-dl-mini"><svg class="${P}-dl-svg" viewBox="0 0 ${W} 40" role="img" aria-label="${esc(clsName(k))} 견본"><rect x="1" y="1" width="${W - 2}" height="38" rx="5" class="${P}-dl-glass"/><path d="M${x0} 30H${x1}" class="${P}-dl-axis"/>${pins}<path d="M${cx.toFixed(1)} 8V34" class="${P}-dl-cur"/><path d="M${(cx - 4).toFixed(1)} 4h8l-4 6z" class="${P}-dl-cap"/></svg></span>`;
}
export function device(svg, cap) {
  return `<figure class="${P}-dl-fig">${svg}<figcaption>${cap}</figcaption></figure>`;
}

/* ── 사실 표 ─────────────────────────────────────────────────── */
const hashPick = (arr, s, k) => arr[parseInt(hash(s, k).substr(0, 3), 16) % arr.length];

export function spotFacts(ctx, sd, g, s, c) {
  const caps = [
    `${esc(s.name)}의 북위를 ${esc(g.name)} 동 ${c.n}곳의 눈금 위에 올린 그림입니다. 왼쪽 끝이 북쪽이고 붉은 굵은 바늘이 이 동입니다. 아래 숫자는 가장 북쪽 동에서 내려온 킬로미터입니다.`,
    `가는 바늘 하나가 동 하나입니다. 바늘이 몰린 곳은 동들이 같은 위도대에 모여 있다는 뜻이고, 붉은 바늘이 ${esc(s.name)}입니다.`,
    `눈금자의 0은 ${esc(g.name)}에서 가장 북쪽인 ${esc(c.north)}의 위치입니다. 붉은 바늘이 그 0에서 오른쪽으로 얼마나 떨어졌는지가 곧 남쪽으로 내려앉은 거리입니다.`,
    `이 그림에는 동서 방향이 들어 있지 않습니다. 같은 눈금에 선 바늘이라도 동쪽과 서쪽으로 멀리 떨어져 있을 수 있습니다.`,
  ];
  const cap = `<p>${c.solo ? `이 시군구에서 바늘은 하나뿐이고, 붉은 바늘이 ${esc(s.name)}입니다. 비교할 동이 없어 눈금자의 0도 이 동 자리에 놓았습니다.` : hashPick(caps, s.name, 'cap')}</p>`;
  const svg = dial({ lats: g.spots.map((u) => u.x.lat), cur: s.x.lat, label: `${s.name} 북위 ${c.lat}도, ${g.name} 동 ${c.n}곳 중 ${c.m}번째`, tag: '북위' });
  return device(svg, cap) + stat([
    ['소속', `<a href="/${sd.slug}/">${esc(sd.full)}</a> › <a href="/${sd.slug}/${g.slug}/">${esc(g.name)}</a>`],
    ['북위', `${c.lat}도<small>도·분으로 적으면 ${c.dmLat}입니다</small>`],
    ['북쪽부터 순서', c.solo ? `동 1곳 중 1번째<small>수록한 ${c.allSpots}곳 중에서는 북쪽부터 ${c.rank}번째입니다</small>` : `${esc(g.name)} 동 ${c.n}곳 중 ${c.m}번째<small>수록한 ${c.allSpots}곳 중에서는 북쪽부터 ${c.rank}번째입니다</small>`],
    ['북쪽 끝에서 내려앉은 거리', c.flat ? `0km<small>${c.solo ? '동이 하나뿐이라 기준이 자기 자신입니다' : c.topSpot ? '이 동이 기준점입니다' : '기준점과 같은 눈금입니다'}</small>` : `${c.drop}<small>기준점은 ${esc(c.north)}(북위 ${c.northLat}도)입니다</small>`],
    ['시군구 북위 폭', c.solo ? '0.0km<small>비교할 동이 없습니다</small>' : `${c.spread}<small>최북단 ${esc(c.north)}에서 최남단 ${esc(c.south)}까지입니다</small>`],
    ['시군구 평균 북위', `${c.guLat}도<small>${c.meanSide ? `이 동은 평균보다 ${c.meanGap} ${c.meanSide}에 놓입니다` : '이 동이 평균 눈금과 같은 자리에 놓입니다'}</small>`],
    ['구간', `${esc(c.clsN)}<small>${esc(CLS_SHORT[c.clsK] || '')}</small>`],
  ]);
}

export function guFacts(ctx, sd, g, mode, c) {
  const cap = `<p>${esc(g.name)}에 속한 ${c.kind} ${c.n}곳의 무게중심 북위를 눈금 한 줄에 올렸습니다. 가는 바늘은 ${c.kind} 하나이고 붉은 바늘은 그 평균 북위입니다.</p>`;
  const svg = dial({ lats: g.x.lats, cur: g.x.lat, label: `${g.name} 평균 북위 ${c.lat}도, ${c.kind} ${c.n}곳`, tag: '평균' });
  const rows = [
    ['속한 시도', `<a href="/${sd.slug}/">${esc(sd.full)}</a>`],
    ['행정동 전체', `${g.dongCount}구역`],
    mode === 'spot' ? ['쪽을 둔 동', `${g.spotCount}구역`]
      : mode === 'rural' ? ['동 화면', '없음<small>동이 없는 군이라 이 화면 하나로 받습니다</small>']
        : ['화면 깊이', '시군구에서 끝<small>동 이름은 같은 화면 아랫부분의 이름표에 모았습니다</small>'],
    ['이름만 올린 읍·면', g.ruralCount ? `${g.ruralCount}곳<small>${[g.eupCount ? `읍 ${g.eupCount}곳` : '', g.myeonCount ? `면 ${g.myeonCount}곳` : ''].filter(Boolean).join(', ')}은 화면을 두지 않고 이름만 올렸습니다</small>` : '없음'],
    ['평균 북위', `${c.lat}도<small>북위를 잰 대상은 ${c.kind} ${c.n}곳입니다</small>`],
    ['북위 폭', c.oneUnit ? '0.0km<small>잰 대상이 하나뿐입니다</small>' : `${c.spread}<small>최북단 ${esc(c.nName)}에서 최남단 ${esc(c.sName)}까지입니다</small>`],
    ['시도 안 순서', c.lone ? `${esc(sd.name)}에서 다루는 시군구 1곳 중 1번째` : `${esc(sd.name)} 시군구 ${c.nGu}곳 중 북쪽부터 ${c.rank}번째<small>${c.gapSide ? `${esc(sd.name)} 평균 북위보다 ${c.gapSido} ${c.gapSide}에 있습니다` : `${esc(sd.name)} 평균 북위와 같은 눈금입니다`}</small>`],
    ['구간', `${esc(c.clsN)}<small>${esc(c.clsT)}</small>`],
    ['폭이 비슷한 시군구', g.kin.length > 1 ? `${esc(g.kin[0].gu)} · ${esc(g.kin[1].gu)}<small>그 밖에 ${g.kinCount - 2}곳이 더 이어집니다</small>` : g.kin.length ? esc(g.kin[0].gu) : '없음'],
  ];
  if (mode === 'spot' && g.hi && g.spotCount > 1) {
    rows.splice(6, 0,
      ['가장 북쪽 동', `<a href="/${sd.slug}/${g.slug}/${g.hiSlug}/">${esc(g.hi)}</a><small>북위 ${lat2(g.hiV)}도</small>`],
      ['가장 남쪽 동', `<a href="/${sd.slug}/${g.slug}/${g.loSlug}/">${esc(g.lo)}</a><small>북위 ${lat2(g.loV)}도</small>`]);
  }
  return device(svg, cap) + stat(rows);
}

export function sidoDevice(sd) {
  const cap = `<p>${esc(sd.name)}에서 다루는 시군구 ${sd.gu.length}곳의 평균 북위를 눈금에 올렸습니다. 가는 바늘이 시군구 하나이고 붉은 바늘은 그 평균입니다.</p>`;
  return device(dial({ lats: sd.x.lats, cur: sd.x.lat, label: `${sd.name} 평균 북위 ${lat2(sd.x.lat)}도`, tag: '평균' }), cap);
}

export function sidoFacts(ctx, sd, c) {
  const gl = (nm, slug) => `<a href="/${sd.slug}/${slug}/">${esc(nm)}</a>`;
  const rows = [
    ['행정 명칭', esc(sd.full)],
    ['화면이 닿는 깊이', sd.main ? '동까지' : '시군구까지'],
    ['시군구', `${sd.gu.length}곳`],
    ['행정동 전체', `${sd.dongCount}구역`],
    sd.main ? ['쪽을 둔 동', `${sd.spotCount}구역`] : ['동 이름', '이름은 시군구 화면 안쪽 이름표로 안내합니다'],
    ['이름만 올린 읍·면', sd.ruralCount ? `${sd.ruralCount}곳<small>이름은 소속 시군구 화면의 이름표에 모았습니다</small>` : '없음'],
    ['평균 북위', `${c.lat}도<small>시군구 평균 북위의 평균이며 전국 ${c.nSido}개 시도 중 북쪽부터 ${c.rank}번째입니다</small>`],
    ['북위 폭', c.single ? '0.0km<small>시군구가 하나뿐입니다</small>' : `${c.spread}<small>시군구 평균 북위의 최북단에서 최남단까지입니다</small>`],
  ];
  if (!c.single) {
    rows.push(['가장 북쪽 시군구', `${gl(sd.x.nName, sd.x.nSlug)}<small>평균 북위 ${c.nLat}도</small>`]);
    rows.push(['가장 남쪽 시군구', `${gl(sd.x.sName, sd.x.sSlug)}<small>평균 북위 ${c.sLat}도</small>`]);
  }
  if (sd.main) rows.push(['가장 북쪽 동', `<a href="/${sd.slug}/${sd.gu.find((g) => g.spots.some((s) => s.name === sd.hiName && s.slug === sd.hiSlug)).slug}/${sd.hiSlug}/">${esc(sd.hiName)}</a><small>북위 ${c.topDongLat}도</small>`]);
  return sidoDevice(sd) + stat(rows);
}

/* ── 고르기·묶기 ─────────────────────────────────────────────── */
export const chip = (u) => lat2(u.a);
export const near = (s, o) => (o.cls === s.cls ? 0 : 1e12) + Math.abs(o.a - s.a);
export const themePrefer = (u) => [`c${u.cls}`];

const half = (u, lo, hi) => u.x.lat >= lo && u.x.lat < hi;
export function themeDefs(noun) {
  const asc = (a, b) => b.a - a.a;
  const defs = CLS_ORDER.map((k) => ({
    k: `c${k}`, t: `${CLS_HEAD[k]} ${noun}`, f: (u) => u.cls === k, sort: asc, m: (u) => `북위 ${lat2(u.a)}`,
  }));
  defs.push({ k: 'northmost', t: `전국에서 가장 북쪽에 놓인 ${noun}`, f: () => true, sort: asc, m: (u) => `북위 ${lat2(u.a)}` });
  defs.push({ k: 'southmost', t: `전국에서 가장 남쪽에 놓인 ${noun}`, f: () => true, sort: (a, b) => a.a - b.a, m: (u) => `북위 ${lat2(u.a)}` });
  defs.push({ k: 'deepdrop', t: `북쪽 끝에서 가장 멀리 내려앉은 ${noun}`, f: (u) => u.x.drop > 0, sort: (a, b) => b.x.drop - a.x.drop, m: (u) => `${kmf(u.x.drop)} 아래` });
  defs.push({ k: 'widest', t: `북위 폭이 가장 넓은 곳에 속한 ${noun}`, f: (u) => u.x.spread > 0, sort: (a, b) => b.x.spread - a.x.spread, m: (u) => `폭 ${kmf(u.x.spread)}` });
  defs.push({ k: 'tightest', t: `북위 폭이 가장 좁은 곳에 속한 ${noun}`, f: (u) => u.x.spread > 0, sort: (a, b) => a.x.spread - b.x.spread, m: (u) => `폭 ${kmf(u.x.spread)}` });
  defs.push({ k: 'b375', t: `북위 37.5도 위쪽에 놓인 ${noun}`, f: (u) => half(u, 37.5, 99), sort: asc, m: (u) => `북위 ${lat2(u.a)}` });
  defs.push({ k: 'b370', t: `북위 37.0도에서 37.5도 사이의 ${noun}`, f: (u) => half(u, 37, 37.5), sort: asc, m: (u) => `북위 ${lat2(u.a)}` });
  defs.push({ k: 'b36', t: `북위 36도대에 놓인 ${noun}`, f: (u) => half(u, 36, 37), sort: asc, m: (u) => `북위 ${lat2(u.a)}` });
  defs.push({ k: 'b35', t: `북위 35도대에 놓인 ${noun}`, f: (u) => half(u, 35, 36), sort: asc, m: (u) => `북위 ${lat2(u.a)}` });
  return defs;
}

export function pickUnits(sd) {
  if (sd.main) {
    const all = [];
    for (const g of sd.gu) for (const s of g.spots) all.push({ g, s });
    all.sort((a, b) => b.s.a - a.s.a || a.s.name.localeCompare(b.s.name, 'ko'));
    return all.slice(0, 18).map((x) => ({ href: `/${sd.slug}/${x.g.slug}/${x.s.slug}/`, name: `${x.g.name} ${x.s.name}`, val: lat2(x.s.a) }));
  }
  return sd.gu.slice().sort((a, b) => b.a - a.a || a.name.localeCompare(b.name, 'ko')).slice(0, 12)
    .map((g) => ({ href: `/${sd.slug}/${g.slug}/`, name: g.name, val: lat2(g.a) }));
}
