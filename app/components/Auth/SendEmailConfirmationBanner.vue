<script setup>
const { sendEmailConfirmation } = useStrapiAuth()
const user = useStrapiUser()

const loading = ref(false)
const error = ref('')
const successMessage = ref('')

const handleSend = async () => {
  loading.value = true
  error.value = successMessage.value = ''
  try {
    await sendEmailConfirmation({ email: user.value.email })
    successMessage.value = 'The letter has been sent successfully!'
  } catch (e) {
    error.value = e.error?.message || e.message || 'Failed to send email'
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>
<template>
  <UAlert
    v-if="user && !user.confirmed"
    icon="hugeicons:mail-01"
    color="primary"
    variant="soft"
    title="Confirm your email address"
    class="mb-6">
    <template #description>
      <p v-if="successMessage" class="text-green-600 font-medium">
        {{ successMessage }}
      </p>
      <div v-else class="text-sm">
        Your account has not been verified. Please check your email or
        <UButton
          :loading="loading"
          variant="link"
          :padded="false"
          @click="handleSend" 
          class="font-semibold underline decoration-dotted">
          Resend email
        </UButton>
      </div>
      <p v-if="error" class="text-red-500 mt-2 text-xs font-semibold">
        {{ error }}
      </p>
    </template>
  </UAlert>
</template>