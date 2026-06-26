<!-- pages/dashboard/team.vue -->
<script setup>
definePageMeta({ 
  layout: 'dashboard'
})

const { permissions } = useRolePermissions()
const client = useStrapiClient()

const { data: users, status, refresh } = await useAsyncData('users', () => 
  client('/users', {
    query: {
      populate: ['role', 'driver']
    }
  }), {
    lazy: true,
    default: () => []
  }
)

const handleRefresh = async () => {
  await refresh()
}
</script>
<template>
  <div class="flex-1 flex flex-col min-h-0">
    <UDashboardPanel id="users">
      <template #header>
        <UDashboardNavbar title="Team">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <div class="flex-1 flex flex-col min-h-0" v-if="permissions.isAdmin">
          <UserList 
            :users="users" 
            :loading="status === 'pending'"
            @refresh="handleRefresh" />
        </div>
        <div v-else class="flex-1 flex items-center justify-center p-4">
          <p class="text-muted">
            You do not have access rights to this section.
          </p>
        </div>
      </template>
    </UDashboardPanel>
  </div>
</template>