<script setup>
const { menuMain } = useMenu()
const isOpen = ref(false)
const isScrolled = ref(false)
const colorMode = useColorMode()
const route = useRoute()
const user = useStrapiUser()

const bookkeepingPage = computed(() => {
  const routeMeta = route.meta
  return routeMeta.bookkeepingPage || false
})

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
      :class="[ 
        isScrolled ? bookkeepingPage ? 'bg-white/80' : 'bg-primary/80' : 'bg-primary/0', 
        bookkeepingPage ? 'text-black' : 'text-white'
        ]">
      <div class="section flex justify-between items-center">
        
        <div class="flex items-center font-bold gap-4">
          <NuxtLinkLocale v-if="!bookkeepingPage" to="/">
            <img src="/logo_white.png" alt="logo" class="h-10 w-auto transition-all" />
          </NuxtLinkLocale>
          <nav class="hidden md:flex">
            <ul class="flex items-start">
              <li v-for="(m, i) in menuMain" :key="i">
                <NuxtLinkLocale :to="m.to" class="block text-base tracking-widest select-none space-y-1 p-3 leading-none no-underline outline-none" :class="m.className">
                  {{ $t(`nav.${m.name}`) }}
                </NuxtLinkLocale>
              </li>
            </ul>
          </nav>
        </div>

        <div class="flex items-center gap-4">

          <SocialsCoast v-if="bookkeepingPage" class="flex items-center gap-4 text-2xl px-3 py-1 text-white bg-coast rounded-full" />
          <Socials v-else class="flex items-center gap-4 text-2xl" />

          <NuxtLink :to="user ? '/dashboard' : '/auth/login'" class="hidden md:flex coast_to_coast font-bold">
            {{ user ? 'Dashboard' : 'Login' }}
          </NuxtLink>

          <USlideover v-model:open="isOpen" 
            :ui="{ content: 'w-8/9'}" 
            class="flex md:hidden">
            <UIcon name="hugeicons:menu-01" @click="isOpen = true" class="w-9 h-9 cursor-pointer" :class="[bookkeepingPage ? 'text-black' : 'text-white']"/>

            <template #header>
              <div @click="isOpen = false" class="flex items-center justify-between w-full">
                <NuxtLinkLocale to="/">
                  <img :src="logo" alt="logo" class="w-24 h-auto" />        
                </NuxtLinkLocale>
                <UIcon name="hugeicons:cancel-01" @click="isOpen = false" class="w-7 h-7 cursor-pointer scale-100 hover:scale-110 transition-all dark:text-white text-primary" />
              </div>
            </template>

            <template #body>
              <div class="relative flex flex-col justify-between items-stretch h-full max-h-full gap-12">
                <div class="relative max-w-full flex items-center justify-between">
                  <div class="grid grid-cols-2 items-center gap-3">
                    <ToggleLocale />
                    <ToggleTheme class="text-black dark:text-white" />
                  </div>
                  <NuxtLink :to="user ? '/dashboard' : '/auth/login'" class="coast_to_coast font-bold">
                    {{ user ? 'Dashboard' : 'Login' }}
                  </NuxtLink>
                </div>

                <nav @click="isOpen = false">
                  <ul class="flex flex-col items-start">
                    <li v-for="(m, i) in menuMain" :key="i">
                      <NuxtLinkLocale :to="m.to" :class="m.className" class="block text-sm font-bold tracking-widest select-none space-y-1 p-3 leading-none no-underline outline-none uppercase">
                        {{ $t(`nav.${m.name}`) }}
                      </NuxtLinkLocale>
                    </li>
                  </ul>
                </nav>

                <div @click="isOpen = false" class="flex items-center justify-center  w-full">
                  <Socials class="flex gap-6 text-3xl" />
                </div>

              </div>
            </template>
          </USlideover>

        </div>
      </div>

    </div>
    
  </header>
</template>
