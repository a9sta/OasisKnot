import crypto from 'node:crypto';
import { SALT } from '../site.mjs';

/** 같은 입력이면 늘 같은 값. 페이지마다 문장을 갈아 끼우되 재빌드해도 안 흔들리게 한다. */
export function hash(...parts) {
  return crypto.createHash('md5').update(parts.join('|'), 'utf8').digest('hex');
}
export function hnum(h, slot = 0) {
  return parseInt(h.substr((slot * 3) % 29, 3), 16);
}
/** 배열에서 시드로 하나 고른다. */
export function pick(arr, seed, slot = 0) {
  return arr[hnum(typeof seed === 'string' ? seed : String(seed), slot) % arr.length];
}
export function pickBy(arr, h, slot = 0) {
  return arr[hnum(h, slot) % arr.length];
}
/** 시드 고정 셔플 — 같은 URL 이면 같은 차례가 나온다. */
export function shuffle(arr, h0) {
  const h = hash(h0, SALT);
  const a = arr.slice();
  for (let i = a.length - 1, j = 0; i > 0; i--, j++) {
    const k = hnum(h, j) % (i + 1);
    [a[i], a[k]] = [a[k], a[i]];
  }
  return a;
}
export function take(arr, n, h) {
  return shuffle(arr, h).slice(0, n);
}

/** 받침 유무 */
export function hasJong(word) {
  const w = String(word).replace(/[^가-힣0-9]/g, '');
  const last = w[w.length - 1];
  if (!last) return false;
  if (/[0-9]/.test(last)) return '0168'.includes(last) ? true : last === '3' || last === '7';
  const code = last.codePointAt(0) - 0xac00;
  if (code < 0 || code >= 11172) return false;
  return code % 28 !== 0;
}
const JOSA = {
  '은/는': ['은', '는'], '이/가': ['이', '가'], '을/를': ['을', '를'],
  '과/와': ['과', '와'], '으로/로': ['으로', '로'], '이나/나': ['이나', '나'],
  '이라/라': ['이라', '라'], '아/야': ['아', '야'], '이면/면': ['이면', '면'], '이에요/예요': ['이에요', '예요'],
};
/** `josa('신길7동','은/는')` → '은' */
export function josa(word, kind) {
  const pair = JOSA[kind];
  if (!pair) throw new Error(`모르는 조사: ${kind}`);
  let jong = hasJong(word);
  if (kind === '으로/로' && /[ㄹ를]$/.test(String(word).slice(-1))) jong = false;
  if (kind === '으로/로' && String(word).slice(-1) === '를') jong = false;
  if (kind === '으로/로') {
    const w = String(word).replace(/[^가-힣]/g, '');
    const last = w[w.length - 1];
    if (last) {
      const code = last.codePointAt(0) - 0xac00;
      if (code >= 0 && code < 11172 && code % 28 === 8) jong = false; // 받침 ㄹ
    }
  }
  return jong ? pair[0] : pair[1];
}
export function withJosa(word, kind) {
  return word + josa(word, kind);
}

export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function won(n) {
  return n.toLocaleString('ko-KR');
}

/** 문장 끝 마침표를 한 번만 찍는다. */
export function sent(s) {
  const t = String(s).trim();
  return /[.!?·」]$/.test(t) ? t : t + '.';
}

export function km(v) {
  return v < 1 ? `${Math.round(v * 1000)}m` : `${v.toFixed(1)}km`;
}

/** 면적 표기 — 소수 한 자리까지, 10km² 넘으면 정수로. */
export function km2(v) {
  return v >= 10 ? `${Math.round(v)}km²` : `${v.toFixed(1)}km²`;
}

/** 시도마다 이름이 겹치는 시군구(중구·동구·남구…)는 링크 글자에 시도 이름을 붙인다. build.mjs 가 채운다. */
export const DUP_GU = new Set();
export const guLabel = (sido, gu) => (DUP_GU.has(gu) ? `${sido} ${gu}` : gu);
export const SIDO_NAME = {};
