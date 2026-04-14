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

  const addTask = async (taskData) => {
    try {
      const newTask = {
        ...taskData,
        id: crypto.randomUUID(), // Ensure UUID for each task
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await db.saveTask(newTask);
      setTasks(prev => [...prev, newTask]);
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
        updatedAt: new Date().toISOString()
      };
      
      await db.saveTask(modifiedTask);
      setTasks(prev => prev.map(t => t.id === id ? modifiedTask : t));
    } catch (err) {
      console.error('Failed to update task', err);
      throw err;
    }
  };

  const removeTask = async (id) => {
    try {
      await db.deleteTaskById(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Failed to delete task', err);
      throw err;
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const updatedTask = await db.updateTaskStatus(id, status);
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
    } catch (err) {
      console.error('Failed to update task status', err);
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
    setSortBy
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};
