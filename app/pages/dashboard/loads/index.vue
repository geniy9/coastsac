<!-- pages/dashboard/loads/index.vue -->
<script setup>
definePageMeta({ 
  layout: 'dashboard'
})

const { permissions } = useRolePermissions()
const client = useStrapiClient()
const user = useStrapiUser()

const isAddOpen = ref(false)
const isEditOpen = ref(false)
const isFactoringOpen = ref(false)
const selectedLoad = ref(null)
const activeTab = ref('active')
const tabs = [
  { label: 'Active', value: 'active', icon: 'hugeicons:truck-delivery' },
  { label: 'Next', value: 'next', icon: 'hugeicons:truck-return' },
  { label: 'Completed', value: 'completed', icon: 'hugeicons:checkmark-circle-03' }
]

const rowSelection = ref({})
const limit = ref(25)

const { data: response, status, refresh } = await useAsyncData('loads', () => {
  const query = {
    populate: [
      'dispatcher', 
      'driver', 
      'broker', 
      'doc_rate_confirmation', 
      'doc_pod_bol', 
      'shipper_address', 
      'receiver_address'
    ],
    pagination: { limit: limit.value },
    sort: ['pickup_date:desc']
  }

  if (permissions.value.isDriver) {
    query['filters[driver][user_account][id][$eq]'] = user.value?.id
  }

  return client('/loads', { query })
}, {
  lazy: true,
  watch: [limit],
  default: () => ({ data: [] })
})

const loads = computed(() => response.value?.data || [])

const filteredLoads = computed(() => {
  return loads.value.filter(load => load.category === activeTab.value)
})

const selectedLoads = computed(() => {
  return Object.keys(rowSelection.value)
    .map(index => filteredLoads.value[Number(index)])
    .filter(load => load && load.status_load === 'unloaded')
})

const handleEdit = (load) => {
  selectedLoad.value = load
  isEditOpen.value = true
}
const handleFactoringSuccess = async () => {
  rowSelection.value = {}
  await handleRefresh()
}

watch(activeTab, () => { rowSelection.value = {} })
const handleRefresh = async () => { await refresh() }
useHead({ title: 'Loads' })
</script>
<template>
  <div class="dashboard_main">
    <UDashboardPanel id="loads">
      <template #header>
        <UDashboardNavbar title="Loads">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
          <template #right>
            <div class="flex gap-2">
              <UButton 
                v-if="activeTab === 'completed' && (permissions.isAdmin || permissions.isAccounting)"
                icon="hugeicons:at" 
                label="Send Factoring"
                color="info" 
                :disabled="selectedLoads.length === 0"
                @click="isFactoringOpen = true" />
              <UButton 
                v-if="permissions.canCreateLoads"
                icon="i-lucide-plus" 
                label="Add Load"
                color="primary" 
                @click="isAddOpen = true" />
            </div>
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <div class="flex-1 flex flex-col gap-2 min-h-0" v-if="permissions.canViewLoads">
          <UTabs v-model="activeTab" :items="tabs" class="w-full" />

          <div class="flex-1 flex flex-col min-h-0">
            <LoadList 
              v-model:row-selection="rowSelection"
              v-model:limit="limit"
              :loads="filteredLoads" 
              :loading="status === 'pending'"
              :current-category="activeTab"
              @add="isAddOpen = true"
              @edit="handleEdit"
              @refresh="handleRefresh" />
          </div>

          <LoadAdd v-model:open="isAddOpen" @success="handleRefresh" />
          <LoadEdit v-model:open="isEditOpen" :load="selectedLoad" @success="handleRefresh" />
          <Factoring 
            v-model:open="isFactoringOpen" 
            :selected-loads="selectedLoads" 
            @success="handleFactoringSuccess" />
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