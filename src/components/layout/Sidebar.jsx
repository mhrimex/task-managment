/**
 * src/components/layout/Sidebar.jsx
 */
import React from 'react';
import { 
  CheckSquare, 
  LayoutDashboard, 
  Calendar, 
  Settings,
  X 
} from 'lucide-react';
import { useTaskContext } from '../../contexts/TaskContext';
import styles from './Sidebar.module.css';

const Sidebar = ({ isOpen, closeSidebar, activeTab, setActiveTab }) => {
  const { tasks } = useTaskContext();
  const pendingCount = tasks.filter(t => t.status !== 'completed').length;

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'tasks', icon: CheckSquare, label: 'My Tasks' },
    { id: 'calendar', icon: Calendar, label: 'Calendar' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <CheckSquare size={24} color="white" />
          </div>
          <h1>Taskify</h1>
        </div>
        <button className={styles.closeBtn} onClick={closeSidebar}>
          <X size={20} />
        </button>
      </div>

      <nav className={styles.nav}>
        <ul>
          {navItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <li key={index}>
                <a 
                  href="#" 
                  className={`${styles.navLink} ${activeTab === item.id ? styles.active : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab(item.id);
                    if (window.innerWidth <= 768) closeSidebar();
                  }}
                >
                  <Icon size={20} className={styles.navIcon} />
                  <span>{item.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={styles.bottom}>
        <div className={styles.statsCard}>
          <h3>Daily Progress</h3>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: tasks.length > 0 ? `${(tasks.filter(t => t.status === 'completed').length / tasks.length) * 100}%` : '0%' }}></div>
          </div>
          <p>You have {pendingCount} tasks left today!</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
