/**
 * src/components/auth/LoginPage.jsx
 * 
 * Simple login page with username/password authentication.
 * Credentials are checked client-side and session is stored in localStorage.
 */
import React, { useState } from 'react';
import { CheckSquare, Lock, User, AlertCircle } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate a brief loading delay for a polished feel
    await new Promise(resolve => setTimeout(resolve, 600));

    const success = login(username, password);

    if (!success) {
      setError('Invalid username or password. Please try again.');
    }

    setIsLoading(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Logo / Branding */}
        <div className={styles.brand}>
          <div className={styles.logo}>
            <CheckSquare size={32} color="white" />
          </div>
          <h1 className={styles.appName}>Taskify</h1>
          <p className={styles.tagline}>Your personal task manager</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="username" className={styles.label}>Username</label>
            <div className={styles.inputWrapper}>
              <User size={18} className={styles.inputIcon} />
              <input
                id="username"
                type="text"
                className={styles.input}
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                id="password"
                type="password"
                className={styles.input}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {error && (
            <div className={styles.errorBox}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className={styles.spinner} />
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
