// Authentication service using Firebase Auth
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../firebase/config';

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
      message: getErrorMessage(error.code) 
    };
  }
};

// Send a password reset email
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, message: 'If an account exists for that email, a reset link is on its way.' };
  } catch (error) {
    console.error('Reset error:', error);
    // Do not reveal whether the address exists.
    if (error.code === 'auth/user-not-found') {
      return { success: true, message: 'If an account exists for that email, a reset link is on its way.' };
    }
    return { success: false, message: getErrorMessage(error.code) };
  }
};

// Sign out user
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true, message: 'Logged out successfully!' };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, message: 'Failed to logout' };
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
const getErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please try logging in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please register first.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'Incorrect email or password. Please try again.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled for this project. Contact the HPAIR tech team.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    default:
      return 'An error occurred. Please try again.';
  }
};

const authService = {
  registerUser,
  signInUser,
  resetPassword,
  signOutUser,
  onAuthStateChange,
  getCurrentUser
};

export default authService;
