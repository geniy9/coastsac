<!-- components/TaskAdd.vue -->
<script setup>
import { useDebounceFn } from '@vueuse/core'
const open = defineModel('open', { type: Boolean, default: false })
const emit = defineEmits(['success'])

const client = useStrapiClient()
const user = useStrapiUser()
const toast = useToast()

const state = reactive({
  subject: '',
  description: '',
  status_task: 'created',
  category: 'active',
  executors: [],
  load: null,
  driver: null
})

const uploaderRef = ref(null)
const loading = ref(false)

const usersList = ref([])
const driversList = ref([])
const loadsList = ref([])
const loadSearchQuery = ref('') 

const fetchUsers = async () => {
  try {
    const res = await client('/users', { query: { populate: ['role'], pagination: { limit: 100 } } })
    usersList.value = res || []
  } catch (e) {
    console.error(e)
  }
}
const fetchLoads = useDebounceFn(async (q) => {
  try {
    const queryParams = {
      pagination: { limit: 25 }, 
      sort: ['createdAt:desc']
    }
    if (q) { queryParams.filters = { load_number: { $containsi: q }}}
    const res = await client('/loads', { params: queryParams })
    
    loadsList.value = (res.data || []).map(l => ({
      value: l.documentId,
      label: `${l.load_number}`
    }))
  } catch (e) {
    console.error(e)
  }
}, 300)
const fetchDrivers = async () => {
  try {
    const res = await client('/drivers', { query: { pagination: { limit: 100 } } })
    driversList.value = res.data || []
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchUsers()
  fetchLoads('')
  fetchDrivers()
})

const userOptions = computed(() => {
  const employeeRoles = ['admin', 'dispatcher', 'accounting']
  return usersList.value
    .filter(u => {
      const roleType = u.role?.type?.toLowerCase()
      const roleName = u.role?.name?.toLowerCase()
      return employeeRoles.includes(roleType) || employeeRoles.includes(roleName)
    })
    .map(u => ({ value: u.id, label: u.name || u.username }))
})
const driverOptions = computed(() => driversList.value.map(d => ({ value: d.documentId, label: `${d.first_name} ${d.last_name}` })))

const onSubmit = async () => {
  if (!state.subject.trim()) {
    toast.add({ title: 'Validation Error', description: 'Subject is required', color: 'error' })
    return
  }

  loading.value = true
  try {
    let fileIds = []
    if (uploaderRef.value?.hasFiles) {
      fileIds = await uploaderRef.value.uploadFiles()
    }

    const payload = {
      data: {
        subject: state.subject,
        description: state.description,
        status_task: state.status_task,
        category: 'active',
        creator: user.value?.id || null,
        executors: state.executors,
        load: state.load,
        driver: state.driver,
        attachments: fileIds
      }
    }

    await client('/tasks', { method: 'POST', body: payload })
    toast.add({ title: 'Success', description: 'Task created successfully', color: 'success' })
    
    emit('success')
    open.value = false
    
    // Сброс состояния
    state.subject = ''
    state.description = ''
    state.status_task = 'created'
    state.executors = []
    state.load = null
    loadSearchQuery.value = ''
    state.driver = null
    uploaderRef.value?.clear()
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Error', description: error.message || 'Failed to create task', color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>
<template>
  <UModal v-model:open="open" :ui="{ content: 'sm:max-w-xl' }">
    <template #content>
      <UForm :state="state" @submit="onSubmit" class="p-6 space-y-4 overflow-y-auto">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-highlighted">Add Task</h3>
          <UButton icon="hugeicons:cancel-01" color="neutral" variant="ghost" @click="open = false" />
        </div>

        <UFormField label="Task Subject (Theme)" name="subject" required>
          <UInput v-model="state.subject" placeholder="e.g. Missing POD document" required class="w-full" />
        </UFormField>

        <UFormField label="Description" name="description">
          <UTextarea v-model="state.description" placeholder="Specify requirements..." :rows="4" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Status" name="status_task">
            <USelect v-model="state.status_task" :items="[{value: 'draft', label: 'Draft'}, {value: 'created', label: 'Created'}]" class="w-full" />
          </UFormField>

          <UFormField label="Assignees (Addressess)" name="executors">
            <USelectMenu 
              v-model="state.executors" 
              :items="userOptions" 
              multiple 
              value-key="value" 
              class="w-full" 
              :placeholder="state.executors?.length ? 'Select users...' : 'ALL'" />
          </UFormField>
        </div>

        <USeparator label="Linked Entity (Optional)" />

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Linked Load" name="load">
            <USelectMenu
              v-model="state.load"
              v-model:search-term="loadSearchQuery"
              :items="loadsList"
              value-key="value"
              label-key="label"
              ignore-filter
              class="w-full"
              placeholder="Type load number..."
              @update:search-term="fetchLoads" />
          </UFormField>

          <UFormField label="Linked Driver" name="driver">
            <USelect v-model="state.driver" :items="driverOptions" placeholder="None" class="w-full" />
          </UFormField>
        </div>

        <USeparator label="Documents" />

        <UploaderFiles ref="uploaderRef" label="Attachments (max 20MB)" />

        <div class="dashboard flex justify-end gap-3 pt-4">
          <UButton color="neutral" variant="ghost" label="Cancel" @click="open = false" />
          <UButton type="submit" color="primary" label="Create Task" :loading="loading" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>