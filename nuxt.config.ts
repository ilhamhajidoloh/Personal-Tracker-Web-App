// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    cronSecret: '',
    line: {
      channelAccessToken: '',
      channelSecret: '',
    },
    google: {
      clientId: '',
      clientSecret: '',
    },
    public: {
      appUrl: '',
      line: {
        botAddFriendUrl: '',
        botDisplayName: 'MyLife Bot',
      },
    },
  },
  routeRules: {
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        // ระยะทดสอบ: ใช้ Report-Only ก่อน ถ้าไม่มีอะไรพังใน console
        // ค่อยเปลี่ยนชื่อ header เป็น 'Content-Security-Policy' เพื่อบังคับใช้จริง
        'Content-Security-Policy-Report-Only': [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com data:",
          "img-src 'self' data: blob: https://xeazapbonyjcfufpgmpl.supabase.co",
          "connect-src 'self' https://xeazapbonyjcfufpgmpl.supabase.co wss://xeazapbonyjcfufpgmpl.supabase.co",
          "frame-ancestors 'self'",
          "base-uri 'self'",
          "form-action 'self' https://accounts.google.com",
        ].join('; '),
      },
    },
  },
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/supabase', '@vite-pwa/nuxt'],
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'MyLife App',
      short_name: 'MyLife',
      id: '/',
      start_url: '/',
      scope: '/',
      theme_color: '#ffffff',
      background_color: '#ffffff',
      display: 'standalone',
      icons: [
        {
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ],
      screenshots: [
        {
          src: 'screenshot-desktop.png',
          sizes: '1920x1080',
          type: 'image/png',
          form_factor: 'wide'
        },
        {
          src: 'screenshot-mobile.png',
          sizes: '1080x1920',
          type: 'image/png'
        }
      ]
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}']
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      navigateFallbackAllowlist: [/^\/$/],
      type: 'module',
    }
  },
  supabase: {
    redirect: false,
    redirectOptions: {
      login: '/login',
      callback: '/auth/callback',
    }
  },
  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css'
  }
})