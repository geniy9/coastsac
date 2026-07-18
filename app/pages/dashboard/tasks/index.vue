<!-- pages/dashboard/tasks/index.vue -->
<script setup>
definePageMeta({ layout: 'dashboard' })

const { permissions } = useRolePermissions()
const client = useStrapiClient()
const { thumbImg } = useConfig()

const activeTab = ref('active')
const tabs = [
  { label: 'Active', value: 'active', icon: 'hugeicons:alert-02' },
  { label: 'Completed', value: 'completed', icon: 'hugeicons:checkmark-circle-03' }
]

const isAddOpen = ref(false)
const limit = ref(24)

const { data: response, status, refresh } = await useAsyncData('tasks-list', () => {
  return client('/tasks', {
    query: {
      populate: ['creator.avatar', 'executors.avatar', 'load', 'driver'],
      pagination: { limit: limit.value }
    }
  })
}, {
  lazy: true,
  default: () => ({ data: [] })
})

const tasks = computed(() => response.value?.data || [])

const filteredTasks = computed(() => {
  return tasks.value.filter(task => {
    return task.category === activeTab.value
  })
})

const handleRefresh = async () => {
  await refresh()
}

const getTaskStatusColor = (status) => {
  switch (status) {
    case 'draft': return 'neutral'
    case 'created': return 'info'
    case 'done': return 'success'
    default: return 'neutral'
  }
}
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
          <!-- EMPTY LIST -->
          <div v-else-if="filteredTasks.length === 0" class="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-500 gap-2">
            <UIcon name="hugeicons:task-remove-01" class="w-9 h-9" />
            <p class="text-lg font-semibold">No tasks found</p>
            <p class="text-sm text-muted">There are no tasks in this category.</p>
          </div>

          <!-- TASKS -->
          <div v-else class="flex-1">
            <UPageGrid>
              <UCard 
                v-for="task in filteredTasks" 
                :key="task.id" 
                class="cursor-pointer flex flex-col justify-between"
                @click="navigateTo(`/dashboard/tasks/${task.documentId}`)">
                
                <template #header>
                  <div class="flex justify-between items-start gap-2">
                    <span class="font-bold text-highlighted text-sm line-clamp-1">
                      {{ task.subject }}
                    </span>
                    <UBadge :color="getTaskStatusColor(task.status_task)" size="sm">
                      <!-- {{ task.status_task }} -->
                      {{ new Date(task.createdAt).toLocaleDateString() }}
                    </UBadge>
                  </div>
                </template>

                <div class="space-y-3">
                  <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                    {{ task.description || 'No description provided.' }}
                  </p>

                  <!-- Привязанные объекты -->
                  <div v-if="task.load || task.driver" class="flex flex-wrap gap-1.5 pt-1">
                    <UBadge v-if="task.load" color="neutral" variant="soft" icon="hugeicons:lift-truck">
                      Load {{ task.load.load_number }}
                    </UBadge>
                    <UBadge v-if="task.driver" color="neutral" variant="soft" icon="hugeicons:user-group-02">
                      {{ task.driver.first_name }} {{ task.driver.last_name }}
                    </UBadge>
                  </div>
                </div>

                <template #footer>
                  <div class="flex items-center justify-between text-[11px] text-gray-500 font-mono">
                    <div class="flex flex-col items-center gap-1">
                      <span class="text-xs text-gray-500">
                        Creator:
                      </span>
                      <UTooltip v-if="task.creator" :text="task.creator?.name || task.creator?.username">
                        <UAvatar 
                          :src="task.creator.avatar ? thumbImg(task.creator.avatar) : ''"
                          :alt="task.creator.name || task.creator.username" 
                          size="sm" />
                      </UTooltip>
                      <span v-else class="text-[10px] text-gray-500 italic">
                        Unassigned
                      </span>
                    </div>
                    <div class="flex flex-col items-center gap-1">
                      <span class="text-xs text-gray-500">
                        Assigned To:
                      </span>
                      <UAvatarGroup v-if="task.executors?.length" :max="2">
                        <UTooltip v-for="u in task.executors" :key="u.id" :text="u.name || u.username">
                          <UAvatar 
                            :src="u.avatar ? thumbImg(u.avatar) : ''"
                            :alt="u.name || u.username" 
                            size="sm" loading="lazy" />
                        </UTooltip>
                      </UAvatarGroup>
                      <span v-else class="text-[10px] text-gray-500 italic">
                        Unassigned
                      </span>
                    </div>
                  </div>
                </template>
              </UCard>
            </UPageGrid>
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