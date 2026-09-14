import { countryName, countryByCode } from '../data/countries';
import { GENDERS, OCCUPATIONS, TRACKS, DIETARY, HEARD_FROM } from '../data/languages';

export const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const formatDate = (value) => {
  if (!value) return 'N/A';
  let d;
  if (typeof value?.toDate === 'function') d = value.toDate();
  else if (value?.seconds) d = new Date(value.seconds * 1000);
  else d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};

export const formatDOB = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
};

const labelOf = (list, value) => list.find((o) => o.value === value)?.label || value || '';

export const formatPhone = (dial, number) => {
  if (!number) return '';
  const code = (dial || '').split(':')[1] || '';
  return `${code} ${number}`.trim();
};

export const fullName = (v) => [v.firstName, v.lastName].filter(Boolean).join(' ');

/**
 * Turn raw form values (or a stored submission) into labelled sections that
 * both the Review step and the downloadable summary render from.
 */
export const buildSummarySections = (v) => {
  const dialCountry = countryByCode((v.phoneDial || '').split(':')[0]);
  const sections = [
    {
      key: 'personal',
      title: 'Personal details',
      step: 0,
      rows: [
        ['Full name', fullName(v)],
        ['Preferred name', v.preferredName],
        ['Email', v.email],
        ['Date of birth', formatDOB(v.dateOfBirth)],
        ['Gender', v.gender === 'self-describe' ? v.genderSelfDescribe : labelOf(GENDERS, v.gender)],
        ['Nationality', countryName(v.nationality)],
        ['Second nationality', countryName(v.secondNationality)],
        ['Preferred language', v.preferredLanguage],
        ['Other languages', (v.otherLanguages || []).join(', ')],
      ],
    },
    {
      key: 'contact',
      title: 'Contact & address',
      step: 1,
      rows: [
        ['Phone', formatPhone(v.phoneDial, v.phoneNumber) + (dialCountry ? ` (${dialCountry.name})` : '')],
        ['WhatsApp', v.whatsappSame ? 'Same as phone' : 'Not on WhatsApp / different number'],
        ['Address', [v.addressLine1, v.addressLine2].filter(Boolean).join(', ')],
        ['City / region', [v.city, v.region].filter(Boolean).join(', ')],
        ['Postal code', v.postalCode],
        ['Country', countryName(v.country)],
        ['Emergency contact', v.emergencyName ? `${v.emergencyName} · ${v.emergencyPhone}` : ''],
      ],
    },
    {
      key: 'professional',
      title: 'Background & application',
      step: 2,
      rows: [
        ['Status', labelOf(OCCUPATIONS, v.occupation)],
        ['Institution / employer', v.institution],
        ['Field of study / role', v.fieldOfStudy],
        ['Programme', labelOf(TRACKS, v.track)],
        ['LinkedIn', v.hasLinkedIn === 'yes' ? v.linkedinUrl : 'Not provided'],
        ['Website', v.website],
        ['CV', v.cv?.name ? `${v.cv.name} (${formatBytes(v.cv.size)})` : v.cvName || ''],
        ['Statement', v.statement],
        ['Dietary', v.dietary === 'other' ? v.dietaryOther : labelOf(DIETARY, v.dietary)],
        ['Accessibility needs', v.accessibility],
        ['Heard about HPAIR via', labelOf(HEARD_FROM, v.heardFrom)],
      ],
    },
  ];
  return sections.map((s) => ({ ...s, rows: s.rows.filter(([, val]) => val !== '' && val != null) }));
};
