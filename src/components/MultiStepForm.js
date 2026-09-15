import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Formik, Form, useFormikContext } from 'formik';
import {
  FiArrowLeft, FiArrowRight, FiCheck, FiCheckCircle, FiClock, FiFileText, FiHelpCircle, FiSave, FiSend, FiTrash2, FiRotateCcw, FiWifiOff, FiInfo,
} from 'react-icons/fi';
import PersonalInfoStep from './steps/PersonalInfoStep';
import ContactStep from './steps/ContactStep';
import ProfessionalStep from './steps/ProfessionalStep';
import ReviewStep from './steps/ReviewStep';
import SuccessScreen from './SuccessScreen';
import SubmissionsList from './SubmissionsList';
import Button from './ui/Button';
import Alert from './ui/Alert';
import { useToast } from './ui/Toast';
import { useAuth } from '../contexts/AuthContext';
import { submitForm, getUserSubmissions } from '../services/firebaseService';
import { uploadCV } from '../services/storageService';
import { fileToDataUrl, INLINE_CV_MAX_BYTES } from '../utils/file';
import { readLocalSubmissions, saveLocalSubmission, makeLocalId } from '../services/localStore';
import { STEP_SCHEMAS, STEP_FIELDS, INITIAL_VALUES } from '../validation/schemas';
import { readDraft, useDraftSaver } from '../hooks/useDraft';
import { useOnline } from '../hooks/useOnline';
import { buildMailto } from '../utils/summary';
import { formatDate } from '../utils/format';

const STEPS = [
  { title: 'Personal', component: PersonalInfoStep },
  { title: 'Contact', component: ContactStep },
  { title: 'Background', component: ProfessionalStep },
  { title: 'Review', component: ReviewStep },
];

// Mirrors live Formik values up to the parent so the draft saver can persist them.
const DraftSync = ({ onChange }) => {
  const { values } = useFormikContext();
  useEffect(() => {
    onChange(values);
  }, [values, onChange]);
  return null;
};

const timeAgo = (ts) => {
  if (!ts) return '';
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  return m < 60 ? `${m} min ago` : 'over an hour ago';
};

/** Per-step validation error counts for the three data steps, via Yup. */
const countErrors = (values) =>
  STEP_SCHEMAS.slice(0, 3).map((schema) => {
    try {
      schema.validateSync(values, { abortEarly: false });
      return 0;
    } catch (e) {
      return new Set((e.inner || []).map((x) => x.path)).size || 1;
    }
  });

// Number of answers an empty form still needs; the completion meter measures
// against this rather than every schema field so optional fields don't inflate it.
const BASE_REQUIRED = countErrors(INITIAL_VALUES).reduce((a, b) => a + b, 0);

const Stepper = ({ step, maxReached, onSelect }) => (
  <ol className="stepper" aria-label="Form progress">
    {STEPS.map((s, i) => {
      const state = i < step ? 'complete' : i === step ? 'current' : 'upcoming';
      const clickable = i <= maxReached && i !== step;
      return (
        <li key={s.title} style={{ display: 'contents' }}>
          <button
            type="button"
            className="stepper__item"
            data-state={state}
            data-clickable={clickable}
            aria-current={i === step ? 'step' : undefined}
            aria-label={`Step ${i + 1} of ${STEPS.length}: ${s.title}${state === 'complete' ? ', completed' : ''}`}
            disabled={!clickable}
            onClick={() => clickable && onSelect(i)}
          >
            <span className="stepper__bar" aria-hidden="true" />
            <span className="stepper__label" aria-hidden="true">
              <span className="stepper__num">{state === 'complete' ? <FiCheck size={12} /> : i + 1}</span>
              <span className="stepper__title">{s.title}</span>
            </span>
          </button>
        </li>
      );
    })}
  </ol>
);

const MultiStepForm = () => {
  const { user, userId } = useAuth();
  const toast = useToast();
  const online = useOnline();

  const draft = useMemo(() => readDraft(userId), [userId]);
  const [step, setStep] = useState(() => Math.min(draft?.step ?? 0, STEPS.length - 1));
  const [maxReached, setMaxReached] = useState(step);
  const [restoredCvMeta] = useState(draft?.values?.cvMeta || null);
  const [showRestored, setShowRestored] = useState(Boolean(draft?.values));
  const [result, setResult] = useState(null); // { values, id, submittedAt, cvStatus, storageMode }
  const [progress, setProgress] = useState(null); // { label, pct }
  const [submitError, setSubmitError] = useState('');
  const [announce, setAnnounce] = useState('');

  const [submissions, setSubmissions] = useState([]);
  const [localSubs, setLocalSubs] = useState(() => readLocalSubmissions(userId));
  const [subsLoading, setSubsLoading] = useState(true);
  const [subsError, setSubsError] = useState('');

  const headingRef = useRef(null);
  const formikRef = useRef(null);

  // Draft autosave needs live Formik values; <DraftSync> mirrors them here.
  const [liveValues, setLiveValues] = useState(null);
  const draftApi = useDraftSaver(userId, liveValues, step, !result && liveValues != null);
  const hasDraft = Boolean(draftApi.savedAt || draft?.values);

  const initialValues = useMemo(() => {
    const restored = draft?.values ? { ...draft.values } : {};
    delete restored.cvMeta;
    return { ...INITIAL_VALUES, email: user?.email || '', ...restored, cv: null };
  }, [draft, user]);

  const loadSubmissions = useCallback(async () => {
    setSubsLoading(true);
    setSubsError('');
    const res = await getUserSubmissions(userId);
    if (res.success) setSubmissions(res.data);
    else setSubsError(res.message);
    setSubsLoading(false);
  }, [userId]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const goTo = useCallback((i) => {
    setStep(i);
    setMaxReached((m) => Math.max(m, i));
    setAnnounce(`Step ${i + 1} of ${STEPS.length}: ${STEPS[i].title}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      const h = headingRef.current?.querySelector('.step__header h2');
      if (h) {
        h.setAttribute('tabindex', '-1');
        h.focus({ preventScroll: true });
      }
    }, 250);
  }, []);

  const focusFirstInvalid = (errors) => {
    const names = STEP_FIELDS[step].filter((n) => errors[n]);
    for (const n of names) {
      const el = document.querySelector(`[name="${n}"]`);
      if (el) {
        el.focus({ preventScroll: false });
        el.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
        return;
      }
    }
  };

  const handleNext = async (formik) => {
    const errors = await formik.validateForm();
    const fields = STEP_FIELDS[step];
    const stepErrors = fields.filter((f) => errors[f]);
    if (stepErrors.length) {
      fields.forEach((f) => formik.setFieldTouched(f, true, false));
      toast.error(`Please fix ${stepErrors.length} field${stepErrors.length > 1 ? 's' : ''} before continuing.`, 4000);
      focusFirstInvalid(errors);
      return;
    }
    goTo(step + 1);
  };

  const handleSubmit = async (values, helpers) => {
    setSubmitError('');
    if (!online) {
      setSubmitError('You appear to be offline. Your answers are saved on this device; reconnect and submit again.');
      helpers.setSubmitting(false);
      return;
    }
    let cvStatus = null;
    let inlineCv = null;
    let cvFields = {
      cvName: values.cv?.name || null,
      cvSize: values.cv?.size || null,
      cvType: values.cv?.type || null,
      cvUrl: null,
      cvPath: null,
    };

    // 1. CV: try Firebase Storage first; if the bucket is unavailable, embed
    //    small files in a Firestore subcollection instead.
    if (values.cv) {
      setProgress({ label: 'Uploading CV…', pct: 0 });
      const up = await uploadCV(values.cv, userId, (pct) => setProgress({ label: 'Uploading CV…', pct }));
      if (up.success) {
        cvStatus = { success: true, mode: 'storage' };
        cvFields = { ...cvFields, cvUrl: up.url, cvPath: up.path };
      } else if (values.cv.size <= INLINE_CV_MAX_BYTES) {
        try {
          setProgress({ label: 'Attaching CV…', pct: null });
          inlineCv = await fileToDataUrl(values.cv);
          cvStatus = { success: true, mode: 'inline' };
        } catch {
          cvStatus = { success: false, message: up.message };
        }
      } else {
        cvStatus = { success: false, message: `${up.message} Files over 600 KB cannot be embedded, so only the file name was recorded.` };
      }
    }

    // 2. Submission document
    setProgress({ label: 'Saving your form…', pct: null });
    const { cv, consent, privacy, emailCopy, ...rest } = values;
    const payload = {
      ...rest,
      ...cvFields,
      consentGiven: consent,
      privacyAccepted: privacy,
      userId,
      userEmail: user?.email || null,
      formVersion: 3,
    };

    const res = await submitForm(payload, inlineCv);
    setProgress(null);
    helpers.setSubmitting(false);

    let storageMode = 'firestore';
    let id = res.id;

    if (!res.success) {
      if (res.code === 'permission-denied' || res.code === 'unavailable') {
        // 3. The database refused. Keep the completed submission on this device
        //    so nothing is lost, and say so plainly on the confirmation screen.
        id = makeLocalId();
        const saved = saveLocalSubmission(userId, { ...payload, id, submittedAt: new Date().toISOString(), timestamp: Date.now(), storedLocally: true });
        if (!saved) {
          setSubmitError(res.message);
          toast.error('Submission failed. Your answers are still here, nothing was lost.');
          return;
        }
        storageMode = 'local';
        setLocalSubs(readLocalSubmissions(userId));
      } else {
        setSubmitError(res.message);
        toast.error('Submission failed. Your answers are still here, nothing was lost.');
        return;
      }
    }

    draftApi.reset();
    setResult({ values, id, submittedAt: new Date(), cvStatus, storageMode, dbMessage: res.success ? null : res.message });
    if (storageMode === 'firestore') toast.success('Form submitted successfully.');
    else toast.info('Saved on this device. The submissions database declined the write.', 6000);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadSubmissions();

    if (emailCopy && values.email) {
      setTimeout(() => {
        try {
          window.location.assign(buildMailto(values.email, values, { id, submittedAt: new Date() }));
        } catch {
          /* mail client unavailable */
        }
      }, 800);
    }
  };

  const resetAll = () => {
    formikRef.current?.resetForm({ values: { ...INITIAL_VALUES, email: user?.email || '' } });
    setStep(0);
    setMaxReached(0);
    setShowRestored(false);
  };

  const startAnother = () => {
    setResult(null);
    resetAll();
    goTo(0);
  };

  const clearDraftAndReset = () => {
    draftApi.reset();
    resetAll();
    toast.info('Draft cleared.');
  };

  if (result) {
    return (
      <div className="container">
        <SuccessScreen
          values={result.values}
          submissionId={result.id}
          submittedAt={result.submittedAt}
          cvStatus={result.cvStatus}
          storageMode={result.storageMode}
          dbMessage={result.dbMessage}
          onStartAnother={startAnother}
        />
        <SubmissionsList submissions={[...localSubs, ...submissions]} loading={subsLoading} error={subsError} onRefresh={loadSubmissions} />
      </div>
    );
  }

  const StepComponent = STEPS[step].component;
  const isLast = step === STEPS.length - 1;
  const latest = submissions[0];

  return (
    <div className="container">
      <span className="sr-only" role="status" aria-live="polite">{announce}</span>

      {!online && (
        <Alert type="warning">
          <FiWifiOff size={16} aria-hidden="true" style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
          You are offline. Your answers keep saving on this device; you can submit once you reconnect.
        </Alert>
      )}

      {showRestored && (
        <div className="alert alert--info no-print" role="status">
          <FiRotateCcw size={18} aria-hidden="true" />
          <div style={{ flex: 1 }}>
            <strong>Welcome back.</strong> We restored the draft you were working on{draft?.savedAt ? ` (${timeAgo(draft.savedAt)})` : ''}.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn--ghost btn--sm" style={{ width: 'auto' }} onClick={() => setShowRestored(false)}>Keep going</button>
            <button type="button" className="btn btn--danger-ghost btn--sm" style={{ width: 'auto' }} onClick={clearDraftAndReset}>Start over</button>
          </div>
        </div>
      )}

      {latest && !subsLoading && (
        <div className="alert alert--info no-print" role="note">
          <FiInfo size={18} aria-hidden="true" />
          <div>
            You already submitted a form on <strong>{formatDate(latest.submittedAt)}</strong>. Submitting again creates a separate record; the HPAIR team will see both.
          </div>
        </div>
      )}

      <Formik
        innerRef={formikRef}
        initialValues={initialValues}
        validationSchema={STEP_SCHEMAS[step]}
        validateOnChange
        validateOnBlur
        validateOnMount
        onSubmit={handleSubmit}
      >
        {(formik) => {
          const errorCounts = countErrors(formik.values);
          const stepErrors = errorCounts.map((n) => n > 0);
          const allValid = !stepErrors.some(Boolean) && formik.isValid;
          const remaining = errorCounts.reduce((a, b) => a + b, 0);
          const denominator = Math.max(BASE_REQUIRED, remaining, 1);
          const percent = Math.max(0, Math.min(100, Math.round(((denominator - remaining) / denominator) * 100)));

          const onKeyDown = (e) => {
            if (e.key !== 'Enter') return;
            const t = e.target;
            if (t.tagName === 'TEXTAREA' || t.tagName === 'BUTTON' || t.type === 'checkbox' || t.type === 'radio' || t.type === 'file') return;
            if (!isLast) {
              e.preventDefault();
              handleNext(formik);
            }
          };

          return (
            <div className="form-shell">
              <Form noValidate onKeyDown={onKeyDown} aria-busy={formik.isSubmitting || undefined}>
                <DraftSync onChange={setLiveValues} />
                <div className="card card--pad" ref={headingRef}>
                  <Stepper step={step} maxReached={maxReached} onSelect={goTo} />

                  {StepComponent === ReviewStep ? (
                    <ReviewStep goToStep={goTo} stepErrors={stepErrors} />
                  ) : StepComponent === ProfessionalStep ? (
                    <ProfessionalStep restoredCvMeta={restoredCvMeta} />
                  ) : (
                    <StepComponent />
                  )}

                  {submitError && (
                    <Alert type="error">
                      <strong>Submission failed.</strong> {submitError}
                    </Alert>
                  )}

                  {progress && (
                    <div className="alert alert--info" role="status" aria-live="polite">
                      <span className="spinner" aria-hidden="true" />
                      <div style={{ flex: 1 }}>
                        {progress.label} {progress.pct != null && `${progress.pct}%`}
                        {progress.pct != null && (
                          <div className="progress" aria-hidden="true"><span style={{ width: `${progress.pct}%` }} /></div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="form-actions">
                    <div>
                      {step > 0 && (
                        <Button type="button" variant="ghost" icon={FiArrowLeft} onClick={() => goTo(step - 1)} disabled={formik.isSubmitting}>
                          Back
                        </Button>
                      )}
                    </div>
                    <div className="form-actions__right">
                      <span className="autosave" aria-live="polite">
                        {draftApi.savedAt ? (
                          <>
                            <FiCheckCircle size={14} aria-hidden="true" /> Draft saved {timeAgo(draftApi.savedAt)}
                          </>
                        ) : (
                          <>
                            <FiSave size={14} aria-hidden="true" style={{ color: 'inherit' }} /> Autosave on
                          </>
                        )}
                      </span>
                      {isLast ? (
                        <Button type="submit" loading={formik.isSubmitting} disabled={!allValid || !online} icon={FiSend}>
                          Submit form
                        </Button>
                      ) : (
                        <Button type="button" onClick={() => handleNext(formik)} iconRight={FiArrowRight} disabled={formik.isSubmitting}>
                          Continue
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Form>

              <aside className="side-rail" aria-label="Help and progress">
                <div className="card side-rail__block">
                  <div className="completion">
                    <div className="completion__head">
                      <h3>Completion</h3>
                      <strong>{percent}%</strong>
                    </div>
                    <div className="progress progress--thick" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Form completion">
                      <span style={{ width: `${percent}%` }} />
                    </div>
                    <p className="completion__hint">
                      {remaining === 0 ? 'Everything is filled in. Review and submit.' : `${remaining} field${remaining === 1 ? '' : 's'} still need${remaining === 1 ? 's' : ''} attention.`}
                    </p>
                  </div>
                  <ul>
                    {STEPS.slice(0, 3).map((s, i) => {
                      const done = !stepErrors[i];
                      return (
                        <li key={s.title}>
                          {done ? <FiCheckCircle size={16} aria-hidden="true" /> : <FiClock size={16} aria-hidden="true" style={{ color: 'var(--hp-ink-muted)' }} />}
                          <span>
                            {s.title}{' '}
                            {done ? '' : <span style={{ color: 'var(--hp-ink-muted)' }}>· {errorCounts[i]} to go</span>}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className="card side-rail__block">
                  <h3>Before you start</h3>
                  <ul>
                    <li><FiFileText size={16} aria-hidden="true" /> <span>Have your CV ready as a PDF or Word file under 5 MB.</span></li>
                    <li><FiHelpCircle size={16} aria-hidden="true" /> <span>Fields marked <em>Optional</em> can be skipped. Everything else is required.</span></li>
                    <li><FiSave size={16} aria-hidden="true" /> <span>Press <kbd>Enter</kbd> to move to the next section, <kbd>Tab</kbd> between fields.</span></li>
                  </ul>
                </div>
                <div className="card card--dark side-rail__block">
                  <h3>Need help?</h3>
                  <p style={{ color: 'rgba(252,252,252,.75)' }}>
                    Email <a href="mailto:cqiu@college.harvard.edu" style={{ color: '#fff' }}>cqiu@college.harvard.edu</a> or{' '}
                    <a href="mailto:ashleyzheng@college.harvard.edu" style={{ color: '#fff' }}>ashleyzheng@college.harvard.edu</a>.
                  </p>
                </div>
                {hasDraft && (
                  <button type="button" className="btn btn--danger-ghost btn--sm" onClick={clearDraftAndReset}>
                    <FiTrash2 size={14} aria-hidden="true" /> <span>Clear draft and start over</span>
                  </button>
                )}
              </aside>
            </div>
          );
        }}
      </Formik>

      <SubmissionsList submissions={[...localSubs, ...submissions]} loading={subsLoading} error={subsError} onRefresh={loadSubmissions} />
    </div>
  );
};

export default MultiStepForm;
