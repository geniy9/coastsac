<script setup>
const { menuMain } = useMenu()
const isOpen = ref(false)
const isScrolled = ref(false)
const colorMode = useColorMode()

const logo = computed(() => {
  return colorMode.value === 'dark' ? '/logo_white.png' : '/logo.png'
})

const scrollHandler = () => {
  if (window.scrollY > 0) {
    isScrolled.value = true
  } else {
    isScrolled.value = false
  }
}
onMounted(() => {
  window.addEventListener('scroll', scrollHandler);
})
onUnmounted(() => {
  window.removeEventListener('scroll', scrollHandler);
})
</script>
<template>
  <header class="fixed top-0 w-full z-20">
    <div class="flex flex-col transition-all duration-500 py-3 gap-3" 
      :class="[ isScrolled ? 'bg-black/80' : '']">
      <div class="section flex justify-between text-white items-center">
        
        <div class="flex items-center font-bold gap-4">
          <NuxtLinkLocale to="/">
            <img src="/logo_white.png" alt="logo" class="h-10 w-auto transition-all" />
          </NuxtLinkLocale>
          <nav class="hidden md:flex">
            <ul class="flex items-start">
              <li v-for="(m, i) in menuMain" :key="i">
                <NuxtLinkLocale :to="m.to" class="block text-base tracking-widest select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none">
                  {{ $t(`nav.${m.name}`) }}
                </NuxtLinkLocale>
              </li>
            </ul>
          </nav>
        </div>

        <div class="flex items-center gap-4">

          <Socials class="hidden md:flex items-center gap-4 text-2xl mr-3" />
          <ToggleTheme class="text-white dark:text-white" />
          <ToggleLocale />

          <USlideover v-model:open="isOpen" 
            :ui="{ content: 'w-8/9'}" 
            class="flex md:hidden">
            <Icon name="solar:hamburger-menu-broken" @click="isOpen = true" class="w-9 h-9 cursor-pointer  transition-all text-white hover:text-accent" />

            <template #header>
              <div @click="isOpen = false" class="flex items-center justify-between w-full">
                <NuxtLinkLocale to="/">
                  <img :src="logo" alt="logo" class="w-24 h-auto" />        
                </NuxtLinkLocale>
                <Icon name="hugeicons:cancel-02" @click="isOpen = false" class="w-7 h-7 cursor-pointer scale-100 hover:scale-110 transition-all dark:text-white text-primary" />
              </div>
            </template>

            <template #body>
              <div class="relative flex flex-col justify-start gap-12">
                <div class="relative max-w-full flex items-start justify-between">
                  <ToggleLocale />
                  <ToggleTheme class="text-primary dark:text-white" />
                </div>

                <nav @click="isOpen = false">
                  <ul class="flex flex-col items-start">
                    <li v-for="(m, i) in menuMain" :key="i">
                      <NuxtLinkLocale :to="m.to" class="block text-sm font-bold tracking-widest select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none uppercase">
                        {{ $t(`nav.${m.name}`) }}
                      </NuxtLinkLocale>
                    </li>
                  </ul>
                </nav>

              </div>
            </template>

            <template #footer>
              <div @click="isOpen = false" class="flex items-center justify-center w-full">
                <Socials class="flex gap-4 mt-3 text-3xl" />
              </div>
            </template>
          </USlideover>

        </div>
      </div>

    </div>
    
  </header>
</template>
