import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://pomodoro:pomodoro_password@db:5432/pomodoro_db'
});

export async function initDb() {
  const client = await pool.connect();
  try {
    console.log('Connecting to PostgreSQL database and initializing tables...');
    
    // Create tasks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        is_completed BOOLEAN DEFAULT FALSE,
        est_pomodoros INTEGER DEFAULT 1,
        completed_pomodoros INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create pomodoro_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS pomodoro_logs (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
        duration_seconds INTEGER NOT NULL,
        type VARCHAR(50) NOT NULL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        work_duration INTEGER DEFAULT 1500, -- 25 min in seconds
        short_break INTEGER DEFAULT 300,    -- 5 min in seconds
        long_break INTEGER DEFAULT 900,     -- 15 min in seconds
        auto_start_breaks BOOLEAN DEFAULT FALSE,
        auto_start_pomodoros BOOLEAN DEFAULT FALSE
      );
    `);

    // Insert default settings if not exists
    const settingsCheck = await client.query('SELECT * FROM settings WHERE id = 1');
    if (settingsCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO settings (id, work_duration, short_break, long_break, auto_start_breaks, auto_start_pomodoros)
        VALUES (1, 1500, 300, 900, FALSE, FALSE)
      `);
      console.log('Inserted default settings.');
    }

    console.log('Database tables initialized successfully.');
  } catch (error) {
    console.error('Error initializing database tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

export default pool;
