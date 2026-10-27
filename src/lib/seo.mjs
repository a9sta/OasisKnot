/**
 * 타이틀·디스크립션 정본. 토막 구분은 ' | '.
 *   오아시스노트 `{동} 출장마사지 홈타이 | {구} {코스어} | {행동어} 오아시스노트`
 * 설명문은 100자 안쪽. 가운데는 그 자리에서만 나오는 계산값(북위·북쪽부터 순서·내려앉은 거리)으로 채운다.
 */
import { hash } from './util.mjs';
import { lat2, kmf, clsName, dm } from '../content/metric.mjs';

const at = (h, arr, slot = 0) => arr[parseInt(h.substr((slot * 3) % 29, 3), 16) % arr.length];

export const BRAND = '오아시스노트';
const KEY = '출장마사지 홈타이';
const COURSE_WORD = ['스웨디시', '아로마', '딥티슈', '타이', '경락', '건식', '림프', '지압', '스포츠'];
const ACT = ['전화 한 통으로 접수', '관리 후 정산', '새벽에도 접수', '주소만 알려 주면 접수', '도착 시각 바로 안내'];
const money = (n) => n.toLocaleString('ko-KR');

export const title = {
  home: (c) => `${BRAND} ${KEY} | 북위 눈금으로 줄 세운 동네 편성표 | ${c ? `동 ${c.spot}곳` : '동 단위'} 후불`,
  areaHub: (c) => `${KEY} 방문 지역 편성표 | 동 ${c.spot}곳 시군구 ${c.gu}곳 | ${BRAND}`,
  sido: (sd) => `${sd.name} ${KEY} | ${sd.main ? `동 ${sd.spotCount}곳` : `시군구 ${sd.gu.length}곳`} 평균 북위 ${lat2(sd.x.lat)}도 | ${at(hash(sd.name, 'sdt'), ACT)} ${BRAND}`,
  gu: (sd, g) => {
    const h = hash(sd.name, g.name, 'gt');
    const unit = g.main && g.spotCount ? `동 ${g.spotCount}곳` : g.main ? `읍면 ${g.ruralCount}곳` : `행정동 ${g.dongCount}곳`;
    return `${g.name} ${KEY} | ${sd.name} ${unit} 평균 북위 ${lat2(g.x.lat)}도 | ${at(h, ACT, 0)} ${BRAND}`;
  },
  spot: (sd, g, s) => {
    const h = hash(sd.name, g.name, s.name, 'st');
    return `${s.name} ${KEY} | ${g.name} ${at(h, COURSE_WORD, 0)} | ${at(h, ACT, 1)} ${BRAND}`;
  },
  course: (c) => `${c.ko} ${KEY} | ${c.min}분 ${money(c.price)}원 | 압 ${c.pressure} ${BRAND}`,
  sidoCourse: (sd, c) => `${sd.name} ${c.ko} ${KEY} | ${sd.name} 방문 | ${at(hash(sd.name, c.slug), ACT)} ${BRAND}`,
  page: (t) => `${t} | ${BRAND} ${KEY}`,
  post: (p) => `${p.title} | ${BRAND} 북위 메모`,
};

function spotMiddle(sd, g, s, h) {
  const frames = [
    () => `북위 ${lat2(s.x.lat)}도, ${g.name} 동 ${s.x.n}곳 중 북쪽 ${s.gRank}번째`,
    () => (s.x.drop > 0 ? `${g.name} 북쪽 끝에서 남쪽으로 ${kmf(s.x.drop)} 내려앉은 동` : `${g.name}에서 북쪽 끝 눈금에 선 동`),
    () => `무게중심 북위 ${dm(s.x.lat)}, ${clsName(s.cls)}`,
    () => `${g.name} 평균 북위 ${lat2(g.x.lat)}도, 이 동은 ${lat2(s.x.lat)}도`,
    () => `전국 동 가운데 북쪽 ${s.rank}번째 눈금, 북위 ${lat2(s.x.lat)}도`,
    () => `북위 ${lat2(s.x.lat)}도, ${clsName(s.cls)}에 편성`,
  ];
  return frames[parseInt(h.substr(6, 3), 16) % frames.length]();
}
const TAIL = ['후불 정산', '선입금 없음', '거리 할증 없음', '심야 요금 동일', '정산은 관리 후 한 번'];
const tailOf = (h) => TAIL[parseInt(h.substr(9, 3), 16) % TAIL.length];

export const desc = {
  home: () => '서울·인천·경기·부산은 동까지, 그 밖의 지정 지역은 시군구까지 담은 출장마사지 홈타이 안내입니다. 쪽마다 북위 눈금을 적었습니다.',
  areaHub: (c) => `출장마사지 홈타이가 닿는 동 ${c.spot}곳과 시군구 ${c.gu}곳의 편성표입니다. 곳마다 북위 눈금을 함께 실었습니다.`,
  sido: (sd) => (sd.main
    ? `${sd.name} ${KEY} 접수. 시군구 ${sd.gu.length}곳과 동 ${sd.spotCount}곳을 다뤘고 시군구 평균 북위는 ${lat2(sd.x.lat)}도입니다.`
    : `${sd.name} ${KEY} 접수. 시군구 ${sd.gu.length}곳까지 화면이 있고 동 이름은 그 안에 실었습니다. 후불, 심야 접수.`),
  gu: (sd, g) => {
    const h = hash(sd.name, g.name, 'gd');
    const mid = g.main && g.spotCount
      ? [
        `동 ${g.spotCount}곳을 열었고 평균 북위는 ${lat2(g.x.lat)}도`,
        `가장 북쪽 동은 ${g.hi}, 가장 남쪽 동은 ${g.lo}`,
        `북위 폭 ${kmf(g.x.spread)}, ${clsName(g.cls)}으로 분류`,
        `${sd.name} 시군구 ${g.x.nGu}곳 중 북쪽 ${g.x.rank}번째`,
      ][parseInt(h.substr(3, 3), 16) % 4]
      : g.main
        ? [
          `행정동 ${g.dongCount}곳이 전부 읍·면이라 이 한 장에서 받음`,
          `읍 ${g.eupCount}곳과 면 ${g.myeonCount}곳은 이름만 수록`,
          `평균 북위 ${lat2(g.x.lat)}도, ${clsName(g.cls)}`,
        ][parseInt(h.substr(3, 3), 16) % 3]
        : [
          `행정동 ${g.dongCount}곳을 포함하며 분류는 ${clsName(g.cls)}`,
          `평균 북위 ${lat2(g.x.lat)}도, 북위 폭 ${kmf(g.x.spread)}`,
          g.ruralCount ? `동과 읍·면 ${g.ruralCount}곳까지 방문` : `동 ${g.dongNames.length}곳 모두 한 번호로 접수`,
        ][parseInt(h.substr(3, 3), 16) % 3];
    return `${sd.name} ${g.name} ${KEY}. ${mid}. ${tailOf(h)}.`;
  },
  spot: (sd, g, s) => {
    const h = hash(sd.name, g.name, s.name, 'sd');
    return `${sd.name} ${g.name} ${s.name} ${KEY}. ${spotMiddle(sd, g, s, h)}. ${tailOf(h)}.`;
  },
  course: (c) => `${c.ko} 출장 방문. ${c.focus} 중심, 압은 ${c.pressure}. ${c.min}분에 ${money(c.price)}원, 지역이 달라도 금액은 같습니다.`,
  sidoCourse: (sd, c) => `${sd.name} ${c.ko} ${KEY}. ${sd.name} 전역에서 ${c.min}분 ${money(c.price)}원, 압 ${c.pressure}, 후불 정산.`,
  post: (p) => p.summary,
};

export function clampDesc(s, limit = 100) {
  if (s.length <= limit) return s;
  const parts = s.split(/(?<=\.)\s+/);
  let out = '';
  for (const p of parts) {
    if ((out + p).length > limit) break;
    out += (out ? ' ' : '') + p;
  }
  return out || s.slice(0, limit - 1) + '…';
}
