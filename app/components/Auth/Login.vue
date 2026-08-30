<!-- components/AuthLogin.vue -->
<script setup>
import { z } from 'zod'

const client = useStrapiClient()
const token = useStrapiToken()
const user = useStrapiUser()

const router = useRouter()
const loading = ref(false)
const error = ref('')

const require2fa = ref(false)
const otpCode = ref([])

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
    const payload = {
      identifier: state.identifier,
      password: state.password,
    };

    // Если мы на втором шаге, передаем код OTP
    if (require2fa.value) {
      payload.otp = otpCode.value.join('');
    }

    // Отправляем прямой запрос к Strapi минуя обертку login()
    const res = await client('/auth/local', {
      method: 'POST',
      body: payload
    });

    // 1. Если сервер сообщает, что требуется 2FA
    if (res && res.require2fa) {
      require2fa.value = true;
      loading.value = false;
      return;
    }

    // 2. Если авторизация успешна (получен JWT), сохраняем сессию
    if (res && res.jwt) {
      token.value = res.jwt; // Записывает токен в cookie/headers
      user.value = res.user; // Записывает базовую инфо о юзере
      
      // Опционально запрашиваем полные данные с ролями и аватаром
      try {
        const freshUser = await client('/users/me', {
          query: { populate: ['role', 'avatar'] }
        });
        user.value = freshUser;
      } catch (meErr) {
        console.warn("Failed to populate fresh user state:", meErr);
      }
      router.push('/dashboard');
    }
  } catch (e) {
    error.value = e.error?.message || e.message || 'Incorrect email address or password';
    console.error("Login process error:", e);
  } finally {
    loading.value = false;
  }
};
</script>
<template>
  <div class="flex flex-col gap-4 w-full">
    <h2 class="text-2xl font-bold text-center">
      {{ require2fa ? 'Two-Factor Auth' : 'Login' }}
    </h2>

    <!-- OTP -->
    <div v-if="require2fa" class="grid gap-4 text-center">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Enter the 6-digit verification code from your Google Authenticator app.
      </p>
      <div class="flex justify-center my-2">
        <UPinInput :length="6" v-model="otpCode" />
      </div>
      <UButton 
        type="button" 
        block 
        :loading="loading" 
        color="primary" 
        @click="handleLogin" 
        :disabled="otpCode.length < 6"
        class="mt-2">
        Verify & Login
      </UButton>
      <UButton 
        type="button" 
        variant="ghost" 
        block 
        @click="require2fa = false; otpCode = []" 
        color="neutral">
        Back to credentials
      </UButton>
      <UAlert
        v-if="error"
        icon="hugeicons:alert-01"
        color="error"
        variant="soft"
        class="mt-4"
        :title="error" />
    </div>

    <!-- AUTH FORM -->
    <UForm v-else :state="state" :schema="schema" @submit="handleLogin" class="grid gap-2">
      <UFormField label="Email" name="identifier">
        <UInput v-model="state.identifier" type="email" placeholder="you@example.com" class="w-full" />
      </UFormField>
      <UFormField label="Password" name="password">
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

    <div class="text-sm text-center space-y-1">
      <p>Don't have an account yet?</p>
      <p>
        <ULink to="/auth/register" class="font-medium ml-1 text-primary">
          Create an account
        </ULink>
      </p>
      <ULink to="/auth/forgot-password" class="font-medium text-primary">
        Forgot your password?
      </ULink>
    </div>
  </div>
</template>