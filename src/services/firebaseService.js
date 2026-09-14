// Firestore service for form submissions
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION_NAME = 'formSubmissions';

const friendlyError = (code) => {
  switch (code) {
    case 'permission-denied':
      return "The database's security rules denied this request (permission denied).";
    case 'unavailable':
      return 'The service is temporarily unavailable. Check your connection and try again.';
    case 'deadline-exceeded':
      return 'The request timed out. Please try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
};

// Submit form data to Firestore
export const submitForm = async (formData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...formData,
      submittedAt: serverTimestamp(),
      timestamp: Date.now(),
    });
    return { success: true, id: docRef.id, message: 'Form submitted successfully!' };
  } catch (error) {
    console.error('Error submitting form:', error);
    return { success: false, code: error.code, message: friendlyError(error.code) };
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
    return { success: false, code: error.code, message: friendlyError(error.code) };
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
    return { success: false, code: error.code, message: friendlyError(error.code) };
  }
};

// Total submission count
export const getSubmissionCount = async () => {
  try {
    const snap = await getDocs(collection(db, COLLECTION_NAME));
    return { success: true, count: snap.size };
  } catch (error) {
    console.error('Error getting submission count:', error);
    return { success: false, code: error.code, message: friendlyError(error.code) };
  }
};

const firebaseService = { submitForm, getFormSubmissions, getUserSubmissions, getSubmissionCount };

export default firebaseService;
