// Firebase Storage upload for CV files, with progress reporting.
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

const sanitize = (name) => name.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 100);

// Give up quickly when the bucket is unreachable so the inline fallback can
// take over. The SDK default is 10 minutes of retries.
const UPLOAD_TIMEOUT_MS = 15000;
storage.maxUploadRetryTime = UPLOAD_TIMEOUT_MS;
storage.maxOperationRetryTime = UPLOAD_TIMEOUT_MS;

/**
 * Upload a CV under cvs/{userId}/{timestamp}-{filename}.
 * Resolves to { success, url, path, name, size, type } or { success:false, code, message }.
 * onProgress receives 0..100.
 */
export const uploadCV = (file, userId, onProgress) =>
  new Promise((resolve) => {
    if (!file) {
      resolve({ success: false, code: 'no-file', message: 'No file selected' });
      return;
    }
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
      finish({ success: false, code: 'storage/timeout', message: 'The file storage service did not respond.' });
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
        finish({ success: false, code: error.code, message: friendlyStorageError(error.code) });
      },
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          finish({ success: true, url, path, name: file.name, size: file.size, type: file.type });
        } catch (error) {
          finish({ success: false, code: error.code, message: friendlyStorageError(error.code) });
        }
      }
    );
  });

const friendlyStorageError = (code) => {
  switch (code) {
    case 'storage/unauthorized':
      return 'The storage bucket rejected the upload (permission denied).';
    case 'storage/canceled':
      return 'Upload cancelled.';
    case 'storage/quota-exceeded':
      return 'Storage quota exceeded.';
    case 'storage/retry-limit-exceeded':
      return 'The file storage service could not be reached.';
    case 'storage/unknown':
      return 'The file storage service is unavailable.';
    default:
      return 'The CV could not be uploaded.';
  }
};
