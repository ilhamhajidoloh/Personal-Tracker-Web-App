<template>
  <div class="relative flex h-[100dvh] overflow-hidden flex-col md:flex-row" style="background: var(--bg-base);">
    <!-- Ambient warm blobs -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-mesh">
      <div class="absolute -top-40 -left-24 w-[520px] h-[520px] rounded-full blur-[130px] opacity-70" style="background: radial-gradient(circle, rgba(245,104,60,0.16), transparent 70%);"></div>
      <div class="absolute -bottom-52 -right-40 w-[620px] h-[620px] rounded-full blur-[150px] opacity-60" style="background: radial-gradient(circle, rgba(246,71,139,0.13), transparent 70%);"></div>
      <div class="absolute top-1/3 left-1/2 w-[320px] h-[320px] rounded-full blur-[120px] opacity-50" style="background: radial-gradient(circle, rgba(56,189,248,0.1), transparent 70%); animation: float 24s ease-in-out infinite;"></div>
    </div>

    <!-- ============ Mobile Top Bar ============ -->
    <header class="md:hidden h-16 flex items-center justify-between px-4 shrink-0 z-30 relative glass-header">
      <div class="flex items-center gap-2.5">
        <div class="w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg glow-violet shrink-0 relative overflow-hidden" style="background: linear-gradient(135deg, var(--brand), var(--brand-2));">
          <span class="text-white font-extrabold text-base relative z-10">M</span>
          <div class="absolute inset-0 bg-gradient-to-t from-black/10 to-white/20"></div>
        </div>
        <div class="leading-none">
          <p class="font-extrabold tracking-tight text-[15px]" style="color: var(--text-primary);">MyLife</p>
          <p class="text-[10px] mt-0.5" style="color: var(--text-muted);">Personal Tracker</p>
        </div>
      </div>
      <button
        @click="userMenuOpen = !userMenuOpen"
        class="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full transition-all"
        style="background: var(--bg-card); border: 1px solid var(--border-default); box-shadow: var(--shadow-sm);"
        aria-label="เมนูบัญชี"
      >
        <span class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0" style="background: linear-gradient(135deg, #fb7185, var(--brand-2));">{{ userInitial }}</span>
        <svg class="w-4 h-4 transition-transform duration-300" :class="userMenuOpen ? 'rotate-180' : ''" :style="{ color: 'var(--text-muted)' }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </header>

    <!-- Mobile account sheet -->
    <Transition name="fade">
      <div v-if="userMenuOpen" class="md:hidden fixed inset-0 top-16 z-40 bg-black/30 backdrop-blur-sm" @click="userMenuOpen = false"></div>
    </Transition>
    <Transition name="sheet">
      <div
        v-if="userMenuOpen"
        class="md:hidden fixed top-[4.5rem] right-3 left-3 z-50 rounded-3xl overflow-hidden"
        style="background: var(--bg-card); border: 1px solid var(--border-default); box-shadow: var(--shadow-lg);"
      >
        <div class="flex items-center gap-3 px-4 py-4" style="border-bottom: 1px solid var(--border-subtle);">
          <span class="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shrink-0" style="background: linear-gradient(135deg, #fb7185, var(--brand-2));">{{ userInitial }}</span>
          <div class="min-w-0">
            <p class="text-sm font-bold truncate" style="color: var(--text-primary);">{{ userDisplayName }}</p>
            <p class="text-[11px] truncate" style="color: var(--text-muted);">{{ userEmail }}</p>
          </div>
        </div>
        <div class="p-2">
          <NuxtLink v-for="item in secondaryNav" :key="item.label" :to="item.to || '#'" @click="closeMobileMenu" class="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all nav-link-inactive">
            <span class="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0" style="background: var(--bg-elevated);">{{ item.icon }}</span>
            {{ item.label }}
          </NuxtLink>
          <button @click="toggleTheme" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all nav-link-inactive">
            <span class="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0" style="background: var(--bg-elevated);">{{ isLightTheme ? '🌙' : '☀️' }}</span>
            {{ isLightTheme ? 'โหมดกลางคืน' : 'โหมดกลางวัน' }}
          </button>
          <button
            @click="handleLogout"
            :disabled="isLoggingOut"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold text-rose-500 transition-all disabled:opacity-50"
            style="background: rgba(244,63,94,0.08);"
          >
            <span class="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
              <span v-if="!isLoggingOut">🚪</span>
              <span v-else class="inline-block w-3.5 h-3.5 border-2 border-rose-400/40 border-t-rose-500 rounded-full animate-spin"></span>
            </span>
            {{ isLoggingOut ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ' }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- ============ Desktop Sidebar ============ -->
    <aside class="hidden md:flex flex-col shrink-0 w-[272px] h-full z-20 p-3">
      <div class="flex flex-col h-full rounded-[1.75rem] overflow-hidden" style="background: var(--bg-card); border: 1px solid var(--border-subtle); box-shadow: var(--shadow-md);">
        <!-- Logo -->
        <div class="flex items-center gap-3 px-5 py-5">
          <div class="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg glow-violet shrink-0 relative overflow-hidden" style="background: linear-gradient(135deg, var(--brand), var(--brand-2));">
            <span class="text-white font-extrabold text-lg relative z-10">M</span>
            <div class="absolute inset-0 bg-gradient-to-t from-black/10 to-white/25"></div>
          </div>
          <div>
            <p class="font-extrabold text-lg leading-none tracking-tight" style="color: var(--text-primary);">MyLife</p>
            <p class="text-[11px] mt-1" style="color: var(--text-muted);">Personal Tracker</p>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-3 py-2 overflow-y-auto">
          <p class="px-3 mb-2 text-[10px] uppercase tracking-[0.18em] font-bold" style="color: var(--text-muted);">เมนูหลัก</p>
          <div class="space-y-1.5">
            <NuxtLink
              v-for="(item, index) in navItems"
              :key="item.label"
              :to="item.to || '#'"
              @click="closeMobileMenu"
              :class="['group relative flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all animate-slide-up', isRouteActive(item.to) ? 'nav-link-active' : 'nav-link-inactive']"
              :style="{ animationDelay: `${index * 0.05}s` }"
            >
              <span
                class="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 transition-transform group-hover:scale-110 group-hover:-rotate-6"
                :style="isRouteActive(item.to) ? 'background: linear-gradient(135deg, var(--brand), var(--brand-2)); box-shadow: var(--brand-glow);' : 'background: var(--bg-elevated);'"
              >{{ item.icon }}</span>
              <span class="flex-1 truncate">{{ item.label }}</span>
              <span v-if="isRouteActive(item.to)" class="w-1.5 h-1.5 rounded-full shrink-0" style="background: var(--brand);"></span>
            </NuxtLink>
          </div>

          <p class="px-3 mt-6 mb-2 text-[10px] uppercase tracking-[0.18em] font-bold" style="color: var(--text-muted);">บัญชีผู้ใช้</p>
          <div class="space-y-1.5">
            <NuxtLink
              v-for="item in secondaryNav"
              :key="item.label"
              :to="item.to || '#'"
              @click="closeMobileMenu"
              :class="['group relative flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all', isRouteActive(item.to) ? 'nav-link-active' : 'nav-link-inactive']"
            >
              <span class="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 transition-transform group-hover:scale-110" :style="isRouteActive(item.to) ? 'background: linear-gradient(135deg, var(--brand), var(--brand-2));' : 'background: var(--bg-elevated);'">{{ item.icon }}</span>
              <span class="flex-1 truncate">{{ item.label }}</span>
            </NuxtLink>
          </div>
        </nav>

        <!-- Theme toggle -->
        <div class="px-3 py-2">
          <button
            @click="toggleTheme"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all group"
            style="background: var(--bg-elevated); border: 1px solid var(--border-subtle);"
          >
            <span class="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-12" style="background: var(--bg-card);">{{ isLightTheme ? '🌙' : '☀️' }}</span>
            <span class="flex-1 text-left" style="color: var(--text-secondary);">{{ isLightTheme ? 'โหมดกลางคืน' : 'โหมดกลางวัน' }}</span>
            <span class="rounded-full relative transition-all shrink-0" style="width: 2.5rem; height: 1.375rem;" :style="!isLightTheme ? 'width: 2.5rem; height: 1.375rem; background: linear-gradient(135deg, var(--brand), var(--brand-2));' : 'width: 2.5rem; height: 1.375rem; background: var(--border-strong);'">
              <span class="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow" :style="!isLightTheme ? 'left: calc(100% - 1.125rem);' : 'left: 0.125rem;'"></span>
            </span>
          </button>
        </div>

        <!-- User -->
        <div class="px-3 pb-3 relative">
          <button
            @click="userMenuOpen = !userMenuOpen"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all"
            style="background: var(--bg-elevated); border: 1px solid var(--border-subtle);"
          >
            <div class="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0" style="background: linear-gradient(135deg, #fb7185, var(--brand-2));">{{ userInitial }}</div>
            <div class="flex-1 min-w-0 text-left">
              <p class="text-sm font-bold truncate leading-tight" style="color: var(--text-primary);">{{ userDisplayName }}</p>
              <p class="text-[11px] truncate mt-0.5" style="color: var(--text-muted);">{{ userEmail }}</p>
            </div>
            <svg class="w-4 h-4 shrink-0 transition-transform duration-300" :class="userMenuOpen ? 'rotate-180' : ''" :style="{ color: 'var(--text-muted)' }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <Transition name="slide-up">
            <div v-if="userMenuOpen" class="absolute bottom-full left-3 right-3 mb-2 rounded-2xl overflow-hidden z-50" style="background: var(--bg-card); border: 1px solid var(--border-default); box-shadow: var(--shadow-lg);">
              <NuxtLink to="/profile" @click="closeMobileMenu" class="flex items-center gap-2.5 w-full px-4 py-3 text-sm font-medium transition-all nav-link-inactive" style="color: var(--text-secondary);">
                <span class="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0" style="background: var(--bg-elevated);">👤</span>
                โปรไฟล์
              </NuxtLink>
              <button
                @click="handleLogout"
                :disabled="isLoggingOut"
                class="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-rose-500 transition-all disabled:opacity-50"
                style="border-top: 1px solid var(--border-subtle);"
              >
                <span class="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                  <span v-if="!isLoggingOut">🚪</span>
                  <span v-else class="inline-block w-3.5 h-3.5 border-2 border-rose-400/40 border-t-rose-500 rounded-full animate-spin"></span>
                </span>
                {{ isLoggingOut ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ' }}
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </aside>

    <!-- ============ Main Content ============ -->
    <main class="flex-1 flex flex-col overflow-hidden relative z-[1] pb-[4.75rem] md:pb-0 md:pr-3 md:py-3">
      <div class="flex-1 flex flex-col overflow-hidden md:rounded-[1.75rem] md:border" style="border-color: var(--border-subtle);">
        <slot />
      </div>
    </main>

    <!-- ============ Mobile Bottom Nav ============ -->
    <nav class="md:hidden fixed bottom-0 inset-x-0 z-30 px-3 pb-[env(safe-area-inset-bottom)]">
      <div class="mx-auto max-w-md flex items-stretch justify-around gap-1 my-2 px-1.5 py-1.5 rounded-[1.4rem]" style="background: var(--bg-card); border: 1px solid var(--border-default); box-shadow: var(--shadow-lg);">
        <NuxtLink
          v-for="item in navItems"
          :key="item.label"
          :to="item.to || '#'"
          @click="closeMobileMenu"
          class="flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-2xl transition-all"
          :style="isRouteActive(item.to) ? 'background: var(--brand-soft); color: var(--brand-ink);' : 'color: var(--text-muted);'"
        >
          <span class="text-lg leading-none transition-transform" :class="isRouteActive(item.to) ? 'scale-110' : ''">{{ item.icon }}</span>
          <span class="text-[9px] font-bold tracking-tight truncate max-w-[3.7rem]">{{ item.shortLabel || item.label }}</span>
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

type NavItem = {
  icon: string
  label: string
  shortLabel?: string
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

const navItems: NavItem[] = [
  { icon: '🏠', label: 'Dashboard', shortLabel: 'หน้าหลัก', to: '/dashboard' },
  { icon: '💸', label: 'รายรับรายจ่าย', shortLabel: 'การเงิน', to: '/cashflow' },
  { icon: '📅', label: 'ตารางเรียน', shortLabel: 'ตาราง', to: '/study-schedule' },
  { icon: '✅', label: 'งานและ To-do', shortLabel: 'งาน', to: '/todos' },
  { icon: '🎉', label: 'กิจกรรม', shortLabel: 'กิจกรรม', to: '/events' },
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
  transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.slide-up-enter-from, .slide-up-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.96);
}

.sheet-enter-active, .sheet-leave-active {
  transition: all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.sheet-enter-from, .sheet-leave-to {
  opacity: 0;
  transform: translateY(-12px) scale(0.97);
}
</style>
