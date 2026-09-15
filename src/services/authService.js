// Authentication service using Firebase Auth
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  signInAnonymously,
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { tEn } from '../i18n';

// Register a new user
export const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { 
      success: true, 
      user: userCredential.user,
      message: 'Registration successful!' 
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { 
      success: false, 
      messageKey: getErrorKey(error.code),
      message: getErrorMessage(error.code) 
    };
  }
};

// Sign in existing user
export const signInUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { 
      success: true, 
      user: userCredential.user,
      message: 'Login successful!' 
    };
  } catch (error) {
    console.error('Login error:', error);
    return { 
      success: false, 
      messageKey: getErrorKey(error.code),
      message: getErrorMessage(error.code) 
    };
  }
};

// Sign in as a guest (Firebase anonymous auth). No email or password needed;
// the session lives in this browser until the user logs out.
export const signInAsGuest = async () => {
  try {
    const userCredential = await signInAnonymously(auth);
    return { success: true, user: userCredential.user, messageKey: 'auth.guestWelcome', message: tEn('auth.guestWelcome') };
  } catch (error) {
    console.error('Guest sign-in error:', error);
    const key = error.code === 'auth/operation-not-allowed' || error.code === 'auth/admin-restricted-operation' ? 'auth.err.guestDisabled' : getErrorKey(error.code);
    return { success: false, messageKey: key, message: tEn(key) };
  }
};

// Send a password reset email
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, messageKey: 'auth.resetSent', message: tEn('auth.resetSent') };
  } catch (error) {
    console.error('Reset error:', error);
    // Do not reveal whether the address exists.
    if (error.code === 'auth/user-not-found') {
      return { success: true, messageKey: 'auth.resetSent', message: tEn('auth.resetSent') };
    }
    return { success: false, messageKey: getErrorKey(error.code), message: getErrorMessage(error.code) };
  }
};

// Sign out user
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true, messageKey: 'auth.loggedOut', message: tEn('auth.loggedOut') };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, messageKey: 'auth.logoutFailed', message: tEn('auth.logoutFailed') };
  }
};

// Listen to auth state changes
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Helper function to get user-friendly error messages
const ERROR_KEYS = {
  'auth/email-already-in-use': 'auth.err.inUse',
  'auth/weak-password': 'auth.err.weak',
  'auth/invalid-email': 'auth.err.invalidEmail',
  'auth/user-not-found': 'auth.err.notFound',
  'auth/wrong-password': 'auth.err.wrong',
  'auth/invalid-credential': 'auth.err.wrong',
  'auth/invalid-login-credentials': 'auth.err.wrong',
  'auth/too-many-requests': 'auth.err.tooMany',
  'auth/operation-not-allowed': 'auth.err.notAllowed',
  'auth/network-request-failed': 'auth.err.network',
  'auth/user-disabled': 'auth.err.disabled',
};
const getErrorKey = (code) => ERROR_KEYS[code] || 'auth.err.generic';
const getErrorMessage = (code) => tEn(getErrorKey(code));

const authService = {
  registerUser,
  signInUser,
  resetPassword,
  signInAsGuest,
  signOutUser,
  onAuthStateChange,
  getCurrentUser
};

export default authService;
