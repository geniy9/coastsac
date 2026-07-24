<!-- pages/auth/login.vue -->
<script setup>
definePageMeta({ layout: 'auth' })
const route = useRoute()
const isEmailConfirmed = computed(() => route.query.confirmed === 'true')
</script>
<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="w-full max-w-xs flex flex-col gap-4">
      
      <UAlert
        v-if="isEmailConfirmed"
        icon="hugeicons:checkmark-circle-01"
        color="success"
        variant="soft"
        title="Email confirmed!"
        description="Your email has been successfully confirmed! You can now log in."
        class="mb-2" />

      <AuthLogin />
    </div>
  </div>
</template>