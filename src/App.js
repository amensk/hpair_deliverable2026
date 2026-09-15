import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import Masthead from './components/layout/Masthead';
import Footer from './components/layout/Footer';
import Login from './components/Login';
import MultiStepForm from './components/MultiStepForm';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

// The admin table (and its CSV export) is only needed by staff; load it on demand.
const AdminPanel = lazy(() => import('./components/AdminPanel'));

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container loading-screen" role="status" aria-live="polite">
        <div style={{ display: 'grid', gap: 10, justifyItems: 'center' }}>
          <span className="spinner" aria-hidden="true" />
          <span>Checking your session…</span>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <div className="app">
            <a className="skip-link" href="#main">Skip to main content</a>
            <Masthead />
            <main className="main" id="main" tabIndex={-1}>
              <ErrorBoundary>
              <Suspense fallback={<div className="container loading-screen" role="status"><span className="spinner" aria-hidden="true" /></div>}>
              <Routes>
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <MultiStepForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminPanel />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              </Suspense>
              </ErrorBoundary>
            </main>
            <Footer />
          </div>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
