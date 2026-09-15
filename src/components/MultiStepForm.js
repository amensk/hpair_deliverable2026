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
import { STEP_FIELDS, INITIAL_VALUES, useSchemas } from '../validation/schemas';
import { useI18n } from '../i18n';
import { readDraft, useDraftSaver } from '../hooks/useDraft';
import { useOnline } from '../hooks/useOnline';
import { buildMailto } from '../utils/summary';
import { formatDate } from '../utils/format';

const STEPS = [
  { key: 'form.steps.personal', component: PersonalInfoStep },
  { key: 'form.steps.contact', component: ContactStep },
  { key: 'form.steps.background', component: ProfessionalStep },
  { key: 'form.steps.review', component: ReviewStep },
];

// Mirrors live Formik values up to the parent so the draft saver can persist them.
const DraftSync = ({ onChange }) => {
  const { values } = useFormikContext();
  useEffect(() => {
    onChange(values);
  }, [values, onChange]);
  return null;
};

const timeAgo = (ts, t) => {
  if (!ts) return '';
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 5) return t('form.justNow');
  if (s < 60) return t('form.secondsAgo', { s });
  const m = Math.round(s / 60);
  return m < 60 ? t('form.minutesAgo', { m }) : t('form.overHour');
};

/** Per-step validation error counts for the three data steps, via Yup. */
const countErrors = (schemas, values) =>
  schemas.slice(0, 3).map((schema) => {
    try {
      schema.validateSync(values, { abortEarly: false });
      return 0;
    } catch (e) {
      return new Set((e.inner || []).map((x) => x.path)).size || 1;
    }
  });

const Stepper = ({ step, maxReached, onSelect }) => {
  const { t } = useI18n();
  return (
  <ol className="stepper" aria-label={t('form.progressLabel')}>
    {STEPS.map((s, i) => {
      const state = i < step ? 'complete' : i === step ? 'current' : 'upcoming';
      const clickable = i <= maxReached && i !== step;
      return (
        <li key={s.key} style={{ display: 'contents' }}>
          <button
            type="button"
            className="stepper__item"
            data-state={state}
            data-clickable={clickable}
            aria-current={i === step ? 'step' : undefined}
            aria-label={t('form.stepOf', { n: i + 1, total: STEPS.length, title: t(s.key) }) + (state === 'complete' ? t('form.stepCompleted') : '')}
            disabled={!clickable}
            onClick={() => clickable && onSelect(i)}
          >
            <span className="stepper__bar" aria-hidden="true" />
            <span className="stepper__label" aria-hidden="true">
              <span className="stepper__num">{state === 'complete' ? <FiCheck size={12} /> : i + 1}</span>
              <span className="stepper__title">{t(s.key)}</span>
            </span>
          </button>
        </li>
      );
    })}
  </ol>
  );
};

const MultiStepForm = () => {
  const { user, userId } = useAuth();
  const toast = useToast();
  const online = useOnline();
  const { t, lang, locale } = useI18n();
  const { STEP_SCHEMAS } = useSchemas();
  // Number of answers an empty form still needs; the completion meter measures
  // against this rather than every schema field so optional fields don't inflate it.
  const baseRequired = useMemo(() => countErrors(STEP_SCHEMAS, INITIAL_VALUES).reduce((a, b) => a + b, 0), [STEP_SCHEMAS]);

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
  const [subsErrorKey, setSubsErrorKey] = useState('');

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
    setSubsErrorKey('');
    const res = await getUserSubmissions(userId);
    if (res.success) setSubmissions(res.data);
    else setSubsErrorKey(res.messageKey);
    setSubsLoading(false);
  }, [userId]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const goTo = useCallback((i) => {
    setStep(i);
    setMaxReached((m) => Math.max(m, i));
    setAnnounce(t('form.stepOf', { n: i + 1, total: STEPS.length, title: t(STEPS[i].key) }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      const h = headingRef.current?.querySelector('.step__header h2');
      if (h) {
        h.setAttribute('tabindex', '-1');
        h.focus({ preventScroll: true });
      }
    }, 250);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

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
      toast.error(t('toast.fixFields', { count: stepErrors.length }), 4000);
      focusFirstInvalid(errors);
      return;
    }
    goTo(step + 1);
  };

  const handleSubmit = async (values, helpers) => {
    setSubmitError('');
    if (!online) {
      setSubmitError(t('form.offlineSubmit'));
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
      setProgress({ label: t('form.uploadingCv'), pct: 0 });
      const up = await uploadCV(values.cv, userId, (pct) => setProgress({ label: t('form.uploadingCv'), pct }));
      if (up.success) {
        cvStatus = { success: true, mode: 'storage' };
        cvFields = { ...cvFields, cvUrl: up.url, cvPath: up.path };
      } else if (values.cv.size <= INLINE_CV_MAX_BYTES) {
        try {
          setProgress({ label: t('form.attachingCv'), pct: null });
          inlineCv = await fileToDataUrl(values.cv);
          cvStatus = { success: true, mode: 'inline' };
        } catch {
          cvStatus = { success: false, messageKey: up.messageKey, message: up.message };
        }
      } else {
        cvStatus = { success: false, message: `${t(up.messageKey)} ${t('err.cv.tooBigInline')}` };
      }
    }

    // 2. Submission document
    setProgress({ label: t('form.saving'), pct: null });
    const { cv, consent, privacy, emailCopy, ...rest } = values;
    const payload = {
      ...rest,
      ...cvFields,
      consentGiven: consent,
      privacyAccepted: privacy,
      userId,
      userEmail: user?.email || null,
      uiLanguage: lang,
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
          setSubmitError(t(res.messageKey));
          toast.error(t('toast.submitFailed'));
          return;
        }
        storageMode = 'local';
        setLocalSubs(readLocalSubmissions(userId));
      } else {
        setSubmitError(t(res.messageKey));
        toast.error(t('toast.submitFailed'));
        return;
      }
    }

    draftApi.reset();
    setResult({ values, id, submittedAt: new Date(), cvStatus, storageMode, dbMessageKey: res.success ? null : res.messageKey });
    if (storageMode === 'firestore') toast.success(t('toast.submitted'));
    else toast.info(t('toast.savedLocally'), 6000);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadSubmissions();

    if (emailCopy && values.email) {
      setTimeout(() => {
        try {
          window.location.assign(buildMailto(values.email, values, { id, submittedAt: new Date() }, t, locale));
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
    toast.info(t('toast.draftCleared'));
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
          dbMessageKey={result.dbMessageKey}
          onStartAnother={startAnother}
        />
        <SubmissionsList submissions={[...localSubs, ...submissions]} loading={subsLoading} errorKey={subsErrorKey} onRefresh={loadSubmissions} />
      </div>
    );
  }

  const StepComponent = STEPS[step].component;
  const isLast = step === STEPS.length - 1;
  const latest = submissions[0];
  const [tip2A, tip2B] = t('form.tip2', { optional: '%%OPT%%' }).split('%%OPT%%');
  const [helpA, helpB, helpC] = t('form.helpBody', { a: '%%A%%', b: '%%B%%' }).split(/%%A%%|%%B%%/);

  return (
    <div className="container">
      <span className="sr-only" role="status" aria-live="polite">{announce}</span>

      {!online && (
        <Alert type="warning">
          <FiWifiOff size={16} aria-hidden="true" style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
          {t('form.offline')}
        </Alert>
      )}

      {showRestored && (
        <div className="alert alert--info no-print" role="status">
          <FiRotateCcw size={18} aria-hidden="true" />
          <div style={{ flex: 1 }}>
            <strong>{t('form.restoredTitle')}</strong> {t('form.restoredBody', { when: draft?.savedAt ? ` (${timeAgo(draft.savedAt, t)})` : '' })}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn--ghost btn--sm" style={{ width: 'auto' }} onClick={() => setShowRestored(false)}>{t('form.keepGoing')}</button>
            <button type="button" className="btn btn--danger-ghost btn--sm" style={{ width: 'auto' }} onClick={clearDraftAndReset}>{t('form.startOver')}</button>
          </div>
        </div>
      )}

      {latest && !subsLoading && (
        <div className="alert alert--info no-print" role="note">
          <FiInfo size={18} aria-hidden="true" />
          <div>{t('form.alreadySubmitted', { date: formatDate(latest.submittedAt, locale) })}</div>
        </div>
      )}

      <Formik
        key={lang}
        innerRef={formikRef}
        initialValues={liveValues || initialValues}
        validationSchema={STEP_SCHEMAS[step]}
        validateOnChange
        validateOnBlur
        validateOnMount
        onSubmit={handleSubmit}
      >
        {(formik) => {
          const errorCounts = countErrors(STEP_SCHEMAS, formik.values);
          const stepErrors = errorCounts.map((n) => n > 0);
          const allValid = !stepErrors.some(Boolean) && formik.isValid;
          const remaining = errorCounts.reduce((a, b) => a + b, 0);
          const denominator = Math.max(baseRequired, remaining, 1);
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
                      <strong>{t('form.submitFailed')}</strong> {submitError}
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
                          {t('common.back')}
                        </Button>
                      )}
                    </div>
                    <div className="form-actions__right">
                      <span className="autosave" aria-live="polite">
                        {draftApi.savedAt ? (
                          <>
                            <FiCheckCircle size={14} aria-hidden="true" /> {t('form.draftSaved', { when: timeAgo(draftApi.savedAt, t) })}
                          </>
                        ) : (
                          <>
                            <FiSave size={14} aria-hidden="true" style={{ color: 'inherit' }} /> {t('form.autosaveOn')}
                          </>
                        )}
                      </span>
                      {isLast ? (
                        <Button type="submit" loading={formik.isSubmitting} disabled={!allValid || !online} icon={FiSend}>
                          {t('form.submit')}
                        </Button>
                      ) : (
                        <Button type="button" onClick={() => handleNext(formik)} iconRight={FiArrowRight} disabled={formik.isSubmitting}>
                          {t('common.continue')}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Form>

              <aside className="side-rail" aria-label={t('form.helpAria')}>
                <div className="card side-rail__block">
                  <div className="completion">
                    <div className="completion__head">
                      <h3>{t('form.completion')}</h3>
                      <strong>{percent}%</strong>
                    </div>
                    <div className="progress progress--thick" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={t('form.completionLabel')}>
                      <span style={{ width: `${percent}%` }} />
                    </div>
                    <p className="completion__hint">
                      {remaining === 0 ? t('form.allDone') : t('form.remaining', { count: remaining })}
                    </p>
                  </div>
                  <ul>
                    {STEPS.slice(0, 3).map((s, i) => {
                      const done = !stepErrors[i];
                      return (
                        <li key={s.key}>
                          {done ? <FiCheckCircle size={16} aria-hidden="true" /> : <FiClock size={16} aria-hidden="true" style={{ color: 'var(--hp-ink-muted)' }} />}
                          <span>
                            {t(s.key)}{' '}
                            {done ? '' : <span style={{ color: 'var(--hp-ink-muted)' }}>· {t('form.toGo', { count: errorCounts[i] })}</span>}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className="card side-rail__block">
                  <h3>{t('form.beforeTitle')}</h3>
                  <ul>
                    <li><FiFileText size={16} aria-hidden="true" /> <span>{t('form.tip1')}</span></li>
                    <li><FiHelpCircle size={16} aria-hidden="true" /> <span>{tip2A}<em>{t('common.optional')}</em>{tip2B}</span></li>
                    <li><FiSave size={16} aria-hidden="true" /> <span>{t('form.tip3')}</span></li>
                  </ul>
                </div>
                <div className="card card--dark side-rail__block">
                  <h3>{t('form.helpTitle')}</h3>
                  <p style={{ color: 'rgba(252,252,252,.75)' }}>
                    {helpA}<a href="mailto:cqiu@college.harvard.edu" style={{ color: '#fff' }}>cqiu@college.harvard.edu</a>{helpB}
                    <a href="mailto:ashleyzheng@college.harvard.edu" style={{ color: '#fff' }}>ashleyzheng@college.harvard.edu</a>{helpC}
                  </p>
                </div>
                {hasDraft && (
                  <button type="button" className="btn btn--danger-ghost btn--sm" onClick={clearDraftAndReset}>
                    <FiTrash2 size={14} aria-hidden="true" /> <span>{t('form.clearDraft')}</span>
                  </button>
                )}
              </aside>
            </div>
          );
        }}
      </Formik>

      <SubmissionsList submissions={[...localSubs, ...submissions]} loading={subsLoading} errorKey={subsErrorKey} onRefresh={loadSubmissions} />
    </div>
  );
};

export default MultiStepForm;
