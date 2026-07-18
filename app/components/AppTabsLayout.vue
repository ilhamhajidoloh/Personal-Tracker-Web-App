<template>
  <div class="min-h-[100dvh] flex flex-col" style="background: var(--bg-base);">
    <!-- ============ Top Command Bar ============ -->
    <header class="sticky top-0 z-30 glass-header">
      <div class="mx-auto w-full max-w-[1240px] px-4 md:px-6">
        <!-- primary row -->
        <div class="h-14 md:h-[60px] flex items-center gap-4">
          <!-- brand -->
          <NuxtLink to="/dashboard" class="flex items-center gap-2.5 shrink-0 tap-scale" @click="closeMenus">
            <div class="w-9 h-9 rounded-[10px] flex items-center justify-center text-white font-extrabold text-base shrink-0 relative overflow-hidden" style="background: linear-gradient(150deg, var(--brand), var(--brand-2)); box-shadow: 0 6px 16px -6px var(--brand);">
              <span class="relative z-10">M</span>
              <span class="absolute inset-0" style="background: linear-gradient(180deg, rgba(255,255,255,0.28), transparent 55%);"></span>
            </div>
            <div class="hidden sm:block leading-none">
              <p class="font-extrabold text-[15px] tracking-tight" style="color: var(--text-primary);">MyLife</p>
              <p class="eyebrow mt-0.5">ledger</p>
            </div>
          </NuxtLink>

          <!-- desktop nav -->
          <nav class="hidden md:flex items-center gap-1 flex-1 min-w-0 overflow-x-auto no-scrollbar" aria-label="เมนูหลัก">
            <NuxtLink
              v-for="item in navItems"
              :key="item.label"
              :to="item.to || '#'"
              @click="closeMenus"
              class="group flex items-center gap-2 px-3 py-2 rounded-[9px] text-[13.5px] font-semibold whitespace-nowrap transition-all"
              :class="isRouteActive(item.to) ? 'nav-link-active' : 'nav-link-inactive'"
              :aria-current="isRouteActive(item.to) ? 'page' : undefined"
            >
              <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" v-html="item.svg"></svg>
              <span>{{ item.label }}</span>
            </NuxtLink>
          </nav>

          <div class="flex-1 md:hidden"></div>

          <!-- right actions -->
          <div class="flex items-center gap-2 shrink-0">
            <button
              @click="toggleTheme"
              class="w-9 h-9 rounded-[10px] flex items-center justify-center transition-all tap-scale"
              style="border: 1px solid var(--border-default); background: var(--bg-card); color: var(--text-secondary);"
              :aria-label="isLightTheme ? 'สลับเป็นโหมดกลางคืน' : 'สลับเป็นโหมดกลางวัน'"
            >
              <svg v-if="isLightTheme" class="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
              <svg v-else class="w-[17px] h-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M19 5l-1.4 1.4M6.4 17.6L5 19"/></svg>
            </button>

            <!-- account -->
            <div class="relative">
              <button
                @click="userMenuOpen = !userMenuOpen"
                class="flex items-center gap-2 rounded-[10px] p-1 pr-1.5 sm:pr-2.5 transition-all tap-scale"
                style="border: 1px solid var(--border-default); background: var(--bg-card);"
                aria-label="เมนูบัญชี"
                :aria-expanded="userMenuOpen"
              >
                <span class="w-[30px] h-[30px] rounded-[7px] flex items-center justify-center font-bold text-[13px] text-white shrink-0" style="background: linear-gradient(150deg, var(--brand), var(--brand-2));">{{ userInitial }}</span>
                <span class="hidden sm:block text-left leading-tight">
                  <span class="block text-[12.5px] font-semibold max-w-[120px] truncate" style="color: var(--text-primary);">{{ userDisplayName }}</span>
                  <span class="block text-[10.5px] max-w-[120px] truncate num" style="color: var(--text-muted);">{{ userEmail }}</span>
                </span>
                <svg class="w-4 h-4 shrink-0 transition-transform duration-200 hidden sm:block" :class="userMenuOpen ? 'rotate-180' : ''" :style="{ color: 'var(--text-muted)' }" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M19 9l-7 7-7-7" /></svg>
              </button>

              <!-- backdrop -->
              <Transition name="fade">
                <div v-if="userMenuOpen" class="fixed inset-0 z-40" @click="userMenuOpen = false" aria-hidden="true"></div>
              </Transition>

              <Transition name="menu">
                <div
                  v-if="userMenuOpen"
                  class="absolute right-0 top-full mt-2 w-64 rounded-[14px] overflow-hidden z-50"
                  style="background: var(--bg-card); border: 1px solid var(--border-default); box-shadow: var(--shadow-lg);"
                  role="dialog"
                  aria-label="เมนูบัญชี"
                >
                  <div class="flex items-center gap-3 px-4 py-3.5" style="border-bottom: 1px solid var(--border-subtle);">
                    <span class="w-10 h-10 rounded-[9px] flex items-center justify-center font-bold text-white shrink-0" style="background: linear-gradient(150deg, var(--brand), var(--brand-2));">{{ userInitial }}</span>
                    <div class="min-w-0">
                      <p class="text-sm font-bold truncate" style="color: var(--text-primary);">{{ userDisplayName }}</p>
                      <p class="text-[11px] truncate num" style="color: var(--text-muted);">{{ userEmail }}</p>
                    </div>
                  </div>
                  <div class="p-2">
                    <NuxtLink
                      v-for="item in secondaryNav"
                      :key="item.label"
                      :to="item.to || '#'"
                      @click="closeMenus"
                      class="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-all tap-scale nav-link-inactive"
                    >
                      <span class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style="background: var(--bg-elevated); border: 1px solid var(--border-subtle);">
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" v-html="item.svg"></svg>
                      </span>
                      {{ item.label }}
                    </NuxtLink>
                    <button
                      @click="handleLogout"
                      :disabled="isLoggingOut"
                      class="w-full flex items-center gap-3 px-3 py-2.5 mt-1 rounded-[10px] text-sm font-semibold transition-all tap-scale disabled:opacity-50"
                      style="color: var(--ink-rose); background: rgba(208,39,72,0.08);"
                    >
                      <span class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style="background: rgba(208,39,72,0.1);">
                        <svg v-if="!isLoggingOut" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                        <span v-else class="inline-block w-3.5 h-3.5 border-2 rounded-full animate-spin" style="border-color: rgba(208,39,72,0.35); border-top-color: var(--ink-rose);"></span>
                      </span>
                      {{ isLoggingOut ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ' }}
                    </button>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>

        <!-- mobile nav row -->
        <nav class="md:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1 pb-2.5" aria-label="เมนูหลัก">
          <NuxtLink
            v-for="item in navItems"
            :key="item.label"
            :to="item.to || '#'"
            @click="closeMenus"
            class="flex items-center gap-1.5 px-3 py-2 rounded-[9px] text-[12.5px] font-semibold whitespace-nowrap transition-all shrink-0"
            :class="isRouteActive(item.to) ? 'nav-link-active' : 'nav-link-inactive'"
            :aria-current="isRouteActive(item.to) ? 'page' : undefined"
          >
            <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" v-html="item.svg"></svg>
            <span>{{ item.label }}</span>
          </NuxtLink>
        </nav>
      </div>
    </header>

    <!-- ============ Main Content ============ -->
    <main class="flex-1 flex flex-col">
      <slot />
    </main>
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
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { isLightTheme, initializeTheme, toggleTheme } = useAppTheme()

const userMenuOpen = ref(false)
const isLoggingOut = ref(false)

const closeMenus = () => {
  userMenuOpen.value = false
}

const navItems: NavItem[] = [
  { label: 'ภาพรวม', to: '/dashboard', svg: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>' },
  { label: 'การเงิน', to: '/cashflow', svg: '<path d="M4 5v14M4 8h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4"/><circle cx="16" cy="13" r="1.4" fill="currentColor"/>' },
  { label: 'ตารางเรียน', to: '/study-schedule', svg: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>' },
  { label: 'งาน', to: '/todos', svg: '<path d="M9 11l3 3 8-8"/><path d="M20 12v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h11"/>' },
  { label: 'กิจกรรม', to: '/events', svg: '<path d="M4 4h16v3.5l-6 5.5v6l-4 2v-8L4 7.5z"/>' },
]

const secondaryNav: NavItem[] = [
  { label: 'โปรไฟล์', to: '/profile', svg: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>' },
  { label: 'ทดสอบฐานข้อมูล', to: '/supabase-test', svg: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>' },
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
  transition: all 0.2s cubic-bezier(0.2, 0.9, 0.3, 1.2);
}
.menu-enter-from, .menu-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
}
</style>
