export interface FinanceBook {
  id: string
  userId: string
  name: string
  icon: string
  color: string
  isDefault: boolean
  createdAt: string
}

export interface CreateBookPayload {
  name: string
  icon?: string
  color?: string
  isDefault?: boolean
}

export const BOOK_COLOR_PRESETS = [
  '#8b5cf6', // Violet
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Rose / Red
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#f97316', // Orange
]

export const BOOK_ICON_PRESETS = [
  '🏠', '💼', '💰', '🛒', '✈️', '🎯', '🍔', '🛍️', '🎓', '🏥', '🚗', '🎮', '💡', '💎', '📈', '🐾'
]

export const useFinanceBooks = () => {
  const { apiFetch, userId } = useBackendApi()
  const books = useState<FinanceBook[]>('finance_books', () => [])
  const isLoadingBooks = useState<boolean>('finance_books_loading', () => false)
  const selectedBookId = useState<string>('finance_selected_book_id', () => 'all')

  const currentUserId = computed(() => userId.value || '')

  const selectedBook = computed<FinanceBook | null>(() => {
    if (!selectedBookId.value || selectedBookId.value === 'all') return null
    return books.value.find(b => b.id === selectedBookId.value) || null
  })

  const defaultBook = computed<FinanceBook | null>(() => {
    return books.value.find(b => b.isDefault) || books.value[0] || null
  })

  const fetchBooks = async (targetUserId?: string): Promise<FinanceBook[]> => {
    const uid = targetUserId || currentUserId.value
    if (!uid) return []

    isLoadingBooks.value = true
    try {
      const data = await apiFetch<FinanceBook[]>(`/api/Finance/books/${uid}`)
      books.value = Array.isArray(data) ? data : []

      // If user had a stored preference in localStorage, restore it
      if (typeof window !== 'undefined') {
        const savedId = localStorage.getItem(`mylife_selected_book_${uid}`)
        if (savedId && (savedId === 'all' || books.value.some(b => b.id === savedId))) {
          selectedBookId.value = savedId
        } else if (selectedBookId.value !== 'all' && !books.value.some(b => b.id === selectedBookId.value)) {
          selectedBookId.value = defaultBook.value?.id || 'all'
        }
      }

      return books.value
    } catch (err) {
      console.error('Failed to fetch finance books:', err)
      return []
    } finally {
      isLoadingBooks.value = false
    }
  }

  const selectBook = (bookId: string) => {
    selectedBookId.value = bookId
    if (typeof window !== 'undefined' && currentUserId.value) {
      localStorage.setItem(`mylife_selected_book_${currentUserId.value}`, bookId)
    }
  }

  const createBook = async (payload: CreateBookPayload): Promise<FinanceBook | null> => {
    try {
      const newBook = await apiFetch<FinanceBook>('/api/Finance/books', {
        method: 'POST',
        body: {
          name: payload.name.trim(),
          icon: payload.icon || '💼',
          color: payload.color || '#8b5cf6',
          isDefault: Boolean(payload.isDefault),
        },
      })
      await fetchBooks()
      if (newBook?.id) {
        selectBook(newBook.id)
      }
      return newBook
    } catch (err) {
      console.error('Failed to create finance book:', err)
      throw err
    }
  }

  const updateBook = async (id: string, payload: Partial<CreateBookPayload>): Promise<FinanceBook | null> => {
    try {
      const updated = await apiFetch<FinanceBook>(`/api/Finance/books/${id}`, {
        method: 'PUT',
        body: payload,
      })
      await fetchBooks()
      return updated
    } catch (err) {
      console.error('Failed to update finance book:', err)
      throw err
    }
  }

  const deleteBook = async (id: string): Promise<boolean> => {
    try {
      const res = await apiFetch<{ message: string; fallbackBookId?: string }>(`/api/Finance/books/${id}`, {
        method: 'DELETE',
      })
      await fetchBooks()
      if (selectedBookId.value === id) {
        selectBook(res.fallbackBookId || 'all')
      }
      return true
    } catch (err) {
      console.error('Failed to delete finance book:', err)
      throw err
    }
  }

  return {
    books,
    isLoadingBooks,
    selectedBookId,
    selectedBook,
    defaultBook,
    fetchBooks,
    selectBook,
    createBook,
    updateBook,
    deleteBook,
  }
}
