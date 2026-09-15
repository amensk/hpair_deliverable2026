import React, { useMemo } from 'react';
import { useFormikContext } from 'formik';
import { TextField, SelectField } from '../ui/Field';
import ComboField from '../ui/ComboField';
import { countryOptions } from '../../data/countries';
import { languageOptions, GENDERS } from '../../data/languages';
import { useI18n } from '../../i18n';

const PersonalInfoStep = () => {
  const { values } = useFormikContext();
  const { t, locale } = useI18n();
  const countries = useMemo(() => countryOptions(locale), [locale]);
  const languages = useMemo(() => languageOptions(locale), [locale]);
  const otherLanguageOptions = useMemo(() => languages.filter((l) => l.value !== values.preferredLanguage), [languages, values.preferredLanguage]);

  return (
    <div className="step">
      <div className="step__header">
        <h2>{t('personal.title')}</h2>
        <p>{t('personal.sub')}</p>
      </div>

      <fieldset className="fieldset">
        <legend>{t('personal.legendName')}</legend>
        <div className="grid">
          <TextField name="firstName" label={t('personal.firstName')} autoComplete="given-name" placeholder={t('personal.firstNamePh')} autoFocus />
          <TextField name="lastName" label={t('personal.lastName')} autoComplete="family-name" placeholder={t('personal.lastNamePh')} />
          <TextField name="preferredName" label={t('personal.preferredName')} optional hint={t('personal.preferredNameHint')} autoComplete="nickname" />
          <TextField name="email" label={t('personal.email')} type="email" autoComplete="email" hint={t('personal.emailHint')} />
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>{t('personal.legendAbout')}</legend>
        <div className="grid">
          <TextField name="dateOfBirth" label={t('personal.dob')} type="date" autoComplete="bday" max={new Date().toISOString().slice(0, 10)} />
          <SelectField name="gender" label={t('personal.gender')}>
            {GENDERS.map((g) => (
              <option key={g.value} value={g.value}>{t(g.key)}</option>
            ))}
          </SelectField>
          {values.gender === 'self-describe' && (
            <div className="span-2">
              <TextField name="genderSelfDescribe" label={t('personal.genderSelfDescribe')} />
            </div>
          )}
          <ComboField name="nationality" label={t('personal.nationality')} options={countries} placeholder={t('personal.nationalityPh')} />
          <ComboField name="secondNationality" label={t('personal.secondNationality')} options={countries} optional placeholder={t('common.none')} />
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>{t('personal.legendLanguages')}</legend>
        <div className="grid">
          <ComboField name="preferredLanguage" label={t('personal.preferredLanguage')} options={languages} placeholder={t('personal.languagePh')} hint={t('personal.preferredLanguageHint')} />
        </div>
        <ComboField
          name="otherLanguages"
          label={t('personal.otherLanguages')}
          options={otherLanguageOptions}
          optional
          multi
          max={6}
          placeholder={t('personal.languagePh')}
          hint={t('personal.otherLanguagesHint')}
        />
      </fieldset>
    </div>
  );
};

export default PersonalInfoStep;
