import React from 'react';
import AppContent from './AppContent';
import { TaskProvider } from './contexts/TaskContext';
import { AuthProvider, useAuthContext } from './contexts/AuthContext';
import LoginPage from './components/auth/LoginPage';

function AppRoot() {
  const { currentUser } = useAuthContext();

  if (!currentUser) {
    return <LoginPage />;
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
