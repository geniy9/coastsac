<!-- components/ForgotPassword.vue -->
<script setup>
import { z } from 'zod'

const { forgotPassword } = useStrapiAuth()

const loading = ref(false)
const error = ref('')
const successMessage = ref('')

const schema = z.object({
  email: z.string().email('Incorrect email format'),
})
const state = reactive({
  email: '',
})

const handleForgotPassword = async () => {
  loading.value = true
  error.value = ''
  successMessage.value = ''
  try {
    await forgotPassword({ email: state.email })
    successMessage.value = 'Password reset instructions have been sent to your email.'
  } catch (e) {
    console.error("Forgot password error:", e);
    error.value = e.error?.message || e.message || 'An error occurred while sending the request.'
  } finally {
    loading.value = false
  }
};
</script>
<template>
  <div class="flex flex-col gap-4 w-full">
    <h2 class="text-2xl font-bold text-center">
      Forgot your password?
    </h2>

    <div v-if="successMessage" class="p-4 bg-green-100 text-green-800 rounded-md text-center">
      {{ successMessage }}
    </div>
    <UForm v-else :state="state" :schema="schema" @submit.prevent="handleForgotPassword">
      <p class="text-sm text-white mb-4">
        Enter your email address to reset your password
      </p>
      <UFormField label="Email" name="email" class="mb-6">
        <UInput v-model="state.email" type="email" placeholder="you@example.com" class="w-full" />
      </UFormField>

      <UButton type="submit" block :loading="loading">
        Send link
      </UButton>

      <UAlert
        v-if="error"
        icon="hugeicons:alert-01"
        color="error"
        variant="soft"
        class="mt-4"
        :title="error" />
    </UForm>

    <div class="text-center">
      <ULink to="/auth/login" class="text-sm font-medium">
        Return to entrance
      </ULink>
    </div>
  </div>
</template>