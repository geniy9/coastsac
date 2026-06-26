<script setup>
definePageMeta({ 
  layout: 'dashboard'
})
</script>
<template>
  <div class="flex-1 flex flex-col min-h-0">
    <UPageCard
      title="Changing your password"
      description="Before changing your password, make sure you remember your old one."
      variant="subtle"
      class="mb-6">
      <AuthChangePassword />
    </UPageCard>
  </div>
</template>