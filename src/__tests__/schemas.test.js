import { personalSchema, contactSchema, professionalSchema, reviewSchema, INITIAL_VALUES } from '../validation/schemas';

const validPersonal = {
  ...INITIAL_VALUES,
  firstName: 'Priya',
  lastName: 'Sharma',
  email: 'priya@example.edu',
  dateOfBirth: '2003-05-14',
  gender: 'female',
  nationality: 'IN',
  preferredLanguage: 'English',
};

describe('personalSchema', () => {
  it('accepts a complete, valid personal step', () => {
    expect(personalSchema.isValidSync(validPersonal)).toBe(true);
  });

  it('rejects delegates under 16', () => {
    const recent = new Date();
    recent.setFullYear(recent.getFullYear() - 15);
    expect(personalSchema.isValidSync({ ...validPersonal, dateOfBirth: recent.toISOString().slice(0, 10) })).toBe(false);
  });

  it('requires a description when gender is self-describe', () => {
    expect(personalSchema.isValidSync({ ...validPersonal, gender: 'self-describe' })).toBe(false);
    expect(personalSchema.isValidSync({ ...validPersonal, gender: 'self-describe', genderSelfDescribe: 'Agender' })).toBe(true);
  });

  it('allows an empty second nationality but not a duplicate', () => {
    expect(personalSchema.isValidSync({ ...validPersonal, secondNationality: '' })).toBe(true);
    expect(personalSchema.isValidSync({ ...validPersonal, secondNationality: 'IN' })).toBe(false);
    expect(personalSchema.isValidSync({ ...validPersonal, secondNationality: 'SG' })).toBe(true);
  });

  it('rejects names with digits', () => {
    expect(personalSchema.isValidSync({ ...validPersonal, firstName: 'Pr1ya' })).toBe(false);
  });
});

describe('contactSchema', () => {
  const valid = {
    ...INITIAL_VALUES,
    phoneDial: 'IN:+91',
    phoneNumber: '98765 43210',
    addressLine1: '12 Lodhi Road',
    city: 'New Delhi',
    postalCode: '110003',
    country: 'IN',
    emergencyName: 'Anil Sharma',
    emergencyPhone: '+91 98111 22333',
  };

  it('accepts a valid contact step', () => {
    expect(contactSchema.isValidSync(valid)).toBe(true);
  });

  it('rejects phone numbers with too few digits', () => {
    expect(contactSchema.isValidSync({ ...valid, phoneNumber: '123' })).toBe(false);
  });

  it('rejects malformed postal codes', () => {
    expect(contactSchema.isValidSync({ ...valid, postalCode: '!!' })).toBe(false);
  });
});

describe('professionalSchema', () => {
  const cv = { name: 'cv.pdf', size: 1024, type: 'application/pdf' };
  const valid = {
    ...INITIAL_VALUES,
    occupation: 'undergraduate',
    institution: 'NUS',
    track: 'vconf-2026',
    hasLinkedIn: 'no',
    cv,
    statement: 'I want to join HPAIR to meet peers across Asia working on climate policy and public speaking.',
    dietary: 'none',
  };

  it('accepts a valid background step without LinkedIn', () => {
    expect(professionalSchema.isValidSync(valid)).toBe(true);
  });

  it('requires a LinkedIn URL only when the delegate says they have one', () => {
    expect(professionalSchema.isValidSync({ ...valid, hasLinkedIn: 'yes' })).toBe(false);
    expect(professionalSchema.isValidSync({ ...valid, hasLinkedIn: 'yes', linkedinUrl: 'https://www.linkedin.com/in/priya-sharma' })).toBe(true);
    expect(professionalSchema.isValidSync({ ...valid, hasLinkedIn: 'yes', linkedinUrl: 'https://twitter.com/priya' })).toBe(false);
  });

  it('rejects oversized or wrong-type CVs', () => {
    expect(professionalSchema.isValidSync({ ...valid, cv: { ...cv, size: 6 * 1024 * 1024 } })).toBe(false);
    expect(professionalSchema.isValidSync({ ...valid, cv: { name: 'photo.png', size: 100, type: 'image/png' } })).toBe(false);
  });

  it('requires a minimum statement length', () => {
    expect(professionalSchema.isValidSync({ ...valid, statement: 'Too short.' })).toBe(false);
  });

  it('accepts a bare-domain website by normalising to https', () => {
    expect(professionalSchema.isValidSync({ ...valid, website: 'priya.dev' })).toBe(true);
  });
});

describe('reviewSchema', () => {
  it('blocks submission until both declarations are accepted', () => {
    expect(reviewSchema.isValidSync({ consent: true, privacy: false, emailCopy: true })).toBe(false);
    expect(reviewSchema.isValidSync({ consent: true, privacy: true, emailCopy: false })).toBe(true);
  });
});
