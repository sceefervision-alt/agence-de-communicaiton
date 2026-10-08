// Catalogue des langues. Les langues marquées `curated` ont un niveau A1
// écrit à la main pour les francophones (disponible hors ligne) ; tout le
// reste du programme est généré par l'IA à la demande, dans la langue de base
// de l'apprenant. N'importe quelle autre langue peut être ajoutée par son nom
// (« Autre langue »). `name` est le nom français (usage interne et invites) ;
// l'interface affiche le nom dans la langue de l'apprenant (voir i18n.js).

export const LANGUAGES = [
  // Europe
  { id: 'fr', name: 'Français', native: 'Français', speechLang: 'fr-FR', chars: 'à â ç é è ê ë î ï ô ù û ü œ' },
  { id: 'en', name: 'Anglais', native: 'English', speechLang: 'en-GB', curated: true },
  { id: 'es', name: 'Espagnol', native: 'Español', speechLang: 'es-ES', chars: 'á é í ó ú ñ ü ¿ ¡', curated: true },
  { id: 'de', name: 'Allemand', native: 'Deutsch', speechLang: 'de-DE', chars: 'ä ö ü ß', curated: true },
  { id: 'it', name: 'Italien', native: 'Italiano', speechLang: 'it-IT', chars: 'à è é ì ò ù', curated: true },
  { id: 'pt', name: 'Portugais (Brésil)', native: 'Português', speechLang: 'pt-BR', chars: 'á â ã à ç é ê í ó ô õ ú', curated: true },
  { id: 'nl', name: 'Néerlandais', native: 'Nederlands', speechLang: 'nl-NL', chars: 'é ë ï' },
  { id: 'sv', name: 'Suédois', native: 'Svenska', speechLang: 'sv-SE', chars: 'å ä ö' },
  { id: 'no', name: 'Norvégien', native: 'Norsk', speechLang: 'nb-NO', chars: 'æ ø å' },
  { id: 'da', name: 'Danois', native: 'Dansk', speechLang: 'da-DK', chars: 'æ ø å' },
  { id: 'fi', name: 'Finnois', native: 'Suomi', speechLang: 'fi-FI', chars: 'ä ö' },
  { id: 'pl', name: 'Polonais', native: 'Polski', speechLang: 'pl-PL', chars: 'ą ć ę ł ń ó ś ź ż' },
  { id: 'cs', name: 'Tchèque', native: 'Čeština', speechLang: 'cs-CZ', chars: 'á č ď é ě í ň ó ř š ť ú ů ý ž' },
  { id: 'ro', name: 'Roumain', native: 'Română', speechLang: 'ro-RO', chars: 'ă â î ș ț' },
  { id: 'hu', name: 'Hongrois', native: 'Magyar', speechLang: 'hu-HU', chars: 'á é í ó ö ő ú ü ű' },
  { id: 'el', name: 'Grec', native: 'Ελληνικά', speechLang: 'el-GR', script: 'grec' },
  { id: 'tr', name: 'Turc', native: 'Türkçe', speechLang: 'tr-TR', chars: 'ç ğ ı ö ş ü' },
  { id: 'ru', name: 'Russe', native: 'Русский', speechLang: 'ru-RU', script: 'cyrillique' },
  { id: 'uk', name: 'Ukrainien', native: 'Українська', speechLang: 'uk-UA', script: 'cyrillique' },
  { id: 'ca', name: 'Catalan', native: 'Català', speechLang: 'ca-ES', chars: 'à è é í ï ò ó ú ü ç l·l' },
  { id: 'eu', name: 'Basque', native: 'Euskara', speechLang: 'eu-ES', chars: 'ñ' },
  { id: 'br', name: 'Breton', native: 'Brezhoneg', speechLang: 'br-FR', chars: 'ñ ù ê' },
  { id: 'ga', name: 'Irlandais', native: 'Gaeilge', speechLang: 'ga-IE', chars: 'á é í ó ú' },
  // Moyen-Orient et Asie
  { id: 'ar', name: 'Arabe', native: 'العربية', speechLang: 'ar-SA', script: 'arabe', rtl: true },
  { id: 'he', name: 'Hébreu', native: 'עברית', speechLang: 'he-IL', script: 'hébreu', rtl: true },
  { id: 'fa', name: 'Persan', native: 'فارسی', speechLang: 'fa-IR', script: 'arabe', rtl: true },
  { id: 'hi', name: 'Hindi', native: 'हिन्दी', speechLang: 'hi-IN', script: 'devanagari' },
  { id: 'ur', name: 'Ourdou', native: 'اردو', speechLang: 'ur-PK', script: 'arabe', rtl: true },
  { id: 'bn', name: 'Bengali', native: 'বাংলা', speechLang: 'bn-IN', script: 'bengali' },
  { id: 'zh', name: 'Chinois (mandarin)', native: '中文', speechLang: 'zh-CN', script: 'sinogrammes' },
  { id: 'ja', name: 'Japonais', native: '日本語', speechLang: 'ja-JP', script: 'kana et kanji' },
  { id: 'ko', name: 'Coréen', native: '한국어', speechLang: 'ko-KR', script: 'hangeul' },
  { id: 'vi', name: 'Vietnamien', native: 'Tiếng Việt', speechLang: 'vi-VN', chars: 'ă â đ ê ô ơ ư á à ả ã ạ' },
  { id: 'th', name: 'Thaï', native: 'ไทย', speechLang: 'th-TH', script: 'thaï' },
  { id: 'id', name: 'Indonésien', native: 'Bahasa Indonesia', speechLang: 'id-ID' },
  { id: 'ms', name: 'Malais', native: 'Bahasa Melayu', speechLang: 'ms-MY' },
  { id: 'tl', name: 'Tagalog', native: 'Tagalog', speechLang: 'fil-PH' },
  // Afrique et Caraïbes
  { id: 'sw', name: 'Swahili', native: 'Kiswahili', speechLang: 'sw-KE' },
  { id: 'wo', name: 'Wolof', native: 'Wolof', speechLang: 'wo-SN', chars: 'à é ë ñ ŋ ó' },
  { id: 'ln', name: 'Lingala', native: 'Lingála', speechLang: 'ln-CD', chars: 'ɛ ɔ é ó' },
  { id: 'yo', name: 'Yoruba', native: 'Yorùbá', speechLang: 'yo-NG', chars: 'ẹ ọ ṣ à á è é' },
  { id: 'ha', name: 'Haoussa', native: 'Hausa', speechLang: 'ha-NG', chars: 'ɓ ɗ ƙ ƴ' },
  { id: 'am', name: 'Amharique', native: 'አማርኛ', speechLang: 'am-ET', script: 'guèze' },
  { id: 'ht', name: 'Créole haïtien', native: 'Kreyòl ayisyen', speechLang: 'ht-HT', chars: 'è ò' },
  // Langues anciennes et construites
  { id: 'la', name: 'Latin', native: 'Latina', speechLang: 'la', base: false },
  { id: 'eo', name: 'Espéranto', native: 'Esperanto', speechLang: 'eo', chars: 'ĉ ĝ ĥ ĵ ŝ ŭ' },
];

export function findLanguage(id, customLanguages = []) {
  return LANGUAGES.find((l) => l.id === id) ?? customLanguages.find((l) => l.id === id) ?? null;
}

export function specialChars(lang) {
  return lang?.chars ? lang.chars.split(' ') : [];
}

// Langue ajoutée par l'utilisateur (« Autre langue »).
export function customLanguage(name) {
  const clean = String(name).trim().replace(/\s+/g, ' ');
  if (!isValidLanguageName(clean)) return null;
  const slug = clean
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return { id: `x-${slug || 'langue'}`, name: clean[0].toUpperCase() + clean.slice(1), native: clean, speechLang: '', custom: true };
}

export function isValidLanguageName(name) {
  return typeof name === 'string' && name.length >= 2 && name.length <= 40 && /^[\p{L}][\p{L} '’()-]*$/u.test(name);
}
