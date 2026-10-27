/**
 * 동·읍 페이지끼리 본문이 얼마나 겹치는지 **글자수 비율**로 본다.
 * 개수로 세면 짧은 문장이 많은 쪽이 유리해 보이므로 비율로 본다.
 *   node scripts/simil.mjs [표본쌍 개수]
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.join(process.cwd(), 'dist');
const N = Number(process.argv[2] || 4000);

const pages = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === 'index.html') pages.push(p);
  }
})(DIST);
// /{시도}/{구}/{동}/index.html → 4토막
const spots = pages.filter((p) => {
  const rel = path.relative(DIST, p).split(path.sep);
  return rel.length === 4 && rel[1] !== 'course' && rel[0] !== 'magazine';
});

function body(p) {
  const s = fs.readFileSync(p, 'utf8');
  const m = s.match(/<main id="main">([\s\S]*?)<\/main>/);
  if (!m) return [];
  return m[1].replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ')
    .split(/(?<=[.!?])\s+|\n/).map((t) => t.replace(/\s+/g, ' ').trim())
    .filter((t) => t.length >= 12);
}
const S = new Map(spots.map((p) => [p, body(p)]));

// 시드 고정 — 돌릴 때마다 숫자가 흔들리면 비교를 못 한다
let seed = 20261012;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

const vals = [];
for (let i = 0; i < N; i++) {
  const a = spots[Math.floor(rnd() * spots.length)];
  const b = spots[Math.floor(rnd() * spots.length)];
  if (a === b) continue;
  const A = S.get(a), B = new Set(S.get(b));
  const tot = A.reduce((s, x) => s + x.length, 0);
  const same = A.filter((x) => B.has(x)).reduce((s, x) => s + x.length, 0);
  if (tot) vals.push((same / tot) * 100);
}
vals.sort((x, y) => x - y);
const at = (q) => vals[Math.min(vals.length - 1, Math.floor(vals.length * q))];
const mean = vals.reduce((s, x) => s + x, 0) / vals.length;
console.log(`동·읍 페이지 ${spots.length}쪽 · 표본 ${vals.length}쌍`);
console.log(`겹침 평균 ${mean.toFixed(1)}% · 중앙 ${at(0.5).toFixed(1)}% · 90분위 ${at(0.9).toFixed(1)}% · 최대 ${vals[vals.length - 1].toFixed(1)}%`);
