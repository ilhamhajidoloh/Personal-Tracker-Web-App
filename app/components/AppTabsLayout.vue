<template>
  <div class="flex h-screen bg-gray-950 text-white overflow-hidden flex-col md:flex-row">
    <!-- Mobile Top Bar -->
    <div class="md:hidden flex items-center justify-between px-5 py-3.5 border-b border-gray-800/80 bg-gray-900/95 backdrop-blur-sm shrink-0 z-30 relative">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-base shadow-lg shadow-violet-500/30">✦</div>
        <p class="font-bold text-white tracking-tight">MyLife</p>
      </div>
      <button
        class="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all"
        @click="toggleMobileMenu"
        aria-label="เปิด/ปิดเมนู"
      >
        <svg v-if="!mobileMenuOpen" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Mobile overlay -->
    <div
      v-if="mobileMenuOpen"
      class="md:hidden fixed inset-0 z-10 bg-black/60 backdrop-blur-sm"
      @click="closeMobileMenu"
    ></div>

    <!-- Sidebar -->
    <aside :class="[
      'w-72 md:w-64 bg-gray-900 flex flex-col border-r border-gray-800/80 shrink-0 absolute md:relative z-20 h-[calc(100vh-57px)] md:h-auto transition-transform duration-300 ease-in-out',
      mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
    ]">
      <!-- Logo (desktop) -->
      <div class="hidden md:flex items-center gap-3 px-5 py-5 border-b border-gray-800/80">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-violet-500/25 shrink-0">✦</div>
        <div>
          <p class="font-bold text-white text-lg leading-none tracking-tight">MyLife</p>
          <p class="text-[11px] text-gray-500 mt-0.5">Personal Tracker</p>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-3 py-4 overflow-y-auto">
        <p class="px-3 mb-2 text-[10px] uppercase tracking-widest text-gray-600 font-semibold">เมนูหลัก</p>

        <div class="space-y-0.5">
          <NuxtLink
            v-for="item in navItems"
            :key="item.label"
            :to="item.to || '#'"
            @click="closeMobileMenu"
            :class="[
              'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group',
              isRouteActive(item.to)
                ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/70 border border-transparent'
            ]"
          >
            <!-- Active left indicator -->
            <span
              v-if="isRouteActive(item.to)"
              class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-violet-500 rounded-r-full"
            ></span>

            <!-- Icon -->
            <span :class="[
              'w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 transition-all',
              isRouteActive(item.to)
                ? 'bg-violet-500/20 text-violet-300'
                : 'bg-gray-800/80 text-gray-400 group-hover:bg-gray-700 group-hover:text-white'
            ]">{{ item.icon }}</span>

            <span class="flex-1 truncate">{{ item.label }}</span>

            <span v-if="item.badge" class="ml-auto bg-violet-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold">{{ item.badge }}</span>
          </NuxtLink>
        </div>

        <div class="mt-4 mb-2">
          <p class="px-3 mb-2 text-[10px] uppercase tracking-widest text-gray-600 font-semibold">บัญชีผู้ใช้</p>
        </div>

        <div class="space-y-0.5">
          <NuxtLink
            v-for="item in secondaryNav"
            :key="item.label"
            :to="item.to || '#'"
            @click="closeMobileMenu"
            :class="[
              'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group',
              isRouteActive(item.to)
                ? 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/70 border border-transparent'
            ]"
          >
            <span
              v-if="isRouteActive(item.to)"
              class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-violet-500 rounded-r-full"
            ></span>
            <span :class="[
              'w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 transition-all',
              isRouteActive(item.to)
                ? 'bg-violet-500/20 text-violet-300'
                : 'bg-gray-800/80 text-gray-400 group-hover:bg-gray-700 group-hover:text-white'
            ]">{{ item.icon }}</span>
            <span class="flex-1 truncate">{{ item.label }}</span>
          </NuxtLink>
        </div>
      </nav>

      <!-- Theme Toggle -->
      <div class="px-3 py-3 border-t border-gray-800/80">
        <button
          @click="toggleTheme"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-800/60 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 text-sm text-gray-400 hover:text-white transition-all"
        >
          <span class="w-8 h-8 rounded-lg bg-gray-700/80 flex items-center justify-center text-base shrink-0">{{ isLightTheme ? '🌙' : '☀️' }}</span>
          <span class="flex-1 text-left">{{ isLightTheme ? 'Night Mode' : 'Light Mode' }}</span>
          <span class="text-[11px] text-gray-500 font-medium">{{ isLightTheme ? 'ON' : 'OFF' }}</span>
        </button>
      </div>

      <!-- User Section -->
      <div class="px-3 pb-3 relative">
        <button
          @click="userMenuOpen = !userMenuOpen"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-800/70 transition-all border border-transparent hover:border-gray-700/50 group"
        >
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center font-bold text-sm shadow-md shrink-0">{{ userInitial }}</div>
          <div class="flex-1 min-w-0 text-left">
            <p class="text-sm font-medium text-white truncate leading-tight">{{ userDisplayName }}</p>
            <p class="text-[11px] text-gray-500 truncate mt-0.5">{{ userEmail }}</p>
          </div>
          <svg
            class="w-4 h-4 text-gray-500 group-hover:text-gray-300 shrink-0 transition-all"
            :class="userMenuOpen ? 'rotate-180' : ''"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- User dropdown -->
        <div
          v-if="userMenuOpen"
          class="absolute bottom-full left-3 right-3 mb-1 bg-gray-800 border border-gray-700/80 rounded-xl shadow-2xl z-50 overflow-hidden"
        >
          <NuxtLink
            to="/profile"
            @click="closeMobileMenu"
            class="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-700/60 transition-colors"
          >
            <span class="w-7 h-7 rounded-lg bg-gray-700 flex items-center justify-center text-sm shrink-0">👤</span>
            โปรไฟล์
          </NuxtLink>
          <div class="h-px bg-gray-700/60"></div>
          <button
            @click="handleLogout"
            :disabled="isLoggingOut"
            class="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span class="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
              <span v-if="!isLoggingOut">🚪</span>
              <span v-else class="inline-block w-3.5 h-3.5 border-2 border-rose-400/40 border-t-rose-400 rounded-full animate-spin"></span>
            </span>
            {{ isLoggingOut ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ' }}
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col overflow-hidden relative z-0">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

type NavItem = {
  icon: string
  label: string
  to?: RouteLocationRaw
  badge?: string
}

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { isLightTheme, initializeTheme, toggleTheme } = useAppTheme()

const mobileMenuOpen = ref(false)
const userMenuOpen = ref(false)
const isLoggingOut = ref(false)

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
  userMenuOpen.value = false
}

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
  if (!mobileMenuOpen.value) {
    userMenuOpen.value = false
  }
}

const navItems: NavItem[] = [
  { icon: '🏠', label: 'Dashboard', to: '/dashboard' },
  { icon: '💸', label: 'รายรับรายจ่าย', to: '/cashflow' },
  { icon: '📅', label: 'ตารางเรียน', to: '/study-schedule' },
  { icon: '✅', label: 'งานและ To-do', to: '/todos' },
  { icon: '🎉', label: 'กิจกรรม', to: '/events' },
]

const secondaryNav: NavItem[] = [
  { icon: '👤', label: 'Profile', to: '/profile' },
  { icon: '⚡', label: 'DB Test', to: '/supabase-test' },
]

const userDisplayName = computed(() => {
  const metadata = (user.value?.user_metadata || {}) as Record<string, unknown>
  const fullName = typeof metadata.full_name === 'string'
    ? metadata.full_name
    : typeof metadata.name === 'string'
      ? metadata.name
      : ''
  return fullName.trim() || user.value?.email?.split('@')[0] || 'MyLife User'
})

const userInitial = computed(() => userDisplayName.value.trim().charAt(0).toUpperCase() || 'U')
const userEmail = computed(() => user.value?.email || '-')

const isRouteActive = (to?: RouteLocationRaw) => {
  if (typeof to !== 'string') return false
  if (to === '/dashboard') return route.path === to
  return route.path.startsWith(to)
}

const handleLogout = async () => {
  try {
    isLoggingOut.value = true
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    userMenuOpen.value = false
    useAlert().toastSuccess('ออกจากระบบสำเร็จ')
    await router.push('/login')
  } catch (error: any) {
    console.error('Logout error:', error)
    useAlert().toastError(error?.message || 'ออกจากระบบไม่สำเร็จ')
  } finally {
    isLoggingOut.value = false
  }
}

watch(() => route.path, () => {
  mobileMenuOpen.value = false
  userMenuOpen.value = false
})

onMounted(() => {
  initializeTheme()
})
</script>
