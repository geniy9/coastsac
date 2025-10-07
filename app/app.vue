<script setup>
useHead({
  titleTemplate: (title) => {
    return title ? `${title} | LIGHT FREIGHT` : "LIGHT FREIGHT"
  }
})
</script>
<template>
  <UApp>
    <div class="flex flex-col min-h-screen overflow-hidden bg-white text-gray-900 dark:bg-primary dark:text-white">
      <Headers />
      <div class="flex-grow">
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
      </div>
      <Footers />
    </div>
  </UApp>
</template>
<!-- <style>
.page-enter-active,
.page-leave-active {
  transition: all 0.5s;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(24px);
}
</style> -->
