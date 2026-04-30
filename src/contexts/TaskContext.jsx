/**
 * src/contexts/TaskContext.jsx
 * 
 * Provides global state management for Tasks.
 * This ensures any component can access or modify tasks without prop drilling.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as db from '../services/db';

const TaskContext = createContext();

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Sort State
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('dateAsc'); // 'dateAsc', 'dateDesc', 'priority'

  // Load initial tasks from DB
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        
        // 1. Try to pull latest from backend first
        try {
          const res = await fetch('http://localhost:5000/api/tasks');
          if (res.ok) {
            const serverTasks = await res.json();
            // Save all server tasks locally
            for (const t of serverTasks) {
              await db.saveTask(t);
            }
          }
        } catch (e) {
          console.log('Backend offline or unavailable, relying purely on local offline storage.');
        }

        // 2. Load from local IndexedDB
        const data = await db.getAllTasks();
        setTasks(data || []);
      } catch (err) {
        setError('Failed to load tasks from local storage.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const syncToBackend = useCallback(async () => {
    try {
      const allTasks = await db.getAllTasks();
      const pendingTasks = allTasks.filter(t => t.sync_status === 'pending_sync');
      
      if (pendingTasks.length === 0) return;

      const response = await fetch('http://localhost:5000/api/tasks/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: pendingTasks })
      });

      if (!response.ok) throw new Error('Sync failed');

      const data = await response.json();
      
      // Update local DB to mark them as synced
      if (data.syncedIds && data.syncedIds.length > 0) {
        let needsStateUpdate = false;
        
        for (const taskId of data.syncedIds) {
          const storedTask = await db.getTaskById(taskId);
          if (storedTask) {
             storedTask.sync_status = 'synced';
             await db.saveTask(storedTask);
             needsStateUpdate = true;
          }
        }
        
        // Refresh state cleanly if changes occurred
        if (needsStateUpdate) {
            const updatedFromDB = await db.getAllTasks();
            setTasks(updatedFromDB || []);
        }
      }
    } catch (err) {
      console.log('Background sync failed or backend offline', err);
    }
  }, []);

  // Listen for online events to trigger auto-sync
  useEffect(() => {
    window.addEventListener('online', syncToBackend);
    return () => window.removeEventListener('online', syncToBackend);
  }, [syncToBackend]);

  const addTask = async (taskData) => {
    try {
      const newTask = {
        ...taskData,
        id: crypto.randomUUID(), // Ensure UUID for each task
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sync_status: 'pending_sync', // Mark as needing backend sync
      };
      
      await db.saveTask(newTask);
      setTasks(prev => [...prev, newTask]);
      
      // Attempt background sync
      syncToBackend();
    } catch (err) {
      console.error('Failed to add task', err);
      throw err;
    }
  };

  const updateTask = async (id, updatedData) => {
    try {
      const existingTask = tasks.find(t => t.id === id);
      if (!existingTask) throw new Error('Task not found');
      
      const modifiedTask = {
        ...existingTask,
        ...updatedData,
        updatedAt: new Date().toISOString(),
        sync_status: 'pending_sync' // Mark as needing backend sync
      };
      
      await db.saveTask(modifiedTask);
      setTasks(prev => prev.map(t => t.id === id ? modifiedTask : t));
      
      // Attempt background sync
      syncToBackend();
    } catch (err) {
      console.error('Failed to update task', err);
      throw err;
    }
  };

  const removeTask = async (id) => {
    try {
      await db.deleteTaskById(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      
      // Send delete request to backend quietly
      fetch(`http://localhost:5000/api/tasks/${id}`, { method: 'DELETE' }).catch(e => console.log('Backend not available for delete', e));
    } catch (err) {
      console.error('Failed to delete task', err);
      throw err;
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const updatedTask = await db.updateTaskStatus(id, status);
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
      
      // Attempt background sync
      syncToBackend();
    } catch (err) {
      console.error('Failed to update task status', err);
      throw err;
    }
  };

  const importTasks = async (importedTasks) => {
    try {
      for (const t of importedTasks) {
        // Enforce pending_sync so it backs up to the server
        t.sync_status = 'pending_sync'; 
        await db.saveTask(t);
      }
      const data = await db.getAllTasks();
      setTasks(data || []);
      syncToBackend();
    } catch (err) {
      console.error('Failed to import tasks', err);
      throw err;
    }
  };

  const wipeAllTasks = async () => {
    try {
      for (const t of tasks) {
        await db.deleteTaskById(t.id);
        fetch(`http://localhost:5000/api/tasks/${t.id}`, { method: 'DELETE' }).catch(e => console.log('Backend not available for delete', e));
      }
      setTasks([]);
    } catch (err) {
      console.error('Failed to wipe tasks', err);
      throw err;
    }
  };

  const value = {
    tasks,
    isLoading,
    error,
    addTask,
    updateTask,
    removeTask,
    updateStatus,
    
    // UI State
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    
    // Data Management
    importTasks,
    wipeAllTasks
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};
