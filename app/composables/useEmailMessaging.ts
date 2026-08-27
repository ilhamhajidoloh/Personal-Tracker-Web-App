export type EmailNotificationPreferences = {
  enabled: boolean
  recipientEmail: string
  classReminders: boolean
  classReminderMinutes: number
  eventReminders: boolean
  taskReminders: boolean
  billReminders: boolean
}

export type EmailStatus = {
  configured: boolean
  smtpHost: string
  smtpPort: number
  smtpUserMasked: string
  userEmail: string
}

const STORAGE_KEY = 'mylife_email_notification_preferences'

const defaultPreferences: EmailNotificationPreferences = {
  enabled: true,
  recipientEmail: '',
  classReminders: true,
  classReminderMinutes: 15,
  eventReminders: true,
  taskReminders: true,
  billReminders: true,
}

export const useEmailMessaging = () => {
  const getPreferences = (): EmailNotificationPreferences => {
    if (!import.meta.client) return { ...defaultPreferences }
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return { ...defaultPreferences }
      return { ...defaultPreferences, ...JSON.parse(raw) }
    } catch {
      return { ...defaultPreferences }
    }
  }

  const savePreferences = (prefs: Partial<EmailNotificationPreferences>) => {
    if (!import.meta.client) return
    const current = getPreferences()
    const updated = { ...current, ...prefs }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch (e) {
      console.error('Failed to save email preferences to localStorage:', e)
    }
    return updated
  }

  const loadPreferences = async (): Promise<EmailNotificationPreferences> => {
    if (!import.meta.client) return { ...defaultPreferences }

    try {
      const serverPrefs = await $fetch<EmailNotificationPreferences>('/api/email/preferences')
      savePreferences(serverPrefs)
      return { ...defaultPreferences, ...serverPrefs }
    } catch (error) {
      console.error('Failed to load email preferences from server:', error)
      return getPreferences()
    }
  }

  const savePreferencesToServer = async (prefs: Partial<EmailNotificationPreferences>) => {
    const updated = savePreferences(prefs) || { ...defaultPreferences, ...prefs }
    if (!import.meta.client) return updated

    const serverPrefs = await $fetch<EmailNotificationPreferences>('/api/email/preferences', {
      method: 'PUT',
      body: updated,
    })
    savePreferences(serverPrefs)
    return { ...defaultPreferences, ...serverPrefs }
  }

  const getStatus = async (): Promise<EmailStatus> => {
    if (!import.meta.client) {
      return {
        configured: false,
        smtpHost: 'smtp.gmail.com',
        smtpPort: 465,
        smtpUserMasked: '',
        userEmail: '',
      }
    }

    try {
      return await $fetch<EmailStatus>('/api/email/status')
    } catch (error) {
      console.error('Failed to fetch email status:', error)
      return {
        configured: false,
        smtpHost: 'smtp.gmail.com',
        smtpPort: 465,
        smtpUserMasked: '',
        userEmail: '',
      }
    }
  }

  const sendTestEmail = async (options: { to?: string; smtpUser?: string; smtpPass?: string }) => {
    return await $fetch<{ success: boolean; message: string }>('/api/email/test', {
      method: 'POST',
      body: options,
    })
  }

  const notify = async (type: 'class' | 'event' | 'todo' | 'task' | 'bill', payload: any, to?: string) => {
    if (!import.meta.client) return { sent: false, skipped: true }

    const prefs = getPreferences()
    if (!prefs.enabled) return { sent: false, skipped: true, reason: 'disabled' }

    if (type === 'class' && !prefs.classReminders) return { sent: false, skipped: true, reason: 'class_disabled' }
    if (type === 'event' && !prefs.eventReminders) return { sent: false, skipped: true, reason: 'event_disabled' }
    if (type === 'todo' && !prefs.taskReminders) return { sent: false, skipped: true, reason: 'todo_disabled' }
    if (type === 'task' && !prefs.taskReminders) return { sent: false, skipped: true, reason: 'task_disabled' }
    if (type === 'bill' && !prefs.billReminders) return { sent: false, skipped: true, reason: 'bill_disabled' }

    const recipient = to || prefs.recipientEmail

    try {
      return await $fetch<{ sent: boolean; messageId?: string }>('/api/email/notify', {
        method: 'POST',
        body: {
          type,
          to: recipient,
          payload,
        },
      })
    } catch (error) {
      console.error(`Email notify failed for ${type}:`, error)
      return { sent: false, error }
    }
  }

  return {
    getPreferences,
    loadPreferences,
    savePreferences: savePreferencesToServer,
    getStatus,
    sendTestEmail,
    notify,
  }
}
