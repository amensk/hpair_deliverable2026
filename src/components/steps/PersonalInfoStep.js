import React from 'react';
import { useFormikContext } from 'formik';
import { TextField, SelectField } from '../ui/Field';
import { COUNTRIES } from '../../data/countries';
import { LANGUAGES, GENDERS } from '../../data/languages';

const PersonalInfoStep = () => {
  const { values, setFieldValue, setFieldTouched } = useFormikContext();

  const toggleLanguage = (lang) => {
    const set = new Set(values.otherLanguages || []);
    if (set.has(lang)) set.delete(lang);
    else set.add(lang);
    setFieldValue('otherLanguages', Array.from(set));
    setFieldTouched('otherLanguages', true, false);
  };

  const otherLangOptions = LANGUAGES.filter((l) => l !== values.preferredLanguage);

  return (
    <div className="step">
      <div className="step__header">
        <h2>Personal details</h2>
        <p>Use the name as it appears on your passport or government ID.</p>
      </div>

      <fieldset className="fieldset">
        <legend>Name</legend>
        <div className="grid">
          <TextField name="firstName" label="First name" autoComplete="given-name" placeholder="e.g. Priya" autoFocus />
          <TextField name="lastName" label="Last name" autoComplete="family-name" placeholder="e.g. Sharma" />
          <TextField name="preferredName" label="Preferred name" optional hint="What should we call you at the conference?" autoComplete="nickname" />
          <TextField name="email" label="Email address" type="email" autoComplete="email" hint="Pre-filled from your account. You can change it." />
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>About you</legend>
        <div className="grid">
          <TextField name="dateOfBirth" label="Date of birth" type="date" autoComplete="bday" max={new Date().toISOString().slice(0, 10)} />
          <SelectField name="gender" label="Gender">
            {GENDERS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </SelectField>
          {values.gender === 'self-describe' && (
            <div className="span-2">
              <TextField name="genderSelfDescribe" label="How do you describe your gender?" />
            </div>
          )}
          <SelectField name="nationality" label="Nationality" autoComplete="country-name">
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </SelectField>
          <SelectField name="secondNationality" label="Second nationality" optional placeholder="None">
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </SelectField>
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Languages</legend>
        <div className="grid">
          <SelectField name="preferredLanguage" label="Preferred language" hint="We will use this for conference materials where possible.">
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </SelectField>
        </div>
        <div className="field">
          <div className="field__label">
            <span>Other languages you speak</span>
            <span className="field__optional">Optional · up to 6</span>
          </div>
          <div className="choice-group" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))' }} role="group" aria-label="Other languages">
            {otherLangOptions.slice(0, 18).map((lang) => {
              const checked = (values.otherLanguages || []).includes(lang);
              return (
                <label key={lang} className="choice" data-checked={checked} style={{ padding: '10px 12px' }}>
                  <input type="checkbox" checked={checked} onChange={() => toggleLanguage(lang)} disabled={!checked && (values.otherLanguages || []).length >= 6} />
                  <span className="choice__text"><strong style={{ fontSize: '0.875rem' }}>{lang}</strong></span>
                </label>
              );
            })}
          </div>
        </div>
      </fieldset>
    </div>
  );
};

export default PersonalInfoStep;
