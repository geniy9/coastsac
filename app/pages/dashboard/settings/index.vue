<!-- pages/dashboard/settings/index.vue -->
<script setup>
definePageMeta({ 
  layout: 'dashboard' 
})
import { z } from "zod";

const user = useStrapiUser()
const client = useStrapiClient()
const toast = useToast()
const { thumbImg, copyBoofer } = useConfig()

const profileSchema = z.object({
  name: z.string().min(3, "The name is too short"),
  email: z.string().email("Invalid mail format"),
  username: z.string().min(3, "Nickname is too short"),
});

const profile = reactive({
  name: user.value?.name || "",
  email: user.value?.email || "",
  username: user.value?.username || "",
});

const loading = ref(false)
const avatarFile = ref(null)
const localAvatarPreviewUrl = ref(null)

// 2FA локальные состояния
const isSettingUp2FA = ref(false)
const isDisabling2FA = ref(false)
const qrCodeUrl = ref('')
const tfaSecret = ref('')
const setupOtp = ref([])
const disableOtp = ref([])
const tfaLoading = ref(false)

async function toggle2FA(val) {
  if (val) {
    // Включение 2FA: генерируем секрет и QR-код
    isSettingUp2FA.value = true
    isDisabling2FA.value = false
    setupOtp.value = []
    tfaLoading.value = true
    try {
      const res = await client('/two-factor/generate', { method: 'POST' })
      qrCodeUrl.value = res.qrCodeDataUrl
      tfaSecret.value = res.secret
    } catch (err) {
      toast.add({
        title: "Error",
        description: err.error?.message || "Failed to generate 2FA key.",
        color: "error"
      })
      isSettingUp2FA.value = false
    } finally {
      tfaLoading.value = false
    }
  } else {
    // Выключение 2FA: запрашиваем подтверждающий OTP
    isDisabling2FA.value = true
    isSettingUp2FA.value = false
    disableOtp.value = []
  }
}

async function confirmEnable2FA() {
  tfaLoading.value = true
  try {
    const code = setupOtp.value.join('')
    await client('/two-factor/enable', {
      method: 'POST',
      body: {
        secret: tfaSecret.value,
        code
      }
    })
    
    user.value.twoFactorEnabled = true
    isSettingUp2FA.value = false
    setupOtp.value = []
    
    toast.add({
      title: "Success",
      description: "Two-factor authentication is now active.",
      color: "success"
    })
  } catch (err) {
    toast.add({
      title: "Error",
      description: err.error?.message || "Invalid code. Please try again.",
      color: "error"
    })
  } finally {
    tfaLoading.value = false
  }
}

async function confirmDisable2FA() {
  tfaLoading.value = true
  try {
    const code = disableOtp.value.join('')
    await client('/two-factor/disable', {
      method: 'POST',
      body: { code }
    })
    
    user.value.twoFactorEnabled = false
    isDisabling2FA.value = false
    disableOtp.value = []
    
    toast.add({
      title: "Disabled",
      description: "Two-factor authentication has been turned off.",
      color: "warning"
    })
  } catch (err) {
    toast.add({
      title: "Error",
      description: err.error?.message || "Invalid code. Please try again.",
      color: "error"
    })
  } finally {
    tfaLoading.value = false
  }
}

function cancelSetup() {
  isSettingUp2FA.value = false
  setupOtp.value = []
}

function cancelDisable() {
  isDisabling2FA.value = false
  disableOtp.value = []
}

watch(avatarFile, (newFile, oldFile) => {
  if (oldFile && localAvatarPreviewUrl.value) {
    URL.revokeObjectURL(localAvatarPreviewUrl.value)
  }
  if (newFile) {
    localAvatarPreviewUrl.value = URL.createObjectURL(newFile)
  } else {
    localAvatarPreviewUrl.value = null
  }
})

onUnmounted(() => {
  if (localAvatarPreviewUrl.value) {
    URL.revokeObjectURL(localAvatarPreviewUrl.value)
  }
})

const avatarUrl = computed(() => {
  if (localAvatarPreviewUrl.value) {
    return localAvatarPreviewUrl.value
  }
  thumbImg(user.value?.avatar)
  // const avatar = user.value?.avatar
  // if (!avatar) return null
  
  // const url = typeof avatar === 'string' ? avatar : (avatar.url || avatar.data?.attributes?.url)
  // return url ? imageUrl + url : null
})

async function onSubmit() {
  loading.value = true
  try {
    if (avatarFile.value) {
      const formData = new FormData()
      formData.append('files', avatarFile.value)
      formData.append('ref', 'plugin::users-permissions.user')
      formData.append('refId', user.value.id.toString())
      formData.append('field', 'avatar')
      
      await client('/upload', {
        method: 'POST',
        body: formData
      })
      
      avatarFile.value = null
    }

    // 2. Обновляем текстовые поля профиля
    try {
      await client(`/users/${user.value.id}`, {
        method: "PUT",
        body: {
          name: profile.name,
          email: profile.email,
          username: profile.username,
        }
      })
    } catch (putErr) {
      console.warn("Failed to update profile:", putErr)
      toast.add({
        title: "Profile update restriction",
        description: "Text fields could not be updated. Please check permissions.",
        color: "warning",
      });
    }
    
    // 3. В любом случае запрашиваем свежие данные пользователя с актуальным аватаром
    const freshUser = await client('/users/me', {
      query: { populate: 'avatar' }
    })
    
    user.value = freshUser

    toast.add({
      title: "Successfully",
      description: "Your settings have been updated.",
      icon: "i-lucide-check",
      color: "success",
    });
  } catch (err) {
    console.error("Error processing the form:", err)
    toast.add({
      title: "Error",
      description: err.error?.message || "Failed to upload avatar.",
      icon: "i-lucide-circle-alert",
      color: "error",
    });
  } finally {
    loading.value = false
  }
}
</script>
<template>
  <div v-if="user" class="dashboard_main">
    <AuthSendEmailConfirmationBanner v-if="!user.confirmed" />
    <UForm v-else
      id="settings"
      :schema="profileSchema"
      :state="profile"
      @submit="onSubmit">
      <UPageCard
        title="Profile"
        variant="naked"
        orientation="horizontal"
        class="mb-4">
        <UButton
          form="settings"
          label="Save changes"
          type="submit"
          :loading="loading"
          class="w-fit lg:ms-auto" />
      </UPageCard>

      <UPageCard variant="subtle">
        <UFormField
          name="avatar"
          label="Avatar"
          description="Your profile picture"
          class="flex max-sm:flex-col justify-between items-center gap-4">
          <div class="grid gap-2">
            <UAvatar
              :src="avatarUrl"
              :alt="profile.name || profile.username"
              class="size-24" />
            <UFileUpload
              v-model="avatarFile"
              variant="button"
              accept="image/*"
              size="sm" />
          </div>
        </UFormField>

        <USeparator />

        <UFormField
          name="name"
          label="Name"
          description="Full name" 
          class="flex max-sm:flex-col justify-between items-start gap-4">
          <UInput v-model="profile.name" autocomplete="off" />
        </UFormField>

        <USeparator />

        <UFormField
          name="email"
          label="Email"
          description="Email to login and receive notifications."
          required
          class="flex max-sm:flex-col justify-between items-start gap-4">
          <UInput v-model="profile.email" type="email" disabled autocomplete="off" />
        </UFormField>

        <USeparator />

        <UFormField
          name="username"
          label="Username"
          description="Unique account identifier."
          required
          class="flex max-sm:flex-col justify-between items-start gap-4">
          <UInput v-model="profile.username" autocomplete="off" />
        </UFormField>

        <USeparator />

        <!-- Настройка двухфакторной аутентификации -->
        <UFormField
          name="twoFactor"
          label="Two-Factor Authentication (2FA)"
          description="Secure your account using TOTP Google Authenticator"
          class="flex max-sm:flex-col justify-between items-start gap-4">
          <div class="grid gap-4 w-full max-w-md mt-1">
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-medium">
                {{ user.twoFactorEnabled ? 'Enabled' : 'Disabled' }}
              </span>
              <USwitch 
                :model-value="user.twoFactorEnabled" 
                @update:model-value="toggle2FA" 
                color="primary" />
            </div>

            <!-- Блок первоначальной настройки -->
            <div v-if="isSettingUp2FA" class="p-4 border border-dashed rounded-lg bg-neutral-50 dark:bg-neutral-900 grid gap-4">
              <p class="text-sm text-gray-600 dark:text-gray-400">
                1. Scan this QR code in Google Authenticator:
              </p>
              <div class="flex justify-center bg-white p-2 rounded w-fit mx-auto">
                <img :src="qrCodeUrl" alt="2FA QR Code" class="size-40" />
              </div>
              <p class="text-xs text-center text-gray-500">
                Can't scan? Code: <code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-mono">
                  {{ tfaSecret }}
                </code>
                <UButton variant="link" size="xs" @click="copyBoofer(tfaSecret)" class="p-0 ms-1 align-baseline">Copy</UButton>
              </p>
              <USeparator />
              <p class="text-sm text-gray-600 dark:text-gray-400">
                2. Enter the 6-digit verification code to confirm:
              </p>
              <div class="flex justify-center">
                <UPinInput :length="6" v-model="setupOtp" />
              </div>
              <div class="flex gap-2 justify-end mt-2">
                <UButton size="sm" variant="ghost" color="neutral" @click="cancelSetup">
                  Cancel
                </UButton>
                <UButton size="sm" color="primary" :loading="tfaLoading" :disabled="setupOtp.length < 6" @click="confirmEnable2FA">
                  Verify & Enable
                </UButton>
              </div>
            </div>

            <!-- Блок отключения 2FA -->
            <div v-if="isDisabling2FA" class="p-4 border border-dashed border-red-300 dark:border-red-900 rounded-lg bg-red-50 dark:bg-red-950/20 grid gap-4">
              <p class="text-sm text-red-600 dark:text-red-400">
                Are you sure you want to disable 2FA? Enter your current 6-digit code:
              </p>
              <div class="flex justify-center">
                <UPinInput :length="6" v-model="disableOtp" />
              </div>
              <div class="flex gap-2 justify-end mt-2">
                <UButton size="sm" variant="ghost" color="neutral" @click="cancelDisable">
                  Cancel
                </UButton>
                <UButton size="sm" color="error" :loading="tfaLoading" :disabled="disableOtp.length < 6" @click="confirmDisable2FA">
                  Disable 2FA
                </UButton>
              </div>
            </div>
          </div>
        </UFormField>
      </UPageCard>
    </UForm>
  </div>
</template>