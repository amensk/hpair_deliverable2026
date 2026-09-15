import * as Yup from 'yup';
import { useMemo } from 'react';
import { tEn, useI18n } from '../i18n';

// Shared regexes
const NAME_RE = /^[\p{L}\p{M}' .-]+$/u;
const PHONE_DIGITS_RE = /^[0-9 ()-]{5,20}$/;
const LINKEDIN_RE = /^(https?:\/\/)?([a-z]{2,3}\.)?linkedin\.com\/(in|pub)\/[A-Za-z0-9\-_%]+\/?(\?.*)?$/i;
const POSTAL_RE = /^[A-Za-z0-9][A-Za-z0-9 -]{2,11}$/;

export const CV_MAX_BYTES = 5 * 1024 * 1024;
export const CV_ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

const minAgeDate = (years) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d;
};

/** Build all step schemas with messages in the active UI language. */
export const buildSchemas = (t = tEn) => {
  const requiredText = (fieldKey, max = 80) =>
    Yup.string()
      .trim()
      .required(t('v.required', { field: t(fieldKey) }))
      .max(max, t('v.max', { field: t(fieldKey), max }));

  const personalSchema = Yup.object({
    firstName: requiredText('personal.firstName').matches(NAME_RE, t('v.nameChars')),
    lastName: requiredText('personal.lastName').matches(NAME_RE, t('v.nameChars')),
    preferredName: Yup.string().trim().max(60, t('v.keepUnder', { max: 60 })),
    email: Yup.string().trim().email(t('v.emailInvalid')).required(t('v.required', { field: t('personal.email') })),
    dateOfBirth: Yup.date()
      .typeError(t('v.dobInvalid'))
      .required(t('v.required', { field: t('personal.dob') }))
      .max(minAgeDate(16), t('v.dobMinAge'))
      .min(new Date('1920-01-01'), t('v.dobRange')),
    gender: Yup.string().required(t('v.selectOption')),
    genderSelfDescribe: Yup.string().when('gender', {
      is: 'self-describe',
      then: (s) => s.trim().required(t('v.describeGender')).max(60, t('v.keepUnder', { max: 60 })),
      otherwise: (s) => s.strip(),
    }),
    nationality: Yup.string().required(t('v.required', { field: t('personal.nationality') })),
    secondNationality: Yup.string().test('differs', t('v.secondNatDiffer'), (v, ctx) => !v || v !== ctx.parent.nationality),
    preferredLanguage: Yup.string().required(t('v.required', { field: t('personal.preferredLanguage') })),
    otherLanguages: Yup.array().of(Yup.string()).max(6, t('v.maxLanguages')),
  });

  const contactSchema = Yup.object({
    phoneDial: Yup.string().required(t('v.selectDialCode')),
    phoneNumber: Yup.string()
      .trim()
      .required(t('v.required', { field: t('contact.mobile') }))
      .matches(PHONE_DIGITS_RE, t('v.phoneFormat'))
      .test('digits', t('v.phoneDigits'), (v) => {
        const digits = (v || '').replace(/\D/g, '');
        return digits.length >= 5 && digits.length <= 15;
      }),
    whatsappSame: Yup.boolean(),
    addressLine1: requiredText('contact.address1', 120),
    addressLine2: Yup.string().trim().max(120, t('v.keepUnder', { max: 120 })),
    city: requiredText('contact.city', 80),
    region: Yup.string().trim().max(80, t('v.keepUnder', { max: 80 })),
    postalCode: Yup.string().trim().required(t('v.required', { field: t('contact.postal') })).matches(POSTAL_RE, t('v.postalInvalid')),
    country: Yup.string().required(t('v.required', { field: t('contact.country') })),
    emergencyName: requiredText('contact.emergencyName'),
    emergencyPhone: Yup.string()
      .trim()
      .required(t('v.required', { field: t('contact.emergencyPhone') }))
      .test('digits', t('v.emergencyPhone'), (v) => {
        const digits = (v || '').replace(/\D/g, '');
        return digits.length >= 7 && digits.length <= 16;
      }),
  });

  const professionalSchema = Yup.object({
    occupation: Yup.string().required(t('v.selectDescribe')),
    institution: requiredText('prof.institution', 120),
    fieldOfStudy: Yup.string().trim().max(120, t('v.keepUnder', { max: 120 })),
    track: Yup.string().required(t('v.selectProgramme')),
    hasLinkedIn: Yup.string().oneOf(['yes', 'no']).required(t('v.linkedinChoose')),
    linkedinUrl: Yup.string().when('hasLinkedIn', {
      is: 'yes',
      then: (s) => s.trim().required(t('v.linkedinRequired')).matches(LINKEDIN_RE, t('v.linkedinFormat')),
      otherwise: (s) => s.strip(),
    }),
    website: Yup.string()
      .trim()
      .transform((v) => (v && !/^https?:\/\//i.test(v) ? `https://${v}` : v))
      .url(t('v.urlInvalid')),
    cv: Yup.mixed()
      .required(t('v.cvRequired'))
      .test('size', t('v.cvSize'), (f) => !f || f.size <= CV_MAX_BYTES)
      .test('type', t('v.cvType'), (f) => !f || Object.keys(CV_ACCEPT).includes(f.type) || /\.(pdf|docx?)$/i.test(f.name || '')),
    statement: Yup.string().trim().required(t('v.statementRequired')).min(40, t('v.statementMin')).max(600, t('v.statementMax')),
    dietary: Yup.string().required(t('v.selectOption')),
    dietaryOther: Yup.string().when('dietary', {
      is: 'other',
      then: (s) => s.trim().required(t('v.dietarySpecify')).max(120, t('v.keepUnder', { max: 120 })),
      otherwise: (s) => s.strip(),
    }),
    accessibility: Yup.string().trim().max(300, t('v.keepUnder', { max: 300 })),
    heardFrom: Yup.string(),
  });

  const reviewSchema = Yup.object({
    consent: Yup.boolean().oneOf([true], t('v.consent')),
    privacy: Yup.boolean().oneOf([true], t('v.privacy')),
    emailCopy: Yup.boolean(),
  });

  const STEP_SCHEMAS = [personalSchema, contactSchema, professionalSchema, reviewSchema];
  return { personalSchema, contactSchema, professionalSchema, reviewSchema, STEP_SCHEMAS };
};

/** Schemas for the current UI language (memoised per language). */
export const useSchemas = () => {
  const { t, lang } = useI18n();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => buildSchemas(t), [lang]);
};

// English defaults, used by tests and as a fallback
const english = buildSchemas(tEn);
export const { personalSchema, contactSchema, professionalSchema, reviewSchema, STEP_SCHEMAS } = english;

export const INITIAL_VALUES = {
  firstName: '',
  lastName: '',
  preferredName: '',
  email: '',
  dateOfBirth: '',
  gender: '',
  genderSelfDescribe: '',
  nationality: '',
  secondNationality: '',
  preferredLanguage: '',
  otherLanguages: [],
  phoneDial: 'US:+1',
  phoneNumber: '',
  whatsappSame: true,
  addressLine1: '',
  addressLine2: '',
  city: '',
  region: '',
  postalCode: '',
  country: '',
  emergencyName: '',
  emergencyPhone: '',
  occupation: '',
  institution: '',
  fieldOfStudy: '',
  track: '',
  hasLinkedIn: '',
  linkedinUrl: '',
  website: '',
  cv: null,
  statement: '',
  dietary: '',
  dietaryOther: '',
  accessibility: '',
  heardFrom: '',
  consent: false,
  privacy: false,
  emailCopy: true,
};

// Field names per step (language-independent).
export const STEP_FIELDS = STEP_SCHEMAS.map((s) => Object.keys(s.fields));
