/**
 * src/components/tasks/TaskList.jsx
 */
import React from 'react';
import { PlusCircle, Search } from 'lucide-react';
import TaskItem from './TaskItem';
import Input from '../common/Input';
import Button from '../common/Button';
import { useTaskContext } from '../../contexts/TaskContext';
import styles from './TaskList.module.css';

const TaskList = ({ onAddTask, onEditTask }) => {
  const { 
    tasks, 
    isLoading,
    removeTask, 
    updateStatus,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy
  } = useTaskContext();

  const handleFilterChange = (newFilter) => setFilter(newFilter);

  // Derive filtered and sorted tasks
  const processedTasks = tasks
    .filter(task => {
      // Filter tab
      if (filter === 'completed' && task.status !== 'completed') return false;
      if (filter === 'pending' && task.status !== 'pending') return false;
      if (filter === 'skipped' && task.status !== 'skipped') return false;
      if (filter === 'cancelled' && task.status !== 'cancelled') return false;
      // Search
      const query = searchQuery.toLowerCase();
      if (query && !task.title.toLowerCase().includes(query) && 
          !(task.description || '').toLowerCase().includes(query)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Sort
      if (sortBy === 'dateAsc') {
        return new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31');
      } else if (sortBy === 'dateDesc') {
        return new Date(b.dueDate || '1970-01-01') - new Date(a.dueDate || '1970-01-01');
      } else if (sortBy === 'priority') {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return 0; // Default unordered
    });

  if (isLoading) {
    return <div className={styles.loading}>Loading tasks...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h2>Your Tasks</h2>
          <Button icon={PlusCircle} onClick={onAddTask}>Add Task</Button>
        </div>
        
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Input 
              icon={Search} 
              placeholder="Search tasks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className={styles.controls}>
            <div className={styles.filterTabs}>
              <button 
                className={`${styles.tab} ${filter === 'all' ? styles.activeTab : ''}`}
                onClick={() => handleFilterChange('all')}
              >All</button>
              <button 
                className={`${styles.tab} ${filter === 'pending' ? styles.activeTab : ''}`}
                onClick={() => handleFilterChange('pending')}
              >Pending</button>
              <button 
                className={`${styles.tab} ${filter === 'completed' ? styles.activeTab : ''}`}
                onClick={() => handleFilterChange('completed')}
              >Completed</button>
              <button 
                className={`${styles.tab} ${filter === 'skipped' ? styles.activeTab : ''}`}
                onClick={() => handleFilterChange('skipped')}
              >Skipped</button>
              <button 
                className={`${styles.tab} ${filter === 'cancelled' ? styles.activeTab : ''}`}
                onClick={() => handleFilterChange('cancelled')}
              >Cancelled</button>
            </div>
            
            <Input 
              type="select" 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.sortSelect}
            >
              <option value="dateAsc">Due Date (Earliest First)</option>
              <option value="dateDesc">Due Date (Latest First)</option>
              <option value="priority">Priority (High to Low)</option>
            </Input>
          </div>
        </div>
      </header>

      <div className={styles.list}>
        {processedTasks.length > 0 ? (
          processedTasks.map(task => (
            <TaskItem 
              key={task.id} 
              task={task} 
              onUpdateStatus={updateStatus}
              onEdit={onEditTask}
              onDelete={removeTask}
            />
          ))
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🎉</div>
            <h3>No tasks found</h3>
            <p>You're all caught up! Or adjust your filters to see more.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskList;
