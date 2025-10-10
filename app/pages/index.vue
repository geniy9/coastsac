<script setup>
const { t } = useI18n()
// import { useApiStore } from '@/store/api'

// const { locale } = useI18n()
// const apiStore = useApiStore()

// const data = reactive({
//   loading: false,
//   currentPage: 1,
// })

// async function getHome() {
//   try {
//     data.loading = true
//     await apiStore.getCategories(locale.value)
//   } catch (error) {
//     console.log(error)
//   } finally {
//     data.loading = false
//   }
// }
// onMounted(async () => { await getHome() })

// const categories = computed(() => apiStore.categories)

// watch(() => locale.value, async () => { await getHome() })

useSeoMeta({
  title: computed(() => t('seo.home.title')),
  description: computed(() => t('seo.home.description')),
  keywords: computed(() => t('seo.home.keywords'))
})
</script>
<template>
  <div>
    <div class="relative">
      <div class="absolute inset-0">
        <img src="/img/bg_trucks.jpg" alt="Truck on a winding road" class="w-full h-full object-cover object-right">
        <div class="absolute inset-0 bg-black/50"></div>
        <div class="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent"></div>
      </div>
      
      <div class="relative text-center md:text-left text-white flex flex-col items-stretch min-h-screen justify-end">
        <div class="section py-8 md:py-16">
          <h1 class="max-w-2xl text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
            {{ $t('text.firm_description_title') }}
          </h1>
          <p class="max-w-xl my-6 text-sm sm:text-lg md:text-xl text-gray-200">
            {{ $t('text.firm_description_text') }}
          </p>
        </div>
      </div>
    </div>
    
    <section class="-mt-8">
      <div class="py-8 px-10 max-w-xs xs:max-w-sm sm:max-w-lg md:max-w-3xl mx-auto backdrop-blur-md bg-white/20 dark:bg-black/50 rounded-2xl shadow-2xl">
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 text-center">
          <div class="flex flex-col items-center">
            <Icon name="hugeicons:customer-support" class="text-3xl sm:text-5xl text-accent mb-3" />
            <span class="font-semibold text-gray-900 dark:text-white">
              {{ $t('text.dedicated_dispatcher') }}
            </span>
          </div>
          <div class="flex flex-col items-center">
            <Icon name="hugeicons:travel-bag" class="text-3xl sm:text-5xl text-accent mb-3" />
            <span class="font-semibold text-gray-900 dark:text-white">
              {{ $t('text.carrier_pack_submittal') }}
            </span>
          </div>
          <div class="flex flex-col items-center">
            <Icon name="hugeicons:package-02" class="text-3xl sm:text-5xl text-accent mb-3" />
            <span class="font-semibold text-gray-900 dark:text-white">
              {{ $t('text.best_paying_freight') }}
            </span>
          </div>
          <div class="flex flex-col items-center">
            <Icon name="hugeicons:invoice-01" class="text-3xl sm:text-5xl text-accent mb-3" />
            <span class="font-semibold text-gray-900 dark:text-white">
              {{ $t('text.invoicing') }}
            </span>
          </div>
          <div class="flex flex-col items-center">
            <Icon name="hugeicons:discount-tag-02" class="text-3xl sm:text-5xl text-accent mb-3" />
            <span class="font-semibold text-gray-900 dark:text-white">
              {{ $t('text.partnership_discounts') }}
            </span>
          </div>
          <div class="flex flex-col items-center">
            <Icon name="hugeicons:fuel-02" class="text-3xl sm:text-5xl text-accent mb-3" />
            <span class="font-semibold text-gray-900 dark:text-white">
              {{ $t('text.fuel_card') }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <section class="section py-16 md:py-24">
      <h2 class="text-2xl xs:text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white">
        {{ $t('text.light_freight_difference_title') }}
      </h2>
      <div class="mt-12 grid md:grid-cols-3 gap-4 lg:gap-8">
        <div v-for="i in 3" :key="i" class="group relative rounded-lg overflow-hidden aspect-square xl:w-90">
          <img :src="`/img/differ_${i}.jpg`" class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Dedicated expertise">
          <div class="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
          <div class="relative p-6 lg:p-8 h-full flex flex-col justify-end text-white">
            <span class="text-sm font-bold text-gray-400">0{{ i }}</span>
            <h3 class="text-xl lg:text-2xl font-bold mt-2">{{ $t(`text.difference_${i}_title`) }}</h3>
            <div class="w-16 h-1 group-hover:w-full duration-300 transition-all bg-secondary mt-4"></div>
            <p class="mt-2 max-h-0 scale-y-0 group-hover:max-h-full group-hover:scale-y-100 delay-300 duration-500 transition-all origin-top">
              {{ $t(`text.difference_${i}_desc`) }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-gray-100 dark:bg-gray-900">
      <div class="section py-16 md:py-24">
        <h2 class="text-2xl xs:text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">
          {{ $t('text.coverage_title') }}
        </h2>
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <div class="relative">
            <img src="/img/bg_coverage.jpg" :alt="$t('text.full_truckload_tab')" class="rounded-lg shadow-xl w-full">
            
            <div class="relative lg:absolute lg:-bottom-16 lg:left-1/4 w-full lg:w-72 bg-white/30 dark:bg-black/30 backdrop-blur-xs p-8 rounded-lg shadow-xl mt-8 lg:mt-0">
              <ul class="space-y-3 text-black dark:text-white">
                <li>
                  <a href="#" class="text-secondary font-bold text-lg pb-1 border-b-2 border-secondary">
                  {{ $t('text.full_truckload_tab') }}
                  </a>
                </li>
                <li><a href="#" class="hover:text-secondary font-medium text-lg">
                  {{ $t('text.less_than_truckload_tab') }}</a>
                </li>
                <li><a href="#" class="hover:text-secondary font-medium text-lg">
                  {{ $t('text.expedited_tab') }}</a>
                </li>
                <li><a href="#" class="hover:text-secondary font-medium text-lg">
                  {{ $t('text.drayage_tab') }}</a>
                </li>
                <li><a href="#" class="hover:text-secondary font-medium text-lg">
                  {{ $t('text.final_mile_tab') }}</a>
                </li>
                <li><a href="#" class="hover:text-secondary font-medium text-lg">
                  {{ $t('text.heavy_haul_tab') }}</a>
                </li>
                <li><a href="#" class="hover:text-secondary font-medium text-lg">
                  {{ $t('text.warehousing_tab') }}</a>
                </li>
              </ul>
            </div>
          </div>
          <div class="lg:pl-16 lg:pt-16 flex flex-col items-center sm:items-start">
            <h3 class="text-2xl xs:text-3xl font-bold text-gray-900 dark:text-white">
              {{ $t('text.full_truckload_section_title') }}
            </h3>
            <p class="mt-4 text-gray-600 dark:text-gray-400 text-lg text-center sm:text-left">
              {{ $t('text.full_truckload_section_text') }}
            </p>
            <a href="#" class="mt-8 inline-block bg-secondary text-white px-8 py-3 rounded-full font-semibold hover:bg-secondary transition-colors">
              {{ $t('text.learn_more') }}
            </a>
          </div>
        </div>
      </div>
    </section>

    <section class="text-white relative">
      <div class="section bg-primary rounded-xl py-8 md:py-16">
        <div class="grid md:grid-cols-2 gap-12 items-center px-8 lg:px-16">
          <div class="relative w-full h-80 md:h-full min-h-[300px] overflow-hidden">
            <img src="/img/dispatchers.jpg" alt="Dispatchers collaborating" 
              class="absolute w-full h-full object-cover rounded-lg">
            <div class="hidden md:block absolute right-0 md:w-1/2 lg:w-1/3 h-full bg-gradient-to-l from-primary to-primary/70 rounded-l-full"></div>
          </div>
          <div class="md:-ml-20 lg:-ml-30 text-center md:text-left z-10">
            <h2 class="text-2xl md:text-3xl lg:text-4xl font-bold">
              {{ $t('text.join_team_title') }}
            </h2>
            <p class="mt-4 text-gray-300 text-lg">
              {{ $t('text.join_team_text') }}
            </p>
            <Agreement>
              <span class="mt-4 inline-block bg-secondary text-white px-8 py-3 rounded-full font-semibold hover:bg-secondary transition-colors cursor-pointer">
              {{ $t('text.sign_up') }}
              </span>
            </Agreement>
          </div>
        </div>
      </div>
    </section>

  </div>
</template>