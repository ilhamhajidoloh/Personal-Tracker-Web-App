<template>
  <div class="min-h-[100dvh] flex flex-col" style="background: var(--bg-base);">
    <!-- ============ Top Command Bar ============ -->
    <header class="sticky top-0 z-30 glass-header">
      <div class="mx-auto w-full max-w-[1240px] px-4 sm:px-5 md:px-6">
        <div class="h-14 md:h-[58px] flex items-center gap-3 md:gap-4">
          <NuxtLink to="/dashboard" class="flex items-center gap-2.5 shrink-0 tap-scale" @click="closeMenus">
            <div
              class="w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center font-bold text-sm md:text-[15px] shrink-0"
              style="background: var(--brand); color: var(--brand-on);"
            >
              M
            </div>
            <div class="leading-none">
              <p class="font-semibold text-[15px] tracking-tight" style="color: var(--text-primary);">MyLife</p>
              <p class="hidden sm:block text-[10px] mt-0.5 tracking-wide" style="color: var(--text-muted);">Personal tracker</p>
            </div>
          </NuxtLink>

          <nav class="hidden lg:flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto no-scrollbar" aria-label="เมนูหลัก">
            <NuxtLink
              v-for="item in navItems"
              :key="item.label"
              :to="item.to || '#'"
              @click="closeMenus"
              class="group flex items-center gap-2 px-3 py-2 rounded-lg text-[13.5px] font-medium whitespace-nowrap"
              :class="isRouteActive(item.to) ? 'nav-link-active' : 'nav-link-inactive'"
              :aria-current="isRouteActive(item.to) ? 'page' : undefined"
            >
              <svg class="w-4 h-4 shrink-0 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" v-html="item.svg"></svg>
              <span>{{ item.label }}</span>
            </NuxtLink>
          </nav>

          <div class="flex-1 lg:hidden"></div>

          <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              @click="toggleTheme"
              class="w-10 h-10 rounded-lg flex items-center justify-center tap-scale touch-target"
              style="border: 1px solid var(--border-default); background: var(--bg-card); color: var(--text-secondary);"
              :aria-label="isLightTheme ? 'สลับเป็นโหมดกลางคืน' : 'สลับเป็นโหมดกลางวัน'"
            >
              <svg v-if="isLightTheme" class="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
              <svg v-else class="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M19 5l-1.4 1.4M6.4 17.6L5 19"/></svg>
            </button>

            <div class="relative">
              <button
                @click="userMenuOpen = !userMenuOpen"
                class="flex items-center gap-2 rounded-lg p-1 pr-1 sm:pr-2.5 tap-scale"
                style="border: 1px solid var(--border-default); background: var(--bg-card);"
                aria-label="เมนูบัญชี"
                :aria-expanded="userMenuOpen"
              >
                <div
                  class="w-8 h-8 rounded-md overflow-hidden flex items-center justify-center font-semibold text-[13px] shrink-0"
                  style="background: var(--brand); color: var(--brand-on);"
                >
                  <img v-if="userProfileImageUrl" :src="userProfileImageUrl" :alt="userDisplayName" class="w-full h-full object-cover" />
                  <span v-else>{{ userInitial }}</span>
                </div>
                <span class="hidden sm:block text-left leading-tight">
                  <span class="block text-[12.5px] font-medium max-w-[128px] truncate" style="color: var(--text-primary);">{{ userDisplayName }}</span>
                  <span class="block text-[11px] max-w-[128px] truncate" style="color: var(--text-muted);">{{ userEmail }}</span>
                </span>
                <svg class="w-4 h-4 shrink-0 transition-transform duration-200 hidden sm:block" :class="userMenuOpen ? 'rotate-180' : ''" :style="{ color: 'var(--text-muted)' }" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
              </button>

              <Transition name="fade">
                <div v-if="userMenuOpen" class="fixed inset-0 z-40" @click="userMenuOpen = false" aria-hidden="true"></div>
              </Transition>

              <Transition name="menu">
                <div
                  v-if="userMenuOpen"
                  class="absolute right-0 top-full mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-xl overflow-hidden z-50"
                  style="background: var(--bg-card); border: 1px solid var(--border-default); box-shadow: var(--shadow-lg);"
                  role="dialog"
                  aria-label="เมนูบัญชี"
                >
                  <div class="flex items-center gap-3 px-4 py-3.5" style="border-bottom: 1px solid var(--border-subtle);">
                    <div
                      class="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center font-semibold shrink-0"
                      style="background: var(--brand); color: var(--brand-on);"
                    >
                      <img v-if="userProfileImageUrl" :src="userProfileImageUrl" :alt="userDisplayName" class="w-full h-full object-cover" />
                      <span v-else>{{ userInitial }}</span>
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-semibold truncate" style="color: var(--text-primary);">{{ userDisplayName }}</p>
                      <p class="text-[12px] truncate" style="color: var(--text-muted);">{{ userEmail }}</p>
                    </div>
                  </div>
                  <div class="p-1.5">
                    <NuxtLink
                      v-for="item in secondaryNav"
                      :key="item.label"
                      :to="item.to || '#'"
                      @click="closeMenus"
                      class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium tap-scale nav-link-inactive"
                    >
                      <span class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style="background: var(--bg-elevated);">
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" v-html="item.svg"></svg>
                      </span>
                      {{ item.label }}
                    </NuxtLink>
                    <button
                      @click="handleLogout"
                      :disabled="isLoggingOut"
                      class="w-full flex items-center gap-3 px-3 py-2.5 mt-0.5 rounded-lg text-sm font-medium tap-scale disabled:opacity-50"
                      style="color: var(--ink-rose);"
                    >
                      <span class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style="background: var(--event-status-soon-soft);">
                        <svg v-if="!isLoggingOut" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                        <span v-else class="inline-block w-3.5 h-3.5 border-2 rounded-full animate-spin" style="border-color: rgba(180,74,82,0.28); border-top-color: var(--ink-rose);"></span>
                      </span>
                      {{ isLoggingOut ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ' }}
                    </button>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Tablet nav: wrap chips instead of a cramped scroll row -->
    <nav
      class="hidden md:block lg:hidden sticky top-14 z-20"
      style="background: var(--header-bg); border-bottom: 1px solid var(--border-subtle);"
      aria-label="เมนูหลัก"
    >
      <div class="mx-auto w-full max-w-[1240px] px-5 py-2 flex flex-wrap items-center gap-1">
        <NuxtLink
          v-for="item in navItems"
          :key="item.label"
          :to="item.to || '#'"
          @click="closeMenus"
          class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium"
          :class="isRouteActive(item.to) ? 'nav-link-active' : 'nav-link-inactive'"
          :aria-current="isRouteActive(item.to) ? 'page' : undefined"
        >
          <svg class="w-4 h-4 shrink-0 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" v-html="item.svg"></svg>
          <span>{{ item.label }}</span>
        </NuxtLink>
      </div>
    </nav>

    <main class="flex-1 flex flex-col pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:pb-0">
      <slot />
    </main>

    <!-- Mobile bottom tabs -->
    <nav
      class="md:hidden fixed bottom-0 inset-x-0 z-40 tab-bar"
      aria-label="เมนูหลัก"
    >
      <div class="mx-auto max-w-[640px] px-2 pt-1.5 grid" :style="{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }">
        <NuxtLink
          v-for="item in navItems"
          :key="item.label"
          :to="item.to || '#'"
          @click="closeMenus"
          class="tab-item flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[10.5px] font-medium leading-tight text-center tap-scale"
          :class="isRouteActive(item.to) ? 'tab-item-active' : ''"
          :aria-current="isRouteActive(item.to) ? 'page' : undefined"
        >
          <svg class="w-[20px] h-[20px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" v-html="item.svg"></svg>
          <span class="truncate max-w-full">{{ item.shortLabel || item.label }}</span>
        </NuxtLink>
      </div>
    </nav>
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
const router = useRouter()
const { currentUser: user, signOut } = useAuth()
const { isLightTheme, initializeTheme, toggleTheme } = useAppTheme()
const { isModuleEnabled } = useUserModules()

const userMenuOpen = ref(false)
const isLoggingOut = ref(false)

const closeMenus = () => {
  userMenuOpen.value = false
}

const allNavDefinitions: (NavItem & { moduleId?: string })[] = [
  { label: 'ภาพรวม', shortLabel: 'ภาพรวม', to: '/dashboard', svg: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>' },
  { moduleId: 'cashflow', label: 'การเงิน', shortLabel: 'การเงิน', to: '/cashflow', svg: '<path d="M4 5v14M4 8h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4"/><circle cx="16" cy="13" r="1.4" fill="currentColor"/>' },
  { moduleId: 'study-schedule', label: 'ตารางเรียน', shortLabel: 'ตาราง', to: '/study-schedule', svg: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>' },
  { moduleId: 'todos', label: 'To-do List', shortLabel: 'To-do', to: '/todos', svg: '<path d="M9 11l3 3 8-8"/><path d="M20 12v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h11"/>' },
  { moduleId: 'tasks', label: 'งาน', shortLabel: 'งาน', to: '/tasks', svg: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>' },
  { moduleId: 'events', label: 'กิจกรรม', shortLabel: 'กิจกรรม', to: '/events', svg: '<path d="M4 4h16v3.5l-6 5.5v6l-4 2v-8L4 7.5z"/>' },
]

const navItems = computed(() => {
  return allNavDefinitions.filter((item) => {
    if (!item.moduleId) return true
    return isModuleEnabled(item.moduleId as any)
  })
})

const secondaryNav: NavItem[] = [
  { label: 'โปรไฟล์ & ตั้งค่าฟังก์ชัน', to: '/profile', svg: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>' },
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
  try {
    isLoggingOut.value = true
    signOut()
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
  userMenuOpen.value = false
})

onMounted(() => {
  initializeTheme()
})
</script>

<style scoped>
.no-scrollbar {
  scrollbar-width: none;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.menu-enter-active, .menu-leave-active {
  transition: all 0.2s ease;
}
.menu-enter-from, .menu-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
