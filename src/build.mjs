/**
 * 정적 사이트 빌드. 외부 의존성 없이 Node 표준 라이브러리만 쓴다.
 *   node src/build.mjs   →  dist/
 *
 * 호스팅은 Cloudflare Workers(정적 자산)다. `_headers` 와 `_redirects` 를 dist 폴더에 떨어뜨리면 그대로 읽힌다.
 * ★`_redirects` 의 느낌표는 Netlify 전용이다. Cloudflare 파서는 못 읽으므로
 *   기준 주소를 보고 붙일지 말지를 가른다(아래 FORCE).
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { esc, won, DUP_GU, SIDO_NAME } from './lib/util.mjs';
import { spotPage, guPage, sidoPage } from './pages/region.mjs';
import { coursePage, sidoCoursePage } from './pages/course.mjs';
import {
  homePage, areaHub, guidePage, pricePage, courseHub, companyPage,
  termsPage, privacyPage, magazineIndex, postPage, notFound,
} from './pages/site.mjs';
import { POSTS } from './content/posts.mjs';
import { writeAssets, THEME } from './assets.mjs';
import { fm } from './content/metric.mjs';
import { LLMS, RSS_DESC, GENERATOR, MANIFEST_DESC } from './site.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

const cfg = read('data/site.config.json');
const courses = read('data/courses.json');
const data = read('data/regions.json');

// 호스트가 넣어 주는 주소를 먼저 쓴다(미리보기 배포에서도 canonical 이 맞는다).
//   Netlify → URL · Cloudflare Pages → CF_PAGES_URL · 직접 지정 → SITE_URL
const siteUrl = (process.env.SITE_URL || process.env.URL || process.env.CF_PAGES_URL || cfg.siteUrl).replace(/\/+$/, '');
const updated = new Date().toISOString().slice(0, 10);

const regions = data.sido;
for (const r of regions) SIDO_NAME[r.slug] = r.name;
{ const seen = new Map(); for (const r of regions) for (const g of r.gu) seen.set(g.name, (seen.get(g.name) || 0) + 1); for (const [n, k] of seen) if (k > 1) DUP_GU.add(n); }
const counts = data.counts;

const latestPosts = POSTS.slice().sort((a, b) => b.date.localeCompare(a.date))
  .slice(0, 3).map((p) => ({ ...p, path: `/magazine/${p.slug}/` }));

const ctx = { cfg, siteUrl, updated, regions, counts, courses, data, latestPosts };

/* ── 페이지 생성 ──────────────────────────────────────────────
   ★동 × 코스는 만들지 않는다. 1,232 × 9 이면 만 쪽을 넘는데 자리가 달라져도
     코스 설명이 같아서 전부 얇은 조합 페이지가 된다(doorway-thin-combo 규칙).
   ★★읍과 면은 쪽을 내지 않는다(2026-10-13 지시). 시군구 쪽 안에 이름을 모두
     적어 검색어는 받고, 접수와 방문은 똑같이 한다.
   ★서브 지역(수도권·부산 밖)은 동 쪽을 내지 않는다. 깊이를 두 층으로 갈라 둔 것이다. */
const pages = [];
pages.push(homePage(ctx));
pages.push(areaHub(ctx));
pages.push(guidePage(ctx), pricePage(ctx), courseHub(ctx), companyPage(ctx), termsPage(ctx), privacyPage(ctx));
pages.push(magazineIndex(ctx));
for (const p of POSTS) pages.push(postPage(ctx, p));
for (const c of courses) pages.push(coursePage(ctx, c));
for (const sd of regions) {
  pages.push(sidoPage(ctx, sd));
  for (const c of courses) pages.push(sidoCoursePage(ctx, sd, c));
  for (const g of sd.gu) {
    pages.push(guPage(ctx, sd, g));
    for (const s of g.spots) pages.push(spotPage(ctx, sd, g, s));
  }
}
pages.push(notFound(ctx));

/* 같은 주소가 두 번 생기지 않았는지 — 조용히 덮어써지면 찾기 어렵다. */
{
  const seen = new Map();
  for (const p of pages) seen.set(p.path, (seen.get(p.path) || 0) + 1);
  const dup = [...seen].filter(([, n]) => n > 1);
  if (dup.length) {
    console.error('★주소 중복:', dup.slice(0, 20).map(([p, n]) => `${p}×${n}`).join(', '));
    process.exit(1);
  }
}

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

/* ── 페이지별 '진짜 수정일' ───────────────────────────────────
   빌드할 때마다 전 페이지 lastmod 를 오늘로 찍으면 "매일 전 쪽이 바뀌었다"는
   거짓 신호가 된다(네이버 스팸 정책에 걸리는 종류다). 날짜 자리를 @@LM@@ 토큰으로
   비워 둔 채 본문 해시를 내고, **해시가 지난 빌드와 같으면 그때 날짜를 그대로 쓴다.**
   ★이 파일(data/lastmod.json)은 반드시 커밋해야 한다. 없이 깃에서 빌드하면
     전 쪽이 매번 '오늘 수정'으로 밀린다. */
const LM_FILE = path.join(ROOT, 'data', 'lastmod.json');
let lmPrev = {};
try { lmPrev = JSON.parse(fs.readFileSync(LM_FILE, 'utf8')); } catch { lmPrev = {}; }
const lmNext = {};
for (const pg of pages) {
  const h = crypto.createHash('md5').update(pg.html).digest('hex').slice(0, 16);
  const prev = lmPrev[pg.path];
  let date;
  if (prev && prev.h === h) date = prev.d;
  else if (!prev) {
    const m = pg.path.match(/^\/magazine\/([^/]+)\/$/);
    const post = m && POSTS.find((x) => x.slug === m[1]);
    date = post ? post.date : updated;
  } else date = updated;
  lmNext[pg.path] = { h, d: date };
  pg.lastmod = date;
  pg.html = pg.html.split('@@LM@@').join(date);
}
fs.writeFileSync(LM_FILE, JSON.stringify(lmNext));
const changedToday = pages.filter((p) => p.lastmod === updated).length;

for (const pg of pages) {
  const out = pg.path.endsWith('.html') ? path.join(DIST, pg.path) : path.join(DIST, pg.path, 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, pg.html);
}

/* ── 사이트맵 ────────────────────────────────────────────── */
const indexable = pages.filter((p) => !p.path.endsWith('.html') && !p.noindex);
function urlset(list) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${list.map((p) => {
    const depth = p.path.split('/').length;
    return `<url><loc>${siteUrl}${p.path}</loc><lastmod>${p.lastmod}</lastmod><changefreq>${p.path === '/' ? 'daily' : 'weekly'}</changefreq><priority>${p.path === '/' ? '1.0' : depth <= 3 ? '0.8' : depth === 4 ? '0.7' : '0.6'}</priority></url>`;
  }).join('\n')}
</urlset>`;
}
const sidoSlugs = regions.map((r) => r.slug);
const shards = { core: indexable.filter((p) => !sidoSlugs.some((s) => p.path.startsWith(`/${s}/`))) };
for (const sd of regions) shards[sd.slug] = indexable.filter((p) => p.path.startsWith(`/${sd.slug}/`));
for (const [k, list] of Object.entries(shards)) fs.writeFileSync(path.join(DIST, `sitemap-${k}.xml`), urlset(list));
fs.writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Object.keys(shards).map((k) => `<sitemap><loc>${siteUrl}/sitemap-${k}.xml</loc><lastmod>${updated}</lastmod></sitemap>`).join('\n')}
</sitemapindex>`);

/* ── sitemap-latest.xml ───────────────────────────────────
   최근 14일 안에 **실제로 바뀐** 쪽만 담는다. IndexNow 통보 스크립트가 이 파일을
   먼저 읽으므로 바뀐 주소가 회차 상한(사이트당 500)을 먼저 가져간다. */
const DAY = 86400000;
const latest = indexable
  .filter((p) => Date.now() - Date.parse(`${p.lastmod}T00:00:00Z`) <= 14 * DAY)
  .sort((a, b) => b.lastmod.localeCompare(a.lastmod) || a.path.length - b.path.length);
const latestList = latest.length ? latest.slice(0, 2000) : indexable.filter((p) => p.path === '/');
fs.writeFileSync(path.join(DIST, 'sitemap-latest.xml'), urlset(latestList));

/* ── RSS ─────────────────────────────────────────────────── */
const newest = POSTS.map((x) => x.date).sort().pop();
const rfc = (d) => new Date(`${d}T09:00:00+09:00`).toUTCString();
const rssItems = POSTS.slice().sort((a, b) => b.date.localeCompare(a.date)).map((p) => `  <item>
    <title>${esc(p.title)}</title>
    <link>${siteUrl}/magazine/${p.slug}/</link>
    <guid isPermaLink="true">${siteUrl}/magazine/${p.slug}/</guid>
    <pubDate>${rfc(p.date)}</pubDate>
    <description>${esc(p.summary)}</description>
  </item>`).join('\n');
fs.writeFileSync(path.join(DIST, 'rss.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${esc(cfg.rssTitle)}</title>
  <link>${siteUrl}/magazine/</link>
  <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
  <description>${esc(RSS_DESC(cfg))}</description>
  <language>ko-KR</language>
  <copyright>© ${updated.slice(0, 4)} ${esc(cfg.brand.ko)}</copyright>
  <category>북위 눈금 이용 안내</category>
  <generator>${GENERATOR}</generator>
  <docs>https://www.rssboard.org/rss-specification</docs>
  <ttl>60</ttl>
  <pubDate>${rfc(newest)}</pubDate>
  <!-- ★글이 바뀐 시각을 쓴다. 빌드 시각(new Date())을 쓰면 같은 내용인데도 파일이
       매번 달라져 '같은 주소 = 같은 응답' 이 깨진다. -->
  <lastBuildDate>${rfc(newest)}</lastBuildDate>
${rssItems}
</channel>
</rss>`);

/* ── robots.txt ──────────────────────────────────────────────
   ★Yeti 그룹을 따로 두면 Yeti 는 `*` 그룹을 **통째로 무시한다** — 규칙을 같이 적는다.
   ★Crawl-delay 는 적지 않는다(적는 순간 네이버가 그만큼 쉬엄쉬엄 긁는다).
   ★사이트맵 색인만 걸지 않고 자식 사이트맵까지 한 줄씩 건다. */
const sitemapLines = [
  `${siteUrl}/sitemap.xml`,
  `${siteUrl}/sitemap-latest.xml`,
  ...Object.keys(shards).map((k) => `${siteUrl}/sitemap-${k}.xml`),
].map((u) => `Sitemap: ${u}`).join('\n');
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: Yeti
Allow: /
Disallow: /404.html

User-agent: Yeti-Mobile
Allow: /
Disallow: /404.html

User-agent: *
Allow: /
Disallow: /404.html

${sitemapLines}
`);

/* ── llms.txt ────────────────────────────────────────────── */
const mainR = regions.filter((r) => r.main);
const subR = regions.filter((r) => !r.main);
fs.writeFileSync(path.join(DIST, 'llms.txt'), LLMS({ cfg, siteUrl, regions, courses, counts, data, mainR, subR, won, fm }));

/* ── _headers · _redirects (Netlify·Cloudflare 둘 다 그대로 읽는다) ── */
fs.writeFileSync(path.join(DIST, '_headers'), `/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=(), interest-cohort=()
  Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/sitemap.xml
  Content-Type: application/xml; charset=utf-8
  Cache-Control: public, max-age=300, must-revalidate
/sitemap-*.xml
  Content-Type: application/xml; charset=utf-8
  Cache-Control: public, max-age=300, must-revalidate
/rss.xml
  Content-Type: application/rss+xml; charset=utf-8
  Cache-Control: public, max-age=300, must-revalidate
/robots.txt
  Content-Type: text/plain; charset=utf-8
  Cache-Control: public, max-age=300, must-revalidate
/llms.txt
  Content-Type: text/plain; charset=utf-8
/*.txt
  Content-Type: text/plain; charset=utf-8
`);

// ★느낌표는 '파일이 실제로 있어도 리다이렉트하라'는 뜻이다. dist/index.html 이
//   있으므로 Netlify 에서는 이게 없으면 /index.html 이 그대로 열려 주소가 둘로 갈린다.
//   반대로 Cloudflare 파서는 느낌표를 모른다 — 그래서 기준 주소를 보고 갈라 쓴다.
const FORCE = siteUrl.includes('netlify.app') ? '!' : '';
fs.writeFileSync(path.join(DIST, '_redirects'), `/index.html   /   301${FORCE}
`);

fs.writeFileSync(path.join(DIST, 'site.webmanifest'), JSON.stringify({
  name: `${cfg.brand.ko} 출장마사지`, short_name: cfg.brand.ko,
  description: MANIFEST_DESC(counts),
  start_url: '/', display: 'standalone',
  background_color: THEME.paper, theme_color: THEME.olive,
  lang: 'ko-KR', icons: [{ src: '/assets/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
}, null, 2));

/* IndexNow(네이버 웹페이지 수집 요청) 키 파일 — 루트에 그대로 떨어져야 통보가 받아들여진다.
   ★키는 사이트마다 달라야 한다(남의 키를 함께 쓰면 403 이 떨어진다). */
if (cfg.indexNowKey) fs.writeFileSync(path.join(DIST, `${cfg.indexNowKey}.txt`), cfg.indexNowKey);

writeAssets(DIST, cfg);

const bytes = (function size(dir) {
  let t = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    t += e.isDirectory() ? size(p) : fs.statSync(p).size;
  }
  return t;
})(DIST);

console.log(`빌드 완료 · 페이지 ${pages.length} · 사이트맵 ${indexable.length} URL · ${(bytes / 1024 / 1024).toFixed(1)}MB`);
console.log(`  시도 ${counts.sido}(동 ${counts.sidoMain}) · 시군구 ${counts.gu} · 동 ${counts.spot} · 읍 ${counts.eup}·면 ${counts.myeon}(이름만) · 기준 주소 ${siteUrl}`);
console.log(`  오늘 날짜가 찍힌 쪽 ${changedToday} / ${pages.length} · 최근 14일 ${latestList.length}쪽을 sitemap-latest 에`);
