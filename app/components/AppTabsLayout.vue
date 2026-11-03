<template>
  <div class="min-h-[100dvh] flex flex-col transition-colors duration-300" style="background-color: var(--bg-base); color: var(--text-primary);">
    <!-- ========== Top Header (Desktop & Tablet) ========== -->
    <header
      class="sticky top-0 z-40 w-full transition-all duration-200"
      style="
        background: color-mix(in srgb, var(--bg-card) 85%, transparent);
        border-bottom: 1px solid var(--border-subtle);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
      "
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-[4.25rem] flex items-center justify-between gap-4">
        <!-- Brand Link -->
        <NuxtLink
          to="/dashboard"
          class="flex items-center gap-3 group focus:outline-none select-none transition-transform active:scale-95"
          @click="closeMenus"
        >
          <div
            class="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-md relative overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:scale-105"
            style="background: linear-gradient(135deg, var(--brand), var(--brand-2));"
          >
            <span>M</span>
            <div class="absolute inset-0 bg-white/15 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          <div class="flex flex-col">
            <span class="font-extrabold text-base sm:text-lg tracking-tight leading-none" style="color: var(--text-primary);">
              MyLife
            </span>
            <span class="text-[11px] font-medium tracking-wide mt-1 leading-none hidden sm:inline-block" style="color: var(--text-muted);">
              Personal Life Tracker
            </span>
          </div>
        </NuxtLink>

        <!-- Desktop Navigation (lg+) -->
        <nav class="hidden lg:flex items-center gap-1.5 p-1 rounded-2xl border" style="background: var(--bg-elevated); border-color: var(--border-subtle);">
          <NuxtLink
            v-for="item in navItems"
            :key="item.label"
            :to="item.to || '#'"
            @click="closeMenus"
            class="relative px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all duration-200 select-none"
            :class="[
              isRouteActive(item.to)
                ? 'shadow-sm font-bold'
                : 'hover:text-primary hover:bg-black/5 dark:hover:bg-white/5'
            ]"
            :style="
              isRouteActive(item.to)
                ? {
                    background: 'var(--bg-card)',
                    color: 'var(--brand-ink)',
                    boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.08)'
                  }
                : {
                    color: 'var(--text-secondary)'
                  }
            "
            :aria-current="isRouteActive(item.to) ? 'page' : undefined"
          >
            <svg
              class="w-4 h-4 shrink-0 transition-transform duration-200"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              v-html="item.svg"
            ></svg>
            <span>{{ item.label }}</span>
            <span
              v-if="isRouteActive(item.to)"
              class="w-1.5 h-1.5 rounded-full"
              style="background: var(--brand);"
            ></span>
          </NuxtLink>
        </nav>

        <!-- Header Actions: Theme Switcher & User Profile -->
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Theme Toggle Button -->
          <button
            type="button"
            @click="toggleTheme"
            class="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 border hover:scale-105 active:scale-95"
            style="
              background: var(--bg-card);
              border-color: var(--border-default);
              color: var(--text-secondary);
            "
            :title="isLightTheme ? 'สลับเป็นโหมดมืด (Dark Mode)' : 'สลับเป็นโหมดสว่าง (Light Mode)'"
            :aria-label="isLightTheme ? 'สลับเป็นโหมดมืด' : 'สลับเป็นโหมดสว่าง'"
          >
            <Transition name="fade" mode="out-in">
              <!-- Moon icon (when in light mode) -->
              <svg v-if="isLightTheme" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
              <!-- Sun icon (when in night mode) -->
              <svg v-else class="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            </Transition>
          </button>

          <!-- User Menu Dropdown -->
          <div class="relative">
            <button
              type="button"
              @click="userMenuOpen = !userMenuOpen"
              class="flex items-center gap-2.5 p-1.5 sm:pr-3 rounded-2xl border transition-all duration-200 select-none hover:shadow-sm active:scale-95"
              style="
                background: var(--bg-card);
                border-color: var(--border-default);
              "
              aria-label="เมนูผู้ใช้งาน"
              :aria-expanded="userMenuOpen"
            >
              <!-- User Avatar -->
              <div
                class="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white overflow-hidden shadow-sm shrink-0"
                style="background: linear-gradient(135deg, var(--brand), var(--brand-strong));"
              >
                <img
                  v-if="userProfileImageUrl"
                  :src="userProfileImageUrl"
                  :alt="userDisplayName"
                  class="w-full h-full object-cover"
                />
                <span v-else>{{ userInitial }}</span>
              </div>

              <!-- User Text Info (sm+) -->
              <div class="hidden sm:flex flex-col text-left max-w-[130px] md:max-w-[160px] truncate leading-tight">
                <span class="text-xs font-bold truncate" style="color: var(--text-primary);">{{ userDisplayName }}</span>
                <span class="text-[10px] truncate mt-0.5" style="color: var(--text-muted);">{{ userEmail }}</span>
              </div>

              <!-- Chevron -->
              <svg
                class="w-4 h-4 transition-transform duration-200 hidden sm:block"
                :class="{ 'rotate-180': userMenuOpen }"
                style="color: var(--text-muted);"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2.2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Backdrop for dropdown -->
            <div
              v-if="userMenuOpen"
              class="fixed inset-0 z-40 bg-transparent"
              @click="userMenuOpen = false"
            ></div>

            <!-- Popover Menu -->
            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0 scale-95 -translate-y-2"
              enter-to-class="opacity-100 scale-100 translate-y-0"
              leave-active-class="transition-all duration-150 ease-in"
              leave-from-class="opacity-100 scale-100 translate-y-0"
              leave-to-class="opacity-0 scale-95 -translate-y-2"
            >
              <div
                v-if="userMenuOpen"
                class="absolute right-0 mt-2.5 w-72 rounded-2xl border shadow-2xl z-50 overflow-hidden p-2"
                style="
                  background: var(--bg-card);
                  border-color: var(--border-default);
                  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.25);
                "
              >
                <!-- Profile Header Card inside dropdown -->
                <div class="p-3 rounded-xl mb-1 flex items-center gap-3 border" style="background: var(--bg-elevated); border-color: var(--border-subtle);">
                  <div
                    class="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0 overflow-hidden shadow-sm"
                    style="background: linear-gradient(135deg, var(--brand), var(--brand-strong));"
                  >
                    <img
                      v-if="userProfileImageUrl"
                      :src="userProfileImageUrl"
                      :alt="userDisplayName"
                      class="w-full h-full object-cover"
                    />
                    <span v-else>{{ userInitial }}</span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-bold truncate leading-tight" style="color: var(--text-primary);">{{ userDisplayName }}</p>
                    <p class="text-xs truncate mt-0.5 leading-tight" style="color: var(--text-muted);">{{ userEmail }}</p>
                  </div>
                </div>

                <!-- Secondary Nav (Profile / Settings) -->
                <div class="space-y-1">
                  <NuxtLink
                    v-for="item in secondaryNav"
                    :key="item.label"
                    :to="item.to || '#'"
                    @click="closeMenus"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors duration-150"
                    style="color: var(--text-primary);"
                    :class="'hover:bg-[color:var(--bg-elevated)]'"
                  >
                    <div
                      class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border"
                      style="background: var(--bg-elevated); border-color: var(--border-subtle); color: var(--text-secondary);"
                    >
                      <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" v-html="item.svg"></svg>
                    </div>
                    <span>{{ item.label }}</span>
                  </NuxtLink>

                  <!-- Logout Button -->
                  <button
                    type="button"
                    @click="handleLogout"
                    :disabled="isLoggingOut"
                    class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors duration-150 disabled:opacity-50 text-left"
                    style="color: var(--ink-rose);"
                    :class="'hover:bg-red-500/10'"
                  >
                    <div
                      class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border"
                      style="background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2); color: var(--ink-rose);"
                    >
                      <svg v-if="!isLoggingOut" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                      </svg>
                      <span v-else class="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></span>
                    </div>
                    <span>{{ isLoggingOut ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ' }}</span>
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>

      <!-- Tablet Navigation Bar (md to lg) -->
      <nav
        class="hidden md:flex lg:hidden overflow-x-auto scrollbar-none px-4 sm:px-6 py-2 border-t gap-2"
        style="
          background: color-mix(in srgb, var(--bg-elevated) 70%, transparent);
          border-color: var(--border-subtle);
        "
        aria-label="เมนูหลักแท็บเล็ต"
      >
        <NuxtLink
          v-for="item in navItems"
          :key="item.label"
          :to="item.to || '#'"
          @click="closeMenus"
          class="px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all duration-150 shrink-0 select-none"
          :class="[
            isRouteActive(item.to)
              ? 'font-bold shadow-sm'
              : 'hover:bg-black/5 dark:hover:bg-white/5'
          ]"
          :style="
            isRouteActive(item.to)
              ? {
                  background: 'var(--bg-card)',
                  color: 'var(--brand-ink)',
                  border: '1px solid var(--border-default)'
                }
              : {
                  color: 'var(--text-secondary)'
                }
          "
        >
          <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" v-html="item.svg"></svg>
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>
    </header>

    <!-- ========== Main Content Container ========== -->
    <main class="flex-1 flex flex-col pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-8">
      <slot />
    </main>

    <!-- ========== Mobile Bottom App Bar (Phone screens) ========== -->
    <nav
      class="md:hidden fixed bottom-0 left-0 right-0 z-50 transition-all duration-200 border-t"
      style="
        background: color-mix(in srgb, var(--bg-card) 90%, transparent);
        border-color: var(--border-subtle);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        padding-bottom: env(safe-area-inset-bottom, 0px);
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);
      "
      aria-label="เมนูหลักสำหรับมือถือ"
    >
      <div class="grid grid-flow-col auto-cols-fr max-w-lg mx-auto px-1 py-1.5">
        <NuxtLink
          v-for="item in navItems"
          :key="item.label"
          :to="item.to || '#'"
          @click="closeMenus"
          class="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-150 select-none relative group active:scale-95"
          :style="{
            color: isRouteActive(item.to) ? 'var(--brand-ink)' : 'var(--text-muted)'
          }"
          :aria-current="isRouteActive(item.to) ? 'page' : undefined"
        >
          <!-- Active Background Pill for Mobile -->
          <div
            v-if="isRouteActive(item.to)"
            class="absolute inset-x-2 inset-y-1 rounded-xl -z-10"
            style="background: var(--brand-soft);"
          ></div>

          <!-- Icon container -->
          <div class="relative flex items-center justify-center">
            <svg
              class="w-5 h-5 transition-transform duration-150"
              :class="{ '-translate-y-0.5 scale-110': isRouteActive(item.to) }"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
              v-html="item.svg"
            ></svg>
            <span
              v-if="isRouteActive(item.to)"
              class="absolute -top-1 w-1.5 h-1.5 rounded-full"
              style="background: var(--brand);"
            ></span>
          </div>

          <span
            class="text-[10px] tracking-tight mt-1 truncate max-w-full"
            :class="isRouteActive(item.to) ? 'font-bold' : 'font-medium'"
          >
            {{ item.shortLabel || item.label }}
          </span>
        </NuxtLink>
      </div>
    </nav>

    <!-- ========== Logout Fullscreen Modal Overlay ========== -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isLoggingOut"
          class="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-xl"
          style="background: rgba(10, 15, 29, 0.85);"
        >
          <div
            class="w-full max-w-sm rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl border"
            style="
              background: var(--bg-card);
              border-color: var(--border-default);
            "
          >
            <!-- Brand Badge -->
            <div
              class="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-xl mb-6 relative overflow-hidden"
              style="background: linear-gradient(135deg, var(--brand), var(--brand-2));"
            >
              <span>M</span>
              <div class="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>

            <!-- Modern Spinner -->
            <div class="relative w-12 h-12 mb-5">
              <div
                class="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin"
                style="border-color: var(--brand); border-top-color: transparent;"
              ></div>
              <div
                class="absolute inset-2 rounded-full border-2 border-b-transparent animate-spin opacity-50"
                style="border-color: var(--brand-2); border-bottom-color: transparent; animation-direction: reverse; animation-duration: 1.2s;"
              ></div>
            </div>

            <!-- Text info -->
            <h3 class="text-lg font-bold tracking-tight mb-1" style="color: var(--text-primary);">
              กำลังออกจากระบบ...
            </h3>
            <p class="text-xs sm:text-sm" style="color: var(--text-muted);">
              กำลังเคลียร์เซสชันและพาคุณกลับสู่หน้าหลัก
            </p>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

type NavItem = {
  svg: string
  label: string
  shortLabel?: string
  to?: RouteLocationRaw
  badge?: string
}

const route = useRoute()
const { currentUser: user, signOut } = useAuth()
const { isLightTheme, initializeTheme, toggleTheme } = useAppTheme()
const { isModuleEnabled } = useUserModules()
const { resetBooks } = useFinanceBooks()

const userMenuOpen = ref(false)
const isLoggingOut = ref(false)

const closeMenus = () => {
  userMenuOpen.value = false
}

const allNavDefinitions: (NavItem & { moduleId?: string })[] = [
  {
    label: 'ภาพรวม',
    shortLabel: 'ภาพรวม',
    to: '/dashboard',
    svg: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  },
  {
    moduleId: 'cashflow',
    label: 'การเงิน',
    shortLabel: 'การเงิน',
    to: '/cashflow',
    svg: '<rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><circle cx="17" cy="15" r="1.5" fill="currentColor"/>',
  },
  {
    moduleId: 'study-schedule',
    label: 'ตารางเรียน',
    shortLabel: 'ตาราง',
    to: '/study-schedule',
    svg: '<rect x="3" y="4" width="18" height="17" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/>',
  },
  {
    moduleId: 'todos',
    label: 'To-do List',
    shortLabel: 'To-do',
    to: '/todos',
    svg: '<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  },
  {
    moduleId: 'tasks',
    label: 'งาน',
    shortLabel: 'งาน',
    to: '/tasks',
    svg: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  },
  {
    moduleId: 'events',
    label: 'กิจกรรม',
    shortLabel: 'กิจกรรม',
    to: '/events',
    svg: '<path d="M4 4h16v3.5l-6 5.5v6l-4 2v-8L4 7.5z"/>',
  },
]

const navItems = computed(() => {
  return allNavDefinitions.filter((item) => {
    if (!item.moduleId) return true
    return isModuleEnabled(item.moduleId as any)
  })
})

const secondaryNav: NavItem[] = [
  {
    label: 'โปรไฟล์ & ตั้งค่าฟังก์ชัน',
    to: '/profile',
    svg: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  },
]

const userDisplayName = computed(() => {
  return user.value?.fullName?.trim() || user.value?.email?.split('@')[0] || 'MyLife User'
})

const userInitial = computed(() => userDisplayName.value.trim().charAt(0).toUpperCase() || 'U')
const userEmail = computed(() => user.value?.email || '-')
const userProfileImageUrl = computed(() => user.value?.profileImageUrl || null)

const isRouteActive = (to?: RouteLocationRaw) => {
  if (typeof to !== 'string') return false
  if (to === '/dashboard') return route.path === to
  return route.path.startsWith(to)
}

const handleLogout = async () => {
  if (isLoggingOut.value) return

  // Show overlay immediately
  isLoggingOut.value = true
  closeMenus()

  // Give UI time to render the overlay
  await new Promise((resolve) => setTimeout(resolve, 50))

  try {
    // 1. Clear session first
    signOut()
    resetBooks()

    // 2. Force clear cookie immediately
    if (import.meta.client) {
      document.cookie = 'auth_session=; Max-Age=0; Path=/; SameSite=Lax'
    }

    // 3. Wait a bit to ensure cookie is cleared and user sees the logout message
    await new Promise((resolve) => setTimeout(resolve, 300))

    // 4. Do a full page reload to the root to clear all state
    if (import.meta.client) {
      window.location.href = '/'
    } else {
      await navigateTo('/', { replace: true, external: true })
    }
  } catch (error) {
    console.error('Logout error:', error)
    // Even if there's an error, force reload
    if (import.meta.client) {
      window.location.href = '/'
    }
  }
}

watch(
  () => route.path,
  () => {
    userMenuOpen.value = false
  }
)

onMounted(() => {
  initializeTheme()
})
</script>
