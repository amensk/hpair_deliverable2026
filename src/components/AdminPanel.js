import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiRefreshCw, FiDownload, FiArrowLeft, FiExternalLink } from 'react-icons/fi';
import { getFormSubmissions, getSubmissionCV } from '../services/firebaseService';
import { isAdmin } from '../utils/admin';
import { useAuth } from '../contexts/AuthContext';
import Alert from './ui/Alert';
import { formatDate, fullName, formatPhone } from '../utils/format';
import { countryName } from '../data/countries';
import { TRACKS } from '../data/languages';
import { downloadBlob } from '../utils/summary';
import { downloadDataUrl } from '../utils/file';
import { useI18n } from '../i18n';

const csvEscape = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const AdminPanel = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  if (!isAdmin(user)) {
    return (
      <div className="container">
        <div className="card card--pad" role="alert">
          <span className="eyebrow">{t('admin.restricted')}</span>
          <h2>{t('admin.restrictedTitle')}</h2>
          <p style={{ marginTop: 8 }}>{user?.isAnonymous ? t('admin.restrictedGuest') : t('admin.restrictedBody', { email: user?.email })}</p>
          <Link to="/" className="btn btn--primary" style={{ width: 'auto', marginTop: 20 }}>{t('admin.backToForm')}</Link>
        </div>
      </div>
    );
  }
  return <AdminTable user={user} />;
};

const AdminTable = ({ user }) => {
  const { t, locale } = useI18n();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState('');
  const [filter, setFilter] = useState('');
  const [track, setTrack] = useState('');
  const [fetchingCv, setFetchingCv] = useState(null);

  const trackLabel = (v) => (v ? t(`options.track.${v}`) : '');

  const downloadCv = async (s) => {
    if (s.cvData) return downloadDataUrl(s.cvData, s.cvName);
    setFetchingCv(s.id);
    const res = await getSubmissionCV(s.id);
    setFetchingCv(null);
    if (res.success) downloadDataUrl(res.data.data, res.data.name || s.cvName);
    else window.alert(t(res.messageKey));
  };

  const load = useCallback(async () => {
    setLoading(true);
    setErrorKey('');
    const res = await getFormSubmissions();
    if (res.success) setSubmissions(res.data);
    else setErrorKey(res.messageKey);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return submissions.filter((s) => {
      if (track && s.track !== track) return false;
      if (!q) return true;
      return [fullName(s), s.email, s.institution, countryName(s.nationality, locale), countryName(s.nationality, 'en'), s.city]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [submissions, filter, track, locale]);

  const exportCsv = () => {
    const headers = ['Reference', 'Submitted', 'Name', 'Email', 'Phone', 'Nationality', 'Country', 'City', 'Institution', 'Track', 'Preferred language', 'LinkedIn', 'CV', 'Form language'];
    const lines = [headers.join(',')];
    rows.forEach((s) =>
      lines.push(
        [
          s.id,
          formatDate(s.submittedAt, 'en'),
          fullName(s),
          s.email,
          formatPhone(s.phoneDial, s.phoneNumber),
          countryName(s.nationality, 'en'),
          countryName(s.country, 'en'),
          s.city,
          s.institution,
          s.track,
          s.preferredLanguage,
          s.linkedinUrl,
          s.cvUrl || (s.cvData || s.cvInline ? `${s.cvName} (embedded)` : s.cvName),
          s.uiLanguage || '',
        ]
          .map(csvEscape)
          .join(',')
      )
    );
    downloadBlob(lines.join('\n'), `hpair-submissions-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
  };

  return (
    <div className="container">
      <div className="card card--pad">
        <div className="toolbar" style={{ justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--hp-ink-muted)' }}>{user.isAnonymous ? t('nav.guestSession') : t('nav.signedInAs', { email: user.email })}</span>
          <Link to="/" className="btn btn--ghost btn--sm" style={{ width: 'auto' }}>
            <FiArrowLeft size={16} aria-hidden="true" /> <span>{t('admin.backToForm')}</span>
          </Link>
        </div>
        <div className="toolbar">
          <input className="input" type="search" placeholder={t('admin.searchPh')} value={filter} onChange={(e) => setFilter(e.target.value)} aria-label={t('admin.searchAria')} />
          <select className="input input--select" style={{ maxWidth: 260, minHeight: 42 }} value={track} onChange={(e) => setTrack(e.target.value)} aria-label={t('admin.filterAria')}>
            <option value="">{t('admin.allProgrammes')}</option>
            {TRACKS.map((o) => (
              <option key={o.value} value={o.value}>{t(o.key)}</option>
            ))}
          </select>
          <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--hp-ink-muted)' }}>
            {loading ? t('admin.loading') : t('admin.countOf', { shown: rows.length, total: submissions.length })}
          </span>
          <button type="button" className="btn btn--ghost btn--sm" style={{ width: 'auto' }} onClick={load} disabled={loading}>
            <FiRefreshCw size={16} aria-hidden="true" /> <span>{t('common.refresh')}</span>
          </button>
          <button type="button" className="btn btn--primary btn--sm" style={{ width: 'auto' }} onClick={exportCsv} disabled={!rows.length}>
            <FiDownload size={16} aria-hidden="true" /> <span>{t('admin.exportCsv')}</span>
          </button>
        </div>

        {errorKey && <Alert type="error">{t(errorKey)}</Alert>}

        {loading ? (
          <div style={{ display: 'grid', gap: 8 }} aria-busy="true">
            {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
          </div>
        ) : rows.length === 0 ? (
          <Alert type="info">{t('admin.noMatch')}</Alert>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>{t('admin.col.submitted')}</th>
                  <th>{t('admin.col.delegate')}</th>
                  <th>{t('admin.col.contact')}</th>
                  <th>{t('admin.col.nationality')}</th>
                  <th>{t('admin.col.institution')}</th>
                  <th>{t('admin.col.programme')}</th>
                  <th>{t('admin.col.links')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td>
                      {formatDate(s.submittedAt, locale)}
                      <div style={{ fontSize: '0.72rem', color: 'var(--hp-ink-muted)' }}>{s.id.slice(-8).toUpperCase()}</div>
                    </td>
                    <td>
                      <strong style={{ fontWeight: 500 }}>{fullName(s) || '—'}</strong>
                      {s.preferredName && <div style={{ fontSize: '0.78rem', color: 'var(--hp-ink-muted)' }}>“{s.preferredName}”</div>}
                    </td>
                    <td>
                      <div>{s.email}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--hp-ink-muted)' }}>{formatPhone(s.phoneDial, s.phoneNumber)}</div>
                    </td>
                    <td>
                      {countryName(s.nationality, locale)}
                      {s.country && s.country !== s.nationality && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--hp-ink-muted)' }}>{t('admin.livesIn', { country: countryName(s.country, locale) })}</div>
                      )}
                    </td>
                    <td>{s.institution}</td>
                    <td><span className="tag">{trackLabel(s.track).split(' (')[0] || '—'}</span></td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {s.linkedinUrl && (
                        <a href={s.linkedinUrl.startsWith('http') ? s.linkedinUrl : `https://${s.linkedinUrl}`} target="_blank" rel="noreferrer" style={{ marginRight: 10 }}>
                          LinkedIn
                        </a>
                      )}
                      {s.cvUrl ? (
                        <a href={s.cvUrl} target="_blank" rel="noreferrer">CV <FiExternalLink size={12} aria-hidden="true" /></a>
                      ) : s.cvData || s.cvInline ? (
                        <button type="button" className="summary__edit" onClick={() => downloadCv(s)} disabled={fetchingCv === s.id}>
                          {fetchingCv === s.id ? t('subs.fetching') : t('admin.cvDownload')}
                        </button>
                      ) : s.cvName ? (
                        <span title={t('admin.cvNameOnlyTitle')}>{t('admin.cvNameOnly', { name: s.cvName })}</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
