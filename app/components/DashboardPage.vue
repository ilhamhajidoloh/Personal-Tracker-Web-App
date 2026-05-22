<template>
  <div class="flex h-screen bg-gray-950 text-white overflow-hidden flex-col md:flex-row">

    <!-- Mobile Header -->
    <div class="md:hidden flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900 shrink-0">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm">✦</div>
        <p class="font-bold text-white leading-none">MyLife</p>
      </div>
      <button class="text-gray-400 hover:text-white transition-colors" @click="mobileMenuOpen = !mobileMenuOpen">
        <svg v-if="!mobileMenuOpen" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg v-else class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Sidebar -->
    <aside :class="[
      'w-full md:w-64 bg-gray-900 flex flex-col border-r border-gray-800 shrink-0 absolute md:relative z-20 h-[calc(100vh-65px)] md:h-auto transition-transform duration-300',
      mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
    ]">
      <!-- Logo (Desktop only) -->
      <div class="hidden md:block px-6 py-6 border-b border-gray-800">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-lg">
            ✦
          </div>
          <div>
            <p class="font-bold text-white leading-none">MyLife</p>
            <p class="text-xs text-gray-400 mt-0.5">Personal Tracker</p>
          </div>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p class="px-3 text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-2">Main</p>
        <NuxtLink v-for="item in navItems" :key="item.label" :to="item.to || '#'"
          :class="[
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer',
            item.active
              ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          ]">
          <span class="text-base">{{ item.icon }}</span>
          {{ item.label }}
          <span v-if="item.badge" class="ml-auto bg-violet-600 text-white text-xs px-2 py-0.5 rounded-full">{{ item.badge }}</span>
        </NuxtLink>

        <p class="px-3 text-[10px] uppercase tracking-widest text-gray-500 font-semibold mt-5 mb-2">Insights</p>
        <NuxtLink v-for="item in secondaryNav" :key="item.label" :to="item.to || '#'"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-all cursor-pointer">
          <span class="text-base">{{ item.icon }}</span>
          {{ item.label }}
        </NuxtLink>
      </nav>

      <!-- User Profile -->
      <div class="px-4 py-4 border-t border-gray-800 relative">
        <button
          @click="userMenuOpen = !userMenuOpen"
          class="w-full flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div class="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center font-bold text-sm">A</div>
          <div class="flex-1 min-w-0 text-left">
            <p class="text-sm font-medium text-white truncate">Alex Johnson</p>
            <p class="text-xs text-gray-400 truncate">alex@mylife.app</p>
          </div>
          <span class="text-gray-500 hover:text-white transition-colors">⚙️</span>
        </button>

        <!-- User Menu Dropdown -->
        <div
          v-if="userMenuOpen"
          class="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 border border-gray-700 rounded-xl shadow-lg z-50"
        >
          <button
            @click="handleLogout"
            :disabled="isLoggingOut"
            class="w-full px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed first:rounded-t-[calc(0.75rem-1px)] last:rounded-b-[calc(0.75rem-1px)]"
          >
            <span v-if="!isLoggingOut">🚪</span>
            <span v-else class="inline-block w-4 h-4 border-2 border-gray-300 border-t-white rounded-full animate-spin"></span>
            {{ isLoggingOut ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ' }}
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col overflow-hidden relative z-0">

      <!-- Top Bar -->
      <header class="px-6 md:px-8 py-5 border-b border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 shrink-0">
        <div>
          <h1 class="text-xl font-bold text-white">Good morning, Alex 👋</h1>
          <p class="text-sm text-gray-400 mt-0.5">{{ today }} · Week 21</p>
        </div>
        <div class="flex items-center gap-2 sm:gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button class="shrink-0 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-4 py-2 rounded-xl transition-colors border border-gray-700">
            📅 <span class="hidden sm:inline">This Week</span>
          </button>
          <button class="shrink-0 bg-violet-600 hover:bg-violet-500 text-white text-sm px-4 py-2 rounded-xl transition-colors font-medium">
            + Add Entry
          </button>
          <div class="relative shrink-0 ml-auto sm:ml-0">
            <button class="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center border border-gray-700 hover:bg-gray-700 transition-colors">🔔</button>
            <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </div>
        </div>
      </header>

      <!-- Scrollable Body -->
      <div class="flex-1 overflow-y-auto px-6 md:px-8 py-6 space-y-6">

        <!-- Stat Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div v-for="stat in stats" :key="stat.label"
            class="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-all">
            <div class="flex items-start justify-between mb-3">
              <div :class="`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${stat.bg}`">
                {{ stat.icon }}
              </div>
              <span :class="`text-xs font-semibold px-2 py-1 rounded-full ${stat.change >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`">
                {{ stat.change >= 0 ? '+' : '' }}{{ stat.change }}%
              </span>
            </div>
            <p class="text-2xl font-bold text-white">{{ stat.value }}</p>
            <p class="text-sm text-gray-400 mt-1">{{ stat.label }}</p>
          </div>
        </div>

        <!-- Middle Row -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

          <!-- Habit Tracker -->
          <div class="col-span-1 lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div class="flex items-center justify-between mb-5">
              <div>
                <h2 class="font-semibold text-white">Habit Tracker</h2>
                <p class="text-xs text-gray-400 mt-0.5">This week's progress</p>
              </div>
              <span class="bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1 rounded-full font-medium border border-emerald-500/20">
                🔥 5 day streak
              </span>
            </div>
            <div class="space-y-4">
              <div v-for="habit in habits" :key="habit.name">
                <div class="flex items-center justify-between mb-1.5">
                  <div class="flex items-center gap-2">
                    <span>{{ habit.icon }}</span>
                    <span class="text-sm text-gray-300">{{ habit.name }}</span>
                  </div>
                  <span class="text-xs text-gray-400">{{ habit.done }}/{{ habit.total }} days</span>
                </div>
                <div class="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    :class="`h-full rounded-full transition-all ${habit.color}`"
                    :style="`width: ${(habit.done / habit.total) * 100}%`"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Today's Tasks -->
          <div class="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div class="flex items-center justify-between mb-5">
              <h2 class="font-semibold text-white">Today's Tasks</h2>
              <span class="text-xs text-gray-400">{{ completedTasks }}/{{ tasks.length }}</span>
            </div>
            <div class="space-y-3">
              <div v-for="task in tasks" :key="task.id"
                class="flex items-start gap-3 group cursor-pointer"
                @click="task.done = !task.done">
                <div :class="[
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all',
                  task.done ? 'bg-violet-600 border-violet-600' : 'border-gray-600 group-hover:border-violet-500'
                ]">
                  <svg v-if="task.done" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p :class="['text-sm truncate transition-all', task.done ? 'line-through text-gray-600' : 'text-gray-300']">
                    {{ task.text }}
                  </p>
                  <p class="text-xs text-gray-500 mt-0.5">{{ task.time }}</p>
                </div>
                <span :class="`text-[10px] px-2 py-0.5 rounded-full ${task.tagColor}`">{{ task.tag }}</span>
              </div>
            </div>
            <button class="mt-4 w-full py-2 text-sm text-gray-500 hover:text-violet-400 hover:bg-violet-500/10 rounded-xl transition-all border border-dashed border-gray-700 hover:border-violet-500/40">
              + Add task
            </button>
          </div>
        </div>

        <!-- Bottom Row -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

          <!-- Weekly Mood -->
          <div class="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 class="font-semibold text-white mb-1">Mood This Week</h2>
            <p class="text-xs text-gray-400 mb-5">Daily emotional check-in</p>
            <div class="flex items-end justify-between gap-2 h-24">
              <div v-for="day in moodWeek" :key="day.label" class="flex flex-col items-center gap-2 flex-1">
                <div class="relative w-full flex justify-center">
                  <div
                    :class="`w-8 rounded-t-lg transition-all ${day.color}`"
                    :style="`height: ${day.value * 0.8}px`"
                  ></div>
                </div>
                <span class="text-[10px] text-gray-500">{{ day.label }}</span>
              </div>
            </div>
            <div class="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
              <p class="text-xs text-gray-400">Avg mood score</p>
              <p class="text-sm font-bold text-violet-400">7.8 / 10</p>
            </div>
          </div>

          <!-- Health Metrics -->
          <div class="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 class="font-semibold text-white mb-1">Health Metrics</h2>
            <p class="text-xs text-gray-400 mb-5">Today's overview</p>
            <div class="space-y-4">
              <div v-for="metric in healthMetrics" :key="metric.name" class="flex items-center gap-4">
                <div :class="`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${metric.bg} shrink-0`">
                  {{ metric.icon }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-1">
                    <p class="text-xs text-gray-400">{{ metric.name }}</p>
                    <p class="text-xs font-semibold text-white">{{ metric.value }}</p>
                  </div>
                  <div class="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div :class="`h-full rounded-full ${metric.color}`" :style="`width: ${metric.pct}%`"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Journal -->
          <div class="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div class="flex items-center justify-between mb-5">
              <h2 class="font-semibold text-white">Journal</h2>
              <button class="text-xs text-violet-400 hover:text-violet-300 transition-colors">View all →</button>
            </div>
            <div class="space-y-4">
              <div v-for="entry in journalEntries" :key="entry.date"
                class="border-l-2 border-gray-700 pl-4 hover:border-violet-500 transition-all cursor-pointer">
                <p class="text-xs text-gray-500 mb-1">{{ entry.date }}</p>
                <p class="text-sm text-gray-300 leading-relaxed line-clamp-2">{{ entry.text }}</p>
                <div class="flex gap-2 mt-2">
                  <span v-for="tag in entry.tags" :key="tag"
                    class="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
            <button class="mt-4 w-full py-2.5 text-sm text-violet-400 hover:text-white bg-violet-600/10 hover:bg-violet-600 rounded-xl transition-all border border-violet-500/20 font-medium">
              ✏️ Write Today's Entry
            </button>
          </div>
        </div>

      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const supabase = useSupabaseClient()

const mobileMenuOpen = ref(false)
const userMenuOpen = ref(false)
const isLoggingOut = ref(false)

const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
})

const navItems = [
  { icon: '🏠', label: 'Dashboard', active: true, to: '/dashboard' },
  { icon: '✅', label: 'Tasks', badge: '3' },
  { icon: '🔁', label: 'Habits' },
  { icon: '💪', label: 'Fitness' },
  { icon: '🥗', label: 'Nutrition' },
]

const secondaryNav = [
  { icon: '📊', label: 'Analytics' },
  { icon: '📓', label: 'Journal' },
  { icon: '🎯', label: 'Goals' },
  { icon: '⚡', label: 'DB Test', to: '/supabase-test' },
]

const stats = [
  { icon: '✅', label: 'Tasks Completed', value: '24', change: 12, bg: 'bg-violet-500/20' },
  { icon: '🔥', label: 'Habit Streak', value: '5 days', change: 25, bg: 'bg-orange-500/20' },
  { icon: '👣', label: 'Steps Today', value: '8,240', change: -5, bg: 'bg-sky-500/20' },
  { icon: '😴', label: 'Sleep Last Night', value: '7h 20m', change: 8, bg: 'bg-indigo-500/20' },
]

const habits = ref([
  { icon: '🏃', name: 'Morning Run', done: 5, total: 7, color: 'bg-emerald-500' },
  { icon: '📚', name: 'Reading (30 min)', done: 6, total: 7, color: 'bg-violet-500' },
  { icon: '💧', name: 'Drink 8 glasses water', done: 4, total: 7, color: 'bg-sky-500' },
  { icon: '🧘', name: 'Meditation', done: 3, total: 7, color: 'bg-pink-500' },
  { icon: '🛌', name: 'Sleep by 11 PM', done: 5, total: 7, color: 'bg-amber-500' },
])

const tasks = ref([
  { id: 1, text: 'Review weekly goals', time: '09:00 AM', done: true, tag: 'Focus', tagColor: 'bg-violet-500/20 text-violet-400' },
  { id: 2, text: 'Workout — Leg Day', time: '10:30 AM', done: true, tag: 'Health', tagColor: 'bg-emerald-500/20 text-emerald-400' },
  { id: 3, text: 'Read 30 pages of book', time: '01:00 PM', done: false, tag: 'Learn', tagColor: 'bg-sky-500/20 text-sky-400' },
  { id: 4, text: 'Plan meals for next week', time: '03:00 PM', done: false, tag: 'Food', tagColor: 'bg-amber-500/20 text-amber-400' },
  { id: 5, text: 'Evening meditation', time: '09:00 PM', done: false, tag: 'Mind', tagColor: 'bg-pink-500/20 text-pink-400' },
])

const completedTasks = computed(() => tasks.value.filter((task) => task.done).length)

const moodWeek = [
  { label: 'Mon', value: 75, color: 'bg-violet-500' },
  { label: 'Tue', value: 90, color: 'bg-violet-500' },
  { label: 'Wed', value: 60, color: 'bg-violet-400' },
  { label: 'Thu', value: 85, color: 'bg-violet-500' },
  { label: 'Fri', value: 95, color: 'bg-violet-600' },
  { label: 'Sat', value: 80, color: 'bg-violet-500' },
  { label: 'Sun', value: 70, color: 'bg-violet-400' },
]

const healthMetrics = [
  { icon: '❤️', name: 'Heart Rate', value: '72 bpm', pct: 72, color: 'bg-red-500', bg: 'bg-red-500/10' },
  { icon: '👣', name: 'Steps', value: '8,240', pct: 82, color: 'bg-sky-500', bg: 'bg-sky-500/10' },
  { icon: '💧', name: 'Hydration', value: '1.8 / 2.5 L', pct: 72, color: 'bg-blue-500', bg: 'bg-blue-500/10' },
  { icon: '🔥', name: 'Calories Burned', value: '420 kcal', pct: 60, color: 'bg-orange-500', bg: 'bg-orange-500/10' },
]

const journalEntries = [
  {
    date: 'Today, May 23',
    text: 'Felt really productive this morning. Crushed my workout and got through my reading list. Need to work on staying off my phone after 9 PM.',
    tags: ['#productive', '#fitness']
  },
  {
    date: 'Yesterday, May 22',
    text: 'Had a slow start but turned it around in the afternoon. Meditation really helped with afternoon slump.',
    tags: ['#mindfulness', '#slow-day']
  },
]

const handleLogout = async () => {
  try {
    isLoggingOut.value = true
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    userMenuOpen.value = false
    await router.push('/')
  } catch (error: any) {
    console.error('Logout error:', error)
  } finally {
    isLoggingOut.value = false
  }
}
</script>