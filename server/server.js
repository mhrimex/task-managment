import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Create tables automatically on start if they don't exist
async function initDB() {
  try {
    const connection = await pool.getConnection();
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT DEFAULT NULL,
        status ENUM('pending', 'completed', 'skipped', 'cancelled') DEFAULT 'pending',
        priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
        due_date DATETIME DEFAULT NULL,
        requester_name VARCHAR(255) DEFAULT NULL,
        company_name VARCHAR(255) DEFAULT NULL,
        assigned_user VARCHAR(255) DEFAULT NULL,
        sync_status ENUM('synced', 'pending_sync') DEFAULT 'synced',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_due_date (due_date),
        INDEX idx_status (status)
      )
    `);
    
    // Add columns if they don't exist (for existing tables)
    try { await connection.query('ALTER TABLE tasks ADD COLUMN requester_name VARCHAR(255) DEFAULT NULL'); } catch (e) {}
    try { await connection.query('ALTER TABLE tasks ADD COLUMN company_name VARCHAR(255) DEFAULT NULL'); } catch (e) {}
    try { await connection.query('ALTER TABLE tasks ADD COLUMN assigned_user VARCHAR(255) DEFAULT NULL'); } catch (e) {}

    console.log('✅ Database tables verified/created successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
  }
}
initDB();

// ---------------- API ENDPOINTS ---------------- //

// GET: Fetch all tasks from MySQL (for initial load)
app.get('/api/tasks', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tasks');
    // Convert snake_case db columns to camelCase for the frontend
    const tasks = rows.map(row => ({
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
      sync_status: 'synced' // everything coming from DB is considered synced
    }));
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST: Batch Sync tasks (Upsert logic: Update if exists, Insert if new)
app.post('/api/tasks/sync', async (req, res) => {
  const { tasks } = req.body;
  
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.json({ message: 'No tasks to sync.' });
  }

  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    for (const task of tasks) {
      const { id, title, description, status, priority, dueDate, requesterName, companyName, assignedUser, createdAt, updatedAt } = task;
      
      // Formatting dates for MySQL
      const formattedDueDate = dueDate ? new Date(dueDate).toISOString().slice(0, 19).replace('T', ' ') : null;
      const formattedCreatedAt = createdAt ? new Date(createdAt).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');
      const formattedUpdatedAt = updatedAt ? new Date(updatedAt).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');

      await connection.query(`
        INSERT INTO tasks (id, title, description, status, priority, due_date, requester_name, company_name, assigned_user, created_at, updated_at, sync_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')
        ON DUPLICATE KEY UPDATE
          title = VALUES(title),
          description = VALUES(description),
          status = VALUES(status),
          priority = VALUES(priority),
          due_date = VALUES(due_date),
          requester_name = VALUES(requester_name),
          company_name = VALUES(company_name),
          assigned_user = VALUES(assigned_user),
          updated_at = VALUES(updated_at),
          sync_status = 'synced'
      `, [id, title, description || null, status, priority, formattedDueDate, requesterName || null, companyName || null, assignedUser || null, formattedCreatedAt, formattedUpdatedAt]);
    }

    await connection.commit();
    connection.release();
    
    // Return the IDs of tasks that successfully synced so frontend can mark them as synced
    const syncedIds = tasks.map(t => t.id);
    res.json({ message: 'Sync successful', syncedIds });
  } catch (error) {
    console.error('Error syncing tasks:', error);
    res.status(500).json({ error: 'Failed to sync tasks' });
  }
});

// DELETE: Delete a specific task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(\`🚀 Server running on http://localhost:\${PORT}\`);
});
