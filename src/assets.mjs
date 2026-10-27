import fs from 'node:fs';
import path from 'node:path';

/* 쪽빛 남색 유리판 위에 크림색 눈금, 붉은 바늘 하나. 방송국 편성표 + 라디오 다이얼. */
export const THEME = {
  bg: '#E4E8F5', paper: '#FFFFFF', ink: '#12172E', dim: '#464E70',
  navy: '#0F226B', navyDk: '#0A1747', navyMid: '#2E318A', navySoft: '#E8ECF8',
  red: '#E5322D', redDk: '#B3201C', cream: '#C9D2F5',
  line: '#A9B2D4', lineSoft: '#D2D8EC', onAcc: '#FFFFFF',
};

const CSS = (t) => `:root{
  --bg:${t.bg};--paper:${t.paper};--ink:${t.ink};--dim:${t.dim};--navy:${t.navy};--navyDk:${t.navyDk};--navyMid:${t.navyMid};--navySoft:${t.navySoft};
  --red:${t.red};--redDk:${t.redDk};--cream:${t.cream};--line:${t.line};--lineSoft:${t.lineSoft};--onAcc:${t.onAcc};
  --sans:system-ui,-apple-system,"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif;
  --mono:ui-monospace,"SFMono-Regular",Menlo,Consolas,"Courier New",monospace;
}
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;color-scheme:light;background:var(--bg)}
body{margin:0;font-family:var(--sans);color:var(--ink);background:var(--bg);line-height:1.75;font-size:15.5px;padding:10px 10px 96px;counter-reset:corner}
img,svg{max-width:100%}
a{color:var(--navy);text-decoration:underline;text-decoration-color:rgba(15,34,107,.38);text-underline-offset:3px}
a:hover{text-decoration-color:currentColor}
:focus-visible{outline:3px solid var(--redDk);outline-offset:2px}
strong{font-weight:800}
.ok-hop{position:absolute;left:-9999px}
.ok-hop:focus{position:fixed;left:12px;top:12px;z-index:70;background:#fff;color:var(--ink);padding:10px 16px;border:2px solid var(--navy)}
.ok-deck{max-width:1000px;margin:0 auto;background:var(--paper);border:2px solid var(--navyDk);border-radius:10px 10px 0 0;overflow:hidden}
main{display:block;min-width:0}

/* ── 방송국 로고 띠 ──────────────────────────── */
.ok-top{background:var(--navyDk);color:var(--cream)}
.ok-band{display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;gap:10px 22px;align-items:center;padding:12px 18px}
.ok-brand{display:flex;flex-wrap:wrap;align-items:center;gap:0 10px;color:#fff;text-decoration:none}
.ok-brand:hover{text-decoration:none}
.ok-mk{width:40px;height:40px;flex:none}
.ok-brand b{font-size:23px;font-weight:800;letter-spacing:-.04em;line-height:1.2}
.ok-brand small{flex-basis:100%;margin-left:50px;margin-top:-4px;font-family:var(--mono);font-size:10.5px;letter-spacing:.3em;color:var(--cream)}
.ok-air{margin:0;display:flex;align-items:center;gap:8px;min-width:0;justify-self:start;padding:5px 14px 5px 10px;border:1px solid rgba(201,210,245,.4);border-radius:999px;background:rgba(255,255,255,.06)}
.ok-lamp{display:block;width:12px;height:12px;border-radius:50%;background:var(--red);box-shadow:0 0 0 3px rgba(229,50,45,.28),0 0 10px 2px rgba(229,50,45,.7);flex:none;animation:ok-glow 2.4s ease-in-out infinite}
@keyframes ok-glow{0%,100%{opacity:1}50%{opacity:.55}}
@media (prefers-reduced-motion:reduce){.ok-lamp{animation:none}}
.ok-air strong{font-family:var(--mono);font-size:12px;letter-spacing:.14em;color:#fff}
.ok-air-p{font-size:13.5px;font-weight:700;color:var(--cream);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.ok-meta{margin:0;display:flex;gap:4px 16px}
.ok-meta>div{min-width:0}
.ok-meta dt{margin:0;font-size:10.5px;letter-spacing:.12em;color:#9DAAE6;font-weight:700}
.ok-meta dd{margin:0;font-size:12.5px;font-weight:800;color:#fff;line-height:1.4;white-space:nowrap}
.ok-top .callbox{background:#fff;color:var(--navy);border-bottom-color:var(--red)}
.ok-top .callbox:hover{background:var(--navySoft)}
.ok-chan{background:var(--navy);border-top:1px solid rgba(201,210,245,.25)}
.ok-chan ol{margin:0;padding:0 12px;list-style:none;display:flex;flex-wrap:wrap;counter-reset:ch}
.ok-chan li{counter-increment:ch}
.ok-chan a{display:flex;align-items:baseline;gap:6px;padding:8px 14px 7px;color:var(--cream);font-size:14px;font-weight:700;text-decoration:none;border-bottom:3px solid transparent}
.ok-chan a::before{content:"CH " counter(ch);font-family:var(--mono);font-size:10.5px;letter-spacing:.06em;color:#8E9CE0}
.ok-chan a:hover{color:#fff;background:rgba(255,255,255,.07)}
.ok-chan a[aria-current]{color:#fff;border-bottom-color:var(--red);background:rgba(255,255,255,.1)}
@media (max-width:900px){
  .ok-band{grid-template-columns:minmax(0,1fr) auto}
  .ok-air{grid-column:1/-1;order:3;justify-self:stretch}
  .ok-meta{grid-column:1/-1;order:4;flex-wrap:wrap}
}
@media (max-width:520px){.ok-brand b{font-size:20px}.ok-chan a{padding:7px 9px 6px;font-size:13px}.ok-chan a::before{display:none}}

/* ── 현재 위치 ──────────────────────────────── */
.ok-way{padding:6px 18px;border-bottom:1px solid var(--lineSoft);background:#F3F5FC}
.ok-way ol{margin:0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:2px 0;font-size:12.5px;color:var(--dim)}
.ok-way li+li::before{content:"▸";margin:0 8px;color:var(--line)}
.ok-way a{color:var(--dim)}
.ok-way [aria-current]{font-weight:800;color:var(--ink)}

.ok-h1{font-size:clamp(22px,5.4vw,31px);line-height:1.32;margin:0;padding:18px 18px 14px 28px;font-weight:800;letter-spacing:-.04em;word-break:keep-all;border-bottom:1px solid var(--line);position:relative}
.ok-h1::before{content:"";position:absolute;left:0;top:0;bottom:0;width:10px;background:var(--navy);box-shadow:inset -4px 0 0 var(--red)}
.ok-h1s{display:block;margin-top:6px;font-size:14px;font-weight:600;color:var(--navyMid);letter-spacing:0;line-height:1.6}

/* ── 코너 칸 — 왼쪽은 시간대 칸 ─────────────── */
.ok-sec{display:grid;grid-template-columns:132px minmax(0,1fr);border-bottom:1px solid var(--line);counter-increment:corner}
.ok-kick{margin:0;padding:12px 12px 14px;background:var(--navySoft);border-right:1px solid var(--line);position:relative}
.ok-kick::before{content:"코너 " counter(corner,decimal-leading-zero);display:block;font-family:var(--mono);font-size:11px;letter-spacing:.1em;color:var(--navyMid);font-weight:700}
.ok-kick::after{content:"";position:absolute;right:-5px;top:16px;width:9px;height:9px;border-radius:50%;background:var(--navy);border:2px solid #fff;box-shadow:0 0 0 1px var(--navy)}
.ok-kick h2{margin:5px 0 0;font-size:14.5px;line-height:1.5;font-weight:800;letter-spacing:-.03em;word-break:keep-all;color:var(--navyDk)}
.ok-col{min-width:0;padding:14px 18px 16px}
.ok-sub{margin:0 0 10px;color:var(--dim);font-size:13.5px;line-height:1.65}
@media (max-width:760px){
  .ok-sec{grid-template-columns:1fr}
  .ok-kick{border-right:0;border-bottom:1px solid var(--line);display:flex;align-items:baseline;gap:10px;padding:9px 14px}
  .ok-kick::after{display:none}
  .ok-kick h2{margin:0}
  .ok-col{padding:12px 14px 14px}
}

/* ── 안내 말씀 칸 ────────────────────────────── */
.ok-lead{margin:0;display:grid;grid-template-columns:96px minmax(0,1fr);border-bottom:1px solid var(--line);font-size:15.5px}
.ok-lead::before{content:"안내 말씀";grid-column:1;grid-row:1/span 6;padding:14px 8px;background:var(--navy);color:#fff;font-weight:800;font-size:13px;letter-spacing:.18em;text-align:center}
.ok-lead>p{grid-column:2;margin:0;padding:12px 18px 0}
.ok-lead>p:last-child{padding-bottom:14px}
.ok-sec .ok-lead{display:block;border-bottom:0;font-size:15px}
.ok-sec .ok-lead::before{display:none}
.ok-sec .ok-lead>p{padding:0 0 .8em}
.ok-sec .ok-lead>p:last-child{padding-bottom:0}
@media (max-width:760px){.ok-lead{grid-template-columns:1fr}.ok-lead::before{grid-row:auto;padding:6px 14px;text-align:left}.ok-lead>p{grid-column:1;padding:10px 14px 0}}
.ok-note{margin:12px 0 0;padding:7px 12px;border-left:4px solid var(--red);background:var(--navySoft);font-size:13.5px;line-height:1.7}
.ok-x{margin:10px 0 0;color:var(--dim);font-size:13.5px}

/* ── 송출 정보표 ──────────────────────────────── */
.ok-tab{margin:12px 0 0;border:1px solid var(--line);border-radius:6px;overflow:hidden}
.ok-tab>div{display:grid;grid-template-columns:minmax(120px,190px) minmax(0,1fr);border-bottom:1px solid var(--lineSoft)}
.ok-tab>div:last-child{border-bottom:0}
.ok-tab dt{margin:0;padding:7px 10px;background:var(--navyDk);font-size:12.5px;font-weight:700;color:var(--cream);word-break:keep-all}
.ok-tab dd{margin:0;padding:7px 12px;font-weight:800;font-size:15px;line-height:1.5;min-width:0}
.ok-tab small{display:block;font-weight:400;color:var(--dim);font-size:12.5px;line-height:1.55}
@media (max-width:520px){.ok-tab>div{grid-template-columns:1fr}}

/* ── 라디오 다이얼 ───────────────────────────── */
.ok-dl-fig{margin:0;display:grid;gap:8px;justify-items:start}
.ok-dl-svg{width:100%;max-width:520px;height:auto;display:block}
.ok-dl-glass{fill:var(--navyDk);stroke:var(--navyMid);stroke-width:1.5}
.ok-dl-axis{stroke:#8F9BD6;stroke-width:1.4;fill:none}
.ok-dl-tk{stroke:#8F9BD6;stroke-width:1.2;fill:none}
.ok-dl-nd{stroke:var(--cream);stroke-width:1.3;fill:none;stroke-linecap:round}
.ok-dl-cur{stroke:var(--red);stroke-width:3.4;fill:none;stroke-linecap:round}
.ok-dl-cap{fill:var(--red)}
.ok-dl-n{font-family:var(--mono);font-size:9px;fill:#B6C1F2}
.ok-dl-e{font-family:var(--mono);font-size:10px;fill:#9DAAE6;font-weight:700}
.ok-dl-v{font-family:var(--mono);font-size:12px;fill:#fff;font-weight:800}
.ok-dl-fig figcaption p{margin:0;color:var(--dim);font-size:13px;line-height:1.65}
.ok-dl-mini{display:block}
.ok-dl-mini .ok-dl-svg{max-width:124px;margin:0 0 2px}

/* ── 접수 창구 ───────────────────────────────── */
.ok-hail{display:grid;gap:10px;margin:0;padding:26px 18px 16px;border-bottom:1px solid var(--line);background:var(--navySoft);text-align:center;position:relative}
.ok-hail::before{content:"접수 창구 방송";position:absolute;left:0;top:0;padding:2px 12px;background:var(--navy);color:#fff;font-size:11.5px;font-weight:700;letter-spacing:.14em}
.ok-hail::after{content:"";position:absolute;right:14px;top:9px;width:9px;height:9px;border-radius:50%;background:var(--red);box-shadow:0 0 8px 1px rgba(229,50,45,.7)}
.ok-hail p{margin:0;font-weight:800;font-size:15.5px;line-height:1.55}
.ok-hail small{display:block;margin-top:4px;color:var(--dim);font-size:12.5px;line-height:1.6}
.ok-hail-t{padding-top:2px}
.ok-hail-c{justify-self:center}
.callbox{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;background:var(--navy);color:var(--onAcc);line-height:1.15;text-decoration:none;border-bottom:3px solid var(--red);border-radius:4px}
.callbox:hover{text-decoration:none;background:var(--navyMid)}
.callbox-k{font-size:11px;letter-spacing:.12em;font-weight:700}
.callbox-v{font-weight:800;letter-spacing:.02em}
.callbox-s{padding:5px 20px}.callbox-s .callbox-v{font-size:15px}
.callbox-m{padding:9px 24px}.callbox-m .callbox-v{font-size:19px}
.callbox-l{padding:10px 30px}.callbox-l .callbox-v{font-size:22px}

/* ── 편성표 줄 ───────────────────────────────── */
.ok-sched{list-style:none;margin:0;padding:0;border:1px solid var(--line);border-radius:6px;overflow:hidden}
.ok-sched li{border-bottom:1px solid var(--lineSoft)}
.ok-sched li:last-child{border-bottom:0}
.ok-sched a{display:grid;grid-template-columns:34px minmax(70px,170px) minmax(60px,1fr) 56px;gap:10px;align-items:center;padding:5px 10px 5px 6px;color:var(--ink);font-size:14px;text-decoration:none}
.ok-sched a:hover{background:var(--navySoft)}
.ok-sched a[aria-current]{background:var(--navySoft);box-shadow:inset 4px 0 0 var(--red);font-weight:800}
.ok-sched i{font-style:normal;font-family:var(--mono);font-size:11px;font-weight:700;text-align:center;color:#fff;background:var(--navyMid);border-radius:3px;padding:2px 0}
.ok-sched span{min-width:0;overflow-wrap:anywhere}
.ok-bar{display:block;position:relative;height:12px;border-radius:2px;background:repeating-linear-gradient(90deg,var(--lineSoft) 0 1px,transparent 1px 10%) ,var(--navySoft)}
.ok-bar s{display:block;position:absolute;top:3px;bottom:3px;left:calc(var(--a) * 1%);width:calc((var(--b) - var(--a)) * 1%);min-width:3px;text-decoration:none;background:var(--navy);border-radius:2px}
.ok-bar s::after{content:"";position:absolute;right:-1px;top:-4px;bottom:-4px;width:3px;background:var(--red);border-radius:1px}
.ok-sched b{font-size:12px;color:var(--dim);text-align:right;font-family:var(--mono)}
@media (max-width:520px){.ok-sched a{grid-template-columns:30px minmax(0,1fr) 52px;grid-template-areas:"s n v" "b b b"}.ok-sched i{grid-area:s}.ok-sched span{grid-area:n}.ok-sched b{grid-area:v}.ok-sched .ok-bar{grid-area:b}}

/* ── 코스 프로그램 줄 ───────────────────────── */
.ok-crs{list-style:none;margin:0;padding:0;border:1px solid var(--line);border-radius:6px;overflow:hidden}
.ok-crs li{border-bottom:1px solid var(--lineSoft)}
.ok-crs li:last-child{border-bottom:0}
.ok-crs a{display:grid;grid-template-columns:64px minmax(0,1fr) auto;gap:12px;align-items:center;color:var(--ink);text-decoration:none;padding:6px 10px 6px 0}
.ok-crs a:hover{background:var(--navySoft)}
.ok-crs i{font-style:normal;font-family:var(--mono);font-size:12px;font-weight:700;color:var(--cream);background:var(--navyDk);text-align:center;padding:7px 0;align-self:stretch;display:flex;align-items:center;justify-content:center}
.ok-crs b{font-size:15.5px;font-weight:800}
.ok-crs em{font-style:normal;font-weight:800;font-size:14px;font-family:var(--mono)}
.ok-crs small{display:block;padding:0 12px 7px 76px;color:var(--dim);font-size:12.5px;line-height:1.6}

/* ── 접수 순서 ───────────────────────────────── */
.ok-steps{list-style:none;margin:0;padding:0;counter-reset:stp;border-left:3px solid var(--navy)}
.ok-steps li{counter-increment:stp;display:grid;grid-template-columns:minmax(120px,180px) minmax(0,1fr);border-bottom:1px solid var(--lineSoft);position:relative}
.ok-steps li::before{content:counter(stp);position:absolute;left:-14px;top:9px;width:22px;height:22px;border-radius:50%;background:var(--red);color:#fff;font-size:12px;font-weight:800;text-align:center;line-height:22px;font-family:var(--mono)}
.ok-steps b{padding:8px 10px 8px 18px;font-size:14px;color:var(--navyDk);word-break:keep-all}
.ok-steps p{margin:0;padding:8px 12px;font-size:13.5px;color:var(--dim);line-height:1.68}
@media (max-width:520px){.ok-steps li{grid-template-columns:1fr}}

/* ── 질문과 답 ───────────────────────────────── */
.ok-qa{counter-reset:q}
.ok-qr{counter-increment:q;padding:9px 4px 10px 10px;border-bottom:1px dashed var(--line);border-left:3px solid var(--navySoft)}
.ok-qr h3{margin:0 0 3px;font-size:15px;font-weight:800;line-height:1.55}
.ok-qr h3::before{content:"Q" counter(q) " ";color:var(--redDk);font-family:var(--mono);font-size:13px}
.ok-qr p{margin:0;padding-left:20px;font-size:14.5px}

/* ── 주의 ─────────────────────────────────────── */
.ok-caution{list-style:none;margin:0;padding:0}
.ok-caution li{padding:7px 8px 7px 30px;font-size:14px;position:relative;line-height:1.7;border-bottom:1px dashed var(--line)}
.ok-caution li::before{content:"!";position:absolute;left:6px;top:9px;width:16px;height:16px;border-radius:50%;background:var(--navy);color:#fff;font-size:11px;font-weight:800;text-align:center;line-height:16px}

/* ── 링크 묶음 ────────────────────────────────── */
.ok-inl{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:4px 14px}
.ok-inl a{display:block;padding:2px 0;font-size:13.5px;color:var(--ink);text-decoration:none}
.ok-inl a::before{content:"▸ ";color:var(--red)}
.ok-inl a:hover{text-decoration:underline}
.ok-tb{width:100%;border-collapse:collapse}
.ok-tb th,.ok-tb td{padding:6px 0;vertical-align:top;text-align:left;display:block}
.ok-tb th{font-size:12px;font-weight:800;color:var(--navyMid);padding-bottom:2px}
.ok-tb tr{display:block;border-bottom:1px dashed var(--line);padding:2px 0 4px}
.ok-tags{list-style:none;margin:0;padding:0;display:grid;gap:4px 10px;grid-template-columns:repeat(auto-fill,minmax(160px,1fr))}
.ok-tags a{display:flex;align-items:baseline;gap:6px;padding:3px 6px;color:var(--ink);font-size:14px;text-decoration:none;border:1px solid var(--lineSoft);border-radius:4px}
.ok-tags span{font-weight:700}
.ok-tags b{margin-left:auto;font-size:11.5px;color:var(--dim);white-space:nowrap;font-family:var(--mono)}
.ok-tags a:hover{background:var(--navySoft)}
.ok-tags a[aria-current]{background:var(--navy);color:#fff;border-color:var(--navy)}
.ok-tags a[aria-current] b{color:var(--cream)}
.ok-names{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:3px 12px;font-size:13.5px}
.ok-names li::before{content:"▪ ";color:var(--navyMid)}

/* ── 글 목록 ─────────────────────────────────── */
.ok-posts{list-style:none;margin:0;padding:0}
.ok-posts a{display:block;padding:8px 6px;color:var(--ink);text-decoration:none;border-bottom:1px dashed var(--line)}
.ok-posts a:hover{background:var(--navySoft)}
.ok-posts time{display:block;font-size:11.5px;color:var(--dim);font-family:var(--mono)}
.ok-posts b{display:block;font-size:15px;line-height:1.5}
.ok-posts span{display:block;color:var(--dim);font-size:13px;line-height:1.6}

/* ── 북위가 가까운 곳 ────────────────────────── */
.ok-ths{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(250px,1fr))}
.ok-th{border:1px solid var(--line);border-radius:6px;overflow:hidden}
.ok-th h3{margin:0;padding:5px 10px;font-size:13px;font-weight:800;color:#fff;background:var(--navy)}
.ok-th ol{list-style:none;margin:0;padding:4px 10px 6px;display:grid;gap:2px;counter-reset:th}
.ok-th li{display:flex;justify-content:space-between;gap:8px;font-size:14px;counter-increment:th}
.ok-th li::before{content:counter(th);color:var(--redDk);font-family:var(--mono);font-size:11px;margin-right:6px;align-self:center}
.ok-th li a{margin-right:auto}
.ok-th b{font-size:11.5px;color:var(--dim);font-weight:700;white-space:nowrap;font-family:var(--mono)}

/* ── 문서·금액 ───────────────────────────────── */
.ok-ck{list-style:none;margin:0;padding:0}
.ok-ck li{padding:6px 6px 6px 30px;position:relative;font-size:14.5px;border-bottom:1px dashed var(--line)}
.ok-ck li::before{content:"✓";position:absolute;left:8px;top:5px;font-weight:800;color:var(--navy)}
.ok-no li::before{content:"✕";color:var(--redDk)}
.ok-lad{list-style:none;margin:0;padding:0;border:1px solid var(--line);border-radius:6px;overflow:hidden}
.ok-lad a{display:grid;grid-template-columns:80px minmax(0,1fr) 88px;gap:10px;align-items:center;color:var(--ink);padding:5px 8px;font-size:14px;text-decoration:none;border-bottom:1px solid var(--lineSoft)}
.ok-lad li:last-child a{border-bottom:0}
.ok-lad a:hover{background:var(--navySoft)}
.ok-lad s{display:block;height:8px;width:calc(var(--w) * 1%);text-decoration:none;background:var(--navy);border-right:3px solid var(--red)}
.ok-lad b{text-align:right;font-weight:800;font-size:13.5px;font-family:var(--mono)}
.ok-cases{list-style:none;margin:0;padding:0;display:grid;gap:0 16px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}
.ok-cases a{display:block;padding:7px 6px;color:var(--ink);text-decoration:none;border-bottom:1px dashed var(--line)}
.ok-cases a:hover{background:var(--navySoft)}
.ok-cases b{display:block}.ok-cases span{color:var(--dim);font-size:13px}
.ok-cmp{list-style:none;margin:0;padding:0}
.ok-cmp li{padding:5px 6px;border-bottom:1px dashed var(--line)}
.ok-cmp li>a,.ok-cmp li>div{display:grid;grid-template-columns:64px minmax(0,1fr) 84px;gap:8px;align-items:center;color:var(--ink);text-decoration:none}
.ok-cmp li>a:hover{background:var(--navySoft)}
.ok-cmp li.me{background:var(--navySoft);box-shadow:inset 4px 0 0 var(--red)}
.ok-cmp-n{font-weight:800;font-size:14px}
.ok-cmp-t{display:flex;align-items:center;gap:6px}
.ok-cmp-t s{display:block;height:8px;width:calc(var(--w) * 1%);text-decoration:none;background:var(--navy);border-radius:2px}
.ok-cmp-t em{font-style:normal;font-size:11.5px;color:var(--dim)}
.ok-cmp-p{text-align:right;font-weight:800;font-size:13px;font-family:var(--mono)}
.ok-cmp small{display:block;color:var(--dim);font-size:12px}
.ok-doc section{padding:8px 0;border-bottom:1px dashed var(--line)}
.ok-doc h2{font-size:14.5px;margin:0 0 2px;color:var(--navyDk)}
.ok-doc p{margin:0;font-size:14px}
.ok-piece{padding:18px 20px;margin:0;border-bottom:1px solid var(--line)}
.ok-piece h2{font-size:17px;margin:1.3em 0 .4em;padding-bottom:3px;border-bottom:2px solid var(--red)}
.ok-piece p,.ok-piece ul{margin:0 0 .9em}
.ok-piece ul{padding-left:1.2em}
.ok-dated{color:var(--dim);font-size:12.5px;margin:0;padding:8px 18px;border-bottom:1px solid var(--lineSoft);font-family:var(--mono)}

/* ── 첫 화면 첫 코너 ─────────────────────────── */
.ok-door{padding:18px 18px 16px;border-bottom:1px solid var(--line);display:grid;gap:4px 24px;grid-template-columns:minmax(0,1fr) minmax(0,1fr);background:linear-gradient(var(--red),var(--red)) 0 0/100% 4px no-repeat}
.ok-door>*{grid-column:1/-1}
.ok-door-sl{margin:6px 0 8px;font-size:18px;font-weight:800;line-height:1.5;letter-spacing:-.03em;word-break:keep-all;color:var(--navyDk)}
.ok-door-p{margin:0 0 12px;color:var(--dim);font-size:14.5px}
.ok-door-cta{margin:0 0 12px}
.ok-door-fig{margin:0 0 4px;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:var(--navySoft)}
.ok-door-f{margin:0 0 12px;display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));border:1px solid var(--line);border-radius:6px;overflow:hidden}
.ok-door-f>div{padding:7px 10px;border-right:1px solid var(--lineSoft)}
.ok-door-f>div:last-child{border-right:0}
.ok-door-f dt{margin:0;font-size:12px;color:var(--dim);font-weight:700}
.ok-door-f dd{margin:0;font-weight:800;font-size:14px}
.ok-door-cap{margin:0 0 4px;font-size:12.5px;font-weight:700;color:var(--navyMid)}

/* ── 시도 다이얼(스크립트 없이 라디오 버튼으로) ───────── */
.ok-tuner{position:relative}
.ok-tn-r{position:absolute;opacity:0;width:1px;height:1px;pointer-events:none}
.ok-tn-strip{position:relative;display:flex;overflow-x:auto;background:var(--navyDk);border:2px solid var(--navyMid);border-radius:8px;padding:20px 6px 6px;scroll-snap-type:x proximity}
.ok-tn-strip::before{content:"";position:absolute;left:8px;right:8px;top:7px;height:8px;background:repeating-linear-gradient(90deg,rgba(201,210,245,.7) 0 1px,transparent 1px 9px)}
.ok-tn-l{position:relative;flex:0 0 auto;min-width:78px;display:grid;justify-items:center;gap:0;padding:6px 8px 7px;color:var(--cream);cursor:pointer;border-left:1px solid rgba(201,210,245,.2);scroll-snap-align:center;line-height:1.4}
.ok-tn-l:first-child{border-left:0}
.ok-tn-l small{font-family:var(--mono);font-size:10px;letter-spacing:.06em;color:#8E9CE0}
.ok-tn-l b{font-size:15px;font-weight:800;color:inherit}
.ok-tn-l span{font-family:var(--mono);font-size:11px;color:#B6C1F2}
.ok-tn-l:hover{background:rgba(255,255,255,.07)}
.ok-tn-p{display:none;padding:12px 2px 2px}
.ok-fold>summary{cursor:pointer;font-size:12.5px;font-weight:800;color:var(--navyMid);padding:5px 0;list-style:none}
.ok-fold>summary::-webkit-details-marker{display:none}
.ok-fold>summary::before{content:"▾ "}
.ok-fold[open]>summary::before{content:"▴ "}
.ok-fold[open]>summary{margin-bottom:6px}

/* ── 갈래 견본표 ─────────────────────────────── */
.ok-sp{width:100%;border-collapse:collapse}
.ok-sp th,.ok-sp td{padding:8px 0;vertical-align:top;text-align:left;display:block}
.ok-sp tr{display:block;margin:0;padding:4px 6px;border-bottom:1px dashed var(--line)}
.ok-sp th b{font-size:15px;font-weight:800;margin-right:8px}
.ok-sp th em{font-style:normal;font-size:12px;color:var(--navyMid);font-weight:700}
.ok-sp th .ok-dl{display:block;float:left;margin:0 10px 0 0}
.ok-sp small{display:block;color:var(--dim);font-size:12.5px;margin-bottom:3px;line-height:1.6}
.ok-sp ol{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:2px 14px}
.ok-sp ol li{font-size:13.5px}
.ok-sp ol b{margin-left:5px;font-size:11.5px;color:var(--dim);font-family:var(--mono)}
.ok-sp tr::after{content:"";display:block;clear:both}

/* ── 채널 안내 바닥글 ─────────────────────────── */
.ok-foot{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));background:var(--navyDk);color:var(--cream);border-top:4px solid var(--red)}
@media (max-width:820px){.ok-foot{grid-template-columns:1fr}}
.ok-fc{padding:14px 16px 10px;border-right:1px solid rgba(201,210,245,.18)}
.ok-fc:nth-child(3){border-right:0}
@media (max-width:820px){.ok-fc{border-right:0;border-bottom:1px solid rgba(201,210,245,.18)}}
.ok-fc h2{font-size:12.5px;margin:10px 0 5px;color:#fff;font-weight:800;padding-bottom:2px;border-bottom:1px solid rgba(201,210,245,.3);letter-spacing:.04em}
.ok-fc h2:first-of-type{margin-top:0}
.ok-fc p{margin:0 0 9px;font-size:13.5px}
.ok-fc a{color:#fff}
.ok-chips{display:flex;flex-wrap:wrap;gap:4px 8px}
.ok-chips a{display:inline-flex;align-items:baseline;gap:5px;font-size:12.5px;text-decoration:none;padding:1px 7px;border:1px solid rgba(201,210,245,.35);border-radius:4px}
.ok-chips a i{font-style:normal;font-family:var(--mono);font-size:10px;color:#8E9CE0}
.ok-chips a:hover{background:rgba(255,255,255,.1)}
.ok-fl{list-style:none;margin:0 0 9px;padding:0;font-size:13px}
.ok-fl li{display:grid;padding:3px 0}
.ok-fl time,.ok-fs{font-size:12px;color:#B6C1F2}
.ok-foot-end{grid-column:1/-1;padding:8px 16px 12px;font-size:12px;background:#07102F}
.ok-foot-end p{margin:0 0 6px}
.ok-pale{opacity:.9}
.ok-ai{padding-top:8px;border-top:1px dashed rgba(201,210,245,.3);line-height:1.8}
.ok-cr,.ok-biz{font-size:12px}
.ok-foot .callbox{background:#fff;color:var(--navy)}

/* ── 아래에 붙는 접수 띠 ──────────────────────── */
.ok-dock{position:fixed;left:0;right:0;bottom:0;z-index:40;display:flex;align-items:center;justify-content:center;gap:14px;padding:8px 14px calc(8px + env(safe-area-inset-bottom));background:var(--navyDk);border-top:3px solid var(--red);box-shadow:0 -3px 10px rgba(7,16,47,.4);transition:transform .2s}
.ok-dock.hide{transform:translateY(130%)}
.ok-dock-s{font-size:12.5px;font-weight:700;color:var(--cream)}
.ok-dock .callbox{background:#fff;color:var(--navy)}
@media (max-width:480px){.ok-dock{gap:8px}.ok-dock-s{font-size:11.5px}}
${Array.from({ length: 20 }, (_, i) => `#ok-tn-${i}:checked~.ok-tn-strip label[for=ok-tn-${i}]{background:var(--navyMid);color:#fff;box-shadow:inset 0 -3px 0 var(--red)}
#ok-tn-${i}:checked~.ok-tn-strip label[for=ok-tn-${i}]::after{content:"";position:absolute;left:50%;top:-16px;bottom:0;width:2px;margin-left:-1px;background:var(--red)}
#ok-tn-${i}:focus-visible~.ok-tn-strip label[for=ok-tn-${i}]{outline:3px solid #fff;outline-offset:-3px}
#ok-tn-${i}:checked~.ok-tn-panes #ok-tp-${i}{display:block}`).join('\n')}
`;

const JS = `(function(){
  var d=document.querySelector('.ok-dock'),f=document.querySelector('.ok-foot');
  if(!d||!f||!('IntersectionObserver' in window))return;
  new IntersectionObserver(function(es){
    es.forEach(function(e){d.classList.toggle('hide',e.isIntersecting);});
  },{rootMargin:'0px 0px -40px 0px'}).observe(f);
})();`;

/* 마크 — 쪽빛 판에 반원 다이얼 눈금과 붉은 바늘 하나 */
const MK = '<rect x="1" y="1" width="38" height="38" rx="8" fill="#0F226B" stroke="#C9D2F5" stroke-width="1.6"/><path d="M8 27a12 12 0 0 1 24 0" fill="none" stroke="#C9D2F5" stroke-width="2" stroke-dasharray="1.6 3.1"/><path d="M20 27L27 13" stroke="#E5322D" stroke-width="3.2" stroke-linecap="round"/><circle cx="20" cy="27" r="3" fill="#fff"/>';
export const MARK = () => `<svg class="ok-mk" viewBox="0 0 40 40" aria-hidden="true" focusable="false">${MK}</svg>`;
const FAVICON = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">${MK}</svg>`;
const LOGO = (cfg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 48"><rect width="330" height="48" fill="#0A1747"/><g transform="translate(4 4)">${MK}</g><text x="52" y="31" font-family="sans-serif" font-size="23" font-weight="800" fill="#FFFFFF">${cfg.brand.ko}</text><text x="190" y="31" font-family="ui-monospace,monospace" font-size="12" fill="#C9D2F5" letter-spacing="3">${cfg.brand.en.toUpperCase()}</text></svg>`;
const OG = (cfg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#E4E8F5"/>
<rect x="120" y="50" width="960" height="530" rx="16" fill="#fff" stroke="#0A1747" stroke-width="6"/>
<rect x="120" y="50" width="960" height="110" rx="16" fill="#0A1747"/>
<rect x="120" y="120" width="960" height="40" fill="#0A1747"/>
<text x="170" y="122" font-family="sans-serif" font-size="50" font-weight="800" fill="#fff">${cfg.brand.ko}</text>
<text x="1030" y="118" text-anchor="end" font-family="monospace" font-size="24" fill="#C9D2F5" letter-spacing="4">${cfg.brand.en.toUpperCase()}</text>
<rect x="180" y="210" width="840" height="130" rx="12" fill="#0A1747" stroke="#2E318A" stroke-width="4"/>
<path d="M210 300H990" stroke="#8F9BD6" stroke-width="3"/>
<path d="M230 250V300M290 262V300M360 252V300M430 268V300M520 256V300M610 264V300M720 250V300M810 266V300M900 258V300" stroke="#C9D2F5" stroke-width="3" stroke-linecap="round"/>
<path d="M650 232V312" stroke="#E5322D" stroke-width="9" stroke-linecap="round"/>
<path d="M634 222h32l-16 22z" fill="#E5322D"/>
<text x="600" y="425" text-anchor="middle" font-family="sans-serif" font-size="46" font-weight="800" fill="#12172E">출장마사지 홈타이</text>
<text x="600" y="475" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#464E70">${cfg.hours} · ${cfg.pay}</text>
<rect x="400" y="500" width="400" height="56" rx="4" fill="#0F226B"/>
<rect x="400" y="553" width="400" height="6" fill="#E5322D"/>
<text x="600" y="537" text-anchor="middle" font-family="sans-serif" font-size="24" font-weight="700" fill="#fff">${cfg.telLabel} ${cfg.tel}</text>
</svg>`;

export function writeAssets(dist, cfg) {
  const dir = path.join(dist, 'assets');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'ok.css'), CSS(THEME));
  fs.writeFileSync(path.join(dir, 'ok.js'), JS);
  fs.writeFileSync(path.join(dir, 'favicon.svg'), FAVICON());
  fs.writeFileSync(path.join(dir, 'logo.svg'), LOGO(cfg));
  fs.writeFileSync(path.join(dir, 'og.svg'), OG(cfg));
}
