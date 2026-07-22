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
    case 'created': return 'warning'
    case 'done': return 'success'
    default: return 'neutral'
  }
}
const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}
const formatTime = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
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
            <UPageGrid :ui="{ base: 'gap-6 mb-6' }" >
              <UCard 
                v-for="task in filteredTasks" 
                :key="task.id" 
                class="cursor-pointer flex flex-col justify-between"
                @click="navigateTo(`/dashboard/tasks/${task.documentId}`)"
                variant="soft">
                
                <template #header>
                  <div class="flex justify-between items-start gap-2">
                    <UTooltip :text="task.subject">
                      <span class="font-bold text-highlighted text-sm line-clamp-1">
                        {{ task.subject }}
                      </span>
                    </UTooltip>
                    <UFieldGroup size="sm">
                      <UBadge :color="getTaskStatusColor(task.status_task)">
                        {{ formatDate(task.createdAt) }}
                      </UBadge>
                      <UBadge :color="getTaskStatusColor(task.status_task)" variant="soft">
                        {{ formatTime(task.createdAt) }}
                      </UBadge>
                    </UFieldGroup>
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
                  <div class="flex flex-col items-center gap-1 w-full">
                    <div class="w-full flex items-center justify-between text-[11px] text-gray-500 font-mono">  
                      <span>Creator</span>
                      <span>Assigned To</span>
                    </div>

                    <div class="w-full flex items-center justify-between gap-2 text-gray-500 font-mono text-[10px]">
                      <div class="flex flex-col items-center gap-1">
                        <UTooltip v-if="task.creator" :text="task.creator?.name || task.creator?.username">
                          <UAvatar 
                            :src="task.creator.avatar ? thumbImg(task.creator.avatar) : ''"
                            :alt="task.creator.name || task.creator.username" 
                            size="sm" />
                        </UTooltip>
                        <span v-else class="italic">Unassigned</span>
                      </div>

                      <span class="dark:bg-gray-600 bg-gray-400 h-0.5 w-full"></span>

                      <div class="flex flex-col items-center gap-1">
                        <UAvatarGroup v-if="task.executors?.length" :max="2" size="sm">
                          <UTooltip v-for="u in task.executors" :key="u.id" :text="u.name || u.username">
                            <UAvatar 
                              :src="u.avatar ? thumbImg(u.avatar) : ''"
                              :alt="u.name || u.username" 
                              loading="lazy" />
                          </UTooltip>
                        </UAvatarGroup>
                        <span v-else class="italic">Unassigned</span>
                      </div>
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