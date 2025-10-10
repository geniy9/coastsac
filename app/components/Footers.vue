<script setup>
const { menuPhones, menuSecond, menuRules } = useMenu()
const colorMode = useColorMode()

const logo = computed(() => {
  return colorMode.value === 'dark' ? '/logo_white.png' : '/logo.png'
})
</script>
<template>
  <footer id="contacts" class="bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400">
    <div class="section pt-16 pb-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="flex flex-col items-center lg:items-start gap-6">
          <NuxtLinkLocale to="/">
            <img class="h-12 w-auto" :src="logo" alt="Light Freight Logo">
          </NuxtLinkLocale>
          
          <div class="flex items-center gap-2 max-w-60">
            <Icon name="hugeicons:location-01" class="w-8 h-8 text-secondary flex-shrink-0" />
            <p class="text-sm" v-html="$t('text.full_address')"></p>
          </div>

          <div class="flex flex-col items-center">
            <div v-for="(m, i) in menuPhones" :key="i">
              <a :href="m.to" target="_blank" class="block text-sm select-none py-1 leading-none">
                <span v-html="m.name"></span>
              </a>
            </div>
          </div>
        </div>

        <div>
          <ul class="flex flex-col items-center">
            <li v-for="(m, i) in menuSecond" :key="i">
              <NuxtLinkLocale :to="m.to" class="block text-sm font-medium select-none py-2 leading-none">
                {{ $t(`nav.${m.name}`) }}
              </NuxtLinkLocale>
            </li>
          </ul>
        </div>

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
          <Socials class="flex gap-4 mt-3 text-3xl" />
        </div>
      </div>
      
      <div class="mt-12 pt-8 flex flex-col md:flex-row justify-center items-center">
        <p class="text-xs text-center uppercase tracking-wider">
          &copy; {{ new Date().getFullYear() }} LIGHT FREIGHT. All Rights Reserved.
        </p>
      </div>
    </div>

    <div class="fixed bottom-4 right-6 z-10">
      <a href="https://wa.me/19169687082" target="_blank" >
        <UTooltip text="Get in touch">
          <Icon name="hugeicons:whatsapp" class="text-green-500 text-4xl xs:text-5xl" />
        </UTooltip>
      </a>
    </div>
  </footer>
</template>