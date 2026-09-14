import React, { useCallback, useState } from 'react';
import { useFormikContext } from 'formik';
import { useDropzone } from 'react-dropzone';
import { FiUploadCloud, FiFileText, FiTrash2, FiLinkedin, FiAlertCircle } from 'react-icons/fi';
import { TextField, SelectField, RadioGroup, TextArea } from '../ui/Field';
import { OCCUPATIONS, TRACKS, DIETARY, HEARD_FROM } from '../../data/languages';
import { CV_ACCEPT, CV_MAX_BYTES } from '../../validation/schemas';
import { formatBytes } from '../../utils/format';

const CVUpload = ({ restoredMeta }) => {
  const { values, errors, touched, setFieldValue, setFieldTouched } = useFormikContext();
  const [rejectMsg, setRejectMsg] = useState('');
  const file = values.cv;
  const showError = touched.cv && errors.cv;

  const onDrop = useCallback(
    (accepted, rejected) => {
      setRejectMsg('');
      if (rejected.length) {
        const code = rejected[0].errors?.[0]?.code;
        setRejectMsg(
          code === 'file-too-large'
            ? 'That file is over 5 MB. Please compress it or export a smaller PDF.'
            : code === 'too-many-files'
            ? 'Please upload a single file.'
            : 'Only PDF, DOC or DOCX files are accepted.'
        );
      }
      if (accepted[0]) {
        setFieldValue('cv', accepted[0], true);
      }
      setFieldTouched('cv', true, false);
    },
    [setFieldValue, setFieldTouched]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: CV_ACCEPT,
    maxSize: CV_MAX_BYTES,
    multiple: false,
    noKeyboard: false,
  });

  return (
    <div className="field">
      <div className="field__label"><span>Curriculum vitae (CV)</span></div>
      {file ? (
        <div className="file-chip">
          <span className="file-chip__icon"><FiFileText size={20} aria-hidden="true" /></span>
          <div className="file-chip__meta">
            <div className="file-chip__name">{file.name}</div>
            <div className="file-chip__size">{formatBytes(file.size)} · {file.type?.includes('pdf') ? 'PDF' : 'Word document'}</div>
          </div>
          <button type="button" className="btn btn--ghost btn--sm" onClick={open} style={{ width: 'auto' }}>Replace</button>
          <button
            type="button"
            className="btn btn--danger-ghost btn--sm"
            style={{ width: 'auto' }}
            onClick={() => {
              setFieldValue('cv', null, true);
              setFieldTouched('cv', true, false);
            }}
            aria-label="Remove CV"
          >
            <FiTrash2 size={16} aria-hidden="true" />
          </button>
          <input {...getInputProps()} />
        </div>
      ) : (
        <div
          {...getRootProps({
            className: 'dropzone',
            'data-active': isDragActive,
            'data-invalid': Boolean(showError || rejectMsg),
            role: 'button',
            'aria-label': 'Upload your CV. Drag and drop or press Enter to browse.',
          })}
        >
          <input {...getInputProps()} aria-describedby="cv-hint" />
          <span className="dropzone__icon"><FiUploadCloud size={22} aria-hidden="true" /></span>
          <p>
            {isDragActive ? <strong>Drop it here</strong> : <>Drag &amp; drop your CV, or <strong>browse</strong></>}
          </p>
          <small id="cv-hint">PDF, DOC or DOCX · max 5 MB</small>
        </div>
      )}
      {restoredMeta && !file && (
        <div className="field__hint" style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--hp-warning)' }}>
          <FiAlertCircle size={14} aria-hidden="true" /> You previously attached <strong>&nbsp;{restoredMeta.name}&nbsp;</strong>. Files cannot be restored from a saved draft, so please attach it again.
        </div>
      )}
      {(showError || rejectMsg) && (
        <div className="field__error" role="alert">
          <FiAlertCircle size={14} aria-hidden="true" />
          <span>{rejectMsg || errors.cv}</span>
        </div>
      )}
    </div>
  );
};

const ProfessionalStep = ({ restoredCvMeta }) => {
  const { values } = useFormikContext();

  return (
    <div className="step">
      <div className="step__header">
        <h2>Background &amp; application</h2>
        <p>Tell us about your studies or work and which HPAIR programme you are interested in.</p>
      </div>

      <fieldset className="fieldset">
        <legend>Current status</legend>
        <div className="grid">
          <SelectField name="occupation" label="Which best describes you?">
            {OCCUPATIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </SelectField>
          <TextField name="institution" label="University or employer" autoComplete="organization" placeholder="e.g. National University of Singapore" />
          <div className="span-2">
            <TextField name="fieldOfStudy" label="Field of study or job title" optional placeholder="e.g. Economics, BA · Class of 2027" />
          </div>
          <div className="span-2">
            <SelectField name="track" label="Programme you are applying to">
              {TRACKS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </SelectField>
          </div>
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Online presence</legend>
        <RadioGroup
          name="hasLinkedIn"
          label="Do you have a LinkedIn profile?"
          row
          options={[
            { value: 'yes', label: 'Yes', description: 'We will ask for the link' },
            { value: 'no', label: 'No', description: "That's fine, skip it" },
          ]}
        />
        {values.hasLinkedIn === 'yes' && (
          <div className="step">
            <TextField
              name="linkedinUrl"
              label="LinkedIn profile URL"
              type="url"
              inputMode="url"
              placeholder="https://www.linkedin.com/in/your-name"
              autoComplete="url"
              hint="Copy it from your profile page."
            />
            <div className="field__hint" style={{ marginTop: -14, marginBottom: 20, display: 'flex', gap: 6, alignItems: 'center' }}>
              <FiLinkedin size={14} aria-hidden="true" /> Tip: linkedin.com/in/… is the personal profile format.
            </div>
          </div>
        )}
        <TextField name="website" label="Personal website or portfolio" optional type="text" inputMode="url" placeholder="yourname.com" />
      </fieldset>

      <fieldset className="fieldset">
        <legend>Documents</legend>
        <CVUpload restoredMeta={restoredCvMeta} />
      </fieldset>

      <fieldset className="fieldset">
        <legend>Motivation</legend>
        <TextArea
          name="statement"
          label="Why do you want to join HPAIR?"
          maxLength={600}
          hint="Two or three sentences is plenty."
          placeholder="What draws you to the conference, and what would you bring to the delegate community?"
        />
      </fieldset>

      <fieldset className="fieldset">
        <legend>Conference logistics</legend>
        <div className="grid">
          <SelectField name="dietary" label="Dietary requirements">
            {DIETARY.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </SelectField>
          {values.dietary === 'other' && <TextField name="dietaryOther" label="Please specify" />}
          <div className="span-2">
            <TextArea
              name="accessibility"
              label="Accessibility or accommodation needs"
              optional
              maxLength={300}
              placeholder="Anything we should arrange so you can participate fully."
              rows={3}
            />
          </div>
          <SelectField name="heardFrom" label="How did you hear about HPAIR?" optional>
            {HEARD_FROM.map((h) => (
              <option key={h.value} value={h.value}>{h.label}</option>
            ))}
          </SelectField>
        </div>
      </fieldset>
    </div>
  );
};

export default ProfessionalStep;
