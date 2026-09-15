import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from './locales/en';

/**
 * Lightweight i18n: flat dictionaries keyed like "steps.personal.title",
 * {placeholder} interpolation, and _one/_other plural suffixes. English ships
 * in the main bundle; other dictionaries are code-split and loaded on demand.
 */
export const LANGUAGES = [
  { code: 'en', label: 'English', locale: 'en' },
  { code: 'zh', label: '简体中文', locale: 'zh-CN' },
  { code: 'ja', label: '日本語', locale: 'ja-JP' },
  { code: 'ko', label: '한국어', locale: 'ko-KR' },
  { code: 'es', label: 'Español', locale: 'es' },
  { code: 'hi', label: 'हिन्दी', locale: 'hi-IN' },
  { code: 'vi', label: 'Tiếng Việt', locale: 'vi-VN' },
];

const STORAGE_KEY = 'hpair:lang';
const loaders = {
  zh: () => import('./locales/zh'),
  ja: () => import('./locales/ja'),
  ko: () => import('./locales/ko'),
  es: () => import('./locales/es'),
  hi: () => import('./locales/hi'),
  vi: () => import('./locales/vi'),
};

const cache = { en };

export const detectLanguage = () => {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('lang');
    if (fromUrl && LANGUAGES.some((l) => l.code === fromUrl)) return fromUrl;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && LANGUAGES.some((l) => l.code === stored)) return stored;
    const nav = (navigator.language || 'en').toLowerCase();
    const hit = LANGUAGES.find((l) => nav === l.code || nav.startsWith(`${l.code}-`));
    return hit ? hit.code : 'en';
  } catch {
    return 'en';
  }
};

const interpolate = (str, vars) =>
  vars ? str.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : m)) : str;

/** Pure translate function for a dictionary; exported for tests and non-React code. */
export const makeT = (dict, fallback = en) => (key, vars) => {
  let k = key;
  if (vars && typeof vars.count === 'number') {
    const suffix = vars.count === 1 ? '_one' : '_other';
    if (dict[key + suffix] !== undefined || fallback[key + suffix] !== undefined) k = key + suffix;
  }
  const str = dict[k] !== undefined ? dict[k] : fallback[k] !== undefined ? fallback[k] : key;
  return interpolate(str, vars);
};

export const tEn = makeT(en);

const I18nContext = createContext(null);

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};

export const I18nProvider = ({ children, initialLang }) => {
  const [lang, setLangState] = useState(() => initialLang || detectLanguage());
  const [dicts, setDicts] = useState(cache);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (dicts[lang]) return undefined;
    let cancelled = false;
    setLoading(true);
    loaders[lang]()
      .then((mod) => {
        cache[lang] = mod.default;
        if (!cancelled) setDicts({ ...cache });
      })
      .catch((e) => console.error('Failed to load language', lang, e))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [lang, dicts]);

  useEffect(() => {
    const meta = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];
    document.documentElement.lang = meta.locale;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const setLang = useCallback((code) => {
    if (LANGUAGES.some((l) => l.code === code)) setLangState(code);
  }, []);

  const value = useMemo(() => {
    const meta = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];
    const dict = dicts[lang] || en;
    return { lang, locale: meta.locale, setLang, t: makeT(dict), languages: LANGUAGES, loading };
  }, [lang, dicts, setLang, loading]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};
