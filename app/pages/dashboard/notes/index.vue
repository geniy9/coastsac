<!-- pages/dashboard/notes/index.vue -->
<script setup>
definePageMeta({ layout: 'dashboard' })

const { permissions } = useRolePermissions()
const client = useStrapiClient()

// Запрос общих заметок (без привязки к грузу и задаче)
const { data: response, status, refresh } = await useAsyncData('general-notes', () => {
  return client('/notes', {
    query: {
      sort: 'createdAt:desc',
      'filters[load][$null]': true,
      'filters[task][$null]': true,
      populate: ['user.avatar']
    }
  })
}, {
  lazy: true,
  default: () => ({ data: [] })
})

const notes = computed(() => response.value?.data || response.value || [])

const handleRefresh = async () => {
  await refresh()
}

useHead({ title: 'Notes' })
</script>
<template>
  <div class="dashboard_main">
    <UDashboardPanel id="notes-panel" :ui="{ body: 'flex-1 flex flex-col min-h-0' }">
      <template #header>
        <UDashboardNavbar title="Notes">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <div class="flex-1 flex flex-col min-h-0" v-if="permissions.canViewNotes">
          <div v-if="status === 'pending' && !notes.length" class="flex-1 flex items-center justify-center">
            <p class="text-sm text-gray-500">Loading notes...</p>
          </div>
          <div v-else class="flex-1 flex flex-col min-h-0">
            <Notes 
              class="h-full"
              :notes="notes" 
              @refresh="handleRefresh" />
          </div>
        </div>

        <div v-else class="flex-1 flex items-center justify-center p-4">
          <p class="text-muted">You do not have access rights to this section.</p>
        </div>
      </template>
    </UDashboardPanel>
  </div>
</template>