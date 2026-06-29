<script setup>
definePageMeta({ 
  layout: 'dashboard' 
})
import { z } from "zod";
import { ref, reactive, computed, watch, onUnmounted } from 'vue'

const user = useStrapiUser()
const client = useStrapiClient()
const toast = useToast()
const { imageUrl } = useConfig()

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
  const avatar = user.value?.avatar
  if (!avatar) return null
  
  const url = typeof avatar === 'string' ? avatar : (avatar.url || avatar.data?.attributes?.url)
  return url ? imageUrl + url : null
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
      const updatedUser = await client(`/users/${user.value.id}`, {
        method: "PUT",
        body: {
          name: profile.name,
          email: profile.email,
          username: profile.username,
        }
      })
    } catch (putErr) {
      console.warn("Не удалось обновить текстовые поля профиля (проверьте права в Strapi):", putErr)
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
  <div v-if="user" class="flex-1 flex flex-col min-h-0">
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
      </UPageCard>
    </UForm>
  </div>
</template>