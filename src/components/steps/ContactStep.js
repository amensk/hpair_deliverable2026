import React, { useMemo } from 'react';
import { useFormikContext } from 'formik';
import { TextField, CheckboxField } from '../ui/Field';
import ComboField from '../ui/ComboField';
import { countryOptions, dialOptions } from '../../data/countries';
import { useI18n } from '../../i18n';

const ContactStep = () => {
  const { values } = useFormikContext();
  const { t, locale } = useI18n();
  const countries = useMemo(() => countryOptions(locale), [locale]);
  const dials = useMemo(() => dialOptions(locale), [locale]);
  const dial = (values.phoneDial || '').split(':')[1] || '';

  return (
    <div className="step">
      <div className="step__header">
        <h2>{t('contact.title')}</h2>
        <p>{t('contact.sub')}</p>
      </div>

      <fieldset className="fieldset">
        <legend>{t('contact.legendPhone')}</legend>
        <div className="field">
          <div className="field__label"><span>{t('contact.mobile')}</span></div>
          <div className="phone-group phone-group--combo">
            <ComboField name="phoneDial" options={dials} placeholder="+65" ariaLabel={t('contact.dialCode')} />
            <TextField name="phoneNumber" type="tel" inputMode="tel" autoComplete="tel-national" placeholder={t('contact.phonePh')} aria-label={t('contact.mobile')} />
          </div>
          {dial && values.phoneNumber && (
            <div className="field__hint" style={{ marginTop: -10 }}>{t('contact.phoneSaveAs', { phone: `${dial} ${values.phoneNumber}` })}</div>
          )}
        </div>
        <CheckboxField name="whatsappSame" label={t('contact.whatsapp')} description={t('contact.whatsappDesc')} />
      </fieldset>

      <fieldset className="fieldset">
        <legend>{t('contact.legendAddress')}</legend>
        <div className="grid">
          <div className="span-2">
            <TextField name="addressLine1" label={t('contact.address1')} autoComplete="address-line1" placeholder={t('contact.address1Ph')} />
          </div>
          <div className="span-2">
            <TextField name="addressLine2" label={t('contact.address2')} optional autoComplete="address-line2" />
          </div>
          <TextField name="city" label={t('contact.city')} autoComplete="address-level2" />
          <TextField name="region" label={t('contact.region')} optional autoComplete="address-level1" />
          <TextField name="postalCode" label={t('contact.postal')} autoComplete="postal-code" />
          <ComboField name="country" label={t('contact.country')} options={countries} placeholder={t('personal.nationalityPh')} />
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>{t('contact.legendEmergency')}</legend>
        <div className="grid">
          <TextField name="emergencyName" label={t('contact.emergencyName')} placeholder={t('contact.emergencyNamePh')} />
          <TextField name="emergencyPhone" label={t('contact.emergencyPhone')} type="tel" inputMode="tel" placeholder="+91 98765 43210" hint={t('contact.emergencyPhoneHint')} />
        </div>
      </fieldset>
    </div>
  );
};

export default ContactStep;
