// Fallback store for completed submissions when the database refuses the write.
// Kept per user in localStorage and clearly labelled in the UI as device-only.
const KEY = (uid) => `hpair:local-submissions:${uid || 'anon'}`;

export const readLocalSubmissions = (uid) => {
  try {
    const raw = localStorage.getItem(KEY(uid));
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

export const saveLocalSubmission = (uid, submission) => {
  try {
    const list = readLocalSubmissions(uid);
    // Never persist large inline files locally; keep metadata only.
    const { cvData, ...rest } = submission;
    list.unshift(rest);
    localStorage.setItem(KEY(uid), JSON.stringify(list.slice(0, 20)));
    return true;
  } catch {
    return false;
  }
};

export const makeLocalId = () => `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
