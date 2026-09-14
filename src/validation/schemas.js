import * as Yup from 'yup';

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

const requiredText = (label, max = 80) =>
  Yup.string()
    .trim()
    .required(`${label} is required`)
    .max(max, `${label} must be ${max} characters or fewer`);

export const personalSchema = Yup.object({
  firstName: requiredText('First name').matches(NAME_RE, 'Use letters, spaces, apostrophes or hyphens only'),
  lastName: requiredText('Last name').matches(NAME_RE, 'Use letters, spaces, apostrophes or hyphens only'),
  preferredName: Yup.string().trim().max(60, 'Keep it under 60 characters'),
  email: Yup.string().trim().email('Enter a valid email address').required('Email is required'),
  dateOfBirth: Yup.date()
    .typeError('Enter a valid date')
    .required('Date of birth is required')
    .max(minAgeDate(16), 'Delegates must be at least 16 years old')
    .min(new Date('1920-01-01'), 'Enter a valid date of birth'),
  gender: Yup.string().required('Please select an option'),
  genderSelfDescribe: Yup.string().when('gender', {
    is: 'self-describe',
    then: (s) => s.trim().required('Please describe your gender').max(60),
    otherwise: (s) => s.strip(),
  }),
  nationality: Yup.string().required('Nationality is required'),
  secondNationality: Yup.string().test(
    'differs',
    'Second nationality must differ from the first',
    (v, ctx) => !v || v !== ctx.parent.nationality
  ),
  preferredLanguage: Yup.string().required('Preferred language is required'),
  otherLanguages: Yup.array().of(Yup.string()).max(6, 'Select up to six languages'),
});

export const contactSchema = Yup.object({
  phoneDial: Yup.string().required('Select a country code'),
  phoneNumber: Yup.string()
    .trim()
    .required('Phone number is required')
    .matches(PHONE_DIGITS_RE, 'Enter 5-15 digits (spaces, dashes and brackets are fine)')
    .test('digits', 'Enter between 5 and 15 digits', (v) => {
      const digits = (v || '').replace(/\D/g, '');
      return digits.length >= 5 && digits.length <= 15;
    }),
  whatsappSame: Yup.boolean(),
  addressLine1: requiredText('Street address', 120),
  addressLine2: Yup.string().trim().max(120, 'Keep it under 120 characters'),
  city: requiredText('City', 80),
  region: Yup.string().trim().max(80, 'Keep it under 80 characters'),
  postalCode: Yup.string()
    .trim()
    .required('Postal code is required')
    .matches(POSTAL_RE, 'Enter a valid postal / ZIP code'),
  country: Yup.string().required('Country is required'),
  emergencyName: requiredText('Emergency contact name'),
  emergencyPhone: Yup.string()
    .trim()
    .required('Emergency contact phone is required')
    .test('digits', 'Enter a valid phone number with country code', (v) => {
      const digits = (v || '').replace(/\D/g, '');
      return digits.length >= 7 && digits.length <= 16;
    }),
});

export const professionalSchema = Yup.object({
  occupation: Yup.string().required('Select the option that best describes you'),
  institution: requiredText('Institution or employer', 120),
  fieldOfStudy: Yup.string().trim().max(120, 'Keep it under 120 characters'),
  track: Yup.string().required('Select the programme you are applying to'),
  hasLinkedIn: Yup.string().oneOf(['yes', 'no']).required('Let us know if you have a LinkedIn profile'),
  linkedinUrl: Yup.string().when('hasLinkedIn', {
    is: 'yes',
    then: (s) =>
      s.trim().required('Enter your LinkedIn profile URL').matches(LINKEDIN_RE, 'Enter a URL like linkedin.com/in/your-name'),
    otherwise: (s) => s.strip(),
  }),
  website: Yup.string()
    .trim()
    .transform((v) => (v && !/^https?:\/\//i.test(v) ? `https://${v}` : v))
    .url('Enter a valid URL'),
  cv: Yup.mixed()
    .required('Please upload your CV')
    .test('size', 'File must be 5 MB or smaller', (f) => !f || f.size <= CV_MAX_BYTES)
    .test('type', 'Upload a PDF, DOC or DOCX file', (f) => !f || Object.keys(CV_ACCEPT).includes(f.type) || /\.(pdf|docx?)$/i.test(f.name || '')),
  statement: Yup.string()
    .trim()
    .required('Tell us briefly why you want to join')
    .min(40, 'A little more detail, please (at least 40 characters)')
    .max(600, 'Keep it under 600 characters'),
  dietary: Yup.string().required('Select an option'),
  dietaryOther: Yup.string().when('dietary', {
    is: 'other',
    then: (s) => s.trim().required('Please specify your dietary requirement').max(120),
    otherwise: (s) => s.strip(),
  }),
  accessibility: Yup.string().trim().max(300, 'Keep it under 300 characters'),
  heardFrom: Yup.string(),
});

export const reviewSchema = Yup.object({
  consent: Yup.boolean().oneOf([true], 'You must confirm the information is accurate'),
  privacy: Yup.boolean().oneOf([true], 'You must accept the privacy notice'),
  emailCopy: Yup.boolean(),
});

export const STEP_SCHEMAS = [personalSchema, contactSchema, professionalSchema, reviewSchema];

export const fullSchema = personalSchema.concat(contactSchema).concat(professionalSchema).concat(reviewSchema);

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

// Field names per step, used to focus the first invalid field and to scope
// "touched" marking when the user presses Next.
export const STEP_FIELDS = STEP_SCHEMAS.map((s) => Object.keys(s.fields));
