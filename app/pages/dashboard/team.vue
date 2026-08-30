<!-- pages/dashboard/team.vue -->
<script setup>
definePageMeta({ layout: 'dashboard' })
const { permissions } = useRolePermissions()
const client = useStrapiClient()
const apiStore = useApiStore()

const pagination = ref({ pageIndex: 0, pageSize: apiStore.defaultPageSize })
const isOpen = ref(false)

// ЗАМЕНИТЬ useAsyncData НА:
const { data: response, status, refresh } = await useAsyncData('users', async () => {
  const [data, total] = await Promise.all([
    client('/users', {
      query: {
        populate: ['role', 'driver', 'avatar'],
        start: pagination.value.pageIndex * pagination.value.pageSize,
        limit: pagination.value.pageSize
      }
    }),
    client('/users/count')
  ])
  return { data: data || [], total: total || 0 }
}, {
  lazy: true,
  watch: [pagination],
  default: () => ({ data: [], total: 0 })
})

const users = computed(() => response.value?.data || [])
const totalUsers = computed(() => response.value?.total || 0)

const rolesInfo = [{ 
  title: 'Admin', 
  description: 'Administrator full access',
  icon: 'hugeicons:shield-user'
},{ 
  title: 'Dispatcher', 
  description: 'Management of Drivers, Loads and Documents',
  icon: 'hugeicons:shield-energy'
},{ 
  title: 'Accounting', 
  description: 'Access to finance, factoring, and invoices',
  icon: 'hugeicons:shield-blockchain'
},{ 
  title: 'Driver', 
  description: 'View your Active and Next Loads, upload POD/BOL documents',
  icon: 'hugeicons:shield-key'
},{ 
  title: 'Authenticated', 
  description: 'Default role given to authenticated user.',
  icon: 'hugeicons:shield-01'
},{ 
  title: 'Public', 
  description: 'Default role given to unauthenticated user.',
  icon: 'hugeicons:knight-shield'
}]
const handleRefresh = async () => { await refresh() }
useHead({ title: 'Team Management' })
</script>
<template>
  <div class="dashboard_main">
    <UDashboardPanel id="users">
      <template #header>
        <UDashboardNavbar title="Team">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
          <template #right>
            <UButton 
              icon="hugeicons:information-circle" 
              label="Roles info"
              color="primary" 
              variant="soft"
              @click="isOpen = true" />
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <div class="flex flex-col" v-if="permissions.isAdmin">
          <UserList 
            :users="users" 
            :total="totalUsers"
            v-model:pagination="pagination"
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

    <USlideover v-model:open="isOpen" title="Roles & Permissions Info">
      <template #body>
        <UStepper orientation="vertical" :items="rolesInfo" class="w-full" />
      </template>
    </USlideover>
  </div>
</template>