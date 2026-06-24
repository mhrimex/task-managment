import express from 'express';
import cors from 'cors';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Database connection pool for Postgres/Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET: Fetch all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM tasks');
    // Convert db columns to camelCase for the frontend
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
      sync_status: 'synced'
    }));
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST: Batch Sync tasks
app.post('/api/tasks/sync', async (req, res) => {
  const { tasks } = req.body;
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.json({ message: 'No tasks to sync.' });
  }

  try {
    for (const task of tasks) {
      const { id, title, description, status, priority, dueDate, requesterName, companyName, assignedUser } = task;
      
      const formattedDueDate = dueDate ? new Date(dueDate).toISOString() : null;

      // PostgreSQL uses standard INSERT ... ON CONFLICT syntax
      await pool.query(`
        INSERT INTO tasks (id, title, description, status, priority, due_date, requester_name, company_name, assigned_user, sync_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'synced')
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          status = EXCLUDED.status,
          priority = EXCLUDED.priority,
          due_date = EXCLUDED.due_date,
          requester_name = EXCLUDED.requester_name,
          company_name = EXCLUDED.company_name,
          assigned_user = EXCLUDED.assigned_user,
          sync_status = 'synced'
      `, [id, title, description || null, status, priority, formattedDueDate, requesterName || null, companyName || null, assignedUser || null]);
    }

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
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// POST: Update a user's password (Admin only - requires direct DB access via pgcrypto)
app.post('/api/users/update-password', async (req, res) => {
  const { userId, newPassword } = req.body;

  if (!userId || !newPassword) {
    return res.status(400).json({ error: 'userId and newPassword are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  try {
    // Ensure pgcrypto is available
    await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

    // Update the hashed password in auth.users using bcrypt
    const result = await pool.query(
      `UPDATE auth.users 
       SET encrypted_password = crypt($1, gen_salt('bf', 10)),
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, email`,
      [newPassword, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found in auth system.' });
    }

    console.log(`Password updated for user: ${result.rows[0].email}`);
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Failed to update password: ' + error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
