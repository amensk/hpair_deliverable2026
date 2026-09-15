import React from 'react';
import { useFormikContext } from 'formik';
import { FiUser, FiMapPin, FiBriefcase, FiDownload, FiPrinter } from 'react-icons/fi';
import { CheckboxField } from '../ui/Field';
import Alert from '../ui/Alert';
import { buildSummarySections } from '../../utils/format';
import { summaryAsText, downloadBlob, safeFilename, printSummary } from '../../utils/summary';
import { useI18n } from '../../i18n';

const ICONS = { personal: FiUser, contact: FiMapPin, professional: FiBriefcase };
const MARK = '%%EDIT%%';

const ReviewStep = ({ goToStep, stepErrors }) => {
  const { values } = useFormikContext();
  const { t, locale } = useI18n();
  const sections = buildSummarySections(values, t, locale);
  const incomplete = stepErrors.some(Boolean);
  const [incA, incB] = t('review.incomplete', { edit: MARK }).split(MARK);

  return (
    <div className="step">
      <div className="step__header">
        <h2>{t('review.title')}</h2>
        <p>{t('review.sub')}</p>
      </div>

      {incomplete && (
        <Alert type="warning">
          {incA}<strong>{t('common.edit')}</strong>{incB}
        </Alert>
      )}

      <div className="summary">
        {sections.map((s) => {
          const Icon = ICONS[s.key];
          const hasErrors = stepErrors[s.step];
          return (
            <section key={s.key} className="summary__section" aria-labelledby={`sum-${s.key}`}>
              <div className="summary__head">
                <h3 id={`sum-${s.key}`}>
                  <Icon size={16} aria-hidden="true" /> {s.title}
                  {hasErrors && <span className="tag" style={{ background: 'var(--hp-error-bg)', color: 'var(--hp-error)' }}>{t('review.needsAttention')}</span>}
                </h3>
                <button type="button" className="summary__edit" onClick={() => goToStep(s.step)}>
                  {t('common.edit')}
                </button>
              </div>
              <dl>
                {s.rows.length === 0 && (
                  <>
                    <dt>—</dt>
                    <dd>{t('review.nothing')}</dd>
                  </>
                )}
                {s.rows.map(([k, v]) => (
                  <React.Fragment key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </React.Fragment>
                ))}
              </dl>
            </section>
          );
        })}
      </div>

      <div className="no-print" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
        <button type="button" className="btn btn--ghost btn--sm" style={{ width: 'auto' }} onClick={() => downloadBlob(summaryAsText(values, {}, t, locale), safeFilename(values, 'txt'), 'text/plain')}>
          <FiDownload size={16} aria-hidden="true" /> <span>{t('review.downloadDraft')}</span>
        </button>
        <button type="button" className="btn btn--ghost btn--sm" style={{ width: 'auto' }} onClick={() => printSummary(values, {}, t, locale)}>
          <FiPrinter size={16} aria-hidden="true" /> <span>{t('review.print')}</span>
        </button>
      </div>

      <fieldset className="fieldset" style={{ marginTop: 28 }}>
        <legend>{t('review.legendDeclarations')}</legend>
        <CheckboxField name="consent" label={t('review.consent')} description={t('review.consentDesc')} />
        <CheckboxField name="privacy" label={t('review.privacy')} description={t('review.privacyDesc')} />
        <CheckboxField name="emailCopy" label={t('review.emailCopy')} description={t('review.emailCopyDesc', { email: values.email || t('review.yourAddress') })} />
      </fieldset>
    </div>
  );
};

export default ReviewStep;
