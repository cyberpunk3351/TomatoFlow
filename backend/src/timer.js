import pool from './db.js';

class PomodoroTimer {
  constructor() {
    this.status = 'idle'; // 'idle', 'running', 'paused'
    this.type = 'work'; // 'work', 'short_break', 'long_break'
    this.timeRemaining = 1500; // default 25 mins
    this.duration = 1500;
    this.currentTaskId = null;
    this.completedCycles = 0;
    this.intervalId = null;
    this.io = null; // Socket.io server instance
  }

  init(io) {
    this.io = io;
    this.loadSettings();
  }

  // Load duration settings from database
  async loadSettings() {
    try {
      const res = await pool.query('SELECT * FROM settings WHERE id = 1');
      if (res.rows.length > 0) {
        const settings = res.rows[0];
        if (this.status === 'idle') {
          this.setDurationByPhase(settings);
        }
      }
    } catch (err) {
      console.error('Error loading settings for timer:', err);
    }
  }

  setDurationByPhase(settings) {
    if (this.type === 'work') {
      this.duration = settings.work_duration;
    } else if (this.type === 'short_break') {
      this.duration = settings.short_break;
    } else if (this.type === 'long_break') {
      this.duration = settings.long_break;
    }
    this.timeRemaining = this.duration;
  }

  getState() {
    return {
      status: this.status,
      type: this.type,
      timeRemaining: this.timeRemaining,
      duration: this.duration,
      currentTaskId: this.currentTaskId,
      completedCycles: this.completedCycles
    };
  }

  broadcastState() {
    if (this.io) {
      this.io.emit('timer-state', this.getState());
    }
  }

  async start() {
    if (this.status === 'running') return;

    this.status = 'running';
    this.broadcastState();

    this.intervalId = setInterval(async () => {
      this.timeRemaining--;

      if (this.timeRemaining <= 0) {
        await this.handleIntervalComplete();
      } else {
        this.broadcastState();
      }
    }, 1000);
  }

  pause() {
    if (this.status !== 'running') return;

    this.status = 'paused';
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.broadcastState();
  }

  async reset() {
    this.pause();
    this.status = 'idle';
    
    // Reload settings to reset to correct duration
    try {
      const res = await pool.query('SELECT * FROM settings WHERE id = 1');
      if (res.rows.length > 0) {
        this.setDurationByPhase(res.rows[0]);
      }
    } catch (err) {
      console.error('Error reloading settings on reset:', err);
    }
    this.broadcastState();
  }

  async skip() {
    this.pause();
    await this.transitionToNextPhase(false); // transition without saving as completed
  }

  async selectTask(taskId) {
    this.currentTaskId = taskId;
    this.broadcastState();
  }

  async handleIntervalComplete() {
    this.pause();

    const completedType = this.type;
    const completedTaskId = this.currentTaskId;
    const completedDuration = this.duration;

    console.log(`Timer phase completed: ${completedType} (${completedDuration}s)`);

    try {
      // 1. Log the completed session in db
      await pool.query(
        'INSERT INTO pomodoro_logs (task_id, duration_seconds, type) VALUES ($1, $2, $3)',
        [completedTaskId, completedDuration, completedType]
      );

      // 2. If it was a work session and task is active, increment completed_pomodoros
      if (completedType === 'work') {
        this.completedCycles++;
        if (completedTaskId) {
          await pool.query(
            'UPDATE tasks SET completed_pomodoros = completed_pomodoros + 1 WHERE id = $1',
            [completedTaskId]
          );
        }
      }
    } catch (err) {
      console.error('Error saving completed session:', err);
    }

    // Emit event to play sound on client
    if (this.io) {
      this.io.emit('timer-completed', {
        type: completedType,
        taskId: completedTaskId,
        duration: completedDuration
      });
    }

    // 3. Move to the next phase
    await this.transitionToNextPhase(true);
  }

  async transitionToNextPhase(autoStartCheck = true) {
    try {
      // Fetch fresh settings
      const res = await pool.query('SELECT * FROM settings WHERE id = 1');
      if (res.rows.length === 0) return;
      const settings = res.rows[0];

      // Determine next phase
      if (this.type === 'work') {
        // If completed 4 work sessions, trigger long break, otherwise short break
        if (this.completedCycles > 0 && this.completedCycles % 4 === 0) {
          this.type = 'long_break';
        } else {
          this.type = 'short_break';
        }
      } else {
        // Break ended, back to work
        this.type = 'work';
      }

      this.status = 'idle';
      this.setDurationByPhase(settings);

      // Auto start checks
      let shouldAutoStart = false;
      if (this.type === 'work' && settings.auto_start_pomodoros) {
        shouldAutoStart = true;
      } else if ((this.type === 'short_break' || this.type === 'long_break') && settings.auto_start_breaks) {
        shouldAutoStart = true;
      }

      if (autoStartCheck && shouldAutoStart) {
        this.start();
      } else {
        this.broadcastState();
      }
    } catch (err) {
      console.error('Error in transitionToNextPhase:', err);
      this.broadcastState();
    }
  }
}

const timerInstance = new PomodoroTimer();
export default timerInstance;
