import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useField } from 'formik';
import { FiAlertCircle, FiCheck, FiChevronDown, FiX } from 'react-icons/fi';
import { useI18n } from '../../i18n';

/**
 * Accessible searchable select (WAI-ARIA combobox pattern) bound to Formik.
 * - Single: stores option.value. Multi: stores an array of values, shown as chips.
 * - Diacritic- and case-insensitive matching on label, description and keywords.
 * - Keyboard: ↑/↓ move, Enter selects, Esc closes, Backspace (multi, empty input) removes last.
 */
const MAX_VISIBLE = 60;

export const normalize = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

export const filterOptions = (options, query, limit = MAX_VISIBLE) => {
  const q = normalize(query);
  if (!q) return { items: options.slice(0, limit), total: options.length };
  const starts = [];
  const contains = [];
  for (const o of options) {
    const hay = [o.label, o.description, ...(o.keywords || [])].map(normalize);
    if (hay.some((h) => h.startsWith(q))) starts.push(o);
    else if (hay.some((h) => h.includes(q))) contains.push(o);
  }
  const all = [...starts, ...contains];
  return { items: all.slice(0, limit), total: all.length };
};

const ComboField = ({ name, label, options, optional, hint, placeholder, multi = false, max = Infinity, disabled, ariaLabel }) => {
  const { t } = useI18n();
  const id = useId();
  const listId = `${id}-list`;
  const [field, meta, helpers] = useField(name);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const rootRef = useRef(null);

  const byValue = useMemo(() => new Map(options.map((o) => [o.value, o])), [options]);
  const fieldValue = field.value;
  const selectedValues = useMemo(
    () => (multi ? (Array.isArray(fieldValue) ? fieldValue : []) : fieldValue ? [fieldValue] : []),
    [multi, fieldValue]
  );
  const selectedSingle = !multi && field.value ? byValue.get(field.value) : null;

  const available = useMemo(() => (multi ? options.filter((o) => !selectedValues.includes(o.value)) : options), [options, multi, selectedValues]);
  const { items, total } = useMemo(() => filterOptions(available, query), [available, query]);

  const showError = Boolean(meta.touched && meta.error);
  const isValid = Boolean(meta.touched && !meta.error && selectedValues.length > 0);
  const atMax = multi && selectedValues.length >= max;

  useEffect(() => {
    setActive(0);
  }, [query, open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${active}"]`);
    el?.scrollIntoView?.({ block: 'nearest' });
  }, [active, open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) close();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const commit = (opt) => {
    if (!opt) return;
    if (multi) {
      if (atMax) return;
      helpers.setValue([...selectedValues, opt.value], true);
      setQuery('');
      inputRef.current?.focus();
    } else {
      helpers.setValue(opt.value, true);
      close();
    }
    helpers.setTouched(true, false);
  };

  const remove = (value) => {
    if (multi) helpers.setValue(selectedValues.filter((v) => v !== value), true);
    else helpers.setValue('', true);
    helpers.setTouched(true, false);
    inputRef.current?.focus();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      else setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && items[active]) {
        e.preventDefault();
        e.stopPropagation();
        commit(items[active]);
      } else if (open) {
        e.preventDefault();
        e.stopPropagation();
      }
    } else if (e.key === 'Escape') {
      if (open) {
        e.preventDefault();
        e.stopPropagation();
        close();
      }
    } else if (e.key === 'Backspace' && multi && !query && selectedValues.length) {
      remove(selectedValues[selectedValues.length - 1]);
    } else if (e.key === 'Tab') {
      close();
    }
  };

  const onBlur = () => {
    // Only mark touched when there is something to validate against.
    if (selectedValues.length) helpers.setTouched(true);
  };

  const inputValue = open || multi ? query : selectedSingle ? selectedSingle.label : query;
  const effectivePlaceholder = multi && selectedValues.length ? '' : placeholder || t('common.search');

  return (
    <div className="field" ref={rootRef}>
      {label && (
        <label className="field__label" htmlFor={id}>
          <span>{label}</span>
          {optional && <span className="field__optional">{t('common.optional')}</span>}
        </label>
      )}
      <div
        className={`combo ${multi ? 'combo--multi' : ''}`}
        data-open={open}
        data-invalid={showError || undefined}
        data-valid={isValid || undefined}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        {multi &&
          selectedValues.map((v) => {
            const o = byValue.get(v);
            const text = o ? o.label : v;
            return (
              <span key={v} className="combo__chip">
                {o?.prefix && <span aria-hidden="true">{o.prefix}</span>}
                <span>{text}</span>
                <button type="button" className="combo__chip-remove" onClick={() => remove(v)} aria-label={t('common.remove', { item: text })}>
                  <FiX size={12} aria-hidden="true" />
                </button>
              </span>
            );
          })}
        {!multi && selectedSingle?.prefix && !open && (
          <span className="combo__prefix" aria-hidden="true">
            {selectedSingle.prefix}
          </span>
        )}
        <input
          id={id}
          ref={inputRef}
          className="combo__input"
          type="text"
          role="combobox"
          autoComplete="off"
          spellCheck={false}
          value={inputValue}
          placeholder={effectivePlaceholder}
          disabled={disabled || atMax}
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-invalid={showError || undefined}
          aria-required={!optional || undefined}
          aria-describedby={showError ? `${id}-error` : hint ? `${id}-hint` : undefined}
          aria-activedescendant={open && items[active] ? `${id}-opt-${active}` : undefined}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => !disabled && setOpen(true)}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
        />
        <span className="combo__icons">
          {showError ? (
            <span className="field__status field__status--invalid"><FiAlertCircle size={16} aria-hidden="true" /></span>
          ) : isValid ? (
            <span className="field__status field__status--valid"><FiCheck size={16} aria-hidden="true" /></span>
          ) : null}
          {!multi && selectedSingle && !disabled ? (
            <button type="button" className="combo__clear" onClick={(e) => { e.stopPropagation(); remove(field.value); }} aria-label={t('common.clear')}>
              <FiX size={14} aria-hidden="true" />
            </button>
          ) : (
            <FiChevronDown size={16} aria-hidden="true" className="combo__chevron" />
          )}
        </span>
        {open && (
          <ul id={listId} ref={listRef} className="combo__list" role="listbox" aria-multiselectable={multi || undefined}>
            {items.length === 0 && <li className="combo__empty">{t('common.noMatches')}</li>}
            {items.map((o, i) => (
              <li
                key={o.value}
                id={`${id}-opt-${i}`}
                data-index={i}
                role="option"
                aria-selected={i === active}
                className={`combo__option ${i === active ? 'is-active' : ''}`}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => commit(o)}
              >
                {o.prefix && <span className="combo__opt-prefix" aria-hidden="true">{o.prefix}</span>}
                <span className="combo__opt-label">{o.label}</span>
                {o.description && <span className="combo__opt-desc">{o.description}</span>}
              </li>
            ))}
            {total > items.length && <li className="combo__more">{t('common.moreResults', { count: total - items.length })}</li>}
          </ul>
        )}
      </div>
      {showError ? (
        <div className="field__error" id={`${id}-error`} role="alert">
          <FiAlertCircle size={14} aria-hidden="true" />
          <span>{meta.error}</span>
        </div>
      ) : hint ? (
        <div className="field__hint" id={`${id}-hint`}>{hint}</div>
      ) : null}
    </div>
  );
};

export default ComboField;
