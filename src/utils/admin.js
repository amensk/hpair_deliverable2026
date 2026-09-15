// Optional admin allow-list. Set REACT_APP_ADMIN_EMAILS="a@x.edu,b@y.edu" to
// restrict /admin; when unset (the demo default) any signed-in user may view it.
const LIST = (process.env.REACT_APP_ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const adminListConfigured = LIST.length > 0;

export const isAdmin = (email) => !adminListConfigured || LIST.includes((email || '').toLowerCase());
