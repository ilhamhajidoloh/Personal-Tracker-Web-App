type SyncEventResponse = {
  synced: boolean
  reason?: string
}

type DeleteEventResponse = {
  deleted: boolean
  reason?: string
}

type SyncAllResponse = {
  success: boolean
  processedCount: number
  failedCount: number
  reason?: string
}

export const useGoogleCalendarSync = () => {
  const syncEventToGoogle = async (eventId: string): Promise<SyncEventResponse> => {
    if (!import.meta.client || !eventId) {
      return { synced: false, reason: 'skipped' }
    }

    try {
      return await $fetch<SyncEventResponse>('/api/google/sync-event', {
        method: 'POST',
        body: { eventId },
      })
    } catch (error) {
      console.error('Google Calendar sync error:', error)
      return { synced: false, reason: 'error' }
    }
  }

  const deleteEventFromGoogle = async (googleEventId: string | null | undefined): Promise<DeleteEventResponse> => {
    if (!import.meta.client || !googleEventId) {
      return { deleted: false, reason: 'skipped' }
    }

    try {
      return await $fetch<DeleteEventResponse>('/api/google/delete-event', {
        method: 'POST',
        body: { googleEventId },
      })
    } catch (error) {
      console.error('Google Calendar delete error:', error)
      return { deleted: false, reason: 'error' }
    }
  }

  const syncAllEventsToGoogle = async (): Promise<SyncAllResponse> => {
    if (!import.meta.client) {
      return { success: false, processedCount: 0, failedCount: 0, reason: 'skipped' }
    }

    try {
      return await $fetch<SyncAllResponse>('/api/google/sync-all', {
        method: 'POST',
      })
    } catch (error) {
      console.error('Google Calendar sync-all error:', error)
      return { success: false, processedCount: 0, failedCount: 0, reason: 'error' }
    }
  }

  return {
    syncEventToGoogle,
    deleteEventFromGoogle,
    syncAllEventsToGoogle,
  }
}
