<script setup>
import { computed } from 'vue';
import { store } from '../store';
import { Play, Pause, RotateCcw, SkipForward, Flame, Coffee, Trophy } from 'lucide-vue-next';

// Calculate SVG circle progress offset
const radius = 130;
const circumference = 2 * Math.PI * radius;
const strokeDashoffset = computed(() => {
  const timeRemaining = store.timerState.timeRemaining;
  const duration = store.timerState.duration;
  const ratio = duration > 0 ? timeRemaining / duration : 0;
  return circumference * (1 - ratio);
});

const progressPercent = computed(() => {
  const timeRemaining = store.timerState.timeRemaining;
  const duration = store.timerState.duration;
  return duration > 0 ? Math.round(((duration - timeRemaining) / duration) * 100) : 0;
});

const currentTask = computed(() => {
  return store.tasks.find(t => t.id === store.timerState.currentTaskId);
});

const timerLabel = computed(() => {
  switch (store.timerState.type) {
    case 'work': return 'Focus Session';
    case 'short_break': return 'Short Break';
    case 'long_break': return 'Long Break';
    default: return 'Focus Session';
  }
});
</script>

<template>
  <div class="flex flex-col items-center justify-center space-y-8 py-4">
    <!-- Timer Display Card -->
    <div class="relative w-80 h-80 flex items-center justify-center">
      <!-- Glow effect behind progress circle -->
      <div 
        class="absolute inset-0 rounded-full blur-2xl opacity-15 scale-95 transition-colors duration-500"
        :class="{
          'bg-rose-500': store.timerState.type === 'work',
          'bg-emerald-500': store.timerState.type === 'short_break',
          'bg-blue-500': store.timerState.type === 'long_break'
        }"
      ></div>

      <!-- SVG Progress Ring -->
      <svg class="w-full h-full transform -rotate-90" viewBox="0 0 300 300">
        <!-- Track Circle -->
        <circle 
          cx="150" 
          cy="150" 
          :r="radius" 
          class="stroke-slate-800 fill-transparent"
          stroke-width="8"
        />
        <!-- Progress Circle -->
        <circle 
          cx="150" 
          cy="150" 
          :r="radius" 
          class="stroke-primary fill-transparent transition-all duration-300 ease-linear"
          stroke-width="10"
          stroke-linecap="round"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="strokeDashoffset"
        />
      </svg>

      <!-- Center content -->
      <div class="absolute flex flex-col items-center text-center">
        <!-- Phase Icon -->
        <div class="mb-2 text-primary transition-colors duration-500">
          <Flame v-if="store.timerState.type === 'work'" class="w-8 h-8" />
          <Coffee v-else class="w-8 h-8" />
        </div>
        
        <!-- Timer Countdown -->
        <span class="text-5xl font-extrabold tracking-tight font-sans text-slate-100 tabular-nums">
          {{ store.formatTime(store.timerState.timeRemaining) }}
        </span>

        <!-- Phase Info -->
        <span class="text-xs uppercase tracking-widest font-semibold mt-2 text-slate-400">
          {{ timerLabel }}
        </span>
        
        <!-- Cycle Info -->
        <div class="flex items-center space-x-1 mt-3 bg-slate-800/60 px-2 py-0.5 rounded-full text-[10px] text-slate-300 font-medium">
          <Trophy class="w-3.5 h-3.5 text-yellow-500" />
          <span>Cycles: {{ store.timerState.completedCycles }}</span>
        </div>
      </div>
    </div>

    <!-- Active Task Message -->
    <div class="max-w-md w-full text-center">
      <div v-if="currentTask" class="bg-primary/10 border border-primary/20 rounded-2xl p-4 transition-all duration-300">
        <span class="text-xs font-semibold text-primary uppercase tracking-wide">Focusing on</span>
        <h3 class="text-lg font-bold text-slate-100 mt-1 truncate">{{ currentTask.title }}</h3>
        <p v-if="currentTask.description" class="text-xs text-slate-400 mt-1 line-clamp-1">{{ currentTask.description }}</p>
        <div class="flex justify-center items-center space-x-1.5 mt-2.5 text-xs text-slate-300">
          <span>Progress:</span>
          <span class="font-semibold text-primary">{{ currentTask.completed_pomodoros }}</span>
          <span>/</span>
          <span>{{ currentTask.est_pomodoros }}🍅</span>
        </div>
      </div>
      <div v-else class="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 text-slate-400 text-sm">
        No active task selected. Go to <button @click="store.activeTab = 'tasks'" class="text-primary hover:underline font-semibold focus:outline-none">Tasks</button> to select one.
      </div>
    </div>

    <!-- Control Buttons -->
    <div class="flex items-center space-x-6">
      <!-- Reset button -->
      <button 
        @click="store.resetTimer"
        class="p-4 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
        title="Reset Timer"
      >
        <RotateCcw class="w-5 h-5" />
      </button>

      <!-- Play/Pause button -->
      <button 
        @click="store.timerState.status === 'running' ? store.pauseTimer() : store.startTimer()"
        class="p-6 rounded-full bg-primary text-slate-950 font-bold transition-all duration-300 hover:scale-110 active:scale-95 shadow-xl hover:shadow-primary/20 cursor-pointer"
        :title="store.timerState.status === 'running' ? 'Pause' : 'Start'"
      >
        <Pause v-if="store.timerState.status === 'running'" class="w-8 h-8 fill-slate-950" />
        <Play v-else class="w-8 h-8 fill-slate-950" />
      </button>

      <!-- Skip button -->
      <button 
        @click="store.skipTimer"
        class="p-4 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
        title="Skip Phase"
      >
        <SkipForward class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>
