import Swal from 'sweetalert2'

// Base SweetAlert2 instance
const swalBase = Swal.mixin({
  customClass: {
    popup: 'border border-gray-800 rounded-3xl',
    confirmButton: 'px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 font-semibold text-sm text-white border-none',
    cancelButton: 'px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 font-semibold text-sm border-none',
    actions: 'gap-3',
  },
  buttonsStyling: false,
})

// Toast mixin
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  customClass: {
    popup: 'rounded-xl border border-gray-700',
  },
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer
    toast.onmouseleave = Swal.resumeTimer
  }
})

export const useAlert = () => {
  const getThemeColors = (isToast = false) => {
    const isLight = typeof document !== 'undefined' && document.documentElement.classList.contains('theme-light')
    if (isLight) {
      return {
        background: isToast ? '#fffdf8' : '#ffffff',
        color: '#2c2925',
        iconColor: undefined
      }
    }
    return {
      background: isToast ? '#2b2739' : '#221f2e',
      color: '#f2edf6',
      iconColor: isToast ? undefined : undefined
    }
  }

  return {
    confirmDelete: async (title: string, text: string = 'การกระทำนี้ไม่สามารถย้อนกลับได้') => {
      const result = await swalBase.fire({
        ...getThemeColors(false),
        title,
        text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ใช่, ลบเลย',
        cancelButtonText: 'ยกเลิก',
        reverseButtons: true,
      })
      return result.isConfirmed
    },
    
    toastSuccess: (title: string) => {
      const themeColors = getThemeColors(true)
      Toast.fire({
        ...themeColors,
        icon: 'success',
        title,
        iconColor: themeColors.iconColor || '#34d399', // emerald-400
      })
    },

    toastError: (title: string) => {
      const themeColors = getThemeColors(true)
      Toast.fire({
        ...themeColors,
        icon: 'error',
        title,
        iconColor: themeColors.iconColor || '#fb7185', // rose-400
      })
    },

    toastWarning: (title: string) => {
      const themeColors = getThemeColors(true)
      Toast.fire({
        ...themeColors,
        icon: 'warning',
        title,
        iconColor: themeColors.iconColor || '#fbbf24', // amber-400
      })
    }
  }
}
