export default defineNuxtConfig({
  compatibilityDate: '2025-01-15',

  devtools: { enabled: false },

  modules: [
    '@nuxt/eslint', 
    '@nuxt/ui', 
    '@nuxt/image', 
    '@vueuse/nuxt', 
    '@nuxtjs/i18n',
    '@nuxtjs/strapi',
    '@pinia/nuxt',
    'nuxt-signature-pad',
    'nuxt-gtag',
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

  routeRules: {
    '/': { prerender: true }
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
    cookie: {
      path: '/',
      maxAge: 14 * 24 * 60 * 60, // 14 days
    },
    cookieName: 'strapi_jwt',
    auth: {
      populate: ['role', 'avatar']
    }
  },

  pinia: {
    storesDirs: ['./store/**'],
  },

  runtimeConfig: {
    fuelCardApiUsername: process.env.FUEL_CARD_API_USERNAME || '',
    fuelCardApiPassword: process.env.FUEL_CARD_API_PASSWORD || '',
    public: {
      fuelCardApiCustomerId: process.env.FUEL_CARD_API_CUSTOMER_ID || '46876',
      ORIGIN: process.env.ORIGIN,
      STRAPI_URL: process.env.STRAPI_URL,
      RECAPTCHA_SITE_KEY: process.env.NUXT_PUBLIC_RECAPTCHA_SITE_KEY
    }
  },

  gtag: {
    id: 'G-H7P1D4NVD4'
  },

  css: ['~/assets/css/main.css'],

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  vite: {
    optimizeDeps: {
      include: [
        '@tanstack/table-core',
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'zod',
      ]
    },
    build: {
      rollupOptions: {
        maxParallelFileOps: 2,
      }
    }
  },
  
  sourcemap: {
    server: false,
    client: false,
  }
})