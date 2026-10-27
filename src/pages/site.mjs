import { layout, frame, callBox } from '../lib/html.mjs';
import { esc, hash, won, josa, shuffle } from '../lib/util.mjs';
import { title, desc, clampDesc } from '../lib/seo.mjs';
import * as S from '../lib/schema.mjs';
import * as B from '../lib/blocks.mjs';
import * as SK from '../lib/skin.mjs';
import * as T from '../content/copy.mjs';
import * as M from '../content/metric.mjs';
import { baseCtx } from './region.mjs';
import { POSTS, METHOD_SLUG } from '../content/posts.mjs';
import { P } from '../site.mjs';

const { at, hail, courseRoll, stepCards, stepSet, faqBlock, noticeBlock, postStrip, topicLinks, docTopics,
  siteLinks, longtail, themeCards, spotPool, notes } = B;
const { SEC } = T;
const dt = (ctx, key) => docTopics(ctx, key, at(hash(key, 'dt'), SEC.topicHead, 8), at(hash(key, 'dt'), SEC.topicSub, 3));
const dupGuNames = (regions) => { const c = new Map(); for (const r of regions) for (const g of r.gu) c.set(g.name, (c.get(g.name) || 0) + 1); return new Set([...c].filter(([, n]) => n > 1).map(([k]) => k)); };
const chip = (href, name, val) => `<li><a href="${href}"><span>${esc(name)}</span><b>${esc(val)}</b></a></li>`;
const crumbs2 = (siteUrl, name, path) => [{ name: T.crumb.home, url: `${siteUrl}/` }, { name, url: `${siteUrl}${path}` }];
const allSpots = (regions) => {
  const out = [];
  for (const r of regions) if (r.main) for (const g of r.gu) for (const s of g.spots) out.push({ r, g, s });
  return out;
};
const byNorth = (a, b) => b.s.a - a.s.a || a.s.name.localeCompare(b.s.name, 'ko');
/** 시도 안 시군구를 북쪽 순서로 — 동명 시군구는 시도 접두를 붙인다 */
const guRows = (r, dupGu) => r.gu.slice().sort((a, b) => b.a - a.a || a.name.localeCompare(b.name, 'ko')).map((g) => ({
  href: `/${r.slug}/${g.slug}/`, name: dupGu.has(g.name) ? `${r.name} ${g.name}` : g.name, seq: String(g.x.rank).padStart(2, '0'),
  a: 0, b: Math.max(3, Math.round(g.x.t * 100)), val: M.lat2(g.a),
}));

/* ── 첫 화면 ─────────────────────────────────────────────────── */
export function homePage(ctx) {
  const dupGu = dupGuNames(ctx.regions);
  const { cfg, siteUrl, courses, regions, counts, latestPosts } = ctx;
  const seed = 'home';
  const h = hash(seed, 'hm');
  const spots = allSpots(regions);
  const demo = spots.filter((x) => x.r.slug === 'seoul' && x.s.cls === 'mid' && x.g.spotCount >= 10).sort(byNorth)[0] || spots.slice().sort(byNorth)[Math.floor(spots.length / 5)];

  const hero = `<div class="${P}-door">
  <p class="${P}-door-sl">${esc(cfg.brand.slogan)}</p>
  <p class="${P}-door-p">안내 말씀드립니다. 이곳은 점포 없이 전화만 받고 알려 주신 주소로 관리사를 보내는 접수 창구입니다. 서울·인천·경기·부산은 동마다, 대전·대구·울산과 일부 시·군은 시군구마다 화면을 편성했고 화면마다 북위 눈금을 적어 두었습니다. 다음 순서는 가시는 곳 찾기입니다.</p>
  <p class="${P}-door-cta">${callBox(cfg, { size: 'l' })}</p>
  <dl class="${P}-door-f">
    <div><dt>전화 응대</dt><dd>${esc(cfg.hours)}</dd></div>
    <div><dt>정산</dt><dd>${esc(cfg.pay)}</dd></div>
    <div><dt>도착 기준</dt><dd>${esc(cfg.arrive)}</dd></div>
    <div><dt>편성 범위</dt><dd>시군구 ${counts.gu}곳과 동 ${counts.spot}곳</dd></div>
  </dl>
  <div class="${P}-door-fig"><p class="${P}-door-cap">견본 방송 · ${esc(demo.g.name)} ${esc(demo.s.name)}</p>${M.device(
    M.dial({ lats: demo.g.spots.map((u) => u.x.lat), cur: demo.s.x.lat, label: `${demo.s.name} 북위 ${M.lat2(demo.s.x.lat)}도 견본`, tag: '북위' }),
    '<p>견본을 읽어 드립니다. 왼쪽 끝이 북쪽이고 붉은 굵은 바늘이 이 동입니다. 가는 바늘은 같은 시군구의 다른 동이며, 눈금자의 숫자는 가장 북쪽 동에서 남쪽으로 내려온 킬로미터입니다.</p>')}</div>
</div>`;

  const shapes = M.CLS_ORDER.map((k, i) => {
    const hit = spots.filter((x) => x.s.cls === k).sort(byNorth);
    const show = hit.slice(0, 4);
    return `<tr><th scope="row">${M.classGlyph(k)}<b>${esc(M.clsName(k))}</b><em>${counts.clsCount[i]}곳</em></th><td><small>${esc(M.clsTalk(k))}</small><ol>${show.map((x) => `<li><a href="/${x.r.slug}/${x.g.slug}/${x.s.slug}/">${esc(x.g.name)} ${esc(x.s.name)}</a><b>${M.lat2(x.s.a)}</b></li>`).join('')}</ol></td></tr>`;
  }).join('\n');
  const shapeBlock = frame('shapes', '일곱 갈래와 견본 눈금', `<table class="${P}-sp"><tbody>${shapes}</tbody></table>${SK.note('왼쪽 그림은 갈래마다 붉은 바늘이 서는 자리의 견본이고, 오른쪽 숫자는 그 갈래에서 전국 가장 북쪽에 선 네 곳의 북위입니다. 갈래가 북쪽이라고 좋고 남쪽이라고 나쁜 것은 아닙니다.')}`,
    '갈래는 시군구 안 북쪽 몫과 북위 폭으로 나누었습니다.');

  const whyBlock = frame('why', '북위 하나만 재는 까닭', SK.lead([
    '안내 말씀드립니다. 지도로 동네를 찾을 때 동서보다 위아래 자리를 먼저 떠올리시는 분이 많습니다. 그래서 이 사이트는 동 땅의 무게중심이 북위 몇 도인지만 적습니다.',
    `전국에 편성된 동 ${counts.spot}곳의 북위는 ${M.lat2(counts.lat.min)}도에서 ${M.lat2(counts.lat.max)}도까지이고 가운데값은 ${M.lat2(counts.lat.mid)}도입니다. 가장 북쪽은 ${esc(counts.north.gu)} ${esc(counts.north.name)}, 가장 남쪽은 ${esc(counts.south.gu)} ${esc(counts.south.name)}이며 두 동 사이는 ${counts.span}km입니다.`,
    `행정동 경계 ${counts.featAll}개 전부에 같은 식을 적용했으며 다시 돌려도 값은 변하지 않습니다. 계산 순서는 <a href="/magazine/${METHOD_SLUG}/">이 북위 메모</a>에서 이어서 안내해 드립니다.`,
  ]), null);

  const order = regions.slice().sort((a, b) => b.a - a.a || a.name.localeCompare(b.name, 'ko'));
  const tuner = SK.tuner(order.map((r, i) => ({
    ch: `CH ${String(i + 1).padStart(2, '0')}`, name: r.name, lat: M.lat2(r.x.lat),
    html: `<p class="${P}-x"><a href="/${r.slug}/">${esc(r.name)} 전체 화면으로</a> · ${r.main ? `동 ${r.spotCount}곳` : `시군구 ${r.gu.length}곳`} · 평균 북위 ${M.lat2(r.x.lat)}도</p><details class="${P}-fold"${i === 0 ? ' open' : ''}><summary>${esc(r.name)} 시군구 ${r.gu.length}곳 열기</summary><ul class="${P}-tags">${r.gu.slice().sort((a, b) => b.a - a.a || a.name.localeCompare(b.name, 'ko')).map((g) => chip(`/${r.slug}/${g.slug}/`, dupGu.has(g.name) ? `${r.name} ${g.name}` : g.name, M.lat2(g.a))).join('')}</ul></details>`,
  })));
  const picker = frame('regions', '시도 다이얼로 지역 고르기', `${tuner}${SK.note('시도 평균 북위는 소속 시군구 평균 북위의 평균입니다. 채널 번호는 그 값이 높은 순서이며, <a href="/area/">지역 편성표 전체</a>도 따로 마련되어 있습니다.')}`,
    '다이얼에서 시도 하나를 고르시면 소속 시군구가 아래 칸에 나타납니다. 어디서 부르시든 금액과 접수 방식은 하나입니다.');

  const postBlock = frame('note', '전화 전에 확인하는 북위 메모', `${notes(latestPosts)}${SK.note('<a href="/magazine/">북위 메모 전체 목록</a>')}`,
    '체험담은 한 편도 싣지 않았고 통화 직전에 필요한 글만 모았습니다.');

  const { html: faqHtml, qa } = faqBlock(seed, baseCtx(cfg, courses, '지금 계신 곳'), 6);
  const deep = spots.map((x) => ({ label: `${x.g.name} ${x.s.name}`, href: `/${x.r.slug}/${x.g.slug}/${x.s.slug}/` }));
  const guList = [];
  for (const r of regions) for (const g of r.gu) guList.push({ label: `${r.name} ${g.name}`, href: `/${r.slug}/${g.slug}/` });
  const sidoCourse = [];
  for (const r of regions) for (const c of courses) sidoCourse.push({ label: `${r.name} ${c.ko}`, href: `/${r.slug}/course/${c.slug}/` });
  const steps = stepSet(seed);
  const topics = topicLinks([
    { label: '코스별로 안내', items: courses.map((c) => ({ label: c.ko, href: `/course/${c.slug}/` })), anchor: T.COURSE_ANCHOR },
    { label: '시도별 코스', items: sidoCourse, pick: 14, anchor: T.COURSE_ANCHOR },
    { label: '동 화면 바로 열기', items: deep, pick: 18, anchor: T.ANCHOR },
    { label: '시군구 화면', items: guList, pick: 16, anchor: T.ANCHOR },
    { label: T.TL.docs, items: T.DOC_LINKS },
  ], seed, at(h, SEC.topicHead, 8), at(h, SEC.topicSub, 3));
  const theme = themeCards({
    pool: spotPool(regions, { sidoLabel: true }), noun: T.noun.spot, seedKey: seed,
    heading: at(h, SEC.themeHead, 4), sub: at(h, SEC.themeSub, 5), cards: 6, per: 3,
  });

  const body = [
    hero, picker, whyBlock, courseRoll(courses, seed, '방문지', { full: true }), stepCards(seed), shapeBlock,
    hail(cfg, '지금 계신 곳', seed), faqHtml, postBlock, theme.html, noticeBlock(seed), topics,
  ].join('\n');

  return {
    path: '/',
    html: layout(ctx, {
      path: '/', title: title.home({ spot: counts.spot }), desc: clampDesc(desc.home()),
      h1: SK.h1(`${esc(cfg.brand.ko)} 출장마사지 홈타이`, `동 ${counts.spot}곳과 시군구 ${counts.gu}곳의 북위 눈금을 편성했습니다`),
      body, pageKind: 'home', crumbs: [{ name: T.crumb.home, url: `${siteUrl}/` }],
      jsonld: [
        S.service({ siteUrl, url: siteUrl + '/', cfg, name: `${cfg.brand.ko} 출장마사지 홈타이 방문`, desc: clampDesc(desc.home()), areaServed: { '@type': 'Country', name: '대한민국' }, courses }),
        S.itemList(`${siteUrl}/#sidolist`, '방문 시도', regions.map((r) => ({ name: r.name, url: `${siteUrl}/${r.slug}/` }))),
        S.itemList(`${siteUrl}/#themes`, '북위 눈금이 가까운 동 모음', theme.list.map((x) => ({ name: x.name, url: `${siteUrl}${x.href}` }))),
        S.faqPage(`${siteUrl}/`, qa),
        S.howTo(`${siteUrl}/`, '전화 한 통으로 방문을 부탁하는 다섯 순서', steps, cfg),
      ],
    }),
  };
}

/* ── 지역 편성표 ──────────────────────────────────────────────── */
export function areaHub(ctx) {
  const dupGu = dupGuNames(ctx.regions);
  const { cfg, siteUrl, regions, counts, courses } = ctx;
  const seed = 'area';
  const open = SK.lead([
    `안내 말씀드립니다. 시도마다 한 묶음으로 편성했습니다. 시군구 ${counts.gu}곳 밑으로 동 화면이 ${counts.spot}개 달려 있고, 읍 ${counts.eup}곳과 면 ${counts.myeon}곳은 이름만 올렸지만 접수 방식은 같습니다.`,
    '서울·인천·경기·부산에서는 시군구 화면을 지나면 동 화면이 이어집니다. 대전·대구·울산 같은 나머지 시도는 시군구에서 길이 끝나며 동 이름은 시군구 화면의 이름표로 안내합니다. 찾는 분이 많은 지역을 촘촘히 담은 편성입니다.',
  ]);
  const order = regions.slice().sort((a, b) => b.a - a.a || a.name.localeCompare(b.name, 'ko'));
  const blocks = order.map((r) => frame(`sd-${r.slug}`, `${r.name} ${r.main ? `동 ${r.spotCount}곳` : `시군구 ${r.gu.length}곳`}`,
    `<p class="${P}-x"><a href="/${r.slug}/">${esc(r.name)} 전체 화면으로</a></p>${SK.sched(guRows(r, dupGu))}`,
    r.main
      ? `${r.name}${josa(r.name, '은/는')} 시군구를 고른 뒤 동 이름으로 내려가는 두 단 편성이라고 알려 드립니다. 줄은 북쪽 순서이고 오른쪽 숫자는 그 시군구 바늘들의 평균 북위입니다.`
      : `${r.name} 편성은 시군구 화면에서 끝납니다. 행정동 ${r.dongCount}곳의 이름은 시군구 화면 아래쪽 이름표에 모아 두었습니다.`,
    `${r.name} 시군구 ${r.gu.length}줄 열기`)).join('\n');
  const { html: faqHtml, qa } = faqBlock(seed, baseCtx(cfg, courses, '계신 곳'), 4);
  const body = [open, blocks, hail(cfg, '계신 곳', seed), faqHtml, stepCards(seed), postStrip(seed)].join('\n');
  const t = title.areaHub(counts), d = clampDesc(desc.areaHub(counts));
  return {
    path: '/area/',
    html: layout(ctx, {
      path: '/area/', title: t, desc: d,
      h1: SK.h1('지역 편성표', `시군구 ${counts.gu}곳을 시도별로 묶어 북쪽 순서로 세웠습니다`),
      body, pageKind: 'areahub', crumbs: crumbs2(siteUrl, T.crumb.area, '/area/'),
      jsonld: [
        S.collectionPage({ url: `${siteUrl}/area/`, siteUrl, title: t, desc: d, listId: `${siteUrl}/area/#list` }),
        S.itemList(`${siteUrl}/area/#list`, '방문 시도', regions.map((r) => ({ name: r.name, url: `${siteUrl}/${r.slug}/` }))),
        S.service({ siteUrl, url: `${siteUrl}/area/`, cfg, name: `${cfg.brand.ko} 지역 편성표`, desc: d, areaServed: { '@type': 'Country', name: '대한민국' } }),
        S.faqPage(`${siteUrl}/area/`, qa),
        S.howTo(`${siteUrl}/area/`, '계신 곳에서 방문을 부탁하는 다섯 순서', stepSet(seed), cfg),
      ],
    }),
  };
}

/* ── 코스 편성 ────────────────────────────────────────────────── */
export function courseHub(ctx) {
  const { cfg, siteUrl, courses, regions } = ctx;
  const seed = 'coursehub';
  const byPrice = courses.slice().sort((a, b) => a.price - b.price);
  const byLen = courses.slice().sort((a, b) => a.min - b.min);
  const shortest = byLen[0], longest = byLen[byLen.length - 1];
  const open = SK.lead([
    '안내 말씀드립니다. 코스는 아홉 가지입니다. 고르는 기준은 시간, 압, 오일 사용 여부 세 가지이고 나머지 취향은 통화에서 맞추어 드립니다.',
    `소요 시간 순서로 늘어놓으면 첫 프로그램은 ${shortest.min}분 ${esc(shortest.ko)}, 마지막 프로그램은 ${longest.min}분 ${esc(longest.ko)}입니다. 길다고 이완이 깊어지거나 값이 높다고 몸에 맞는 것은 아니므로 그날의 몸 상태를 기준으로 안내해 드립니다.`,
  ]);
  const stubs = courseRoll(byLen, seed, '방문지', { full: true });
  const pickBy = frame('bycase', '몸 상태별 코스 안내', SK.cases(courses), '고르신 뒤에 마음이 바뀌셔도 되며 계산은 최종으로 정한 코스를 따릅니다.');
  const { html: faqHtml, qa } = faqBlock(seed, baseCtx(cfg, courses, '계신 곳'), 4);
  const pool = [];
  for (const r of regions) for (const c of courses) pool.push({ label: `${r.name} ${c.ko}`, href: `/${r.slug}/course/${c.slug}/` });
  const body = [open, stubs, pickBy, faqHtml, hail(cfg, '코스 문의', seed), longtail(pool, seed, 24, '시도별 코스', null), postStrip(seed)].join('\n');
  const t = title.page(`코스 ${courses.length}종 출장마사지 홈타이`);
  const d = clampDesc(`출장마사지 홈타이 코스 ${courses.length}종의 시간과 압, 오일 여부를 한 표에 모았습니다. ${won(byPrice[0].price)}원부터이고 지역이 달라도 금액은 같습니다.`);
  return {
    path: '/course/',
    html: layout(ctx, {
      path: '/course/', title: t, desc: d,
      h1: SK.h1('코스 편성', '짧은 코스부터 긴 코스까지 아홉 프로그램을 늘어놓았습니다'),
      body, pageKind: 'coursehub', crumbs: crumbs2(siteUrl, T.crumb.course, '/course/'),
      jsonld: [
        S.collectionPage({ url: `${siteUrl}/course/`, siteUrl, title: t, desc: d, listId: `${siteUrl}/course/#list` }),
        S.itemList(`${siteUrl}/course/#list`, '코스', courses.map((c) => ({ name: c.ko, url: `${siteUrl}/course/${c.slug}/` }))),
        S.aggregateOffer(`${siteUrl}/course/`, courses, cfg),
        S.service({ siteUrl, url: `${siteUrl}/course/`, cfg, name: `${cfg.brand.ko} 코스 편성`, desc: d, areaServed: { '@type': 'Country', name: '대한민국' }, courses }),
        S.faqPage(`${siteUrl}/course/`, qa),
      ],
    }),
  };
}

/* ── 요금 안내 ────────────────────────────────────────────────── */
export function pricePage(ctx) {
  const { cfg, siteUrl, courses } = ctx;
  const seed = 'price';
  const sorted = courses.slice().sort((a, b) => a.price - b.price);
  const top = sorted[sorted.length - 1].price;
  const open = SK.lead([
    '요금 안내를 시작하겠습니다. 코스마다 값은 하나씩만 정해져 있으며, 표에 없는 이름의 요금을 요구받으시면 응하지 않으셔도 됩니다.',
    '골목 안쪽이든 먼 마을이든 같은 코스에는 같은 금액이 적용됩니다. 오가는 수고는 저희 몫이므로 계산에서 따로 따지지 않습니다.',
  ]);
  const ladder = frame('tbl', '금액이 낮은 코스부터 안내', `${SK.ladder(sorted, top)}${SK.note('금액 안내입니다. 줄 끝의 숫자가 코스 금액이고, 시간과 압에 대한 풀이는 각 코스 화면에서 이어서 안내해 드립니다.')}`,
    '시간이 길어진다는 이유로 값을 얹는 방식은 쓰지 않습니다. 정해진 코스는 약속한 시간을 끝까지 채우고 마칩니다.');
  const noExtra = frame('nox', '금액에 붙지 않는 항목', SK.ck([
    '멀리 간다는 이유의 교통비', '자정을 넘긴 시간대 할증', '명절과 공휴일 가산', '예약금·보증금 등 먼저 내는 돈', '시각 변경과 접수 철회 수수료', '주차 요금',
  ], true), '선입금을 요구하는 문자나 전화는 저희가 보낸 것이 아니라고 알려 드립니다.');
  const pay = frame('how', '계산 방법 안내', SK.stat([
    ['시점', '관리가 끝난 그 자리'], ['수단', '현금과 카드 모두 가능'], ['영수증', '요청하시는 즉시 발급'],
    ['시간을 늘릴 때', '접수 때 말씀해 주시면 늘린 시간분만 더합니다'], ['둘이 함께 받을 때', '두 분이 함께 받으시면 코스 값을 각각 더하고 동반 할인은 적용하지 않습니다'],
  ]), null);
  const { html: faqHtml, qa } = faqBlock(seed, baseCtx(cfg, courses, '계신 곳'), 4);
  const d = clampDesc(`코스별 시간과 금액을 한 장에 적었습니다. ${won(sorted[0].price)}원부터이고 교통비, 심야 할증, 예약금 없이 관리 후 현금이나 카드로 냅니다.`);
  const body = [open, ladder, noExtra, pay, faqHtml, hail(cfg, '금액 문의', seed), postStrip(seed), dt(ctx, seed), siteLinks(ctx, seed)].join('\n');
  return {
    path: '/price/',
    html: layout(ctx, {
      path: '/price/', title: title.page(`요금 안내 ${won(sorted[0].price)}원부터`), desc: d,
      h1: SK.h1('요금 안내', `금액은 ${won(sorted[0].price)}원부터 ${won(top)}원까지 아홉 가지입니다`),
      body, pageKind: 'price', crumbs: crumbs2(siteUrl, T.crumb.price, '/price/'),
      jsonld: [
        S.aggregateOffer(`${siteUrl}/price/`, courses, cfg),
        S.service({ siteUrl, url: `${siteUrl}/price/`, cfg, name: `${cfg.brand.ko} 코스 요금 안내`, desc: d, areaServed: { '@type': 'Country', name: '대한민국' }, courses }),
        S.faqPage(`${siteUrl}/price/`, qa),
      ],
    }),
  };
}

/* ── 이용 순서 ────────────────────────────────────────────────── */
export function guidePage(ctx) {
  const { cfg, siteUrl, courses } = ctx;
  const seed = 'guide';
  const open = SK.lead(['처음 전화하시는 분께 안내해 드립니다. 막히기 쉬운 대목을 골라 항목으로 만들었으며, 접수는 전화 한 번으로 끝나므로 끝까지 읽지 않으셔도 괜찮습니다.']);
  const what = frame('need', '방에 갖춰 둘 것', `${SK.ck([
    '누우실 자리 하나: 침대도 바닥도 괜찮습니다', '수건 두 장: 마른 손 코스에는 한 장이면 충분합니다', '문이 닫히는 방 한 칸: 가족이 계셔도 진행에 지장이 없습니다',
  ])}${SK.note('매트·오일·향초는 관리사의 짐에 들어 있으므로 따로 마련하실 물건은 없습니다.')}`, null);
  const timing = frame('when', '전화 응대 시간 안내', SK.stat([
    ['응대 시간', `${esc(cfg.hours)}<small>자정 이후에도 같은 번호로 연결됩니다</small>`],
    ['도착 기준', `${esc(cfg.arrive)}<small>골목 깊숙한 집은 몇 분 더 걸릴 수 있습니다</small>`],
    ['시각을 옮길 때', '출발 전이면 횟수와 관계없이 무료로 바꾸어 드립니다'],
    ['접수를 거둘 때', '관리사가 이미 현관 앞에 와 있다면 그 사실만 알려 주시면 됩니다'],
    ['전화가 몰리는 때', '금요일 심야와 일요일 해 질 녘'],
    ['비교적 한산한 때', '평일 낮에는 통화가 끝나는 즉시 출발하는 경우가 많습니다'],
  ]), null);
  const refuse = frame('no', '접수가 어려운 경우', SK.ck([
    '음란한 말이 나오는 즉시 통화를 끊고 접수를 취소합니다', '몸에 열이 오르거나 상처가 부어 있다면 날짜를 바꾸어 드립니다', '호수를 알 수 없는 주소에는 방문할 수 없습니다',
    '관리사의 개인 번호를 묻는 요청에는 응하지 않습니다', '진료가 먼저인 통증은 병원 방문을 우선 안내합니다', '만 19세에 이르지 않은 분은 사정과 무관하게 접수하지 않습니다',
  ], true), '통화 후 접수가 성립하지 않았다면 청구하는 비용은 없습니다.');
  const { html: faqHtml, qa } = faqBlock(seed, baseCtx(cfg, courses, '방문지'), 6);
  const d = clampDesc('처음 전화하시는 분을 위해 준비물, 응대 시간, 접수를 받지 못하는 경우, 계산 방법을 순서대로 안내합니다.');
  const body = [open, what, timing, stepCards(seed), refuse, faqHtml, hail(cfg, '첫 이용', seed), noticeBlock(seed), postStrip(seed), dt(ctx, seed), siteLinks(ctx, seed)].join('\n');
  return {
    path: '/guide/',
    html: layout(ctx, {
      path: '/guide/', title: title.page('처음 이용하는 분을 위한 이용 순서'), desc: d,
      h1: SK.h1('이용 순서', '전화 한 통이 접수의 전부입니다'),
      body, pageKind: 'guide', crumbs: crumbs2(siteUrl, T.crumb.guide, '/guide/'),
      jsonld: [
        S.howTo(`${siteUrl}/guide/`, '처음 이용할 때 거치는 다섯 순서', stepSet(seed), cfg),
        S.service({ siteUrl, url: `${siteUrl}/guide/`, cfg, name: `${cfg.brand.ko} 이용 순서`, desc: d, areaServed: { '@type': 'Country', name: '대한민국' } }),
        S.faqPage(`${siteUrl}/guide/`, qa),
      ],
    }),
  };
}

/* ── 소개 ────────────────────────────────────────────────────── */
export function companyPage(ctx) {
  const { cfg, siteUrl, counts, data } = ctx;
  const seed = 'company';
  const classLine = M.CLS_ORDER.map((k, i) => `${M.clsName(k)} ${counts.clsCount[i]}곳`).join(' · ');
  const open = SK.lead([
    `${esc(cfg.brand.ko)}(${esc(cfg.brand.en)}) 소개를 시작하겠습니다. 이곳은 점포 없이 방문으로만 일하며, 여러 업소를 줄 세워 고르게 하는 목록이 아니라 전화를 받는 사람과 찾아가는 사람이 한 팀으로 움직이는 곳입니다.`,
    '이름의 오아시스는 쉬어 가는 자리를, 노트는 그 자리를 적어 두는 기록을 뜻합니다. 화면마다 적힌 북위 눈금은 자리를 빨리 가늠하도록 돕는 장치이며, 계산해서 얻은 숫자만 싣겠다는 원칙의 다른 표현이기도 합니다.',
  ]);
  const line = frame('line', '하는 일과 하지 않는 일', SK.ck([
    '하는 일: 방문해서 굳은 근육을 손과 팔로 풀어 드리는 관리 한 가지', '하지 않는 일: 성적인 서비스(표현을 바꾸어 요청하셔도 같습니다)', '하지 않는 일: 병명을 단정하거나 치유를 약속하는 일이며 진단과 치료는 병원의 몫입니다',
    '접수 제외 연령: 만 19세 미만', '싣지 않는 것: 후기와 별점(작성자를 확인할 길이 없기 때문입니다)', '싣지 않는 것: 사람 사진(실제 방문하는 사람과 달라질 수 있기 때문입니다)', '받지 않는 돈: 관리사가 오기 전에 미리 입금하라는 요구 일체',
  ]), null);
  const how = frame('data', '북위를 읽은 순서', `${SK.lead([
    `다음 순서는 계산 안내입니다. 공개된 행정동 경계 ${counts.featAll}개에서 무게중심을 구하고, 그 점을 위도로 되돌려 소수 둘째 자리까지 적었습니다. 경도는 쓰지 않았습니다.`,
    '같은 시군구의 동을 북위가 높은 순으로 세워 북쪽부터 몇 번째인지 매겼고, 가장 북쪽 동과의 위도 차에 111.2km를 곱해 남쪽으로 내려앉은 거리를 냈습니다. 시군구는 소속 동 무게중심의 평균 북위와 최북단에서 최남단까지의 폭, 시도는 시군구 평균 북위의 평균과 폭으로 적었습니다.',
    `갈래는 일곱 가지이고 ${esc(classLine)}입니다. 전국에서 가장 북쪽 동은 ${esc(counts.north.name)}(북위 ${M.lat2(counts.lat.max)}도), 가장 남쪽 동은 ${esc(counts.south.name)}(북위 ${M.lat2(counts.lat.min)}도)입니다.`,
    '이 수치는 지도 위 위도에서만 나왔으며 도로 사정이나 이동 시간과 무관합니다. 경계 자료를 단순화한 탓에 실제 선과 조금 어긋날 수 있다는 점도 알려 드립니다.',
  ])}${SK.stat([
    ['자료 판본', esc(data.version)],
    ['계산 방식', '무게중심의 위도를 소수 둘째 자리로 적고 위도 차에 111.2km를 곱해 거리를 구함'],
    ['남긴 값', '북위, 북쪽부터의 순서, 가장 북쪽 동에서 내려앉은 거리, 시군구의 평균 북위와 폭'],
    ['표기 단위', '북위 소수 둘째 자리, 거리 100m'],
    ['화면 구조', `시도 ${counts.sido}개 아래 시군구 ${counts.gu}개, 그 아래 동 ${counts.spot}개`],
    ['이름만 올린 곳', `읍 ${counts.eup}곳과 면 ${counts.myeon}곳<small>이름은 소속 시군구 화면의 이름표에 적어 두었습니다</small>`],
    ['전국에서 가장 북쪽인 동', `${esc(counts.north.gu)} ${esc(counts.north.name)}`],
    ['전국에서 가장 남쪽인 동', `${esc(counts.south.gu)} ${esc(counts.south.name)}`],
  ])}`, null);
  const d = clampDesc(`${cfg.brand.ko}가 하는 일과 하지 않는 일, 지역 화면의 북위 눈금을 어떤 자료와 순서로 얻었는지 밝혔습니다.`);
  const body = [open, line, how, hail(cfg, '문의', seed), postStrip(seed), dt(ctx, seed), siteLinks(ctx, seed)].join('\n');
  return {
    path: '/company/',
    html: layout(ctx, {
      path: '/company/', title: title.page(`${cfg.brand.ko} 소개`), desc: d,
      h1: SK.h1(`${esc(cfg.brand.ko)} 소개`, '지키는 선과 북위를 읽은 순서'),
      body, pageKind: 'company', crumbs: crumbs2(siteUrl, T.crumb.company, '/company/'),
      jsonld: [S.aboutPage({ url: `${siteUrl}/company/`, siteUrl, title: title.page(`${cfg.brand.ko} 소개`), desc: d })],
    }),
  };
}

/* ── 이용 약관 ───────────────────────────────────────────────── */
const TERMS = (b) => [
  ['제1조 (목적)', `이 약관은 ${b}(이하 "회사")가 이용자가 알려 준 장소로 관리사를 보내 관리를 제공할 때의 조건과 절차, 양쪽의 책임을 분명히 하기 위해 정했습니다.`],
  ['제2조 (접수가 성립하는 때)', '화면에 적힌 번호로 통화가 연결되고 코스·주소·방문 시각이 서로 확인되는 순간 접수가 성립합니다. 접수로 인정하는 방법은 전화 통화 하나이며 글, 메일, 채팅으로 들어온 요청은 포함하지 않습니다.'],
  ['제3조 (관리의 범위)', '관리사는 이용자가 알려 준 장소를 찾아가 손으로 굳은 근육을 풀어 드립니다. 의료 행위로 분류되는 진단·치료와 성적인 행위는 어떤 경우에도 하지 않습니다.'],
  ['제4조 (이용 연령)', '만 19세 이상만 이용하실 수 있으며, 만 19세 미만은 보호자가 동석해도 접수하지 않습니다.'],
  ['제5조 (화면의 숫자)', '화면에 적힌 북위, 북쪽부터의 순서, 내려앉은 거리, 북위 폭과 갈래 이름은 공개된 행정동 경계 좌표를 계산해 얻은 값입니다. 이 수치는 이동 시간이나 도로 사정을 보증하지 않으며 위치를 가늠하는 참고 자료로만 제공합니다.'],
  ['제6조 (금액과 계산 방법)', '금액은 요금 안내에 적힌 대로이며 지역에 따라 달라지지 않습니다. 대금은 관리가 끝난 자리에서 현금이나 카드로 치르며, 예약금·보증금 등 먼저 내는 돈은 명목을 가리지 않고 받지 않습니다.'],
  ['제7조 (시각 변경과 접수 철회)', '관리사가 출발하기 전에 시각을 바꾸시거나 접수를 취소하셔도 위약금은 없습니다. 이미 문 앞에 도착한 경우에는 즉시 알려야 합니다.'],
  ['제8조 (거절과 중단 사유)', '다음 각 호에 해당하면 접수를 거절하거나 진행 중인 관리를 중단합니다. 1호는 성적인 행위를 요구하는 경우입니다. 2호는 관리사에게 욕설이나 폭력을 쓰거나 사적인 연락처를 계속 캐묻는 경우입니다. 3호는 찾아갈 호수를 끝까지 알려 주지 않는 경우입니다. 4호는 열이나 덜 아문 상처 때문에 관리가 무리인 경우입니다.'],
  ['제9조 (이용자가 준비할 사항)', '이용자는 누우실 자리와 수건을 갖추고, 관리에 영향을 주는 건강 상태를 통화에서 미리 밝혀야 합니다. 멍이 쉽게 드는 체질이라면 경락 코스를 확정하기 전에 통화에서 밝혀야 합니다.'],
  ['제10조 (후기·별점 칸이 없음)', '후기를 쓰는 칸과 별점을 매기는 칸은 이 사이트에 마련되어 있지 않습니다. 화면의 글은 어느 이용자의 체험도 옮겨 적지 않았습니다.'],
  ['제11조 (진행 중 중단)', '이용자의 사정이나 건강 문제로 관리가 멈추면 경과한 시간만큼만 계산합니다. 시작 10분 이내에 멈추면 비용이 없고, 제8조 사유로 회사가 중단한 때에도 경과 시간은 계산에 포함합니다.'],
  ['제12조 (손해배상)', '관리 중에 회사 쪽 과실로 손해가 났다면 회사가 책임지고 배상합니다. 이용자가 알리지 않은 건강 상태로 생긴 손해와 천재지변·통신 장애로 인한 지연은 배상 범위에 들지 않습니다.'],
  ['제13조 (약관 변경)', '약관을 바꿀 때는 개정 내용을 화면에 먼저 올리고 올린 날부터 효력이 생깁니다. 게시 이후 접수한 분께는 개정 조항이 적용됩니다.'],
];
export function termsPage(ctx) {
  const { cfg, siteUrl } = ctx;
  const T_ = TERMS(cfg.brand.ko);
  const body = [
    SK.lead([`${esc(cfg.brand.ko)} 약관 전문을 차례로 안내합니다. 아래 조항은 접수 전화가 이어지는 시점부터 효력이 있습니다.`]),
    frame('terms', '약관 전문', SK.docs(T_), null),
    hail(cfg, '약관 문의', 'terms'), dt(ctx, 'terms'), siteLinks(ctx, 'terms'),
  ].join('\n');
  return {
    path: '/terms/',
    html: layout(ctx, {
      path: '/terms/', title: title.page('이용 약관'),
      desc: clampDesc(`${cfg.brand.ko} 출장 방문 관리의 이용 약관 전문입니다. 접수, 관리 범위, 금액과 계산 방법, 시각 변경을 ${T_.length}개 조문으로 정리했습니다.`),
      h1: SK.h1('이용 약관', `조문 ${T_.length}개 전문`),
      body, pageKind: 'terms', crumbs: crumbs2(siteUrl, T.crumb.terms, '/terms/'),
    }),
  };
}

const PRIVACY = [
  ['1. 받아 적는 항목', '접수 통화에서 적어 두는 것은 방문 주소, 연락 번호, 선택한 코스, 희망 시각의 네 가지입니다. 성함·생년월일·주민번호 같은 신상 항목은 묻지 않습니다.'],
  ['2. 쓰는 목적', '기록한 내용은 관리사를 정하고 출발과 도착을 알리는 일에만 사용하며, 방문이 끝난 이후 광고 문자나 먼저 거는 전화는 없습니다.'],
  ['3. 열람할 수 있는 사람', '접수로 알게 된 번호는 방문이 끝날 때까지 접수 담당과 배정된 관리사만 열람할 수 있습니다.'],
  ['4. 보관 기간', '탈 없이 마무리된 방문의 기록은 그날 지우고, 이의가 제기된 건에 한해 정리가 끝날 때까지 별도로 남겨 둡니다.'],
  ['5. 제3자 제공', '수집한 정보는 어느 업체에도 제공하거나 위탁하지 않습니다. 법령에 근거한 수사기관의 정식 요청이 있는 경우에만 예외입니다.'],
  ['6. 방문 기록과 쿠키', '이 사이트의 화면은 미리 만들어 둔 파일이며 방문 때마다 서버가 글을 지어 내지 않습니다. 회원 가입, 댓글, 장바구니가 없고 광고용 추적 코드, 방문 통계 도구, 쿠키는 일절 쓰지 않습니다.'],
  ['7. 이용자의 권리', '본인에 관해 회사가 가진 정보는 열람이나 삭제를 요청하실 수 있고, 화면의 번호로 전화하시면 즉시 처리합니다.'],
  ['8. 담당자', '운영자 표기가 정해지면 이 항목과 화면 맨 아래 줄에 함께 올리겠습니다. 그때까지의 문의는 화면의 번호로 받겠습니다.'],
];
export function privacyPage(ctx) {
  const { cfg, siteUrl } = ctx;
  const body = [
    SK.lead(['개인정보 처리방침을 안내합니다. 기록하는 정보가 네 가지뿐이라 방침도 짧습니다.']),
    frame('pp', '방침 전문', SK.docs(PRIVACY), null),
    hail(cfg, '개인정보 관련 문의', 'privacy'), dt(ctx, 'privacy'), siteLinks(ctx, 'privacy'),
  ].join('\n');
  return {
    path: '/privacy/',
    html: layout(ctx, {
      path: '/privacy/', title: title.page('개인정보 처리방침'),
      desc: clampDesc('접수 통화에서 받아 적는 항목과 쓰는 목적, 보관 기간을 정리했습니다. 쿠키와 추적 스크립트를 쓰지 않는 정적 사이트입니다.'),
      h1: SK.h1('개인정보 처리방침', '기록하는 정보는 네 가지'),
      body, pageKind: 'privacy', crumbs: crumbs2(siteUrl, T.crumb.privacy, '/privacy/'),
    }),
  };
}

/* ── 북위 메모 목록·글 ──────────────────────────────────────────── */
export function magazineIndex(ctx) {
  const { cfg, siteUrl } = ctx;
  const list = POSTS.slice().sort((a, b) => b.date.localeCompare(a.date));
  const body = [
    SK.lead(['북위 메모 목록을 안내합니다. 통화에서 되묻는 일을 줄여 주는 글만 골라 한곳에 모았으며, 소감이나 별점은 달지 않았습니다.']),
    frame('list', `북위 메모 ${list.length}편`, notes(list), '새 글은 RSS로도 내보냅니다.'),
    hail(cfg, '접수', 'magazine'), dt(ctx, 'magazine'), siteLinks(ctx, 'magazine'),
  ].join('\n');
  const t = title.page('북위 메모 글 모음');
  const d = clampDesc(`전화하기 전에 정해 두면 편한 사항을 ${list.length}편으로 적었습니다. 후기와 체험담은 두지 않았습니다.`);
  return {
    path: '/magazine/',
    html: layout(ctx, {
      path: '/magazine/', title: t, desc: d,
      h1: SK.h1('북위 메모', `읽을 글 ${list.length}편`),
      body, pageKind: 'magazine', crumbs: crumbs2(siteUrl, T.crumb.magazine, '/magazine/'),
      jsonld: [
        S.collectionPage({ url: `${siteUrl}/magazine/`, siteUrl, title: t, desc: d, listId: `${siteUrl}/magazine/#list` }),
        S.itemList(`${siteUrl}/magazine/#list`, '북위 메모', list.map((p) => ({ name: p.title, url: `${siteUrl}/magazine/${p.slug}/` }))),
      ],
    }),
  };
}

export function postPage(ctx, p) {
  const { cfg, siteUrl } = ctx;
  const path = `/magazine/${p.slug}/`;
  const url = `${siteUrl}${path}`;
  const html = p.body.map((b) => {
    if (typeof b === 'string') return `<p>${esc(b)}</p>`;
    if (b[0] === 'h3') return `<h2>${esc(b[1])}</h2>`;
    if (b[0] === 'ul') return `<ul>${b[1].map((x) => `<li>${esc(x)}</li>`).join('\n')}</ul>`;
    return '';
  }).join('\n');
  const at0 = POSTS.findIndex((x) => x.slug === p.slug);
  const others = POSTS.map((_, i) => POSTS[(at0 + 1 + i) % POSTS.length]).filter((x) => x.slug !== p.slug).slice(0, 4);
  const body = [
    SK.dated(p.date, `${cfg.brand.ko} 북위 메모`),
    SK.piece(html),
    hail(cfg, '접수', p.slug),
    frame('more', '이어서 읽을 북위 메모', notes(others), null),
    dt(ctx, p.slug), siteLinks(ctx, p.slug),
  ].join('\n');
  return {
    path,
    html: layout(ctx, {
      path, title: title.post(p), desc: clampDesc(desc.post(p)), h1: esc(p.title), body, pageKind: 'post',
      crumbs: [{ name: T.crumb.home, url: `${siteUrl}/` }, { name: T.crumb.magazine, url: `${siteUrl}/magazine/` }, { name: p.title, url }],
      jsonld: [S.article({ url, siteUrl, title: p.title, desc: p.summary, date: p.date, cfg })],
    }),
  };
}

export function notFound(ctx) {
  const { cfg, regions } = ctx;
  const sd = shuffle(regions, hash('404', 'sd'));
  const body = [
    SK.lead(['안내 말씀드립니다. 이 주소로는 편성된 화면이 확인되지 않습니다. 주소가 바뀌었거나 처음부터 없던 화면이므로 아래 목록에서 다시 골라 주시면 됩니다.']),
    frame('back', '처음 화면으로 돌아가기', SK.inl([
      { href: '/', text: '송출 첫 화면' }, { href: '/area/', text: '지역 편성표' }, { href: '/course/', text: '코스 편성' }, { href: '/price/', text: '요금 안내' }, { href: '/guide/', text: '이용 순서' },
      ...sd.map((r) => ({ href: `/${r.slug}/`, text: r.name })),
    ]), null),
    hail(cfg, '즉시 접수', '404'),
  ].join('\n');
  return {
    path: '/404.html',
    html: layout(ctx, {
      path: '/404.html', title: title.page('없는 주소'),
      desc: '이 주소로 만든 화면이 없습니다. 아래에서 다시 고르시면 됩니다.',
      h1: '없는 주소', body, noindex: true, pageKind: '404',
    }),
  };
}
