import React, { useState, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useTaskContext } from '../../contexts/TaskContext';
import { Moon, Sun, Trash2, User, Bell, Check } from 'lucide-react';
import Button from '../common/Button';

const SettingsView = () => {
  const { theme, toggleTheme } = useTheme();
  const [notifPermission, setNotifPermission] = useState('default');

  useEffect(() => {
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notification');
      return;
    }
    
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    
    if (permission === 'granted') {
      new Notification('Notifications Enabled!', {
        body: 'You will now receive alerts for due tasks.',
        icon: '/vite.svg'
      });
    }
  };
  // We can include a generic context to handle this, or just map standard properties.
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Settings</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Profile Section */}
        <section style={{ backgroundColor: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={18} /> Profile
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-full)', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem' }}>U</div>
            <div>
              <p style={{ fontWeight: 600 }}>User Configured</p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Offline Mode Active</p>
            </div>
          </div>
        </section>

        {/* Preferences Section */}
        <section style={{ backgroundColor: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             Preferences
          </h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid var(--color-border)' }}>
            <div>
              <p style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Theme Mode</p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Toggle between dark and light themes</p>
            </div>
            <Button variant="secondary" onClick={toggleTheme}>
              {theme === 'dark' ? <><Sun size={16} /> Light Mode</> : <><Moon size={16} /> Dark Mode</>}
            </Button>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0' }}>
            <div>
              <p style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Bell size={16} /> Notifications</p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Alerts for due tasks</p>
            </div>
            <Button 
              variant={notifPermission === 'granted' ? 'secondary' : 'primary'} 
              onClick={handleEnableNotifications}
              disabled={notifPermission === 'granted' || notifPermission === 'denied'}
            >
              {notifPermission === 'granted' ? <><Check size={16} /> Enabled</> : 
               notifPermission === 'denied' ? 'Blocked by Browser' : 'Enable'}
            </Button>
          </div>
        </section>
        
        {/* Data Management Section */}
        <section style={{ backgroundColor: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-danger)' }}>
            Data Management
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: 500 }}>Clear all local tasks</p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>This action is permanent and cannot be undone.</p>
            </div>
            <Button variant="danger" icon={Trash2} onClick={() => alert('Feature needs to be attached to Task Context.')}>
               Wipe Data
            </Button>
          </div>
        </section>

      </div>
    </div>
  );
};

export default SettingsView;
