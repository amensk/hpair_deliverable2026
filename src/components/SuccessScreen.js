import React from 'react';
import { FiCheck, FiDownload, FiMail, FiPrinter, FiPlus, FiCode } from 'react-icons/fi';
import Button from './ui/Button';
import Alert from './ui/Alert';
import { summaryAsText, summaryAsJSON, downloadBlob, safeFilename, buildMailto, printSummary } from '../utils/summary';
import { fullName } from '../utils/format';
import { useI18n } from '../i18n';

const SuccessScreen = ({ values, submissionId, submittedAt, cvStatus, storageMode = 'firestore', dbMessageKey, onStartAnother }) => {
  const { t, locale } = useI18n();
  const meta = { id: submissionId, submittedAt };
  const mailHref = buildMailto(values.email, values, meta, t, locale);
  const local = storageMode === 'local';

  return (
    <div className="card success">
      <span className="success__mark" aria-hidden="true" style={local ? { background: 'var(--hp-warning)' } : undefined}>
        <FiCheck size={30} />
      </span>
      <span className="eyebrow" style={local ? { color: 'var(--hp-warning)' } : undefined}>
        {local ? t('success.local') : t('success.received')}
      </span>
      <h1>{t('success.thanks', { name: values.preferredName || values.firstName })}</h1>
      <p>{local ? t('success.bodyLocal') : t('success.bodyReceived', { email: values.email })}</p>
      <span className="success__ref">{t('success.reference', { id: submissionId })}</span>

      {local && (
        <div style={{ maxWidth: 560, margin: '24px auto 0', textAlign: 'left' }}>
          <Alert type="warning">
            <strong>{t('success.dbSaid')}</strong> {dbMessageKey ? t(dbMessageKey) : ''} {t('success.dbHint')}
          </Alert>
        </div>
      )}

      {cvStatus && cvStatus.success === false && (
        <div style={{ maxWidth: 560, margin: '24px auto 0', textAlign: 'left' }}>
          <Alert type="warning">{t('success.cvFail', { message: cvStatus.messageKey ? t(cvStatus.messageKey) : cvStatus.message })}</Alert>
        </div>
      )}
      {cvStatus && cvStatus.success && cvStatus.mode === 'inline' && !local && (
        <div style={{ maxWidth: 560, margin: '24px auto 0', textAlign: 'left' }}>
          <Alert type="info">{t('success.cvInline')}</Alert>
        </div>
      )}

      <div className="success__actions">
        <a className="btn btn--primary" href={mailHref}>
          <FiMail size={18} aria-hidden="true" /> <span>{t('success.emailCopy')}</span>
        </a>
        <Button variant="secondary" icon={FiDownload} onClick={() => downloadBlob(summaryAsText(values, meta, t, locale), safeFilename(values, 'txt'), 'text/plain')}>
          {t('success.downloadTxt')}
        </Button>
        <Button variant="secondary" icon={FiCode} onClick={() => downloadBlob(summaryAsJSON(values, meta), safeFilename(values, 'json'), 'application/json')}>
          {t('success.downloadJson')}
        </Button>
        <Button variant="secondary" icon={FiPrinter} onClick={() => printSummary(values, meta, t, locale)}>
          {t('success.print')}
        </Button>
      </div>

      <div style={{ marginTop: 32 }}>
        <Button variant="ghost" icon={FiPlus} onClick={onStartAnother}>
          {t('success.another')}
        </Button>
      </div>
      <p style={{ fontSize: '0.8rem', marginTop: 16 }}>{t('success.submittedFor', { name: fullName(values) })}</p>
    </div>
  );
};

export default SuccessScreen;
