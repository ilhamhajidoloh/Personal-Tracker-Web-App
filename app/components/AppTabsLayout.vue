<template>
  <div class="modern-shell">
    <!-- ========== Header ========== -->
    <header class="modern-header">
      <div class="header-container">
        <!-- Brand -->
        <NuxtLink to="/dashboard" class="brand-link" @click="closeMenus">
          <div class="brand-icon">
            <span class="brand-letter">M</span>
          </div>
          <div class="brand-text">
            <span class="brand-title">MyLife</span>
            <span class="brand-subtitle">Personal tracker</span>
          </div>
        </NuxtLink>

        <!-- Desktop Navigation -->
        <nav class="desktop-nav" aria-label="เมนูหลัก">
          <NuxtLink
            v-for="item in navItems"
            :key="item.label"
            :to="item.to || '#'"
            @click="closeMenus"
            class="desktop-nav-item"
            :class="{ 'is-active': isRouteActive(item.to) }"
            :aria-current="isRouteActive(item.to) ? 'page' : undefined"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" v-html="item.svg"></svg>
            <span class="nav-label">{{ item.label }}</span>
            <span v-if="isRouteActive(item.to)" class="active-indicator"></span>
          </NuxtLink>
        </nav>

        <div class="spacer"></div>

        <!-- Actions -->
        <div class="header-actions">
          <!-- Theme Toggle -->
          <button
            @click="toggleTheme"
            class="action-btn theme-btn"
            :aria-label="isLightTheme ? 'สลับเป็นโหมดกลางคืน' : 'สลับเป็นโหมดกลางวัน'"
          >
            <svg v-if="isLightTheme" class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>
            </svg>
            <svg v-else class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M19 5l-1.4 1.4M6.4 17.6L5 19"/>
            </svg>
          </button>

          <!-- User Menu -->
          <div class="user-menu-wrapper">
            <button
              @click="userMenuOpen = !userMenuOpen"
              class="user-trigger"
              aria-label="เมนูบัญชี"
              :aria-expanded="userMenuOpen"
            >
              <div class="user-avatar">
                <img v-if="userProfileImageUrl" :src="userProfileImageUrl" :alt="userDisplayName" class="avatar-img" />
                <span v-else class="avatar-text">{{ userInitial }}</span>
              </div>
              <div class="user-info">
                <span class="user-name">{{ userDisplayName }}</span>
                <span class="user-email">{{ userEmail }}</span>
              </div>
              <svg class="dropdown-icon" :class="{ 'is-open': userMenuOpen }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <Transition name="fade">
              <div v-if="userMenuOpen" class="menu-backdrop" @click="userMenuOpen = false"></div>
            </Transition>

            <Transition name="dropdown">
              <div v-if="userMenuOpen" class="user-dropdown" role="dialog" aria-label="เมนูบัญชี">
                <div class="dropdown-header">
                  <div class="dropdown-avatar">
                    <img v-if="userProfileImageUrl" :src="userProfileImageUrl" :alt="userDisplayName" class="avatar-img" />
                    <span v-else class="avatar-text">{{ userInitial }}</span>
                  </div>
                  <div class="dropdown-user-info">
                    <p class="dropdown-name">{{ userDisplayName }}</p>
                    <p class="dropdown-email">{{ userEmail }}</p>
                  </div>
                </div>
                <div class="dropdown-menu">
                  <NuxtLink
                    v-for="item in secondaryNav"
                    :key="item.label"
                    :to="item.to || '#'"
                    @click="closeMenus"
                    class="dropdown-item"
                  >
                    <span class="dropdown-item-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" v-html="item.svg"></svg>
                    </span>
                    <span class="dropdown-item-label">{{ item.label }}</span>
                  </NuxtLink>
                  <button
                    @click="handleLogout"
                    :disabled="isLoggingOut"
                    class="dropdown-item logout-item"
                  >
                    <span class="dropdown-item-icon logout-icon">
                      <svg v-if="!isLoggingOut" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                      </svg>
                      <span v-else class="logout-spinner"></span>
                    </span>
                    <span class="dropdown-item-label">{{ isLoggingOut ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ' }}</span>
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </header>

    <!-- Tablet Navigation -->
    <nav class="tablet-nav" aria-label="เมนูหลัก">
      <div class="tablet-nav-container">
        <NuxtLink
          v-for="item in navItems"
          :key="item.label"
          :to="item.to || '#'"
          @click="closeMenus"
          class="tablet-nav-item"
          :class="{ 'is-active': isRouteActive(item.to) }"
          :aria-current="isRouteActive(item.to) ? 'page' : undefined"
        >
          <svg class="tablet-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" v-html="item.svg"></svg>
          <span>{{ item.label }}</span>
        </NuxtLink>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="main-content">
      <slot />
    </main>

    <!-- Mobile Bottom Navigation -->
    <nav class="mobile-nav" aria-label="เมนูหลัก">
      <div class="mobile-nav-grid">
        <NuxtLink
          v-for="item in navItems"
          :key="item.label"
          :to="item.to || '#'"
          @click="closeMenus"
          class="mobile-nav-item"
          :class="{ 'is-active': isRouteActive(item.to) }"
          :aria-current="isRouteActive(item.to) ? 'page' : undefined"
        >
          <div class="mobile-icon-container">
            <svg class="mobile-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" v-html="item.svg"></svg>
            <span v-if="isRouteActive(item.to)" class="mobile-active-dot"></span>
          </div>
          <span class="mobile-label">{{ item.shortLabel || item.label }}</span>
        </NuxtLink>
      </div>
    </nav>

    <!-- Logout Overlay -->
    <Teleport to="body">
      <Transition name="overlay">
        <div v-if="isLoggingOut" class="logout-overlay">
          <div class="logout-card">
            <div class="logout-brand">
              <span>M</span>
            </div>
            <div class="logout-spinner-large"></div>
            <div class="logout-text">
              <p class="logout-title">กำลังออกจากระบบ...</p>
              <p class="logout-subtitle">กรุณารอสักครู่</p>
            </div>
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
  if (isLoggingOut.value) return

  // Show overlay immediately
  isLoggingOut.value = true
  closeMenus()

  // Give UI time to render the overlay
  await new Promise(resolve => setTimeout(resolve, 50))

  try {
    // 1. Clear session first
    signOut()
    resetBooks()

    // 2. Force clear cookie immediately
    if (import.meta.client) {
      document.cookie = 'auth_session=; Max-Age=0; Path=/; SameSite=Lax'
    }

    // 3. Wait a bit to ensure cookie is cleared and user sees the logout message
    await new Promise(resolve => setTimeout(resolve, 300))

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
  // Don't set isLoggingOut to false since we're reloading
}

watch(() => route.path, () => {
  userMenuOpen.value = false
})

onMounted(() => {
  initializeTheme()
})
</script>

<style scoped>
/* ========== Shell ========== */
.modern-shell {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--bg-app);
}

/* ========== Header ========== */
.modern-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--header-bg);
  border-bottom: 1px solid var(--border-subtle);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.header-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
  height: 4rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

@media (min-width: 640px) {
  .header-container {
    padding: 0 1.5rem;
  }
}

@media (min-width: 768px) {
  .header-container {
    height: 4.5rem;
  }
}

/* ========== Brand ========== */
.brand-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.brand-link:active {
  transform: scale(0.97);
}

.brand-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.875rem;
  background: linear-gradient(135deg, var(--brand) 0%, var(--brand) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.brand-letter {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--brand-on);
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.brand-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.brand-subtitle {
  display: none;
  font-size: 0.6875rem;
  color: var(--text-muted);
  letter-spacing: 0.02em;
}

@media (min-width: 640px) {
  .brand-subtitle {
    display: block;
  }
}

/* ========== Desktop Navigation ========== */
.desktop-nav {
  display: none;
  align-items: center;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

@media (min-width: 1024px) {
  .desktop-nav {
    display: flex;
  }
}

.desktop-nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border-radius: 0.75rem;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}

.desktop-nav-item:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.desktop-nav-item.is-active {
  background: var(--bg-card);
  color: var(--brand);
  font-weight: 600;
}

.nav-icon {
  width: 1.125rem;
  height: 1.125rem;
  flex-shrink: 0;
}

.nav-label {
  user-select: none;
}

.active-indicator {
  position: absolute;
  bottom: 0;
  left: 1rem;
  right: 1rem;
  height: 2px;
  background: var(--brand);
  border-radius: 2px 2px 0 0;
}

.spacer {
  flex: 1;
}

@media (min-width: 1024px) {
  .spacer {
    display: none;
  }
}

/* ========== Header Actions ========== */
.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.action-btn {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-btn:hover {
  background: var(--bg-elevated);
  border-color: var(--border-hover);
  color: var(--text-primary);
}

.action-btn:active {
  transform: scale(0.95);
}

.action-icon {
  width: 1.125rem;
  height: 1.125rem;
}

/* ========== User Menu ========== */
.user-menu-wrapper {
  position: relative;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.25rem;
  padding-right: 0.75rem;
  border-radius: 0.875rem;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.user-trigger:hover {
  background: var(--bg-elevated);
  border-color: var(--border-hover);
}

.user-trigger:active {
  transform: scale(0.98);
}

.user-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 0.625rem;
  background: var(--brand);
  color: var(--brand-on);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-text {
  font-size: 0.875rem;
  font-weight: 600;
}

.user-info {
  display: none;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
  max-width: 10rem;
}

@media (min-width: 640px) {
  .user-info {
    display: flex;
  }
}

.user-name {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 0.6875rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-icon {
  display: none;
  width: 1rem;
  height: 1rem;
  color: var(--text-muted);
  flex-shrink: 0;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

@media (min-width: 640px) {
  .dropdown-icon {
    display: block;
  }
}

.dropdown-icon.is-open {
  transform: rotate(180deg);
}

/* ========== User Dropdown ========== */
.menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: transparent;
}

.user-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 0.5rem);
  width: min(20rem, calc(100vw - 2rem));
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: 1rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 50;
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem;
  border-bottom: 1px solid var(--border-subtle);
}

.dropdown-avatar {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.875rem;
  background: var(--brand);
  color: var(--brand-on);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.dropdown-user-info {
  min-width: 0;
  flex: 1;
}

.dropdown-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-email {
  font-size: 0.8125rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-menu {
  padding: 0.5rem;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.75rem 0.875rem;
  border-radius: 0.625rem;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  width: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-item:hover {
  background: var(--bg-elevated);
}

.dropdown-item:active {
  transform: scale(0.98);
}

.dropdown-item-icon {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.625rem;
  background: var(--bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dropdown-item-icon svg {
  width: 1.125rem;
  height: 1.125rem;
  color: var(--text-secondary);
}

.dropdown-item-label {
  text-align: left;
}

.logout-item {
  margin-top: 0.25rem;
  color: var(--ink-rose);
}

.logout-item:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.logout-icon {
  background: var(--event-status-soon-soft);
}

.logout-icon svg {
  color: var(--ink-rose);
}

.logout-spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(180, 74, 82, 0.3);
  border-top-color: var(--ink-rose);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* ========== Tablet Navigation ========== */
.tablet-nav {
  display: none;
  position: sticky;
  top: 4rem;
  z-index: 20;
  background: var(--header-bg);
  border-bottom: 1px solid var(--border-subtle);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

@media (min-width: 768px) and (max-width: 1023px) {
  .tablet-nav {
    display: block;
  }
}

.tablet-nav-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0.625rem 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.tablet-nav-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  border-radius: 0.75rem;
  text-decoration: none;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.tablet-nav-item:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.tablet-nav-item.is-active {
  background: var(--bg-card);
  color: var(--brand);
  font-weight: 600;
}

.tablet-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

/* ========== Main Content ========== */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-bottom: calc(5rem + env(safe-area-inset-bottom, 0px));
}

@media (min-width: 768px) {
  .main-content {
    padding-bottom: 0;
  }
}

/* ========== Mobile Navigation ========== */
.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 40;
  background: var(--header-bg);
  border-top: 1px solid var(--border-subtle);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

@media (min-width: 768px) {
  .mobile-nav {
    display: none;
  }
}

.mobile-nav-grid {
  max-width: 40rem;
  margin: 0 auto;
  padding: 0 0.375rem;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
}

.mobile-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.75rem 0.5rem;
  text-decoration: none;
  color: var(--text-muted);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  min-height: 3.5rem;
}

.mobile-nav-item.is-active {
  color: var(--brand);
}

.mobile-icon-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-icon {
  width: 1.5rem;
  height: 1.5rem;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.mobile-nav-item.is-active .mobile-icon {
  transform: translateY(-2px);
}

.mobile-active-dot {
  position: absolute;
  top: -0.5rem;
  width: 0.25rem;
  height: 0.25rem;
  border-radius: 50%;
  background: var(--brand);
}

.mobile-label {
  font-size: 0.6875rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.mobile-nav-item.is-active .mobile-label {
  font-weight: 600;
}

/* ========== Logout Overlay ========== */
.logout-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(3, 5, 12, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.logout-card {
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: 1.5rem;
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  max-width: 22rem;
  width: calc(100% - 2rem);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}

.logout-brand {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 1rem;
  background: linear-gradient(135deg, var(--brand) 0%, var(--brand) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--brand-on);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.logout-spinner-large {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid var(--brand);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.logout-text {
  text-align: center;
}

.logout-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.logout-subtitle {
  font-size: 0.875rem;
  color: var(--text-muted);
}

/* ========== Animations ========== */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.dropdown-enter-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-leave-active {
  transition: all 0.15s cubic-bezier(0.4, 0, 1, 1);
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-0.5rem) scale(0.95);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem) scale(0.98);
}

.overlay-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.overlay-leave-active {
  transition: all 0.2s ease;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

.overlay-enter-from .logout-card {
  transform: scale(0.9);
}

.overlay-leave-to .logout-card {
  transform: scale(0.95);
}
</style>
