import { reactive } from 'vue';
import { io } from 'socket.io-client';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const api = axios.create({ baseURL: API_URL });

export const store = reactive({
  // State variables
  activeTab: 'timer',
  socketConnected: false,
  timerState: {
    status: 'idle',
    type: 'work',
    timeRemaining: 1500,
    duration: 1500,
    currentTaskId: null,
    completedCycles: 0
  },
  tasks: [],
  settings: {
    work_duration: 1500,
    short_break: 300,
    long_break: 900,
    auto_start_breaks: false,
    auto_start_pomodoros: false
  },
  stats: {
    totalPomodoros: 0,
    totalFocusTime: 0,
    completedTasks: 0,
    activeTasks: 0,
    dailyStats: []
  },

  // Socket reference
  socket: null,

  // Initialize all connections
  async init() {
    this.connectSocket();
    await this.fetchSettings();
    await this.fetchTasks();
    await this.fetchStats();
  },

  // Connect to backend WebSockets
  connectSocket() {
    this.socket = io(API_URL);

    this.socket.on('connect', () => {
      this.socketConnected = true;
      console.log('Connected to WebSocket server');
    });

    this.socket.on('disconnect', () => {
      this.socketConnected = false;
      console.log('Disconnected from WebSocket server');
    });

    this.socket.on('timer-state', (state) => {
      this.timerState = state;
      this.updateBrowserTitle();
    });

    this.socket.on('timer-completed', (data) => {
      console.log('Timer phase completed:', data.type);
      this.playChime(data.type);
      
      // Refresh tasks and stats after completion
      this.fetchTasks();
      this.fetchStats();
    });
  },

  // Socket Actions
  startTimer() {
    if (this.socket) this.socket.emit('start-timer');
  },

  pauseTimer() {
    if (this.socket) this.socket.emit('pause-timer');
  },

  resetTimer() {
    if (this.socket) this.socket.emit('reset-timer');
  },

  skipTimer() {
    if (this.socket) this.socket.emit('skip-timer');
  },

  selectTask(taskId) {
    if (this.socket) this.socket.emit('select-task', taskId);
  },

  // HTTP API Actions: Tasks
  async fetchTasks() {
    try {
      const res = await api.get('/api/tasks');
      this.tasks = res.data;
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  },

  async createTask(title, description, estPomodoros) {
    try {
      const res = await api.post('/api/tasks', {
        title,
        description,
        est_pomodoros: estPomodoros
      });
      this.tasks.unshift(res.data);
      this.fetchStats(); // Update counters
    } catch (err) {
      console.error('Error creating task:', err);
    }
  },

  async updateTask(id, payload) {
    try {
      const res = await api.put(`/api/tasks/${id}`, payload);
      const index = this.tasks.findIndex(t => t.id === id);
      if (index !== -1) {
        this.tasks[index] = res.data;
      }
      this.fetchStats();
    } catch (err) {
      console.error('Error updating task:', err);
    }
  },

  async deleteTask(id) {
    try {
      await api.delete(`/api/tasks/${id}`);
      this.tasks = this.tasks.filter(t => t.id !== id);
      if (this.timerState.currentTaskId === id) {
        this.timerState.currentTaskId = null;
      }
      this.fetchStats();
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  },

  // HTTP API Actions: Settings
  async fetchSettings() {
    try {
      const res = await api.get('/api/settings');
      this.settings = res.data;
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  },

  async updateSettings(payload) {
    try {
      const res = await api.put('/api/settings', payload);
      this.settings = res.data;
      this.fetchStats();
    } catch (err) {
      console.error('Error updating settings:', err);
    }
  },

  // HTTP API Actions: Stats
  async fetchStats() {
    try {
      const res = await api.get('/api/stats');
      this.stats = res.data;
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  },

  // Helper: Format Time Remaining
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  // Helper: Update Title bar dynamically
  updateBrowserTitle() {
    const formatted = this.formatTime(this.timerState.timeRemaining);
    let label = 'TomatoFlow';
    if (this.timerState.type === 'work') {
      label = `Focus (${formatted})`;
    } else if (this.timerState.type === 'short_break') {
      label = `Break (${formatted})`;
    } else if (this.timerState.type === 'long_break') {
      label = `Long Break (${formatted})`;
    }
    document.title = label;
  },

  // Synthesize Sound via Web Audio API
  playChime(type) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      
      if (type === 'work') {
        // Focus complete: positive upward chime (C5 -> E5 -> G5 -> C6)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
          gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.12);
          gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + idx * 0.12 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.3);
          osc.start(ctx.currentTime + idx * 0.12);
          osc.stop(ctx.currentTime + idx * 0.12 + 0.35);
        });
      } else {
        // Break complete: warm wake up alert (E5 -> C5 -> E5 -> G5)
        const notes = [659.25, 523.25, 659.25, 783.99];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
          gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.12);
          gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + idx * 0.12 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.25);
          osc.start(ctx.currentTime + idx * 0.12);
          osc.stop(ctx.currentTime + idx * 0.12 + 0.3);
        });
      }
    } catch (err) {
      console.warn('Failed to play audio alert:', err);
    }
  }
});
