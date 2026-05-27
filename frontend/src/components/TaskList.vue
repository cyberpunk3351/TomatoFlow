<script setup>
import { ref } from 'vue';
import { store } from '../store';
import { CheckCircle2, Circle, Trash2, Plus, Target, Check, PlayCircle } from 'lucide-vue-next';

const showCreateForm = ref(false);
const newTitle = ref('');
const newDescription = ref('');
const newEstPomodoros = ref(1);

const submitTask = async () => {
  if (!newTitle.value.trim()) return;
  await store.createTask(newTitle.value, newDescription.value, newEstPomodoros.value);
  newTitle.value = '';
  newDescription.value = '';
  newEstPomodoros.value = 1;
  showCreateForm.value = false;
};

const toggleComplete = async (task) => {
  await store.updateTask(task.id, {
    is_completed: !task.is_completed
  });
};

const selectTask = (task) => {
  if (task.is_completed) return;
  // If task is already selected, deselect it. Otherwise select it.
  const targetId = store.timerState.currentTaskId === task.id ? null : task.id;
  store.selectTask(targetId);
};
</script>

<template>
  <div class="space-y-6 max-w-xl mx-auto py-2">
    <!-- Header with Add Button -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-extrabold text-slate-100 tracking-tight">Tasks</h2>
        <p class="text-xs text-slate-400 mt-0.5">Select a task to focus on during your session</p>
      </div>
      <button 
        @click="showCreateForm = !showCreateForm"
        class="flex items-center space-x-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-slate-950 rounded-xl font-semibold text-xs transition-all duration-200 cursor-pointer hover:scale-[1.03] active:scale-95 shadow-md shadow-primary/10"
      >
        <Plus class="w-4 h-4 stroke-[2.5]" />
        <span>Add Task</span>
      </button>
    </div>

    <!-- Create Task Form Modal/Collapse -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0 -translate-y-2"
      enter-to-class="transform scale-100 opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform scale-100 opacity-100 translate-y-0"
      leave-to-class="transform scale-95 opacity-0 -translate-y-2"
    >
      <div v-if="showCreateForm" class="glass-card rounded-2xl p-5 border-slate-800">
        <form @submit.prevent="submitTask" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Task Title</label>
            <input 
              v-model="newTitle" 
              type="text" 
              placeholder="What are you working on?" 
              required
              class="w-full bg-slate-900 border border-slate-800 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 text-slate-100 px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all duration-200"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Description (Optional)</label>
            <textarea 
              v-model="newDescription" 
              placeholder="Add some details..." 
              rows="2"
              class="w-full bg-slate-900 border border-slate-800 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 text-slate-100 px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all duration-200 resize-none"
            ></textarea>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Estimated Pomodoros (🍅)</label>
            <div class="flex items-center space-x-3">
              <input 
                v-model.number="newEstPomodoros" 
                type="number" 
                min="1" 
                max="10" 
                class="w-20 bg-slate-900 border border-slate-800 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 text-slate-100 px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-all duration-200"
              />
              <span class="text-xs text-slate-400">estimate how many intervals this task will take</span>
            </div>
          </div>
          <div class="flex space-x-3 pt-2">
            <button 
              type="submit" 
              class="flex-1 bg-primary hover:bg-primary-dark text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-all duration-200 cursor-pointer"
            >
              Save Task
            </button>
            <button 
              type="button" 
              @click="showCreateForm = false"
              class="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </transition>

    <!-- Task List -->
    <div v-if="store.tasks.length > 0" class="space-y-3">
      <div 
        v-for="task in store.tasks" 
        :key="task.id"
        class="glass-card glass-card-hover rounded-2xl p-4 flex items-center justify-between border-slate-800/80 transition-all duration-300"
        :class="{ 
          'opacity-60 bg-slate-950/20 border-slate-900/40': task.is_completed,
          'border-primary/30 bg-primary/5 shadow-md shadow-primary/5': store.timerState.currentTaskId === task.id && !task.is_completed
        }"
      >
        <div class="flex items-start space-x-3.5 flex-1 min-w-0 pr-4">
          <!-- Complete checkbox button -->
          <button 
            @click="toggleComplete(task)"
            class="mt-0.5 text-slate-400 hover:text-primary transition-colors focus:outline-none cursor-pointer"
          >
            <CheckCircle2 v-if="task.is_completed" class="w-5 h-5 text-primary fill-primary/10" />
            <Circle v-else class="w-5 h-5" />
          </button>

          <!-- Task Texts -->
          <div class="flex-1 min-w-0" @click="selectTask(task)">
            <h4 
              class="text-sm font-bold text-slate-100 truncate cursor-pointer select-none"
              :class="{ 'line-through text-slate-500': task.is_completed }"
            >
              {{ task.title }}
            </h4>
            <p 
              v-if="task.description" 
              class="text-xs text-slate-400 mt-1 line-clamp-1 cursor-pointer select-none"
              :class="{ 'line-through text-slate-600': task.is_completed }"
            >
              {{ task.description }}
            </p>
          </div>
        </div>

        <!-- Task Info & Actions -->
        <div class="flex items-center space-x-3.5">
          <!-- Pomodoro Counts -->
          <div class="flex items-center space-x-1 text-xs text-slate-300 font-medium bg-slate-900/80 border border-slate-800/80 px-2 py-1 rounded-lg">
            <span>{{ task.completed_pomodoros }}</span>
            <span class="text-slate-500">/</span>
            <span>{{ task.est_pomodoros }}🍅</span>
          </div>

          <!-- Select/Play Button (Only if uncompleted) -->
          <button 
            v-if="!task.is_completed"
            @click="selectTask(task)"
            class="p-1.5 rounded-lg border focus:outline-none transition-all duration-200 cursor-pointer"
            :class="store.timerState.currentTaskId === task.id 
              ? 'bg-primary text-slate-950 border-primary' 
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'"
            :title="store.timerState.currentTaskId === task.id ? 'Deselect Task' : 'Select Task for Focus'"
          >
            <Check v-if="store.timerState.currentTaskId === task.id" class="w-4 h-4 stroke-[2.5]" />
            <PlayCircle v-else class="w-4 h-4" />
          </button>

          <!-- Delete Button -->
          <button 
            @click="store.deleteTask(task.id)"
            class="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 border border-slate-800 hover:border-rose-900/50 focus:outline-none transition-all duration-200 cursor-pointer"
            title="Delete Task"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-12 glass-card rounded-2xl border-slate-800/80">
      <Target class="w-10 h-10 text-slate-600 mx-auto mb-3" />
      <h3 class="text-sm font-bold text-slate-300">No tasks yet</h3>
      <p class="text-xs text-slate-500 mt-1 max-w-xs mx-auto">Create a task above to help structure and track your session progress.</p>
    </div>
  </div>
</template>
