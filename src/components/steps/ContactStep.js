import React from 'react';
import { useFormikContext } from 'formik';
import { TextField, SelectField, CheckboxField } from '../ui/Field';
import { COUNTRIES, DIAL_CODES } from '../../data/countries';

const ContactStep = () => {
  const { values } = useFormikContext();
  const dial = (values.phoneDial || '').split(':')[1] || '';

  return (
    <div className="step">
      <div className="step__header">
        <h2>Contact &amp; address</h2>
        <p>We use this to reach you about your application and, if accepted, for visa and logistics support.</p>
      </div>

      <fieldset className="fieldset">
        <legend>Phone</legend>
        <div className="field">
          <div className="field__label"><span>Mobile number</span></div>
          <div className="phone-group">
            <SelectField name="phoneDial" placeholder="Code" aria-label="Country calling code">
              {DIAL_CODES.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </SelectField>
            <TextField name="phoneNumber" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="e.g. 617 555 0142" aria-label="Phone number" />
          </div>
          {dial && values.phoneNumber && (
            <div className="field__hint" style={{ marginTop: -10 }}>We will save this as {dial} {values.phoneNumber}</div>
          )}
        </div>
        <CheckboxField name="whatsappSame" label="This number is on WhatsApp" description="Most delegate coordination happens over WhatsApp groups." />
      </fieldset>

      <fieldset className="fieldset">
        <legend>Home address</legend>
        <div className="grid">
          <div className="span-2">
            <TextField name="addressLine1" label="Street address" autoComplete="address-line1" placeholder="House number and street" />
          </div>
          <div className="span-2">
            <TextField name="addressLine2" label="Apartment, suite, building" optional autoComplete="address-line2" />
          </div>
          <TextField name="city" label="City" autoComplete="address-level2" />
          <TextField name="region" label="State / province" optional autoComplete="address-level1" />
          <TextField name="postalCode" label="Postal / ZIP code" autoComplete="postal-code" />
          <SelectField name="country" label="Country of residence" autoComplete="country">
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </SelectField>
        </div>
      </fieldset>

      <fieldset className="fieldset">
        <legend>Emergency contact</legend>
        <div className="grid">
          <TextField name="emergencyName" label="Contact name" placeholder="Parent, guardian or partner" />
          <TextField name="emergencyPhone" label="Contact phone" type="tel" inputMode="tel" placeholder="+91 98765 43210" hint="Include the country code." />
        </div>
      </fieldset>
    </div>
  );
};

export default ContactStep;
