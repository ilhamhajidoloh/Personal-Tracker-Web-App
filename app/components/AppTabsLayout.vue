<template>
  <div class="flex h-screen bg-gray-950 text-white overflow-hidden flex-col md:flex-row">
    <div class="md:hidden flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900 shrink-0">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm">✦</div>
        <p class="font-bold text-white leading-none">MyLife</p>
      </div>
      <button class="text-gray-400 hover:text-white transition-colors" @click="toggleMobileMenu">
        <svg v-if="!mobileMenuOpen" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg v-else class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div
      v-if="mobileMenuOpen"
      class="md:hidden fixed inset-0 z-10 bg-black/50"
      @click="closeMobileMenu"
    ></div>

    <aside :class="[
      'w-full md:w-64 bg-gray-900 flex flex-col border-r border-gray-800 shrink-0 absolute md:relative z-20 h-[calc(100vh-65px)] md:h-auto transition-transform duration-300',
      mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
    ]">
      <div class="md:hidden px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <p class="text-sm font-semibold text-white">เมนู</p>
        <button
          @click="closeMobileMenu"
          class="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-300"
        >
          ปิด ✕
        </button>
      </div>

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

      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p class="px-3 text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-2">Main</p>
        <NuxtLink
          v-for="item in navItems"
          :key="item.label"
          :to="item.to || '#'"
          @click="closeMobileMenu"
          :class="[
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer',
            isRouteActive(item.to)
              ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          ]"
        >
          <span class="text-base">{{ item.icon }}</span>
          {{ item.label }}
          <span v-if="item.badge" class="ml-auto bg-violet-600 text-white text-xs px-2 py-0.5 rounded-full">{{ item.badge }}</span>
        </NuxtLink>

        <p class="px-3 text-[10px] uppercase tracking-widest text-gray-500 font-semibold mt-5 mb-2">Insights</p>
        <NuxtLink
          v-for="item in secondaryNav"
          :key="item.label"
          :to="item.to || '#'"
          @click="closeMobileMenu"
          :class="[
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer',
            isRouteActive(item.to)
              ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          ]"
        >
          <span class="text-base">{{ item.icon }}</span>
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="px-4 pt-4 border-t border-gray-800">
        <button
          @click="toggleTheme"
          class="w-full mb-3 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm text-gray-300 hover:text-white transition-colors flex items-center justify-between"
        >
          <span class="flex items-center gap-2">
            <span>{{ isLightTheme ? '🌙' : '☀️' }}</span>
            <span>{{ isLightTheme ? 'Night Mode' : 'Light Mode' }}</span>
          </span>
          <span class="text-xs text-gray-400">{{ isLightTheme ? 'ON' : 'OFF' }}</span>
        </button>
      </div>

      <div class="px-4 py-4 border-t border-gray-800 relative">
        <button
          @click="userMenuOpen = !userMenuOpen"
          class="w-full flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div class="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center font-bold text-sm">{{ userInitial }}</div>
          <div class="flex-1 min-w-0 text-left">
            <p class="text-sm font-medium text-white truncate">{{ userDisplayName }}</p>
            <p class="text-xs text-gray-400 truncate">{{ userEmail }}</p>
          </div>
          <span class="text-gray-500 hover:text-white transition-colors">⚙️</span>
        </button>

        <div
          v-if="userMenuOpen"
          class="absolute bottom-full left-0 right-0 mb-2 bg-gray-800 border border-gray-700 rounded-xl shadow-lg z-50"
        >
          <NuxtLink
            to="/profile"
            @click="closeMobileMenu"
            class="block w-full px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors first:rounded-t-[calc(0.75rem-1px)]"
          >
            👤 โปรไฟล์
          </NuxtLink>
          <button
            @click="handleLogout"
            :disabled="isLoggingOut"
            class="w-full px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed last:rounded-b-[calc(0.75rem-1px)]"
          >
            <span v-if="!isLoggingOut">🚪</span>
            <span v-else class="inline-block w-4 h-4 border-2 border-gray-300 border-t-white rounded-full animate-spin"></span>
            {{ isLoggingOut ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ' }}
          </button>
        </div>
      </div>
    </aside>

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
  if (typeof to !== 'string') {
    return false
  }

  if (to === '/dashboard') {
    return route.path === to
  }

  return route.path.startsWith(to)
}

const handleLogout = async () => {
  try {
    isLoggingOut.value = true
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }

    userMenuOpen.value = false
    await router.push('/login')
  } catch (error: any) {
    console.error('Logout error:', error)
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