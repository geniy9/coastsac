<!-- components/LoadEdit.vue -->
<script setup>
import { useDebounceFn } from '@vueuse/core'
const open = defineModel('open', { type: Boolean, default: false })
const props = defineProps({
  load: {
    type: Object,
    default: null
  }
})
const emit = defineEmits(['success'])

const client = useStrapiClient()
const toast = useToast()
const { permissions } = useRolePermissions()
const { statesList, loadStatusOptions, categoryOptions, factoringStatusOptions, imageUrl, getMime } = useConfig()

const state = reactive({
  load_number: '',
  pickup_date: '',
  pickup_time: '',
  delivery_date: '',
  status_load: 'not_started',
  category: 'active',
  notes: '',
  driver: null,
  broker: '',
  shipper_address: { city: '', state: 'AL', full_address: '' },
  receiver_address: { city: '', state: 'AL', full_address: '' },
  factoring_status: 'not_submitted',
  factoring: {
    invoice_amount: 0,
    funding_date: '',
    advance_received: 0,
    factoring_fee: 0,
    remaining_balance: 0,
    payment_date: ''
  }
})

const loading = ref(false)
const deleteLoading = ref(false)

// Списки файлов
const rateUploaderRef = ref(null)
const podUploaderRef = ref(null)

// Хранилище уже имеющихся файлов на сервере
const existingRateDocs = ref([])
const existingPodDocs = ref([])

const driversList = ref([])
const brokersList = ref([])
const selectedBrokerModel = ref(null)
const brokerSearchQuery = ref('')

onMounted(async () => {
  await fetchDrivers()
  await fetchBrokers()
})

const fetchDrivers = async () => {
  try {
    // ИСПРАВЛЕНО: query -> params для полной безопасности
    const res = await client('/drivers', { params: { pagination: { limit: 100 } } })
    driversList.value = res.data || []
  } catch (e) {
    console.error(e)
  }
}

const fetchBrokers = useDebounceFn(async (q) => {
  try {
    const filterParams = { pagination: { limit: 30 } }
    if (q) {
      filterParams.filters = { name: { $containsi: q } }
    }
    const res = await client('/brokers', { params: filterParams })
    brokersList.value = (res.data || []).map(b => ({
      label: b.name,
      value: b.documentId
    }))
  } catch (e) {
    console.error('Failed to load brokers:', e)
  }
}, 300)

const handleBrokerCreate = (name) => {
  const newItem = { label: name, value: name }
  brokersList.value.push(newItem)
  selectedBrokerModel.value = name
}

watch(() => props.load, (newVal) => {
  if (newVal) {
    Object.assign(state, {
      load_number: newVal.load_number || '',
      pickup_date: newVal.pickup_date ? newVal.pickup_date.split('T')[0] : '',
      pickup_time: newVal.pickup_time ? newVal.pickup_time.substring(0, 5) : '',
      delivery_date: newVal.delivery_date ? newVal.delivery_date.split('T')[0] : '',
      status_load: newVal.status_load || 'not_started',
      category: newVal.category || 'active',
      notes: newVal.notes || '',
      driver: newVal.driver?.documentId || null,
      shipper_address: {
        city: newVal.shipper_address?.city || '',
        state: newVal.shipper_address?.state || 'AL',
        full_address: newVal.shipper_address?.full_address || ''
      },
      receiver_address: {
        city: newVal.receiver_address?.city || '',
        state: newVal.receiver_address?.state || 'AL',
        full_address: newVal.receiver_address?.full_address || ''
      },
      factoring_status: newVal.factoring_status || 'not_submitted',
      factoring: {
        invoice_amount: newVal.factoring?.invoice_amount || 0,
        funding_date: newVal.factoring?.funding_date ? newVal.factoring.funding_date.split('T')[0] : '',
        advance_received: newVal.factoring?.advance_received || 0,
        factoring_fee: newVal.factoring?.factoring_fee || 0,
        remaining_balance: newVal.factoring?.remaining_balance || 0,
        payment_date: newVal.factoring?.payment_date ? newVal.factoring.payment_date.split('T')[0] : ''
      }
    })

    existingRateDocs.value = newVal.doc_rate_confirmation || []
    existingPodDocs.value = newVal.doc_pod_bol || []
    
    // Инициализируем текущего привязанного брокера для корректного отображения
    if (newVal.broker) {
      brokersList.value = [{
        label: newVal.broker.name,
        value: newVal.broker.documentId
      }]
      selectedBrokerModel.value = newVal.broker.documentId
      state.broker = newVal.broker.documentId
    } else {
      selectedBrokerModel.value = null
      state.broker = ''
    }
    
    rateUploaderRef.value?.clear()
    podUploaderRef.value?.clear()
  }
}, { immediate: true })

// Автоматический перевод в unloaded и completed при добавлении документов POD/BOL
const handlePodFilesChange = (files) => {
  if (files && files.length > 0) {
    state.status_load = 'unloaded'
    state.category = 'completed'
    state.delivery_date = new Date().toISOString().split('T')[0]
  }
}

watch(selectedBrokerModel, (newVal) => {
  state.broker = newVal || ''
})

const driverOptions = computed(() => {
  return driversList.value.map(d => ({
    value: d.documentId,
    label: `${d.first_name || ''} ${d.last_name || ''}`.trim() || `Driver #${d.id}`
  }))
})

const onSubmit = async () => {
  if (!props.load?.documentId) return

  loading.value = true
  try {
    // 1. Проверяем дубликат
    const duplicateCheck = await client('/loads', {
      params: { filters: { load_number: { $eq: state.load_number } } }
    })
    const isDuplicate = duplicateCheck.data.some(l => l.documentId !== props.load.documentId)
    if (isDuplicate) {
      throw new Error(`Load number "${state.load_number}" is already used.`)
    }

    // 2. Вызываем загрузку файлов через методы дочерних компонентов
    let finalRateIds = existingRateDocs.value.map(d => d.id)
    if (rateUploaderRef.value?.hasFiles) {
      const newRateIds = await rateUploaderRef.value.uploadFiles()
      finalRateIds = [...finalRateIds, ...newRateIds]
    }

    let finalPodIds = existingPodDocs.value.map(d => d.id)
    if (podUploaderRef.value?.hasFiles) {
      const newPodIds = await podUploaderRef.value.uploadFiles()
      finalPodIds = [...finalPodIds, ...newPodIds]
    }

    // Вспомогательная функция очистки дат: заменяет пустую строку "" на null
    const cleanDate = (dateStr) => {
      return dateStr && dateStr.trim() !== '' ? dateStr : null;
    }

    // 3. Формируем payload с очищенными датами
    const payload = {
      data: {
        ...state,
        pickup_date: cleanDate(state.pickup_date),
        delivery_date: cleanDate(state.delivery_date),
        pickup_time: state.pickup_time && state.pickup_time.length === 5 
          ? `${state.pickup_time}:00.000` 
          : state.pickup_time || null,
        doc_rate_confirmation: finalRateIds,
        doc_pod_bol: finalPodIds,
        category: state.status_load === 'cancelled' || state.status_load === 'unloaded' ? 'completed' : state.category
      }
    }

    // Очищаем даты внутри вложенного объекта факторинга
    if (payload.data.factoring) {
      payload.data.factoring = {
        ...state.factoring,
        funding_date: cleanDate(state.factoring.funding_date),
        payment_date: cleanDate(state.factoring.payment_date)
      }
    }

    if (!permissions.value.isAdmin && !permissions.value.isAccounting) {
      delete payload.data.factoring
      delete payload.data.factoring_status
    }

    await client(`/loads/${props.load.documentId}`, {
      method: 'PUT',
      body: payload
    })

    toast.add({
      title: 'Success',
      description: 'Load updated successfully!',
      color: 'success'
    })

    emit('success')
    open.value = false
    rateUploaderRef.value?.clear()
    podUploaderRef.value?.clear()
  } catch (error) {
    console.error(error)
    toast.add({
      title: 'Error',
      description: error?.message || 'Failed to update load',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

const onDelete = async () => {
  if (!props.load?.documentId) return
  if (!confirm('Are you sure you want to delete this load?')) return

  deleteLoading.value = true
  try {
    await client(`/loads/${props.load.documentId}`, {
      method: 'DELETE'
    })

    toast.add({
      title: 'Deleted',
      description: 'Load card has been successfully deleted!',
      color: 'success'
    })

    emit('success')
    open.value = false
  } catch (error) {
    console.error(error)
    toast.add({
      title: 'Error',
      description: error?.data?.error?.message || 'Failed to delete load',
      color: 'error'
    })
  } finally {
    deleteLoading.value = false
  }
}
</script>
<template>
  <UModal v-model:open="open">
    <template #content>
      <UForm :state="state" @submit="onSubmit" class="grid gap-6 p-6 overflow-y-auto max-h-[90vh]">
        
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-highlighted">
            Edit load #{{ load?.load_number }}
          </h3>
          <UButton icon="i-lucide-x" color="neutral" variant="ghost" @click="open = false" />
        </div>

        <USeparator label="General Info" />

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Load Number" name="load_number" required>
            <UInput v-model="state.load_number" required class="w-full" />
          </UFormField>
          <UFormField label="Status" name="status_load">
            <USelect v-model="state.status_load" :items="loadStatusOptions" class="w-full capitalize" />
          </UFormField>
          <UFormField label="Driver">
            <USelect v-model="state.driver" :items="driverOptions" class="w-full" placeholder="Unassigned" />
          </UFormField>
          <UFormField label="Broker" required>
            <USelectMenu
              v-model="selectedBrokerModel"
              v-model:search-term="brokerSearchQuery"
              :items="brokersList"
              value-key="value"
              label-key="label"
              ignore-filter
              create-item="always"
              class="w-full"
              placeholder="Type or select broker..."
              @update:search-term="fetchBrokers"
              @create="handleBrokerCreate" />
          </UFormField>
        </div>

        <USeparator label="Route Info" />

        <div class="grid grid-cols-3 gap-4">
          <UFormField label="Shipper City" name="shipper_address.city" required>
            <UInput v-model="state.shipper_address.city" required class="w-full" />
          </UFormField>
          <UFormField label="Shipper State" name="shipper_address.state" required>
            <USelect v-model="state.shipper_address.state" :items="statesList" required class="w-full" />
          </UFormField>
          <UFormField label="Pickup Date" name="pickup_date" required>
            <UInput v-model="state.pickup_date" type="date" required class="w-full" />
          </UFormField>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <UFormField label="Receiver City" name="receiver_address.city" required>
            <UInput v-model="state.receiver_address.city" required class="w-full" />
          </UFormField>
          <UFormField label="Receiver State" name="receiver_address.state" required>
            <USelect v-model="state.receiver_address.state" :items="statesList" required class="w-full" />
          </UFormField>
          <UFormField label="Delivery Date (POD)" name="delivery_date">
            <UInput v-model="state.delivery_date" type="date" disabled class="w-full bg-gray-100 dark:bg-gray-800" />
          </UFormField>
        </div>

        <USeparator label="Rate Confirmation" />

        <div class="grid gap-4">
          <div v-if="existingRateDocs.length">
            <p class="font-medium text-gray-500 text-xs">
              Current Rate Conf Files:
            </p>
            <div v-for="(file, idx) in existingRateDocs" :key="file.id" class="flex items-center justify-between bg-muted/50 p-2 rounded-xl">
              <ULink :to="`${imageUrl}${file.url}`" target="_blank" class="flex items-center gap-2">
                <UIcon name="hugeicons:document-attachment" class="w-9 h-9 text-highlighted" />
                <UBadge :label="getMime(file)" color="neutral" size="sm" />
              </ULink>
              <UButton @click="existingRateDocs.splice(idx, 1)" icon="hugeicons:delete-02" size="sm" color="error" variant="soft" />
            </div>
          </div>
          <UploaderFiles 
            ref="rateUploaderRef" 
            label="Add Rate Confirmation" 
            description="Add more files (JPG, PNG, PDF) Max: 5Mb" />
        </div>

        <USeparator label="POD/BOL" />

        <div class="grid gap-4">
          <div v-if="existingPodDocs.length">
            <p class="font-medium text-gray-500 text-xs">
              Current POD/BOL Files:
            </p>
            <div v-for="(file, idx) in existingPodDocs" :key="file.id" class="flex items-center justify-between bg-muted/50 p-2 rounded-xl">
              <ULink :to="`${imageUrl}${file.url}`" target="_blank" class="flex items-center gap-2">
                <UIcon name="hugeicons:document-attachment" class="w-9 h-9 text-highlighted" />
                <UBadge :label="getMime(file)" color="neutral" size="sm" />
              </ULink>
              <UButton @click="existingPodDocs.splice(idx, 1)" icon="hugeicons:delete-02" size="xs" color="error" variant="ghost" />
            </div>
          </div>
          <UploaderFiles 
            ref="podUploaderRef" 
            label="Upload POD / BOL Documents" 
            description="Forces load status to 'Unloaded'"
            @change="handlePodFilesChange" />
        </div>

        <!-- Раздел факторинга доступен только для Бухгалтера и Администратора -->
        <template v-if="permissions.isAdmin || permissions.isAccounting">
          <USeparator label="Factoring (Accounting only)" />
          
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Factoring Status" name="factoring_status" class="col-span-2">
              <USelect 
                v-model="state.factoring_status" 
                :items="factoringStatusOptions" 
                class="max-w-xs min-w-50" />
            </UFormField>
            <UFormField label="Invoice Amount" name="factoring.invoice_amount">
              <UInput v-model.number="state.factoring.invoice_amount" type="number" step="0.01">
                <template #trailing><div class="input_trailing">$</div></template>
              </UInput>
            </UFormField>
            <UFormField label="Funding Date" name="factoring.funding_date">
              <UInput v-model="state.factoring.funding_date" type="date" class="w-full" />
            </UFormField>
            <UFormField label="Advance Received" name="factoring.advance_received">
              <UInput v-model.number="state.factoring.advance_received" type="number" step="0.01" class="w-full">
                <template #trailing><div class="input_trailing">$</div></template>
              </UInput>
            </UFormField>
            <UFormField label="Factoring Fee" name="factoring.factoring_fee">
              <UInput v-model.number="state.factoring.factoring_fee" type="number" step="0.01" class="w-full">
                <template #trailing><div class="input_trailing">$</div></template>
              </UInput>
            </UFormField>
            <UFormField label="Remaining Balance" name="factoring.remaining_balance">
              <UInput v-model.number="state.factoring.remaining_balance" type="number" step="0.01">
                <template #trailing><div class="input_trailing">$</div></template>
              </UInput>
            </UFormField>
            <UFormField label="Payment Date" name="factoring.payment_date">
              <UInput v-model="state.factoring.payment_date" type="date" class="w-full" />
            </UFormField>
          </div>
        </template>

        <USeparator label="Notes" />

        <UFormField name="notes">
          <UTextarea v-model="state.notes" class="w-full" />
        </UFormField>

        <div class="flex justify-between items-center pt-4">
          <div>
            <UButton 
              v-if="permissions.canDeleteLoads" 
              color="error" 
              variant="soft" 
              label="Delete Load" 
              :loading="deleteLoading" 
              @click="onDelete" />
          </div>
          <div class="flex gap-3">
            <UButton color="neutral" variant="ghost" label="Cancel" @click="open = false" />
            <UButton type="submit" color="primary" label="Save changes" :loading="loading" />
          </div>
        </div>
      </UForm>
    </template>
  </UModal>
</template>