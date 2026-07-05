<!-- components/AuthLogin.vue -->
<script setup>
import { z } from 'zod'
const { login } = useStrapiAuth()
const router = useRouter()
const loading = ref(false)
const error = ref('')

const schema = z.object({
  identifier: z.string().email('Incorrect email format'),
  password: z.string().min(8, 'Password at least 8 characters'),
});

const state = reactive({
  identifier: '',
  password: '',
});

const handleLogin = async () => {
  loading.value = true;
  error.value = '';
  try {
    await login({
      identifier: state.identifier,
      password: state.password,
    });
    router.push('/dashboard');
  } catch (e) {
    error.value = e.error?.message || e.message || 'Incorrect email address or password';
    console.error(e);
  } finally {
    loading.value = false;
  }
};
</script>
<template>
  <div class="flex flex-col gap-4 w-xs mx-auto">
    <h2 class="text-2xl font-bold text-center">
      Login
    </h2>

    <UForm :state="state" :schema="schema" @submit="handleLogin" class="grid gap-2">
      <UFormField label="Email" name="identifier">
        <UInput v-model="state.identifier" type="email" placeholder="you@example.com" class="w-full" />
      </UFormField>
      <UFormField label="Password" name="password" class="w-full">
        <UInput v-model="state.password" type="password" placeholder="••••••••" class="w-full" />
      </UFormField>
      <UButton type="submit" block :loading="loading" color="primary" class="mt-2">
        Login
      </UButton>

      <UAlert
        v-if="error"
        icon="hugeicons:alert-01"
        color="error"
        variant="soft"
        class="mt-4"
        :title="error" />
    </UForm>

    <div class="text-center mt-2">
      <p class="text-sm">
        Don't have an account yet?
        <ULink to="/auth/register" class="font-medium ml-1">
          Create an account
        </ULink>
      </p>
      <ULink to="/auth/forgot-password" class="text-sm font-medium">
        Forgot your password?
      </ULink>
    </div>
  </div>
</template>