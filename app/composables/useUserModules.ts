export type AppModuleId = 'cashflow' | 'study-schedule' | 'todos' | 'tasks' | 'events'

export type AppModuleMeta = {
  id: AppModuleId
  label: string
  shortLabel: string
  icon: string
  description: string
  path: string
  badgeColor: string
  defaultEnabled: boolean
}

export const ALL_APP_MODULES: AppModuleMeta[] = [
  {
    id: 'cashflow',
    label: 'การเงิน & รายรับ-รายจ่าย',
    shortLabel: 'การเงิน',
    icon: '💸',
    description: 'บันทึกรายรับ-รายจ่าย ติดตามกระแสเงินสด สรุปงบ และเตือนรายจ่ายประจำ',
    path: '/cashflow',
    badgeColor: 'emerald',
    defaultEnabled: true,
  },
  {
    id: 'study-schedule',
    label: 'ตารางเรียน & คาบเรียน',
    shortLabel: 'ตารางเรียน',
    icon: '📅',
    description: 'ตารางเรียนรายสัปดาห์ นับถอยหลังคาบเรียน และแจ้งเตือนห้องเรียน',
    path: '/study-schedule',
    badgeColor: 'blue',
    defaultEnabled: true,
  },
  {
    id: 'todos',
    label: 'To-do List',
    shortLabel: 'To-do List',
    icon: '✅',
    description: 'เช็คลิสต์สิ่งที่ต้องทำประจำวัน จัดลำดับความสำคัญ และติดตามงานที่เสร็จ',
    path: '/todos',
    badgeColor: 'amber',
    defaultEnabled: true,
  },
  {
    id: 'tasks',
    label: 'จัดการงาน & โปรเจกต์ (Tasks)',
    shortLabel: 'งาน',
    icon: '📋',
    description: 'กระดาน Kanban ติดตามสถานะงาน กำหนดส่ง และความคืบหน้าของงาน',
    path: '/tasks',
    badgeColor: 'purple',
    defaultEnabled: true,
  },
  {
    id: 'events',
    label: 'กิจกรรม & นัดหมาย (Events)',
    shortLabel: 'กิจกรรม',
    icon: '🎉',
    description: 'ปฏิทินกิจกรรม นัดหมายสำคัญ และนับถอยหลังสู่เหตุการณ์สำคัญ',
    path: '/events',
    badgeColor: 'rose',
    defaultEnabled: true,
  },
]

const DEFAULT_MODULE_IDS: AppModuleId[] = ALL_APP_MODULES.map((m) => m.id)

const enabledModulesState = ref<AppModuleId[]>([...DEFAULT_MODULE_IDS])
const isInitialized = ref(false)
const activeUserId = ref<string | null>(null)

const getStorageKey = (userId: string) => `mylife_enabled_modules_${userId}`

const getValidModuleIds = (modules: unknown): AppModuleId[] => {
  if (!Array.isArray(modules)) return []
  return modules.filter((id): id is AppModuleId =>
    typeof id === 'string' && DEFAULT_MODULE_IDS.includes(id as AppModuleId)
  )
}

export const useUserModules = () => {
  const { currentUser } = useAuth()

  const initModules = () => {
    if (typeof window === 'undefined') return
    const userId = currentUser.value?.userId

    // Module preferences belong to an authenticated account only. In particular,
    // do not use a shared fallback key: that would leak one account's choice to
    // the next account that signs in on the same browser.
    if (!userId) {
      activeUserId.value = null
      enabledModulesState.value = [...DEFAULT_MODULE_IDS]
      isInitialized.value = false
      return
    }

    try {
      const stored = localStorage.getItem(getStorageKey(userId))
      if (stored) {
        const modules = getValidModuleIds(JSON.parse(stored))
        if (modules.length > 0) {
          enabledModulesState.value = modules
          activeUserId.value = userId
          isInitialized.value = true
          return
        }
      }
      enabledModulesState.value = [...DEFAULT_MODULE_IDS]
      activeUserId.value = userId
      isInitialized.value = true
    } catch (e) {
      console.error('Failed to parse saved modules:', e)
      enabledModulesState.value = [...DEFAULT_MODULE_IDS]
      activeUserId.value = userId
      isInitialized.value = true
    }
  }

  const saveModules = (modules: AppModuleId[]): boolean => {
    const userId = currentUser.value?.userId
    if (typeof window === 'undefined' || !userId) return false

    try {
      const validModules = getValidModuleIds(modules)
      if (validModules.length === 0) return false

      localStorage.setItem(getStorageKey(userId), JSON.stringify(validModules))
      enabledModulesState.value = validModules
      activeUserId.value = userId
      isInitialized.value = true
      return true
    } catch (e) {
      console.error('Failed to save modules to localStorage:', e)
      return false
    }
  }

  const isModuleEnabled = (id: AppModuleId): boolean => {
    if (
      (!isInitialized.value || activeUserId.value !== currentUser.value?.userId) &&
      typeof window !== 'undefined'
    ) {
      initModules()
    }
    return enabledModulesState.value.includes(id)
  }

  const toggleModule = (id: AppModuleId): boolean => {
    const current = [...enabledModulesState.value]
    const idx = current.indexOf(id)
    if (idx >= 0) {
      // Must keep at least 1 module enabled
      if (current.length <= 1) {
        return false
      }
      current.splice(idx, 1)
    } else {
      current.push(id)
    }
    return saveModules(current)
  }

  const enableModule = (id: AppModuleId) => {
    if (!enabledModulesState.value.includes(id)) {
      return saveModules([...enabledModulesState.value, id])
    }
    return true
  }

  const disableModule = (id: AppModuleId): boolean => {
    if (enabledModulesState.value.length <= 1) {
      return false
    }
    return saveModules(enabledModulesState.value.filter((m) => m !== id))
  }

  const setModules = (modules: AppModuleId[]) => {
    if (modules.length === 0) {
      return saveModules([...DEFAULT_MODULE_IDS])
    } else {
      return saveModules(modules)
    }
  }

  const enableAllModules = () => {
    return saveModules([...DEFAULT_MODULE_IDS])
  }

  // Watch user change to reload user-specific preferences
  if (typeof window !== 'undefined') {
    watch(
      () => currentUser.value?.userId,
      () => {
        initModules()
      },
      { immediate: true }
    )
  }

  return {
    allModules: ALL_APP_MODULES,
    enabledModules: readonly(enabledModulesState),
    isModuleEnabled,
    toggleModule,
    enableModule,
    disableModule,
    setModules,
    enableAllModules,
    initModules,
  }
}
