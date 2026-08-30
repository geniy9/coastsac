<!-- pages/dashboard/drivers/index.vue -->
<script setup>
definePageMeta({ layout: 'dashboard' })

const { permissions } = useRolePermissions()
const client = useStrapiClient()
const apiStore = useApiStore()

const pagination = ref({ pageIndex: 0, pageSize: apiStore.defaultPageSize })

const isAddOpen = ref(false)
const isEditOpen = ref(false)
const selectedDriver = ref(null)

const { data: response, status, refresh } = await useAsyncData('drivers', () => 
  client('/drivers', {
    query: {
      populate: [
        'assigned_dispatcher', 
        'deductions', 
        'user_account.avatar',
        'extra_info.docs'
      ],
      'pagination[page]': pagination.value.pageIndex + 1,
      'pagination[pageSize]': pagination.value.pageSize,
      sort: ['createdAt:desc']
    }
  }), {
    lazy: true,
    watch: [pagination],
    default: () => ({ data: [], meta: { pagination: { total: 0 } } })
  }
)
const drivers = computed(() => response.value?.data || [])
const totalDrivers = computed(() => response.value?.meta?.pagination?.total || 0)

const handleEdit = (driver) => {
  selectedDriver.value = driver
  isEditOpen.value = true
}
const handleRefresh = async () => {await refresh() }
useHead({ title: 'Drivers' })
</script>
<template>
  <div class="dashboard_main">
    <UDashboardPanel id="drivers">
      <template #header>
        <UDashboardNavbar title="Drivers">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
          <template #right>
            <UButton 
              v-if="permissions.canCreateDrivers"
              icon="hugeicons:user-add-01" 
              label="Add driver"
              color="primary" 
              @click="isAddOpen = true" />
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <div class="flex-1 flex flex-col min-h-0" v-if="permissions.canViewDrivers">
          <DriverList 
            :drivers="drivers" 
            :total="totalDrivers"
            v-model:pagination="pagination"
            :loading="status === 'pending'"
            @edit="handleEdit"
            @refresh="handleRefresh" />
          <DriverAdd v-model:open="isAddOpen" @success="handleRefresh" />
          <DriverEdit v-model:open="isEditOpen" :driver="selectedDriver" @success="handleRefresh" />
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