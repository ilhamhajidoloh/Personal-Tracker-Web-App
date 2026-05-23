<template>
  <AppTabsLayout>
    <div class="flex-1 overflow-y-auto">
      <div class="mx-auto max-w-5xl px-6 py-8 space-y-6">
      <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold">Profile</h1>
          <p class="text-sm text-gray-400 mt-1">ข้อมูลผู้ใช้จาก Supabase Auth และตาราง profiles (ถ้ามี)</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="loadProfile"
            :disabled="isLoading"
            class="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700 text-sm transition-colors"
          >
            {{ isLoading ? 'กำลังโหลด...' : 'รีเฟรชข้อมูล' }}
          </button>
        </div>
      </header>

      <div
        v-if="errorMessage"
        class="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-200 text-sm"
      >
        {{ errorMessage }}
      </div>

      <div
        v-if="isLoading"
        class="rounded-2xl border border-gray-800 bg-gray-900 px-6 py-10 flex items-center justify-center gap-3"
      >
        <span class="inline-block w-5 h-5 border-2 border-violet-400/40 border-t-violet-400 rounded-full animate-spin"></span>
        <span class="text-gray-300">กำลังโหลดข้อมูลโปรไฟล์...</span>
      </div>

      <template v-else>
        <section class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div class="lg:col-span-1 rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xl font-bold">
              {{ avatarFallback }}
            </div>
            <h2 class="text-xl font-semibold mt-4">{{ displayName }}</h2>
            <p class="text-sm text-gray-400 mt-1 break-all">{{ currentUser?.email || '-' }}</p>
            <div class="mt-4 space-y-2 text-sm">
              <p class="text-gray-300">ชื่อ: <span class="text-gray-400">{{ firstName }}</span></p>
              <p class="text-gray-300">นามสกุล: <span class="text-gray-400">{{ lastName }}</span></p>
              <p class="text-gray-300">สถานะอีเมล: <span :class="emailConfirmed ? 'text-emerald-400' : 'text-amber-300'">{{ emailConfirmed ? 'ยืนยันแล้ว' : 'ยังไม่ยืนยัน' }}</span></p>
            </div>
          </div>

          <div class="lg:col-span-2 rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <div class="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 class="text-lg font-semibold">ข้อมูลสำคัญ</h3>
                <p class="text-sm text-gray-400 mt-1">แสดงเฉพาะข้อมูลหลักของบัญชีผู้ใช้</p>
              </div>
            </div>

            <div class="space-y-2">
              <div
                v-for="row in importantProfileRows"
                :key="row.key"
                class="grid grid-cols-1 sm:grid-cols-3 gap-2 border border-gray-800 rounded-xl px-3 py-2"
              >
                <p class="text-xs text-gray-500 uppercase tracking-wide">{{ row.key }}</p>
                <p class="sm:col-span-2 text-sm text-gray-300 break-all">{{ row.value }}</p>
              </div>
            </div>
          </div>
        </section>
        </template>
      </div>
    </div>
  </AppTabsLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

type ProfileRow = Record<string, unknown>

definePageMeta({
  middleware: 'auth',
})

useHead({
  title: 'Profile',
})

const router = useRouter()
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const isLoading = ref(true)
const errorMessage = ref('')
const profileRow = ref<ProfileRow | null>(null)

const currentUser = computed(() => user.value)

const getProfileValue = (...values: unknown[]) => {
  const matchedValue = values.find((value) => typeof value === 'string' && value.trim())

  return typeof matchedValue === 'string' ? matchedValue.trim() : ''
}

const getFallbackNamePart = (index: number) => {
  const [first = '', ...rest] = displayName.value.split(' ').filter(Boolean)

  if (index === 0) {
    return first
  }

  return rest.join(' ')
}

const firstName = computed(() => getProfileValue(
  profileRow.value?.first_name,
  currentUser.value?.user_metadata?.first_name,
  currentUser.value?.user_metadata?.given_name,
  getFallbackNamePart(0),
) || '-')

const lastName = computed(() => getProfileValue(
  profileRow.value?.last_name,
  currentUser.value?.user_metadata?.last_name,
  currentUser.value?.user_metadata?.family_name,
  getFallbackNamePart(1),
) || '-')

const displayName = computed<string>(() => {
  const profileDisplayName = getProfileValue(profileRow.value?.display_name, profileRow.value?.full_name)
  const authFullName = getProfileValue(currentUser.value?.user_metadata?.full_name, currentUser.value?.user_metadata?.name)

  return (
    profileDisplayName ||
    authFullName ||
    currentUser.value?.email?.split('@')[0] ||
    ''
  )
})

const avatarFallback = computed(() => displayName.value.trim().charAt(0).toUpperCase() || 'U')

const emailConfirmed = computed(() => Boolean(currentUser.value?.email_confirmed_at))

const createdAtText = computed(() => {
  if (!currentUser.value?.created_at) {
    return '-'
  }

  return new Date(currentUser.value.created_at).toLocaleString('th-TH')
})

const lastSignInText = computed(() => {
  if (!currentUser.value?.last_sign_in_at) {
    return '-'
  }

  return new Date(currentUser.value.last_sign_in_at).toLocaleString('th-TH')
})

const importantProfileRows = computed(() => [
  { key: 'ชื่อ', value: firstName.value },
  { key: 'นามสกุล', value: lastName.value },
  { key: 'ชื่อที่แสดง', value: displayName.value || '-' },
  { key: 'อีเมล', value: currentUser.value?.email || '-' },
  { key: 'สถานะอีเมล', value: emailConfirmed.value ? 'ยืนยันแล้ว' : 'ยังไม่ยืนยัน' },
  { key: 'สมัครเมื่อ', value: createdAtText.value },
  { key: 'เข้าใช้ล่าสุด', value: lastSignInText.value },
])

const loadProfile = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError) {
      throw userError
    }

    const authUser = userData.user

    if (!authUser) {
      await router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle()

    if (error) {
      const missingTableCodes = ['42P01', 'PGRST205']

      if (missingTableCodes.includes(error.code || '')) {
        errorMessage.value = 'ยังไม่พบตาราง profiles ในโปรเจ็กต์นี้ จึงแสดงเฉพาะข้อมูลจาก Auth ก่อน'
        profileRow.value = null
        return
      }

      throw error
    }

    profileRow.value = data as ProfileRow | null
  } catch (error: any) {
    console.error('Load profile error:', error)
    errorMessage.value = error?.message || 'โหลดข้อมูลโปรไฟล์ไม่สำเร็จ'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadProfile()
})
</script>