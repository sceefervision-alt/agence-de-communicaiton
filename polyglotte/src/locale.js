// Langue de base de l'apprenant (celle de l'interface, des traductions et des
// explications), choisie automatiquement d'après son pays.
//
// Le pays est lu, dans l'ordre :
//   1. dans la région des réglages du navigateur (« fr-CI », « pt-BR ») : c'est
//      le pays d'origine, même en déplacement ;
//   2. sinon dans le pays de connexion indiqué par l'hébergeur (en-tête CDN) ;
//   3. sinon dans le fuseau horaire.
// Si le pays a plusieurs langues (Canada, Suisse, Belgique, Cameroun…), on
// prend celle du navigateur quand elle en fait partie. L'apprenant peut
// toujours changer ce choix.

import { LANGUAGES } from './languages.js';
import { STATIC } from './env.js';

// Langues de chaque pays, la langue par défaut en premier. Seules figurent les
// langues proposées par Polyglotte (la langue écrite et scolaire du pays).
const BY_COUNTRY = {
  // Francophonie
  FR: 'fr', MC: 'fr', LU: 'fr de', BE: 'nl fr de', CH: 'de fr it', CA: 'en fr', CI: 'fr', SN: 'fr wo', ML: 'fr', BF: 'fr',
  NE: 'fr ha', GN: 'fr', BJ: 'fr yo', TG: 'fr', CM: 'fr en', GA: 'fr', CG: 'fr ln', CD: 'fr ln sw', CF: 'fr', TD: 'fr ar',
  MG: 'fr', DJ: 'fr ar', KM: 'fr ar', BI: 'fr', RW: 'en fr sw', HT: 'fr ht', MU: 'en fr', SC: 'en fr', VU: 'en fr',
  RE: 'fr', GP: 'fr', MQ: 'fr', GF: 'fr', YT: 'fr', NC: 'fr', PF: 'fr', PM: 'fr', BL: 'fr', MF: 'fr', WF: 'fr',
  MA: 'ar fr', DZ: 'ar fr', TN: 'ar fr', MR: 'ar fr', LB: 'ar fr en',
  // Anglophonie
  US: 'en es', GB: 'en', IE: 'en ga', AU: 'en', NZ: 'en', ZA: 'en', NG: 'en ha yo', GH: 'en', KE: 'en sw', UG: 'en sw',
  TZ: 'sw en', ZM: 'en', ZW: 'en', MW: 'en', BW: 'en', NA: 'en', LR: 'en', SL: 'en', GM: 'en', SS: 'en', ER: 'en ar',
  IN: 'en hi bn ur', PK: 'ur en', LK: 'en', NP: 'en hi', MM: 'en', PH: 'en tl', SG: 'en zh ms', MT: 'en', CY: 'el tr en',
  JM: 'en', TT: 'en', BB: 'en', BS: 'en', BZ: 'en es', GY: 'en', AG: 'en', DM: 'en', GD: 'en', KN: 'en', LC: 'en', VC: 'en',
  FJ: 'en', PG: 'en', SB: 'en', IS: 'en', EE: 'en', LV: 'en', LT: 'en', GE: 'en', KH: 'en', LA: 'en',
  // Hispanophonie et lusophonie
  ES: 'es ca eu', MX: 'es', AR: 'es', CO: 'es', PE: 'es', VE: 'es', CL: 'es', EC: 'es', GT: 'es', CU: 'es', BO: 'es',
  DO: 'es', HN: 'es', PY: 'es', SV: 'es', NI: 'es', CR: 'es', PA: 'es', UY: 'es', PR: 'es en', GQ: 'es fr', AD: 'ca es fr',
  PT: 'pt', BR: 'pt', AO: 'pt', MZ: 'pt', CV: 'pt', GW: 'pt', ST: 'pt', TL: 'pt',
  // Reste de l'Europe
  DE: 'de', AT: 'de', LI: 'de', IT: 'it', SM: 'it', VA: 'it', NL: 'nl', SR: 'nl', AW: 'nl', CW: 'nl', SX: 'nl',
  SE: 'sv', NO: 'no', DK: 'da', FI: 'fi sv', PL: 'pl', CZ: 'cs', SK: 'cs', RO: 'ro', MD: 'ro ru', HU: 'hu', GR: 'el',
  TR: 'tr', AZ: 'tr', RU: 'ru', BY: 'ru', KZ: 'ru', KG: 'ru', TJ: 'ru', UZ: 'ru', TM: 'ru', AM: 'ru', UA: 'uk ru',
  // Monde arabe, Moyen-Orient
  SA: 'ar', AE: 'ar en', QA: 'ar en', KW: 'ar', BH: 'ar', OM: 'ar', YE: 'ar', IQ: 'ar', SY: 'ar', JO: 'ar', PS: 'ar',
  EG: 'ar', LY: 'ar', SD: 'ar en', SO: 'ar', IL: 'he ar en', IR: 'fa', AF: 'fa',
  // Asie
  CN: 'zh', TW: 'zh', HK: 'zh en', MO: 'zh pt', JP: 'ja', KR: 'ko', VN: 'vi', TH: 'th', ID: 'id', MY: 'ms en zh', BN: 'ms en',
  BD: 'bn',
  // Afrique de l'Est
  ET: 'am',
};

// Fuseaux horaires courants → pays (dernier recours, sans réglage régional).
const TZ =
  'Europe/Paris:FR Europe/Monaco:MC Europe/Luxembourg:LU Europe/Brussels:BE Europe/Zurich:CH Europe/London:GB Europe/Dublin:IE ' +
  'Europe/Madrid:ES Atlantic/Canary:ES Europe/Lisbon:PT Atlantic/Azores:PT Europe/Berlin:DE Europe/Vienna:AT Europe/Rome:IT ' +
  'Europe/Amsterdam:NL Europe/Stockholm:SE Europe/Oslo:NO Europe/Copenhagen:DK Europe/Helsinki:FI Europe/Warsaw:PL ' +
  'Europe/Prague:CZ Europe/Bratislava:SK Europe/Bucharest:RO Europe/Chisinau:MD Europe/Budapest:HU Europe/Athens:GR ' +
  'Europe/Istanbul:TR Europe/Moscow:RU Europe/Minsk:BY Europe/Kiev:UA Europe/Kyiv:UA Europe/Andorra:AD Europe/Malta:MT ' +
  'Asia/Nicosia:CY Atlantic/Reykjavik:IS Europe/Tallinn:EE Europe/Riga:LV Europe/Vilnius:LT ' +
  'Africa/Abidjan:CI Africa/Dakar:SN Africa/Bamako:ML Africa/Ouagadougou:BF Africa/Niamey:NE Africa/Conakry:GN ' +
  'Africa/Porto-Novo:BJ Africa/Lome:TG Africa/Douala:CM Africa/Libreville:GA Africa/Brazzaville:CG Africa/Kinshasa:CD ' +
  'Africa/Lubumbashi:CD Africa/Bangui:CF Africa/Ndjamena:TD Indian/Antananarivo:MG Africa/Djibouti:DJ Indian/Comoro:KM ' +
  'Africa/Bujumbura:BI Africa/Kigali:RW Indian/Mauritius:MU Indian/Reunion:RE Indian/Mayotte:YT America/Guadeloupe:GP ' +
  'America/Martinique:MQ America/Cayenne:GF Pacific/Noumea:NC Pacific/Tahiti:PF America/Port-au-Prince:HT ' +
  'Africa/Casablanca:MA Africa/Algiers:DZ Africa/Tunis:TN Africa/Nouakchott:MR Asia/Beirut:LB ' +
  'Africa/Lagos:NG Africa/Accra:GH Africa/Nairobi:KE Africa/Kampala:UG Africa/Dar_es_Salaam:TZ Africa/Lusaka:ZM ' +
  'Africa/Harare:ZW Africa/Johannesburg:ZA Africa/Windhoek:NA Africa/Gaborone:BW Africa/Monrovia:LR Africa/Freetown:SL ' +
  'Africa/Addis_Ababa:ET Africa/Cairo:EG Africa/Tripoli:LY Africa/Khartoum:SD Africa/Juba:SS Africa/Mogadishu:SO ' +
  'Africa/Luanda:AO Africa/Maputo:MZ Atlantic/Cape_Verde:CV Africa/Bissau:GW Africa/Malabo:GQ ' +
  'America/New_York:US America/Chicago:US America/Denver:US America/Los_Angeles:US America/Phoenix:US America/Anchorage:US ' +
  'Pacific/Honolulu:US America/Detroit:US America/Toronto:CA America/Vancouver:CA America/Montreal:CA America/Edmonton:CA ' +
  'America/Winnipeg:CA America/Halifax:CA America/Mexico_City:MX America/Monterrey:MX America/Cancun:MX America/Tijuana:MX ' +
  'America/Bogota:CO America/Lima:PE America/Caracas:VE America/Santiago:CL America/Guayaquil:EC America/Guatemala:GT ' +
  'America/Havana:CU America/La_Paz:BO America/Santo_Domingo:DO America/Tegucigalpa:HN America/Asuncion:PY ' +
  'America/El_Salvador:SV America/Managua:NI America/Costa_Rica:CR America/Panama:PA America/Montevideo:UY ' +
  'America/Puerto_Rico:PR America/Argentina/Buenos_Aires:AR America/Buenos_Aires:AR America/Sao_Paulo:BR ' +
  'America/Bahia:BR America/Fortaleza:BR America/Recife:BR America/Manaus:BR America/Jamaica:JM America/Port_of_Spain:TT ' +
  'America/Paramaribo:SR America/Curacao:CW ' +
  'Asia/Riyadh:SA Asia/Dubai:AE Asia/Qatar:QA Asia/Kuwait:KW Asia/Bahrain:BH Asia/Muscat:OM Asia/Aden:YE Asia/Baghdad:IQ ' +
  'Asia/Damascus:SY Asia/Amman:JO Asia/Gaza:PS Asia/Hebron:PS Asia/Jerusalem:IL Asia/Tel_Aviv:IL Asia/Tehran:IR Asia/Kabul:AF ' +
  'Asia/Karachi:PK Asia/Kolkata:IN Asia/Calcutta:IN Asia/Dhaka:BD Asia/Kathmandu:NP Asia/Colombo:LK Asia/Yangon:MM ' +
  'Asia/Shanghai:CN Asia/Urumqi:CN Asia/Taipei:TW Asia/Hong_Kong:HK Asia/Macau:MO Asia/Tokyo:JP Asia/Seoul:KR ' +
  'Asia/Ho_Chi_Minh:VN Asia/Saigon:VN Asia/Bangkok:TH Asia/Jakarta:ID Asia/Makassar:ID Asia/Kuala_Lumpur:MY Asia/Singapore:SG ' +
  'Asia/Manila:PH Asia/Phnom_Penh:KH Asia/Vientiane:LA Asia/Brunei:BN Asia/Dili:TL Asia/Almaty:KZ Asia/Tashkent:UZ ' +
  'Asia/Bishkek:KG Asia/Tbilisi:GE Asia/Yerevan:AM Asia/Baku:AZ ' +
  'Australia/Sydney:AU Australia/Melbourne:AU Australia/Brisbane:AU Australia/Perth:AU Australia/Adelaide:AU ' +
  'Pacific/Auckland:NZ Pacific/Fiji:FJ Pacific/Port_Moresby:PG';

const TZ_COUNTRY = Object.fromEntries(TZ.split(' ').map((pair) => pair.split(':')));

// Langues qui peuvent servir de langue de base (toutes, sauf le latin).
export const BASE_LANGUAGES = LANGUAGES.filter((l) => l.base !== false);
export const isBaseLanguage = (id) => BASE_LANGUAGES.some((l) => l.id === id);

export const languagesOfCountry = (country) => (BY_COUNTRY[country] ?? '').split(' ').filter(Boolean);

const isCountry = (c) => typeof c === 'string' && /^[A-Z]{2}$/.test(c) && c !== 'XX' && c !== 'ZZ';

// « nb-NO » → { lang: 'no', region: 'NO' } ; « fil » → { lang: 'tl' }.
function parseTag(tag) {
  const parts = String(tag ?? '').replace(/_/g, '-').split('-');
  let lang = parts[0].toLowerCase();
  if (lang === 'nb' || lang === 'nn') lang = 'no';
  if (lang === 'fil') lang = 'tl';
  if (lang === 'iw') lang = 'he';
  if (lang === 'in') lang = 'id';
  const region = parts.slice(1).find((p) => /^[A-Za-z]{2}$/.test(p))?.toUpperCase();
  return { lang, region: isCountry(region) ? region : undefined };
}

export const countryFromTimeZone = (tz) => TZ_COUNTRY[tz] ?? null;

// Choisit la langue de base. `languages` : préférences du navigateur
// (navigator.languages) ; `geoCountry` : pays de connexion (facultatif).
export function detectBase({ languages = [], timeZone = '', geoCountry = null } = {}) {
  const tags = languages.map(parseTag).filter((t) => t.lang);
  const browser = tags.map((t) => t.lang);
  const regional = tags.find((t) => t.region)?.region;
  const country = regional ?? (isCountry(geoCountry) ? geoCountry : null) ?? countryFromTimeZone(timeZone);
  const source = regional ? 'locale' : country && isCountry(geoCountry) ? 'geo' : country ? 'timezone' : null;
  const spoken = languagesOfCountry(country).filter(isBaseLanguage);
  const firstBrowser = browser.find(isBaseLanguage);

  let base;
  // Pays multilingue : la langue du navigateur départage.
  if (spoken.includes(browser[0])) base = browser[0];
  // Le pays vient des réglages du navigateur : c'est le pays de l'apprenant.
  else if (source === 'locale' && spoken.length) base = spoken[0];
  // Pays de connexion ou fuseau : l'apprenant voyage peut-être ; si son
  // navigateur est réglé dans une langue connue, on la garde.
  else if (firstBrowser) base = firstBrowser;
  else base = spoken[0] ?? 'en';
  return { base, country, source };
}

export function browserLocale() {
  const nav = globalThis.navigator ?? {};
  let timeZone = '';
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
  } catch {
    /* environnement sans Intl complet */
  }
  return { languages: nav.languages?.length ? [...nav.languages] : nav.language ? [nav.language] : [], timeZone };
}

// Pays de connexion fourni par le serveur (si l'hébergeur le transmet).
export async function fetchGeoCountry({ endpoint = 'api/geo', fetchImpl = globalThis.fetch, timeoutMs = 1500 } = {}) {
  if (STATIC) return null;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetchImpl(endpoint, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const { country } = await res.json();
    return isCountry(country) ? country : null;
  } catch {
    return null;
  }
}
