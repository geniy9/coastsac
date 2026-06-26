<!-- components/LoadAdd.vue -->
<script setup>
import { useDebounceFn } from '@vueuse/core'
const open = defineModel('open', { type: Boolean, default: false })
const emit = defineEmits(['success'])

const client = useStrapiClient()
const user = useStrapiUser()
const toast = useToast()
const { statesList } = useConfig()

const getRoundedTime = () => {
  const now = new Date()
  const minutes = now.getMinutes()
  const rounded = Math.round(minutes / 15) * 15
  now.setMinutes(rounded)
  now.setSeconds(0)
  return now.toTimeString().split(' ')[0].substring(0, 5) // "HH:MM"
}

const state = reactive({
  load_number: '',
  pickup_date: new Date().toISOString().split('T')[0],
  pickup_time: getRoundedTime(),
  driver: null,
  broker: '',
  notes: '',
  shipper_address: { city: '', state: 'AL', full_address: '' },
  receiver_address: { city: '', state: 'AL', full_address: '' }
})
const rateUploaderRef = ref(null)
const loading = ref(false)

const driversList = ref([])
const brokersList = ref([])
const selectedBrokerModel = ref(null) // (documentId или новое имя)
const brokerSearchQuery = ref('')

watch(selectedBrokerModel, (newVal) => {
  state.broker = newVal || ''
})

const fetchDrivers = async () => {
  try {
    const res = await client('/drivers', { params: { pagination: { limit: 100 } } })
    driversList.value = res.data || []
  } catch (e) {
    console.error('Failed to load drivers:', e)
  }
}

// Асинхронный поиск с дебаунсом, преобразующий данные в формат { label, value }
const fetchBrokers = useDebounceFn(async (q) => {
  try {
    const filterParams = { pagination: { limit: 30 } }
    if (q) {
      filterParams.filters = { name: { $containsi: q } }
    }
    // ЗАМЕНЕНО: query -> params
    const res = await client('/brokers', { params: filterParams })
    
    // Преобразуем ответ к стандартному виду для корректной работы SelectMenu
    brokersList.value = (res.data || []).map(b => ({
      label: b.name,
      value: b.documentId
    }))
  } catch (e) {
    console.error('Failed to load brokers:', e)
  }
}, 300)

// Добавление нового брокера в локальный список и его выбор
const handleBrokerCreate = (name) => {
  const newItem = { label: name, value: name }
  brokersList.value.push(newItem)
  selectedBrokerModel.value = name // v-model связывается с новым именем (строкой)
}

onMounted(async () => {
  await fetchDrivers()
  await fetchBrokers('')
})

const driverOptions = computed(() => {
  return driversList.value.map(d => ({
    value: d.documentId,
    label: `${d.first_name || ''} ${d.last_name || ''}`.trim() || `Driver #${d.id}`
  }))
})

// Проверка дублей Load Number
const isLoadNumberDuplicate = async (loadNumber) => {
  // ЗАМЕНЕНО: query -> params
  const res = await client('/loads', {
    params: {
      filters: { load_number: { $eq: loadNumber } }
    }
  })
  return res.data && res.data.length > 0
}

// Логика проверки активного груза у водителя
const checkDriverHasActiveLoad = async (driverDocId) => {
  // ЗАМЕНЕНО: query -> params
  const res = await client('/loads', {
    params: {
      filters: {
        driver: { documentId: { $eq: driverDocId } },
        category: { $eq: 'active' }
      }
    }
  })
  return res.data && res.data.length > 0
}

const onSubmit = async () => {
  if (!rateUploaderRef.value?.hasFiles) {
    toast.add({
      title: 'Validation Error',
      description: 'Rate Confirmation document is required!',
      color: 'error'
    })
    return
  }

  loading.value = true
  try {
    // 1. Проверяем дубликат номера
    const isDuplicate = await isLoadNumberDuplicate(state.load_number)
    if (isDuplicate) {
      throw new Error(`Load with number "${state.load_number}" already exists.`)
    }

    // 2. Логика назначения категорий
    let category = 'active'
    let status_load = 'in_transit'

    if (state.driver) {
      const hasActive = await checkDriverHasActiveLoad(state.driver)
      if (hasActive) {
        category = 'next'
        status_load = 'not_started'
        toast.add({
          title: 'Driver Busy',
          description: 'This driver already has an active load. This load is set to scheduled (Next).',
          color: 'warning'
        })
      }
    }

    // 3. Загружаем файлы на сервер через метод компонента и получаем их IDs
    const fileIds = await rateUploaderRef.value.uploadFiles()

    // 4. Формируем тело запроса и сохраняем груз
    const payload = {
      data: {
        load_number: state.load_number,
        pickup_date: state.pickup_date,
        // pickup_time: state.pickup_time,
        pickup_time: state.pickup_time ? `${state.pickup_time}:00.000` : null, 
        notes: state.notes,
        shipper_address: state.shipper_address,
        receiver_address: state.receiver_address,
        driver: state.driver || null,
        broker: state.broker || null,
        dispatcher: user.value?.id || null,
        doc_rate_confirmation: fileIds, // Передаем полученные ID
        category,
        status_load
      }
    }

    await client('/loads', {
      method: 'POST',
      body: payload
    })

    toast.add({
      title: 'Success',
      description: "Load created successfully!",
      color: 'success'
    })

    emit('success')
    open.value = false

    // Сброс состояния и очистка загрузчика файлов
    Object.assign(state, {
      load_number: '',
      pickup_date: new Date().toISOString().split('T')[0],
      pickup_time: getRoundedTime(),
      driver: null,
      broker: '',
      notes: '',
      shipper_address: { city: '', state: 'AL', full_address: '' },
      receiver_address: { city: '', state: 'AL', full_address: '' }
    })
    rateUploaderRef.value?.clear()
    selectedBrokerModel.value = null
  } catch (error) {
    console.error(error)
    toast.add({
      title: 'Error',
      description: error?.message || 'Failed to create load',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>
<template>
  <UModal v-model:open="open">
    <template #content>
      <UForm :state="state" @submit="onSubmit" class="grid gap-6 p-6 overflow-y-auto">
        
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-highlighted">
            Add a new load
          </h3>
          <UButton icon="i-lucide-x" color="neutral" variant="ghost" @click="open = false" />
        </div>

        <USeparator label="General Info" />

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Load Number" name="load_number" required>
            <UInput v-model="state.load_number" required placeholder="MC-XXXXXX" class="w-full" />
          </UFormField>
          <UFormField label="Dispatcher">
            <UInput 
              :model-value="user?.name || user?.username || 'Loading...'" 
              disabled 
              icon="i-lucide-user-cog"
              class="w-full" />
          </UFormField>
          <UFormField label="Driver">
            <USelect v-model="state.driver" :items="driverOptions" class="w-full" placeholder="Select a Driver" />
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

        <USeparator label="Documents" />

        <div>
          <UploaderFiles 
            ref="rateUploaderRef" 
            label="Rate Confirmation (PDF or Images)" 
            description="PDF, JPG, PNG format (max. 5MB)"
            required />
        </div>

        <USeparator label="Shipper (Pickup)" />

        <div class="grid gap-4">
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="City" name="shipper_address.city" required>
              <UInput v-model="state.shipper_address.city" required class="w-full" />
            </UFormField>
            <UFormField label="State" name="shipper_address.state" required>
              <USelect v-model="state.shipper_address.state" :items="statesList" required class="w-full" />
            </UFormField>
          </div>
          <UFormField label="Full Address" name="shipper_address.full_address">
            <UInput v-model="state.shipper_address.full_address" class="w-full" />
          </UFormField>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Pickup Date" name="pickup_date" required>
            <UInput v-model="state.pickup_date" type="date" required class="w-full" />
          </UFormField>
          <UFormField label="Pickup Time" name="pickup_time" required>
            <UInput v-model="state.pickup_time" type="time" required class="w-full" />
          </UFormField>
        </div>

        <USeparator label="Receiver (Delivery)" />

        <div class="grid gap-4">
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="City" name="receiver_address.city" required>
              <UInput v-model="state.receiver_address.city" required class="w-full" />
            </UFormField>
            <UFormField label="State" name="receiver_address.state" required>
              <USelect v-model="state.receiver_address.state" :items="statesList" required class="w-full" />
            </UFormField>
          </div>
          <UFormField label="Full Address" name="receiver_address.full_address">
            <UInput v-model="state.receiver_address.full_address" class="w-full" />
          </UFormField>
        </div>

        <USeparator label="Notes" />

        <UFormField name="notes">
          <UTextarea v-model="state.notes" class="w-full" placeholder="Enter custom instructions or cargo notes..." />
        </UFormField>

        <div class="flex justify-end gap-3 pt-4">
          <UButton color="neutral" variant="ghost" label="Cancel" @click="open = false" />
          <UButton type="submit" color="primary" label="Create Load" :loading="loading" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>