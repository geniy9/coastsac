<!-- pages/dashboard/tasks/[id].vue -->
<script setup>
definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const taskId = route.params.id

const { permissions } = useRolePermissions()
const client = useStrapiClient()
const toast = useToast()
const { getFileUrl, getMime, isImageFile, thumbImg } = useConfig()

const statusUpdating = ref(false)
const isPreviewOpen = ref(false)
const previewFile = ref(null)

const { data: response, status, refresh } = await useAsyncData(`task-${taskId}`, () => {
  return client(`/tasks/${taskId}`, {
    query: {
      populate: [
        'creator', 
        'executors', 
        'load', 
        'driver', 
        'attachments',
        'notes.user.avatar'
      ]
    }
  })
}, {
  lazy: true,
  default: () => null
})

const task = computed(() => response.value?.data || response.value || null)

const handleRefresh = async () => {
  await refresh()
}

const handleMarkAsDone = async () => {
  if (!confirm('Are you sure you want to complete this task?')) return
  statusUpdating.value = true

  try {
    await client(`/tasks/${task.value.documentId}`, {
      method: 'PUT',
      body: {
        data: {
          status_task: 'done',
          category: 'completed'
        }
      }
    })
    toast.add({ title: 'Task Completed', description: 'The task status updated to Done', color: 'success' })
    await handleRefresh()
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Error', description: 'Failed to update task status', color: 'error' })
  } finally {
    statusUpdating.value = false
  }
}

const downloadFile = (url) => { if (import.meta.client) { window.open(url, '_blank') } }
const handleFileClick = (file) => {
  const fullUrl = getFileUrl(file)
  if (isImageFile(file)) {
    previewFile.value = { ...file, fullUrl }
    isPreviewOpen.value = true
  } else {
    downloadFile(fullUrl)
  }
}
</script>
<template>
  <div class="dashboard_main">
    <UDashboardPanel :id="taskId">
      <template #header>
        <UDashboardNavbar :title="task ? `Task: ${task.subject}` : 'Loading Task...'">
          <template #leading>
            <UDashboardSidebarCollapse />
            <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" to="/dashboard/tasks" />
          </template>
          <template #right>
            <UButton 
              v-if="task && task.status_task !== 'done' && (permissions.canEditTasks)"
              icon="hugeicons:checkmark-circle-03" 
              label="Mark as Done" 
              color="success" 
              :loading="statusUpdating"
              @click="handleMarkAsDone" />
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <div class="flex-1 flex flex-col min-h-0" v-if="permissions.canViewTasks">
          
          <div v-if="status === 'pending' && !task" class="flex-1 flex items-center justify-center">
            <p class="text-sm text-gray-500">Loading task details...</p>
          </div>

          <div v-else-if="!task" class="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
            <p class="text-lg font-semibold text-error">Task not found</p>
            <UButton to="/dashboard/tasks" label="Go to Tasks List" color="neutral" variant="ghost" />
          </div>

          <div v-else class="space-y-6 overflow-y-auto flex-1 w-full pr-4">
            
            <!-- Информационная карточка -->
            <UCard variant="soft">
              <template #header>
                <div class="flex flex-wrap items-center justify-between gap-4">
                  <div class="flex items-center gap-2.5">
                    <h1 class="text-xl font-bold text-highlighted">
                      {{ task.subject }}
                    </h1>
                    <UBadge color="primary" variant="solid" class="uppercase">
                      {{ task.category }}
                    </UBadge>
                    <UBadge :color="task.status_task === 'done' ? 'success' : 'info'" variant="soft" class="uppercase">
                      {{ task.status_task }}
                    </UBadge>
                  </div>
                  <span class="text-xs text-gray-500 font-mono">
                    Created: {{ new Date(task.createdAt).toLocaleString() }}
                  </span>
                </div>
              </template>

              <div class="space-y-4">
                <div>
                  <p class="text-xs text-gray-500 uppercase font-semibold">Description</p>
                  <p class="text-sm text-highlighted mt-1 whitespace-pre-wrap leading-relaxed">
                    {{ task.description || 'No additional description provided.' }}
                  </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-default/40 pt-4 font-mono text-xs">
                  <div>
                    <span class="text-gray-500">Creator:</span>
                    <p class="text-highlighted font-bold mt-0.5">
                      {{ task.creator?.name || task.creator?.username || 'System' }}
                    </p>
                  </div>
                  <div>
                    <span class="text-gray-500">Assigned To:</span>
                    <div class="flex flex-col gap-1 mt-0.5">
                      <span v-for="u in task.executors" :key="u.id" class="text-highlighted font-semibold">
                        • {{ u.name || u.username }}
                      </span>
                      <span v-if="!task.executors?.length" class="text-gray-500 italic">No assignees</span>
                    </div>
                  </div>
                  <div class="space-y-2">
                    <div v-if="task.load">
                      <span class="text-gray-500">Linked Load:</span>
                      <p>
                        <NuxtLink :to="`/dashboard/loads/${task.load.documentId}`" class="text-primary hover:underline font-bold">
                          #{{ task.load.load_number }}
                        </NuxtLink>
                      </p>
                    </div>
                    <div v-if="task.driver">
                      <span class="text-gray-500">Linked Driver:</span>
                      <p>
                        <NuxtLink :to="`/dashboard/drivers/${task.driver.documentId}`" class="text-primary hover:underline font-bold">
                          {{ task.driver.first_name }} {{ task.driver.last_name }}
                        </NuxtLink>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </UCard>

            <!-- Документы / Вложения -->
            <UCard variant="soft" v-if="task.attachments?.length">
              <template #header>
                <h3 class="font-semibold text-highlighted">Attached Files</h3>
              </template>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div v-for="file in task.attachments" :key="file.id" 
                  class="flex items-center gap-3 p-2 border border-primary/20 rounded-lg hover:border-primary/50 transition cursor-pointer group"
                  @click="handleFileClick(file)">
                  <div class="w-12 h-12 shrink-0 rounded-md overflow-hidden flex items-center justify-center">
                    <img v-if="isImageFile(file)" :src="thumbImg(file)" class="w-full h-full object-cover" />
                    <UIcon v-else name="hugeicons:document-attachment" class="w-8 h-8 text-primary" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-xs font-semibold text-highlighted truncate group-hover:text-primary transition">
                      {{ file.name || file.url.split('/').pop() }}
                    </p>
                    <p class="text-[10px] text-gray-500 uppercase mt-0.5 font-mono">
                      {{ getMime(file) }}
                    </p>
                  </div>
                  <UButton icon="hugeicons:download-01" variant="soft" size="sm" @click.stop="downloadFile(getFileUrl(file))" />
                </div>
              </div>
            </UCard>

            <!-- Notes -->
            <Notes 
              :task-id="task.documentId" 
              :notes="task.notes || []" 
              @refresh="handleRefresh" />

          </div>
        </div>

        <div v-else class="flex-1 flex items-center justify-center p-4">
          <p class="text-muted">You do not have access rights to this section.</p>
        </div>


        <!-- FILE/PHOTO PREVIEW -->
        <UModal v-model:open="isPreviewOpen" :ui="{ width: 'sm:max-w-3xl' }">
          <template #content>
            <div class="p-4 flex flex-col items-center">
              <div class="w-full flex justify-between items-center mb-3">
                <h4 class="text-sm font-bold truncate text-highlighted max-w-lg">
                  {{ previewFile?.name }}
                </h4>
                <UButton icon="i-lucide-x" color="neutral" variant="ghost" @click="isPreviewOpen = false" />
              </div>
              <div class="relative max-h-[75vh] overflow-auto flex items-center justify-center bg-black/40 rounded-lg p-2 w-full">
                <img :src="previewFile?.fullUrl" 
                  class="max-h-[65vh] w-auto h-auto object-contain rounded-md" 
                  alt="Document attachment preview" />
              </div>
              <div class="mt-3 flex justify-end w-full gap-2">
                <UButton 
                  icon="hugeicons:link-square-02" 
                  label="Open in new tab" 
                  color="neutral" 
                  variant="outline"
                  @click="downloadFile(previewFile?.fullUrl)" />
                <UButton 
                  icon="hugeicons:cloud-download" 
                  label="Download" 
                  color="primary" 
                  @click="downloadFile(previewFile?.fullUrl)" />
              </div>
            </div>
          </template>
        </UModal>
      </template>
    </UDashboardPanel>
  </div>
</template>