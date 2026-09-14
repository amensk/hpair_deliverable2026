import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import Masthead from './components/layout/Masthead';
import Footer from './components/layout/Footer';
import Login from './components/Login';
import MultiStepForm from './components/MultiStepForm';
import AdminPanel from './components/AdminPanel';
import './App.css';

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
            <Masthead />
            <main className="main" id="main">
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
            </main>
            <Footer />
          </div>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
