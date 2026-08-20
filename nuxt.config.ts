// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  experimental: {
    appManifest: false,
  },
  vite: {
    server: {
      allowedHosts: true,
      fs: {
        strict: false,
      },
    },
  },
  runtimeConfig: {
    cronSecret: '',
    jwt: {
      key: '',
      issuer: '',
      audience: '',
    },
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
      apiBase: '',
      googleClientId: '',
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
          "script-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/client",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com/gsi/style",
          "font-src 'self' https://fonts.gstatic.com data:",
          "img-src 'self' data: blob:",
          `connect-src 'self' https://accounts.google.com/gsi/ ${process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:5147'}`,
          "frame-src https://accounts.google.com/gsi/",
          "frame-ancestors 'self'",
          "base-uri 'self'",
          "form-action 'self' https://accounts.google.com",
        ].join('; '),
      },
    },
  },
  modules: ['@nuxtjs/tailwindcss', '@vite-pwa/nuxt'],
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
      navigateFallback: undefined,
      globPatterns: ['**/*.{js,css,html,png,svg,ico}']
    },
    devOptions: {
      enabled: false,
      suppressWarnings: true,
      type: 'module',
    }
  },
  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css'
  }
})