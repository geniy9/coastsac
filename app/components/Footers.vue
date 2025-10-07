<script setup>
const { menuSecond, menuRules } = useMenu()
const colorMode = useColorMode()

const logo = computed(() => {
  return colorMode.value === 'dark' ? '/logo_white.png' : '/logo.png'
})
</script>
<template>
  <footer class="bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400">
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
          <div class="flex gap-4 mt-3">
            <a href="#" class="text-secondary">
              <Icon name="hugeicons:linkedin-01" class="text-3xl" />
            </a>
            <a href="#" class="text-secondary">
              <Icon name="hugeicons:facebook-01" class="text-3xl" />
            </a>
            <a href="#" class="text-secondary">
              <Icon name="hugeicons:instagram" class="text-3xl" />
            </a>
          </div>
        </div>
      </div>
      
      <div class="mt-12 pt-8 flex flex-col md:flex-row justify-center items-center">
        <p class="text-xs text-center uppercase tracking-wider">
          &copy; {{ new Date().getFullYear() }} LIGHT FREIGHT. All Rights Reserved.
        </p>
      </div>
    </div>
  </footer>
</template>