/**
 * 사이트 한 곳의 고정값 — 시드 소금, 클래스 접두사, 쪽마다 칸 순서, 구조화 데이터 문구.
 */
export const SALT = 'oasisknot-north-dial';
export const P = 'ok';

/** 쪽 종류마다 칸이 놓이는 순서. 이름은 pages/*.mjs 의 parts 키다. 동·시군구 쪽은 편성표 줄을 값 칸 바로 아래에 둔다. */
export const LAYOUT = {
  spot: ['open', 'facts', 'spotidx', 'kin', 'courses', 'steps', 'hail', 'faq', 'notice', 'guidx', 'theme', 'topics'],
  gu: ['open', 'facts', 'idx', 'rural', 'kin', 'courses', 'hail', 'steps', 'faq', 'notice', 'guidx', 'theme', 'posts', 'topics'],
  sido: ['open', 'facts', 'guidx', 'pick', 'cslinks', 'courses', 'hail', 'steps', 'faq', 'theme', 'posts', 'topics'],
  course: ['open', 'facts', 'compare', 'steps', 'hail', 'faq', 'notice', 'theme', 'posts', 'topics'],
  sidoCourse: ['open', 'facts', 'hail', 'courses', 'guidx', 'names', 'steps', 'faq', 'theme', 'posts', 'topics'],
};

export const SC = {
  orgDesc: (cfg) => `${cfg.coverage.main.join('·')}은 동마다, ${cfg.coverage.sub.join('·')}은 시군구마다 방송 순서표처럼 줄을 세우고 줄마다 북위 눈금을 붙여 둔 출장마사지·홈타이 접수 안내`,
  serviceType: '출장마사지 홈타이 방문 접수',
  catalog: '코스 편성표',
  offerName: (c) => `${c.ko} ${c.min}분`,
  offered: (c) => `${c.ko} 출장마사지`,
  supply: ['눕기에 넉넉한 방 한 칸', '갈아 덮을 수건'],
  tool: ['전화'],
  regNoLabel: '사업자등록번호',
  areaLabel: '넓이',
  speakable: ['h1', '.ok-lead p', '.ok-qa h3', '.ok-qa p'],
  siteName: (cfg) => `${cfg.brand.ko} 출장마사지`,
};

export const RSS_DESC = (cfg) => `${cfg.brand.ko}가 동마다 북위 눈금을 읽어 정리한 북위 메모와 방문 관리 이용 안내`;
export const GENERATOR = 'oasisknot-ssg';
export const MANIFEST_DESC = (counts) => `동 ${counts.spot}곳과 시군구 ${counts.gu}곳의 북위 눈금을 적어 둔 출장마사지 홈타이 안내`;
export const LLMS = ({ cfg, siteUrl, regions, courses, counts, data, mainR, subR, won, fm }) => `# ${cfg.brand.ko} (${cfg.brand.en})

> 점포 없이 전화만 받고 알려 주신 주소로 관리사가 찾아가는 출장마사지·홈타이 접수 안내입니다. 지역 화면마다 동 땅의 무게중심이 북위 몇 도에 놓였는지, 같은 시군구에서 북쪽부터 몇 번째인지, 가장 북쪽 동에서 남쪽으로 몇 킬로미터 내려앉았는지를 적었습니다. 서울·인천·경기·부산은 시도 → 시군구 → 동, 나머지 시도는 시군구까지 내려갑니다. 어느 지역이든 번호와 금액은 하나입니다.

## 사실 요약
- 동 화면이 있는 시도: ${mainR.map((r) => `${r.name}(시군구 ${r.gu.length}·동 ${r.spotCount})`).join(', ')}
- 시군구 화면까지 있는 시도: ${subR.map((r) => `${r.name}(${r.gu.length})`).join(', ')}
- 화면은 시군구 ${counts.gu}개와 동 ${counts.spot}개이고, 읍 ${counts.eup}곳과 면 ${counts.myeon}곳은 화면 없이 이름만 목록에 실었습니다.
- 접수 번호는 ${cfg.tel}이며 화면에서는 '${cfg.telLabel}' 버튼으로만 보입니다.
- 전화 응대 ${cfg.hours}, 현관 앞 도착 ${cfg.arrive}.
- 대금은 ${cfg.pay}이고 예약금, 보증금, 교통비, 심야 할증, 취소 수수료가 없습니다.
- 코스: ${courses.map((c) => `${c.ko} ${c.min}분 ${won(c.price)}원(압 ${c.pressure}, 오일 ${c.oil ? '사용' : '미사용'})`).join(' / ')}
- **재는 값은 북위 눈금입니다.** 동 땅의 무게중심이 북위 몇 도에 있는지만 보며 동서 방향과 길이는 재지 않습니다.
- 함께 적는 값: 같은 시군구 동 가운데 북쪽부터 몇 번째인지, 시군구에서 가장 북쪽 동으로부터 남쪽으로 내려앉은 거리(위도 차 × 111.2km), 시군구의 북위 폭과 평균 북위.
- 갈래는 일곱 가지입니다: 맨 위 눈금, 북쪽 넓은 구간, 북쪽 좁은 구간, 가운데 구간, 남쪽 좁은 구간, 남쪽 넓은 구간, 맨 아래 눈금.
- 동 화면 ${counts.spot}개의 북위는 ${fm(counts.lat.min * 1e4)}도에서 ${fm(counts.lat.max * 1e4)}도까지이고 가운데값은 ${fm(counts.lat.mid * 1e4)}도입니다. 가장 북쪽 동은 ${counts.north.gu} ${counts.north.name}, 가장 남쪽 동은 ${counts.south.gu} ${counts.south.name}입니다.
- 경계 자료가 단순화되어 있어 실제 지형과 다를 수 있고, 도로 사정이나 이동 시간과는 관계없는 값입니다.
- 만 19세 미만은 받지 않습니다.
- 하지 않는 일: 성적 서비스, 의료 행위, 후기와 별점 게시, 인물 사진.

## 주요 문서
- [이용 순서](${siteUrl}/guide/): 준비 사항, 전화 응대 시간, 접수를 받지 못하는 경우
- [요금 안내](${siteUrl}/price/): 코스별 금액과 붙지 않는 항목
- [코스 편성](${siteUrl}/course/): ${courses.length}가지를 시간, 압, 오일 여부로 한 표에 정리
- [지역 편성표](${siteUrl}/area/): 시군구 ${counts.gu}개와 동 ${counts.spot}개
- [소개](${siteUrl}/company/): 하는 일, 하지 않는 일, 북위를 읽는 방법
${regions.map((r) => `- [${r.name}](${siteUrl}/${r.slug}/): ${r.main ? `시군구 ${r.gu.length}개 · 동 ${r.spotCount}개` : `시군구 ${r.gu.length}개`}`).join('\n')}

## 자료 출처
행정동 이름·경계·중심점: ${data.source} (${data.version})
북위 눈금: 무게중심의 위도를 소수 둘째 자리로 적고, 위도 차에 111.2km 를 곱해 남쪽으로 내려앉은 거리를 구했습니다.
화면을 낸 기준: ${data.coverageFrom}

## 전체 주소 목록
${siteUrl}/sitemap.xml
`;
