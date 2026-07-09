// layouts/dashboard.vue
<script setup>
useHead({
  titleTemplate: (title) => {
    return title ? `${title} | C2C Dashboard` : "C2C Dashboard"
  }
})
</script>
<template>
  <div class="dashboard flex flex-col min-h-screen">
    <main class="flex-1">
      <slot />
      <NotesNotifications />
    </main>
  </div>
</template>