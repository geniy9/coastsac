<script setup>
useHead({
  titleTemplate: (title) => {
    return title ? `${title} | C2C Authorization` : "C2C Authorization"
  }
})
</script>
<template>
  <div class="auth min-h-screen relative flex items-center justify-center p-4 sm:p-6 bg-cover bg-center bg-no-repeat" style="background-image: url('/img/interstellar_bg.jpg')">

    <div class="absolute inset-0" />

    <div class="relative z-10 w-full max-w-2xl backdrop-blur-sm bg-black/20 rounded-3xl p-6 sm:p-8 shadow-2xl text-white">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        
        <div class="flex flex-col items-center justify-center text-center p-4 md:border-r border-white/10">
          <img 
            src="/c2c_white.svg" 
            alt="Coast to Coast" 
            class="max-w-28 md:max-w-36 h-auto drop-shadow-md" />
          <p class="mt-3 text-xs sm:text-sm text-white tracking-wider uppercase">
            Coast to Coast Logistics
          </p>
        </div>

        <div class="w-full flex justify-center">
          <main class="w-full max-w-sm">
            <slot />
          </main>
        </div>

      </div>
    </div>
  </div>
</template>
<!-- <template>
  <div class="auth flex flex-col min-h-screen">
    <main class="flex-1">
      <slot />
    </main>
  </div>
</template> -->