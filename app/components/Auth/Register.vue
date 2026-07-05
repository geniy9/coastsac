<!-- components/AuthRegister.vue -->
<script setup>
import { z } from 'zod';

const { register } = useStrapiAuth()
const loading = ref(false)
const error = ref('')
const registrationSuccess = ref(false) // Состояние успешной отправки запроса

const schema = z.object({
  username: z.string().min(3, 'The name must contain at least 3 characters'),
  email: z.string().email('Incorrect email format'),
  password: z.string().min(8, 'The password must contain at least 8 characters'),
});

const state = reactive({
  username: '',
  email: '',
  password: '',
});

const handleRegister = async () => {
  loading.value = true;
  error.value = '';
  registrationSuccess.value = false;
  try {
    await register({
      username: state.username,
      email: state.email,
      password: state.password,
    });
    registrationSuccess.value = true;
  } catch (e) {
    error.value = e.error?.message || e.message || 'An error occurred during registration';
    console.error(e);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="flex flex-col gap-4 w-xs mx-auto">
    <!-- Блок успешной регистрации -->
    <div v-if="registrationSuccess" class="grid gap-4">
      <h2 class="text-2xl font-bold text-center">
        Registration Successful!
      </h2>
      <UAlert
        icon="hugeicons:mail-01"
        color="neutral"
        variant="soft"
        title="Verify your email"
        description="We have sent a verification link to your email address. Please click the link in the email to confirm your account."
      />
      <UButton to="/auth/login" color="primary" class="mt-2" block>
        Go to Login
      </UButton>
    </div>

    <!-- Форма регистрации -->
    <div v-else class="flex flex-col gap-4">
      <h2 class="text-2xl font-bold text-center">
        Registration
      </h2>

      <UForm :state="state" :schema="schema" @submit="handleRegister" class="grid gap-2">
        <UFormField label="Username" name="username">
          <UInput v-model="state.username" placeholder="John Travolta" class="w-full" />
        </UFormField>

        <UFormField label="Email" name="email">
          <UInput v-model="state.email" type="email" placeholder="you@example.com" class="w-full" />
        </UFormField>

        <UFormField label="Password" name="password">
          <UInput v-model="state.password" type="password" placeholder="••••••••" class="w-full" />
        </UFormField>

        <UButton type="submit" block :loading="loading" color="primary" class="mt-2">
          Register
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
          Already have an account?
          <ULink to="/auth/login" class="font-medium ml-1">
            Login
          </ULink>
        </p>
      </div>
    </div>
  </div>
</template>