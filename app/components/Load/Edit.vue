<!-- components/LoadEdit.vue -->
<script setup>
import { Time } from '@internationalized/date'
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
const { statesList, loadStatusOptions, factoringStatusOptions, imageUrl, getMime } = useConfig()

const parseTime = (timeStr) => {
  if (!timeStr) return null
  const parts = timeStr.split(':')
  const hour = parseInt(parts[0], 10) || 0
  const minute = parseInt(parts[1], 10) || 0
  const second = parts[2] ? parseInt(parts[2].split('.')[0], 10) : 0
  return new Time(hour, minute, second)
}

const state = reactive({
  load_number: '',
  drivers_rate: 0,
  original_rate: 0,
  tonu_amount: 0,
  pickup_date: '',
  pickup_time: null,
  delivery_date: '',
  delivery_time: null,
  status_load: 'not_started',
  category: 'active',
  driver: null,
  broker: '',
  shipper_address: { city: '', state: 'AL', full_address: '' },
  receiver_address: { city: '', state: 'AL', full_address: '' },
  miles: 0,
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

const pickupType = ref('Strict Appointment')
const deliveryType = ref('Strict Appointment')

const pickupTimeRange = shallowRef({
  start: new Time(12, 0, 0),
  end: new Time(14, 0, 0)
})
const deliveryTimeRange = shallowRef({
  start: new Time(12, 0, 0),
  end: new Time(14, 0, 0)
})

const loading = ref(false)
const deleteLoading = ref(false)

// Списки файлов
const rateUploaderRef = ref(null)
const podUploaderRef = ref(null)

const localRateFilesCount = ref(0)
const hasRate = computed(() => {
  return existingRateDocs.value.length > 0 || localRateFilesCount.value > 0
})
const localPodFilesCount = ref(0)
const hasPod = computed(() => {
  return existingPodDocs.value.length > 0 || localPodFilesCount.value > 0
})
// Логика блокировки полей Pickup
const isPickupDisabled = computed(() => { return hasPod.value })
// Логика блокировки полей Delivery (заблокированы, если нет Rate Conf ИЛИ нет POD)
const isDeliveryDisabled = computed(() => { return !hasRate.value || !hasPod.value })
// Обработчик изменения файлов Rate Confirmation
const handleRateFilesChange = (files) => {
  localRateFilesCount.value = files ? files.length : 0
}

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

// watch(() => props.load, (newVal) => {
//   if (newVal) {
//     Object.assign(state, {
//       load_number: newVal.load_number || '',
//       drivers_rate: newVal.drivers_rate || 0,
//       original_rate: newVal.original_rate || 0,
//       tonu_amount: newVal.tonu_amount || 0,
//       pickup_date: newVal.pickup_date ? newVal.pickup_date.split('T')[0] : '',
//       pickup_time: parseTime(newVal.pickup_time),
//       delivery_date: newVal.delivery_date ? newVal.delivery_date.split('T')[0] : '',
//       delivery_time: parseTime(newVal.delivery_time),
//       status_load: newVal.status_load || 'not_started',
//       category: newVal.category || 'active',
//       driver: newVal.driver?.documentId || null,
//       shipper_address: {
//         city: newVal.shipper_address?.city || '',
//         state: newVal.shipper_address?.state || 'AL',
//         full_address: newVal.shipper_address?.full_address || ''
//       },
//       receiver_address: {
//         city: newVal.receiver_address?.city || '',
//         state: newVal.receiver_address?.state || 'AL',
//         full_address: newVal.receiver_address?.full_address || ''
//       },
//       miles: newVal.miles || 0,
//       factoring_status: newVal.factoring_status || 'not_submitted',
//       factoring: {
//         invoice_amount: newVal.factoring?.invoice_amount || 0,
//         funding_date: newVal.factoring?.funding_date ? newVal.factoring.funding_date.split('T')[0] : '',
//         advance_received: newVal.factoring?.advance_received || 0,
//         factoring_fee: newVal.factoring?.factoring_fee || 0,
//         remaining_balance: newVal.factoring?.remaining_balance || 0,
//         payment_date: newVal.factoring?.payment_date ? newVal.factoring.payment_date.split('T')[0] : ''
//       }
//     })

//     existingRateDocs.value = newVal.doc_rate_confirmation || []
//     existingPodDocs.value = newVal.doc_pod_bol || []
    
//     if (newVal.broker) {
//       brokersList.value = [{
//         label: newVal.broker.name,
//         value: newVal.broker.documentId
//       }]
//       selectedBrokerModel.value = newVal.broker.documentId
//       state.broker = newVal.broker.documentId
//     } else {
//       selectedBrokerModel.value = null
//       state.broker = ''
//     }
    
//     rateUploaderRef.value?.clear()
//     podUploaderRef.value?.clear()
//     localRateFilesCount.value = 0
//     localPodFilesCount.value = 0
//   }
// }, { immediate: true })

watch(() => props.load, (newVal) => {
  if (newVal) {
    Object.assign(state, {
      load_number: newVal.load_number || '',
      drivers_rate: newVal.drivers_rate || 0,
      original_rate: newVal.original_rate || 0,
      tonu_amount: newVal.tonu_amount || 0,
      pickup_date: newVal.pickup_date ? newVal.pickup_date.split('T')[0] : '',
      pickup_time: parseTime(newVal.pickup_time),
      delivery_date: newVal.delivery_date ? newVal.delivery_date.split('T')[0] : '',
      delivery_time: parseTime(newVal.delivery_time),
      status_load: newVal.status_load || 'not_started',
      category: newVal.category || 'active',
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
      miles: newVal.miles || 0,
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

    // Инициализация типов времени на основе наличия *_time_end
    if (newVal.pickup_time_end) {
      pickupType.value = 'FCFS'
      pickupTimeRange.value = {
        start: parseTime(newVal.pickup_time) || new Time(12, 0, 0),
        end: parseTime(newVal.pickup_time_end) || new Time(14, 0, 0)
      }
    } else {
      pickupType.value = 'Strict Appointment'
    }

    if (newVal.delivery_time_end) {
      deliveryType.value = 'FCFS'
      deliveryTimeRange.value = {
        start: parseTime(newVal.delivery_time) || new Time(12, 0, 0),
        end: parseTime(newVal.delivery_time_end) || new Time(14, 0, 0)
      }
    } else {
      deliveryType.value = 'Strict Appointment'
    }

    existingRateDocs.value = newVal.doc_rate_confirmation || []
    existingPodDocs.value = newVal.doc_pod_bol || []
    
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
    localRateFilesCount.value = 0
    localPodFilesCount.value = 0
  }
}, { immediate: true })

// Автоматический перевод в unloaded и completed при добавлении документов POD/BOL
const handlePodFilesChange = (files) => {
  localPodFilesCount.value = files ? files.length : 0
  
  if (files && files.length > 0) {
    state.status_load = 'unloaded'
    state.category = 'completed'
    
    if (!state.delivery_date) {
      state.delivery_date = new Date().toISOString().split('T')[0]
    }
    if (!state.delivery_time) {
      const now = new Date()
      state.delivery_time = new Time(now.getHours(), now.getMinutes())
    }
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

// const onSubmit = async () => {
//   if (!props.load?.documentId) return

//   // Валидация: если выбран TONU, сумма компенсации должна быть строго больше 0
//   if (state.status_load === 'tonu' && (!state.tonu_amount || state.tonu_amount <= 0)) {
//     toast.add({
//       title: 'Validation Error',
//       description: 'TONU compensation amount is required and must be greater than 0',
//       color: 'error'
//     })
//     return
//   }

//   loading.value = true
//   try {
//     // 1. Проверяем дубликат
//     const duplicateCheck = await client('/loads', {
//       params: { filters: { load_number: { $eq: state.load_number } } }
//     })
//     const isDuplicate = duplicateCheck.data.some(l => l.documentId !== props.load.documentId)
//     if (isDuplicate) {
//       throw new Error(`Load number "${state.load_number}" is already used.`)
//     }

//     // 2. Вызываем загрузку файлов через методы дочерних компонентов
//     let finalRateIds = existingRateDocs.value.map(d => d.id)
//     if (rateUploaderRef.value?.hasFiles) {
//       const newRateIds = await rateUploaderRef.value.uploadFiles()
//       finalRateIds = [...finalRateIds, ...newRateIds]
//     }

//     let finalPodIds = existingPodDocs.value.map(d => d.id)
//     if (podUploaderRef.value?.hasFiles) {
//       const newPodIds = await podUploaderRef.value.uploadFiles()
//       finalPodIds = [...finalPodIds, ...newPodIds]
//     }

//     // Если статус TONU — обнуляем рейты и мили, фиксируем дату "доставки" на сегодня
//     if (state.status_load === 'tonu') {
//       state.drivers_rate = 0
//       state.original_rate = 0
//       state.miles = 0
//       state.category = 'completed'
//       if (!state.delivery_date) {
//         state.delivery_date = new Date().toISOString().split('T')[0]
//       }
//     }

//     // Очистка дат: заменяем "" на null
//     const cleanDate = (dateStr) => {
//       return dateStr && dateStr.trim() !== '' ? dateStr : null;
//     }
//     const formatTime = (timeObj) => {
//       if (!timeObj) return null
//       return `${timeObj.toString()}.000`
//     }

//     // 3. Формируем payload с очищенными датами
//     const payload = {
//       data: {
//         ...state,
//         pickup_date: cleanDate(state.pickup_date),
//         delivery_date: cleanDate(state.delivery_date),
//         pickup_time: formatTime(state.pickup_time),
//         delivery_time: formatTime(state.delivery_time),
//         doc_rate_confirmation: finalRateIds,
//         doc_pod_bol: finalPodIds,
//         category: state.status_load === 'cancelled' || state.status_load === 'unloaded' || state.status_load === 'tonu' ? 'completed' : state.category
//       }
//     }

//     // Очищаем даты внутри вложенного объекта факторинга
//     if (payload.data.factoring) {
//       payload.data.factoring = {
//         ...state.factoring,
//         funding_date: cleanDate(state.factoring.funding_date),
//         payment_date: cleanDate(state.factoring.payment_date)
//       }
//     }

//     if (!permissions.value.isAdmin && !permissions.value.isAccounting) {
//       delete payload.data.factoring
//       delete payload.data.factoring_status
//     }

//     await client(`/loads/${props.load.documentId}`, {
//       method: 'PUT',
//       body: payload
//     })

//     toast.add({
//       title: 'Success',
//       description: 'Load updated successfully!',
//       color: 'success'
//     })

//     emit('success')
//     open.value = false
//     rateUploaderRef.value?.clear()
//     podUploaderRef.value?.clear()
//   } catch (error) {
//     console.error(error)
//     toast.add({
//       title: 'Error',
//       description: error?.message || 'Failed to update load',
//       color: 'error'
//     })
//   } finally {
//     loading.value = false
//   }
// }
// === Замените текущий onSubmit на этот ===
const onSubmit = async () => {
  if (!props.load?.documentId) return

  // Валидация
  const errors = []
  if (!state.load_number?.trim()) errors.push("Load Number is required.")
  if (!state.broker) errors.push("Broker is required.")
  
  if (state.status_load === 'tonu') {
    if (!state.tonu_amount || state.tonu_amount <= 0) {
      errors.push("TONU compensation amount is required and must be greater than 0.")
    }
  } else {
    if (state.drivers_rate === undefined || state.drivers_rate === null || state.drivers_rate === '') {
      errors.push("Driver's Rate is required.")
    }
    if (state.original_rate === undefined || state.original_rate === null || state.original_rate === '') {
      errors.push("Original Rate is required.")
    }
  }

  if (!state.shipper_address?.city?.trim()) {
    errors.push("Shipper City is required.")
  }
  if (!state.pickup_date) {
    errors.push("Pickup Date is required.")
  }
  
  if (pickupType.value === 'FCFS') {
    if (!pickupTimeRange.value?.start || !pickupTimeRange.value?.end) {
      errors.push("Pickup Time Range is required for FCFS.")
    }
  } else {
    if (!state.pickup_time) {
      errors.push("Pickup Time is required.")
    }
  }

  if (!state.receiver_address?.city?.trim()) {
    errors.push("Receiver City is required.")
  }
  if (state.miles === undefined || state.miles === null || state.miles === '') {
    errors.push("Total Miles is required.")
  }

  if (errors.length > 0) {
    errors.forEach(err => {
      toast.add({
        title: 'Validation Error',
        description: err,
        color: 'error'
      })
    })
    return
  }

  loading.value = true
  try {
    const duplicateCheck = await client('/loads', {
      params: { filters: { load_number: { $eq: state.load_number } } }
    })
    const isDuplicate = duplicateCheck.data.some(l => l.documentId !== props.load.documentId)
    if (isDuplicate) {
      throw new Error(`Load number "${state.load_number}" is already used.`)
    }

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

    if (state.status_load === 'tonu') {
      state.drivers_rate = 0
      state.original_rate = 0
      state.miles = 0
      state.category = 'completed'
      if (!state.delivery_date) {
        state.delivery_date = new Date().toISOString().split('T')[0]
      }
    }

    // Подготовка времени в зависимости от типа
    const pickup_time_val = pickupType.value === 'FCFS' && pickupTimeRange.value?.start
      ? `${pickupTimeRange.value.start.toString()}.000`
      : (state.pickup_time ? `${state.pickup_time.toString()}.000` : null)

    const pickup_time_end_val = pickupType.value === 'FCFS' && pickupTimeRange.value?.end
      ? `${pickupTimeRange.value.end.toString()}.000`
      : null

    const delivery_time_val = deliveryType.value === 'FCFS' && deliveryTimeRange.value?.start
      ? `${deliveryTimeRange.value.start.toString()}.000`
      : (state.delivery_time ? `${state.delivery_time.toString()}.000` : null)

    const delivery_time_end_val = deliveryType.value === 'FCFS' && deliveryTimeRange.value?.end
      ? `${deliveryTimeRange.value.end.toString()}.000`
      : null

    const cleanDate = (dateStr) => {
      return dateStr && dateStr.trim() !== '' ? dateStr : null;
    }

    const payload = {
      data: {
        ...state,
        pickup_date: cleanDate(state.pickup_date),
        delivery_date: cleanDate(state.delivery_date),
        pickup_time: pickup_time_val,
        pickup_time_end: pickup_time_end_val,
        delivery_time: delivery_time_val,
        delivery_time_end: delivery_time_end_val,
        doc_rate_confirmation: finalRateIds,
        doc_pod_bol: finalPodIds,
        category: state.status_load === 'cancelled' || state.status_load === 'unloaded' || state.status_load === 'tonu' ? 'completed' : state.category
      }
    }

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
          <!-- TONU Amount if status "tonu" -->
          <UFormField v-if="state.status_load === 'tonu'" label="TONU Amount" name="tonu_amount" required class="col-span-2">
            <UInput v-model.number="state.tonu_amount" type="number" required class="w-full">
              <template #trailing><div class="input_trailing">$</div></template>
            </UInput>
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

          <!-- Поля блокируются, если статус равен "tonu" -->
          <UFormField label="Driver's Rate" name="drivers_rate" required>
            <UInput v-model.number="state.drivers_rate" type="number" required :disabled="state.status_load === 'tonu'" class="w-full">
              <template #trailing><div class="input_trailing">$</div></template>
            </UInput>
          </UFormField>
          <UFormField label="Original Rate" name="original_rate" required>
            <UInput v-model.number="state.original_rate" type="number" required :disabled="state.status_load === 'tonu'" class="w-full">
              <template #trailing><div class="input_trailing">$</div></template>
            </UInput>
          </UFormField>
        </div>

        <!-- <USeparator label="Route Info" /> -->

        <!-- <div class="grid grid-cols-[1fr_5fr_2fr] gap-4">
          <div class="relative row-span-2 flex">
            <USeparator orientation="vertical" type="dashed" icon="hugeicons:delivery-box-01" 
              :ui="{ icon: `size-8 ${isPickupDisabled ? 'text-gray-500' : 'text-(--ui-primary)' }` }" />
          </div>
          <UFormField label="Shipper City/Sate" name="shipper_address.city" required class="col-span-2">
            <UFieldGroup>
              <UInput v-model="state.shipper_address.city" placeholder="City" required class="w-50" />
              <USelectMenu v-model="state.shipper_address.state" :items="statesList" class="w-20" />
            </UFieldGroup>
          </UFormField>
          <UFormField label="Pickup Date" name="pickup_date" required>
            <UInput v-model="state.pickup_date" 
              :disabled="isPickupDisabled" 
              type="date" 
              class="w-full" 
              required />
          </UFormField>
          <UFormField label="Pickup Time" name="pickup_time" required>
            <UInputTime v-model="state.pickup_time" :hour-cycle="24" :disabled="isPickupDisabled" />
          </UFormField>

          <div class="row-span-2 flex">
            <USeparator orientation="vertical" type="dashed" icon="hugeicons:dropbox" 
              :ui="{ icon: `size-8 ${isDeliveryDisabled ? 'text-gray-500' : 'text-(--ui-primary)' }` }" />
          </div>
          <UFormField label="Receiver City/Sate" name="receiver_address.city" required class="col-span-2">
            <UFieldGroup>
              <UInput v-model="state.receiver_address.city" placeholder="City" required class="w-50" />
              <USelectMenu v-model="state.receiver_address.state" :items="statesList" class="w-20" />
            </UFieldGroup>
          </UFormField>
          <UFormField label="Delivery Date" name="delivery_date">
            <UInput v-model="state.delivery_date" 
              :disabled="isDeliveryDisabled" 
              type="date" 
              class="w-full" />
          </UFormField>
          <UFormField label="Delivery Time" name="delivery_time">
            <UInputTime v-model="state.delivery_time" :hour-cycle="24" :disabled="isDeliveryDisabled" />
          </UFormField>

          <UFormField label="Total Miles" name="miles" required class="col-span-3">
            <UInput v-model.number="state.miles" type="number" required :ui="{
                base: 'pl-12 pr-2',
                leading: 'pointer-events-none'
              }">
              <template #leading><p class="text-sm text-muted">Miles</p></template>
            </UInput>
          </UFormField>
        </div> -->

        <USeparator label="Shipper (Pickup)" />

        <div class="grid gap-4">
          <UFormField label="Shipper City/Sate" name="shipper_address.city" required class="w-full">
            <UFieldGroup>
              <UInput v-model="state.shipper_address.city" placeholder="City" required class="w-50" />
              <USelectMenu v-model="state.shipper_address.state" :items="statesList" class="w-20" />
            </UFieldGroup>
          </UFormField>
          <UFormField label="Full Address" name="shipper_address.full_address">
            <UInput v-model="state.shipper_address.full_address" class="w-full" />
          </UFormField>
          <UFormField label="Pickup Type">
            <URadioGroup v-model="pickupType" :items="['Strict Appointment', 'FCFS']" />
          </UFormField>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Pickup Date" name="pickup_date" required>
              <UInput v-model="state.pickup_date" type="date" class="w-full" required />
            </UFormField>
            <UFormField :label="pickupType === 'FCFS' ? 'Pickup Time Range' : 'Pickup Time'" name="pickup_time" required class="w-full">
              <UInputTime v-if="pickupType === 'FCFS'" range v-model="pickupTimeRange" :hour-cycle="24" />
              <UInputTime v-else v-model="state.pickup_time" :hour-cycle="24" />
            </UFormField>
          </div>
        </div>

        <USeparator label="Receiver (Delivery)" />

        <div class="grid gap-4">
          <UFormField label="Receiver City/Sate" name="receiver_address.city" required class="w-full">
            <UFieldGroup>
              <UInput v-model="state.receiver_address.city" placeholder="City" required class="w-50" />
              <USelectMenu v-model="state.receiver_address.state" :items="statesList" class="w-20" />
            </UFieldGroup>
          </UFormField>
          <UFormField label="Full Address" name="receiver_address.full_address">
            <UInput v-model="state.receiver_address.full_address" class="w-full" />
          </UFormField>
          <UFormField label="Delivery Type">
            <URadioGroup v-model="deliveryType" :items="['Strict Appointment', 'FCFS']" />
          </UFormField>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Delivery Date" name="delivery_date">
              <UInput v-model="state.delivery_date" type="date" class="w-full" />
            </UFormField>
            <UFormField :label="deliveryType === 'FCFS' ? 'Delivery Time Range' : 'Delivery Time'" name="delivery_time" class="w-full">
              <UInputTime v-if="deliveryType === 'FCFS'" range v-model="deliveryTimeRange" :hour-cycle="24" />
              <UInputTime v-else v-model="state.delivery_time" :hour-cycle="24" />
            </UFormField>
          </div>

          <UFormField label="Total Miles" name="miles" required>
            <UInput v-model.number="state.miles" type="number" required :ui="{
                base: 'pl-12 pr-2',
                leading: 'pointer-events-none'
              }">
              <template #leading><p class="text-sm text-muted">Miles</p></template>
            </UInput>
          </UFormField>
        </div>

        <USeparator label="Rate Confirmation" />

        <div class="grid gap-4">
          <div v-if="existingRateDocs.length" class="flex flex-col gap-1">
            <p class="text-gray-500 text-xs">
              Current Rate Conf Files:
            </p>
            <div v-for="(file, idx) in existingRateDocs" :key="file.id" class="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
              <ULink :to="`${imageUrl}${file.url}`" target="_blank" class="flex items-center gap-2">
                <UIcon name="hugeicons:document-attachment" class="w-9 h-9 text-highlighted" />
                <UBadge :label="getMime(file)" color="neutral" size="sm" />
                <p class="text-xs font-semibold text-highlighted truncate group-hover:text-primary transition">
                  {{ file.name || file.url.split('/').pop() }}
                </p>
              </ULink>
              <UButton @click="existingRateDocs.splice(idx, 1)" icon="hugeicons:delete-02" size="sm" color="error" variant="soft" />
            </div>
          </div>
          <UploaderFiles 
            ref="rateUploaderRef" 
            label="Add Rate Confirmation" 
            description="Add more files (JPG, PNG, PDF) Max: 5Mb" 
            @change="handleRateFilesChange" />
        </div>

        <USeparator label="POD / BOL" />

        <div class="grid gap-4">
          <div v-if="existingPodDocs.length">
            <p class="text-gray-500 text-xs mb-1">
              Current POD/BOL Files:
            </p>
            <div v-for="(file, idx) in existingPodDocs" :key="file.id" class="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
              <ULink :to="`${imageUrl}${file.url}`" target="_blank" class="flex items-center gap-2">
                <UIcon name="hugeicons:document-attachment" class="w-9 h-9 text-highlighted" />
                <UBadge :label="getMime(file)" color="neutral" size="sm" />
                <p class="text-xs font-semibold text-highlighted truncate group-hover:text-primary transition">
                  {{ file.name || file.url.split('/').pop() }}
                </p>
              </ULink>
              <UButton @click="existingPodDocs.splice(idx, 1)" icon="hugeicons:delete-02" size="xs" color="error" variant="soft" />
            </div>
          </div>
          <UploaderFiles 
            ref="podUploaderRef" 
            label="Upload POD / BOL" 
            description="Forces load status to 'Unloaded'"
            @change="handlePodFilesChange" />
        </div>

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