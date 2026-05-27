<script setup>
import { computed, onMounted } from 'vue';
import { store } from '../store';
import { Clock, CheckSquare, Flame, BarChart2 } from 'lucide-vue-next';

onMounted(async () => {
  await store.fetchStats();
});

// Format Focus time to Hours & Mins
const formattedFocusTime = computed(() => {
  const totalSeconds = store.stats.totalFocusTime;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

// Get the last 7 days of stats for the bar chart
const last7DaysStats = computed(() => {
  return store.stats.dailyStats.slice(-7);
});

// Max count in the last 7 days for scaling the SVG chart
const maxDailyCount = computed(() => {
  const counts = last7DaysStats.value.map(d => d.count);
  const max = Math.max(...counts);
  return max > 0 ? max : 4; // Default scale is 4 if no pomodoros done yet
});

// Get day names from dates
const getDayLabel = (dateStr) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  } catch (err) {
    return '';
  }
};

const isWeekend = (dateStr) => {
  try {
    const date = new Date(dateStr);
    const day = date.getDay();
    return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
  } catch (e) {
    return false;
  }
};

const isToday = (dateStr) => {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const dayVal = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${dayVal}`;
    return dateStr === todayStr;
  } catch (e) {
    return false;
  }
};

// CSS class for contribution squares based on Pomodoros completed
const getContributionClass = (day) => {
  if (day.isFuture) {
    return 'bg-slate-950/20 border border-slate-900/30 opacity-20 pointer-events-none';
  }
  
  const weekend = isWeekend(day.date);
  
  if (day.count === 0) {
    return weekend
      ? 'bg-slate-950/40 border border-dashed border-slate-800/50 hover:border-slate-700/50'
      : 'bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/60';
  }
  if (day.count === 1) {
    return 'bg-primary/15 border border-primary/10 hover:border-primary/30';
  }
  if (day.count === 2) {
    return 'bg-primary/40 border border-primary/20 hover:border-primary/45';
  }
  if (day.count === 3) {
    return 'bg-primary/70 border border-primary/40 hover:border-primary/65';
  }
  return 'bg-primary border border-primary-light hover:scale-110 shadow-sm shadow-primary/20';
};

const formatDateTooltip = (dateStr) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (err) {
    return dateStr;
  }
};
</script>

<template>
  <div class="space-y-6 max-w-xl mx-auto py-2">
    <div>
      <h2 class="text-2xl font-extrabold text-slate-100 tracking-tight">Statistics</h2>
      <p class="text-xs text-slate-400 mt-0.5">Track your focus sessions and productivity logs</p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 gap-4">
      <!-- Total Focus Time Card -->
      <div class="glass-card rounded-2xl p-4 flex items-center space-x-4 border-slate-800/80">
        <div class="p-3 rounded-xl bg-primary/10 text-primary transition-colors animate-pulse">
          <Clock class="w-6 h-6" />
        </div>
        <div>
          <span class="text-xs text-slate-400 font-medium">Focus Time</span>
          <h3 class="text-xl font-extrabold text-slate-100 mt-0.5">{{ formattedFocusTime }}</h3>
        </div>
      </div>

      <!-- Completed Pomodoros Card -->
      <div class="glass-card rounded-2xl p-4 flex items-center space-x-4 border-slate-800/80">
        <div class="p-3 rounded-xl bg-primary/10 text-primary transition-colors">
          <Flame class="w-6 h-6" />
        </div>
        <div>
          <span class="text-xs text-slate-400 font-medium">Completed</span>
          <h3 class="text-xl font-extrabold text-slate-100 mt-0.5">{{ store.stats.totalPomodoros }} 🍅</h3>
        </div>
      </div>

      <!-- Completed Tasks Card -->
      <div class="glass-card rounded-2xl p-4 flex items-center space-x-4 border-slate-800/80">
        <div class="p-3 rounded-xl bg-primary/10 text-primary transition-colors">
          <CheckSquare class="w-6 h-6" />
        </div>
        <div>
          <span class="text-xs text-slate-400 font-medium">Completed Tasks</span>
          <h3 class="text-xl font-extrabold text-slate-100 mt-0.5">{{ store.stats.completedTasks }}</h3>
        </div>
      </div>

      <!-- Active Tasks Card -->
      <div class="glass-card rounded-2xl p-4 flex items-center space-x-4 border-slate-800/80">
        <div class="p-3 rounded-xl bg-primary/10 text-primary transition-colors">
          <BarChart2 class="w-6 h-6" />
        </div>
        <div>
          <span class="text-xs text-slate-400 font-medium">Active Tasks</span>
          <h3 class="text-xl font-extrabold text-slate-100 mt-0.5">{{ store.stats.activeTasks }}</h3>
        </div>
      </div>
    </div>

    <!-- GitHub-like Contribution Grid (5 weeks / approx 1 month) -->
    <div class="glass-card rounded-2xl p-5 border-slate-800/80 space-y-4">
      <div class="flex justify-between items-center">
        <h4 class="text-sm font-bold text-slate-200">Focus Consistency (Last Month)</h4>
        <div class="flex items-center space-x-1.5 text-[10px] text-slate-500 font-bold">
          <span>Less</span>
          <div class="w-2.5 h-2.5 rounded-sm bg-slate-900/60 border border-slate-800/80"></div>
          <div class="w-2.5 h-2.5 rounded-sm bg-primary/15 border border-primary/10"></div>
          <div class="w-2.5 h-2.5 rounded-sm bg-primary/40 border border-primary/20"></div>
          <div class="w-2.5 h-2.5 rounded-sm bg-primary/70 border border-primary/40"></div>
          <div class="w-2.5 h-2.5 rounded-sm bg-primary border border-primary-light"></div>
          <span>More</span>
        </div>
      </div>

      <div class="flex items-center justify-center py-3 overflow-x-auto">
        <div class="flex space-x-3 select-none min-w-max">
          <!-- Weekday Labels: All 7 days starting from Monday (Enlarged and aligned) -->
          <div class="flex flex-col justify-between text-[11px] text-slate-500 h-[164px] pr-2 py-[4px] font-bold text-right w-8 leading-none">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span class="text-rose-500/50">Sat</span>
            <span class="text-rose-500/50">Sun</span>
          </div>

          <!-- Grid: 5 columns x 7 rows representing weeks and days (Enlarged to 20x20px) -->
          <div class="grid grid-flow-col grid-rows-7 gap-[4px] h-[164px]">
            <div 
              v-for="day in store.stats.dailyStats" 
              :key="day.date"
              class="w-[20px] h-[20px] rounded-[4px] transition-all duration-300 relative group cursor-crosshair"
              :class="[
                getContributionClass(day),
                isToday(day.date) ? 'ring-2 ring-slate-100 ring-offset-2 ring-offset-slate-950 scale-105 z-10' : ''
              ]"
            >
              <!-- Tooltip on hover -->
              <div class="absolute bottom-7 left-1/2 transform -translate-x-1/2 bg-slate-950 border border-slate-800 text-slate-100 text-[10px] px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20 font-semibold shadow-xl">
                {{ formatDateTooltip(day.date) }}: <span class="text-primary font-bold">{{ day.count }} 🍅</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Custom SVG Weekly Bar Chart -->
    <div class="glass-card rounded-2xl p-5 border-slate-800/80">
      <h4 class="text-sm font-bold text-slate-200 mb-6 flex items-center space-x-2">
        <span>Activity (Last 7 Days)</span>
      </h4>

      <div class="w-full flex items-end justify-between h-44 px-2 relative border-b border-slate-800/60 pb-1">
        <!-- Render grid lines -->
        <div class="absolute inset-x-0 bottom-1 flex flex-col justify-between h-36 border-t border-slate-800/30">
          <div class="w-full border-b border-slate-800/20 h-0"></div>
          <div class="w-full border-b border-slate-800/20 h-0"></div>
          <div class="w-full border-b border-slate-800/20 h-0"></div>
        </div>

        <!-- Render bars -->
        <div 
          v-for="day in last7DaysStats" 
          :key="day.date" 
          class="flex flex-col items-center flex-1 group z-10"
        >
          <!-- Tooltip on hover -->
          <div class="absolute bottom-40 bg-slate-900 border border-slate-800 text-slate-100 text-xs px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-xl font-semibold">
            {{ day.count }} pomodoro{{ day.count !== 1 ? 's' : '' }}
          </div>

          <!-- Bar -->
          <div 
            class="w-8 bg-primary/25 group-hover:bg-primary/40 border border-primary/20 group-hover:border-primary/50 rounded-t-lg transition-all duration-300 relative flex items-end justify-center"
            :style="{ height: `${(day.count / maxDailyCount) * 140 + 6}px` }"
          >
            <!-- Highlight top bar if active/completed -->
            <div 
              v-if="day.count > 0"
              class="absolute inset-x-0 top-0 h-1 bg-primary rounded-t-lg transition-colors"
            ></div>
            <span v-if="day.count > 0" class="text-[10px] font-extrabold text-primary mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {{ day.count }}
            </span>
          </div>

          <!-- X Axis Label -->
          <span class="text-[10px] font-bold text-slate-500 mt-2.5 uppercase tracking-wider group-hover:text-slate-300 transition-colors">
            {{ getDayLabel(day.date) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
