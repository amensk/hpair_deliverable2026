import React from 'react';
import { useFormikContext } from 'formik';
import { FiUser, FiMapPin, FiBriefcase, FiDownload, FiPrinter } from 'react-icons/fi';
import { CheckboxField } from '../ui/Field';
import Alert from '../ui/Alert';
import { buildSummarySections } from '../../utils/format';
import { summaryAsText, downloadBlob, safeFilename, printSummary } from '../../utils/summary';

const ICONS = { personal: FiUser, contact: FiMapPin, professional: FiBriefcase };

const ReviewStep = ({ goToStep, stepErrors }) => {
  const { values } = useFormikContext();
  const sections = buildSummarySections(values);
  const incomplete = stepErrors.some(Boolean);

  return (
    <div className="step">
      <div className="step__header">
        <h2>Review &amp; submit</h2>
        <p>Check everything carefully. You can jump back to any section to make changes.</p>
      </div>

      {incomplete && (
        <Alert type="warning">
          Some sections still have missing or invalid answers. Use the <strong>Edit</strong> links below to fix them before submitting.
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
                  {hasErrors && <span className="tag" style={{ background: 'var(--hp-error-bg)', color: 'var(--hp-error)' }}>Needs attention</span>}
                </h3>
                <button type="button" className="summary__edit" onClick={() => goToStep(s.step)}>
                  Edit
                </button>
              </div>
              <dl>
                {s.rows.length === 0 && (
                  <>
                    <dt>—</dt>
                    <dd>Nothing entered yet</dd>
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
        <button type="button" className="btn btn--ghost btn--sm" style={{ width: 'auto' }} onClick={() => downloadBlob(summaryAsText(values), safeFilename(values, 'txt'), 'text/plain')}>
          <FiDownload size={16} aria-hidden="true" /> <span>Download draft (.txt)</span>
        </button>
        <button type="button" className="btn btn--ghost btn--sm" style={{ width: 'auto' }} onClick={() => printSummary(values)}>
          <FiPrinter size={16} aria-hidden="true" /> <span>Print / save as PDF</span>
        </button>
      </div>

      <fieldset className="fieldset" style={{ marginTop: 28 }}>
        <legend>Declarations</legend>
        <CheckboxField name="consent" label="I confirm the information above is accurate and complete." description="Providing false information may result in your application being withdrawn." />
        <CheckboxField
          name="privacy"
          label="I agree to HPAIR processing my personal data for conference administration."
          description="Your data is stored securely and used only for HPAIR programmes. It is never sold."
        />
        <CheckboxField name="emailCopy" label="Email me a copy of my submission" description={`We will open a pre-filled email to ${values.email || 'your address'} after you submit.`} />
      </fieldset>
    </div>
  );
};

export default ReviewStep;
