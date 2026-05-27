<script setup>
import { ref, onMounted } from 'vue';
import { store } from '../store';
import { Save, Settings2, Sliders, Play, Volume2 } from 'lucide-vue-next';

const workMins = ref(25);
const shortMins = ref(5);
const longMins = ref(15);
const autoStartBreaks = ref(false);
const autoStartPomodoros = ref(false);
const showSavedAlert = ref(false);

onMounted(async () => {
  await store.fetchSettings();
  workMins.value = Math.round(store.settings.work_duration / 60);
  shortMins.value = Math.round(store.settings.short_break / 60);
  longMins.value = Math.round(store.settings.long_break / 60);
  autoStartBreaks.value = store.settings.auto_start_breaks;
  autoStartPomodoros.value = store.settings.auto_start_pomodoros;
});

const saveSettings = async () => {
  await store.updateSettings({
    work_duration: workMins.value * 60,
    short_break: shortMins.value * 60,
    long_break: longMins.value * 60,
    auto_start_breaks: autoStartBreaks.value,
    auto_start_pomodoros: autoStartPomodoros.value
  });
  
  showSavedAlert.value = true;
  setTimeout(() => {
    showSavedAlert.value = false;
  }, 3000);
};

const testSound = () => {
  store.playChime('work');
};
</script>

<template>
  <div class="space-y-6 max-w-xl mx-auto py-2">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-extrabold text-slate-100 tracking-tight">Settings</h2>
        <p class="text-xs text-slate-400 mt-0.5">Customize intervals and automation triggers</p>
      </div>
      <button 
        @click="saveSettings"
        class="flex items-center space-x-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-slate-950 rounded-xl font-semibold text-xs transition-all duration-200 cursor-pointer hover:scale-[1.03] active:scale-95 shadow-md shadow-primary/10"
      >
        <Save class="w-4 h-4" />
        <span>Save Changes</span>
      </button>
    </div>

    <!-- Saved Confirmation Toast -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform -translate-y-2 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform -translate-y-2 opacity-0"
    >
      <div v-if="showSavedAlert" class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold px-4 py-3 rounded-xl flex items-center justify-center space-x-2">
        <span>✓ Settings saved successfully and sync'd with server.</span>
      </div>
    </transition>

    <!-- Form Cards -->
    <div class="space-y-4">
      <!-- 1. Durations (Sliders) -->
      <div class="glass-card rounded-2xl p-5 border-slate-800/80 space-y-5">
        <h3 class="text-sm font-bold text-slate-200 flex items-center space-x-2">
          <Sliders class="w-4.5 h-4.5 text-primary" />
          <span>Intervals (Minutes)</span>
        </h3>
        
        <!-- Work Duration -->
        <div class="space-y-2">
          <div class="flex justify-between text-xs font-semibold">
            <span class="text-slate-400">Focus Duration</span>
            <span class="text-slate-100">{{ workMins }} min</span>
          </div>
          <input 
            v-model.number="workMins" 
            type="range" 
            min="5" 
            max="60" 
            step="1"
            class="w-full accent-primary bg-slate-900 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <!-- Short Break Duration -->
        <div class="space-y-2">
          <div class="flex justify-between text-xs font-semibold">
            <span class="text-slate-400">Short Break Duration</span>
            <span class="text-slate-100">{{ shortMins }} min</span>
          </div>
          <input 
            v-model.number="shortMins" 
            type="range" 
            min="1" 
            max="20" 
            step="1"
            class="w-full accent-primary bg-slate-900 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <!-- Long Break Duration -->
        <div class="space-y-2">
          <div class="flex justify-between text-xs font-semibold">
            <span class="text-slate-400">Long Break Duration</span>
            <span class="text-slate-100">{{ longMins }} min</span>
          </div>
          <input 
            v-model.number="longMins" 
            type="range" 
            min="5" 
            max="45" 
            step="1"
            class="w-full accent-primary bg-slate-900 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      <!-- 2. Automation Toggles -->
      <div class="glass-card rounded-2xl p-5 border-slate-800/80 space-y-4">
        <h3 class="text-sm font-bold text-slate-200 flex items-center space-x-2">
          <Play class="w-4.5 h-4.5 text-primary" />
          <span>Automation</span>
        </h3>

        <!-- Auto Start Breaks Toggle -->
        <div class="flex items-center justify-between py-2 border-b border-slate-800/55">
          <div>
            <h4 class="text-xs font-bold text-slate-200">Auto-start Breaks</h4>
            <p class="text-[10px] text-slate-500 mt-0.5">Automatically start the break timer when work ends</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="autoStartBreaks" type="checkbox" class="sr-only peer" />
            <div class="w-10 h-5.5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-primary peer-checked:after:bg-slate-950"></div>
          </label>
        </div>

        <!-- Auto Start Pomodoros Toggle -->
        <div class="flex items-center justify-between py-2">
          <div>
            <h4 class="text-xs font-bold text-slate-200">Auto-start Focus Sessions</h4>
            <p class="text-[10px] text-slate-500 mt-0.5">Automatically start the work timer when break ends</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="autoStartPomodoros" type="checkbox" class="sr-only peer" />
            <div class="w-10 h-5.5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-primary peer-checked:after:bg-slate-950"></div>
          </label>
        </div>
      </div>

      <!-- 3. Sound Notifications test -->
      <div class="glass-card rounded-2xl p-5 border-slate-800/80 space-y-4">
        <h3 class="text-sm font-bold text-slate-200 flex items-center space-x-2">
          <Volume2 class="w-4.5 h-4.5 text-primary" />
          <span>Sound Cues</span>
        </h3>
        <div class="flex justify-between items-center py-1">
          <div>
            <h4 class="text-xs font-bold text-slate-200">Test Chimes</h4>
            <p class="text-[10px] text-slate-500 mt-0.5">Validate browser audio support and test sound levels</p>
          </div>
          <button 
            @click="testSound"
            class="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer"
          >
            Play Sound Tone
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
