<!-- components/Factoring.vue -->
<script setup>
const open = defineModel('open', { type: Boolean, default: false })
const props = defineProps({
  selectedLoads: {
    type: Array,
    required: true
  }
})
const emit = defineEmits(['success'])

const client = useStrapiClient()
const toast = useToast()
const user = useStrapiUser()

const state = reactive({
  emails: ['sfd@audit.triumphpay.com'],
  ccEmails: ['nurjemal@lightdispatch.com', 'sacramento.c2c@gmail.com'],
  subject: 'Coast to Coast Inc. / ACH',
  message: ''
})

const extraFiles = ref([])
const extraUploaderRef = ref(null)
const loading = ref(false)

// Инициализация СС имейла из текущего профиля бухгалтера (по возможности)
watch(() => user.value, (u) => {
  if (u?.email && !state.ccEmails.includes(u.email)) {
    state.ccEmails.push(u.email)
  }
}, { immediate: true })

// Динамическая генерация текста со списком грузов
watch(() => props.selectedLoads, (loads) => {
  if (loads && loads.length) {
    const listText = loads.map((l, index) => `${index + 1}) Load: ${l.load_number}`).join('\n')
    state.message = `Hi team,\nPlease find the attached paperwork:\n\n${listText}\n\nBest regards,\n${user.value?.name || user.value?.username || 'Coast to Coast team'}`
  }
}, { immediate: true })

// Расчет объема вложений, закрепленных за самими грузами
const loadAttachmentsStats = computed(() => {
  let count = 0
  let sizeKB = 0
  props.selectedLoads.forEach(load => {
    const rcs = load.doc_rate_confirmation || []
    const pods = load.doc_pod_bol || []
    rcs.forEach(f => {
      count++
      sizeKB += Number(f.size || 0)
    })
    pods.forEach(f => {
      count++
      sizeKB += Number(f.size || 0)
    })
  })
  return { count, sizeMB: sizeKB / 1024 }
})

// Отслеживание загрузки дополнительных файлов
const handleExtraFilesChange = (files) => {
  extraFiles.value = files || []
}

// Расчет объема дополнительных файлов в MB (size в JS File объектах идет в байтах)
const extraAttachmentsSizeMB = computed(() => {
  const totalBytes = extraFiles.value.reduce((sum, file) => sum + file.size, 0)
  return totalBytes / (1024 * 1024)
})

const totalAttachmentsCount = computed(() => {
  return loadAttachmentsStats.value.count + extraFiles.value.length
})

const totalSizeMB = computed(() => {
  return loadAttachmentsStats.value.sizeMB + extraAttachmentsSizeMB.value
})

const isLimitExceeded = computed(() => totalSizeMB.value > 25)

const onSubmit = async () => {
  if (state.emails.length === 0) {
    toast.add({ title: 'Validation Error', description: 'Destination email is required.', color: 'error' })
    return
  }
  if (isLimitExceeded.value) {
    toast.add({ title: 'Validation Error', description: 'Total attachments size must be under 25MB.', color: 'error' })
    return
  }

  loading.value = true
  try {
    let extraAttachmentIds = []
    if (extraUploaderRef.value?.hasFiles) {
      extraAttachmentIds = await extraUploaderRef.value.uploadFiles()
    }

    await client('/factorings/send', {
      method: 'POST',
      body: {
        emails: state.emails,
        ccEmails: state.ccEmails,
        subject: state.subject,
        message: state.message,
        loadIds: props.selectedLoads.map(l => l.documentId),
        extraAttachmentIds
      }
    })

    toast.add({
      title: 'Success',
      description: 'Factoring request has been sent successfully!',
      color: 'success'
    })

    emit('success')
    open.value = false
    extraUploaderRef.value?.clear()
  } catch (error) {
    console.error(error)
    toast.add({
      title: 'Error',
      description: error?.message || 'Failed to process factoring',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>
<template>
  <UModal v-model:open="open" :ui="{ content: 'sm:max-w-xl' }">
    <template #content>
      <div class="p-6 space-y-6 overflow-y-auto max-h-[90vh]">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-highlighted">
            Factoring Transmission ({{ selectedLoads.length }} loads)
          </h3>
          <UButton icon="i-lucide-x" color="neutral" variant="ghost" @click="open = false" />
        </div>

        <UForm :state="state" class="space-y-4" @submit="onSubmit">
          <UFormField label="To Email" name="emails" required>
            <UInputTags v-model="state.emails" placeholder="Type email and press enter..." class="w-full" />
          </UFormField>

          <UFormField label="CC Email" name="ccEmails">
            <UInputTags v-model="state.ccEmails" placeholder="Type email and press enter..." class="w-full" />
          </UFormField>

          <UFormField label="Subject" name="subject" required>
            <UInput v-model="state.subject" class="w-full" required />
          </UFormField>

          <UFormField label="Message" name="message" required>
            <UTextarea v-model="state.message" :rows="8" class="w-full font-sans" required />
          </UFormField>

          <USeparator label="Extra Attachments" />

          <UploaderFiles 
            ref="extraUploaderRef" 
            label="Upload Custom Paperwork" 
            description="Lumper receipts, driver sheets, sheets etc. (Max 5MB per file)" 
            @change="handleExtraFilesChange" />

          <!-- Аналитика веса файлов письма -->
          <div class="bg-muted/30 p-4 border border-default rounded-lg space-y-3">
            <div class="flex justify-between items-center text-xs">
              <span class="text-gray-400">Total Loads:</span>
              <span class="font-bold text-highlighted">{{ selectedLoads.length }}</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-gray-400">Total Attached Files:</span>
              <span class="font-bold text-highlighted">{{ totalAttachmentsCount }}</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-gray-400">Payload Weight:</span>
              <span :class="['font-mono', isLimitExceeded ? 'text-red-500' : 'text-highlighted']">
                {{ totalSizeMB.toFixed(2) }} MB / 25 MB
              </span>
            </div>

            <UProgress 
              :model-value="Math.min(100, (totalSizeMB / 25) * 100)" 
              :color="isLimitExceeded ? 'error' : 'primary'"
              size="sm" />

            <p v-if="isLimitExceeded" class="text-xs text-red-500 font-semibold mt-1">
              Attachment weight limit exceeded. Please deselect some loads or reduce the size of the uploaded paperwork.
            </p>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-default">
            <UButton color="neutral" variant="ghost" label="Cancel" @click="open = false" />
            <UButton 
              type="submit" 
              color="primary" 
              label="Send Factoring" 
              :loading="loading" 
              :disabled="isLimitExceeded || loading" />
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>