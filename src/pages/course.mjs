import { layout, frame } from '../lib/html.mjs';
import { esc, hash, won, josa, shuffle, guLabel } from '../lib/util.mjs';
import { title, desc, clampDesc } from '../lib/seo.mjs';
import * as S from '../lib/schema.mjs';
import * as B from '../lib/blocks.mjs';
import * as SK from '../lib/skin.mjs';
import * as T from '../content/copy.mjs';
import * as M from '../content/metric.mjs';
import { baseCtx } from './region.mjs';
import { LAYOUT } from '../site.mjs';

const { at, hail, courseRoll, postStrip, stepCards, stepSet, faqBlock, noticeBlock,
  guIndex, topicLinks, themeCards, spotPool, guPool } = B;
const { SEC } = T;
const compose = (kind, parts) => LAYOUT[kind].map((k) => parts[k] || '').filter(Boolean).join('\n');

const OIL = {
  true: [
    '오일 안내입니다. 기름을 쓰는 코스는 마친 뒤 몸을 닦고 옷을 갖추는 시간이 몇 분 더 듭니다. 뒤에 약속이 있다면 그만큼을 더해 시각을 잡아 드립니다.',
    '마무리 시간을 알려 드립니다. 피부에 오일이 남아 마침이 조금 길어지므로 희망 시각에 그 여유를 얹어 접수합니다.',
  ],
  false: [
    '오일 안내입니다. 기름을 바르지 않아 마치는 즉시 옷만 갖추시면 외출하실 수 있습니다. 침구가 더러워질 일도 없습니다.',
    '마른 손으로 진행하는 코스라고 알려 드립니다. 씻으실 일이 없어 바로 뒤에 일정이 이어지는 날에도 부담이 적습니다.',
  ],
};
const PRESS = [
  '압 안내입니다. 표에 적힌 압은 시작 지점이며, 손이 닿고 몇 분이 지나면 서로 맞는 세기가 정해집니다.',
  '세기 조절을 알려 드립니다. 압이 세게 느껴지는 순간 말씀해 주시면 곧바로 낮추겠습니다.',
  '체감은 몸 상태에 따라 달라진다고 안내해 드립니다. 오늘 가장 무거운 곳을 접수 때 말씀해 주시면 그에 맞춰 세기를 잡겠습니다.',
];
const WHY = [
  (c) => `${c.ko}${josa(c.ko, '은/는')} ${c.for}께 안내하는 코스입니다.`,
  (c) => `${c.for}께서 ${c.ko}${josa(c.ko, '을/를')} 자주 찾으신다고 알려 드립니다. 사정이 다르시면 통화 중에 다른 코스로 바꾸어 드립니다.`,
  (c) => `${c.ko}의 구성은 ${c.for}${josa(c.for, '을/를')} 염두에 두고 짰습니다. 받는 도중 다른 코스가 끌리셔도 계산은 처음 고른 코스로 이루어진다고 알려 드립니다.`,
];

function cmpRows(courses, cur) {
  const mins = courses.map((x) => x.min);
  const lo = Math.min(...mins), hi = Math.max(...mins);
  return [cur, ...courses.filter((x) => x.slug !== cur.slug)].map((x, i) => ({
    ko: x.ko, slug: x.slug, min: x.min, price: won(x.price), me: i === 0,
    w: hi === lo ? 100 : 22 + Math.round(((x.min - lo) / (hi - lo)) * 78),
    sub: `세기 ${x.pressure} · ${x.oil ? '오일 코스' : '마른 손 코스'}`,
  }));
}

export function coursePage(ctx, c) {
  const { cfg, siteUrl, courses, regions } = ctx;
  const path = `/course/${c.slug}/`;
  const url = `${siteUrl}${path}`;
  const seed = `course/${c.slug}`;
  const h = hash(seed, 'cp');
  const fc = baseCtx(cfg, courses, '머무는 곳');

  const { html: faqHtml, qa } = faqBlock(seed, fc, 5);
  const bySido = regions.map((r) => ({ label: `${r.name} ${c.ko}`, href: `/${r.slug}/course/${c.slug}/` }));
  const guList = [];
  for (const r of regions) for (const g of r.gu) guList.push({ label: `${r.name} ${g.name}`, href: `/${r.slug}/${g.slug}/` });
  const deepAll = [];
  for (const r of regions) if (r.main) for (const g of r.gu) for (const x of g.spots) deepAll.push({ label: `${g.name} ${x.name}`, href: `/${r.slug}/${g.slug}/${x.slug}/` });
  const steps = stepSet(seed);
  const topics = topicLinks([
    { label: `${c.ko} 시도별 편성`, items: bySido, anchor: T.COURSE_ANCHOR },
    { label: '다른 코스 편성', items: courses.filter((x) => x.slug !== c.slug).map((x) => ({ label: x.ko, href: `/course/${x.slug}/` })), anchor: T.COURSE_ANCHOR },
    { label: '시군구 화면 바로가기', items: guList, pick: 18, anchor: T.ANCHOR },
    { label: '동 화면 바로가기', items: deepAll, pick: 16, anchor: T.ANCHOR },
    { label: T.TL.docs, items: T.DOC_LINKS },
  ], seed, at(h, SEC.topicHead, 8), at(h, SEC.topicSub, 3));
  const theme = themeCards({
    pool: spotPool(regions, { sidoLabel: true }), noun: T.noun.spot, seedKey: seed,
    heading: at(h, SEC.themeHead, 4), sub: at(h, SEC.themeSub, 5), cards: 3, per: 4,
  });

  const parts = {
    open: SK.lead([`${esc(at(h, WHY, 0)(c))} ${esc(c.lines[0])}`, `${esc(c.lines[1])} ${esc(c.lines[2])}`, `${esc(at(h, OIL[String(c.oil)], 4))} ${esc(at(h, PRESS, 1))}`]),
    facts: frame('fact', `${c.ko} 편성 정보`, SK.stat([
      ['소요 시간', `${c.min}분`],
      ['금액', `${won(c.price)}원<small>전 지역에 같은 값을 적용합니다</small>`],
      ['압', esc(c.pressure)],
      ['손놀림', esc(c.tempo)],
      ['손길이 길게 닿는 자리', esc(c.focus)],
      ['오일', c.oil ? '사용' : '미사용'],
      ['방에 갖춰 둘 것', c.oil ? '눕는 자리 한 곳과 수건 두 장' : '누울 곳 한 군데와 수건 한 장'],
      ['접수 조건', `${esc(cfg.hours)} 전화 응대<small>${esc(cfg.pay)} 정산, ${esc(cfg.arrive)} 안에 도착하도록 편성합니다</small>`],
    ]), at(h, SEC.factSub, 7)),
    compare: frame('cmp', '아홉 코스 길이 비교', SK.cmp(cmpRows(courses, c)),
      '막대의 길이는 소요 시간이고 맨 오른쪽 숫자는 금액이라고 안내해 드립니다. 시간이 길다고 압이 센 것은 아니어서 두 가지는 따로 읽으셔야 합니다.'),
    hail: hail(cfg, c.ko, seed), faq: faqHtml, steps: stepCards(seed), notice: noticeBlock(seed), theme: theme.html, posts: postStrip(seed), topics,
  };

  return {
    path,
    html: layout(ctx, {
      path, title: title.course(c), desc: clampDesc(desc.course(c)),
      h1: SK.h1(esc(c.ko), `방문 ${c.min}분, ${won(c.price)}원`),
      body: compose('course', parts), pageKind: 'course', onAir: c.ko,
      crumbs: [{ name: T.crumb.home, url: `${siteUrl}/` }, { name: T.crumb.course, url: `${siteUrl}/course/` }, { name: c.ko, url }],
      jsonld: [
        S.service({ siteUrl, url, cfg, name: `${c.ko} 출장 방문 관리`, desc: clampDesc(desc.course(c)), areaServed: { '@type': 'Country', name: '대한민국' }, courses: [c] }),
        S.itemList(`${url}#sidolist`, `${c.ko}${josa(c.ko, '을/를')} 안내하는 시도`, regions.map((r) => ({ name: `${r.name} ${c.ko}`, url: `${siteUrl}/${r.slug}/course/${c.slug}/` }))),
        S.itemList(`${url}#themes`, `${c.ko} 접수 안내와 함께 편성한 동`, theme.list.map((x) => ({ name: x.name, url: `${siteUrl}${x.href}` }))),
        S.faqPage(url, qa),
        S.howTo(url, `${c.ko} 접수에서 도착까지 이어지는 다섯 순서`, steps, cfg),
      ],
    }),
  };
}

export function sidoCoursePage(ctx, sd, c) {
  const { cfg, siteUrl, courses, regions } = ctx;
  const path = `/${sd.slug}/course/${c.slug}/`;
  const url = `${siteUrl}${path}`;
  const seed = `${sd.name}/course/${c.slug}`;
  const h = hash(seed, 'sc');
  const fc = baseCtx(cfg, courses, sd.name);
  const sc = M.sidoCtx(ctx, sd);
  /* 시군구까지만 있는 시도와 시군구가 하나뿐인 시도는 코스 쪽끼리 본문이 55% 넘게 겹친다 — 색인에서 뺀다(링크는 그대로). */
  const thin = !sd.main || sd.gu.length < 2;

  const openLines = [
    `안내 말씀드립니다. ${sd.name}에서 받으시는 ${c.ko} ${c.min}분 코스는 ${won(c.price)}원이며, 이 금액은 전 지역에 똑같이 적용됩니다.`,
    `요금 확인 말씀드립니다. ${sd.name}의 어느 시군구에서 부르셔도 ${c.ko} ${c.min}분은 ${won(c.price)}원 한 가지로 정해져 있습니다.`,
    `${sd.name}에서 접수하신다고 ${c.ko}의 구성이 달라지는 일은 없습니다. 타 지역과 똑같은 ${c.min}분짜리 프로그램이 같은 값으로 방문합니다.`,
  ];
  const secondMain = [
    `${sd.name}에는 화면을 만든 동이 ${sd.spotCount}곳이고 시군구 평균 북위의 평균은 ${sc.lat}도입니다.`,
    `${sd.name}의 동 가운데 가장 북쪽은 ${sc.topDong}(북위 ${sc.topDongLat}도), 가장 남쪽은 ${sc.lowDong}(북위 ${sc.lowDongLat}도)입니다.`,
    `${sd.name}의 시군구 평균 북위는 최북단 ${sc.nName}에서 최남단 ${sc.sName}까지 ${sc.spread}에 걸쳐 있습니다. 동별 값은 각 동 화면에서 알려 드립니다.`,
  ];
  const secondSub = [
    `${sd.name}${josa(sd.name, '은/는')} 시군구 ${sd.gu.length}곳까지만 화면이 있고 동 이름은 그 화면 목록 속에 담았다고 알려 드립니다.`,
    `${sd.name}에서 다룬 시군구 ${sd.gu.length}곳의 평균 북위는 ${sc.lat}도이며 행정동은 모두 ${sd.dongCount}곳입니다.`,
    `${sd.name} 편성은 시군구 화면이 마지막 순서이며, 읍·면·동 이름은 전화 연결 후에 한 번만 불러 주시면 접수됩니다.`,
  ];
  const second = at(h, sd.main ? secondMain : secondSub, 6);

  const guHere = sd.gu.map((g) => ({ label: guLabel(sd.name, g.name), href: `/${sd.slug}/${g.slug}/` }));
  const deepHere = [];
  for (const g of sd.gu) for (const x of g.spots) deepHere.push({ label: `${g.name} ${x.name}`, href: `/${sd.slug}/${g.slug}/${x.slug}/` });
  const { html: faqHtml, qa } = faqBlock(seed, fc, 4);
  const steps = stepSet(seed);
  const topics = topicLinks([
    { label: `${sd.name}에서 안내하는 다른 코스`, items: courses.filter((x) => x.slug !== c.slug).map((x) => ({ label: `${sd.name} ${x.ko}`, href: `/${sd.slug}/course/${x.slug}/` })), anchor: T.COURSE_ANCHOR },
    { label: `${c.ko} 다른 시도 편성`, items: regions.filter((r) => r.slug !== sd.slug).map((r) => ({ label: `${r.name} ${c.ko}`, href: `/${r.slug}/course/${c.slug}/` })), anchor: T.COURSE_ANCHOR },
    { label: T.TL.courseOnly, items: courses.map((x) => ({ label: x.ko, href: `/course/${x.slug}/` })), anchor: T.COURSE_ANCHOR },
    { label: `${sd.name} 시군구 화면 바로가기`, items: guHere, pick: 16, anchor: T.ANCHOR },
    ...(deepHere.length ? [{ label: `${sd.name} 동 화면 바로가기`, items: deepHere, pick: 14, anchor: T.ANCHOR }] : []),
    { label: T.TL.docs, items: T.DOC_LINKS },
  ], seed, at(h, SEC.topicHead, 8), at(h, SEC.topicSub, 3));
  const theme = themeCards({
    pool: sd.main ? spotPool([sd]) : guPool(regions.filter((r) => r.slug !== sd.slug), { sidoLabel: true }),
    noun: sd.main ? T.noun.spot : T.noun.gu, seedKey: seed,
    heading: at(h, SEC.themeHead, 4), sub: at(h, SEC.themeSub, 5), cards: 4, per: 4,
  });

  const subNames = [];
  if (!sd.main) for (const g of sd.gu) {
    for (const d of (g.dongNames || [])) subNames.push(`${g.name} ${d}`);
    for (const m of (g.rural || [])) subNames.push(`${g.name} ${m.name}`);
  }
  const ci = courses.findIndex((x) => x.slug === c.slug);
  const allShuf = shuffle(subNames, hash(sd.name, 'sn'));
  const per = Math.max(10, Math.ceil(allShuf.length / courses.length));
  const nameShow = subNames.length ? allShuf.slice(ci * per, ci * per + per) : [];
  const namesBlock = nameShow.length
    ? frame('sidodong', `${sd.name}에 속한 행정동 이름 ${nameShow.length}개 안내`,
      `${SK.names(nameShow)}${SK.note(`${esc(sd.name)}의 행정동 ${subNames.length}곳 가운데 이 화면에는 일부 이름만 실었습니다. 나머지 이름은 <a href="/${sd.slug}/">${esc(sd.name)} 화면</a> 아래 시군구별 목록에서 안내해 드립니다.`)}`,
      '어떤 이름을 말씀하셔도 접수된다고 알려 드립니다. 전화로 한 번만 말씀해 주시면 됩니다.', `이름 ${nameShow.length}개 열기`)
    : '';

  const parts = {
    open: SK.lead([esc(at(h, openLines, 0)), esc(second), esc(c.lines[(parseInt(h.substr(3, 3), 16)) % c.lines.length])]),
    facts: frame('fact', `${sd.name}의 ${c.ko} 편성 정보`, M.sidoDevice(sd) + SK.stat([
      ['대상 지역', `<a href="/${sd.slug}/">${esc(sd.full)}</a>`],
      ['화면 깊이', sd.main ? `시군구 ${sd.gu.length}곳에 동 ${sd.spotCount}곳이 딸린 편성` : `시군구 ${sd.gu.length}곳까지`],
      ['소요 시간', `${c.min}분`],
      ['금액', `${won(c.price)}원<small>${esc(sd.name)} 전역에 같은 값을 적용합니다</small>`],
      ['압과 손놀림', `${esc(c.pressure)}<small>${esc(c.tempo)}</small>`],
      ['손길이 길게 닿는 자리', esc(c.focus)],
      ['오일', c.oil ? '사용' : '미사용'],
      ['시군구 평균 북위', `${sc.lat}도<small>북위 폭은 ${sc.spread}입니다</small>`],
    ]), at(h, SEC.factSub, 7)),
    courses: courseRoll(courses, seed, sd.name, { full: false }),
    hail: hail(cfg, `${sd.name} ${c.ko}`, seed),
    guidx: guIndex(sd, seed, null, { pick: 14 }),
    names: namesBlock, faq: faqHtml, steps: stepCards(seed), theme: theme.html, posts: postStrip(seed), topics,
  };

  return {
    path, noindex: thin,
    html: layout(ctx, {
      path, title: title.sidoCourse(sd, c), desc: clampDesc(desc.sidoCourse(sd, c)),
      h1: SK.h1(`${esc(sd.name)} ${esc(c.ko)}`, `${sd.name} 전역 ${c.min}분, ${won(c.price)}원`),
      body: compose('sidoCourse', parts), pageKind: 'sidocourse', noindex: thin, onAir: `${sd.name} ${c.ko}`,
      about: `${siteUrl}/${sd.slug}/#place`,
      geo: { iso: sd.iso, placename: sd.full, lat: sd.lat, lng: sd.lng },
      crumbs: [
        { name: T.crumb.home, url: `${siteUrl}/` }, { name: T.crumb.area, url: `${siteUrl}/area/` },
        { name: sd.name, url: `${siteUrl}/${sd.slug}/` }, { name: c.ko, url },
      ],
      jsonld: [
        S.place(`${siteUrl}/${sd.slug}/#place`, sd.full, { lat: sd.lat, lng: sd.lng }, { area: sd.area, alternateName: sd.alias }),
        S.service({ siteUrl, url, cfg, name: `${sd.name}에서 받는 ${c.ko} 방문 관리`, desc: clampDesc(desc.sidoCourse(sd, c)), areaServed: { '@type': 'AdministrativeArea', name: sd.full }, courses: [c] }),
        S.itemList(`${url}#gulist`, `${sd.name} 시군구 편성`, sd.gu.map((g) => ({ name: g.name, url: `${siteUrl}/${sd.slug}/${g.slug}/` }))),
        S.itemList(`${url}#themes`, `${sd.name}에서 북위 눈금이 가까운 곳`, theme.list.map((x) => ({ name: x.name, url: `${siteUrl}${x.href}` }))),
        S.faqPage(url, qa),
        S.howTo(url, `${sd.name} ${c.ko} 접수에 이어지는 다섯 순서`, steps, cfg),
      ],
    }),
  };
}
