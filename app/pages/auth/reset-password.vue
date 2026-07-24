<!-- pages/auth/reset-password.vue -->
<script setup>
definePageMeta({ layout: 'auth' })
const route = useRoute()
</script>
<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="w-full max-w-xs flex flex-col gap-4">
      <div v-if="!route.query.code" class="text-center">
        <UAlert
          icon="hugeicons:alert-01"
          color="warning"
          variant="soft"
          title="Invalid password reset link"
          description="Please follow the link in the email or request a new one" />
        <UButton to="/auth/forgot-password" class="mt-4">
          Request new link
        </UButton>
      </div>
      <AuthResetPassword v-else />
    </div>
  </div>
</template>