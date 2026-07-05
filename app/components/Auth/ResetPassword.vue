<!-- components/ResetPassword.vue -->
<script setup>
import { z } from 'zod'
const { resetPassword } = useStrapiAuth()
const route = useRoute()
const router = useRouter()

const loading = ref(false)
const error = ref('')
const code = route.query.code

const schema = z.object({
  password: z.string().min(8, 'The password must contain at least 8 characters'),
  passwordConfirmation: z.string().min(8, 'The password must contain at least 8 characters'),
}).refine(data => data.password === data.passwordConfirmation, {
  message: "Passwords don't match",
  path: ["passwordConfirmation"],
});

const state = reactive({
  password: '',
  passwordConfirmation: '',
});

const handleResetPassword = async () => {
  if (!code) {
    error.value = 'There is no password reset code. Please request the link again'
    return;
  }
  loading.value = true
  error.value = ''
  try {
    await resetPassword({
      code,
      password: state.password,
      passwordConfirmation: state.passwordConfirmation,
    });
    await router.push('/auth/login?password_reset=true')
  } catch (e) {
    error.value = e.error?.message || 'Invalid or expired code. Try again.'
    console.error(e)
  } finally {
    loading.value = false
  }
};
</script>
<template>
  <div class="flex flex-col gap-4 w-xs mx-auto">
    <h2 class="text-2xl font-bold text-center">
      Setting a new password
    </h2>

    <UForm :state="state" :schema="schema" @submit.prevent="handleResetPassword">
      <UFormField label="New Password" name="password" class="mb-4">
        <UInput v-model="state.password" type="password" placeholder="••••••••" />
      </UFormField>

      <UFormField label="Confirm your new password" name="passwordConfirmation" class="mb-6">
        <UInput v-model="state.passwordConfirmation" type="password" placeholder="••••••••" />
      </UFormField>

      <UButton type="submit" block :loading="loading" color="primary">
        Update password
      </UButton>

      <UAlert
        v-if="error"
        icon="hugeicons:alert-01"
        color="error"
        variant="soft"
        class="mt-4"
        :title="error"
      />
    </UForm>
  </div>
</template>