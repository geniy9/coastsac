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

const schema = computed(() => {
  let filesSchema = z.array(
    z.instanceof(File, { message: 'Invalid file object' })
      .superRefine((file, ctx) => {
        if (file.size > MAX_FILE_SIZE) {
          ctx.addIssue({
            code: 'custom',
            message: `File "${file.name}" is too large (max. 5MB)`
          })
        }
        const isValidMime = ACCEPTED_MIMES.includes(file.type)
        const isValidExt = !file.type && file.name && ACCEPTED_EXT.test(file.name)

        if (!isValidMime && !isValidExt) {
          ctx.addIssue({
            code: 'custom',
            message: `File "${file.name}" has unsupported format (${file.type || 'unknown format'}). Allowed: JPG, PNG, PDF`
          })
        }
      })
  )
  if (props.required) {
    filesSchema = filesSchema.min(1, 'At least one file is required')
  }
  return z.object({
    images: filesSchema.max(props.maxFiles, `Maximum ${props.maxFiles} files allowed`)
  })
})

const state = reactive({
  images: [],
  loading: false,
  progress: 0
})
watch(() => state.images, (newVal) => { emit('change', newVal) })

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
    const issues = err?.issues || err?.errors || []
    const msg = issues[0]?.message || err?.message || 'File validation error'
    toast.add({ 
      title: 'Validation Error',
      description: msg,
      color: 'error', 
      icon: 'i-hugeicons-cancel-circle' 
    })
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
    
    let errorDescription = error?.message || 'Unknown network error'
    
    const statusCode = error?.status || error?.response?.status
    if (statusCode === 413) {
      errorDescription = 'The file is too large for the server configuration. Please increase limits.'
    } else if (statusCode === 404) {
      errorDescription = 'Upload endpoint not found (HTTP 404). Please check your backend configurations.'
    } else if (error?.response?._data?.error?.message) {
      errorDescription = error.response._data.error.message
    }
    
    toast.add({
      title: 'File upload failed',
      description: errorDescription,
      color: 'error',
      icon: 'i-hugeicons-cancel-circle',
    })
    
    throw new Error(errorDescription)
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
        icon="hugeicons:file-upload"
        :label="label"
        :description="description" 
        :file-delete="{ color: 'error', variant: 'solid', size: 'xs' }"
        layout="grid"
        multiple
        class="w-full min-h-32">
        <template #files-top="{ open, files }">
          <div v-if="files?.length" class="mb-2 flex items-center justify-between">
            <p class="font-bold text-sm">Selected: {{ files?.length }}</p>
            <UButton
              icon="hugeicons:plus-sign-circle"
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