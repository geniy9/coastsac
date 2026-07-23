<!-- pages/dashboard/tasks/index.vue -->
<script setup>
definePageMeta({ layout: 'dashboard' })

const { permissions } = useRolePermissions()
const client = useStrapiClient()

const activeTab = ref('active')
const isAddOpen = ref(false)
const limit = ref(25)

const tabs = [
  { label: 'Active', value: 'active', icon: 'hugeicons:alert-02' },
  { label: 'Completed', value: 'completed', icon: 'hugeicons:checkmark-circle-03' }
]

const { data: response, status, refresh } = await useAsyncData('tasks-list', () => {
  return client('/tasks', {
    query: {
      populate: ['creator.avatar', 'executors.avatar', 'load', 'driver'],
      pagination: { limit: limit.value },
      sort: ['createdAt:desc']
    }
  })
}, {
  lazy: true,
  watch: [limit],
  default: () => ({ data: [] })
})
const tasks = computed(() => response.value?.data || [])

const filteredTasks = computed(() => {
  return tasks.value.filter(task => {
    return task.category === activeTab.value
  })
})
const handleRefresh = async () => { await refresh() }
</script>
<template>
  <div class="dashboard_main">
    <UDashboardPanel id="tasks">
      <template #header>
        <UDashboardNavbar title="Corporate Tasks">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
          <template #right>
            <UButton 
              v-if="permissions.canCreateTasks"
              icon="i-lucide-plus" 
              label="Add Task" 
              color="primary" 
              @click="isAddOpen = true" />
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <div class="flex-1 flex flex-col gap-4 min-h-0" v-if="permissions.canViewTasks">
          <UTabs v-model="activeTab" :items="tabs" class="w-full shrink-0" />

          <!-- LOADING -->
          <div v-if="status === 'pending'" class="flex-1 flex items-center justify-center">
            <p class="text-sm text-gray-500">Loading tasks...</p>
          </div>
          <!-- EMPTY -->
          <div v-else-if="filteredTasks.length === 0" class="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-500 gap-2">
            <UIcon name="hugeicons:task-remove-01" class="w-9 h-9" />
            <p class="text-lg font-semibold">No tasks found</p>
            <p class="text-sm text-muted">There are no tasks in this category.</p>
          </div>

          <!-- TASKS -->
          <div v-else class="flex-1 flex flex-col gap-4 min-h-0">
            <template v-if="activeTab === 'active'">
              <UPageGrid :ui="{ base: 'gap-6 mb-6' }">
                <Task v-for="task in filteredTasks" :task="task" :key="task.id"  />
              </UPageGrid>
              <TablePagination 
                v-model:limit="limit"
                :total="filteredTasks.length"
                :show-limit="true" />
            </template>
            <template v-else>
              <TaskList 
                :tasks="filteredTasks" 
                v-model:limit="limit"
                :loading="status === 'pending'" />
            </template>
          </div>

          <TaskAdd v-model:open="isAddOpen" @success="handleRefresh" />
        </div>

        <div v-else class="flex-1 flex items-center justify-center p-4">
          <p class="text-muted">You do not have access rights to this section.</p>
        </div>
      </template>
    </UDashboardPanel>
  </div>
</template>