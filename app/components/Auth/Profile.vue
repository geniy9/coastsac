<script setup>
const user = useStrapiUser()
const router = useRouter()

onMounted(() => {
  if (!user.value) {
    router.push('/auth/login')
  }
})
</script>
<template>
  <div class="flex flex-col gap-8">
    <div v-if="user">
      <div class="space-y-6">
        <UCollapsible class="flex flex-col gap-2 w-full">
          <UButton
            class="group"
            label="Change password"
            color="neutral"
            variant="soft"
            trailing-icon="hugeicons:arrow-down-01"
            :ui="{
              trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200'
            }"
            block />
          <template #content>
            <AuthChangePassword />
          </template>
        </UCollapsible>
      </div>

    </div>
  </div>
</template>