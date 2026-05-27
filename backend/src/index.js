import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import pool, { initDb } from './db.js';
import timer from './timer.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Configure CORS to allow any origin in development or configure specific origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

const PORT = process.env.PORT || 3000;

// Initialize Database and Timer Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Configure Socket.io Events
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  // Send initial state immediately
  socket.emit('timer-state', timer.getState());

  // Socket commands
  socket.on('start-timer', () => {
    timer.start();
  });

  socket.on('pause-timer', () => {
    timer.pause();
  });

  socket.on('reset-timer', () => {
    timer.reset();
  });

  socket.on('skip-timer', () => {
    timer.skip();
  });

  socket.on('select-task', (taskId) => {
    timer.selectTask(taskId);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// ==========================================
// HTTP API ROUTES
// ==========================================

// 1. TASKS CRUD
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY is_completed ASC, created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Server error fetching tasks' });
  }
});

app.post('/api/tasks', async (req, res) => {
  const { title, description, est_pomodoros } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO tasks (title, description, est_pomodoros) VALUES ($1, $2, $3) RETURNING *',
      [title, description || '', est_pomodoros || 1]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ error: 'Server error creating task' });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, is_completed, est_pomodoros, completed_pomodoros } = req.body;
  try {
    const result = await pool.query(
      `UPDATE tasks 
       SET title = COALESCE($1, title), 
           description = COALESCE($2, description), 
           is_completed = COALESCE($3, is_completed), 
           est_pomodoros = COALESCE($4, est_pomodoros), 
           completed_pomodoros = COALESCE($5, completed_pomodoros)
       WHERE id = $6 RETURNING *`,
      [title, description, is_completed, est_pomodoros, completed_pomodoros, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Server error updating task' });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    // If the deleted task is currently selected, unselect it
    if (timer.currentTaskId === parseInt(id)) {
      timer.selectTask(null);
    }
    res.json({ message: 'Task deleted successfully', task: result.rows[0] });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Server error deleting task' });
  }
});

// 2. SETTINGS
app.get('/api/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings WHERE id = 1');
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ error: 'Server error fetching settings' });
  }
});

app.put('/api/settings', async (req, res) => {
  const { work_duration, short_break, long_break, auto_start_breaks, auto_start_pomodoros } = req.body;
  try {
    const result = await pool.query(
      `UPDATE settings 
       SET work_duration = COALESCE($1, work_duration), 
           short_break = COALESCE($2, short_break), 
           long_break = COALESCE($3, long_break), 
           auto_start_breaks = COALESCE($4, auto_start_breaks), 
           auto_start_pomodoros = COALESCE($5, auto_start_pomodoros)
       WHERE id = 1 RETURNING *`,
      [work_duration, short_break, long_break, auto_start_breaks, auto_start_pomodoros]
    );

    // Refresh timer durations
    await timer.loadSettings();

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ error: 'Server error updating settings' });
  }
});

// 3. STATS / ANALYTICS
app.get('/api/stats', async (req, res) => {
  try {
    // Total Pomodoros completed (work)
    const totalPomodorosRes = await pool.query("SELECT COUNT(*) as count, COALESCE(SUM(duration_seconds), 0) as total_time FROM pomodoro_logs WHERE type = 'work'");
    const totalPomodoros = parseInt(totalPomodorosRes.rows[0].count);
    const totalFocusTime = parseInt(totalPomodorosRes.rows[0].total_time);

    // Total tasks completed
    const completedTasksRes = await pool.query('SELECT COUNT(*) as count FROM tasks WHERE is_completed = true');
    const completedTasks = parseInt(completedTasksRes.rows[0].count);

    // Total active tasks
    const activeTasksRes = await pool.query('SELECT COUNT(*) as count FROM tasks WHERE is_completed = false');
    const activeTasks = parseInt(activeTasksRes.rows[0].count);

    // Logs for the last 90 days to cover our 12-week grid (grouped by date)
    const dailyStatsRes = await pool.query(`
      SELECT 
        TO_CHAR(completed_at, 'YYYY-MM-DD') as date, 
        COUNT(*) as count 
      FROM pomodoro_logs 
      WHERE type = 'work' 
        AND completed_at >= CURRENT_DATE - INTERVAL '90 days' 
      GROUP BY TO_CHAR(completed_at, 'YYYY-MM-DD') 
      ORDER BY date ASC
    `);

    // Let's create an array of 5 full weeks (35 days, approx 1 month) ending on the current week's Sunday
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - distanceToMonday);
    
    // Start date is 4 weeks before this Monday
    const startDate = new Date(startOfWeek);
    startDate.setDate(startOfWeek.getDate() - 28); // 4 weeks * 7 days = 28 days
    
    const dailyStats = [];
    for (let i = 0; i < 35; i++) { // 5 weeks = 35 days
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      
      // Get YYYY-MM-DD format in local timezone
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dayVal = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${dayVal}`;
      
      const match = dailyStatsRes.rows.find(row => row.date === dateStr);
      
      // Check if the date is in the future compared to today (resetting hours to compare just dates)
      const dCopy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const todayCopy = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const isFuture = dCopy > todayCopy;

      dailyStats.push({
        date: dateStr,
        count: match ? parseInt(match.count) : 0,
        isFuture
      });
    }

    res.json({
      totalPomodoros,
      totalFocusTime,
      completedTasks,
      activeTasks,
      dailyStats
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Server error fetching stats' });
  }
});

// Start server
async function startServer() {
  try {
    await initDb();
    timer.init(io);
    httpServer.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize database, server not starting', err);
    process.exit(1);
  }
}

startServer();
