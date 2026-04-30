/**
 * src/services/db.js
 * 
 * This service handles all IndexedDB operations using the 'idb' library.
 * It provides an abstraction layer over IndexedDB for CRUD operations
 * on tasks and settings. 
 */
import { openDB } from 'idb';

const DB_NAME = 'DailyTaskAppDB';
const DB_VERSION = 1;

// Define store names to avoid typos
const STORES = {
  TASKS: 'tasks',
  SETTINGS: 'settings', // Can be used for persisting theme or view preferences
};

/**
 * Initialize the database.
 * The `upgrade` function runs only if the DB doesn't exist or is an older version.
 */
const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create 'tasks' store if it doesn't exist
      if (!db.objectStoreNames.contains(STORES.TASKS)) {
        // keyPath acts as the primary key for the store
        const taskStore = db.createObjectStore(STORES.TASKS, { keyPath: 'id' });
        
        // Create indexes to allow fast querying/sorting by specific fields
        taskStore.createIndex('dueDate', 'dueDate');
        taskStore.createIndex('status', 'status'); // e.g., 'pending' or 'completed'
        taskStore.createIndex('priority', 'priority');
      }
      
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS);
      }
    },
  });
};

/* --- DB Operations API --- */

/**
 * Add a new task or update an existing one (upsert).
 * @param {Object} task The task object to save
 * @returns {Promise<string>} The ID of the saved task
 */
export const saveTask = async (task) => {
  const db = await initDB();
  return db.put(STORES.TASKS, task);
};

/**
 * Retrieve all tasks from the DB.
 * @returns {Promise<Array>} List of all tasks
 */
export const getAllTasks = async () => {
  const db = await initDB();
  return db.getAll(STORES.TASKS);
};

/**
 * Retrieve a specific task by its ID.
 * @param {string} id The task ID
 * @returns {Promise<Object>} The task object
 */
export const getTaskById = async (id) => {
  const db = await initDB();
  return db.get(STORES.TASKS, id);
};

/**
 * Delete a specific task by its ID.
 * @param {string} id The task ID
 * @returns {Promise<void>}
 */
export const deleteTaskById = async (id) => {
  const db = await initDB();
  return db.delete(STORES.TASKS, id);
};

/**
 * Update task status.
 * @param {string} id The task ID
 * @param {string} status 'pending', 'completed', 'skipped', 'cancelled'
 * @returns {Promise<Object>} The updated task
 */
export const updateTaskStatus = async (id, status) => {
  const db = await initDB();
  const tx = db.transaction(STORES.TASKS, 'readwrite');
  const store = tx.objectStore(STORES.TASKS);
  
  const task = await store.get(id);
  if (!task) throw new Error('Task not found');
  
  task.status = status;
  task.updatedAt = new Date().toISOString();
  task.sync_status = 'pending_sync';
  
  await store.put(task);
  await tx.done; // Ensure transaction completes
  
  return task;
};
