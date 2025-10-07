<script setup>
const { t } = useI18n()

const timelineItems = computed(() => [
  {
    date: t('text.timeline_step_1'),
    title: t('text.timeline_step_1_title'),
    description: t('text.timeline_step_1_desc'),
    icon: 'hugeicons:real-estate-02',
  },
  {
    date: t('text.timeline_step_2'),
    title: t('text.timeline_step_2_title'),
    description: t('text.timeline_step_2_desc'),
    icon: 'hugeicons:identity-card',
  },
  {
    date: t('text.timeline_step_3'),
    title: t('text.timeline_step_3_title'),
    description: t('text.timeline_step_3_desc'),
    icon: 'hugeicons:document-validation',
  },
  {
    date: t('text.timeline_step_4'),
    title: t('text.timeline_step_4_title'),
    description: t('text.timeline_step_4_desc'),
    icon: 'hugeicons:delivery-truck-01',
  },
  {
    date: t('text.timeline_step_5'),
    title: t('text.timeline_step_5_title'),
    description: t('text.timeline_step_5_desc'),
    icon: 'hugeicons:legal-document-01',
  },
  {
    date: t('text.timeline_step_6'),
    title: t('text.timeline_step_6_title'),
    description: t('text.timeline_step_6_desc'),
    icon: 'hugeicons:security-check',
    details: [
      t('text.timeline_step_6_detail_1'),
      t('text.timeline_step_6_detail_2'),
    ],
    note: t('text.timeline_step_6_note'),
  },
  {
    date: t('text.timeline_step_7'),
    title: t('text.timeline_step_7_title'),
    description: t('text.timeline_step_7_desc'),
    icon: 'hugeicons:maps-global-01',
  },
])

const statePermits = computed(() => [
  {
    icon: 'hugeicons:weight-scale',
    title: t('text.permit_kyu_title'),
    description: t('text.permit_kyu_desc'),
  },
  {
    icon: 'hugeicons:road-01',
    title: t('text.permit_ny_hut_title'),
    description: t('text.permit_ny_hut_desc'),
  },
  {
    icon: 'hugeicons:certificate-01',
    title: t('text.permit_nm_wd_title'),
    description: t('text.permit_nm_wd_desc'),
  },
])

useSeoMeta({
  title: computed(() => t('seo.tracking_authority.title')),
  description: computed(() => t('seo.tracking_authority.description')),
  keywords: computed(() => t('seo.tracking_authority.keywords'))
})
</script>
<template>
  <div>
    <div class="relative">
      <div class="absolute inset-0">
        <img src="/img/bg_trucking_authority.jpg" :alt="$t('text.truck_on_road')" class="w-full h-full object-cover">
        <div class="absolute inset-0 bg-black/20"></div>
        <div class="absolute inset-0 bg-gradient-to-b from-black/80 to-transparent"></div>
      </div>

      <div class="relative py-24 md:py-32 text-center md:text-left text-white flex flex-col items-stretch justify-end">
        <UContainer>
          <div class="max-w-3xl mx-auto text-center">
            <h1 class="text-4xl font-bold tracking-tight text-white dark:text-white sm:text-6xl">
              {{ $t('text.start_trucking_company') }}
            </h1>
            <p class="mt-6 text-lg leading-8 text-gray-300 dark:text-gray-300">
              {{ $t('text.start_trucking_company_desc') }}
            </p>
          </div>
        </UContainer>
      </div>
    </div>

    <UContainer class="py-10 sm:py-16">
      <div class="max-w-2xl mx-auto mb-16 text-center">
        <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          {{ $t('text.roadmap_title') }}
        </h2>
        <p class="mt-4 text-lg text-gray-600 dark:text-gray-400">
          {{ $t('text.roadmap_desc') }}
        </p>
      </div>

      <UTimeline :items="timelineItems" color="primary" class="max-w-3xl mx-auto">
        <template #title="{ item }">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ item.title }}
          </h3>
        </template>

        <template #date="{ item }">
          <span class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
            {{ item.date }}
          </span>
        </template>

        <template #description="{ item }">
          <div class="pb-8">
            <p class="mt-1 text-base leading-7 text-gray-600 dark:text-gray-300">
              {{ item.description }}
            </p>

            <ul v-if="item.details" class="mt-4 space-y-2">
              <li v-for="detail in item.details" :key="detail" class="flex items-center gap-x-3">
                <UIcon name="hugeicons:checkmark-circle-02" class="h-6 w-6 text-green-500" />
                <span class="text-gray-700 dark:text-gray-200 font-medium">{{ detail }}</span>
              </li>
            </ul>
            <p v-if="item.note" class="mt-4 text-sm text-gray-500 dark:text-gray-400 border-l-4 border-yellow-400 pl-4 py-1 bg-yellow-50 dark:bg-yellow-900/20">
              {{ item.note }}
            </p>
            <Agreement>
              <!-- {{ $t('text.pick_plan_apply') }} -->
              <UButton
                icon="hugeicons:edit-01"
                size="lg"
                class="mt-4"
                color="secondary"
                trailing>
                {{ $t('text.sign_carrier_packet') }}
              </UButton>
            </Agreement>
          </div>
        </template>
      </UTimeline>
    </UContainer>

    <div class="bg-gray-200 dark:bg-gray-900">
      <UContainer class="py-12 sm:py-20">
        <div class="max-w-2xl mx-auto mb-16 text-center">
          <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            {{ $t('text.state_permits_title') }}
          </h2>
          <p class="mt-4 text-lg text-gray-600 dark:text-gray-400">
            {{ $t('text.state_permits_desc') }}
          </p>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div v-for="(permit, index) in statePermits" :key="index" class="flex flex-col gap-6 p-4 rounded-xl bg-gray-300 dark:bg-primary/20">
            <div class="flex items-center gap-4">
              <UIcon :name="permit.icon" class="h-8 w-8 text-primary dark:text-white" />
              <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                {{ permit.title }}
              </h3>
            </div>
            <p class="text-gray-600 dark:text-gray-300 flex-grow">
              {{ permit.description }}
            </p>
            <Agreement>
              <UButton size="lg">{{ $t('text.pick_plan_apply') }}</UButton>
            </Agreement>
          </div>
        </div>
      </UContainer>
    </div>
  </div>
</template>