<!-- pages/dashboard/tasks/index.vue -->
<script setup>
definePageMeta({ layout: 'dashboard' })

const { permissions } = useRolePermissions()
const client = useStrapiClient()
const user = useStrapiUser()
const apiStore = useApiStore()
const pagination = ref({ pageIndex: 0, pageSize: apiStore.defaultPageSize })

const activeTab = ref('active')
const isAddOpen = ref(false)

const tabs = [
  { label: 'Active', value: 'active', icon: 'hugeicons:alert-02' },
  { label: 'Completed', value: 'completed', icon: 'hugeicons:checkmark-circle-03' }
]

const { data: response, status, refresh } = await useAsyncData('tasks-list', () => {
  const query = {
    populate: ['creator.avatar', 'executors.avatar', 'load', 'driver'],
    'filters[category][$eq]': activeTab.value, // Правило 1: вкладка (Active / Completed)
    'pagination[page]': pagination.value.pageIndex + 1,
    'pagination[pageSize]': pagination.value.pageSize,
    sort: ['createdAt:desc']
  }

  // Правило 2: Если НЕ админ, накладываем ограничения (админ видит всё)
  if (!permissions.value.isAdmin) {
    const userId = user.value?.id

    // Правило 4: Текущий пользователь — создатель
    query['filters[$or][0][creator][id][$eq]'] = userId
    
    // Правило 4: Или текущий пользователь есть среди исполнителей
    query['filters[$or][1][executors][id][$in]'] = userId
    
    // Правило 3: Или исполнители не указаны вообще (видят все)
    query['filters[$or][2][executors][id][$null]'] = true
  }

  return client('/tasks', { query })
}, {
  lazy: true,
  watch: [activeTab, pagination],
  default: () => ({ data: [], meta: { pagination: { total: 0 } } })
})
const tasks = computed(() => response.value?.data || [])
const totalTasks = computed(() => response.value?.meta?.pagination?.total || 0)

watch(activeTab, () => {
  pagination.value.pageIndex = 0
})

const filteredTasks = computed(() => {
  const currentUserId = user.value?.id
  const isAdmin = permissions.value.isAdmin

  return tasks.value.filter(task => {
    // 1. Проверяем соответствие вкладке (Active / Completed)
    if (task.category !== activeTab.value) {
      return false
    }
    // 2. Администратор видит абсолютно все задачи
    if (isAdmin) {
      return true
    }
    const executors = task.executors || []
    // 3. Если исполнители не указаны (массив пуст), задачу видят все
    if (executors.length === 0) {
      return true
    }
    // 4. Иначе проверяем, является ли текущий пользователь создателем или исполнителем
    const isCreator = task.creator?.id === currentUserId
    const isExecutor = executors.some(exec => exec.id === currentUserId)

    return isCreator || isExecutor
  })
})
const handleRefresh = async () => { await refresh() }
useHead({ title: 'Tasks' })
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
          <div v-else-if="tasks.length === 0" class="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-500 gap-2">
            <UIcon name="hugeicons:task-remove-01" class="w-9 h-9" />
            <p class="text-lg font-semibold">No tasks found</p>
            <p class="text-sm text-muted">There are no tasks in this category.</p>
          </div>

          <!-- TASKS -->
          <div v-else class="flex-1 flex flex-col gap-4 min-h-0">
            <template v-if="activeTab === 'active'">
              <UPageGrid :ui="{ base: 'gap-6 mb-6' }">
                <Task v-for="task in tasks" :task="task" :key="task.id"  />
              </UPageGrid>
              <TablePagination 
                v-model:pagination="pagination"
                :total="totalTasks" />
            </template>
            <template v-else>
              <TaskList 
                :tasks="tasks" 
                :total="totalTasks"
                v-model:pagination="pagination"
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