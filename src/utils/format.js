import { countryName, countryByCode } from '../data/countries';
import { languageName } from '../data/languages';
import { tEn } from '../i18n';

export const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const formatDate = (value, locale) => {
  if (!value) return 'N/A';
  let d;
  if (typeof value?.toDate === 'function') d = value.toDate();
  else if (value?.seconds) d = new Date(value.seconds * 1000);
  else d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString(locale || undefined, { dateStyle: 'medium', timeStyle: 'short' });
};

export const formatDOB = (value, locale) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(locale || undefined, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
};

/** Translate an option value via its namespace, falling back to the raw value. */
const optionLabel = (t, ns, value) => {
  if (!value) return '';
  const key = `options.${ns}.${value}`;
  const out = t(key);
  return out === key ? value : out;
};

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
export const buildSummarySections = (v, t = tEn, locale = 'en') => {
  const dialCountry = countryByCode((v.phoneDial || '').split(':')[0]);
  const sections = [
    {
      key: 'personal',
      title: t('summary.personal'),
      step: 0,
      rows: [
        [t('summary.fullName'), fullName(v)],
        [t('summary.preferredName'), v.preferredName],
        [t('summary.email'), v.email],
        [t('summary.dob'), formatDOB(v.dateOfBirth, locale)],
        [t('summary.gender'), v.gender === 'self-describe' ? v.genderSelfDescribe : optionLabel(t, 'gender', v.gender)],
        [t('summary.nationality'), countryName(v.nationality, locale)],
        [t('summary.secondNationality'), countryName(v.secondNationality, locale)],
        [t('summary.preferredLanguage'), languageName(v.preferredLanguage, locale)],
        [t('summary.otherLanguages'), (v.otherLanguages || []).map((l) => languageName(l, locale)).join(', ')],
      ],
    },
    {
      key: 'contact',
      title: t('summary.contact'),
      step: 1,
      rows: [
        [t('summary.phone'), formatPhone(v.phoneDial, v.phoneNumber) + (dialCountry && v.phoneNumber ? ` (${countryName(dialCountry.code, locale)})` : '')],
        [t('summary.whatsapp'), v.phoneNumber ? (v.whatsappSame ? t('summary.whatsappSame') : t('summary.whatsappNo')) : ''],
        [t('summary.address'), [v.addressLine1, v.addressLine2].filter(Boolean).join(', ')],
        [t('summary.cityRegion'), [v.city, v.region].filter(Boolean).join(', ')],
        [t('summary.postal'), v.postalCode],
        [t('summary.country'), countryName(v.country, locale)],
        [t('summary.emergency'), v.emergencyName ? `${v.emergencyName} · ${v.emergencyPhone}` : ''],
      ],
    },
    {
      key: 'professional',
      title: t('summary.professional'),
      step: 2,
      rows: [
        [t('summary.status'), optionLabel(t, 'occupation', v.occupation)],
        [t('summary.institution'), v.institution],
        [t('summary.fieldOfStudy'), v.fieldOfStudy],
        [t('summary.programme'), optionLabel(t, 'track', v.track)],
        [t('summary.linkedin'), v.hasLinkedIn === 'yes' ? v.linkedinUrl : v.hasLinkedIn === 'no' ? t('summary.notProvided') : ''],
        [t('summary.website'), v.website],
        [t('summary.cv'), v.cv?.name ? `${v.cv.name} (${formatBytes(v.cv.size)})` : v.cvName || ''],
        [t('summary.statement'), v.statement],
        [t('summary.dietary'), v.dietary === 'other' ? v.dietaryOther : optionLabel(t, 'dietary', v.dietary)],
        [t('summary.accessibility'), v.accessibility],
        [t('summary.heardFrom'), optionLabel(t, 'heardFrom', v.heardFrom)],
      ],
    },
  ];
  return sections.map((s) => ({ ...s, rows: s.rows.filter(([, val]) => val !== '' && val != null) }));
};
