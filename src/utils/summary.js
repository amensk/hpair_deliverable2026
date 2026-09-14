import { buildSummarySections, fullName, formatDate } from './format';

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const summaryAsText = (values, meta = {}) => {
  const lines = [];
  lines.push('HPAIR DELEGATE INFORMATION FORM');
  lines.push('Harvard College Project for Asian and International Relations');
  lines.push('');
  if (meta.id) lines.push(`Reference: ${meta.id}`);
  lines.push(`Submitted: ${meta.submittedAt ? formatDate(meta.submittedAt) : new Date().toLocaleString()}`);
  lines.push('');
  buildSummarySections(values).forEach((section) => {
    lines.push(section.title.toUpperCase());
    lines.push('-'.repeat(section.title.length));
    section.rows.forEach(([k, v]) => lines.push(`${k}: ${v}`));
    lines.push('');
  });
  return lines.join('\n');
};

export const summaryAsJSON = (values, meta = {}) => {
  const { cv, ...rest } = values;
  return JSON.stringify(
    {
      reference: meta.id || null,
      submittedAt: meta.submittedAt ? formatDate(meta.submittedAt) : new Date().toISOString(),
      ...rest,
      cv: cv ? { name: cv.name, size: cv.size, type: cv.type } : values.cvName ? { name: values.cvName } : null,
    },
    null,
    2
  );
};

export const downloadBlob = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const safeFilename = (values, ext) =>
  `HPAIR-${(fullName(values) || 'submission').replace(/[^A-Za-z0-9]+/g, '-')}.${ext}`;

export const buildMailto = (to, values, meta = {}) => {
  const subject = `HPAIR delegate form - ${fullName(values)}${meta.id ? ` (${meta.id.slice(-8)})` : ''}`;
  const body = summaryAsText(values, meta);
  // mailto bodies are limited by clients; keep under ~1800 chars for safety
  const trimmed = body.length > 1800 ? `${body.slice(0, 1750)}\n\n[Summary truncated - download the full copy from the portal]` : body;
  return `mailto:${encodeURIComponent(to || '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(trimmed)}`;
};

/** Opens a print-friendly window with the summary so the user can Save as PDF. */
export const printSummary = (values, meta = {}) => {
  const sections = buildSummarySections(values);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>HPAIR form - ${escapeHtml(fullName(values))}</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    body{font-family:Poppins,Helvetica,Arial,sans-serif;color:#171716;margin:40px;font-size:13px;line-height:1.5}
    header{border-bottom:4px solid #650606;padding-bottom:14px;margin-bottom:24px}
    h1{font-size:22px;font-weight:500;letter-spacing:-.02em;margin:0}
    header p{margin:4px 0 0;color:#6f6f6c}
    h2{font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#650606;margin:26px 0 8px}
    table{width:100%;border-collapse:collapse}
    td{padding:7px 10px;border-bottom:1px solid #e4e2df;vertical-align:top}
    td:first-child{width:200px;color:#6f6f6c}
    .ref{display:inline-block;margin-top:8px;padding:4px 8px;background:#f4f2ef;font-size:12px}
    @media print{body{margin:16mm}}
  </style></head><body>
  <header><h1>HPAIR Delegate Information Form</h1><p>Harvard College Project for Asian and International Relations</p>
  ${meta.id ? `<span class="ref">Reference ${escapeHtml(meta.id)}</span>` : ''}
  <p>Submitted ${escapeHtml(meta.submittedAt ? formatDate(meta.submittedAt) : new Date().toLocaleString())}</p></header>
  ${sections
    .map(
      (s) => `<h2>${escapeHtml(s.title)}</h2><table>${s.rows
        .map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`)
        .join('')}</table>`
    )
    .join('')}
  <script>window.onload=function(){window.print()}</script></body></html>`;
  const w = window.open('', '_blank', 'noopener,width=900,height=1000');
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
};
