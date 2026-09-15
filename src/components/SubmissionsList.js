import React, { useState } from 'react';
import { FiRefreshCw, FiDownload, FiExternalLink } from 'react-icons/fi';
import Alert from './ui/Alert';
import { buildSummarySections, formatDate, fullName } from '../utils/format';
import { summaryAsText, downloadBlob, safeFilename } from '../utils/summary';
import { downloadDataUrl } from '../utils/file';
import { getSubmissionCV } from '../services/firebaseService';
import { useI18n } from '../i18n';

const CVDownload = ({ submission, className = 'btn btn--ghost btn--sm' }) => {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const download = async () => {
    if (submission.cvData) return downloadDataUrl(submission.cvData, submission.cvName);
    setBusy(true);
    setErr('');
    const res = await getSubmissionCV(submission.id);
    setBusy(false);
    if (res.success) downloadDataUrl(res.data.data, res.data.name || submission.cvName);
    else setErr(t(res.messageKey));
  };
  return (
    <>
      <button type="button" className={className} style={{ width: 'auto' }} onClick={download} disabled={busy}>
        {busy ? <span className="spinner" aria-hidden="true" /> : <FiDownload size={16} aria-hidden="true" />} <span>{busy ? t('subs.fetching') : t('subs.downloadCv')}</span>
      </button>
      {err && <span className="field__error" role="alert">{err}</span>}
    </>
  );
};

const SubmissionsList = ({ submissions, loading, errorKey, onRefresh }) => {
  const { t, locale } = useI18n();
  return (
    <section className="submissions" aria-labelledby="subs-title">
      <div className="submissions__head">
        <div>
          <h2 id="subs-title">{t('subs.title')}</h2>
          <p style={{ fontSize: '0.9rem' }}>{t('subs.sub')}</p>
        </div>
        <button type="button" className="btn btn--ghost btn--sm" style={{ width: 'auto' }} onClick={onRefresh} disabled={loading}>
          <FiRefreshCw size={16} aria-hidden="true" /> <span>{t('common.refresh')}</span>
        </button>
      </div>

      {errorKey && (
        <Alert type="warning">
          {t('subs.loadError', { error: t(errorKey) })}
          {submissions.some((s) => s.storedLocally) ? t('subs.localHint') : ''}
        </Alert>
      )}

      {loading ? (
        <div style={{ display: 'grid', gap: 10 }} aria-busy="true" aria-label={t('subs.loading')}>
          <div className="skeleton" style={{ height: 56 }} />
          <div className="skeleton" style={{ height: 56, width: '80%' }} />
        </div>
      ) : submissions.length === 0 ? (
        !errorKey && <Alert type="info">{t('subs.empty')}</Alert>
      ) : (
        submissions.map((s) => (
          <details key={s.id} className="submission">
            <summary className="submission__summary">
              <div>
                <div className="submission__title">{fullName(s) || t('subs.untitled')}</div>
                <div className="submission__meta">
                  {formatDate(s.submittedAt, locale)} · {t('subs.ref', { id: s.id.slice(-8).toUpperCase() })}
                </div>
              </div>
              {s.storedLocally ? (
                <span className="tag" style={{ background: 'var(--hp-warning-bg)', color: 'var(--hp-warning)' }} title={t('subs.savedDeviceTitle')}>
                  {t('subs.savedDevice')}
                </span>
              ) : (
                <span className="tag tag--crimson">{t('subs.submitted')}</span>
              )}
            </summary>
            <div className="submission__body">
              <div className="summary">
                {buildSummarySections(s, t, locale).map((sec) => (
                  <div key={sec.key} className="summary__section">
                    <div className="summary__head"><h3>{sec.title}</h3></div>
                    <dl>
                      {sec.rows.map(([k, v]) => (
                        <React.Fragment key={k}>
                          <dt>{k}</dt>
                          <dd>{v}</dd>
                        </React.Fragment>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  style={{ width: 'auto' }}
                  onClick={() => downloadBlob(summaryAsText(s, { id: s.id, submittedAt: s.submittedAt }, t, locale), safeFilename(s, 'txt'), 'text/plain')}
                >
                  <FiDownload size={16} aria-hidden="true" /> <span>{t('subs.downloadSummary')}</span>
                </button>
                {s.cvUrl && (
                  <a className="btn btn--ghost btn--sm" style={{ width: 'auto' }} href={s.cvUrl} target="_blank" rel="noreferrer">
                    <FiExternalLink size={16} aria-hidden="true" /> <span>{t('subs.openCv')}</span>
                  </a>
                )}
                {!s.cvUrl && (s.cvData || s.cvInline) && <CVDownload submission={s} />}
              </div>
            </div>
          </details>
        ))
      )}
    </section>
  );
};

export default SubmissionsList;
