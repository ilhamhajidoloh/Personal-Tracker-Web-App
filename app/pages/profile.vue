<template>
  <AppTabsLayout>
    <div class="mx-auto w-full max-w-5xl px-4 md:px-6 py-6 md:py-8">
      <!-- Page head -->
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p class="eyebrow">โปรไฟล์ · Account</p>
          <h1 class="text-2xl md:text-[30px] font-extrabold tracking-tight mt-1.5" style="color: var(--text-primary);">โปรไฟล์</h1>
          <p class="text-xs mt-2" style="color: var(--text-muted);">ข้อมูลบัญชีผู้ใช้และการตั้งค่า</p>
        </div>
        <div class="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            @click="openEditProfileModal"
            class="px-3.5 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-xs sm:text-sm font-semibold text-violet-300 transition-all tap-scale touch-target flex items-center gap-1.5"
          >
            ✏️ แก้ไขโปรไฟล์
          </button>
          <button
            @click="openChangePasswordModal"
            class="px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700/60 text-xs sm:text-sm font-semibold text-gray-300 hover:text-white transition-all tap-scale touch-target flex items-center gap-1.5"
          >
            🔑 {{ userHasPassword ? 'เปลี่ยนรหัสผ่าน' : 'ตั้งรหัสผ่าน' }}
          </button>
          <button
            @click="loadProfile"
            :disabled="isLoading"
            class="btn-secondary text-xs sm:text-sm inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed tap-scale touch-target"
          >
            <svg class="w-4 h-4" :class="isLoading ? 'animate-spin' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/></svg>
            {{ isLoading ? 'กำลังโหลด...' : 'รีเฟรช' }}
          </button>
        </div>
      </div>

      <div class="space-y-5 mt-6">
        <!-- Error -->
        <div
          v-if="errorMessage"
          class="rounded-2xl px-4 py-3 text-sm flex items-center gap-2 font-medium"
          style="background: rgba(182, 133, 42, 0.1); border: 1px solid rgba(182, 133, 42, 0.3); color: var(--ink-amber);"
        >
          <span>⚠️</span><span>{{ errorMessage }}</span>
        </div>

        <!-- Loading -->
        <div
          v-if="isLoading"
          class="glass-card px-6 py-12 flex items-center justify-center gap-3"
        >
          <span class="inline-block w-6 h-6 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin"></span>
          <span class="text-gray-400">กำลังโหลดข้อมูลโปรไฟล์...</span>
        </div>

        <template v-else>
          <!-- Profile Section -->
          <section class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <!-- Avatar Card -->
            <div class="lg:col-span-1 glass-card p-6 flex flex-col items-start justify-between">
              <div class="w-full">
                <!-- Avatar -->
                <div class="relative mb-4">
                  <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-3xl font-bold shadow-xl shadow-violet-500/25">
                    {{ avatarFallback }}
                  </div>
                </div>

                <h2 class="text-lg font-bold text-white leading-tight">{{ displayName }}</h2>
                <p class="text-xs text-gray-500 mt-1 break-all">{{ currentUser?.email || '-' }}</p>

                <div class="mt-4 w-full space-y-2">
                  <div class="flex items-center justify-between py-1.5 border-b border-gray-800/60">
                    <span class="text-xs text-gray-500">ชื่อ</span>
                    <span class="text-xs font-medium text-white">{{ firstName }}</span>
                  </div>
                  <div class="flex items-center justify-between py-1.5">
                    <span class="text-xs text-gray-500">นามสกุล</span>
                    <span class="text-xs font-medium text-white">{{ lastName }}</span>
                  </div>
                </div>
              </div>

              <button
                @click="openEditProfileModal"
                class="mt-6 w-full py-2.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-xs font-semibold text-violet-300 transition-all tap-scale touch-target flex items-center justify-center gap-1.5"
              >
                ✏️ แก้ไขชื่อโปรไฟล์
              </button>
            </div>

            <!-- Account Info Card -->
            <div class="lg:col-span-2 section-card">
              <div class="px-5 py-4 border-b border-gray-800/60 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h3 class="text-base font-semibold text-white">ข้อมูลบัญชี</h3>
                  <p class="text-xs text-gray-500 mt-0.5">ข้อมูลหลักของบัญชีผู้ใช้</p>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    @click="openEditProfileModal"
                    class="px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-xs font-semibold text-violet-300 transition-all tap-scale touch-target flex items-center gap-1"
                  >
                    ✏️ แก้ไขข้อมูล
                  </button>
                  <button
                    @click="openChangePasswordModal"
                    class="px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700/60 text-xs font-semibold text-gray-300 hover:text-white transition-all tap-scale touch-target flex items-center gap-1"
                  >
                    🔑 {{ userHasPassword ? 'เปลี่ยนรหัสผ่าน' : 'ตั้งรหัสผ่าน' }}
                  </button>
                </div>
              </div>
              <div class="divide-y divide-gray-800/50">
                <div
                  v-for="row in importantProfileRows"
                  :key="row.key"
                  class="flex items-start gap-4 px-5 py-3 hover:bg-gray-800/20 transition-all"
                >
                  <span class="text-xs text-gray-500 uppercase tracking-wide font-medium w-28 shrink-0 pt-0.5">{{ row.key }}</span>
                  <span class="text-sm text-gray-300 break-all flex-1">{{ row.value }}</span>
                </div>
              </div>
            </div>
          </section>

          <!-- App Modules Customization Section -->
          <section id="modules" class="section-card">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-gray-800/60">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center text-xl shrink-0">✨</div>
                <div>
                  <h3 class="text-base font-semibold text-white">จัดการฟังก์ชันการใช้งาน (App Modules)</h3>
                  <p class="text-xs text-gray-500 mt-0.5">เปิดหรือปิดโมดูลที่คุณต้องการใช้งาน เมนูและแดชบอร์ดจะปรับให้พอดีกับความต้องการ</p>
                </div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  @click="handleEnableAllModules"
                  class="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all tap-scale flex items-center gap-1"
                  style="background: rgba(59,78,240,0.15); border: 1px solid rgba(59,78,240,0.35); color: #818cf8;"
                >
                  <span>✓</span>
                  <span>เปิดทั้งหมด</span>
                </button>
                <button
                  type="button"
                  @click="handleEnableOnlyCashflow"
                  class="text-xs font-semibold px-3 py-1.5 rounded-xl transition-all tap-scale flex items-center gap-1"
                  style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: #94a3b8;"
                >
                  <span>⚡</span>
                  <span>เฉพาะการเงิน</span>
                </button>
              </div>
            </div>

            <div class="p-5">
              <div class="flex items-center justify-between mb-4 pb-2 border-b border-gray-800/40">
                <span class="text-xs font-semibold text-gray-400">
                  สถานะ: เปิดใช้งาน <span class="text-violet-400 font-bold">{{ enabledModules.length }}</span> จาก {{ allModules.length }} ฟังก์ชัน
                </span>
                <span class="text-[11px] text-gray-500">
                  การเปลี่ยนสวิตช์มีผลทันทีต่อแถบเมนูและหน้าจอทั้งหมด
                </span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div
                  v-for="mod in allModules"
                  :key="mod.id"
                  @click="handleToggleModule(mod.id, mod.shortLabel)"
                  class="p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-4 cursor-pointer tap-scale select-none"
                  :style="isModuleEnabled(mod.id)
                    ? 'background: rgba(59, 78, 240, 0.08); border-color: rgba(59, 78, 240, 0.35); box-shadow: 0 4px 20px -4px rgba(59, 78, 240, 0.12);'
                    : 'background: rgba(255, 255, 255, 0.02); border-color: rgba(255, 255, 255, 0.08); opacity: 0.55;'"
                >
                  <div class="flex items-start gap-3.5 min-w-0">
                    <span class="text-2xl shrink-0 mt-0.5">{{ mod.icon }}</span>
                    <div class="min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <h4 class="text-sm font-bold text-white">{{ mod.label }}</h4>
                        <span
                          class="text-[10px] px-2 py-0.5 rounded-full font-semibold transition-colors"
                          :style="isModuleEnabled(mod.id)
                            ? 'background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3);'
                            : 'background: rgba(100,116,139,0.2); color: #94a3b8; border: 1px solid rgba(100,116,139,0.3);'"
                        >
                          {{ isModuleEnabled(mod.id) ? 'เปิดใช้งาน' : 'ปิดอยู่' }}
                        </span>
                      </div>
                      <p class="text-xs text-gray-400 mt-1 leading-relaxed">{{ mod.description }}</p>
                    </div>
                  </div>

                  <!-- Pixel-Perfect iOS Switch Toggle -->
                  <div
                    role="switch"
                    :aria-checked="isModuleEnabled(mod.id)"
                    class="shrink-0 flex items-center transition-all duration-300 rounded-full"
                    :style="{
                      width: '46px',
                      height: '26px',
                      padding: '3px',
                      backgroundColor: isModuleEnabled(mod.id) ? 'var(--brand, #3b4ef0)' : '#334155',
                      boxShadow: isModuleEnabled(mod.id) ? '0 0 14px rgba(59, 78, 240, 0.45)' : 'none'
                    }"
                  >
                    <div
                      class="rounded-full bg-white transition-transform duration-300 pointer-events-none shadow-md"
                      :style="{
                        width: '20px',
                        height: '20px',
                        transform: isModuleEnabled(mod.id) ? 'translateX(20px)' : 'translateX(0px)'
                      }"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- LINE Integration -->
          <section class="section-card">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-gray-800/60">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center text-xl shrink-0">💬</div>
                <div>
                  <h3 class="text-base font-semibold text-white">LINE Integration</h3>
                  <p class="text-xs text-gray-500 mt-0.5">ผูก LINE เพื่อรับแจ้งเตือนเมื่อเพิ่มหรือแก้ไขงาน/กิจกรรม</p>
                </div>
              </div>
              <span
                class="inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold shrink-0"
                :class="lineStatusBadgeClass"
              >
                {{ lineStatusLabel }}
              </span>
            </div>

            <div class="p-5">
              <div v-if="isLineLoading" class="flex items-center gap-2 text-sm text-gray-400 py-4">
                <span class="inline-block w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin"></span>
                กำลังตรวจสอบการเชื่อมต่อ LINE...
              </div>

              <div v-else class="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <!-- Left: Status + Easy connect -->
                <div class="space-y-4">
                  <!-- Status info -->
                  <div class="grid grid-cols-3 gap-3">
                    <div class="col-span-2 border border-gray-800/70 rounded-xl p-3">
                      <p class="text-[11px] text-gray-500 uppercase tracking-wide">LINE User ID</p>
                      <p class="text-xs text-gray-300 break-all mt-1">{{ lineStatus.lineUserId || '—' }}</p>
                    </div>
                    <div class="border border-gray-800/70 rounded-xl p-3">
                      <p class="text-[11px] text-gray-500 uppercase tracking-wide">แจ้งเตือน</p>
                      <p class="text-xs mt-1 font-semibold" :class="lineStatus.notificationsEnabled && lineStatus.connected ? 'text-emerald-400' : 'text-gray-400'">
                        {{ lineStatus.connected ? (lineStatus.notificationsEnabled ? 'เปิด' : 'ปิด') : '—' }}
                      </p>
                    </div>
                  </div>

                  <!-- Easy connect box -->
                  <div class="rounded-xl border border-sky-500/20 bg-sky-500/8 p-4 space-y-3">
                    <div>
                      <p class="text-sm font-semibold text-white">เชื่อมต่อแบบง่าย</p>
                      <p class="text-xs mt-1 leading-relaxed" style="color: var(--ink-sky);">ไม่ต้องหา LINE User ID เอง ระบบจะสร้างข้อความให้ ส่งไปหา {{ lineBotDisplayName }} ได้เลย</p>
                    </div>

                    <div class="bg-sky-500/8 border border-sky-500/15 rounded-lg p-3 space-y-1 text-xs" style="color: var(--ink-sky);">
                      <p class="font-medium text-white">วิธีการเชื่อมต่อ</p>
                      <p>1. กดสร้างโค้ดเชื่อมต่อด้านล่าง</p>
                      <p>2. ส่งข้อความนั้นไปหา {{ lineBotDisplayName }}</p>
                      <p>3. ระบบจะผูก LINE account ให้อัตโนมัติ</p>
                    </div>

                    <div class="flex flex-wrap gap-2">
                      <a
                        v-if="lineBotAddFriendUrl"
                        :href="lineBotAddFriendUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="px-3 py-2 rounded-xl bg-gray-800/70 hover:bg-gray-800 border border-gray-700/60 text-xs text-gray-300 hover:text-white transition-all tap-scale touch-target"
                      >
                        เพิ่มเพื่อน {{ lineBotDisplayName }}
                      </a>

                      <button
                        type="button"
                        @click="generateLineLinkCode()"
                        :disabled="isGeneratingLineCode || isSavingLine || isTestingLine"
                        class="px-3 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-white shadow-sm shadow-violet-500/20 transition-all tap-scale touch-target"
                      >
                        {{ isGeneratingLineCode ? 'กำลังสร้าง...' : (hasLineLinkCode ? 'สร้างโค้ดใหม่' : 'สร้างโค้ดเชื่อมต่อ') }}
                      </button>

                      <button
                        type="button"
                        @click="openLineForConnection"
                        :disabled="isGeneratingLineCode || isSavingLine || isTestingLine"
                        class="px-3 py-2 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-white transition-all tap-scale touch-target"
                      >
                        เปิด LINE พร้อมข้อความ
                      </button>

                      <button
                        type="button"
                        @click="refreshLineStatus"
                        :disabled="isLineLoading || isGeneratingLineCode"
                        class="px-3 py-2 rounded-xl bg-gray-800/70 hover:bg-gray-800 border border-gray-700/60 disabled:opacity-50 disabled:cursor-not-allowed text-xs text-gray-400 hover:text-white transition-all tap-scale touch-target"
                      >
                        ตรวจสอบสถานะ
                      </button>
                    </div>

                    <!-- Link code display -->
                    <div v-if="lineLinkCode" class="space-y-2">
                      <div class="rounded-xl border border-gray-700/60 bg-gray-900/60 p-3">
                        <p class="text-[11px] text-gray-500 uppercase tracking-wide mb-2">ข้อความที่ต้องส่งหา LINE bot</p>
                        <textarea
                          :value="lineLinkCode.code"
                          rows="3"
                          readonly
                          class="w-full bg-gray-800/70 border border-gray-700/60 rounded-xl px-3 py-2 text-xs text-gray-200 outline-none resize-none"
                        ></textarea>
                        <div class="mt-2 flex items-center justify-between gap-2">
                          <p class="text-[11px] text-gray-500">หมดอายุ {{ lineLinkCodeExpiresAtText }}</p>
                          <button
                            type="button"
                            @click="copyLineLinkCode"
                            class="px-2.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700/60 text-[11px] text-gray-300 transition-all tap-scale touch-target"
                          >คัดลอก</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Right: Preferences + Manual -->
                <div class="space-y-4">
                  <!-- Notifications preference -->
                  <div class="rounded-xl border border-gray-800/70 bg-gray-800/20 p-4 space-y-3">
                    <h4 class="text-sm font-semibold text-white">การแจ้งเตือน</h4>
                    <label class="flex items-start gap-3 p-3 border border-gray-800/60 rounded-xl bg-gray-800/30 cursor-pointer hover:bg-gray-800/50 transition-all">
                      <input
                        v-model="lineNotificationsEnabled"
                        type="checkbox"
                        class="mt-0.5 accent-violet-500"
                      >
                      <span class="text-xs text-gray-300 leading-relaxed">รับแจ้งเตือนใน LINE เมื่อมีการเพิ่มหรือแก้ไขงานและกิจกรรม</span>
                    </label>

                    <!-- Class Reminder Settings -->
                    <div class="border-t border-gray-800/60 pt-3 space-y-3">
                      <label class="flex items-start gap-3 p-3 border border-gray-800/60 rounded-xl bg-gray-800/30 cursor-pointer hover:bg-gray-800/50 transition-all">
                        <input
                          v-model="lineClassRemindersEnabled"
                          type="checkbox"
                          class="mt-0.5 accent-violet-500"
                        >
                        <span class="text-xs text-gray-300 leading-relaxed">รับแจ้งเตือนคาบเรียนก่อนเรียน</span>
                      </label>

                      <div v-if="lineClassRemindersEnabled" class="pl-3 space-y-2">
                        <label class="block text-xs font-medium text-gray-400">แจ้งเตือนก่อนเรียนกี่นาที</label>
                        <select
                          v-model.number="lineClassReminderMinutes"
                          class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
                        >
                          <option :value="5">5 นาที</option>
                          <option :value="10">10 นาที</option>
                          <option :value="15">15 นาที</option>
                          <option :value="30">30 นาที</option>
                          <option :value="60">1 ชั่วโมง</option>
                        </select>
                      </div>
                    </div>

                    <div class="flex flex-wrap gap-2">
                      <button
                        type="button"
                        @click="saveLinePreferences"
                        :disabled="!lineStatus.connected || isSavingLine || isTestingLine"
                        class="flex-1 px-3 py-2 rounded-xl bg-violet-600/80 hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-white transition-all tap-scale touch-target"
                      >
                        {{ isSavingLine ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า' }}
                      </button>
                      <button
                        type="button"
                        @click="sendLineTestMessage"
                        :disabled="!lineStatus.connected || isSavingLine || isTestingLine"
                        class="flex-1 px-3 py-2 rounded-xl bg-gray-800/70 hover:bg-gray-800 border border-gray-700/60 disabled:opacity-50 disabled:cursor-not-allowed text-xs text-gray-300 hover:text-white transition-all tap-scale touch-target"
                      >
                        {{ isTestingLine ? 'กำลังส่ง...' : 'ทดสอบ' }}
                      </button>
                      <button
                        type="button"
                        @click="disconnectLine"
                        :disabled="!lineStatus.connected || isSavingLine || isTestingLine"
                        class="flex-1 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-xs text-rose-400 transition-all tap-scale touch-target"
                      >
                        ยกเลิกการเชื่อมต่อ
                      </button>
                    </div>
                  </div>

                  <!-- Manual connect (collapsed) -->
                  <details class="rounded-xl border border-gray-800/70 bg-gray-800/20 overflow-hidden">
                    <summary class="cursor-pointer px-4 py-3 text-sm font-medium text-gray-300 hover:text-white list-none flex items-center justify-between transition-colors">
                      <span>เชื่อมต่อแบบกรอก LINE User ID เอง</span>
                      <span class="text-gray-500 text-xs">คลิกเพื่อขยาย</span>
                    </summary>
                    <form class="px-4 pb-4 space-y-3 border-t border-gray-800/60 pt-4" @submit.prevent="connectLine">
                      <div>
                        <label class="block text-xs font-medium text-gray-400 mb-1.5">LINE User ID</label>
                        <input
                          v-model="lineUserIdInput"
                          type="text"
                          autocomplete="off"
                          placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
                        >
                        <p class="text-[11px] text-gray-600 mt-1.5">ใช้เฉพาะกรณีที่คุณมี LINE User ID อยู่แล้ว</p>
                      </div>
                      <button
                        type="submit"
                        :disabled="isSavingLine || isTestingLine"
                        class="w-full px-4 py-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-800 border border-gray-700/60 disabled:opacity-50 disabled:cursor-not-allowed text-sm text-gray-300 hover:text-white transition-all font-medium tap-scale touch-target"
                      >
                        {{ isSavingLine ? 'กำลังบันทึก...' : (lineStatus.connected ? 'อัปเดตการเชื่อมต่อ' : 'เชื่อมต่อ') }}
                      </button>
                    </form>
                  </details>
                </div>
              </div>
            </div>
          </section>

          <!-- Google Calendar Integration -->
          <section class="section-card">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-gray-800/60">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-sky-500/15 flex items-center justify-center text-xl shrink-0">📅</div>
                <div>
                  <h3 class="text-base font-semibold text-white">Google Calendar</h3>
                  <p class="text-xs text-gray-500 mt-0.5">ส่งกิจกรรมที่เพิ่ม/แก้ไขในแท็บกิจกรรมไปยัง Google Calendar อัตโนมัติ</p>
                </div>
              </div>
              <span
                class="inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold shrink-0"
                :class="googleStatusBadgeClass"
              >
                {{ googleStatusLabel }}
              </span>
            </div>

            <div class="p-5">
              <div v-if="isGoogleLoading" class="flex items-center gap-2 text-sm text-gray-400 py-4">
                <span class="inline-block w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin"></span>
                กำลังตรวจสอบการเชื่อมต่อ Google Calendar...
              </div>

              <div v-else class="flex flex-wrap items-center gap-2">
                <a
                  v-if="!googleStatus.connected"
                  href="/api/google/auth"
                  class="px-3 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-sm shadow-violet-500/20 transition-all tap-scale touch-target"
                >
                  เชื่อมต่อ Google Calendar
                </a>
                <button
                  v-else
                  type="button"
                  @click="disconnectGoogle"
                  :disabled="isDisconnectingGoogle"
                  class="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-xs text-rose-400 transition-all tap-scale touch-target"
                >
                  {{ isDisconnectingGoogle ? 'กำลังยกเลิก...' : 'ยกเลิกการเชื่อมต่อ' }}
                </button>
                <button
                  v-if="googleStatus.connected"
                  type="button"
                  @click="syncAllEvents"
                  :disabled="isSyncingAllGoogle"
                  class="px-3 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-xs text-violet-300 transition-all tap-scale touch-target"
                >
                  {{ isSyncingAllGoogle ? 'กำลังซิงค์...' : 'ซิงค์กิจกรรมย้อนหลัง' }}
                </button>
                <button
                  type="button"
                  @click="refreshGoogleStatus"
                  :disabled="isGoogleLoading"
                  class="px-3 py-2 rounded-xl bg-gray-800/70 hover:bg-gray-800 border border-gray-700/60 disabled:opacity-50 disabled:cursor-not-allowed text-xs text-gray-400 hover:text-white transition-all tap-scale touch-target"
                >
                  ตรวจสอบสถานะ
                </button>
              </div>
            </div>
          </section>
        </template>
      </div>
    </div>

    <!-- Edit Profile Modal -->
    <Teleport to="body">
      <Transition name="backdrop">
        <div
          v-if="isEditProfileModalOpen"
          class="fixed inset-0 z-[90] flex items-center justify-center p-4"
          style="background: rgba(3,5,12,0.62); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);"
          @click.self="closeEditProfileModal"
        >
          <Transition name="modal">
            <div v-if="isEditProfileModalOpen" class="relative z-10 w-full max-w-md bg-gray-900 border border-gray-700/80 rounded-2xl shadow-2xl overflow-hidden">
              <div class="flex items-center justify-between px-6 py-4 border-b border-gray-800/80">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center text-base">👤</div>
                  <div>
                    <h2 class="text-base font-semibold text-white">แก้ไขข้อมูลโปรไฟล์</h2>
                    <p class="text-xs text-gray-500">ปรับเปลี่ยนข้อมูลส่วนตัวของคุณ</p>
                  </div>
                </div>
                <button
                  type="button"
                  @click="closeEditProfileModal"
                  class="w-8 h-8 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-all tap-scale touch-target"
                >✕</button>
              </div>

              <form class="p-6 space-y-4" @submit.prevent="submitEditProfile">
                <div>
                  <label class="block text-xs font-medium text-gray-400 mb-1.5">อีเมลบัญชี</label>
                  <input
                    :value="currentUser?.email || ''"
                    type="email"
                    disabled
                    class="w-full bg-gray-800/40 border border-gray-700/40 rounded-xl px-4 py-2.5 text-sm text-gray-400 outline-none cursor-not-allowed"
                  >
                  <p class="text-[11px] text-gray-600 mt-1">ไม่อนุญาตให้แก้ไขอีเมลที่ลงทะเบียนแล้ว</p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-400 mb-1.5">ชื่อ - นามสกุล (ชื่อที่แสดง) <span class="text-rose-400">*</span></label>
                  <input
                    v-model="editProfileForm.fullName"
                    type="text"
                    maxlength="100"
                    placeholder="กรอกชื่อ-นามสกุล เช่น สมชาย ใจดี"
                    class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
                  >
                </div>

                <div class="flex gap-3 pt-2">
                  <button
                    type="button"
                    @click="closeEditProfileModal"
                    class="flex-1 py-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-800 border border-gray-700/60 text-sm font-medium text-gray-300 hover:text-white transition-all tap-scale touch-target"
                  >ยกเลิก</button>
                  <button
                    type="submit"
                    :disabled="isSubmittingProfile"
                    class="flex-1 btn-primary py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold flex items-center justify-center gap-2 tap-scale touch-target"
                  >
                    <span v-if="isSubmittingProfile" class="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                    {{ isSubmittingProfile ? 'กำลังบันทึก...' : 'บันทึกข้อมูล' }}
                  </button>
                </div>
              </form>
            </div>
          </Transition>
          <div class="absolute inset-0 z-0 bg-black/70 backdrop-blur-sm" @click="closeEditProfileModal"></div>
        </div>
      </Transition>
    </Teleport>

    <!-- Change Password Modal -->
    <Teleport to="body">
      <Transition name="backdrop">
        <div
          v-if="isChangePasswordModalOpen"
          class="fixed inset-0 z-[90] flex items-center justify-center p-4"
          style="background: rgba(3,5,12,0.62); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);"
          @click.self="closeChangePasswordModal"
        >
          <Transition name="modal">
            <div v-if="isChangePasswordModalOpen" class="relative z-10 w-full max-w-md bg-gray-900 border border-gray-700/80 rounded-2xl shadow-2xl overflow-hidden">
              <div class="flex items-center justify-between px-6 py-4 border-b border-gray-800/80">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-base">🔑</div>
                  <div>
                    <h2 class="text-base font-semibold text-white">{{ userHasPassword ? 'เปลี่ยนรหัสผ่าน' : 'ตั้งรหัสผ่านใหม่' }}</h2>
                    <p class="text-xs text-gray-500">
                      {{ userHasPassword ? 'กรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่' : 'ตั้งรหัสผ่านสำหรับเข้าใช้งานด้วยอีเมลครั้งแรก' }}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  @click="closeChangePasswordModal"
                  class="w-8 h-8 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-all tap-scale touch-target"
                >✕</button>
              </div>

              <form class="p-6 space-y-4" @submit.prevent="submitChangePassword">
                <!-- Current password (only if user already has password set) -->
                <div v-if="userHasPassword">
                  <label class="block text-xs font-medium text-gray-400 mb-1.5">รหัสผ่านปัจจุบัน <span class="text-rose-400">*</span></label>
                  <input
                    v-model="changePasswordForm.currentPassword"
                    type="password"
                    autocomplete="current-password"
                    placeholder="กรอกรหัสผ่านปัจจุบัน"
                    class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all"
                  >
                </div>
                <!-- Notice for first time password creation -->
                <div v-else class="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-300 flex items-start gap-2">
                  <span class="text-base leading-none">💡</span>
                  <span>คุณเข้าสู่ระบบด้วย Social Email เป็นครั้งแรก กรุณากำหนดรหัสผ่านเพื่อสิทธิ์การเข้าใช้งานผ่านอีเมลในครั้งถัดไป</span>
                </div>

                <div>
                  <label class="block text-xs font-medium text-gray-400 mb-1.5">รหัสผ่านใหม่ <span class="text-rose-400">*</span></label>
                  <input
                    v-model="changePasswordForm.newPassword"
                    type="password"
                    autocomplete="new-password"
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all"
                  >
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-400 mb-1.5">ยืนยันรหัสผ่านใหม่ <span class="text-rose-400">*</span></label>
                  <input
                    v-model="changePasswordForm.confirmPassword"
                    type="password"
                    autocomplete="new-password"
                    placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                    class="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all"
                  >
                </div>

                <div class="flex gap-3 pt-2">
                  <button
                    type="button"
                    @click="closeChangePasswordModal"
                    class="flex-1 py-2.5 rounded-xl bg-gray-800/80 hover:bg-gray-800 border border-gray-700/60 text-sm font-medium text-gray-300 hover:text-white transition-all tap-scale touch-target"
                  >ยกเลิก</button>
                  <button
                    type="submit"
                    :disabled="isSubmittingPassword"
                    class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold text-white flex items-center justify-center gap-2 tap-scale touch-target"
                  >
                    <span v-if="isSubmittingPassword" class="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                    {{ isSubmittingPassword ? 'กำลังบันทึก...' : (userHasPassword ? 'เปลี่ยนรหัสผ่าน' : 'ตั้งรหัสผ่าน') }}
                  </button>
                </div>
              </form>
            </div>
          </Transition>
          <div class="absolute inset-0 z-0 bg-black/70 backdrop-blur-sm" @click="closeChangePasswordModal"></div>
        </div>
      </Transition>
    </Teleport>
  </AppTabsLayout>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'

type LineConnectionStatus = {
  connected: boolean
  lineUserId: string
  notificationsEnabled: boolean
  classRemindersEnabled: boolean
  classReminderMinutes: number
  connectedAt: string | null
}

type LineLinkCodeResponse = {
  code: string
  expiresAt: string
  expiresInSeconds: number
}

type GoogleCalendarStatus = {
  connected: boolean
  connectedAt: string | null
}

definePageMeta({ middleware: 'auth' })
useHead({ title: 'Profile' })

const router = useRouter()
const route = useRoute()
const { currentUser: user, updateProfile, changePassword } = useAuth()
const { apiFetch } = useBackendApi()
const { toastSuccess, toastError } = useAlert()
const config = useRuntimeConfig()
const { allModules, enabledModules, isModuleEnabled, toggleModule, enableAllModules, setModules } = useUserModules()

const handleToggleModule = (modId: any, label: string) => {
  const isCurrentlyEnabled = isModuleEnabled(modId)
  if (isCurrentlyEnabled && enabledModules.value.length <= 1) {
    toastError('จำเป็นต้องเปิดใช้งานอย่างน้อย 1 ฟังก์ชัน')
    return
  }
  const success = toggleModule(modId)
  if (success) {
    if (!isCurrentlyEnabled) {
      toastSuccess(`เปิดใช้งานฟังก์ชัน "${label}" เรียบร้อยแล้ว`)
    } else {
      toastSuccess(`ปิดการใช้งานฟังก์ชัน "${label}" แล้ว`)
    }
  } else {
    toastError('ไม่สามารถปิดฟังก์ชันสุดท้ายได้')
  }
}

const handleEnableAllModules = () => {
  enableAllModules()
  toastSuccess('เปิดใช้งานทุกฟังก์ชันเรียบร้อยแล้ว')
}

const handleEnableOnlyCashflow = () => {
  setModules(['cashflow'])
  toastSuccess('ตั้งค่าเฉพาะระบบการเงินเรียบร้อยแล้ว')
}

const userMe = ref<{ userId: string; email: string; fullName: string; hasGoogle: boolean; hasLine: boolean; hasPassword: boolean } | null>(null)
const userHasPassword = computed(() => userMe.value?.hasPassword ?? true)

// Edit Profile state
const isEditProfileModalOpen = ref(false)
const isSubmittingProfile = ref(false)
const editProfileForm = reactive({
  fullName: '',
})

// Change Password state
const isChangePasswordModalOpen = ref(false)
const isSubmittingPassword = ref(false)
const changePasswordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const isLoading = ref(true)
const errorMessage = ref('')
const isLineLoading = ref(true)
const isSavingLine = ref(false)
const isTestingLine = ref(false)
const isGeneratingLineCode = ref(false)
const lineStatus = ref<LineConnectionStatus>({
  connected: false, lineUserId: '', notificationsEnabled: false, classRemindersEnabled: false, classReminderMinutes: 15, connectedAt: null,
})
const lineLinkCode = ref<LineLinkCodeResponse | null>(null)
const lineUserIdInput = ref('')
const lineNotificationsEnabled = ref(true)
const lineClassRemindersEnabled = ref(false)
const lineClassReminderMinutes = ref(15)

const isGoogleLoading = ref(true)
const isDisconnectingGoogle = ref(false)
const googleStatus = ref<GoogleCalendarStatus>({ connected: false, connectedAt: null })
const isSyncingAllGoogle = ref(false)
const { syncAllEventsToGoogle } = useGoogleCalendarSync()

let lineStatusPollingTimer: ReturnType<typeof setInterval> | number | null = null

const currentUser = computed(() => user.value)
const createEmptyLineStatus = (): LineConnectionStatus => ({ connected: false, lineUserId: '', notificationsEnabled: false, classRemindersEnabled: false, classReminderMinutes: 15, connectedAt: null })

const openEditProfileModal = () => {
  editProfileForm.fullName = currentUser.value?.fullName || ''
  isEditProfileModalOpen.value = true
}

const closeEditProfileModal = () => {
  isEditProfileModalOpen.value = false
}

const submitEditProfile = async () => {
  if (isSubmittingProfile.value) return
  const { toastSuccess, toastError, toastWarning } = useAlert()
  const name = editProfileForm.fullName.trim()
  if (!name) {
    toastWarning('กรุณาระบุชื่อ-นามสกุล')
    return
  }
  isSubmittingProfile.value = true
  try {
    const res = await updateProfile(name)
    toastSuccess(res.message || 'อัปเดตข้อมูลโปรไฟล์สำเร็จ')
    closeEditProfileModal()
  } catch (error: any) {
    console.error('Update profile error:', error)
    toastError(getRequestErrorMessage(error, 'อัปเดตโปรไฟล์ไม่สำเร็จ'))
  } finally {
    isSubmittingProfile.value = false
  }
}

const openChangePasswordModal = () => {
  changePasswordForm.currentPassword = ''
  changePasswordForm.newPassword = ''
  changePasswordForm.confirmPassword = ''
  isChangePasswordModalOpen.value = true
}

const closeChangePasswordModal = () => {
  isChangePasswordModalOpen.value = false
}

const submitChangePassword = async () => {
  if (isSubmittingPassword.value) return
  const { toastSuccess, toastError, toastWarning } = useAlert()
  const { currentPassword, newPassword, confirmPassword } = changePasswordForm
  if (userHasPassword.value && !currentPassword) {
    toastWarning('กรุณาระบุรหัสผ่านปัจจุบัน')
    return
  }
  if (!newPassword || newPassword.length < 6) {
    toastWarning('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร')
    return
  }
  if (newPassword !== confirmPassword) {
    toastWarning('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน')
    return
  }
  isSubmittingPassword.value = true
  try {
    const res = await changePassword(userHasPassword.value ? currentPassword : null, newPassword)
    toastSuccess(res.message || (userHasPassword.value ? 'เปลี่ยนรหัสผ่านสำเร็จ' : 'ตั้งรหัสผ่านสำเร็จ'))
    if (userMe.value) {
      userMe.value.hasPassword = true
    }
    closeChangePasswordModal()
  } catch (error: any) {
    console.error('Change password error:', error)
    toastError(getRequestErrorMessage(error, userHasPassword.value ? 'เปลี่ยนรหัสผ่านไม่สำเร็จ' : 'ตั้งรหัสผ่านไม่สำเร็จ'))
  } finally {
    isSubmittingPassword.value = false
  }
}

const getProfileValue = (...values: unknown[]) => {
  const matchedValue = values.find(value => typeof value === 'string' && value.trim())
  return typeof matchedValue === 'string' ? matchedValue.trim() : ''
}

const getFallbackNamePart = (index: number) => {
  const [first = '', ...rest] = displayName.value.split(' ').filter(Boolean)
  return index === 0 ? first : rest.join(' ')
}

const firstName = computed(() => getFallbackNamePart(0) || '-')
const lastName = computed(() => getFallbackNamePart(1) || '-')
const displayName = computed<string>(() => getProfileValue(currentUser.value?.fullName) || currentUser.value?.email?.split('@')[0] || '')
const avatarFallback = computed(() => displayName.value.trim().charAt(0).toUpperCase() || 'U')

const importantProfileRows = computed(() => [
  { key: 'ชื่อ', value: firstName.value },
  { key: 'นามสกุล', value: lastName.value },
  { key: 'ชื่อที่แสดง', value: displayName.value || '-' },
  { key: 'อีเมล', value: currentUser.value?.email || '-' },
  { key: 'รหัสผ่าน', value: userHasPassword.value ? '•••••••• (ตั้งค่าแล้ว)' : 'ยังไม่ได้ตั้งรหัสผ่าน (เข้าด้วย Social Login)' },
])

const lineStatusLabel = computed(() => {
  if (!lineStatus.value.connected) return 'ยังไม่ได้เชื่อมต่อ'
  const parts = []
  if (lineStatus.value.notificationsEnabled) parts.push('แจ้งงาน/กิจกรรม')
  if (lineStatus.value.classRemindersEnabled) parts.push('แจ้งคาบเรียน')
  return parts.length > 0 ? `เชื่อมต่อแล้ว · ${parts.join(' + ')}` : 'เชื่อมต่อแล้ว · ปิดการแจ้งเตือน'
})

const lineStatusBadgeClass = computed(() => {
  if (!lineStatus.value.connected) return 'border-gray-700 bg-gray-800/40 text-gray-400'
  return lineStatus.value.notificationsEnabled
    ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
    : 'border-amber-500/30 bg-amber-500/15 text-amber-300'
})

const googleStatusLabel = computed(() => googleStatus.value.connected ? 'เชื่อมต่อแล้ว' : 'ยังไม่ได้เชื่อมต่อ')

const googleStatusBadgeClass = computed(() => googleStatus.value.connected
  ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
  : 'border-gray-700 bg-gray-800/40 text-gray-400')

const lineLinkCodeExpiresAtText = computed(() => lineLinkCode.value?.expiresAt ? new Date(lineLinkCode.value.expiresAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }) : '-')
const hasLineLinkCode = computed(() => Boolean(lineLinkCode.value?.code))
const lineBotDisplayName = computed(() => config.public.line?.botDisplayName?.trim() || 'MyLife Bot')
const lineBotAddFriendUrl = computed(() => config.public.line?.botAddFriendUrl?.trim() || '')

const normalizeLineUserIdInput = (value: string) => {
  const normalized = value.trim()
  return /^U[0-9a-f]{32}$/i.test(normalized) ? normalized : ''
}

const getRequestErrorMessage = (error: any, fallbackMessage: string) => error?.data?.statusMessage || error?.statusMessage || error?.message || fallbackMessage

const syncLineForm = () => {
  lineUserIdInput.value = lineStatus.value.lineUserId
  lineNotificationsEnabled.value = lineStatus.value.connected ? lineStatus.value.notificationsEnabled : true
  lineClassRemindersEnabled.value = lineStatus.value.connected ? lineStatus.value.classRemindersEnabled : false
  lineClassReminderMinutes.value = lineStatus.value.connected ? lineStatus.value.classReminderMinutes : 15
}

const stopLineStatusPolling = () => {
  if (lineStatusPollingTimer) { clearInterval(lineStatusPollingTimer); lineStatusPollingTimer = null }
}

const loadLineStatus = async (options: { silent?: boolean, notifyOnConnect?: boolean } = {}) => {
  const shouldShowLoader = !options.silent
  const wasConnected = lineStatus.value.connected
  if (shouldShowLoader) isLineLoading.value = true
  try {
    lineStatus.value = await $fetch<LineConnectionStatus>('/api/line/status')
    syncLineForm()
    if (lineStatus.value.connected) {
      stopLineStatusPolling()
      lineLinkCode.value = null
      if (options.notifyOnConnect && !wasConnected) toastSuccess('เชื่อมต่อ LINE สำเร็จแล้ว')
    }
  } catch (error: any) {
    console.error('Load line status error:', error)
    if (!options.silent) lineStatus.value = createEmptyLineStatus()
  } finally {
    if (shouldShowLoader) isLineLoading.value = false
  }
}

const startLineStatusPolling = () => {
  if (!import.meta.client) return
  stopLineStatusPolling()
  lineStatusPollingTimer = window.setInterval(async () => {
    if (!lineLinkCode.value) { stopLineStatusPolling(); return }
    if (new Date(lineLinkCode.value.expiresAt).getTime() <= Date.now()) { lineLinkCode.value = null; stopLineStatusPolling(); return }
    await loadLineStatus({ silent: true, notifyOnConnect: true })
  }, 4000)
}

const copyTextToClipboard = async (text: string, successMessage: string) => {
  if (!import.meta.client || !navigator.clipboard) { toastError('เบราว์เซอร์ยังไม่รองรับการคัดลอก'); return false }
  try { await navigator.clipboard.writeText(text); toastSuccess(successMessage); return true }
  catch (error) { console.error('Clipboard write error:', error); toastError('คัดลอกข้อความไม่สำเร็จ'); return false }
}

const copyLineLinkCode = async () => {
  if (!lineLinkCode.value?.code) return
  await copyTextToClipboard(lineLinkCode.value.code, 'คัดลอกข้อความเชื่อม LINE แล้ว')
}

const getLineShareUrl = (message: string) => `https://line.me/R/msg/text/?${encodeURIComponent(message)}`
const openLineComposer = (message: string) => { if (!import.meta.client) return; window.open(getLineShareUrl(message), '_blank', 'noopener,noreferrer') }

const saveLineConnection = async (lineUserId: string) => {
  const updated = await $fetch<LineConnectionStatus>('/api/line/connect', {
    method: 'POST', body: {
      lineUserId,
      notificationsEnabled: lineNotificationsEnabled.value,
      classRemindersEnabled: lineClassRemindersEnabled.value,
      classReminderMinutes: lineClassReminderMinutes.value,
    },
  })
  lineLinkCode.value = null
  stopLineStatusPolling()
  return updated
}

const generateLineLinkCode = async (options: { openLine?: boolean } = {}) => {
  if (isGeneratingLineCode.value || isSavingLine.value || isTestingLine.value) return
  isGeneratingLineCode.value = true
  try {
    lineLinkCode.value = await $fetch<LineLinkCodeResponse>('/api/line/link-code', {
      method: 'POST', body: {
        notificationsEnabled: lineNotificationsEnabled.value,
        classRemindersEnabled: lineClassRemindersEnabled.value,
        classReminderMinutes: lineClassReminderMinutes.value,
      },
    })
    await copyTextToClipboard(lineLinkCode.value.code, 'คัดลอกข้อความเชื่อม LINE แล้ว')
    if (options.openLine) openLineComposer(lineLinkCode.value.code)
    startLineStatusPolling()
  } catch (error: any) {
    console.error('Generate line link code error:', error)
    toastError(getRequestErrorMessage(error, 'สร้างโค้ดเชื่อมต่อ LINE ไม่สำเร็จ'))
  } finally {
    isGeneratingLineCode.value = false
  }
}

const openLineForConnection = async () => {
  if (lineLinkCode.value?.code) { openLineComposer(lineLinkCode.value.code); return }
  await generateLineLinkCode({ openLine: true })
}

const refreshLineStatus = async () => {
  await loadLineStatus({ notifyOnConnect: true })
  if (!lineStatus.value.connected) toastError('ยังไม่พบการเชื่อมต่อ LINE')
}

const connectLine = async () => {
  if (isSavingLine.value || isTestingLine.value) return
  const lineUserId = normalizeLineUserIdInput(lineUserIdInput.value)
  if (!lineUserId) { toastError('กรุณากรอก LINE User ID ให้ถูกต้อง'); return }
  isSavingLine.value = true
  try {
    const updated = await saveLineConnection(lineUserId)
    lineStatus.value = updated
    syncLineForm()
    toastSuccess('บันทึกการเชื่อมต่อ LINE สำเร็จ')
  }
  catch (error: any) { console.error('Connect line error:', error); toastError(getRequestErrorMessage(error, 'เชื่อมต่อ LINE ไม่สำเร็จ')) }
  finally { isSavingLine.value = false }
}

const saveLinePreferences = async () => {
  if (!lineStatus.value.connected || isSavingLine.value || isTestingLine.value) return
  isSavingLine.value = true
  try {
    const updated = await saveLineConnection(lineStatus.value.lineUserId)
    // อัปเดต lineStatus จากค่าที่บันทึกสำเร็จ แทนที่จะ sync จาก server
    lineStatus.value = updated
    toastSuccess('บันทึกการตั้งค่าแจ้งเตือน LINE แล้ว')
  }
  catch (error: any) { console.error('Save line preferences error:', error); toastError(getRequestErrorMessage(error, 'บันทึกการตั้งค่าแจ้งเตือนไม่สำเร็จ')) }
  finally { isSavingLine.value = false }
}

const disconnectLine = async () => {
  if (!lineStatus.value.connected || isSavingLine.value || isTestingLine.value) return
  isSavingLine.value = true
  try {
    lineStatus.value = await $fetch<LineConnectionStatus>('/api/line/disconnect', { method: 'POST' })
    syncLineForm()
    toastSuccess('ยกเลิกการเชื่อมต่อ LINE แล้ว')
  }
  catch (error: any) { console.error('Disconnect line error:', error); toastError(getRequestErrorMessage(error, 'ยกเลิกการเชื่อมต่อ LINE ไม่สำเร็จ')) }
  finally { isSavingLine.value = false }
}

const sendLineTestMessage = async () => {
  if (!lineStatus.value.connected || isSavingLine.value || isTestingLine.value) return
  isTestingLine.value = true
  try { await $fetch('/api/line/test', { method: 'POST' }); toastSuccess('ส่งข้อความทดสอบไปที่ LINE แล้ว') }
  catch (error: any) { console.error('Test line message error:', error); toastError(getRequestErrorMessage(error, 'ส่งข้อความทดสอบไม่สำเร็จ')) }
  finally { isTestingLine.value = false }
}

const loadGoogleStatus = async () => {
  isGoogleLoading.value = true
  try {
    googleStatus.value = await $fetch<GoogleCalendarStatus>('/api/google/status')
  } catch (error) {
    console.error('Load Google Calendar status error:', error)
    googleStatus.value = { connected: false, connectedAt: null }
  } finally {
    isGoogleLoading.value = false
  }
}

const refreshGoogleStatus = async () => {
  await loadGoogleStatus()
  if (!googleStatus.value.connected) toastError('ยังไม่พบการเชื่อมต่อ Google Calendar')
}

const disconnectGoogle = async () => {
  if (!googleStatus.value.connected || isDisconnectingGoogle.value) return
  isDisconnectingGoogle.value = true
  try {
    googleStatus.value = await $fetch<GoogleCalendarStatus>('/api/google/disconnect', { method: 'POST' })
    toastSuccess('ยกเลิกการเชื่อมต่อ Google Calendar แล้ว')
  } catch (error: any) {
    console.error('Disconnect Google Calendar error:', error)
    toastError(getRequestErrorMessage(error, 'ยกเลิกการเชื่อมต่อ Google Calendar ไม่สำเร็จ'))
  } finally {
    isDisconnectingGoogle.value = false
  }
}

const syncAllEvents = async () => {
  if (isSyncingAllGoogle.value) return
  isSyncingAllGoogle.value = true
  try {
    const res = await syncAllEventsToGoogle()
    if (res.success) {
      if (res.processedCount === 0) {
        toastSuccess('ไม่มีกิจกรรมย้อนหลังที่ค้างการซิงค์')
      } else {
        toastSuccess(`ซิงค์กิจกรรมย้อนหลังสำเร็จทั้งหมด ${res.processedCount} รายการ`)
      }
    } else {
      if (res.reason === 'not_connected') {
        toastError('กรุณาเชื่อมต่อ Google Calendar ก่อนซิงค์กิจกรรม')
      } else {
        toastError(`ซิงค์สำเร็จ ${res.processedCount} รายการ, ล้มเหลว ${res.failedCount} รายการ`)
      }
    }
  } catch (error: any) {
    console.error('Sync all events error:', error)
    toastError(getRequestErrorMessage(error, 'เกิดข้อผิดพลาดในการซิงค์กิจกรรมย้อนหลัง'))
  } finally {
    isSyncingAllGoogle.value = false
  }
}

const consumeGoogleRedirectStatus = () => {
  const googleQuery = route.query.google
  const reasonQuery = typeof route.query.reason === 'string' ? route.query.reason : ''
  if (!googleQuery) return
  if (googleQuery === 'success') {
    toastSuccess('เชื่อมต่อ Google Calendar สำเร็จแล้ว')
  } else if (googleQuery === 'error') {
    toastError(reasonQuery ? `เชื่อมต่อ Google Calendar ไม่สำเร็จ: ${reasonQuery}` : 'เชื่อมต่อ Google Calendar ไม่สำเร็จ กรุณาลองใหม่')
  }
  const { google, reason, ...restQuery } = route.query
  router.replace({ query: restQuery })
}

const loadProfile = async () => {
  isLoading.value = true; errorMessage.value = ''
  try {
    if (!user.value) { await router.push('/login'); return }
    const me = await apiFetch<{ userId: string; email: string; fullName: string; hasGoogle: boolean; hasLine: boolean; hasPassword: boolean }>('/api/Auth/me')
    userMe.value = me
  } catch (error: any) {
    console.error('Load profile error:', error)
    errorMessage.value = error?.message || 'โหลดข้อมูลโปรไฟล์ไม่สำเร็จ'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => { loadProfile(); loadLineStatus(); loadGoogleStatus(); consumeGoogleRedirectStatus() })
onBeforeUnmount(() => { stopLineStatusPolling() })
</script>
