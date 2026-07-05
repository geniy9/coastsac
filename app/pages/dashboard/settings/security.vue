<!-- pages/dashboard/settings/security.vue -->
<script setup>
definePageMeta({ 
  layout: 'dashboard'
})
</script>
<template>
  <div class="dashboard_main">
    <UPageCard
      title="Changing your password"
      description="Before changing your password, make sure you remember your old one."
      variant="subtle"
      class="mb-6">
      <AuthChangePassword />
    </UPageCard>
  </div>
</template>