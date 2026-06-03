<script setup>
const { menuPhones, menuPhonesCoast, menuSecond, menuRules } = useMenu()
const colorMode = useColorMode()
const route = useRoute()

const bookkeepingPage = computed(() => {
  const routeMeta = route.meta
  return routeMeta.bookkeepingPage || false
})
const logo = computed(() => {
  return bookkeepingPage.value ? '/logo_ctc.svg' : colorMode.value === 'dark' ? '/logo_white.png' : '/logo.png'
})

const phonesByPage = computed(() => {
  return bookkeepingPage.value ? menuPhonesCoast : menuPhones
})
</script>
<template>
  <footer id="contacts" :class="[
    bookkeepingPage ? 'bg-gray-100 text-black' : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400'
    ]" class="">
    <div class="section pt-16 pb-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="flex flex-col items-center lg:items-start gap-6">
          <NuxtLinkLocale to="/">
            <ClientOnly>
              <img class="w-80" :src="logo" alt="Light Freight Logo" />
            </ClientOnly>
          </NuxtLinkLocale>
          
          <div class="flex items-center gap-2 max-w-60">
            <Icon name="hugeicons:location-01" class="hidden xs:block w-8 h-8 flex-shrink-0" />
            <p class="text-sm text-center xs:text-left" v-html="$t('text.full_address')"></p>
          </div>

          <div class="flex flex-col items-center lg:items-start">
            <div v-for="(m, i) in phonesByPage" :key="i">
              <a :href="m.to" target="_blank" class="block text-sm select-none py-1 leading-none">
                <span v-html="m.name"></span>
              </a>
            </div>
          </div>
        </div>

        <div></div>

        <div class="flex flex-col items-center">
          <div>
            <ul class="flex flex-col items-center">
              <li v-for="(m, i) in menuRules" :key="i">
                <NuxtLinkLocale :to="m.to" class="block text-sm font-medium select-none py-2 leading-none">
                  {{ $t(`nav.${m.name}`) }}
                </NuxtLinkLocale>
              </li>
            </ul>
          </div>
          <SocialsCoast v-if="bookkeepingPage" class="flex gap-4 mt-3 text-3xl px-3 py-2 text-white bg-coast rounded-full" />
          <Socials v-else class="flex gap-4 mt-3 text-3xl" />
        </div>
      </div>
      
      <div class="mt-12 pt-8 flex flex-col md:flex-row justify-center items-center">
        <p class="text-xs text-center tracking-wider">
          &copy; {{ new Date().getFullYear() }} All Rights Reserved
        </p>
      </div>
    </div>

    <div class="fixed bottom-4 right-6 z-10">
      <a href="https://wa.me/19169687082" target="_blank">
        <UTooltip text="Get in touch">
          <Icon name="hugeicons:whatsapp" class="text-green-500 text-4xl xs:text-5xl" />
        </UTooltip>
      </a>
    </div>
  </footer>
</template>