<!-- components/UploaderFiles.vue -->
<script setup>
import { z } from 'zod'

const client = useStrapiClient()
const toast = useToast()

const props = defineProps({
  label: {
    type: String,
    default: 'Document Files'
  },
  description: {
    type: String,
    default: 'PDF, JPG, PNG format (max. 5MB)'
  },
  required: {
    type: Boolean,
    default: false
  },
  maxFiles: {
    type: Number,
    default: 10
  }
})

const emit = defineEmits(['change'])

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_MIMES = ['image/jpeg', 'image/png', 'application/pdf']
const ACCEPTED_EXT = /\.(jpe?g|png|pdf)$/i

// Схема валидации Zod, динамически реагирующая на props
const schema = computed(() => {
  let filesSchema = z.array(
    z.instanceof(File)
      .refine(file => file.size <= MAX_FILE_SIZE, {
        message: 'File too large (max. 5MB)'
      })
      .refine(file => {
        if (ACCEPTED_MIMES.includes(file.type)) return true
        if (!file.type && file.name) return ACCEPTED_EXT.test(file.name)
        return false
      }, {
        message: 'Invalid format (JPG, PNG, PDF only)'
      })
  )

  if (props.required) {
    filesSchema = filesSchema.min(1, 'At least one file is required')
  }

  return z.object({
    images: filesSchema.max(props.maxFiles, `Maximum ${props.maxFiles} files`)
  })
})

const state = reactive({
  images: [],
  loading: false,
  progress: 0
})

// Оповещаем родителя при выборе или изменении файлов (нужно для автоматических триггеров)
watch(() => state.images, (newVal) => {
  emit('change', newVal)
})

let progressTimer = null
function startSimulatedProgress() {
  clearSimulatedProgress()
  state.progress = 5
  progressTimer = setInterval(() => {
    if (!state.loading) return
    const maxTarget = 95
    const increment = 1 + Math.floor(Math.random() * 6)
    state.progress = Math.min(maxTarget, state.progress + increment)
  }, 300)
}
function finishSimulatedProgress(success = true) {
  state.progress = success ? 100 : 0
  clearSimulatedProgress()
  if (success) setTimeout(() => { state.progress = 0 }, 700)
}
function clearSimulatedProgress() {
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
}
onBeforeUnmount(() => { clearSimulatedProgress() })

function normalizeUploadedResponse(res) {
  if (!res) return []
  if (Array.isArray(res)) return res
  if (res.data && Array.isArray(res.data)) return res.data
  if (res.data) return [res.data]
  return [res]
}

// Очистка загрузчика после успешной отправки формы
function clear() {
  state.images = []
  state.progress = 0
  state.loading = false
}

defineExpose({ uploadFiles, clear, hasFiles: computed(() => state.images.length > 0) })

async function uploadFiles() {
  if (!state.images.length) return []

  try {
    schema.value.parse({ images: state.images })
  } catch (err) {
    const msg = err?.errors?.[0]?.message || 'File validation error'
    toast.add({ title: msg, color: 'error', icon: 'i-hugeicons-cancel-circle' })
    throw new Error(msg)
  }

  state.loading = true
  startSimulatedProgress()

  try {
    const formData = new FormData()
    state.images.forEach(file => formData.append('files', file))

    const res = await client('/upload', { method: 'POST', body: formData })
    const uploadedFiles = normalizeUploadedResponse(res)
    
    if (!uploadedFiles || uploadedFiles.length === 0) {
      throw new Error('Server returned no file data')
    }
    const fileIds = uploadedFiles.map(f => f.id).filter(Boolean)
    
    finishSimulatedProgress(true)
    return fileIds

  } catch (error) {
    console.error('Upload error:', error)
    finishSimulatedProgress(false)
    toast.add({
      title: 'File upload failed',
      description: error?.message,
      color: 'error',
      icon: 'i-hugeicons-cancel-circle',
    })
    throw error
  } finally {
    state.loading = false
  }
}
</script>
<template>
  <UForm :schema="schema" :state="state" class="space-y-2">
    <UFormField name="images">
      <UFileUpload
        v-model="state.images"
        icon="i-hugeicons-upload-04"
        :label="label"
        :description="description"
        layout="grid"
        multiple
        class="w-full min-h-32">
        <template #files-top="{ open, files }">
          <div v-if="files?.length" class="mb-2 flex items-center justify-between">
            <p class="font-bold text-sm">Selected: {{ files?.length }}</p>
            <UButton
              icon="i-hugeicons-plus-sign-circle"
              label="Add"
              color="neutral"
              variant="outline"
              size="xs"
              class="-my-2"
              @click="open()" />
          </div>
        </template>
      </UFileUpload>
    </UFormField>

    <div v-if="state.loading || state.progress > 0" class="space-y-1">
      <div class="flex justify-between items-center text-xs text-gray-400">
        <div>Uploading to server...</div>
        <div>{{ state.progress }}%</div>
      </div>
      <UProgress v-model="state.progress" size="xs" class="w-full" />
    </div>
  </UForm>
</template>