<script setup>
import { onMounted, watch } from 'vue';
import { store } from './store';
import Timer from './components/Timer.vue';
import TaskList from './components/TaskList.vue';
import Stats from './components/Stats.vue';
import Settings from './components/Settings.vue';
import { Timer as TimerIcon, CheckSquare, BarChart3, Settings2, Wifi, WifiOff } from 'lucide-vue-next';

onMounted(() => {
  store.init();
});

// Update the root document class to apply the current theme's CSS variables
watch(
  () => store.timerState.type,
  (newType) => {
    const root = document.documentElement;
    root.className = ''; // Reset classes
    if (newType) {
      root.classList.add(`theme-${newType}`);
    } else {
      root.classList.add('theme-work');
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="min-h-screen bg-gradient-to-tr from-bg-gradient-start to-bg-gradient-end text-slate-100 font-sans transition-all duration-500 relative overflow-hidden flex flex-col justify-between">
    <!-- Background grid lines/decoration -->
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))] pointer-events-none"></div>
    <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)] pointer-events-none opacity-30"></div>

    <!-- Header Navigation -->
    <header class="w-full max-w-xl mx-auto px-4 pt-6 pb-2 z-10">
      <div class="flex items-center justify-between glass-card px-5 py-3.5 rounded-2xl border-slate-800/80 shadow-lg">
        <!-- Logo -->
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary transition-colors duration-500 shadow-inner">
            <span class="text-base font-extrabold">🍅</span>
          </div>
          <span class="text-sm font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">TomatoFlow</span>
        </div>

        <!-- Navigation Tabs -->
        <nav class="flex items-center space-x-1">
          <button 
            @click="store.activeTab = 'timer'"
            class="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 focus:outline-none cursor-pointer"
            :class="store.activeTab === 'timer' 
              ? 'bg-primary text-slate-950 font-bold shadow-md shadow-primary/10' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'"
          >
            <TimerIcon class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Timer</span>
          </button>

          <button 
            @click="store.activeTab = 'tasks'"
            class="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 focus:outline-none cursor-pointer"
            :class="store.activeTab === 'tasks' 
              ? 'bg-primary text-slate-950 font-bold shadow-md shadow-primary/10' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'"
          >
            <CheckSquare class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Tasks</span>
          </button>

          <button 
            @click="store.activeTab = 'stats'"
            class="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 focus:outline-none cursor-pointer"
            :class="store.activeTab === 'stats' 
              ? 'bg-primary text-slate-950 font-bold shadow-md shadow-primary/10' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'"
          >
            <BarChart3 class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Stats</span>
          </button>

          <button 
            @click="store.activeTab = 'settings'"
            class="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 focus:outline-none cursor-pointer"
            :class="store.activeTab === 'settings' 
              ? 'bg-primary text-slate-950 font-bold shadow-md shadow-primary/10' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'"
          >
            <Settings2 class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Settings</span>
          </button>
        </nav>
      </div>
    </header>

    <!-- Main Content Container -->
    <main class="w-full max-w-xl mx-auto px-4 py-6 flex-1 flex flex-col justify-center z-10">
      <!-- Route Views based on Active Tab -->
      <transition 
        name="fade" 
        mode="out-in"
      >
        <div :key="store.activeTab" class="w-full">
          <Timer v-if="store.activeTab === 'timer'" />
          <TaskList v-else-if="store.activeTab === 'tasks'" />
          <Stats v-else-if="store.activeTab === 'stats'" />
          <Settings v-else-if="store.activeTab === 'settings'" />
        </div>
      </transition>
    </main>

    <!-- Footer / Status Bar -->
    <footer class="w-full max-w-xl mx-auto px-4 pb-6 pt-2 z-10">
      <div class="flex justify-between items-center text-[10px] text-slate-500 font-semibold tracking-wider uppercase bg-slate-950/20 px-4 py-2.5 rounded-xl border border-slate-900/40">
        <div>TomatoFlow v1.0.0</div>
        
        <!-- Connection Status -->
        <div class="flex items-center space-x-1.5">
          <span 
            class="w-1.5 h-1.5 rounded-full"
            :class="store.socketConnected ? 'bg-emerald-500 shadow-md shadow-emerald-500/50 animate-pulse' : 'bg-rose-500 shadow-md shadow-rose-500/50'"
          ></span>
          <span :class="store.socketConnected ? 'text-slate-400' : 'text-rose-400'">
            {{ store.socketConnected ? 'Connected' : 'Disconnected' }}
          </span>
        </div>
      </div>
    </footer>
  </div>
</template>

<style>
/* View transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
