import React, { useState } from 'react';
import { FiRefreshCw, FiDownload, FiExternalLink } from 'react-icons/fi';
import Alert from './ui/Alert';
import { buildSummarySections, formatDate, fullName } from '../utils/format';
import { summaryAsText, downloadBlob, safeFilename } from '../utils/summary';
import { downloadDataUrl } from '../utils/file';
import { getSubmissionCV } from '../services/firebaseService';

const CVDownload = ({ submission, className = 'btn btn--ghost btn--sm' }) => {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const download = async () => {
    if (submission.cvData) return downloadDataUrl(submission.cvData, submission.cvName);
    setBusy(true);
    setErr('');
    const res = await getSubmissionCV(submission.id);
    setBusy(false);
    if (res.success) downloadDataUrl(res.data.data, res.data.name || submission.cvName);
    else setErr(res.message);
  };
  return (
    <>
      <button type="button" className={className} style={{ width: 'auto' }} onClick={download} disabled={busy}>
        {busy ? <span className="spinner" aria-hidden="true" /> : <FiDownload size={16} aria-hidden="true" />} <span>{busy ? 'Fetching…' : 'Download CV'}</span>
      </button>
      {err && <span className="field__error" role="alert">{err}</span>}
    </>
  );
};

const SubmissionsList = ({ submissions, loading, error, onRefresh }) => (
  <section className="submissions" aria-labelledby="subs-title">
    <div className="submissions__head">
      <div>
        <h2 id="subs-title">Your previous submissions</h2>
        <p style={{ fontSize: '0.9rem' }}>Everything you have submitted from this account.</p>
      </div>
      <button type="button" className="btn btn--ghost btn--sm" style={{ width: 'auto' }} onClick={onRefresh} disabled={loading}>
        <FiRefreshCw size={16} aria-hidden="true" className={loading ? 'spin' : ''} /> <span>Refresh</span>
      </button>
    </div>

    {error && (
      <Alert type="warning">
        Could not load submissions from the database: {error}
        {submissions.some((s) => s.storedLocally) ? ' Copies saved on this device are listed below.' : ''}
      </Alert>
    )}

    {loading ? (
      <div style={{ display: 'grid', gap: 10 }} aria-busy="true" aria-label="Loading submissions">
        <div className="skeleton" style={{ height: 56 }} />
        <div className="skeleton" style={{ height: 56, width: '80%' }} />
      </div>
    ) : submissions.length === 0 ? (
      !error && <Alert type="info">No submissions yet. Once you submit the form above it will appear here.</Alert>
    ) : (
      submissions.map((s) => (
        <details key={s.id} className="submission">
          <summary className="submission__summary">
            <div>
              <div className="submission__title">{fullName(s) || 'Submission'}</div>
              <div className="submission__meta">
                {formatDate(s.submittedAt)} · Ref {s.id.slice(-8).toUpperCase()}
              </div>
            </div>
            {s.storedLocally ? (
              <span className="tag" style={{ background: 'var(--hp-warning-bg)', color: 'var(--hp-warning)' }} title="The database declined the write; this copy exists only in this browser">
                Saved on this device
              </span>
            ) : (
              <span className="tag tag--crimson">Submitted</span>
            )}
          </summary>
          <div className="submission__body">
            <div className="summary">
              {buildSummarySections(s).map((sec) => (
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
                onClick={() => downloadBlob(summaryAsText(s, { id: s.id, submittedAt: s.submittedAt }), safeFilename(s, 'txt'), 'text/plain')}
              >
                <FiDownload size={16} aria-hidden="true" /> <span>Download summary</span>
              </button>
              {s.cvUrl && (
                <a className="btn btn--ghost btn--sm" style={{ width: 'auto' }} href={s.cvUrl} target="_blank" rel="noreferrer">
                  <FiExternalLink size={16} aria-hidden="true" /> <span>Open CV</span>
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

export default SubmissionsList;
