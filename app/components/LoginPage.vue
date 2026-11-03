<template>
  <div
    class="min-h-[100dvh] flex flex-col justify-center relative overflow-hidden transition-colors duration-300"
    style="background-color: var(--bg-base); color: var(--text-primary);"
  >
    <!-- Top-Right Floating Theme Toggle -->
    <div class="absolute top-4 right-4 z-30">
      <button
        type="button"
        @click="toggleTheme"
        class="w-10 h-10 rounded-2xl flex items-center justify-center border shadow-xs transition-all duration-200 hover:scale-105 active:scale-95"
        style="
          background: var(--bg-card);
          border-color: var(--border-default);
          color: var(--text-secondary);
        "
        :title="isLightTheme ? 'สลับเป็นโหมดมืด (Dark Mode)' : 'สลับเป็นโหมดสว่าง (Light Mode)'"
        :aria-label="isLightTheme ? 'สลับเป็นโหมดมืด' : 'สลับเป็นโหมดสว่าง'"
      >
        <svg v-if="isLightTheme" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
        <svg v-else class="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      </button>
    </div>

    <!-- Loading Overlay -->
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isCheckingSession || isRedirecting"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
        style="background: color-mix(in srgb, var(--bg-base) 80%, transparent);"
      >
        <div
          class="max-w-xs w-full p-8 rounded-3xl border shadow-xl flex flex-col items-center text-center"
          style="background: var(--bg-card); border-color: var(--border-default);"
        >
          <div class="relative w-12 h-12 mb-4">
            <div
              class="w-12 h-12 rounded-full border-3 border-t-transparent animate-spin"
              style="border-color: var(--brand); border-top-color: transparent;"
            ></div>
          </div>
          <h2 class="text-base font-bold tracking-tight" style="color: var(--text-primary);">
            {{ isRedirecting ? 'กำลังพาไปที่ Dashboard' : 'กำลังตรวจสอบเซสชัน' }}
          </h2>
          <p class="text-xs mt-1.5 leading-relaxed" style="color: var(--text-muted);">
            {{ sessionCheckHint }}
          </p>
        </div>
      </div>
    </Transition>

    <!-- Main Grid: Left Showcase, Right Form (Synced with Theme Tokens) -->
    <div class="w-full flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[100dvh]">
      <!-- Left Showcase Panel (Desktop lg+) -->
      <div
        class="hidden lg:flex lg:col-span-5 xl:col-span-6 flex-col justify-between p-10 xl:p-14 relative overflow-hidden border-r transition-colors duration-300"
        style="
          background: color-mix(in srgb, var(--bg-elevated) 70%, var(--bg-base));
          border-color: var(--border-subtle);
        "
      >
        <!-- Subtle Ambient Lighting (Uses CSS variable so it adapts to Light/Dark) -->
        <div
          class="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[100px] opacity-20 pointer-events-none"
          style="background: var(--brand);"
        ></div>
        <div
          class="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-[100px] opacity-15 pointer-events-none"
          style="background: var(--brand-2);"
        ></div>

        <!-- Brand Top -->
        <div class="relative z-10 flex items-center gap-3">
          <div
            class="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-md select-none"
            style="background: linear-gradient(135deg, var(--brand), var(--brand-2)); color: var(--brand-on);"
          >
            M
          </div>
          <div>
            <h1 class="text-xl font-extrabold tracking-tight leading-none" style="color: var(--text-primary);">
              MyLife
            </h1>
            <p class="text-xs font-semibold mt-1 leading-none" style="color: var(--brand-ink);">
              All-in-one Life Organizer
            </p>
          </div>
        </div>

        <!-- Middle Hero Info -->
        <div class="relative z-10 my-auto py-6">
          <div
            class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border shadow-2xs"
            style="
              background: var(--brand-soft);
              border-color: var(--brand-border);
              color: var(--brand-ink);
            "
          >
            <span class="w-2 h-2 rounded-full animate-pulse" style="background: var(--ink-emerald);"></span>
            <span>จัดการทุกมิติของชีวิตอย่างเป็นระบบ</span>
          </div>

          <h2
            class="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight"
            style="color: var(--text-primary);"
          >
            ชีวิตที่ลงตัว เริ่มต้นที่นี่<br />
            <span
              class="text-transparent bg-clip-text"
              style="background-image: linear-gradient(120deg, var(--brand), var(--brand-2));"
            >
              การเงิน • เรียน • งาน • เวลา
            </span>
          </h2>

          <p class="mt-4 text-xs sm:text-sm leading-relaxed max-w-md" style="color: var(--text-secondary);">
            ติดตามสถานะการเงิน บันทึกตารางเรียน จัดลำดับงาน To-do และกิจกรรมสำคัญในปฏิทิน สะดวกสบายผ่านหน้าจอเดียว
          </p>

          <!-- Feature Cards Grid Preview -->
          <div class="grid grid-cols-2 gap-3.5 mt-8">
            <div
              v-for="f in features"
              :key="f.label"
              class="p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
              style="
                background: var(--bg-card);
                border-color: var(--border-default);
              "
            >
              <div class="text-2xl mb-2">{{ f.icon }}</div>
              <h4 class="text-xs sm:text-sm font-extrabold" style="color: var(--text-primary);">
                {{ f.label }}
              </h4>
              <p class="text-[11px] mt-0.5 leading-snug line-clamp-2" style="color: var(--text-muted);">
                {{ f.desc }}
              </p>
            </div>
          </div>
        </div>

        <!-- Bottom Footer -->
        <div
          class="relative z-10 flex items-center justify-between text-xs pt-5 border-t"
          style="border-color: var(--border-subtle); color: var(--text-muted);"
        >
          <span>&copy; {{ new Date().getFullYear() }} MyLife Tracker</span>
          <span class="flex items-center gap-1.5 font-medium">
            <span class="w-1.5 h-1.5 rounded-full" style="background: var(--ink-emerald);"></span>
            ปลอดภัยและเป็นส่วนตัว
          </span>
        </div>
      </div>

      <!-- Right Form Section (Desktop & Mobile) -->
      <div class="col-span-1 lg:col-span-7 xl:col-span-6 flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12">
        <div class="w-full max-w-md my-auto">
          <!-- Mobile Brand Heading (Hidden on Desktop) -->
          <div class="lg:hidden flex items-center justify-center gap-3 mb-6">
            <div
              class="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm"
              style="background: linear-gradient(135deg, var(--brand), var(--brand-2)); color: var(--brand-on);"
            >
              M
            </div>
            <div>
              <h1 class="text-xl font-extrabold tracking-tight leading-none" style="color: var(--text-primary);">
                MyLife
              </h1>
              <p class="text-[11px] font-medium mt-1 leading-none" style="color: var(--text-muted);">
                Personal tracker
              </p>
            </div>
          </div>

          <!-- Card Wrapper -->
          <div
            class="p-6 sm:p-8 rounded-3xl border shadow-lg transition-all duration-300"
            style="
              background: var(--bg-card);
              border-color: var(--border-default);
              box-shadow: var(--shadow-md);
            "
          >
            <!-- Form Header -->
            <div class="text-center mb-6">
              <h2 class="text-2xl font-extrabold tracking-tight" style="color: var(--text-primary);">
                {{ isSignUp ? 'สร้างบัญชีใหม่' : 'ยินดีต้อนรับกลับ' }}
              </h2>
              <p class="text-xs sm:text-sm mt-1.5" style="color: var(--text-secondary);">
                {{ isSignUp ? 'เริ่มต้นจัดการชีวิตและฟังก์ชันที่คุณต้องการ' : 'เข้าสู่ระบบเพื่อใช้งานระบบติดตามส่วนตัว' }}
              </p>
            </div>

            <!-- Mode Switcher (Sign In / Sign Up) -->
            <div
              class="p-1 rounded-2xl flex items-center gap-1 mb-6 border"
              style="background: var(--bg-elevated); border-color: var(--border-subtle);"
            >
              <button
                type="button"
                @click="isSignUp = false"
                class="flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-200 select-none"
                :style="
                  !isSignUp
                    ? { background: 'var(--bg-card)', color: 'var(--brand-ink)', boxShadow: '0 2px 6px -1px rgba(0,0,0,0.08)' }
                    : { color: 'var(--text-muted)', background: 'transparent' }
                "
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                <span>เข้าสู่ระบบ</span>
              </button>

              <button
                type="button"
                @click="isSignUp = true"
                class="flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-200 select-none"
                :style="
                  isSignUp
                    ? { background: 'var(--bg-card)', color: 'var(--brand-ink)', boxShadow: '0 2px 6px -1px rgba(0,0,0,0.08)' }
                    : { color: 'var(--text-muted)', background: 'transparent' }
                "
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                <span>สมัครสมาชิก</span>
              </button>
            </div>

            <!-- Alert Messages -->
            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0 -translate-y-2 scale-98"
              enter-to-class="opacity-100 translate-y-0 scale-100"
              leave-active-class="transition-all duration-150 ease-in"
              leave-from-class="opacity-100 translate-y-0 scale-100"
              leave-to-class="opacity-0 -translate-y-2 scale-98"
            >
              <div
                v-if="errorMessage"
                class="mb-5 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs sm:text-sm border"
                style="
                  background: rgba(239, 68, 68, 0.08);
                  border-color: rgba(239, 68, 68, 0.25);
                  color: var(--ink-rose);
                "
                role="alert"
              >
                <svg class="w-5 h-5 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span class="flex-1 leading-snug">{{ errorMessage }}</span>
              </div>
            </Transition>

            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0 -translate-y-2 scale-98"
              enter-to-class="opacity-100 translate-y-0 scale-100"
              leave-active-class="transition-all duration-150 ease-in"
              leave-from-class="opacity-100 translate-y-0 scale-100"
              leave-to-class="opacity-0 -translate-y-2 scale-98"
            >
              <div
                v-if="successMessage"
                class="mb-5 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs sm:text-sm border"
                style="
                  background: rgba(34, 197, 94, 0.08);
                  border-color: rgba(34, 197, 94, 0.25);
                  color: var(--ink-emerald);
                "
                role="status"
              >
                <svg class="w-5 h-5 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span class="flex-1 leading-snug">{{ successMessage }}</span>
              </div>
            </Transition>

            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0 -translate-y-2 scale-98"
              enter-to-class="opacity-100 translate-y-0 scale-100"
              leave-active-class="transition-all duration-150 ease-in"
              leave-from-class="opacity-100 translate-y-0 scale-100"
              leave-to-class="opacity-0 -translate-y-2 scale-98"
            >
              <div
                v-if="isLoading && loadingHint"
                class="mb-5 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs sm:text-sm border"
                style="
                  background: rgba(245, 158, 11, 0.08);
                  border-color: rgba(245, 158, 11, 0.25);
                  color: var(--ink-amber);
                "
              >
                <svg class="w-5 h-5 shrink-0 mt-0.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                <span class="flex-1 leading-snug">{{ loadingHint }}</span>
              </div>
            </Transition>

            <!-- Sign In Form -->
            <form v-if="!isSignUp" @submit.prevent="handleSignIn" class="space-y-4">
              <!-- Email Input -->
              <div class="space-y-1.5">
                <label class="block text-xs font-bold" style="color: var(--text-secondary);">
                  อีเมล (Email)
                </label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style="color: var(--text-muted);">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <input
                    v-model="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    autocomplete="email"
                    class="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm border transition-all duration-200 outline-none"
                    style="
                      background: var(--bg-elevated);
                      border-color: var(--border-default);
                      color: var(--text-primary);
                    "
                  />
                </div>
              </div>

              <!-- Password Input -->
              <div class="space-y-1.5">
                <label class="block text-xs font-bold" style="color: var(--text-secondary);">
                  รหัสผ่าน (Password)
                </label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style="color: var(--text-muted);">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <input
                    v-model="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    autocomplete="current-password"
                    class="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm border transition-all duration-200 outline-none"
                    style="
                      background: var(--bg-elevated);
                      border-color: var(--border-default);
                      color: var(--text-primary);
                    "
                  />
                </div>
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                :disabled="isLoading"
                class="w-full py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm shadow-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                style="
                  background: var(--brand);
                  color: var(--brand-on);
                  box-shadow: 0 4px 14px -3px var(--brand);
                "
              >
                <span v-if="isLoading" class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                <span>{{ isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ' }}</span>
              </button>
            </form>

            <!-- Sign Up Form (2 Steps) -->
            <div v-else>
              <!-- Step 1: Credentials -->
              <form v-if="signUpStep === 'credentials'" @submit.prevent="proceedToModuleSelection" class="space-y-4">
                <!-- Progress Header -->
                <div class="space-y-1.5 pb-1">
                  <div class="flex items-center justify-between text-[11px] font-semibold" style="color: var(--text-muted);">
                    <span>ขั้นตอนที่ 1 จาก 2: ข้อมูลผู้ใช้</span>
                    <span>50%</span>
                  </div>
                  <div class="h-1.5 w-full rounded-full overflow-hidden" style="background: var(--bg-elevated-2);">
                    <div class="h-full rounded-full transition-all duration-300" style="width: 50%; background: var(--brand);"></div>
                  </div>
                </div>

                <!-- Display Name -->
                <div class="space-y-1.5">
                  <label class="block text-xs font-bold" style="color: var(--text-secondary);">
                    ชื่อที่แสดง (Display Name)
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style="color: var(--text-muted);">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <input
                      v-model="fullName"
                      type="text"
                      placeholder="เช่น สมชาย ใจดี"
                      autocomplete="name"
                      class="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm border transition-all duration-200 outline-none"
                      style="
                        background: var(--bg-elevated);
                        border-color: var(--border-default);
                        color: var(--text-primary);
                      "
                    />
                  </div>
                </div>

                <!-- Email -->
                <div class="space-y-1.5">
                  <label class="block text-xs font-bold" style="color: var(--text-secondary);">
                    อีเมล (Email)
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style="color: var(--text-muted);">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    <input
                      v-model="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      autocomplete="email"
                      class="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm border transition-all duration-200 outline-none"
                      style="
                        background: var(--bg-elevated);
                        border-color: var(--border-default);
                        color: var(--text-primary);
                      "
                    />
                  </div>
                </div>

                <!-- Password -->
                <div class="space-y-1.5">
                  <label class="block text-xs font-bold" style="color: var(--text-secondary);">
                    รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style="color: var(--text-muted);">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <input
                      v-model="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      minlength="6"
                      autocomplete="new-password"
                      class="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm border transition-all duration-200 outline-none"
                      style="
                        background: var(--bg-elevated);
                        border-color: var(--border-default);
                        color: var(--text-primary);
                      "
                    />
                  </div>
                </div>

                <!-- Confirm Password -->
                <div class="space-y-1.5">
                  <label class="block text-xs font-bold" style="color: var(--text-secondary);">
                    ยืนยันรหัสผ่าน
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style="color: var(--text-muted);">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <input
                      v-model="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      required
                      minlength="6"
                      autocomplete="new-password"
                      class="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm border transition-all duration-200 outline-none"
                      style="
                        background: var(--bg-elevated);
                        border-color: var(--border-default);
                        color: var(--text-primary);
                      "
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  :disabled="!isCredentialsValid"
                  class="w-full py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm shadow-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                  style="
                    background: var(--brand);
                    color: var(--brand-on);
                    box-shadow: 0 4px 14px -3px var(--brand);
                  "
                >
                  <span>ถัดไป: เลือกฟังก์ชัน</span>
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </form>

              <!-- Step 2: Module Selection -->
              <div v-else class="space-y-4">
                <!-- Progress Header -->
                <div class="space-y-1.5 pb-1">
                  <div class="flex items-center justify-between text-[11px] font-semibold" style="color: var(--text-muted);">
                    <span>ขั้นตอนที่ 2 จาก 2: ฟังก์ชันที่ต้องการใช้งาน</span>
                    <span>100%</span>
                  </div>
                  <div class="h-1.5 w-full rounded-full overflow-hidden" style="background: var(--bg-elevated-2);">
                    <div class="h-full rounded-full transition-all duration-300" style="width: 100%; background: var(--brand);"></div>
                  </div>
                </div>

                <!-- Shortcuts Header -->
                <div class="flex items-center justify-between text-xs pt-1">
                  <span class="font-bold" style="color: var(--text-primary);">เลือกอย่างน้อย 1 ฟังก์ชัน</span>
                  <div class="flex items-center gap-2">
                    <button type="button" @click="selectAllModules" class="font-bold transition-opacity hover:opacity-80" style="color: var(--brand-ink);">
                      ทั้งหมด
                    </button>
                    <span style="color: var(--text-muted);">•</span>
                    <button type="button" @click="selectMinimalModules" class="font-bold transition-opacity hover:opacity-80" style="color: var(--brand-ink);">
                      การเงินเท่านั้น
                    </button>
                  </div>
                </div>

                <!-- Module Cards Grid -->
                <div class="grid grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                  <div
                    v-for="mod in allModules"
                    :key="mod.id"
                    @click="toggleSelectedModule(mod.id)"
                    class="p-3 rounded-2xl border cursor-pointer select-none transition-all duration-200 flex flex-col justify-between"
                    :style="
                      selectedSignUpModules.includes(mod.id)
                        ? {
                            background: 'var(--brand-soft)',
                            borderColor: 'var(--brand)',
                            boxShadow: '0 2px 8px -2px var(--brand-soft)'
                          }
                        : {
                            background: 'var(--bg-elevated)',
                            borderColor: 'var(--border-subtle)'
                          }
                    "
                  >
                    <div class="flex items-start justify-between">
                      <span class="text-xl">{{ mod.icon }}</span>
                      <div
                        class="w-4 h-4 rounded-md border flex items-center justify-center transition-colors"
                        :style="
                          selectedSignUpModules.includes(mod.id)
                            ? { background: 'var(--brand)', borderColor: 'var(--brand)', color: 'white' }
                            : { borderColor: 'var(--border-strong)', background: 'transparent' }
                        "
                      >
                        <svg v-if="selectedSignUpModules.includes(mod.id)" class="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    </div>
                    <div class="mt-2">
                      <p class="text-xs font-bold leading-tight" style="color: var(--text-primary);">{{ mod.label }}</p>
                      <p class="text-[10px] leading-tight line-clamp-1 mt-0.5" style="color: var(--text-muted);">{{ mod.description }}</p>
                    </div>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    @click="signUpStep = 'credentials'"
                    class="py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm border transition-all active:scale-95"
                    style="
                      background: var(--bg-elevated);
                      border-color: var(--border-default);
                      color: var(--text-secondary);
                    "
                  >
                    ย้อนกลับ
                  </button>
                  <button
                    type="button"
                    @click="handleSignUp"
                    :disabled="isLoading || selectedSignUpModules.length === 0"
                    class="flex-1 py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm shadow-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                    style="
                      background: var(--brand);
                      color: var(--brand-on);
                      box-shadow: 0 4px 14px -3px var(--brand);
                    "
                  >
                    <span v-if="isLoading" class="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                    <span>{{ isLoading ? 'กำลังสร้างบัญชี...' : 'สร้างบัญชี' }}</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Divider -->
            <div class="relative my-6 flex items-center justify-center">
              <div class="w-full border-t" style="border-color: var(--border-subtle);"></div>
              <span class="absolute px-3 text-[11px] font-semibold uppercase tracking-wider select-none" style="background: var(--bg-card); color: var(--text-muted);">
                หรือเข้าสู่ระบบด้วย
              </span>
            </div>

            <!-- Social Sign In Section (Google Identity) -->
            <div class="space-y-3">
              <div ref="googleBtnRef" class="w-full flex justify-center min-h-[44px]"></div>

              <button
                v-if="!isGoogleBtnRendered"
                type="button"
                @click="handleGoogleSignIn"
                :disabled="isLoading"
                class="w-full py-2.5 px-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-3 transition-all duration-200 shadow-xs hover:shadow-sm hover:scale-[1.01] active:scale-98 disabled:opacity-50"
                style="
                  background: var(--bg-card);
                  border-color: var(--border-default);
                  color: var(--text-primary);
                "
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>{{ isLoading ? 'กำลังเชื่อมต่อ...' : 'ดำเนินการต่อด้วย Google' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { AppModuleId } from '~/composables/useUserModules'

const router = useRouter()
const config = useRuntimeConfig()
const { login, register, loginWithGoogleIdToken, isSessionValid } = useAuth()
const { allModules, setModules } = useUserModules()
const { isLightTheme, toggleTheme, initializeTheme } = useAppTheme()

const features = [
  { icon: '💰', label: 'การเงินส่วนบุคคล', desc: 'รายรับ-รายจ่าย สมุดบัญชี และรายจ่ายประจำ' },
  { icon: '📚', label: 'ตารางเรียนอัจฉริยะ', desc: 'นับถอยหลังคาบเรียน แจ้งเตือนเวลาเรียลไทม์' },
  { icon: '✅', label: 'งานและการบ้าน', desc: 'จัดการ To-do List และกำหนดส่งอย่างแม่นยำ' },
  { icon: '🎯', label: 'กิจกรรม & ปฏิทิน', desc: 'นับถอยหลังอีเวนต์สำคัญ ตลอดวันและหลายวัน' },
]

const isSignUp = ref(false)
const signUpStep = ref<'credentials' | 'modules'>('credentials')
const selectedSignUpModules = ref<AppModuleId[]>(allModules.map((m) => m.id))

const isLoading = ref(false)
const isCheckingSession = ref(true)
const isRedirecting = ref(false)
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const fullName = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const loadingHint = ref('')
const sessionCheckHint = ref('กรุณารอสักครู่')

watch(isSignUp, () => {
  signUpStep.value = 'credentials'
  errorMessage.value = ''
  successMessage.value = ''
})

const isCredentialsValid = computed(() => {
  return (
    email.value.trim().length > 0 &&
    password.value.length >= 6 &&
    confirmPassword.value.length >= 6 &&
    password.value === confirmPassword.value
  )
})

const proceedToModuleSelection = () => {
  if (password.value !== confirmPassword.value) {
    showMessage('รหัสผ่านไม่ตรงกัน', 'error')
    return
  }
  if (password.value.length < 6) {
    showMessage('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', 'error')
    return
  }
  signUpStep.value = 'modules'
}

const toggleSelectedModule = (id: AppModuleId) => {
  const list = [...selectedSignUpModules.value]
  const idx = list.indexOf(id)
  if (idx >= 0) {
    if (list.length > 1) {
      list.splice(idx, 1)
    } else {
      showMessage('ต้องเลือกอย่างน้อย 1 ฟังก์ชัน', 'error')
    }
  } else {
    list.push(id)
  }
  selectedSignUpModules.value = list
}

const selectAllModules = () => {
  selectedSignUpModules.value = allModules.map((m) => m.id)
}

const selectMinimalModules = () => {
  selectedSignUpModules.value = ['cashflow']
}

let loadingTimer: ReturnType<typeof setTimeout> | null = null
let sessionTimer: ReturnType<typeof setTimeout> | null = null

watch(isLoading, (val) => {
  if (val) {
    loadingHint.value = ''
    loadingTimer = setTimeout(() => {
      if (isLoading.value) {
        loadingHint.value = '⚡ กำลังเชื่อมต่อเซิร์ฟเวอร์ (หากพึ่งเปิดระบบครั้งแรก อาจใช้เวลา 20-30 วินาที)'
      }
    }, 2500)
  } else {
    loadingHint.value = ''
    if (loadingTimer) clearTimeout(loadingTimer)
  }
})

watch(
  isCheckingSession,
  (val) => {
    if (val) {
      sessionCheckHint.value = 'กรุณารอสักครู่'
      sessionTimer = setTimeout(() => {
        if (isCheckingSession.value) {
          sessionCheckHint.value = '⚡ กำลังปลุกเซิร์ฟเวอร์ระบบ (อาจใช้เวลาสักครู่ในครั้งแรก)...'
        }
      }, 2500)
    } else {
      if (sessionTimer) clearTimeout(sessionTimer)
    }
  },
  { immediate: true }
)

let googleClientInitialized = false

const googleBtnRef = ref<HTMLElement | null>(null)
const isGoogleBtnRendered = ref(false)

const redirectToDashboard = async () => {
  if (import.meta.server || isRedirecting.value) return
  isRedirecting.value = true

  try {
    await router.push('/dashboard')
  } catch (error) {
    console.error('Redirect to dashboard error:', error)
    if (import.meta.client) {
      window.location.href = '/dashboard'
    }
  }
}

const showMessage = (message: string, type: 'error' | 'success') => {
  const { toastSuccess, toastError } = useAlert()
  if (type === 'error') {
    errorMessage.value = message
    successMessage.value = ''
    toastError(message)
  } else {
    successMessage.value = message
    errorMessage.value = ''
    toastSuccess(message)
  }
  setTimeout(() => {
    errorMessage.value = ''
    successMessage.value = ''
  }, 5000)
}

const getBackendErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== 'object' || error === null) return fallback
  const fetchError = error as { data?: { message?: string }; message?: string }
  return fetchError.data?.message || fetchError.message || fallback
}

type GoogleCredentialResponse = { credential?: string }

type GooglePromptNotification = {
  isNotDisplayed?: () => boolean
  isSkippedMoment?: () => boolean
  getNotDisplayedReason?: () => string
  getSkippedReason?: () => string
}

type GoogleRenderButtonOptions = {
  type?: 'standard' | 'icon'
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  logo_alignment?: 'left' | 'center'
  width?: number | string
}

type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string
        callback: (response: GoogleCredentialResponse) => void
      }) => void
      prompt: (momentListener?: (notification: GooglePromptNotification) => void) => void
      renderButton: (parent: HTMLElement, options: GoogleRenderButtonOptions) => void
    }
  }
}

const getGoogleWindow = (): { google?: GoogleIdentity } => globalThis as { google?: GoogleIdentity }

const loadGoogleIdentityScript = () =>
  new Promise<void>((resolve, reject) => {
    if (getGoogleWindow().google?.accounts?.id) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('โหลดสคริปต์ Google ไม่สำเร็จ'))
    document.head.appendChild(script)
  })

const handleGoogleCredential = async (response: GoogleCredentialResponse) => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    if (!response.credential) throw new Error('ไม่พบข้อมูลยืนยันตัวตนจาก Google')
    await loginWithGoogleIdToken(response.credential)
    await redirectToDashboard()
  } catch (error: unknown) {
    console.error('Google sign in error:', error)
    showMessage(getBackendErrorMessage(error, 'ลงชื่อเข้าใช้ผ่าน Google ไม่สำเร็จ'), 'error')
  } finally {
    isLoading.value = false
  }
}

const ensureGoogleClientInitialized = async () => {
  if (googleClientInitialized) return
  if (!config.public.googleClientId) throw new Error('ยังไม่ได้ตั้งค่า Google Client ID')
  await loadGoogleIdentityScript()
  getGoogleWindow().google!.accounts.id.initialize({
    client_id: config.public.googleClientId,
    callback: handleGoogleCredential,
  })
  googleClientInitialized = true
}

const renderGoogleOfficialButton = async () => {
  try {
    await ensureGoogleClientInitialized()
    if (googleBtnRef.value && getGoogleWindow().google?.accounts?.id?.renderButton) {
      googleBtnRef.value.innerHTML = ''
      const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('theme-night')
      getGoogleWindow().google!.accounts.id.renderButton(googleBtnRef.value, {
        type: 'standard',
        theme: isDark ? 'filled_black' : 'filled_blue',
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        width: '100%',
        logo_alignment: 'left',
      })
      isGoogleBtnRendered.value = true
    }
  } catch (err) {
    console.warn('Failed to render official Google button:', err)
  }
}

onMounted(async () => {
  initializeTheme()
  if (isSessionValid()) {
    redirectToDashboard()
    return
  }
  isCheckingSession.value = false
  isRedirecting.value = false

  try {
    await renderGoogleOfficialButton()
  } catch (err) {
    console.warn('Google Client pre-init warning:', err)
  }
})

onUnmounted(() => {
  if (loadingTimer) clearTimeout(loadingTimer)
  if (sessionTimer) clearTimeout(sessionTimer)
})

const handleSignIn = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    await login(email.value, password.value)
    await redirectToDashboard()
  } catch (error: unknown) {
    console.error('Sign in error:', error)
    showMessage(getBackendErrorMessage(error, 'เข้าสู่ระบบไม่สำเร็จ'), 'error')
  } finally {
    isLoading.value = false
  }
}

const handleSignUp = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    if (password.value !== confirmPassword.value) {
      showMessage('รหัสผ่านไม่ตรงกัน', 'error')
      isLoading.value = false
      return
    }
    if (selectedSignUpModules.value.length === 0) {
      showMessage('โปรดเลือกอย่างน้อย 1 ฟังก์ชันที่ต้องการใช้งาน', 'error')
      isLoading.value = false
      return
    }
    await register(email.value, password.value, fullName.value || email.value.split('@')[0] || '', selectedSignUpModules.value)
    setModules(selectedSignUpModules.value)
    showMessage('สมัครสมาชิกสำเร็จ กำลังพาไปที่ Dashboard...', 'success')
    await redirectToDashboard()
  } catch (error: unknown) {
    console.error('Sign up error:', error)
    showMessage(getBackendErrorMessage(error, 'สมัครสมาชิกไม่สำเร็จ'), 'error')
  } finally {
    isLoading.value = false
  }
}

const handleGoogleSignIn = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    await ensureGoogleClientInitialized()
    getGoogleWindow().google!.accounts.id.prompt((notification: GooglePromptNotification) => {
      if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
        isLoading.value = false
        const reason = notification.getNotDisplayedReason?.() || notification.getSkippedReason?.() || ''
        console.warn('Google prompt not displayed/skipped reason:', reason)
        showMessage('ไม่สามารถแสดงหน้าต่างเข้าสู่ระบบ Google ได้ (โปรดลองใหม่หรือรอ Google อัปเดตสิทธิ์)', 'error')
      }
    })
  } catch (error: unknown) {
    console.error('Google sign in error:', error)
    showMessage(getBackendErrorMessage(error, 'ลงชื่อเข้าใช้ผ่าน Google ไม่สำเร็จ'), 'error')
    isLoading.value = false
  }
}
</script>
