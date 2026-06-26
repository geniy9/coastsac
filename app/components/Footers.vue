<script setup>
const { menuPhones, menuPhonesCoast } = useMenu()
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
          
          <div class="flex items-center gap-2 max-w-60">
            <Icon name="hugeicons:location-01" class="hidden xs:block w-8 h-8 shrink-0" />
            <p class="text-sm text-center xs:text-left" v-html="$t('text.full_address')"></p>
          </div>

          <div class="flex flex-col items-center lg:items-start">
            <div v-for="(m, i) in phonesByPage" :key="i">
              <a :href="m.to" target="_blank" class="block text-sm font-bold select-none py-1 leading-none">
                <span v-html="m.name"></span>
              </a>
            </div>
          </div>
        </div>

        <div></div>

        <div class="flex flex-col items-center lg:items-end">
          <SocialsCoast v-if="bookkeepingPage" class="flex gap-4 mt-3 text-3xl px-3 py-2 text-white bg-coast rounded-full" />
          <Socials v-else class="flex gap-4 mt-3 text-3xl px-3 py-2 text-white bg-secondary rounded-full" />
        </div>
      </div>
      
      <div class="mt-4 flex flex-col md:flex-row justify-center items-center">
        <p class="text-sm text-center tracking-wider">
          {{ new Date().getFullYear() }} &copy; All Rights Reserved
        </p>
      </div>
    </div>

  </footer>
</template>