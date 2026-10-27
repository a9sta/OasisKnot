/**
 * 구조화 데이터. 전 페이지에 Organization + WebSite + BreadcrumbList + WebPage 를
 * 깔고, 계층별로 Service · Place · ItemList · FAQPage 를 더한다.
 *
 * ★LocalBusiness 를 쓰지 않는다. 매장 주소가 없는 방문 사업인데 LocalBusiness 는
 *   address 를 요구한다. 주소를 지어내는 순간 그 자체가 거짓 신호가 된다.
 *   대신 Organization(주체) · Service(areaServed) · Place(지역) 로 나눈다.
 * ★aggregateRating · review 는 넣지 않는다. 받은 평점이 없으니 숫자를 만들면 거짓이다.
 * ★dateModified 는 '@@LM@@' 토큰으로 둔다. 빌드가 본문 해시를 보고 **실제로
 *   바뀐 쪽에만** 날짜를 끼운다(src/build.mjs).
 */
import { SC } from '../site.mjs';
const CTX = 'https://schema.org';
const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function organization(cfg, url) {
  const o = {
    '@type': 'Organization', '@id': `${url}/#org`,
    name: cfg.brand.ko, alternateName: cfg.brand.en, url: `${url}/`,
    slogan: cfg.brand.slogan,
    description: SC.orgDesc(cfg),
    telephone: cfg.tel, logo: `${url}/assets/logo.svg`,
    areaServed: [...cfg.coverage.main, ...cfg.coverage.sub].map((s) => ({ '@type': 'AdministrativeArea', name: s })),
    contactPoint: {
      '@type': 'ContactPoint', telephone: cfg.tel, contactType: cfg.telLabel,
      availableLanguage: ['ko'], areaServed: 'KR',
      hoursAvailable: { '@type': 'OpeningHoursSpecification', dayOfWeek: WEEK, opens: '00:00', closes: '23:59' },
    },
  };
  if (cfg.business.address) o.address = { '@type': 'PostalAddress', streetAddress: cfg.business.address, addressCountry: 'KR' };
  if (cfg.business.regNo) o.identifier = { '@type': 'PropertyValue', name: SC.regNoLabel, value: cfg.business.regNo };
  if (cfg.business.email) o.email = cfg.business.email;
  return o;
}

export function website(cfg, url) {
  return {
    '@type': 'WebSite', '@id': `${url}/#site`,
    url: `${url}/`, name: SC.siteName(cfg), inLanguage: 'ko-KR',
    publisher: { '@id': `${url}/#org` },
  };
}

export function webpage({ url, siteUrl, title, desc, breadcrumbId, pageType, about, mainList }) {
  return {
    '@type': pageType || 'WebPage', '@id': `${url}#page`, url, name: title, description: desc,
    inLanguage: 'ko-KR', isPartOf: { '@id': `${siteUrl}/#site` },
    dateModified: '@@LM@@',
    speakable: SPEAKABLE,
    ...(breadcrumbId ? { breadcrumb: { '@id': breadcrumbId } } : {}),
    ...(about ? { about: { '@id': about } } : {}),
    ...(mainList ? { mainEntity: { '@id': mainList } } : {}),
  };
}

export function breadcrumb(url, items) {
  return {
    '@type': 'BreadcrumbList', '@id': `${url}#crumb`,
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
  };
}

/** 지역 자체. 계산해서 나온 값이라 면적까지 적을 수 있다. */
export function place(id, name, geo, { containedIn, area, alternateName } = {}) {
  const p = {
    '@type': 'Place', '@id': id, name,
    geo: { '@type': 'GeoCoordinates', latitude: geo.lat, longitude: geo.lng },
  };
  if (alternateName) p.alternateName = alternateName;
  if (area) p.additionalProperty = { '@type': 'PropertyValue', name: SC.areaLabel, value: area, unitCode: 'KMK' };
  if (containedIn) p.containedInPlace = containedIn;
  return p;
}

export function service({ siteUrl, url, name, desc, areaServed, courses, cfg }) {
  return {
    '@type': 'Service', '@id': `${url}#service`,
    name, description: desc, serviceType: SC.serviceType,
    provider: { '@id': `${siteUrl}/#org` },
    areaServed,
    termsOfService: `${siteUrl}/terms/`,
    availableChannel: {
      '@type': 'ServiceChannel', serviceUrl: url,
      servicePhone: { '@type': 'ContactPoint', telephone: cfg.tel, contactType: cfg.telLabel },
      availableLanguage: ['ko'],
    },
    ...(courses ? {
      hasOfferCatalog: {
        '@type': 'OfferCatalog', name: SC.catalog,
        itemListElement: courses.map((c) => ({
          '@type': 'Offer', name: SC.offerName(c),
          price: String(c.price), priceCurrency: 'KRW',
          availability: 'https://schema.org/InStock',
          url: `${siteUrl}/course/${c.slug}/`,
          itemOffered: { '@type': 'Service', name: SC.offered(c), description: c.for },
        })),
      },
    } : {}),
  };
}

export function itemList(id, name, items) {
  return {
    '@type': 'ItemList', '@id': id, name, numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, url: it.url })),
  };
}

export function faqPage(url, qa) {
  return {
    '@type': 'FAQPage', '@id': `${url}#faq`,
    mainEntity: qa.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })),
  };
}

export function article({ url, siteUrl, title, desc, date, cfg }) {
  return {
    '@type': 'Article', '@id': `${url}#article`,
    headline: title, description: desc, datePublished: date, dateModified: '@@LM@@',
    inLanguage: 'ko-KR', mainEntityOfPage: { '@id': `${url}#page` },
    author: { '@id': `${siteUrl}/#org` }, publisher: { '@id': `${siteUrl}/#org` },
  };
}

/** 접수 절차 — HowTo. 다섯 걸음이 실제로 차례가 있는 절차라 그대로 맞는다. */
export function howTo(url, name, steps, cfg) {
  return {
    '@type': 'HowTo', '@id': `${url}#howto`,
    name, inLanguage: 'ko-KR',
    totalTime: 'PT5M',
    estimatedCost: { '@type': 'MonetaryAmount', currency: 'KRW', value: '0' },
    supply: SC.supply.map((n) => ({ '@type': 'HowToSupply', name: n })),
    tool: SC.tool.map((n) => ({ '@type': 'HowToTool', name: n })),
    step: steps.map((x, i) => ({
      '@type': 'HowToStep', position: i + 1, name: x.t, text: x.d, url: `${url}#step`,
    })),
  };
}

/** 목록이 본문인 쪽(건너가는 칸·코스 허브·갈무리)은 CollectionPage 로 알린다. */
export function collectionPage({ url, siteUrl, title, desc, listId }) {
  return {
    '@type': 'CollectionPage', '@id': `${url}#collection`,
    url, name: title, description: desc, inLanguage: 'ko-KR',
    isPartOf: { '@id': `${siteUrl}/#site` },
    dateModified: '@@LM@@',
    ...(listId ? { mainEntity: { '@id': listId } } : {}),
  };
}

/** 소개 쪽 — 주체를 설명하는 쪽이라는 뜻을 따로 알린다. */
export function aboutPage({ url, siteUrl, title, desc }) {
  return {
    '@type': 'AboutPage', '@id': `${url}#about`,
    url, name: title, description: desc, inLanguage: 'ko-KR',
    isPartOf: { '@id': `${siteUrl}/#site` },
    mainEntity: { '@id': `${siteUrl}/#org` },
    dateModified: '@@LM@@',
  };
}

/** 값표 쪽 — 코스 전체를 하나의 가격대로 묶는다. */
export function aggregateOffer(url, courses, cfg) {
  const prices = courses.map((c) => c.price);
  return {
    '@type': 'AggregateOffer', '@id': `${url}#offers`,
    priceCurrency: 'KRW',
    lowPrice: String(Math.min(...prices)),
    highPrice: String(Math.max(...prices)),
    offerCount: courses.length,
    availability: 'https://schema.org/InStock',
    offers: courses.map((c) => ({
      '@type': 'Offer', name: SC.offerName(c),
      price: String(c.price), priceCurrency: 'KRW',
      url: `${url.replace(/\/price\/$/, '')}/course/${c.slug}/`,
      availability: 'https://schema.org/InStock',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: String(c.price), priceCurrency: 'KRW',
        referenceQuantity: { '@type': 'QuantitativeValue', value: c.min, unitCode: 'MIN' },
      },
    })),
  };
}

/** 음성·AI 가 먼저 읽을 자리. */
export const SPEAKABLE = {
  '@type': 'SpeakableSpecification',
  cssSelector: SC.speakable,
};

export function graph(nodes) {
  return JSON.stringify({ '@context': CTX, '@graph': nodes.filter(Boolean) });
}
