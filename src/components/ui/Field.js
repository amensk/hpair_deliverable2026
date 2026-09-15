import React, { useId } from 'react';
import { useField } from 'formik';
import { FiAlertCircle, FiCheck } from 'react-icons/fi';
import { useI18n } from '../../i18n';

/**
 * Formik-bound field primitives. Every control:
 *  - validates in real time (Formik validateOnChange/Blur)
 *  - shows an inline error once touched
 *  - exposes aria-invalid / aria-describedby for screen readers
 *  - shows a green check when a touched, non-empty value is valid
 */

const FieldShell = ({ id, label, optional, hint, error, showError, children }) => {
  const { t } = useI18n();
  return (
  <div className="field">
    {label && (
      <label className="field__label" htmlFor={id}>
        <span>{label}</span>
        {optional && <span className="field__optional">{t('common.optional')}</span>}
      </label>
    )}
    {children}
    {showError ? (
      <div className="field__error" id={`${id}-error`} role="alert">
        <FiAlertCircle size={14} aria-hidden="true" />
        <span>{error}</span>
      </div>
    ) : hint ? (
      <div className="field__hint" id={`${id}-hint`}>
        {hint}
      </div>
    ) : null}
  </div>
  );
};

const Status = ({ valid, invalid }) => {
  if (invalid) return <span className="field__status field__status--invalid"><FiAlertCircle size={16} aria-hidden="true" /></span>;
  if (valid) return <span className="field__status field__status--valid"><FiCheck size={16} aria-hidden="true" /></span>;
  return null;
};

const useFieldState = (name) => {
  const [rawField, meta] = useField(name);
  // Only mark a field touched on blur when the user actually entered something.
  // Blurring an empty required field (e.g. tabbing past it, or clicking a
  // button while it is autofocused) should not pop an error and shift layout.
  // Empty required fields are surfaced when the user presses Continue/Submit.
  const field = {
    ...rawField,
    onBlur: (e) => {
      const v = rawField.value;
      const hasValue = Array.isArray(v) ? v.length > 0 : v !== '' && v != null;
      if (hasValue) rawField.onBlur(e);
    },
  };
  const showError = Boolean(meta.touched && meta.error);
  const isValid = Boolean(meta.touched && !meta.error && field.value !== '' && field.value != null);
  return { field, meta, showError, isValid };
};

export const TextField = ({ name, label, optional, hint, type = 'text', className = '', onValueBlur, ...rest }) => {
  const id = useId();
  const { field, meta, showError, isValid } = useFieldState(name);
  const onBlur = (e) => {
    if (onValueBlur) onValueBlur(e.target.value, e);
    field.onBlur(e);
  };
  return (
    <FieldShell id={id} label={label} optional={optional} hint={hint} error={meta.error} showError={showError}>
      <div className="field__control">
        <input
          id={id}
          type={type}
          className={`input input--with-status ${className}`}
          aria-invalid={showError || undefined}
          data-valid={isValid || undefined}
          aria-describedby={showError ? `${id}-error` : hint ? `${id}-hint` : undefined}
          aria-required={!optional || undefined}
          {...field}
          onBlur={onBlur}
          value={field.value ?? ''}
          {...rest}
        />
        <Status valid={isValid} invalid={showError} />
      </div>
    </FieldShell>
  );
};

export const TextArea = ({ name, label, optional, hint, maxLength, ...rest }) => {
  const id = useId();
  const { field, meta, showError } = useFieldState(name);
  const len = (field.value || '').length;
  const counter = maxLength ? `${len} / ${maxLength}` : null;
  return (
    <FieldShell
      id={id}
      label={label}
      optional={optional}
      hint={counter ? `${hint ? `${hint} · ` : ''}${counter}` : hint}
      error={meta.error}
      showError={showError}
    >
      <textarea
        id={id}
        className="input"
        aria-invalid={showError || undefined}
        aria-describedby={showError ? `${id}-error` : `${id}-hint`}
        maxLength={maxLength ? maxLength + 50 : undefined}
        {...field}
        value={field.value ?? ''}
        {...rest}
      />
    </FieldShell>
  );
};

export const SelectField = ({ name, label, optional, hint, children, placeholder, ...rest }) => {
  const id = useId();
  const { t } = useI18n();
  const ph = placeholder ?? t('common.select');
  const { field, meta, showError, isValid } = useFieldState(name);
  return (
    <FieldShell id={id} label={label} optional={optional} hint={hint} error={meta.error} showError={showError}>
      <div className="field__control">
        <select
          id={id}
          className="input input--select input--with-status"
          aria-invalid={showError || undefined}
          data-valid={isValid || undefined}
          aria-describedby={showError ? `${id}-error` : hint ? `${id}-hint` : undefined}
          aria-required={!optional || undefined}
          {...field}
          value={field.value ?? ''}
          {...rest}
        >
          <option value="">{ph}</option>
          {children}
        </select>
        <Status valid={isValid} invalid={showError} />
      </div>
    </FieldShell>
  );
};

export const CheckboxField = ({ name, label, description, ...rest }) => {
  const id = useId();
  const [field, meta] = useField({ name, type: 'checkbox' });
  const showError = Boolean(meta.touched && meta.error);
  return (
    <div className="field">
      <label className="choice" htmlFor={id} data-checked={Boolean(field.checked)}>
        <input id={id} type="checkbox" aria-invalid={showError || undefined} aria-describedby={showError ? `${id}-error` : undefined} {...field} {...rest} />
        <span className="choice__text">
          <strong>{label}</strong>
          {description && <span>{description}</span>}
        </span>
      </label>
      {showError && (
        <div className="field__error" id={`${id}-error`} role="alert">
          <FiAlertCircle size={14} aria-hidden="true" />
          <span>{meta.error}</span>
        </div>
      )}
    </div>
  );
};

export const RadioGroup = ({ name, label, options, row = false, hint }) => {
  const groupId = useId();
  const [field, meta] = useField(name);
  const showError = Boolean(meta.touched && meta.error);
  return (
    <fieldset className="fieldset field" aria-describedby={showError ? `${groupId}-error` : hint ? `${groupId}-hint` : undefined}>
      <legend>{label}</legend>
      <div className={`choice-group ${row ? 'choice-group--row' : ''}`}>
        {options.map((opt) => {
          const id = `${groupId}-${opt.value}`;
          const checked = field.value === opt.value;
          return (
            <label key={opt.value} className="choice" htmlFor={id} data-checked={checked}>
              <input id={id} type="radio" {...field} value={opt.value} checked={checked} />
              <span className="choice__text">
                <strong>{opt.label}</strong>
                {opt.description && <span>{opt.description}</span>}
              </span>
            </label>
          );
        })}
      </div>
      {showError ? (
        <div className="field__error" id={`${groupId}-error`} role="alert">
          <FiAlertCircle size={14} aria-hidden="true" />
          <span>{meta.error}</span>
        </div>
      ) : hint ? (
        <div className="field__hint" id={`${groupId}-hint`}>{hint}</div>
      ) : null}
    </fieldset>
  );
};
