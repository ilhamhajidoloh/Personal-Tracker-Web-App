// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    line: {
      channelAccessToken: '',
      channelSecret: '',
    },
    public: {
      appUrl: '',
      line: {
        botAddFriendUrl: '',
        botDisplayName: 'MyLife Bot',
      },
    },
  },
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/supabase'],
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