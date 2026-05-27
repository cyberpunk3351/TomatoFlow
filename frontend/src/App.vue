<script setup>
import { onMounted, watch, ref } from 'vue';
import { store } from './store';
import Timer from './components/Timer.vue';
import TaskList from './components/TaskList.vue';
import Stats from './components/Stats.vue';
import Settings from './components/Settings.vue';
import { Timer as TimerIcon, CheckSquare, BarChart3, Settings2 } from 'lucide-vue-next';

const serverUrlInput = ref('');

const saveServerUrl = () => {
  if (serverUrlInput.value) {
    store.saveServerUrl(serverUrlInput.value);
  }
};

onMounted(() => {
  store.init();
  // Pre-fill input if there's a current API URL
  if (store.currentApiUrl) {
    serverUrlInput.value = store.currentApiUrl;
  }
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

    <!-- Server URL Config Overlay (Tauri Desktop only) -->
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="store.needsServerUrl" class="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
        <div class="glass-card rounded-3xl p-8 max-w-sm w-full border-slate-800 shadow-2xl space-y-6 text-center">
          <div class="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto animate-bounce">
            <span class="text-3xl">🍅</span>
          </div>
          <div>
            <h2 class="text-xl font-extrabold text-slate-100 tracking-tight">Connect to TomatoFlow</h2>
            <p class="text-xs text-slate-400 mt-1.5">Enter your self-hosted backend server URL to synchronize your data.</p>
          </div>
          
          <form @submit.prevent="saveServerUrl" class="space-y-4 text-left">
            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Server API URL</label>
              <input 
                v-model="serverUrlInput" 
                type="url" 
                placeholder="http://192.168.1.50:3000" 
                required
                class="w-full bg-slate-900 border border-slate-800 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 text-slate-100 px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all duration-200"
              />
            </div>
            <button 
              type="submit" 
              class="w-full bg-primary hover:bg-primary-dark text-slate-950 font-bold py-3 rounded-xl text-xs transition-all duration-200 cursor-pointer shadow-lg shadow-primary/10"
            >
              Connect Server
            </button>
          </form>
        </div>
      </div>
    </transition>

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
