import React from 'react';
import { FiCheck, FiDownload, FiMail, FiPrinter, FiPlus, FiCode } from 'react-icons/fi';
import Button from './ui/Button';
import Alert from './ui/Alert';
import { summaryAsText, summaryAsJSON, downloadBlob, safeFilename, buildMailto, printSummary } from '../utils/summary';
import { fullName } from '../utils/format';

const SuccessScreen = ({ values, submissionId, submittedAt, cvStatus, storageMode = 'firestore', dbMessage, onStartAnother }) => {
  const meta = { id: submissionId, submittedAt };
  const mailHref = buildMailto(values.email, values, meta);
  const local = storageMode === 'local';

  return (
    <div className="card success">
      <span className="success__mark" aria-hidden="true" style={local ? { background: 'var(--hp-warning)' } : undefined}>
        <FiCheck size={30} />
      </span>
      <span className="eyebrow" style={local ? { color: 'var(--hp-warning)' } : undefined}>
        {local ? 'Form completed · saved on this device' : 'Submission received'}
      </span>
      <h1>Thank you, {values.preferredName || values.firstName}.</h1>
      {local ? (
        <p>
          Your form is complete and every answer has been kept safely on this device. The submissions database declined the
          write, so it has <strong>not</strong> reached HPAIR yet. Use <strong>Email me a copy</strong> to send it, or download it below.
        </p>
      ) : (
        <p>
          Your delegate information form has been submitted. Keep the reference below for your records. The HPAIR team will be
          in touch by email at <strong>{values.email}</strong>.
        </p>
      )}
      <span className="success__ref">Reference {submissionId}</span>

      {local && (
        <div style={{ maxWidth: 560, margin: '24px auto 0', textAlign: 'left' }}>
          <Alert type="warning">
            <strong>Database said:</strong> {dbMessage} This usually means the Firebase project's security rules do not allow
            writes. Your answers are listed under <em>Your previous submissions</em> below on this device.
          </Alert>
        </div>
      )}

      {cvStatus && cvStatus.success === false && (
        <div style={{ maxWidth: 560, margin: '24px auto 0', textAlign: 'left' }}>
          <Alert type="warning">
            Your form was saved, but the CV file itself could not be stored ({cvStatus.message}). We recorded the file name,
            and you can email it as an attachment using the button below.
          </Alert>
        </div>
      )}
      {cvStatus && cvStatus.success && cvStatus.mode === 'inline' && !local && (
        <div style={{ maxWidth: 560, margin: '24px auto 0', textAlign: 'left' }}>
          <Alert type="info">The file storage bucket was unavailable, so your CV was embedded directly in the submission record instead.</Alert>
        </div>
      )}

      <div className="success__actions">
        <a className="btn btn--primary" href={mailHref}>
          <FiMail size={18} aria-hidden="true" /> <span>Email me a copy</span>
        </a>
        <Button variant="secondary" icon={FiDownload} onClick={() => downloadBlob(summaryAsText(values, meta), safeFilename(values, 'txt'), 'text/plain')}>
          Download summary (.txt)
        </Button>
        <Button variant="secondary" icon={FiCode} onClick={() => downloadBlob(summaryAsJSON(values, meta), safeFilename(values, 'json'), 'application/json')}>
          Download data (.json)
        </Button>
        <Button variant="secondary" icon={FiPrinter} onClick={() => printSummary(values, meta)}>
          Print / save as PDF
        </Button>
      </div>

      <div style={{ marginTop: 32 }}>
        <Button variant="ghost" icon={FiPlus} onClick={onStartAnother}>
          Submit another form
        </Button>
      </div>
      <p style={{ fontSize: '0.8rem', marginTop: 16 }}>Submitted for {fullName(values)}.</p>
    </div>
  );
};

export default SuccessScreen;
