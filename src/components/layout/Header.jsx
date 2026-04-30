/**
 * src/components/layout/Header.jsx
 */
import React, { useState, useRef, useEffect } from 'react';
import { Menu, Moon, Sun, Bell, AlertCircle, Calendar as CalendarIcon, RefreshCw } from 'lucide-react';
import { format, isPast, parseISO, isToday } from 'date-fns';
import { useTheme } from '../../hooks/useTheme';
import { useTaskContext } from '../../contexts/TaskContext';
import styles from './Header.module.css';

const Header = ({ toggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const { tasks, manualSync, isLoading } = useTaskContext();
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate notifications (overdue or due today)
  const notifications = tasks.filter(task => {
    if (task.status === 'completed' || !task.dueDate) return false;
    const due = parseISO(task.dueDate);
    return isToday(due) || isPast(due);
  });

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button 
          className={styles.menuBtn} 
          onClick={toggleSidebar}
          aria-label="Toggle Navigation"
        >
          <Menu size={24} />
        </button>
        <h2 className={styles.greeting}>Good Morning! ☀️</h2>
      </div>

      <div className={styles.right}>
        <button 
          className={`${styles.iconBtn} ${isLoading ? styles.spinning : ''}`} 
          onClick={manualSync}
          aria-label="Sync Tasks"
          title="Sync with cloud"
        >
          <RefreshCw size={20} />
        </button>

        <div className={styles.notificationWrapper} ref={dropdownRef}>
          <button 
            className={styles.iconBtn} 
            aria-label="Notifications"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} />
            {notifications.length > 0 && <span className={styles.badge}>{notifications.length}</span>}
          </button>
          
          {showNotifications && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <h4>Notifications</h4>
                <span className={styles.badgeCount}>{notifications.length} New</span>
              </div>
              <div className={styles.dropdownList}>
                {notifications.length > 0 ? (
                  notifications.map(task => {
                    const isOverdueMsg = isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate));
                    return (
                      <div key={task.id} className={styles.notificationItem}>
                        <div className={`${styles.iconCircle} ${isOverdueMsg ? styles.danger : styles.warning}`}>
                          {isOverdueMsg ? <AlertCircle size={14} /> : <CalendarIcon size={14} />}
                        </div>
                        <div>
                          <p className={styles.notifTitle}>{task.title}</p>
                          <p className={styles.notifTime}>{isOverdueMsg ? 'Overdue' : 'Due Today'}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className={styles.emptyNotif}>
                    <p>All caught up!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <button 
          className={styles.iconBtn} 
          onClick={toggleTheme}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        
        <div className={styles.avatar}>
           <span>U</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
