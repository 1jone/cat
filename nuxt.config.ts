// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  app: {
    head: {
      title: 'cat site',
      titleTemplate: '%s | Cat Site',
      meta: [
        { name: 'description', content: '这是一个关于小猫的可爱网站' }
      ]
    }
  }
})


