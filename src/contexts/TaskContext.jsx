/**
 * src/contexts/TaskContext.jsx
 * 
 * Provides global state management for Tasks.
 * This ensures any component can access or modify tasks without prop drilling.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as db from '../services/db';
import { supabase } from '../services/supabase';

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
  const [sortBy, setSortBy] = useState('createdDesc'); // newest tasks first by default

  // Load initial tasks from DB
  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // 1. Try to pull latest from backend first (Supabase)
      try {
        const { data: serverTasks, error: fetchError } = await supabase.from('tasks').select('*');
        
        if (!fetchError && serverTasks) {
          // Map snake_case to camelCase
          const formattedTasks = serverTasks.map(row => ({
            id: row.id,
            title: row.title,
            description: row.description,
            status: row.status,
            priority: row.priority,
            dueDate: row.due_date ? new Date(row.due_date).toISOString().split('T')[0] : null,
            requesterName: row.requester_name || null,
            companyName: row.company_name || null,
            assignedUser: row.assigned_user || null,
            createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
            updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
            sync_status: 'synced'
          }));
          
          // Get current local tasks to find if we need to delete any locally
          const localTasks = await db.getAllTasks();
          const serverIds = new Set(formattedTasks.map(t => t.id));
          
          // Delete local tasks that don't exist on the server anymore (unless they are pending upload)
          for (const localTask of localTasks) {
            if (!serverIds.has(localTask.id) && localTask.sync_status === 'synced') {
              await db.deleteTaskById(localTask.id);
            }
          }

          // Save all server tasks locally in a single batch
          if (formattedTasks && formattedTasks.length > 0) {
            await db.saveTasks(formattedTasks);
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
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const syncToBackend = useCallback(async () => {
    try {
      const allTasks = await db.getAllTasks();
      const pendingTasks = allTasks.filter(t => t.sync_status === 'pending_sync');
      
      if (pendingTasks.length > 0) {
        // Convert to snake_case for Supabase
        const tasksToUpload = pendingTasks.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description || null,
          status: t.status,
          priority: t.priority,
          due_date: t.dueDate ? new Date(t.dueDate).toISOString() : null,
          requester_name: t.requesterName || null,
          company_name: t.companyName || null,
          assigned_user: t.assignedUser || null,
          sync_status: 'synced',
          created_at: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
          updated_at: t.updatedAt ? new Date(t.updatedAt).toISOString() : new Date().toISOString(),
        }));

        const { data, error } = await supabase.from('tasks').upsert(tasksToUpload, { onConflict: 'id' }).select('id');

        if (error) {
           console.error("Upload error", error);
        } else if (data && data.length > 0) {
          // Update local DB to mark them as synced
          const tasksToUpdate = [];
          for (const row of data) {
            const storedTask = await db.getTaskById(row.id);
            if (storedTask) {
               storedTask.sync_status = 'synced';
               tasksToUpdate.push(storedTask);
            }
          }
          if (tasksToUpdate.length > 0) {
            await db.saveTasks(tasksToUpdate);
          }
        }
      }
      
      // Finally, pull latest changes from server to ensure we are fully in sync
      await fetchTasks();
      
    } catch (err) {
      console.log('Background sync failed or backend offline', err);
    }
  }, [fetchTasks]);

  // Listen for online events to trigger auto-sync
  useEffect(() => {
    window.addEventListener('online', syncToBackend);
    return () => window.removeEventListener('online', syncToBackend);
  }, [syncToBackend]);

  const manualSync = async () => {
    setIsLoading(true);
    await syncToBackend();
    setIsLoading(false);
  };

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
      // 1. Delete locally first for instant UI feedback
      await db.deleteTaskById(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      
      // 2. Delete from Supabase
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) {
         console.error('Backend delete failed:', error);
         // If delete fails (e.g. offline), we'd technically want to queue a delete.
         // But for a simple app, deleting locally is usually enough as manual sync will clean it up.
      }
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
      if (importedTasks && importedTasks.length > 0) {
        const tasksToSave = importedTasks.map(t => ({ ...t, sync_status: 'pending_sync' }));
        await db.saveTasks(tasksToSave);
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
        supabase.from('tasks').delete().eq('id', t.id).then(({error}) => {
          if (error) console.log('Backend not available for delete', error);
        });
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
    manualSync, // Expose manual sync for a button
    
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
