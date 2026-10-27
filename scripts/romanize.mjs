// 국어의 로마자 표기법(개정)에 가까운 슬러그 변환기.
// 음절을 초성·중성·종성으로 쪼갠 뒤 경계에서 연음·자음동화 몇 가지를 적용한다.
const CHO = ['g','kk','n','d','tt','r','m','b','pp','s','ss','','j','jj','ch','k','t','p','h'];
const JUNG = ['a','ae','ya','yae','eo','e','yeo','ye','o','wa','wae','oe','yo','u','wo','we','wi','yu','eu','ui','i'];
const JONG = ['','k','k','k','n','n','n','t','l','k','m','p','l','l','p','l','m','p',
              'p','t','t','ng','t','t','k','t','p','t'];
// 종성이 다음 음절 초성(ㅇ)으로 넘어갈 때 쓰는 소리값
const JONG_LINK = ['','g','kk','ks','n','nj','nh','d','r','lg','lm','lb','ls','lt','lp','lh','m','b',
                   'bs','s','ss','ng','j','ch','k','t','p','h'];
const JONG_JAMO = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ',
                   'ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

export function romanize(src) {
  const sy = [];
  for (const ch of src) {
    const code = ch.codePointAt(0) - 0xac00;
    if (code >= 0 && code < 11172) {
      sy.push({ cho: Math.floor(code / 588), jung: Math.floor((code % 588) / 28), jong: code % 28 });
    } else if (/[0-9]/.test(ch)) {
      sy.push({ raw: ch });
    } else if (/[a-zA-Z]/.test(ch)) {
      sy.push({ raw: ch.toLowerCase() });
    } else {
      sy.push({ raw: '-' });
    }
  }
  let out = '';
  for (let i = 0; i < sy.length; i++) {
    const s = sy[i];
    if (s.raw !== undefined) { out += s.raw; continue; }
    const next = sy[i + 1];
    let cho = CHO[s.cho];
    // 앞 음절 종성에 따른 초성 변화
    const prev = sy[i - 1];
    if (prev && prev.jong !== undefined && prev.jong > 0) {
      const pj = JONG_JAMO[prev.jong];
      if (s.cho === 5) { // ㄹ
        if (pj === 'ㄴ' || pj === 'ㄹ') cho = 'l';     // 신림 sillim
        else cho = 'n';                                 // 종로 jongno
      } else if (s.cho === 2 && (pj === 'ㄱ' || pj === 'ㅂ')) {
        cho = 'n';
      }
    }
    out += cho + JUNG[s.jung];
    if (s.jong > 0) {
      const linksToNext = next && next.jong !== undefined && next.cho === 11; // 다음 초성이 ㅇ
      if (linksToNext) out += '';                      // 연음: 다음 음절 초성으로 넘긴다
      else if (next && next.jong !== undefined && JONG_JAMO[s.jong] === 'ㄴ' && next.cho === 5) out += 'l';
      else out += JONG[s.jong];
    }
    if (s.jong > 0 && next && next.jong !== undefined && next.cho === 11) {
      // 연음 처리: 종성 소리를 다음 음절 앞에 붙인다
      out += JONG_LINK[s.jong];
    }
  }
  return out;
}

export function slugify(src) {
  return romanize(src)
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// 행정구역 접미사(구·군·시·동·읍·면·가)는 하이픈으로 떼어 붙인다.
const SUFFIX = [['특별자치도', 'do'], ['광역시', 'si'], ['특별시', 'si'], ['자치구', 'gu'],
                ['구', 'gu'], ['군', 'gun'], ['시', 'si'], ['동', 'dong'], ['읍', 'eup'],
                ['면', 'myeon'], ['가', 'ga'], ['리', 'ri'], ['로', 'ro']];

export function adminSlug(name) {
  const parts = String(name).trim().split(/\s+/);
  const out = [];
  parts.forEach((part, idx) => {
    const last = idx === parts.length - 1;
    let stem = part, tail = '';
    if (last) {
      for (const [ko, en] of SUFFIX) {
        if (part.length > ko.length && part.endsWith(ko)) { stem = part.slice(0, -ko.length); tail = en; break; }
      }
    } else {
      for (const [ko] of SUFFIX) {
        if (part.length > ko.length && part.endsWith(ko)) { stem = part.slice(0, -ko.length); break; }
      }
    }
    const body = slugify(stem);
    out.push(last && tail ? body + '-' + tail : body);
  });
  return out.join('-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}
