import en from '../i18n/locales/en';
import zh from '../i18n/locales/zh';
import ja from '../i18n/locales/ja';
import ko from '../i18n/locales/ko';
import es from '../i18n/locales/es';
import hi from '../i18n/locales/hi';
import vi from '../i18n/locales/vi';
import { makeT, LANGUAGES } from '../i18n';
import { buildSchemas } from '../validation/schemas';
import { countryName, countryOptions, COUNTRIES, flagEmoji } from '../data/countries';
import { languageName, languageOptions, LANGUAGE_CODES } from '../data/languages';

const LOCALES = { zh, ja, ko, es, hi, vi };
const placeholders = (s) => (s.match(/\{\w+\}/g) || []).sort().join(',');

describe('translation dictionaries', () => {
  const enKeys = Object.keys(en);

  it('every supported language has a dictionary', () => {
    LANGUAGES.filter((l) => l.code !== 'en').forEach((l) => expect(LOCALES[l.code]).toBeDefined());
  });

  Object.entries(LOCALES).forEach(([code, dict]) => {
    it(`${code} defines exactly the English keys, with no empty strings`, () => {
      expect(Object.keys(dict).sort()).toEqual([...enKeys].sort());
      Object.values(dict).forEach((v) => expect(typeof v === 'string' && v.length > 0).toBe(true));
    });

    it(`${code} keeps every {placeholder} used by English`, () => {
      enKeys.forEach((k) => expect(placeholders(dict[k])).toBe(placeholders(en[k])));
    });
  });

  it('interpolates variables and picks plural forms', () => {
    const t = makeT(en);
    expect(t('form.stepOf', { n: 2, total: 4, title: 'Contact' })).toBe('Step 2 of 4: Contact');
    expect(t('toast.fixFields', { count: 1 })).toBe('Please fix 1 field before continuing.');
    expect(t('toast.fixFields', { count: 3 })).toBe('Please fix 3 fields before continuing.');
  });

  it('falls back to English, then to the key', () => {
    const t = makeT({ 'nav.home': 'Inicio' });
    expect(t('nav.home')).toBe('Inicio');
    expect(t('nav.faqs')).toBe('FAQs');
    expect(t('does.not.exist')).toBe('does.not.exist');
  });

  it('builds validation schemas whose messages follow the language', () => {
    const zhSchemas = buildSchemas(makeT(zh));
    let message = '';
    try {
      zhSchemas.personalSchema.validateSyncAt('firstName', { firstName: '' });
    } catch (e) {
      message = e.message;
    }
    expect(message).toBe(zh['v.required'].replace('{field}', zh['personal.firstName']));
  });
});

describe('localised reference data', () => {
  it('has unique ISO codes and well-formed dial codes', () => {
    const codes = COUNTRIES.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes.length).toBeGreaterThanOrEqual(240);
    COUNTRIES.forEach((c) => expect(c.dial).toMatch(/^\+\d{1,4}$/));
  });

  it('localises country names via Intl and falls back to English', () => {
    expect(countryName('SG', 'en')).toBe('Singapore');
    expect(countryName('JP', 'ja-JP')).toBe('日本');
    expect(countryName('DE', 'es')).toBe('Alemania');
    expect(countryName('ZZ', 'en')).toBe('ZZ');
    expect(flagEmoji('SG')).toBe('🇸🇬');
  });

  it('produces sorted, searchable country options with English keywords', () => {
    const opts = countryOptions('es');
    const labels = opts.map((o) => o.label);
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b, 'es')));
    const india = opts.find((o) => o.value === 'IN');
    expect(india.label).toBe('India');
    expect(india.keywords).toContain('India');
  });

  it('localises language names and understands legacy English values', () => {
    expect(LANGUAGE_CODES.length).toBeGreaterThanOrEqual(100);
    expect(languageName('zh', 'en')).toMatch(/Chinese/);
    expect(languageName('ko', 'ko-KR')).toBe('한국어');
    expect(languageName('English', 'es')).toBe('Inglés');
    expect(languageOptions('en').some((o) => o.value === 'yue')).toBe(true);
  });
});
