import React from 'react';
import AppContent from './AppContent';
import { TaskProvider } from './lib/TaskContext';
import { AuthProvider, useAuthContext } from './lib/AuthContext';
import LoginPage from './components/auth/LoginPage';

function AppRoot() {
  const { currentUser, isLoading } = useAuthContext();

  if (!currentUser) {
    return <LoginPage />;
  }

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif',
        gap: '1.25rem'
      }}>
        <div style={{
          width: '3rem',
          height: '3rem',
          border: '4px solid #1e293b',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <span style={{ fontSize: '0.95rem', fontWeight: 500, letterSpacing: '0.025em', opacity: 0.85 }}>
          Initializing session...
        </span>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <TaskProvider>
      <AppContent />
    </TaskProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoot />
    </AuthProvider>
  );
}

export default App;
