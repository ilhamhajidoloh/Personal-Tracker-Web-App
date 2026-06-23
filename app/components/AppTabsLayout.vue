<template>
  <div class="flex h-screen overflow-hidden flex-col md:flex-row" :style="{ background: 'var(--bg-base)' }">
    <!-- Ambient background -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div class="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-[120px] opacity-30" style="background: radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%);"></div>
      <div class="absolute -bottom-48 -right-48 w-[600px] h-[600px] rounded-full blur-[140px] opacity-20" style="background: radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%);"></div>
      <div class="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full blur-[100px] opacity-15" style="background: radial-gradient(circle, rgba(168,85,247,0.1), transparent 70%); animation: float 20s ease-in-out infinite;"></div>
    </div>

    <!-- Mobile Top Bar -->
    <div class="md:hidden h-14 flex items-center justify-between px-4 shrink-0 z-30 relative glass-header">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center text-sm shadow-lg glow-violet">
          <span class="text-white font-bold">M</span>
        </div>
        <p class="font-bold text-white tracking-tight text-sm">MyLife</p>
      </div>
      <button
        class="w-8 h-8 flex items-center justify-center rounded-xl glass-surface text-gray-400 hover:text-white transition-all"
        @click="toggleMobileMenu"
        aria-label="เปิด/ปิดเมนู"
      >
        <svg v-if="!mobileMenuOpen" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Mobile overlay -->
    <Transition name="fade">
      <div
        v-if="mobileMenuOpen"
        class="md:hidden fixed inset-x-0 top-14 bottom-0 z-10 bg-black/50 backdrop-blur-sm"
        @click="closeMobileMenu"
      ></div>
    </Transition>

    <!-- Sidebar -->
    <aside :class="[
      'fixed left-0 top-14 w-[min(17rem,calc(100vw-3rem))] flex flex-col shrink-0 z-20 h-[calc(100dvh-3.5rem)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] md:static md:top-auto md:w-[260px] md:h-auto',
      mobileMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 md:translate-x-0 md:opacity-100'
    ]" style="background: var(--bg-card); backdrop-filter: blur(20px) saturate(1.5); border-right: 1px solid var(--border-default);">
      <!-- Logo (desktop) -->
      <div class="hidden md:flex items-center gap-3 px-5 py-5" style="border-bottom: 1px solid var(--border-subtle);">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-lg glow-violet shrink-0 relative overflow-hidden">
          <span class="text-white font-bold text-lg relative z-10">M</span>
          <div class="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent"></div>
        </div>
        <div>
          <p class="font-bold text-white text-lg leading-none tracking-tight">MyLife</p>
          <p class="text-[11px] mt-0.5" style="color: var(--text-muted);">Personal Tracker</p>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-3 py-4 overflow-y-auto">
        <p class="px-3 mb-2.5 text-[10px] uppercase tracking-[0.15em] font-semibold" style="color: var(--text-muted);">เมนูหลัก</p>

        <div class="space-y-1">
          <NuxtLink
            v-for="(item, index) in navItems"
            :key="item.label"
            :to="item.to || '#'"
            @click="closeMobileMenu"
            :class="[
              'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group',
              isRouteActive(item.to)
                ? 'nav-link-active'
                : 'nav-link-inactive'
            ]"
            :style="{ animationDelay: `${index * 0.05}s` }"
          >
            <span
              v-if="isRouteActive(item.to)"
              class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full transition-all"
              style="background: linear-gradient(180deg, #a78bfa, #818cf8);"
            ></span>

            <span :class="[
              'w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 transition-all',
              isRouteActive(item.to)
                ? 'text-violet-300'
                : 'text-gray-400 group-hover:text-white'
            ]" :style="isRouteActive(item.to) ? 'background: rgba(139,92,246,0.15);' : 'background: var(--bg-elevated);'">{{ item.icon }}</span>

            <span class="flex-1 truncate">{{ item.label }}</span>

            <span v-if="item.badge" class="ml-auto text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style="background: linear-gradient(135deg, #8b5cf6, #6366f1);">{{ item.badge }}</span>
          </NuxtLink>
        </div>

        <div class="mt-5 mb-2.5">
          <p class="px-3 mb-2.5 text-[10px] uppercase tracking-[0.15em] font-semibold" style="color: var(--text-muted);">บัญชีผู้ใช้</p>
        </div>

        <div class="space-y-1">
          <NuxtLink
            v-for="item in secondaryNav"
            :key="item.label"
            :to="item.to || '#'"
            @click="closeMobileMenu"
            :class="[
              'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer group',
              isRouteActive(item.to)
                ? 'nav-link-active'
                : 'nav-link-inactive'
            ]"
          >
            <span
              v-if="isRouteActive(item.to)"
              class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
              style="background: linear-gradient(180deg, #a78bfa, #818cf8);"
            ></span>
            <span :class="[
              'w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 transition-all',
              isRouteActive(item.to)
                ? 'text-violet-300'
                : 'text-gray-400 group-hover:text-white'
            ]" :style="isRouteActive(item.to) ? 'background: rgba(139,92,246,0.15);' : 'background: var(--bg-elevated);'">{{ item.icon }}</span>
            <span class="flex-1 truncate">{{ item.label }}</span>
          </NuxtLink>
        </div>
      </nav>

      <!-- Theme Toggle -->
      <div class="px-3 py-3" style="border-top: 1px solid var(--border-subtle);">
        <button
          @click="toggleTheme"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group"
          style="background: var(--bg-elevated); border: 1px solid var(--border-subtle);"
        >
          <span class="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 transition-transform group-hover:scale-110" style="background: var(--bg-card);">{{ isLightTheme ? '🌙' : '☀️' }}</span>
          <span class="flex-1 text-left text-gray-400 group-hover:text-white transition-colors">{{ isLightTheme ? 'Night Mode' : 'Light Mode' }}</span>
          <span class="w-9 h-5 rounded-full relative transition-all" :style="isLightTheme ? 'background: rgba(139,92,246,0.3);' : 'background: var(--border-default);'">
            <span class="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 shadow-sm" :style="isLightTheme ? 'left: calc(100% - 1.125rem); background: #8b5cf6;' : 'left: 0.125rem; background: var(--text-muted);'"></span>
          </span>
        </button>
      </div>

      <!-- User Section -->
      <div class="px-3 pb-3 relative">
        <button
          @click="userMenuOpen = !userMenuOpen"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group"
          style="border: 1px solid transparent;"
          @mouseenter="$el.style.background = 'var(--bg-elevated)'; $el.style.borderColor = 'var(--border-subtle)'"
          @mouseleave="$el.style.background = 'transparent'; $el.style.borderColor = 'transparent'"
        >
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-purple-500 flex items-center justify-center font-bold text-sm text-white shadow-md shrink-0 relative overflow-hidden">
            {{ userInitial }}
            <div class="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
          </div>
          <div class="flex-1 min-w-0 text-left">
            <p class="text-sm font-medium text-white truncate leading-tight">{{ userDisplayName }}</p>
            <p class="text-[11px] truncate mt-0.5" style="color: var(--text-muted);">{{ userEmail }}</p>
          </div>
          <svg
            class="w-4 h-4 shrink-0 transition-all duration-300"
            :class="userMenuOpen ? 'rotate-180' : ''"
            :style="{ color: 'var(--text-muted)' }"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- User dropdown -->
        <Transition name="slide-up">
          <div
            v-if="userMenuOpen"
            class="absolute bottom-full left-3 right-3 mb-1 rounded-xl shadow-2xl z-50 overflow-hidden"
            style="background: var(--bg-card); backdrop-filter: blur(20px); border: 1px solid var(--border-default);"
          >
            <NuxtLink
              to="/profile"
              @click="closeMobileMenu"
              class="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-gray-300 hover:text-white transition-all"
              style="border-bottom: 1px solid var(--border-subtle);"
              @mouseenter="$el.style.background = 'var(--bg-elevated)'"
              @mouseleave="$el.style.background = 'transparent'"
            >
              <span class="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0" style="background: var(--bg-elevated);">👤</span>
              โปรไฟล์
            </NuxtLink>
            <button
              @click="handleLogout"
              :disabled="isLoggingOut"
              class="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-rose-400 hover:text-rose-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              @mouseenter="$el.style.background = 'rgba(244,63,94,0.06)'"
              @mouseleave="$el.style.background = 'transparent'"
            >
              <span class="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                <span v-if="!isLoggingOut">🚪</span>
                <span v-else class="inline-block w-3.5 h-3.5 border-2 border-rose-400/40 border-t-rose-400 rounded-full animate-spin"></span>
              </span>
              {{ isLoggingOut ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ' }}
            </button>
          </div>
        </Transition>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col overflow-hidden relative z-[1]">
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

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-up-enter-from, .slide-up-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.96);
}
</style>
