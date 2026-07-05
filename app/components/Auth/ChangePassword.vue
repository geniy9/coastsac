<!-- components/ChangePassword.vue -->
<script setup>
import { z } from 'zod'

const { changePassword } = useStrapiAuth()

const loading = ref(false)
const error = ref('')
const successMessage = ref('')

const schema = z.object({
  currentPassword: z.string().min(1, 'Required field'),
  password: z.string().min(8, 'The password must contain at least 8 characters'),
  passwordConfirmation: z.string(),
}).refine(data => data.password === data.passwordConfirmation, {
  message: "Passwords don't match",
  path: ["passwordConfirmation"],
});

const state = reactive({
  currentPassword: '',
  password: '',
  passwordConfirmation: '',
});

const handleChangePassword = async () => {
  loading.value = true
  error.value = ''
  successMessage.value = ''
  try {
    await changePassword({
      currentPassword: state.currentPassword,
      password: state.password,
      passwordConfirmation: state.passwordConfirmation,
    });
    successMessage.value = 'Password changed successfully!'
    state.currentPassword = state.password = state.passwordConfirmation = ''
  } catch (e) {
    error.value = e.error?.message || 'Failed to change password. Check your current password'
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>
<template>
  <div class="flex flex-col gap-4 w-60">
    <div v-if="successMessage" class="p-3 mb-4 bg-green-100 text-green-800 rounded-md text-sm">
      {{ successMessage }}
    </div>

    <UForm :state="state" :schema="schema" @submit.prevent="handleChangePassword" class="space-y-2">
      <UFormField label="Current Password" name="currentPassword">
        <UInput v-model="state.currentPassword" type="password" class="w-full" />
      </UFormField>

      <UFormField label="New Password" name="password">
        <UInput v-model="state.password" type="password" class="w-full" />
      </UFormField>

      <UFormField label="Confirm new password" name="passwordConfirmation">
        <UInput v-model="state.passwordConfirmation" type="password" class="w-full" />
      </UFormField>

      <UButton type="submit" :loading="loading" block>
        Change password
      </UButton>

      <UAlert
        v-if="error"
        icon="hugeicons:alert-01"
        color="error"
        variant="soft"
        class="mt-4"
        :title="error" />
    </UForm>
  </div>
</template>