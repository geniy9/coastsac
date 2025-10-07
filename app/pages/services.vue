<script setup>
const { t } = useI18n()

useHead({
  title: 'Services - Light Freight',
  meta: [
    { name: 'description', content: 'Explore the range of services offered by Light Freight: CDL Dispatching, Factoring, Authority Set-up, and Business Financing.' }
  ]
})

const services = computed(() => [
  {
    title: t('text.cdl_dispatching_title'),
    description: t('text.cdl_dispatching_desc'),
    // image: '/img/service_dispatching.jpg',
    imageAlt: 'Truck dispatcher working',
    buttonText: t('text.apply_here'),
    id: 'dispatching'
  },
  {
    title: t('text.factoring_services_title'),
    description: t('text.factoring_services_desc'),
    details: [
      t('text.factoring_detail_no_monthly_min'),
      t('text.factoring_detail_no_setup_fees'),
      t('text.factoring_detail_no_maintenance_fees'),
      t('text.factoring_detail_no_termination_fees'),
      t('text.factoring_detail_no_startup_fees'),
      t('text.factoring_detail_simple_agreement'),
      t('text.factoring_detail_free_broker_checks'),
      t('text.factoring_detail_dedicated_manager'),
      t('text.factoring_detail_fund_copies'),
    ],
    // image: '/img/service_factoring.jpg',
    imageAlt: 'Hand holding money, symbolizing factoring',
    buttonText: t('text.apply_here'),
    id: 'factoring'
  },
  {
    title: t('text.authority_setup_title'),
    description: t('text.authority_setup_desc'),
    // image: '/img/service_authority.jpg',
    imageAlt: 'Documents and pen on a desk',
    buttonText: t('text.apply_here'),
    id: 'authority'
  },
  {
    title: t('text.business_financing_title'),
    description: t('text.business_financing_desc'),
    // image: '/img/service_financing.jpg',
    imageAlt: 'Calculator and coins, symbolizing business financing',
    buttonText: t('text.apply_here'),
    id: 'financing'
  },
])

const isOpen = ref(false)
const formTitle = ref('')

function openFeedbackForm(title) {
  formTitle.value = title
  isOpen.value = true
}

const formState = reactive({
  fullName: undefined,
  email: undefined,
  phone: undefined
})

const formSchema = {
  fullName: {
    type: 'string',
    min: 3,
    required: true,
    message: 'Please enter your full name'
  },
  email: {
    type: 'email',
    required: true,
    message: 'Please enter a valid email address'
  },
  phone: {
    type: 'string',
    min: 10,
    required: true,
    message: 'Please enter your phone number'
  }
}

// async function onSubmit(event) {
//   console.log('Submitted:', event.data)
//   isOpen.value = false
//   alert('Thank you for your application! We will contact you shortly.')
// }
useSeoMeta({
  title: computed(() => t('seo.services.title')),
  description: computed(() => t('seo.services.description')),
  keywords: computed(() => t('seo.services.keywords'))
})
</script>
<template>
  <div>
    <div class="relative">
      <div class="absolute inset-0">
        <img src="/img/bg_services.jpg" alt="Truck driving on a highway at sunset" 
          class="w-full h-full object-cover object-[80%]">
        <!-- <div class="absolute inset-0 bg-black/20"></div> -->
        <div class="absolute inset-0 bg-gradient-to-b from-black/80 to-transparent"></div>
      </div>

      <div class="relative py-24 md:py-32 text-center md:text-left text-white flex flex-col items-stretch justify-end">
        <UContainer>
          <div class="max-w-3xl mx-auto text-center">
            <h1 class="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              {{ $t('text.our_services_title') }}
            </h1>
            <p class="mt-6 text-lg leading-8 text-gray-300">
              {{ $t('text.our_services_desc') }}
            </p>
          </div>
        </UContainer>
      </div>
    </div>

    <section class="py-8 md:py-12">
      <div class="flex flex-col">
        <div v-for="(service, index) in services"
          :key="service.id"
          :id="service.id"
          class="section py-10 lg:py-20 grid lg:grid-cols-2 gap-12 items-center rounded-2xl"
          :class="{ 
            'lg:grid-flow-col-dense bg-gray-100 dark:bg-gray-900': index % 2 === 1, 
            'lg:pr-16': index % 2 === 0, 
            'lg:pl-16 ': index % 2 === 1 }">
          <div v-if="index % 2 === 0" class="relative rounded-lg overflow-hidden shadow-xl">
            <!-- <img :src="service.image" :alt="service.imageAlt" class="w-full h-full object-cover max-h-[400px]"> -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          </div>

          <div :class="{ 'lg:order-first': index % 2 === 1 }">
            <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              {{ service.title }}
            </h2>
            <p class="mt-4 text-lg text-gray-600 dark:text-gray-300">
              {{ service.description }}
            </p>
            <ul v-if="service.details && service.details.length" class="mt-6 space-y-3 text-gray-700 dark:text-gray-200">
              <li v-for="detail in service.details" :key="detail" class="flex items-start gap-x-3">
                <UIcon name="hugeicons:checkmark-circle-02" class="h-6 w-6 text-secondary flex-shrink-0 mt-1" />
                <span>{{ detail }}</span>
              </li>
            </ul>
            <Agreement>
              <UButton
                icon="hugeicons:hand-pointing-right-02"
                size="lg"
                class="mt-8"
                color="secondary"
                trailing>
                {{ service.buttonText }}
              </UButton>
            </Agreement>
          </div>
          <div v-if="index % 2 === 1" class="relative rounded-lg overflow-hidden shadow-xl">
            <!-- <img :src="service.image" :alt="service.imageAlt" class="w-full h-full object-cover max-h-[400px]"> -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- <UModal v-model="isOpen">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              {{ $t('text.apply_for_service') }} {{ formTitle }}
            </h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="my-0" @click="isOpen = false" />
          </div>
        </template>

        <UForm :schema="formSchema" :state="formState" class="space-y-4" @submit="onSubmit">
          <UFormGroup :label="$t('text.full_name')" name="fullName">
            <UInput v-model="formState.fullName" :placeholder="$t('text.your_full_name')" />
          </UFormGroup>

          <UFormGroup :label="$t('text.email')" name="email">
            <UInput v-model="formState.email" type="email" :placeholder="$t('text.your_email')" />
          </UFormGroup>

          <UFormGroup :label="$t('text.phone')" name="phone">
            <UInput v-model="formState.phone" type="tel" :placeholder="$t('text.your_phone')" />
          </UFormGroup>

          <UButton type="submit" color="primary" block>
            {{ $t('text.submit_application') }}
          </UButton>
        </UForm>
      </UCard>
    </UModal> -->
  </div>
</template>