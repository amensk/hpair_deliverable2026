// Firebase Storage upload for CV files, with progress reporting.
import app from '../firebase/config';
import { tEn } from '../i18n';

// The Storage SDK is only needed at upload time, so it is loaded on demand
// to keep it out of the initial bundle.
const loadStorage = async () => {
  const mod = await import('firebase/storage');
  const storage = mod.getStorage(app);
  storage.maxUploadRetryTime = UPLOAD_TIMEOUT_MS;
  storage.maxOperationRetryTime = UPLOAD_TIMEOUT_MS;
  return { ...mod, storage };
};

const sanitize = (name) => name.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 100);

// Give up quickly when the bucket is unreachable so the inline fallback can
// take over. The SDK default is 10 minutes of retries.
const UPLOAD_TIMEOUT_MS = 15000;

/**
 * Upload a CV under cvs/{userId}/{timestamp}-{filename}.
 * Resolves to { success, url, path, name, size, type } or { success:false, code, message }.
 * onProgress receives 0..100.
 */
export const uploadCV = async (file, userId, onProgress) => {
  if (!file) return { success: false, code: 'no-file', messageKey: 'err.cv.noFile', message: tEn('err.cv.noFile') };
  let sdk;
  try {
    sdk = await loadStorage();
  } catch (error) {
    return { success: false, code: 'storage/unavailable', messageKey: 'err.storage.module', message: tEn('err.storage.module') };
  }
  const { ref, uploadBytesResumable, getDownloadURL, storage } = sdk;
  return new Promise((resolve) => {
    const path = `cvs/${userId || 'anonymous'}/${Date.now()}-${sanitize(file.name)}`;
    const task = uploadBytesResumable(ref(storage, path), file, { contentType: file.type || 'application/octet-stream' });

    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(() => {
      try {
        task.cancel();
      } catch {
        /* already finished */
      }
      finish({ success: false, code: 'storage/timeout', messageKey: 'err.storage.noResponse', message: tEn('err.storage.noResponse') });
    }, UPLOAD_TIMEOUT_MS + 2000);

    task.on(
      'state_changed',
      (snap) => {
        if (onProgress && snap.totalBytes) {
          onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
        }
      },
      (error) => {
        console.error('CV upload failed:', error);
        finish({ success: false, code: error.code, messageKey: storageKey(error.code), message: friendlyStorageError(error.code) });
      },
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          finish({ success: true, url, path, name: file.name, size: file.size, type: file.type });
        } catch (error) {
          finish({ success: false, code: error.code, messageKey: storageKey(error.code), message: friendlyStorageError(error.code) });
        }
      }
    );
  });
};

const storageKey = (code) => {
  switch (code) {
    case 'storage/unauthorized':
      return 'err.storage.unauthorized';
    case 'storage/canceled':
      return 'err.storage.cancelled';
    case 'storage/quota-exceeded':
      return 'err.storage.quota';
    case 'storage/retry-limit-exceeded':
      return 'err.storage.retry';
    case 'storage/unknown':
      return 'err.storage.unknown';
    default:
      return 'err.storage.generic';
  }
};
const friendlyStorageError = (code) => tEn(storageKey(code));
