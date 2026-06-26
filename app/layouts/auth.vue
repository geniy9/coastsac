<script setup>
useHead({
  titleTemplate: (title) => {
    return title ? `${title} | C2C Authorization` : "C2C Authorization"
  }
})
</script>
<template>
  <div class="auth flex flex-col min-h-screen">
    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>