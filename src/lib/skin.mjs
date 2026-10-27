/**
 * 화면 마크업. 클래스는 전부 ok- 접두사. 문장은 넣지 않는다(문장은 content/ 쪽).
 * 방송 편성표 모양 — 코너 번호가 붙은 칸, 줄마다 오른쪽에 북위 눈금 막대가 달린 프로그램 줄, 라디오 다이얼 그림.
 */
import { esc, won } from './util.mjs';
export { esc };

const P = 'ok';

export const lead = (paras) => `<div class="${P}-lead">\n${paras.map((p) => `  <p>${p}</p>`).join('\n')}\n</div>`;
export const note = (html) => `<p class="${P}-note">${html}</p>`;
export const h1 = (main, sub) => `${main}<span class="${P}-h1s">${esc(sub)}</span>`;

export const stat = (rows) => `<dl class="${P}-tab">\n${rows.map((r) => `<div><dt>${esc(r[0])}</dt><dd>${r[1]}</dd></div>`).join('\n')}\n</dl>`;

export const hail = ({ place, line, tail, call }) => `<aside class="${P}-hail" aria-label="${esc(place)} 예약 문의">
  <div class="${P}-hail-t"><p>${esc(line)}</p><small>${esc(tail)}</small></div>
  <div class="${P}-hail-c">${call}</div>
</aside>`;

export const stubs = (rows, tail) => `<ol class="${P}-crs">\n${rows.map((r, i) => `<li><a href="${r.href}"><i>${r.min}분</i><b>${esc(r.ko)}</b><em>${r.price}원</em></a>${r.line ? `<small>${esc(r.line)}</small>` : ''}</li>`).join('\n')}\n</ol>\n<p class="${P}-note">${tail}</p>`;

export const steps = (list) => `<ol class="${P}-steps">\n${list.map((s) => `<li><b>${esc(s.t)}</b><p>${esc(s.d)}</p></li>`).join('\n')}\n</ol>`;

export const qa = (list) => `<div class="${P}-qa">\n${list.map((x) => `<div class="${P}-qr"><h3>${esc(x.q)}</h3><p>${esc(x.a)}</p></div>`).join('\n')}\n</div>`;

export const caution = (items) => `<ul class="${P}-caution">\n${items.map((t) => `<li>${esc(t)}</li>`).join('\n')}\n</ul>`;

export const inl = (items) => `<ul class="${P}-inl">${items.map((p) => `<li><a href="${p.href}">${esc(p.text)}</a></li>`).join('')}</ul>`;

export const rows = (groups) => `<table class="${P}-tb"><tbody>${groups.map((g) => `<tr><th scope="row">${esc(g.label)}</th><td>${inl(g.items)}</td></tr>`).join('\n')}</tbody></table>`;

export const posts = (list) => `<ul class="${P}-posts">${list.map((p) => `<li><a href="/magazine/${p.slug}/"><time datetime="${p.date}">${p.date}</time><b>${esc(p.title)}</b><span>${esc(p.summary)}</span></a></li>`).join('\n')}</ul>`;

export const themes = (groups) => `<div class="${P}-ths">${groups.map((g) => `<section class="${P}-th"><h3>${esc(g.title)}</h3><ol>${g.items.map((x) => `<li><a href="${x.href}">${esc(x.label)}</a><b>${esc(x.m)}</b></li>`).join('')}</ol></section>`).join('\n')}</div>`;

export const tags = (items) => `<ul class="${P}-tags">\n${items.map((x) => `<li><a href="${x.href}"${x.cur ? ' aria-current="page"' : ''}><span>${esc(x.name)}</span><b>${esc(x.val)}</b></a></li>`).join('\n')}\n</ul>`;

/** 편성표 줄 — 한 줄이 한 프로그램. 오른쪽 막대는 가장 북쪽 눈금(0)에서 이 줄의 눈금까지 칠한 북위 막대다. */
export const sched = (items) => `<ol class="${P}-sched">\n${items.map((x) => `<li><a href="${x.href}"${x.cur ? ' aria-current="page"' : ''}><i>${esc(x.seq)}</i><span>${esc(x.name)}</span><em class="${P}-bar" aria-hidden="true"><s style="--a:${x.a};--b:${x.b}"></s></em><b>${esc(x.val)}</b></a></li>`).join('\n')}\n</ol>`;

export const names = (list) => `<ul class="${P}-names">\n${list.map((n) => `<li>${esc(n)}</li>`).join('\n')}\n</ul>`;

export const ck = (items, neg = false) => `<ul class="${P}-ck${neg ? ` ${P}-no` : ''}">\n${items.map((t) => `<li>${esc(t)}</li>`).join('\n')}\n</ul>`;
export const ladder = (rows, top) => `<ul class="${P}-lad">${rows.map((c) => `<li><a href="/course/${c.slug}/"><span>${esc(c.ko)}</span><s style="--w:${Math.round((c.price / top) * 100)}"></s><b>${won(c.price)}원</b></a></li>`).join('\n')}</ul>`;
export const cases = (courses) => `<ul class="${P}-cases">${courses.map((c) => `<li><a href="/course/${c.slug}/"><b>${esc(c.ko)}</b><span>${esc(c.for)}</span></a></li>`).join('')}</ul>`;
export const cmp = (rows) => `<ul class="${P}-cmp">\n${rows.map((r) => {
  const inner = `<span class="${P}-cmp-n">${esc(r.ko)}</span><span class="${P}-cmp-t"><s style="--w:${r.w}"></s><em>${r.min}분</em></span><span class="${P}-cmp-p">${r.price}원</span>`;
  return `<li${r.me ? ' class="me"' : ''}>${r.me ? `<div>${inner}</div>` : `<a href="/course/${r.slug}/">${inner}</a>`}<small>${esc(r.sub)}</small></li>`;
}).join('\n')}\n</ul>`;
export const docs = (sections) => `<div class="${P}-doc">${sections.map(([t, d]) => `<section><h2>${esc(t)}</h2><p>${esc(d)}</p></section>`).join('')}</div>`;
export const piece = (html) => `<article class="${P}-piece">${html}</article>`;
export const dated = (date, label) => `<p class="${P}-dated"><time datetime="${date}">${date}</time> · ${esc(label)}</p>`;
export const x = (html) => `<p class="${P}-x">${html}</p>`;

/** 홈 상단 시도 다이얼 — 라디오 버튼 묶음. 고른 시도 쪽으로 붉은 바늘이 서고 아래 칸이 바뀐다(스크립트 없이 CSS 로만). */
export function tuner(sidos) {
  const ins = sidos.map((s, i) => `<input class="${P}-tn-r" type="radio" name="${P}-tn" id="${P}-tn-${i}"${i === 0 ? ' checked' : ''}>`).join('');
  const labs = sidos.map((s, i) => `<label class="${P}-tn-l" for="${P}-tn-${i}"><small>${esc(s.ch)}</small><b>${esc(s.name)}</b><span>${esc(s.lat)}</span></label>`).join('');
  const panes = sidos.map((s, i) => `<section class="${P}-tn-p" id="${P}-tp-${i}" aria-label="${esc(s.name)}">${s.html}</section>`).join('\n');
  return `<div class="${P}-tuner">${ins}<div class="${P}-tn-strip" role="presentation">${labs}</div><div class="${P}-tn-panes">${panes}</div></div>`;
}
