// Firestore service for form submissions
import {
  collection,
  doc,
  getDoc,
  getDocs,
  writeBatch,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { tEn } from '../i18n';

const COLLECTION_NAME = 'formSubmissions';

const errorKey = (code) => {
  switch (code) {
    case 'permission-denied':
      return 'err.db.permission';
    case 'unavailable':
      return 'err.db.unavailable';
    case 'deadline-exceeded':
      return 'err.db.timeout';
    default:
      return 'err.db.generic';
  }
};
const friendlyError = (code) => tEn(errorKey(code));

/**
 * Submit form data to Firestore.
 * The submission document stays small; an inline CV (base64 data URL) is
 * written to formSubmissions/{id}/files/cv in the same atomic batch so list
 * queries never download file payloads.
 */
export const submitForm = async (formData, inlineCv = null) => {
  try {
    const ref = doc(collection(db, COLLECTION_NAME));
    const batch = writeBatch(db);
    batch.set(ref, {
      ...formData,
      cvInline: Boolean(inlineCv),
      submittedAt: serverTimestamp(),
      timestamp: Date.now(),
    });
    if (inlineCv) {
      batch.set(doc(db, COLLECTION_NAME, ref.id, 'files', 'cv'), {
        userId: formData.userId,
        name: formData.cvName || 'cv',
        type: formData.cvType || 'application/octet-stream',
        size: formData.cvSize || null,
        data: inlineCv,
        createdAt: serverTimestamp(),
      });
    }
    await batch.commit();
    return { success: true, id: ref.id, message: 'Form submitted successfully!' };
  } catch (error) {
    console.error('Error submitting form:', error);
    return { success: false, code: error.code, messageKey: errorKey(error.code), message: friendlyError(error.code) };
  }
};

// Fetch an inline CV stored under a submission (on demand, for downloads)
export const getSubmissionCV = async (submissionId) => {
  try {
    const snap = await getDoc(doc(db, COLLECTION_NAME, submissionId, 'files', 'cv'));
    if (!snap.exists()) return { success: false, messageKey: 'err.db.noCv', message: tEn('err.db.noCv') };
    return { success: true, data: snap.data() };
  } catch (error) {
    console.error('Error fetching CV:', error);
    return { success: false, code: error.code, messageKey: errorKey(error.code), message: friendlyError(error.code) };
  }
};

const snapshotToList = (snap) => {
  const list = [];
  snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
  return list;
};

// All submissions (admin view)
export const getFormSubmissions = async (limitCount = 200) => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('submittedAt', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    return { success: true, data: snapshotToList(snap) };
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return { success: false, code: error.code, messageKey: errorKey(error.code), message: friendlyError(error.code) };
  }
};

// Submissions for one user. Sorted client-side so no composite index is needed.
export const getUserSubmissions = async (userId) => {
  if (!userId) return { success: true, data: [] };
  try {
    const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));
    const snap = await getDocs(q);
    const data = snapshotToList(snap).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching user submissions:', error);
    return { success: false, code: error.code, messageKey: errorKey(error.code), message: friendlyError(error.code) };
  }
};

// Total submission count
export const getSubmissionCount = async () => {
  try {
    const snap = await getDocs(collection(db, COLLECTION_NAME));
    return { success: true, count: snap.size };
  } catch (error) {
    console.error('Error getting submission count:', error);
    return { success: false, code: error.code, messageKey: errorKey(error.code), message: friendlyError(error.code) };
  }
};

const firebaseService = { submitForm, getSubmissionCV, getFormSubmissions, getUserSubmissions, getSubmissionCount };

export default firebaseService;
