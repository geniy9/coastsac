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
      populate: ['role', 'driver', 'avatar']
    }
  }), {
    lazy: true,
    default: () => []
  }
)

const handleRefresh = async () => {
  await refresh()
}

const isOpen = ref(false)
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
</script>
<template>
  <div class="flex-1 flex flex-col min-h-0 min-w-0 w-full">
    <UDashboardPanel id="users">
      <template #header>
        <UDashboardNavbar title="Team">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
          <template #right>
            <UButton 
              icon="humbleicons:info-circle" 
              label="Roles info"
              color="primary" 
              variant="ghost"
              @click="isOpen = true" />
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

    <USlideover v-model:open="isOpen" title="Roles & Permissions Info">
      <template #body>
        <UStepper orientation="vertical" :items="rolesInfo" class="w-full" />
      </template>
    </USlideover>
  </div>
</template>