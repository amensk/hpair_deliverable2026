// Languages as ISO 639 codes; display names via Intl.DisplayNames in the active
// UI language, falling back to these English names.
export const LANGUAGE_CODES = [
  ['af', 'Afrikaans'], ['sq', 'Albanian'], ['am', 'Amharic'], ['ar', 'Arabic'], ['hy', 'Armenian'], ['as', 'Assamese'],
  ['az', 'Azerbaijani'], ['eu', 'Basque'], ['be', 'Belarusian'], ['bn', 'Bengali'], ['bs', 'Bosnian'], ['bg', 'Bulgarian'],
  ['my', 'Burmese'], ['yue', 'Cantonese'], ['ca', 'Catalan'], ['ceb', 'Cebuano'], ['zh', 'Chinese (Mandarin)'], ['hr', 'Croatian'],
  ['cs', 'Czech'], ['da', 'Danish'], ['dv', 'Dhivehi'], ['nl', 'Dutch'], ['dz', 'Dzongkha'], ['en', 'English'],
  ['et', 'Estonian'], ['fo', 'Faroese'], ['fil', 'Filipino'], ['fi', 'Finnish'], ['fr', 'French'], ['gl', 'Galician'],
  ['ka', 'Georgian'], ['de', 'German'], ['el', 'Greek'], ['gu', 'Gujarati'], ['ht', 'Haitian Creole'], ['ha', 'Hausa'],
  ['haw', 'Hawaiian'], ['he', 'Hebrew'], ['hi', 'Hindi'], ['hmn', 'Hmong'], ['hu', 'Hungarian'], ['is', 'Icelandic'],
  ['ig', 'Igbo'], ['id', 'Indonesian'], ['ga', 'Irish'], ['it', 'Italian'], ['ja', 'Japanese'], ['jv', 'Javanese'],
  ['kn', 'Kannada'], ['kk', 'Kazakh'], ['km', 'Khmer'], ['rw', 'Kinyarwanda'], ['ko', 'Korean'], ['ku', 'Kurdish'],
  ['ky', 'Kyrgyz'], ['lo', 'Lao'], ['la', 'Latin'], ['lv', 'Latvian'], ['lt', 'Lithuanian'], ['lb', 'Luxembourgish'],
  ['mk', 'Macedonian'], ['mg', 'Malagasy'], ['ms', 'Malay'], ['ml', 'Malayalam'], ['mt', 'Maltese'], ['mi', 'Māori'],
  ['mr', 'Marathi'], ['mn', 'Mongolian'], ['ne', 'Nepali'], ['no', 'Norwegian'], ['ny', 'Nyanja'], ['or', 'Odia'],
  ['ps', 'Pashto'], ['fa', 'Persian'], ['pl', 'Polish'], ['pt', 'Portuguese'], ['pa', 'Punjabi'], ['ro', 'Romanian'],
  ['ru', 'Russian'], ['sm', 'Samoan'], ['gd', 'Scottish Gaelic'], ['sr', 'Serbian'], ['sn', 'Shona'], ['sd', 'Sindhi'],
  ['si', 'Sinhala'], ['sk', 'Slovak'], ['sl', 'Slovenian'], ['so', 'Somali'], ['st', 'Southern Sotho'], ['es', 'Spanish'],
  ['su', 'Sundanese'], ['sw', 'Swahili'], ['sv', 'Swedish'], ['tg', 'Tajik'], ['ta', 'Tamil'], ['tt', 'Tatar'],
  ['te', 'Telugu'], ['th', 'Thai'], ['bo', 'Tibetan'], ['ti', 'Tigrinya'], ['to', 'Tongan'], ['tr', 'Turkish'],
  ['tk', 'Turkmen'], ['uk', 'Ukrainian'], ['ur', 'Urdu'], ['ug', 'Uyghur'], ['uz', 'Uzbek'], ['vi', 'Vietnamese'],
  ['cy', 'Welsh'], ['xh', 'Xhosa'], ['yi', 'Yiddish'], ['yo', 'Yoruba'], ['zu', 'Zulu'],
];

const englishByCode = new Map(LANGUAGE_CODES);
// Older submissions stored English names; map them back to codes for display.
const codeByEnglish = new Map(LANGUAGE_CODES.map(([c, n]) => [n.toLowerCase(), c]));
codeByEnglish.set('mandarin chinese', 'zh');
codeByEnglish.set('filipino / tagalog', 'fil');

const dnCache = new Map();
const languageNames = (locale) => {
  if (!dnCache.has(locale)) {
    let dn = null;
    try {
      dn = typeof Intl !== 'undefined' && Intl.DisplayNames ? new Intl.DisplayNames([locale], { type: 'language' }) : null;
    } catch {
      dn = null;
    }
    dnCache.set(locale, dn);
  }
  return dnCache.get(locale);
};

const cap = (s) => (s ? s.charAt(0).toLocaleUpperCase() + s.slice(1) : s);

/** Localised language name for a code (or a legacy English name). */
export const languageName = (codeOrName, locale = 'en') => {
  if (!codeOrName) return '';
  const code = englishByCode.has(codeOrName) ? codeOrName : codeByEnglish.get(String(codeOrName).toLowerCase());
  if (!code) return codeOrName;
  const dn = languageNames(locale);
  if (dn) {
    try {
      const n = dn.of(code);
      if (n && n !== code) return cap(n);
    } catch {
      /* unsupported */
    }
  }
  return englishByCode.get(code) || codeOrName;
};

export const languageOptions = (locale = 'en') =>
  LANGUAGE_CODES.map(([code, name]) => ({ value: code, label: languageName(code, locale), keywords: [name, code] })).sort((a, b) =>
    a.label.localeCompare(b.label, locale)
  );

// Backwards-compatible English list (legacy imports/tests)
export const LANGUAGES = LANGUAGE_CODES.map(([, n]) => n);

// Option lists: values are stable codes; labels are translation keys.
export const GENDERS = ['female', 'male', 'non-binary', 'self-describe', 'prefer-not-to-say'].map((v) => ({ value: v, key: `options.gender.${v}` }));
export const OCCUPATIONS = ['undergraduate', 'graduate', 'young-professional', 'academic', 'other'].map((v) => ({ value: v, key: `options.occupation.${v}` }));
export const TRACKS = ['vconf-2026', 'aconf-2026', 'yls', 'undecided'].map((v) => ({ value: v, key: `options.track.${v}` }));
export const DIETARY = ['none', 'vegetarian', 'vegan', 'halal', 'kosher', 'gluten-free', 'other'].map((v) => ({ value: v, key: `options.dietary.${v}` }));
export const HEARD_FROM = ['friend', 'university', 'social', 'search', 'other'].map((v) => ({ value: v, key: `options.heardFrom.${v}` }));
