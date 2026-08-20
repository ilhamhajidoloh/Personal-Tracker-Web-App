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

const getStorageKey = (userId?: string) => {
  return userId ? `mylife_enabled_modules_${userId}` : 'mylife_enabled_modules'
}

export const useUserModules = () => {
  const { currentUser } = useAuth()

  const initModules = () => {
    if (typeof window === 'undefined') return
    try {
      const userKey = getStorageKey(currentUser.value?.userId)
      const stored = localStorage.getItem(userKey) || localStorage.getItem('mylife_enabled_modules')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          enabledModulesState.value = parsed.filter((id: any) =>
            DEFAULT_MODULE_IDS.includes(id as AppModuleId)
          ) as AppModuleId[]
          isInitialized.value = true
          return
        }
      }
      enabledModulesState.value = [...DEFAULT_MODULE_IDS]
      isInitialized.value = true
    } catch (e) {
      console.error('Failed to parse saved modules:', e)
      enabledModulesState.value = [...DEFAULT_MODULE_IDS]
      isInitialized.value = true
    }
  }

  const saveModules = (modules: AppModuleId[]) => {
    enabledModulesState.value = [...modules]
    if (typeof window === 'undefined') return
    try {
      const userKey = getStorageKey(currentUser.value?.userId)
      localStorage.setItem(userKey, JSON.stringify(modules))
      localStorage.setItem('mylife_enabled_modules', JSON.stringify(modules))
    } catch (e) {
      console.error('Failed to save modules to localStorage:', e)
    }
  }

  const isModuleEnabled = (id: AppModuleId): boolean => {
    if (!isInitialized.value && typeof window !== 'undefined') {
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
    saveModules(current)
    return true
  }

  const enableModule = (id: AppModuleId) => {
    if (!enabledModulesState.value.includes(id)) {
      saveModules([...enabledModulesState.value, id])
    }
  }

  const disableModule = (id: AppModuleId): boolean => {
    if (enabledModulesState.value.length <= 1) {
      return false
    }
    saveModules(enabledModulesState.value.filter((m) => m !== id))
    return true
  }

  const setModules = (modules: AppModuleId[]) => {
    if (modules.length === 0) {
      saveModules([...DEFAULT_MODULE_IDS])
    } else {
      saveModules(modules)
    }
  }

  const enableAllModules = () => {
    saveModules([...DEFAULT_MODULE_IDS])
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
