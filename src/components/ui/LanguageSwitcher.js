import React from 'react';
import { FiGlobe } from 'react-icons/fi';
import { useI18n } from '../../i18n';

/** Compact language selector; each option is written in its own language. */
const LanguageSwitcher = ({ className = '' }) => {
  const { lang, setLang, languages, t } = useI18n();
  return (
    <label className={`lang-switch ${className}`}>
      <FiGlobe size={16} aria-hidden="true" />
      <span className="sr-only">{t('common.language')}</span>
      <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label={t('common.language')}>
        {languages.map((l) => (
          <option key={l.code} value={l.code} lang={l.locale}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
};

export default LanguageSwitcher;
