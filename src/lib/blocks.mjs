/**
 * 쪽을 이루는 칸의 '고르기' 쪽 논리. 한글 문장은 content/copy.mjs(T), 값에 따른 말은
 * content/metric.mjs(M), 화면에 찍는 마크업은 lib/skin.mjs(SK)에만 있다.
 */
import { hash, shuffle, won, josa, guLabel, SIDO_NAME } from './util.mjs';
import { frame, callBox } from './html.mjs';
import * as SK from './skin.mjs';
import { POSTS } from '../content/posts.mjs';
import * as T from '../content/copy.mjs';
import * as M from '../content/metric.mjs';

const at = (h, arr, slot = 0) => arr[parseInt(h.substr((slot * 3) % 29, 3), 16) % arr.length];
const DUPX = (n) => guLabel('x', n) !== n;
const num = (h, i) => parseInt(h.substr(i * 3 % 29, 3), 16);
const { SEC } = T;
export { at };

/* ── 예약 문의 쪽지 ─────────────────────────────────────────── */
export function hail(cfg, place, seedKey) {
  const h = hash(seedKey, 'hs');
  const line = at(h, T.hailLines(place));
  const tail = at(h, SEC.askTail, 2).replace('@A', cfg.arrive).replace('@H', cfg.hours).replace('@P', cfg.pay);
  return SK.hail({ place, line, tail, call: callBox(cfg, { size: 'l' }) });
}

/* ── 코스 줄 ─────────────────────────────────────────────────
   안내문마다 아홉 가지를 되풀이하면 그 덩어리가 본문에서 가장 커진다.
   동·시군구에서는 시드로 고른 셋만 보이고 나머지는 코스 쪽으로 보낸다. */
export function rollCourses(courses, seedKey, full = true) {
  return full ? courses : shuffle(courses.slice(), hash(seedKey, 'cr')).slice(0, 3);
}
export function courseRoll(courses, seedKey, place, { full = true } = {}) {
  const h = hash(seedKey, 'cr');
  const show = rollCourses(courses, seedKey, full);
  const withText = new Set(shuffle(show.map((c) => c.slug), h).slice(0, full ? 2 : 1));
  const rows = show.map((c) => ({
    href: `/course/${c.slug}/`, ko: c.ko, min: c.min, price: won(c.price),
    line: withText.has(c.slug) ? at(hash(seedKey, c.slug), c.lines) : '',
  }));
  const tail = full ? `${SK.esc(at(h, SEC.courseTail, 2))} ${at(h, SEC.courseLink, 5)}` : at(h, T.courseShort(place), 4);
  return frame('course', T.courseHead(place, full), SK.stubs(rows, tail), at(h, SEC.courseSub, 1));
}

/* ── 접수 흐름 ───────────────────────────────────────────────── */
export const stepSet = (seedKey) => at(hash(seedKey, 'st'), T.STEP_SETS);
export function stepCards(seedKey) {
  const h = hash(seedKey, 'st');
  return frame('step', at(h, SEC.stepTitle, 1), SK.steps(at(h, T.STEP_SETS)), at(h, SEC.stepSub, 2));
}

/* ── 자주 묻는 것 — 질문은 h3 ──────────────────────────────────── */
export function faqBlock(seedKey, c, n = 5) {
  const h = hash(seedKey, 'fq');
  const idx = shuffle(T.FAQ_POOL.map((_, i) => i), h).slice(0, n);
  const qa = idx.map((i) => {
    const item = T.FAQ_POOL[i];
    const av = item.a[parseInt(hash(seedKey, 'av', i).substr(0, 3), 16) % item.a.length];
    return { q: item.q(c), a: av(c) };
  });
  return { html: frame('faq', at(h, SEC.faqTitle, 3), SK.qa(qa), at(h, SEC.faqSub, 4)), qa };
}

/* ── 안내·주의 ───────────────────────────────────────────────── */
export function noticeBlock(seedKey, n = 4) {
  const h = hash(seedKey, 'nt');
  return frame('notice', at(h, SEC.noticeTitle, 5), SK.caution(shuffle(T.NOTICE, h).slice(0, n)), null);
}

/* ── 롱테일 링크 ─────────────────────────────────────────────── */
export function longtail(pool, seedKey, n, heading, sub) {
  const h = hash(seedKey, 'lt');
  const items = shuffle(pool, h).slice(0, n).map((p) => ({
    href: p.href, text: T.ANCHOR[parseInt(hash(seedKey, p.label).substr(0, 3), 16) % T.ANCHOR.length](p.label),
  }));
  return frame('longtail', heading, SK.inl(items), sub || at(h, SEC.ltSub, 6));
}

export function topicLinks(groups, seedKey, heading, sub) {
  const h = hash(seedKey, 'tp');
  const rows = groups.filter((g) => g.items && g.items.length).map((g, gi) => {
    const picked = (g.pick ? shuffle(g.items, hash(seedKey, 'tp', gi)) : g.items).slice(0, g.pick || g.items.length);
    const items = picked.map((p) => {
      const base = p.labels ? p.labels[parseInt(hash(seedKey, p.href).substr(0, 3), 16) % p.labels.length] : p.label;
      const tpl = g.anchor ? g.anchor[parseInt(hash(seedKey, g.label, base).substr(0, 3), 16) % g.anchor.length] : null;
      return { href: p.href, text: tpl ? tpl(base) : base };
    });
    return { label: g.label, items };
  });
  return frame('topic', heading, SK.rows(rows), sub || at(h, SEC.ltSub, 6), T.fold.topic);
}

/* ── 글 ──────────────────────────────────────────────────────── */
export const notes = (list) => SK.posts(list);
export function postStrip(seedKey, n = 2) {
  const h = hash(seedKey, 'ps');
  return frame('postlk', at(h, SEC.postHead, 3), notes(shuffle(POSTS.slice(), h).slice(0, n)), at(h, SEC.postSub, 5));
}

/* ── 풀 ──────────────────────────────────────────────────────── */
export function spotPool(regions, { sidoLabel = false, skipGu = '' } = {}) {
  const out = [];
  for (const r of regions) if (r.main) for (const g of r.gu) {
    if (skipGu && `${r.slug}/${g.slug}` === skipGu) continue;
    for (const s of g.spots) out.push({ href: `/${r.slug}/${g.slug}/${s.slug}/`, label: `${sidoLabel ? `${r.name} ` : ''}${g.name} ${s.name}`, u: s });
  }
  return out;
}
export function guPool(regions, { sidoLabel = false, skip = '' } = {}) {
  const out = [];
  for (const r of regions) for (const g of r.gu) {
    if (skip && `${r.slug}/${g.slug}` === skip) continue;
    out.push({ href: `/${r.slug}/${g.slug}/`, label: `${sidoLabel ? `${r.name} ` : ''}${g.name}`, u: g });
  }
  return out;
}

/* ── 값이 닮은 곳끼리 묶은 칸 ────────────────────────────────── */
export function themeCards({ pool, noun, seedKey, heading, sub, cards = 4, per = 4, prefer = [] }) {
  const defs = M.themeDefs(noun).map((d) => ({ ...d, c: pool.filter((x) => d.f(x.u)) })).filter((d) => d.c.length >= per);
  if (!defs.length) return { html: '', list: [] };
  const order = shuffle(defs, hash(seedKey, 'tc'));
  const first = prefer.map((k) => order.find((d) => d.k === k)).filter(Boolean);
  const chosen = [...first, ...order.filter((d) => !first.includes(d))].slice(0, cards);
  const list = [];
  const grp = chosen.map((d) => {
    const win = d.c.slice().sort((a, b) => d.sort(a.u, b.u) || a.label.localeCompare(b.label, 'ko')).slice(0, per * 3);
    const pick = shuffle(win, hash(seedKey, 'tc', d.k)).slice(0, per).sort((a, b) => d.sort(a.u, b.u) || a.label.localeCompare(b.label, 'ko'));
    for (const x of pick) list.push({ name: x.label, href: x.href });
    return { title: d.t, items: pick.map((x) => ({ href: x.href, label: x.label, m: d.m(x.u) })) };
  });
  return { html: frame('theme', heading, SK.themes(grp), sub), list };
}

export const courseTopic = (sd, courses) => courses.map((c) => ({ label: `${sd.name} ${c.ko}`, href: `/${sd.slug}/course/${c.slug}/` }));

/* ── 같은 시군구 안에서 값이 가까운 동 ───────────────────────── */
export function kinSpots(sd, g, s, seedKey) {
  const pool = g.spots.filter((x) => x.slug !== s.slug);
  if (!pool.length) return '';
  const sorted = pool.slice().sort((a, b) => M.near(s, a) - M.near(s, b) || a.name.localeCompare(b.name, 'ko'));
  const items = sorted.slice(0, 8).map((x) => ({ href: `/${sd.slug}/${g.slug}/${x.slug}/`, name: x.name, val: M.chip(x) }));
  return frame('kin', T.kinSpotHead(g, s), SK.tags(items), at(hash(seedKey, 'lk'), SEC.kinSub));
}

/* ── 시군구 안의 동 편성표 — 북쪽 줄부터 남쪽 줄까지 ───────────────────── */
export function spotIndex(sd, g, seedKey, currentSlug, win = 0) {
  const full = g.spots.slice().sort((a, b) => b.a - a.a || a.name.localeCompare(b.name, 'ko'));
  let list = full;
  const partial = win && full.length > win;
  if (partial) {
    const at0 = Math.max(0, full.findIndex((s) => s.slug === currentSlug));
    const start = Math.min(Math.max(0, at0 - Math.floor(win / 3)), full.length - win);
    list = full.slice(start, start + win);
  }
  const items = list.map((s) => ({
    href: `/${sd.slug}/${g.slug}/${s.slug}/`, name: s.name, seq: String(s.gRank).padStart(2, '0'),
    a: 0, b: Math.max(3, Math.round(s.x.t * 100)), val: M.chip(s), cur: s.slug === currentSlug,
  }));
  const body = SK.sched(items) + (partial ? SK.note(T.spotNearMore(sd, g)) : '');
  return frame('spotidx', partial ? T.spotNearHead(g, win, list[0].gRank) : T.spotIdxHead(g), body, at(hash(seedKey, 'sx'), SEC.spotIdxSub));
}

export function ruralList(g, seedKey) {
  if (!g.ruralCount) return '';
  return frame('rural', T.ruralHead(g), SK.names(g.rural.map((m) => m.name)), at(hash(seedKey, 'ru'), SEC.ruralSub), T.fold.rural(g.ruralCount));
}
export function dongNameList(g, seedKey) {
  if (!g.dongNames || !g.dongNames.length) return '';
  const names = shuffle(g.dongNames.slice(), hash(seedKey, 'dnl'));
  return frame('dongidx', T.dongHead(g), SK.names(names), at(hash(seedKey, 'dn'), SEC.dongSub), T.fold.dong(names.length));
}

/* ── 시도 안의 시군구 편성표 ─────────────────────────────────────── */
export function guIndex(sd, seedKey, currentSlug, { pick = 0 } = {}) {
  let list = sd.gu;
  if (pick && sd.gu.length > pick) {
    const keep = new Set(shuffle(sd.gu.map((g) => g.slug), hash(seedKey, 'gi')).slice(0, pick));
    if (currentSlug) keep.add(currentSlug);
    list = sd.gu.filter((g) => keep.has(g.slug));
  }
  list = list.slice().sort((a, b) => b.a - a.a || a.name.localeCompare(b.name, 'ko'));
  const items = list.map((g) => ({
    href: `/${sd.slug}/${g.slug}/`, name: g.name, seq: String(g.x.rank).padStart(2, '0'),
    a: 0, b: Math.max(3, Math.round(g.x.t * 100)), val: M.chip(g), cur: g.slug === currentSlug,
  }));
  const partial = list.length < sd.gu.length;
  const more = partial ? SK.note(T.guIdxMore(sd)) : '';
  return frame('guidx', T.guIdxHead(sd, list.length, partial), SK.sched(items) + more, at(hash(seedKey, 'gi'), SEC.guIdxSub), T.fold.gu(list.length));
}

/* ── 값이 닮은 시군구 ─────────────────────────────────────────── */
export function kinGu(sd, g, seedKey) {
  if (!g.kinCount) return '';
  const items = g.kin.map((t) => ({ href: `/${t.sidoSlug}/${t.slug}/`, name: t.same ? guLabel(sd.name, t.gu) : (DUPX(t.gu) ? `${SIDO_NAME[t.sidoSlug]} ${t.gu}` : t.gu), val: `${M.chip(t)}${t.same ? '' : T.otherSido}` }));
  return frame('kin2', T.kinGuHead(g), SK.tags(items), at(hash(seedKey, 'kl'), SEC.nearSub));
}

/* ── 아래쪽 안내 링크 ─────────────────────────────────────────── */
export function siteLinks(ctx, seedKey) {
  const { regions } = ctx;
  const h = hash(seedKey, 'sl');
  const all = [];
  for (const r of regions) for (const g of r.gu) for (const s of g.spots) all.push({ r, g, s });
  const spots = shuffle(all, h).slice(0, 12);
  const items = [
    ...T.alsoDocs.filter(([k]) => k !== seedKey).map(([k, t]) => ({ href: `/${k}/`, text: t })),
    ...shuffle(regions, hash(seedKey, 'sd')).map((r) => ({ href: `/${r.slug}/`, text: r.name })),
    ...spots.map((x) => ({ href: `/${x.r.slug}/${x.g.slug}/${x.s.slug}/`, text: `${x.g.name} ${x.s.name}` })),
  ];
  return frame('also', T.alsoHead, SK.inl(items), T.alsoNote);
}

export function docTopics(ctx, seedKey, heading, sub) {
  const { regions, courses } = ctx;
  const courseAll = courses.map((c) => ({ label: c.ko, href: `/course/${c.slug}/` }));
  const sidoCourse = [];
  for (const r of regions) for (const c of courses) sidoCourse.push({ label: `${r.name} ${c.ko}`, href: `/${r.slug}/course/${c.slug}/` });
  const guList = [];
  for (const r of regions) for (const g of r.gu) guList.push({ label: `${r.name} ${g.name}`, href: `/${r.slug}/${g.slug}/` });
  const deep = [];
  for (const r of regions) if (r.main) for (const g of r.gu) for (const s of g.spots) deep.push({ label: `${g.name} ${s.name}`, href: `/${r.slug}/${g.slug}/${s.slug}/` });
  const L = T.docGroups;
  return topicLinks([
    { label: L.course, items: courseAll, anchor: T.COURSE_ANCHOR },
    { label: L.sidoCourse, items: sidoCourse, pick: 12, anchor: T.COURSE_ANCHOR },
    { label: L.gu, items: guList, pick: 14, anchor: T.ANCHOR },
    { label: L.spot, items: deep, pick: 14, anchor: T.ANCHOR },
    { label: L.docs, items: T.DOC_LINKS.filter((d) => d.href !== `/${seedKey === 'coursehub' ? 'course' : seedKey}/`) },
  ], seedKey, heading, sub);
}

export { josa };
