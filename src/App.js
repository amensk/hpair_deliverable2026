import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import Masthead from './components/layout/Masthead';
import Footer from './components/layout/Footer';
import Login from './components/Login';
import MultiStepForm from './components/MultiStepForm';
import ErrorBoundary from './components/ErrorBoundary';
import { I18nProvider, useI18n } from './i18n';
import './App.css';

// The admin table (and its CSV export) is only needed by staff; load it on demand.
const AdminPanel = lazy(() => import('./components/AdminPanel'));

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="container loading-screen" role="status" aria-live="polite">
        <div style={{ display: 'grid', gap: 10, justifyItems: 'center' }}>
          <span className="spinner" aria-hidden="true" />
          <span>{t('common.loadingSession')}</span>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;
  return children;
};

const SkipLink = () => {
  const { t } = useI18n();
  return <a className="skip-link" href="#main">{t('common.skip')}</a>;
};

function App() {
  return (
    <AuthProvider>
      <I18nProvider>
      <ToastProvider>
        <Router>
          <div className="app">
            <SkipLink />
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
      </I18nProvider>
    </AuthProvider>
  );
}

export default App;
