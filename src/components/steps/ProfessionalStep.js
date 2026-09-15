import React, { useCallback, useState } from 'react';
import { useFormikContext } from 'formik';
import { useDropzone } from 'react-dropzone';
import { FiUploadCloud, FiFileText, FiTrash2, FiLinkedin, FiAlertCircle, FiEye } from 'react-icons/fi';
import { TextField, SelectField, RadioGroup, TextArea } from '../ui/Field';
import { OCCUPATIONS, TRACKS, DIETARY, HEARD_FROM } from '../../data/languages';
import { CV_ACCEPT, CV_MAX_BYTES } from '../../validation/schemas';
import { formatBytes } from '../../utils/format';
import { useI18n } from '../../i18n';

const MARK = '%%BROWSE%%';

const CVUpload = ({ restoredMeta }) => {
  const { values, errors, touched, setFieldValue, setFieldTouched } = useFormikContext();
  const { t } = useI18n();
  const [rejectKey, setRejectKey] = useState('');
  const file = values.cv;
  const showError = touched.cv && errors.cv;

  const onDrop = useCallback(
    (accepted, rejected) => {
      setRejectKey('');
      if (rejected.length) {
        const code = rejected[0].errors?.[0]?.code;
        setRejectKey(code === 'file-too-large' ? 'prof.rejectTooLarge' : code === 'too-many-files' ? 'prof.rejectMany' : 'prof.rejectType');
      }
      if (accepted[0]) setFieldValue('cv', accepted[0], true);
      setFieldTouched('cv', true, false);
    },
    [setFieldValue, setFieldTouched]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({ onDrop, accept: CV_ACCEPT, maxSize: CV_MAX_BYTES, multiple: false, noKeyboard: false });
  const [dropA, dropB] = t('prof.dropText', { browse: MARK }).split(MARK);

  return (
    <div className="field">
      <div className="field__label"><span>{t('prof.cv')}</span></div>
      {file ? (
        <div className="file-chip">
          <span className="file-chip__icon"><FiFileText size={20} aria-hidden="true" /></span>
          <div className="file-chip__meta">
            <div className="file-chip__name">{file.name}</div>
            <div className="file-chip__size">{formatBytes(file.size)} · {file.type?.includes('pdf') ? t('prof.pdf') : t('prof.word')}</div>
          </div>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            style={{ width: 'auto' }}
            onClick={() => {
              const url = URL.createObjectURL(file);
              window.open(url, '_blank', 'noopener');
              setTimeout(() => URL.revokeObjectURL(url), 60000);
            }}
            aria-label={t('prof.previewAria')}
          >
            <FiEye size={16} aria-hidden="true" /> <span>{t('prof.preview')}</span>
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={open} style={{ width: 'auto' }}>{t('prof.replace')}</button>
          <button
            type="button"
            className="btn btn--danger-ghost btn--sm"
            style={{ width: 'auto' }}
            onClick={() => {
              setFieldValue('cv', null, true);
              setFieldTouched('cv', true, false);
            }}
            aria-label={t('prof.removeCv')}
          >
            <FiTrash2 size={16} aria-hidden="true" />
          </button>
          <input {...getInputProps()} />
        </div>
      ) : (
        <div {...getRootProps({ className: 'dropzone', 'data-active': isDragActive, 'data-invalid': Boolean(showError || rejectKey), role: 'button', 'aria-label': t('prof.dropAria') })}>
          <input {...getInputProps()} aria-describedby="cv-hint" />
          <span className="dropzone__icon"><FiUploadCloud size={22} aria-hidden="true" /></span>
          <p>
            {isDragActive ? <strong>{t('prof.dropActive')}</strong> : <>{dropA}<strong>{t('prof.browse')}</strong>{dropB}</>}
          </p>
          <small id="cv-hint">{t('prof.dropHint')}</small>
        </div>
      )}
      {restoredMeta && !file && (
        <div className="field__hint" style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--hp-warning)' }}>
          <FiAlertCircle size={14} aria-hidden="true" /> {t('prof.restoredCv', { name: restoredMeta.name })}
        </div>
      )}
      {(showError || rejectKey) && (
        <div className="field__error" role="alert">
          <FiAlertCircle size={14} aria-hidden="true" />
          <span>{rejectKey ? t(rejectKey) : errors.cv}</span>
        </div>
      )}
    </div>
  );
};

const ensureHttps = (v) => {
  const s = (v || '').trim();
  if (!s) return s;
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
};

const ProfessionalStep = ({ restoredCvMeta }) => {
  const { values, setFieldValue } = useFormikContext();
  const { t } = useI18n();

  return (
    <div className="step">
      <div className="step__header">
        <h2>{t('prof.title')}</h2>
        <p>{t('prof.sub')}</p>
      </div>

      <fieldset className="fieldset">
        <legend>{t('prof.legendStatus')}</legend>
        <div className="grid">
          <SelectField name="occupation" label={t('prof.occupation')}>
            {OCCUPATIONS.map((o) => <option key={o.value} value={o.value}>{t(o.key)}</option>)}
          </SelectField>
          <TextField name="institution" label={t('prof.institution')} autoComplete="organization" placeholder={t('prof.institutionPh')} />
          <div className="span-2">
            <TextField name="fieldOfStudy" label={t('prof.fieldOfStudy')} optional placeholder={t('prof.fieldOfStudyPh')} />
          </div>
          <div className="span-2">
            <SelectField name="track" label={t('prof.track')}>
              {TRACKS.map((o) => <option key={o.value} value={o.value}>{t(o.key)}</option>)}
            </SelectField>
          </div>
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>{t('prof.legendOnline')}</legend>
        <RadioGroup
          name="hasLinkedIn"
          label={t('prof.hasLinkedIn')}
          row
          options={[
            { value: 'yes', label: t('common.yes'), description: t('prof.yesDesc') },
            { value: 'no', label: t('common.no'), description: t('prof.noDesc') },
          ]}
        />
        {values.hasLinkedIn === 'yes' && (
          <div className="step">
            <TextField
              name="linkedinUrl"
              label={t('prof.linkedinUrl')}
              type="url"
              inputMode="url"
              placeholder="https://www.linkedin.com/in/your-name"
              autoComplete="url"
              hint={t('prof.linkedinHint')}
              onValueBlur={(v) => setFieldValue('linkedinUrl', ensureHttps(v))}
            />
            <div className="field__hint" style={{ marginTop: -14, marginBottom: 20, display: 'flex', gap: 6, alignItems: 'center' }}>
              <FiLinkedin size={14} aria-hidden="true" /> {t('prof.linkedinTip')}
            </div>
          </div>
        )}
        <TextField name="website" label={t('prof.website')} optional type="text" inputMode="url" placeholder="yourname.com" onValueBlur={(v) => setFieldValue('website', ensureHttps(v))} />
      </fieldset>

      <fieldset className="fieldset">
        <legend>{t('prof.legendDocs')}</legend>
        <CVUpload restoredMeta={restoredCvMeta} />
      </fieldset>

      <fieldset className="fieldset">
        <legend>{t('prof.legendMotivation')}</legend>
        <TextArea name="statement" label={t('prof.statement')} maxLength={600} hint={t('prof.statementHint')} placeholder={t('prof.statementPh')} />
      </fieldset>

      <fieldset className="fieldset">
        <legend>{t('prof.legendLogistics')}</legend>
        <div className="grid">
          <SelectField name="dietary" label={t('prof.dietary')}>
            {DIETARY.map((o) => <option key={o.value} value={o.value}>{t(o.key)}</option>)}
          </SelectField>
          {values.dietary === 'other' && <TextField name="dietaryOther" label={t('prof.dietaryOther')} />}
          <div className="span-2">
            <TextArea name="accessibility" label={t('prof.accessibility')} optional maxLength={300} placeholder={t('prof.accessibilityPh')} rows={3} />
          </div>
          <SelectField name="heardFrom" label={t('prof.heardFrom')} optional>
            {HEARD_FROM.map((o) => <option key={o.value} value={o.value}>{t(o.key)}</option>)}
          </SelectField>
        </div>
      </fieldset>
    </div>
  );
};

export default ProfessionalStep;
