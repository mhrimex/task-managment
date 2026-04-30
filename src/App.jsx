import React, { useState } from 'react';
import AppContent from './AppContent';
import { TaskProvider } from './contexts/TaskContext';
import LoginPage from './components/auth/LoginPage';

function App() {
  // Check if user was previously logged in (persists across refresh)
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem('isLoggedIn') === 'true'
  );

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <TaskProvider>
      <AppContent onLogout={() => {
        localStorage.removeItem('isLoggedIn');
        setIsLoggedIn(false);
      }} />
    </TaskProvider>
  );
}

export default App;
