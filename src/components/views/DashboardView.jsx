import React from 'react';
import { useTaskContext } from '../../contexts/TaskContext';
import TaskList from '../tasks/TaskList';

const DashboardView = ({ onAddTask, onEditTask }) => {
  const { tasks } = useTaskContext();
  
  const completed = tasks.filter(t => t.status === 'completed').length;
  const pending = tasks.filter(t => t.status !== 'completed').length;
  const highPriority = tasks.filter(t => t.status !== 'completed' && t.priority === 'high').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Dashboard Overview</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <div style={{ padding: '1.5rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Tasks</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text)' }}>{tasks.length}</p>
        </div>
        
        <div style={{ padding: '1.5rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Completed Tasks</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-success)' }}>{completed}</p>
        </div>
        
        <div style={{ padding: '1.5rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Pending Tasks</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-warning)' }}>{pending}</p>
        </div>

        <div style={{ padding: '1.5rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>High Priority (Pending)</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-danger)' }}>{highPriority}</p>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <div style={{ 
          backgroundColor: 'var(--color-surface)', 
          borderRadius: 'var(--radius-lg)', 
          border: '1px solid var(--color-border)', 
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden'
        }}>
          <TaskList onAddTask={onAddTask} onEditTask={onEditTask} />
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
