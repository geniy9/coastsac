<script setup>
const { t } = useI18n()
const { originUrl } = useConfig()

definePageMeta({
  bgColorPage: 'dark:bg-white dark:text-black',
  bookkeepingPage: true
})

useSeoMeta({
  title: computed(() => t('seo.bookkeeping.title')),
  description: computed(() => t('seo.bookkeeping.description')),
  keywords: computed(() => t('seo.bookkeeping.keywords')),
  ogTitle: () => t('seo.bookkeeping.title'),
  ogDescription: () => t('seo.bookkeeping.description'),
  ogType: 'website',
  ogUrl: `${originUrl}/bookkeeping`,
  // ogImage: `${originUrl}/img/og/bookkeeping.jpg`,
  twitterCard: 'summary_large_image'
})

const plans = computed(() => [
  {
    title: t('bookkeeping.pricing.plans.essential.title'),
    description: t('bookkeeping.pricing.plans.essential.desc'),
    price: '$395',
    billingCycle: '/mo',
    billingPeriod: t('bookkeeping.pricing.billed_annually', { save: '$480' }),
    button: {
      label: t('bookkeeping.pricing.free_consult'),
      color: 'primary',
      variant: 'solid',
      class: 'bg-coast hover:bg-emerald-800 text-white font-semibold py-3 rounded-xl transition-all'
    },
    features: [
      { title: t('bookkeeping.pricing.features.bank_accounts', { count: 4 }), icon: 'i-hugeicons-checkmark-circle-01' },
      { title: t('bookkeeping.pricing.features.weekly_bookkeeping'), icon: 'i-hugeicons-checkmark-circle-01' },
      { title: t('bookkeeping.pricing.features.dedicated_team'), icon: 'i-hugeicons-checkmark-circle-01' },
      { title: t('bookkeeping.pricing.features.cash_basis'), icon: 'i-hugeicons-checkmark-circle-01' },
      { title: t('bookkeeping.pricing.features.one_integration'), icon: 'i-hugeicons-checkmark-circle-01' }
    ]
  },
  {
    title: t('bookkeeping.pricing.plans.plus.title'),
    description: t('bookkeeping.pricing.plans.plus.desc'),
    price: '$695',
    billingCycle: '/mo',
    billingPeriod: t('bookkeeping.pricing.billed_annually', { save: '$840' }),
    badge: t('bookkeeping.pricing.plans.plus.badge'),
    scale: true,
    highlight: true,
    button: {
      label: t('bookkeeping.pricing.free_consult'),
      color: 'primary',
      variant: 'solid',
      class: 'bg-coast hover:bg-emerald-800 text-white font-semibold py-3 rounded-xl transition-all'
    },
    features: [
      { title: t('bookkeeping.pricing.features.plus_header'), icon: 'i-hugeicons-checkmark-circle-01', class: 'font-semibold text-gray-900 dark:text-white' },
      { title: t('bookkeeping.pricing.features.bank_accounts', { count: 6 }), icon: 'i-hugeicons-checkmark-circle-01' },
      { title: t('bookkeeping.pricing.features.cash_or_modified'), icon: 'i-hugeicons-checkmark-circle-01' },
      { title: t('bookkeeping.pricing.features.semi_annual_tax'), icon: 'i-hugeicons-checkmark-circle-01' },
      { title: t('bookkeeping.pricing.features.two_integrations'), icon: 'i-hugeicons-checkmark-circle-01' }
    ]
  },
  {
    title: t('bookkeeping.pricing.plans.advanced.title'),
    description: t('bookkeeping.pricing.plans.advanced.desc'),
    price: '$995',
    billingCycle: '/mo',
    billingPeriod: t('bookkeeping.pricing.billed_annually', { save: '$1,200' }),
    button: {
      label: t('bookkeeping.pricing.free_consult'),
      color: 'primary',
      variant: 'solid',
      class: 'bg-coast hover:bg-emerald-800 text-white font-semibold py-3 rounded-xl transition-all'
    },
    features: [
      { title: t('bookkeeping.pricing.features.advanced_header'), icon: 'i-hugeicons-checkmark-circle-01', class: 'font-semibold text-gray-900 dark:text-white' },
      { title: t('bookkeeping.pricing.features.bank_accounts', { count: 12 }), icon: 'i-hugeicons-checkmark-circle-01' },
      { title: t('bookkeeping.pricing.features.custom_chart'), icon: 'i-hugeicons-checkmark-circle-01' },
      { title: t('bookkeeping.pricing.features.bi_weekly_calls'), icon: 'i-hugeicons-checkmark-circle-01' },
      { title: t('bookkeeping.pricing.features.four_integrations'), icon: 'i-hugeicons-checkmark-circle-01' }
    ]
  }
])
</script>
<template>
  <div>
    <!-- HERO -->
    <section class="relative overflow-hidden">
      <div class="w-full grid grid-cols-1 lg:grid-cols-12 min-h-[500px] items-stretch">
        
        <!-- LEFT -->
        <div class="lg:col-span-7 flex flex-col justify-center items-center gap-8 px-6 sm:px-24 z-10 mt-20">
          <img src="/logo_ctc.svg" alt="Coast to Coast Logo" class="w-80 lg:w-120" />
          <h1 class="text-xl sm:text-2xl font-bold tracking-tight leading-tight relative after:content-[''] after:absolute after:w-20 after:h-1 after:bg-coast after:left-0 after:-bottom-2">
            {{ $t('bookkeeping.hero.slogan') }}
          </h1>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <!-- 1. Bookkeeping -->
            <div class="flex flex-col items-center text-center">
              <div class="w-14 h-14 rounded-full bg-coast flex items-center justify-center mb-3 shadow-md">
                <UIcon name="hugeicons:document-validation" class="text-3xl text-white" />
              </div>
              <span class="text-xs uppercase tracking-wide max-w-24">
                {{ $t('bookkeeping.hero.services.bookkeeping') }}
              </span>
            </div>
            <!-- 2. Account Reconciliation -->
            <div class="flex flex-col items-center text-center">
              <div class="w-14 h-14 rounded-full bg-coast flex items-center justify-center mb-3 shadow-md">
                <UIcon name="hugeicons:bank" class="text-3xl text-white" />
              </div>
              <span class="text-xs uppercase tracking-wide max-w-24">
                {{ $t('bookkeeping.hero.services.reconciliation') }}
              </span>
            </div>
            <!-- 3. Financial Reporting -->
            <div class="flex flex-col items-center text-center">
              <div class="w-14 h-14 rounded-full bg-coast flex items-center justify-center mb-3 shadow-md">
                <UIcon name="hugeicons:chart-line-data-01" class="text-3xl text-white" />
              </div>
              <span class="text-xs uppercase tracking-wide max-w-24">
                {{ $t('bookkeeping.hero.services.reporting') }}
              </span>
            </div>
            <!-- 4. Payroll Support -->
            <div class="flex flex-col items-center text-center">
              <div class="w-14 h-14 rounded-full bg-coast flex items-center justify-center mb-3 shadow-md">
                <UIcon name="hugeicons:user-group" class="text-3xl text-white" />
              </div>
              <span class="text-xs uppercase tracking-wide max-w-24">
                {{ $t('bookkeeping.hero.services.payroll') }}
              </span>
            </div>
          </div>
        </div>

        <!-- RIGHT -->
        <div class="hidden lg:block lg:col-span-5 relative min-h-[300px] lg:min-h-full overflow-hidden">         
          <div class="absolute inset-y-0 right-0 w-full lg:w-[95%] h-full">
            <img src="/img/bookkeeping/desktop.jpg" alt="Bookkeeping workspace" 
              class="h-full object-contain object-top-right " />
          </div>
        </div>

      </div>
    </section>

    <!-- PRICING -->
    <section class="py-16 md:py-24">
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center max-w-3xl mx-auto mb-16">
          <h2 class="text-3xl sm:text-4xl font-extrabold text-coast">
            {{ $t('bookkeeping.pricing.title') }}
          </h2>
          <p class="text-gray-600 mt-4 text-lg">
            {{ $t('bookkeeping.pricing.description') }}
          </p>
        </div>

        <UPricingPlans compact class="gap-8">
          <UPricingPlan v-for="(plan, index) in plans" :key="index" v-bind="plan" 
            class="bg-white" />
        </UPricingPlans>

        <div class="flex items-center justify-center gap-3 mt-12 text-sm sm:text-base text-gray-700">
          <UIcon name="hugeicons:checkmark-circle-03" class="text-coast text-2xl" />
          <span>{{ $t('bookkeeping.pricing.bottom_note') }}</span>
        </div>
      </div>
    </section>

    <!-- VIDEO -->
    <section class="py-16 bg-white dark:bg-zinc-900">
      <div class="max-w-6xl mx-auto px-6">
        <div class="grid md:grid-cols-2 gap-12 items-center">
          <div class="space-y-6">
            <h3 class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
              {{ $t('bookkeeping.reliable.title') }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
              {{ $t('bookkeeping.reliable.description') }}
            </p>
            <div class="flex flex-col gap-3">
              <div class="flex items-center gap-3">
                <UIcon name="hugeicons:checkmark-circle-03" class="text-coast text-2xl" />
                <span class="text-gray-700 dark:text-gray-300 font-medium">
                  Clear live reporting metrics
                </span>
              </div>
              <div class="flex items-center gap-3">
                <UIcon name="hugeicons:checkmark-circle-03" class="text-coast text-2xl" />
                <span class="text-gray-700 dark:text-gray-300 font-medium">
                  Interactive balance tracking
                </span>
              </div>
            </div>
          </div>

          <div class="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800">
            <video src="/video/bookkeeping_preview.mp4" 
              autoplay loop muted playsinline
              class="w-full aspect-video object-cover"
            ></video>
            <div class="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 text-xs text-white">
              <span class="w-2.5 h-2.5 rounded-full bg-coast animate-pulse"></span>
              <span>15-Sec Feature Tour</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Reliable Bookkeeping -->
    <!-- <section>
      <UPageSection 
        class="max-w-4xl mx-auto px-6 text-center" 
        :title="t('bookkeeping.reliable.title')"
        :description="t('bookkeeping.reliable.description')"
        :headline="t('bookkeeping.reliable.subtitle')" 
        :ui="{ headline: 'text-muted', title: 'text-coast', leadingIcon: 'text-coast', description: 'text-black' }"
      />
    </section> -->

    

    
  </div>
</template>