/**
 * 동·시군구·시도 쪽. 한글 문장은 T(copy)·M(metric)에서만 가져온다.
 * 쪽을 이루는 칸의 순서는 site.mjs 의 LAYOUT 이 정한다.
 */
import { layout, frame } from '../lib/html.mjs';
import { hash, won, josa, guLabel } from '../lib/util.mjs';
import { title, desc, clampDesc } from '../lib/seo.mjs';
import * as S from '../lib/schema.mjs';
import * as B from '../lib/blocks.mjs';
import * as SK from '../lib/skin.mjs';
import * as T from '../content/copy.mjs';
import * as M from '../content/metric.mjs';
import { LAYOUT } from '../site.mjs';

const { at, hail, courseRoll, rollCourses, postStrip, stepCards, stepSet, faqBlock, noticeBlock,
  kinSpots, spotIndex, ruralList, dongNameList, guIndex, kinGu, topicLinks, courseTopic, themeCards,
  spotPool, guPool } = B;
const { SEC } = T;

const compose = (kind, parts) => LAYOUT[kind].map((k) => parts[k] || '').filter(Boolean).join('\n');
const nameOf = (regions, t) => (t.same ? guLabel(regions.find((r) => r.slug === t.sidoSlug).name, t.gu) : `${regions.find((r) => r.slug === t.sidoSlug).name} ${t.gu}`);

export function baseCtx(cfg, courses, place) {
  return {
    place, hours: cfg.hours, pay: cfg.pay, arrive: cfg.arrive, tel: cfg.tel, telLabel: cfg.telLabel,
    minPrice: `${won(Math.min(...courses.map((c) => c.price)))}원`,
  };
}

/* ── 동 ───────────────────────────────────────────────────────── */
export function spotPage(ctx, sd, g, s) {
  const { cfg, siteUrl, courses, regions } = ctx;
  const path = `/${sd.slug}/${g.slug}/${s.slug}/`;
  const url = `${siteUrl}${path}`;
  const seed = `${sd.name}/${g.name}/${s.name}`;
  const h = hash(seed, 'spot');
  const c = M.spotCtx(ctx, sd, g, s);

  const { html: faqHtml, qa } = faqBlock(seed, c, 4);
  const far = [];
  for (const r of regions) {
    if (r.slug === sd.slug) continue;
    if (r.main) for (const x of r.gu) for (const y of x.spots) far.push({ label: `${x.name} ${y.name}`, href: `/${r.slug}/${x.slug}/${y.slug}/` });
    else for (const x of r.gu) far.push({ label: `${r.name} ${x.name}`, href: `/${r.slug}/${x.slug}/` });
  }
  const sameSido = [];
  for (const x of sd.gu) {
    if (x.slug === g.slug) continue;
    for (const y of x.spots) sameSido.push({ label: `${x.name} ${y.name}`, href: `/${sd.slug}/${x.slug}/${y.slug}/` });
  }
  const steps = stepSet(seed);
  const L = T.TL;
  const topics = topicLinks([
    { label: L.course, items: courseTopic(sd, courses), anchor: T.COURSE_ANCHOR },
    { label: L.sameSidoSpot(sd), items: sameSido, pick: 18, anchor: T.ANCHOR },
    { label: L.kinGu, items: g.kin.map((t) => ({ label: nameOf(regions, t), href: `/${t.sidoSlug}/${t.slug}/` })), anchor: T.NEAR_ANCHOR },
    { label: L.farSido, items: far, pick: 18, anchor: T.ANCHOR },
    { label: L.docs, items: T.DOC_LINKS },
  ], seed, at(h, SEC.topicHead, 8), at(h, SEC.topicSub, 3));
  const theme = themeCards({
    pool: spotPool(regions, { sidoLabel: true, skipGu: `${sd.slug}/${g.slug}` }), noun: T.noun.spot, seedKey: seed,
    heading: at(h, SEC.themeHead, 4), sub: at(h, SEC.themeSub, 5), cards: 3, per: 4, prefer: M.themePrefer(s),
  });

  const parts = {
    open: SK.lead([at(h, T.SPOT_LEAD_A, 0)(c), at(h, T.SPOT_LEAD_B, 1)(c), at(h, T.SPOT_LEAD_C, 2)(c)]),
    facts: frame('fact', T.factHead.spot(s), M.spotFacts(ctx, sd, g, s, c), at(h, SEC.factSub, 7)),
    kin: kinSpots(sd, g, s, seed),
    courses: courseRoll(courses, seed, s.name, { full: false }),
    steps: stepCards(seed),
    hail: hail(cfg, `${g.name} ${s.name}`, seed),
    faq: faqHtml,
    spotidx: spotIndex(sd, g, seed, s.slug, 7),
    guidx: guIndex(sd, seed, g.slug, { pick: 8 }),
    notice: noticeBlock(seed, 3),
    theme: theme.html,
    topics,
  };

  return {
    path,
    html: layout(ctx, {
      path,
      title: title.spot(sd, g, s),
      desc: clampDesc(desc.spot(sd, g, s)),
      h1: SK.h1(`${SK.esc(g.name)} ${SK.esc(s.name)}`, T.h1Sub.spot(c, s)),
      body: compose('spot', parts),
      pageKind: 'spot', onAir: `${sd.name} ${g.name} ${s.name}`,
      about: `${url}#place`,
      geo: { iso: sd.iso, placename: `${sd.full} ${g.name} ${s.name}`, lat: s.lat, lng: s.lng },
      crumbs: [
        { name: T.crumb.home, url: `${siteUrl}/` },
        { name: T.crumb.area, url: `${siteUrl}/area/` },
        { name: sd.name, url: `${siteUrl}/${sd.slug}/` },
        { name: g.name, url: `${siteUrl}/${sd.slug}/${g.slug}/` },
        { name: s.name, url },
      ],
      jsonld: [
        S.place(`${url}#place`, `${sd.full} ${g.name} ${s.name}`, { lat: s.lat, lng: s.lng },
          { area: s.area, containedIn: { '@type': 'AdministrativeArea', name: `${sd.full} ${g.name}` } }),
        S.service({
          siteUrl, url, cfg, name: T.ld.svcSpot(sd, g, s), desc: clampDesc(desc.spot(sd, g, s)),
          areaServed: { '@id': `${url}#place` }, courses: rollCourses(courses, seed, false),
        }),
        S.itemList(`${url}#themes`, T.ld.themesSpot(s), theme.list.map((x) => ({ name: x.name, url: `${siteUrl}${x.href}` }))),
        S.faqPage(url, qa),
        S.howTo(url, T.ld.howSpot(sd, g, s), steps, cfg),
      ],
    }),
  };
}

/* ── 시군구 ───────────────────────────────────────────────────── */
export function guPage(ctx, sd, g) {
  const { cfg, siteUrl, courses, regions } = ctx;
  const path = `/${sd.slug}/${g.slug}/`;
  const url = `${siteUrl}${path}`;
  const seed = `${sd.name}/${g.name}`;
  const h = hash(seed, 'gu');

  /* 읍을 뺀 뒤로 '행정동이 전부 읍·면인 군'이 생겼다. 안내문을 낼 구역이 0이므로 갈래를 나눈다. */
  const mode = g.main ? (g.spotCount ? 'spot' : 'rural') : 'list';
  const c = M.guCtx(ctx, sd, g, mode);

  const i0 = parseInt(h.substr(0, 3), 16) % T.GU_LEAD.length;
  const i1 = (i0 + 1 + (parseInt(h.substr(9, 3), 16) % (T.GU_LEAD.length - 1))) % T.GU_LEAD.length;

  const { html: faqHtml, qa } = faqBlock(seed, c, 5);
  const far = [];
  for (const r of regions) for (const x of r.gu) {
    if (r.slug === sd.slug && x.slug === g.slug) continue;
    far.push({ label: `${r.name} ${x.name}`, href: `/${r.slug}/${x.slug}/` });
  }
  const steps = stepSet(seed);
  const sidoDeep = [];
  for (const x of sd.gu) for (const y of x.spots) if (x.slug !== g.slug) sidoDeep.push({ label: `${x.name} ${y.name}`, href: `/${sd.slug}/${x.slug}/${y.slug}/` });
  const L = T.TL;
  const topics = topicLinks([
    { label: L.courseName, items: courseTopic(sd, courses), anchor: T.COURSE_ANCHOR },
    { label: L.kinGu, items: g.kin.map((t) => ({ label: nameOf(regions, t), href: `/${t.sidoSlug}/${t.slug}/` })), anchor: T.NEAR_ANCHOR },
    ...(sidoDeep.length ? [{ label: L.otherGuSpot(sd), items: sidoDeep, pick: 16, anchor: T.ANCHOR }] : []),
    { label: L.farGu, items: far, pick: 18, anchor: T.ANCHOR },
    { label: L.docs, items: T.DOC_LINKS },
  ], seed, at(h, SEC.topicHead, 8), at(h, SEC.topicSub, 3));
  const theme = themeCards({
    pool: mode === 'spot'
      ? spotPool(regions.filter((r) => r.slug === sd.slug), { skipGu: `${sd.slug}/${g.slug}` })
      : guPool(regions, { sidoLabel: true, skip: `${sd.slug}/${g.slug}` }),
    noun: mode === 'spot' ? T.noun.spot : T.noun.gu, seedKey: seed,
    heading: at(h, SEC.themeHead, 4), sub: at(h, SEC.themeSub, 5), cards: 3, per: 4, prefer: M.themePrefer(g),
  });

  const parts = {
    open: SK.lead([T.GU_LEAD[i0](c), T.GU_LEAD[i1](c)]),
    facts: frame('fact', T.factHead.gu(g), M.guFacts(ctx, sd, g, mode, c), at(h, SEC.factSub, 7)),
    idx: mode === 'spot' ? spotIndex(sd, g, seed, null) : mode === 'list' ? dongNameList(g, seed) : '',
    rural: ruralList(g, seed),
    courses: courseRoll(courses, seed, g.name, { full: false }),
    hail: hail(cfg, `${sd.name} ${g.name}`, seed),
    kin: kinGu(sd, g, seed),
    steps: stepCards(seed),
    faq: faqHtml,
    notice: noticeBlock(seed),
    guidx: guIndex(sd, seed, g.slug, { pick: 20 }),
    theme: theme.html,
    posts: postStrip(seed),
    topics,
  };

  return {
    path,
    html: layout(ctx, {
      path,
      title: title.gu(sd, g),
      desc: clampDesc(desc.gu(sd, g)),
      h1: SK.h1(`${SK.esc(sd.name)} ${SK.esc(g.name)}`, T.h1Sub.gu(c, g, mode)),
      body: compose('gu', parts),
      pageKind: 'gu', onAir: `${sd.name} ${g.name}`,
      pageType: 'CollectionPage',
      about: `${url}#place`,
      mainList: g.spots.length ? `${url}#spotlist` : `${url}#sidogu`,
      geo: { iso: sd.iso, placename: `${sd.full} ${g.name}`, lat: g.lat, lng: g.lng },
      crumbs: [
        { name: T.crumb.home, url: `${siteUrl}/` },
        { name: T.crumb.area, url: `${siteUrl}/area/` },
        { name: sd.name, url: `${siteUrl}/${sd.slug}/` },
        { name: g.name, url },
      ],
      jsonld: [
        S.place(`${url}#place`, `${sd.full} ${g.name}`, { lat: g.lat, lng: g.lng },
          { area: g.area, containedIn: { '@type': 'AdministrativeArea', name: sd.full } }),
        S.service({
          siteUrl, url, cfg, name: T.ld.svcGu(sd, g), desc: clampDesc(desc.gu(sd, g)),
          areaServed: { '@id': `${url}#place` }, courses: rollCourses(courses, seed, false),
        }),
        g.spots.length
          ? S.itemList(`${url}#spotlist`, T.ld.guSpots(g), g.spots.map((s) => ({ name: s.name, url: `${siteUrl}/${sd.slug}/${g.slug}/${s.slug}/` })))
          : S.itemList(`${url}#sidogu`, T.ld.sidoGuList(sd), sd.gu.map((x) => ({ name: x.name, url: `${siteUrl}/${sd.slug}/${x.slug}/` }))),
        S.itemList(`${url}#themes`, T.ld.themesGu(g), theme.list.map((x) => ({ name: x.name, url: `${siteUrl}${x.href}` }))),
        S.faqPage(url, qa),
        S.howTo(url, T.ld.howGu(sd, g), steps, cfg),
      ].filter(Boolean),
    }),
  };
}

/* ── 시도 ─────────────────────────────────────────────────────── */
export function sidoPage(ctx, sd) {
  const { cfg, siteUrl, courses, regions } = ctx;
  const path = `/${sd.slug}/`;
  const url = `${siteUrl}${path}`;
  const seed = sd.name;
  const h = hash(seed, 'sd');
  const c = M.sidoCtx(ctx, sd);

  const { html: faqHtml, qa } = faqBlock(seed, c, 4);
  const csLinks = frame('sidocourse', T.sidoCourseHead(sd),
    SK.inl(courses.map((x) => ({ href: `/${sd.slug}/course/${x.slug}/`, text: at(hash(sd.name, x.slug, 'cs'), T.sidoCourseAnchors(sd))(x) }))),
    T.sidoCourseSub(sd));
  const pickBlock = frame('longest', T.sidoPickHead(sd), SK.tags(M.pickUnits(sd)), T.sidoPickSub(sd));

  const far = [];
  for (const r of regions) {
    if (r.slug === sd.slug) continue;
    for (const x of r.gu) far.push({ label: `${r.name} ${x.name}`, href: `/${r.slug}/${x.slug}/` });
  }
  const deep = [];
  for (const g of sd.gu) for (const x of g.spots) deep.push({ label: `${g.name} ${x.name}`, href: `/${sd.slug}/${g.slug}/${x.slug}/` });
  const steps = stepSet(seed);
  const L = T.TL;
  const topics = topicLinks([
    { label: L.sidoCourse(sd), items: courseTopic(sd, courses), anchor: T.COURSE_ANCHOR },
    { label: L.courseOnly, items: courses.map((x) => ({ label: x.ko, href: `/course/${x.slug}/` })), anchor: T.COURSE_ANCHOR },
    ...(deep.length ? [{ label: L.sidoSpot(sd), items: deep, pick: 16, anchor: T.ANCHOR }] : []),
    { label: L.farGu, items: far, pick: 16, anchor: T.ANCHOR },
    { label: L.docs, items: T.DOC_LINKS },
  ], seed, at(h, SEC.topicHead, 8), at(h, SEC.topicSub, 3));
  const theme = themeCards({
    pool: sd.main ? spotPool([sd]) : guPool(regions.filter((r) => r.slug !== sd.slug), { sidoLabel: true }),
    noun: sd.main ? T.noun.spot : T.noun.gu, seedKey: seed,
    heading: at(h, SEC.themeHead, 4), sub: at(h, SEC.themeSub, 5), cards: sd.main ? 6 : 5, per: 4,
  });

  const parts = {
    open: SK.lead([at(h, sd.main ? T.SIDO_LEAD_MAIN : T.SIDO_LEAD_SUB, 0)(c)]),
    facts: frame('fact', T.factHead.sido(sd), M.sidoFacts(ctx, sd, c), at(h, SEC.factSub, 7)),
    guidx: guIndex(sd, seed, null),
    pick: pickBlock,
    cslinks: csLinks,
    hail: hail(cfg, sd.name, seed),
    courses: courseRoll(courses, seed, sd.name, { full: false }),
    steps: stepCards(seed),
    faq: faqHtml,
    theme: theme.html,
    posts: postStrip(seed),
    topics,
  };

  return {
    path,
    html: layout(ctx, {
      path,
      title: title.sido(sd),
      desc: clampDesc(desc.sido(sd)),
      h1: SK.h1(SK.esc(sd.name), T.h1Sub.sido(c, sd)),
      body: compose('sido', parts),
      pageKind: 'sido', onAir: sd.name,
      pageType: 'CollectionPage',
      about: `${url}#place`,
      mainList: `${url}#gulist`,
      geo: { iso: sd.iso, placename: sd.full, lat: sd.lat, lng: sd.lng },
      crumbs: [
        { name: T.crumb.home, url: `${siteUrl}/` },
        { name: T.crumb.area, url: `${siteUrl}/area/` },
        { name: sd.name, url },
      ],
      jsonld: [
        S.place(`${url}#place`, sd.full, { lat: sd.lat, lng: sd.lng }, { area: sd.area, alternateName: sd.alias }),
        S.service({
          siteUrl, url, cfg, name: T.ld.svcSido(sd), desc: clampDesc(desc.sido(sd)),
          areaServed: { '@id': `${url}#place` }, courses: rollCourses(courses, seed, false),
        }),
        S.itemList(`${url}#gulist`, T.ld.sidoGuList(sd), sd.gu.map((g) => ({ name: g.name, url: `${siteUrl}/${sd.slug}/${g.slug}/` }))),
        S.itemList(`${url}#courselist`, T.ld.sidoCourseList(sd), courses.map((cc) => ({ name: `${sd.name} ${cc.ko}`, url: `${siteUrl}/${sd.slug}/course/${cc.slug}/` }))),
        S.itemList(`${url}#themes`, T.ld.themesSido(sd), theme.list.map((x) => ({ name: x.name, url: `${siteUrl}${x.href}` }))),
        S.faqPage(url, qa),
        S.howTo(url, T.ld.howSido(sd), steps, cfg),
      ],
    }),
  };
}
