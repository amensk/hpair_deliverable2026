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

const csvEscape = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const AdminPanel = () => {
  const { user } = useAuth();
  if (!isAdmin(user?.email)) {
    return (
      <div className="container">
        <div className="card card--pad" role="alert">
          <span className="eyebrow">Restricted</span>
          <h2>This page is limited to HPAIR staff.</h2>
          <p style={{ marginTop: 8 }}>Your account ({user?.email}) is not on the admin list.</p>
          <Link to="/" className="btn btn--primary" style={{ width: 'auto', marginTop: 20 }}>Back to my form</Link>
        </div>
      </div>
    );
  }
  return <AdminTable user={user} />;
};

const AdminTable = ({ user }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [track, setTrack] = useState('');
  const [fetchingCv, setFetchingCv] = useState(null);

  const downloadCv = async (s) => {
    if (s.cvData) return downloadDataUrl(s.cvData, s.cvName);
    setFetchingCv(s.id);
    const res = await getSubmissionCV(s.id);
    setFetchingCv(null);
    if (res.success) downloadDataUrl(res.data.data, res.data.name || s.cvName);
    else window.alert(res.message);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const res = await getFormSubmissions();
    if (res.success) setSubmissions(res.data);
    else setError(res.message);
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
      return [fullName(s), s.email, s.institution, countryName(s.nationality), s.city].filter(Boolean).join(' ').toLowerCase().includes(q);
    });
  }, [submissions, filter, track]);

  const exportCsv = () => {
    const headers = ['Reference', 'Submitted', 'Name', 'Email', 'Phone', 'Nationality', 'Country', 'City', 'Institution', 'Track', 'Preferred language', 'LinkedIn', 'CV'];
    const lines = [headers.join(',')];
    rows.forEach((s) =>
      lines.push(
        [
          s.id,
          formatDate(s.submittedAt),
          fullName(s),
          s.email,
          formatPhone(s.phoneDial, s.phoneNumber),
          countryName(s.nationality),
          countryName(s.country),
          s.city,
          s.institution,
          TRACKS.find((t) => t.value === s.track)?.label || s.track,
          s.preferredLanguage,
          s.linkedinUrl,
          s.cvUrl || (s.cvData || s.cvInline ? `${s.cvName} (embedded)` : s.cvName),
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
          <span style={{ fontSize: '0.85rem', color: 'var(--hp-ink-muted)' }}>Signed in as {user.email}</span>
          <Link to="/" className="btn btn--ghost btn--sm" style={{ width: 'auto' }}>
            <FiArrowLeft size={16} aria-hidden="true" /> <span>Back to my form</span>
          </Link>
        </div>
        <div className="toolbar">
          <input
            className="input"
            type="search"
            placeholder="Search name, email, institution, country…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Search submissions"
          />
          <select className="input input--select" style={{ maxWidth: 260, minHeight: 42 }} value={track} onChange={(e) => setTrack(e.target.value)} aria-label="Filter by programme">
            <option value="">All programmes</option>
            {TRACKS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--hp-ink-muted)' }}>
            {loading ? 'Loading…' : `${rows.length} of ${submissions.length}`}
          </span>
          <button type="button" className="btn btn--ghost btn--sm" style={{ width: 'auto' }} onClick={load} disabled={loading}>
            <FiRefreshCw size={16} aria-hidden="true" /> <span>Refresh</span>
          </button>
          <button type="button" className="btn btn--primary btn--sm" style={{ width: 'auto' }} onClick={exportCsv} disabled={!rows.length}>
            <FiDownload size={16} aria-hidden="true" /> <span>Export CSV</span>
          </button>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        {loading ? (
          <div style={{ display: 'grid', gap: 8 }} aria-busy="true">
            {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
          </div>
        ) : rows.length === 0 ? (
          <Alert type="info">No submissions match.</Alert>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Submitted</th>
                  <th>Delegate</th>
                  <th>Contact</th>
                  <th>Nationality / residence</th>
                  <th>Institution</th>
                  <th>Programme</th>
                  <th>Links</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td>
                      {formatDate(s.submittedAt)}
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
                      {countryName(s.nationality)}
                      {s.country && s.country !== s.nationality && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--hp-ink-muted)' }}>lives in {countryName(s.country)}</div>
                      )}
                    </td>
                    <td>{s.institution}</td>
                    <td><span className="tag">{TRACKS.find((t) => t.value === s.track)?.label?.split(' (')[0] || s.track || '—'}</span></td>
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
                          {fetchingCv === s.id ? 'Fetching…' : 'CV (download)'}
                        </button>
                      ) : s.cvName ? (
                        <span title="File name recorded; upload was not stored">CV: {s.cvName}</span>
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
