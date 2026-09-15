import { formatBytes, formatPhone, fullName, buildSummarySections } from '../utils/format';
import { summaryAsText, buildMailto } from '../utils/summary';

describe('format helpers', () => {
  it('formats byte sizes', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.00 MB');
  });

  it('joins dial code and number', () => {
    expect(formatPhone('SG:+65', '8123 4567')).toBe('+65 8123 4567');
    expect(formatPhone('SG:+65', '')).toBe('');
  });

  it('builds a full name from parts', () => {
    expect(fullName({ firstName: 'Ban', lastName: 'Ki-moon' })).toBe('Ban Ki-moon');
    expect(fullName({ firstName: 'Cher' })).toBe('Cher');
  });
});

describe('summary', () => {
  const values = {
    firstName: 'Test',
    lastName: 'Delegate',
    email: 'test@example.edu',
    nationality: 'SG',
    preferredLanguage: 'English',
    phoneDial: 'SG:+65',
    phoneNumber: '8123 4567',
    hasLinkedIn: 'no',
    cv: { name: 'cv.pdf', size: 772, type: 'application/pdf' },
  };

  it('omits empty rows and labels country codes', () => {
    const sections = buildSummarySections(values);
    const personal = sections.find((s) => s.key === 'personal');
    expect(personal.rows).toEqual(expect.arrayContaining([['Nationality', 'Singapore']]));
    expect(personal.rows.find(([k]) => k === 'Preferred name')).toBeUndefined();
  });

  it('produces a plain-text summary with the reference', () => {
    const txt = summaryAsText(values, { id: 'abc123' });
    expect(txt).toContain('Reference: abc123');
    expect(txt).toContain('Nationality: Singapore');
    expect(txt).toContain('CV: cv.pdf (772 B)');
  });

  it('builds a mailto link addressed to the delegate', () => {
    const href = buildMailto('test@example.edu', values, { id: 'abc123' });
    expect(href.startsWith('mailto:test%40example.edu?subject=')).toBe(true);
    expect(decodeURIComponent(href)).toContain('HPAIR delegate form - Test Delegate');
  });
});
