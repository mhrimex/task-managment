import React, { useState, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useTaskContext } from '../../contexts/TaskContext';
import { Moon, Sun, Trash2, User, Bell, Check, Download, Upload } from 'lucide-react';
import Button from '../common/Button';

const SettingsView = () => {
  const { theme, toggleTheme } = useTheme();
  const [notifPermission, setNotifPermission] = useState('default');
  const [notifsEnabled, setNotifsEnabled] = useState(() => {
    return localStorage.getItem('app_notifs_enabled') !== 'false';
  });

  useEffect(() => {
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const handleExport = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `tasks_backup_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedTasks = JSON.parse(e.target.result);
        if (Array.isArray(importedTasks)) {
          await importTasks(importedTasks);
          alert('Tasks imported successfully!');
        } else {
          alert('Invalid backup file format. Expected an array of tasks.');
        }
      } catch (err) {
        alert('Error parsing backup file. Make sure it is a valid JSON.');
      }
    };
    reader.readAsText(file);
    event.target.value = null; // Reset input
  };

  const handleWipe = async () => {
    if (window.confirm("Are you absolutely sure you want to wipe ALL tasks? This action cannot be undone.")) {
      try {
        await wipeAllTasks();
        alert("All tasks have been wiped.");
      } catch (e) {
        alert("Failed to wipe tasks.");
      }
    }
  };

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notification');
      return;
    }
    
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    
    if (permission === 'granted') {
      setNotifsEnabled(true);
      localStorage.setItem('app_notifs_enabled', 'true');
      new Notification('Notifications Enabled!', {
        body: 'You will now receive alerts for due tasks.',
        icon: '/vite.svg'
      });
    }
  };

  const handleDisableNotifications = () => {
    setNotifsEnabled(false);
    localStorage.setItem('app_notifs_enabled', 'false');
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
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {notifPermission === 'granted' && notifsEnabled ? (
                <Button variant="secondary" onClick={handleDisableNotifications}>
                   Disable
                </Button>
              ) : (
                <Button 
                  variant={notifPermission === 'granted' ? 'primary' : 'primary'} 
                  onClick={handleEnableNotifications}
                  disabled={notifPermission === 'denied'}
                >
                  {notifPermission === 'granted' ? 'Enable' : 
                   notifPermission === 'denied' ? 'Blocked by Browser' : 'Request Access'}
                </Button>
              )}
            </div>
          </div>
        </section>
        
        {/* Data Management Section */}
        <section style={{ backgroundColor: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text)' }}>
            Data Management
          </h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid var(--color-border)' }}>
            <div>
              <p style={{ fontWeight: 500 }}>Export Backup</p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Download a JSON file of all your tasks.</p>
            </div>
            <Button variant="secondary" icon={Download} onClick={handleExport}>
               Export
            </Button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid var(--color-border)' }}>
            <div>
              <p style={{ fontWeight: 500 }}>Import Backup</p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Restore tasks from a previously saved JSON file.</p>
            </div>
            <div style={{ position: 'relative' }}>
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImport} 
                style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                title="Choose backup file"
              />
              <Button variant="secondary" icon={Upload}>
                 Import
              </Button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0' }}>
            <div>
              <p style={{ fontWeight: 500, color: 'var(--color-danger)' }}>Clear all local tasks</p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>This action is permanent and cannot be undone.</p>
            </div>
            <Button variant="danger" icon={Trash2} onClick={handleWipe}>
               Wipe Data
            </Button>
          </div>
        </section>

      </div>
    </div>
  );
};

export default SettingsView;
