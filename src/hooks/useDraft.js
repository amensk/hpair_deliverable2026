import { useCallback, useEffect, useRef, useState } from 'react';

const KEY = (uid) => `hpair:draft:${uid || 'anon'}`;

/**
 * Persist in-progress form values to localStorage (debounced). Files are not
 * serialisable, so the CV is stored as {name,size,type} metadata only and the
 * user is asked to re-attach it after a reload.
 */
export const readDraft = (uid) => {
  try {
    const raw = localStorage.getItem(KEY(uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.values) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const clearDraft = (uid) => {
  try {
    localStorage.removeItem(KEY(uid));
  } catch {
    /* ignore */
  }
};

export const useDraftSaver = (uid, values, step, enabled = true) => {
  const [savedAt, setSavedAt] = useState(null);
  const timer = useRef(null);
  const first = useRef(true);

  useEffect(() => {
    if (!enabled || !values) return undefined;
    if (first.current) {
      first.current = false;
      return undefined;
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        const { cv, ...rest } = values;
        const payload = {
          step,
          values: { ...rest, cvMeta: cv ? { name: cv.name, size: cv.size, type: cv.type } : null },
          savedAt: Date.now(),
        };
        localStorage.setItem(KEY(uid), JSON.stringify(payload));
        setSavedAt(payload.savedAt);
      } catch {
        /* storage full or unavailable: silently skip */
      }
    }, 600);
    return () => clearTimeout(timer.current);
  }, [uid, values, step, enabled]);

  const reset = useCallback(() => {
    clearDraft(uid);
    setSavedAt(null);
  }, [uid]);

  return { savedAt, reset };
};
