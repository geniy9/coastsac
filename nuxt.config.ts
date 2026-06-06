import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: [
    '@nuxt/ui',
    '@nuxt/image', 
    '@nuxtjs/i18n',
    '@nuxtjs/strapi',
    '@pinia/nuxt',
    'nuxt-signature-pad',
    'nuxt-gtag',
    // './modules/prerender',
  ],

  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
      link: [
        { rel: "icon", type: "image/ico", sizes: "32x32", href: "/favicon.ico" },
        { rel: "icon", type: "image/png", sizes: "32x32", href: "/32.png" },
        { rel: "apple-touch-icon", type: "image/png", sizes: "180x180", href: "/180.png" },
      ]
    },
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'slide', mode: 'out-in' }
  },

  ui: {
    colorMode: true,
  },

  i18n: {
    locales: [
      { code: 'en', language: 'en-US', file: 'en.json', name: 'English' },
      { code: 'es', language: 'es-ES', file: 'es.json', name: 'Español' }
    ],
    langDir: './locales',
    strategy: 'prefix_except_default',
    defaultLocale: 'en',
    baseUrl: process.env.ORIGIN
  },

  strapi: {
    url: process.env.STRAPI_URL,
    prefix: '/api',
    version: 'v5',
    cookie: {},
    cookieName: 'strapi_jwt'
  },

  pinia: {
    storesDirs: ['./store/**'],
  },

  runtimeConfig: {
    public: {
      ORIGIN: process.env.ORIGIN,
      STRAPI_URL: process.env.STRAPI_URL,
      RECAPTCHA_SITE_KEY: process.env.NUXT_PUBLIC_RECAPTCHA_SITE_KEY
    }
  },

  gtag: {
    id: 'G-H7P1D4NVD4'
  },

  css: ['~/assets/css/main.css', '~/assets/scss/app.scss'],

  vite: {
    plugins: [
      tailwindcss()
    ],
  },
})