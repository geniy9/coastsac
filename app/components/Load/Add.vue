<!-- components/LoadAdd.vue -->
<script setup>
import { Time } from '@internationalized/date'
import { useDebounceFn } from '@vueuse/core'
const open = defineModel('open', { type: Boolean, default: false })
const emit = defineEmits(['success'])

const client = useStrapiClient()
const user = useStrapiUser()
const toast = useToast()
const { statesList } = useConfig()

const state = reactive({
  load_number: '',
  pickup_number: '',
  delivery_number: '',
  drivers_rate: 0,
  original_rate: 0,
  pickup_date: new Date().toISOString().split('T')[0],
  pickup_time: new Time(12, 0, 0),
  delivery_date: new Date().toISOString().split('T')[0],
  delivery_time: new Time(12, 0, 0),
  driver: null,
  broker: '',
  shipper_address: [{ city: '', state: 'AL', full_address: '' }],
  receiver_address: [{ city: '', state: 'AL', full_address: '' }],
  // shipper_address: { city: '', state: 'AL', full_address: '' },
  // receiver_address: { city: '', state: 'AL', full_address: '' },
  miles: 0,
  weight: 0,
})
const rateUploaderRef = ref(null)
const loading = ref(false)

const driversList = ref([])
const brokersList = ref([])
const selectedBrokerModel = ref(null) // (documentId или новое имя)
const brokerSearchQuery = ref('')

const citiesList = ref([])
const shipperCitySearchQuery = ref('')
const receiverCitySearchQuery = ref('')

const pickupType = ref('Strict Appointment') // 'Strict Appointment' | 'FCFS'
const deliveryType = ref('Strict Appointment') // 'Strict Appointment' | 'FCFS'
const pickupTimeRange = shallowRef({
  start: new Time(12, 0, 0),
  end: new Time(14, 0, 0)
})
const deliveryTimeRange = shallowRef({
  start: new Time(12, 0, 0),
  end: new Time(14, 0, 0)
})

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
    const res = await client('/brokers', { params: filterParams })
    
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

// Асинхронный поиск городов с дебаунсом
const fetchCities = useDebounceFn(async (q) => {
  try {
    const filterParams = { pagination: { limit: 30 } }
    if (q) {
      filterParams.filters = { name: { $containsi: q } }
    }
    const res = await client('/cities', { params: filterParams })
    
    citiesList.value = (res.data || []).map(c => ({
      label: c.name,
      value: c.name // В качестве значения используем имя города, т.к. в схеме Load адрес хранит строку
    }))
  } catch (e) {
    console.error('Failed to load cities:', e)
  }
}, 300)

// Методы для динамического добавления/удаления дополнительных адресов
const addShipperAddress = () => state.shipper_address.push({ city: '', state: 'AL', full_address: '' })
const removeShipperAddress = (idx) => state.shipper_address.splice(idx, 1)

const addReceiverAddress = () => state.receiver_address.push({ city: '', state: 'AL', full_address: '' })
const removeReceiverAddress = (idx) => state.receiver_address.splice(idx, 1)

// Обновленный метод создания нового города с учетом индекса в массиве
const handleCityCreate = (name, type, index) => {
  const newItem = { label: name, value: name }
  if (!citiesList.value.some(c => c.value === name)) {
    citiesList.value.push(newItem)
  }
  if (type === 'shipper') {
    state.shipper_address[index].city = name
  } else if (type === 'receiver') {
    state.receiver_address[index].city = name
  }
}
// Добавление нового города в локальный список
// const handleCityCreate = (name, type) => {
//   const newItem = { label: name, value: name }
//   if (!citiesList.value.some(c => c.value === name)) {
//     citiesList.value.push(newItem)
//   }
//   if (type === 'shipper') {
//     state.shipper_address.city = name
//   } else if (type === 'receiver') {
//     state.receiver_address.city = name
//   }
// }

onMounted(async () => {
  await fetchDrivers()
  await fetchBrokers('')
  await fetchCities('')
})

const driverOptions = computed(() => {
  return driversList.value.map(d => ({
    value: d.documentId,
    label: `${d.first_name || ''} ${d.last_name || ''}`.trim() || `Driver #${d.id}`
  }))
})

// Проверка дублей Load Number
const isLoadNumberDuplicate = async (loadNumber) => {
  const res = await client('/loads', {
    params: {
      filters: { load_number: { $eq: loadNumber } }
    }
  })
  return res.data && res.data.length > 0
}

// Логика проверки активного груза у водителя
const checkDriverHasActiveLoad = async (driverDocId) => {
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
  const errors = []
  
  if (!state.load_number?.trim()) {
    errors.push("Load Number is required.")
  }
  if (!state.broker) {
    errors.push("Broker is required.")
  }
  if (state.drivers_rate === undefined || state.drivers_rate === null || state.drivers_rate === '') {
    errors.push("Driver's Rate is required.")
  }
  if (state.original_rate === undefined || state.original_rate === null || state.original_rate === '') {
    errors.push("Original Rate is required.")
  }
  if (!rateUploaderRef.value?.hasFiles) {
    errors.push("Rate Confirmation document is required.")
  }
  state.shipper_address.forEach((addr, idx) => {
    if (!addr.city?.trim()) {
      errors.push(`Shipper City #${idx + 1} is required.`)
    }
  })
  state.receiver_address.forEach((addr, idx) => {
    if (!addr.city?.trim()) {
      errors.push(`Receiver City #${idx + 1} is required.`)
    }
  })
  // if (!state.shipper_address?.city?.trim()) {
  //   errors.push("Shipper City is required.")
  // }
  // if (!state.receiver_address?.city?.trim()) {
  //   errors.push("Receiver City is required.")
  // }
  if (!state.pickup_date) {
    errors.push("Pickup Date is required.")
  }
  
  // Проверка Pickup Time в зависимости от режима (FCFS / Strict)
  if (pickupType.value === 'FCFS') {
    if (!pickupTimeRange.value?.start || !pickupTimeRange.value?.end) {
      errors.push("Pickup Time Range is required for FCFS.")
    }
  } else {
    if (!state.pickup_time) {
      errors.push("Pickup Time is required.")
    }
  }

  
  if (state.miles === undefined || state.miles === null || state.miles === '') {
    errors.push("Total Miles is required.")
  }

  // Если есть ошибки, прерываем выполнение и показываем тостеры
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
    const isDuplicate = await isLoadNumberDuplicate(state.load_number)
    if (isDuplicate) {
      throw new Error(`Load with number "${state.load_number}" already exists.`)
    }
    // NEW LOAD: active and in_transit
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

    // Загружаем файлы на сервер и получаем их IDs
    const fileIds = await rateUploaderRef.value.uploadFiles()

    // Форматируем время с учетом FCFS или Strict Appointment
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

    const payload = {
      data: {
        load_number: state.load_number,
        pickup_number: state.pickup_number,
        delivery_number: state.delivery_number,
        drivers_rate: state.drivers_rate,
        original_rate: state.original_rate,
        pickup_date: state.pickup_date,
        pickup_time: pickup_time_val,
        pickup_time_end: pickup_time_end_val,
        delivery_date: state.delivery_date || null,
        delivery_time: delivery_time_val,
        delivery_time_end: delivery_time_end_val,
        shipper_address: state.shipper_address,
        receiver_address: state.receiver_address,
        miles: state.miles,
        weight: state.weight,
        driver: state.driver || null,
        broker: state.broker || null,
        dispatcher: user.value?.id || null,
        doc_rate_confirmation: fileIds,
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

    Object.assign(state, {
      load_number: '',
      pickup_number: '',
      delivery_number: '',
      drivers_rate: 0,
      original_rate: 0,
      pickup_date: new Date().toISOString().split('T')[0],
      pickup_time: new Time(12, 0, 0),
      delivery_date: new Date().toISOString().split('T')[0],
      delivery_time: new Time(12, 0, 0),
      driver: null,
      broker: '',
      shipper_address: [{ city: '', state: 'AL', full_address: '' }],
      receiver_address: [{ city: '', state: 'AL', full_address: '' }],
      // shipper_address: { city: '', state: 'AL', full_address: '' },
      // receiver_address: { city: '', state: 'AL', full_address: '' },
      miles: 0,
      weight: 0
    })
    rateUploaderRef.value?.clear()
    selectedBrokerModel.value = null
    pickupType.value = 'Strict Appointment'
    deliveryType.value = 'Strict Appointment'
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
      <UForm :state="state" @submit="onSubmit" class="dashboard grid gap-6 p-6 overflow-y-auto">
        
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-highlighted">Add a new Load</h3>
          <UButton icon="hugeicons:cancel-01" color="neutral" variant="ghost" @click="open = false" />
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

          <UFormField label="Driver's Rate" name="drivers_rate" required>
            <UInput v-model.number="state.drivers_rate" type="number" required class="w-full">
              <template #trailing><div class="input_trailing">$</div></template>
            </UInput>
          </UFormField>
          <UFormField label="Original Rate" name="original_rate" required>
            <UInput v-model.number="state.original_rate" type="number" required class="w-full">
              <template #trailing><div class="input_trailing">$</div></template>
            </UInput>
          </UFormField>
          <UFormField label="Pickup Number" name="pickup_number" class="col-span-2">
            <UInput v-model="state.pickup_number" placeholder="SO-XXXXXX" class="w-full" />
          </UFormField>
          <UFormField label="Delivery Number" name="delivery_number" class="col-span-2">
            <UInput v-model="state.delivery_number" placeholder="XXXXXXXXX" class="w-full" />
          </UFormField>
        </div>

        <USeparator label="Documents" />

        <div>
          <UploaderFiles 
            ref="rateUploaderRef" 
            label="Rate Confirmation (PDF or Images)" 
            description="PDF, JPG, PNG format (max. 5MB)" required />
        </div>

        <USeparator label="Shipper (Pickup)" />

        <div class="grid gap-4">
          <div v-for="(addr, index) in state.shipper_address" :key="index" class="border border-default/40 p-4 rounded-lg relative grid gap-4">
            <div class="flex justify-between items-center">
              <span class="text-xs font-semibold text-gray-500">
                Stop #{{ index + 1 }}
              </span>
              <UButton v-if="state.shipper_address.length > 1" icon="hugeicons:delete-02" color="error" variant="ghost" size="xs" @click="removeShipperAddress(index)" />
            </div>
            <UFormField label="Shipper City/State" required>
              <UFieldGroup>
                <USelectMenu
                  v-model="addr.city"
                  v-model:search-term="shipperCitySearchQuery"
                  :items="citiesList"
                  value-key="value"
                  label-key="label"
                  ignore-filter
                  create-item="always"
                  class="w-50"
                  placeholder="City"
                  @update:search-term="fetchCities"
                  @create="(val) => handleCityCreate(val, 'shipper', index)" />
                <USelectMenu v-model="addr.state" :items="statesList" class="w-20" />
              </UFieldGroup>
            </UFormField>
            <UFormField label="Full Address">
              <UInput v-model="addr.full_address" class="w-full" />
            </UFormField>
          </div>
          <UButton icon="hugeicons:add-01" label="Add Shipper Stop" variant="soft" color="neutral" class="w-full" @click="addShipperAddress" />
        </div>
        <!-- <div class="grid gap-4">
          <UFormField label="Shipper City/Sate" name="shipper_address.city" required>
            <UFieldGroup>
              <USelectMenu
                v-model="state.shipper_address.city"
                v-model:search-term="shipperCitySearchQuery"
                :items="citiesList"
                value-key="value"
                label-key="label"
                ignore-filter
                create-item="always"
                class="w-50"
                placeholder="City"
                @update:search-term="fetchCities"
                @create="(val) => handleCityCreate(val, 'shipper')" />
              <USelectMenu v-model="state.shipper_address.state" :items="statesList" class="w-20" />
            </UFieldGroup>
          </UFormField>
          <UFormField label="Full Address" name="shipper_address.full_address">
            <UInput v-model="state.shipper_address.full_address" class="w-full" />
          </UFormField>
        </div> -->
        <UFormField label="Pickup Type">
          <URadioGroup v-model="pickupType" :items="['Strict Appointment', 'FCFS']" />
        </UFormField>
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Pickup Date" name="pickup_date" required>
            <UInput v-model="state.pickup_date" type="date" required class="w-full" />
          </UFormField>
          <UFormField :label="pickupType === 'FCFS' ? 'Pickup Time Range' : 'Pickup Time'" name="pickup_time" required>
            <UInputTime v-if="pickupType === 'FCFS'" range v-model="pickupTimeRange" :hour-cycle="24" />
            <UInputTime v-else v-model="state.pickup_time" :hour-cycle="24" />
          </UFormField>
        </div>

        <USeparator label="Receiver (Delivery)" />

        <div class="grid gap-4">
          <div v-for="(addr, index) in state.receiver_address" :key="index" class="border border-default/40 p-4 rounded-lg relative grid gap-4">
            <div class="flex justify-between items-center">
              <span class="text-xs font-semibold text-gray-500">Stop #{{ index + 1 }}</span>
              <UButton v-if="state.receiver_address.length > 1" icon="hugeicons:delete-02" color="error" variant="ghost" size="xs" @click="removeReceiverAddress(index)" />
            </div>
            <UFormField label="Receiver City/State" required>
              <UFieldGroup>
                <USelectMenu
                  v-model="addr.city"
                  v-model:search-term="receiverCitySearchQuery"
                  :items="citiesList"
                  value-key="value"
                  label-key="label"
                  ignore-filter
                  create-item="always"
                  class="w-50"
                  placeholder="City"
                  @update:search-term="fetchCities"
                  @create="(val) => handleCityCreate(val, 'receiver', index)" />
                <USelectMenu v-model="addr.state" :items="statesList" class="w-20" />
              </UFieldGroup>
            </UFormField>
            <UFormField label="Full Address">
              <UInput v-model="addr.full_address" class="w-full" />
            </UFormField>
          </div>
          <UButton icon="hugeicons:add-01" label="Add Receiver Stop" variant="soft" color="neutral" class="w-full" @click="addReceiverAddress" />
        </div>
        <!-- <div class="grid gap-4">
          <UFormField label="Receiver City/Sate" name="receiver_address.city" required>
            <UFieldGroup>
              <USelectMenu
                v-model="state.receiver_address.city"
                v-model:search-term="receiverCitySearchQuery"
                :items="citiesList"
                value-key="value"
                label-key="label"
                ignore-filter
                create-item="always"
                class="w-50"
                placeholder="City"
                @update:search-term="fetchCities"
                @create="(val) => handleCityCreate(val, 'receiver')" />
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
            <UFormField :label="deliveryType === 'FCFS' ? 'Delivery Time Range' : 'Delivery Time'" name="delivery_time">
              <UInputTime v-if="deliveryType === 'FCFS'" range v-model="deliveryTimeRange" :hour-cycle="24" />
              <UInputTime v-else v-model="state.delivery_time" :hour-cycle="24" />
            </UFormField>
          </div>
        </div> -->

        <USeparator label="Distance / Weight" />

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Total Miles" name="miles" required>
            <UInput v-model.number="state.miles" type="number" required :ui="{
                base: 'pl-12 pr-2',
                leading: 'pointer-events-none'
              }">
              <template #leading><p class="text-sm text-muted">Miles</p></template>
            </UInput>
          </UFormField>
          <UFormField label="Weight" name="weight">
            <UInput v-model.number="state.weight" type="number" :ui="{
                base: 'pl-10 pr-2',
                leading: 'pointer-events-none'
              }">
              <template #leading><p class="text-sm text-muted">Lbs</p></template>
            </UInput>
          </UFormField>
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <UButton color="neutral" variant="ghost" label="Cancel" @click="open = false" />
          <UButton type="submit" color="primary" label="Create Load" :loading="loading" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>