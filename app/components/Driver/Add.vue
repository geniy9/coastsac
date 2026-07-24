<!-- components/DriverAdd.vue -->
<script setup>
const open = defineModel('open', { type: Boolean, default: false })
const emit = defineEmits(['success'])

const client = useStrapiClient()
const user = useStrapiUser()
const toast = useToast()
const { trailerOptions, driverTypeOptions } = useConfig()
const { dispatcherItems } = useDispatchers()

const { getCards } = useFuel()
const manualCardEntry = ref(false)

const state = reactive({
  first_name: '',
  last_name: '',
  phone: '',
  email: '',
  cdl_number: '',
  cdl_expiry: '',
  medical_expiry: '',
  driver_type: 'company_driver',
  commission_rate: 0,
  hired_date: new Date().toISOString().split('T')[0],
  driver_number: '',
  notes: '',
  truck_number: '',
  trailer: 'van',
  trailer_number: '',
  fuel_card_number: '',
  assigned_dispatcher: user.value 
    ? { id: user.value.id, label: user.value.name || user.value.username } 
    : null,
  deductions: {
    eld: 0,
    insurance: 0,
    plates: 0,
    ifta: 0,
    other_reason: '',
    other_cost: 0
  },
  extra_info: {
    emergency_phone: '',
    company_name: '',
    ein_number: '',
    home_address: '',
    docs: []
  }
})
const uploaderRef = ref(null)
const loading = ref(false)

const { data: cardsResponse } = await useAsyncData('fuel-cards-dropdown-add', async () => {
  const res = await getCards()
  return res?.data || []
}, {
  lazy: true,
  default: () => []
})
const cards = computed(() => cardsResponse.value || [])
const cardItems = computed(() => {
  return cards.value.map(c => {
    const attrs = c.attributes || c
    return {
      value: attrs.card_number,
      label: `${attrs.card_number} (${attrs.status})`
    }
  })
})

const onSubmit = async () => {
  loading.value = true

  // Проверка взаимозависимости полей "Other deduction"
  const otherReason = state.deductions.other_reason?.trim()
  const otherCost = Number(state.deductions.other_cost) || 0

  if ((otherReason && otherCost <= 0) || (!otherReason && otherCost > 0)) {
    toast.add({
      title: 'Validation Error',
      description: 'Please provide both a valid reason and an amount (> 0) for the Other Deduction.',
      color: 'error'
    })
    return
  }
  try {
    let uploadedDocIds = []
    if (uploaderRef.value) {
      uploadedDocIds = await uploaderRef.value.uploadFiles()
    }

    const payload = {
      data: {
        ...state,
        assigned_dispatcher: state.assigned_dispatcher?.id || null,
        extra_info: {
          ...state.extra_info,
          docs: uploadedDocIds
        }
      }
    }

    await client('/drivers', {
      method: 'POST',
      body: payload
    })

    toast.add({
      title: 'Success',
      description: "The driver's profile has been successfully created!",
      color: 'success'
    })

    emit('success')
    open.value = false

    Object.assign(state, {
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      cdl_number: '',
      cdl_expiry: '',
      medical_expiry: '',
      driver_type: 'company_driver',
      commission_rate: 0,
      hired_date: new Date().toISOString().split('T')[0],
      driver_number: '',
      notes: '',
      truck_number: '',
      trailer: 'van',
      trailer_number: '',
      fuel_card_number: '',
      assigned_dispatcher: user.value 
        ? { id: user.value.id, label: user.value.name || user.value.username } 
        : null,
      deductions: { eld: 0, insurance: 0, plates: 0, ifta: 0, other_reason: '', other_cost: 0 },
      extra_info: {
        emergency_phone: '',
        company_name: '',
        ein_number: '',
        home_address: '',
        docs: []
      }
    })

    if (uploaderRef.value) {
      uploaderRef.value.clear()
    }
  } catch (error) {
    console.error(error)
    toast.add({
      title: 'Error',
      description: error?.data?.error?.message || 'Failed to create driver',
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
          <h3 class="text-lg font-semibold text-highlighted">Add a new driver</h3>
          <UButton icon="hugeicons:cancel-01" color="neutral" variant="ghost" @click="open = false" />
        </div>

        <USeparator label="Contacts" />

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="First name" name="first_name" required>
            <UInput v-model="state.first_name" required class="w-full" />
          </UFormField>
          <UFormField label="Last name" name="last_name" required>
            <UInput v-model="state.last_name" required class="w-full" />
          </UFormField>
          <UFormField label="Email" name="email" required>
            <UInput v-model="state.email" type="email" required class="w-full" />
          </UFormField>
          <UFormField label="Phone" name="phone">
            <UInput v-model="state.phone" class="w-full" />
          </UFormField>
          <UFormField label="Driver number (driver license)" name="driver_number">
            <UInput v-model="state.driver_number" placeholder="D-123" class="w-full" />
          </UFormField>
          <UFormField label="Assigned dispatcher" name="assigned_dispatcher">
            <USelectMenu 
              v-model="state.assigned_dispatcher" 
              :items="dispatcherItems" 
              by="id"
              label-key="label"
              placeholder="Select dispatcher"
              class="w-full" />
          </UFormField>
          <UFormField label="Fuel Card Number" name="fuel_card_number" class="col-span-2">
            <div class="flex gap-1.5 w-full">
              <USelect 
                v-if="!manualCardEntry && cardItems.length > 0"
                v-model="state.fuel_card_number" 
                :items="cardItems" 
                placeholder="Select a fuel card"
                class="flex-1" />
              <UInput 
                v-else
                v-model="state.fuel_card_number" 
                placeholder="Type card number manually" 
                class="flex-1" >
                <template #trailing>
                  <UIcon class="w-5 h-5 text-gray-400" name="hugeicons:credit-card" />
                </template>
              </UInput>
              <UButton 
                v-if="cardItems.length > 0"
                :icon="manualCardEntry ? 'hugeicons:credit-card-change' : 'hugeicons:credit-card-add'"
                color="neutral"
                variant="soft"
                @click="manualCardEntry = !manualCardEntry"
                :label="manualCardEntry ? 'Choose from list' : 'Type manually'" />
            </div>
          </UFormField>
        </div>

        <USeparator label="Extra info / Documents" />

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Emergency Phone" name="extra_info.emergency_phone">
            <UInput v-model="state.extra_info.emergency_phone" class="w-full" />
          </UFormField>
          <UFormField label="Company Name" name="extra_info.company_name">
            <UInput v-model="state.extra_info.company_name" class="w-full" />
          </UFormField>
          <UFormField label="EIN Number" name="extra_info.ein_number">
            <UInput v-model="state.extra_info.ein_number" class="w-full" />
          </UFormField>
          <UFormField label="Home Address" name="extra_info.home_address" class="col-span-2">
            <UInput v-model="state.extra_info.home_address" class="w-full" />
          </UFormField>
          <div class="col-span-2">
            <UploaderFiles ref="uploaderRef" label="Driver's license, Contract, etc."  />
          </div>
        </div>

        <USeparator label="Licenses / Validity" />

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="CDL Number" name="cdl_number">
            <UInput v-model="state.cdl_number" class="w-full" />
          </UFormField>
          <UFormField label="CDL Expiry" name="cdl_expiry">
            <UInput v-model="state.cdl_expiry" type="date" class="w-full" />
          </UFormField>
          <UFormField label="Medical Expiry" name="medical_expiry">
            <UInput v-model="state.medical_expiry" type="date" class="w-full" />
          </UFormField>
          <UFormField label="Hired Date" name="hired_date">
            <UInput v-model="state.hired_date" type="date" class="w-full" />
          </UFormField>
        </div>

        <USeparator label="Type / Commission / Transport" />

        <div>
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Driver type" name="driver_type">
              <USelect v-model="state.driver_type" :items="driverTypeOptions" class="w-full" />
            </UFormField>
            <UFormField label="Commission" name="commission_rate">
              <UInput 
                v-model.number="state.commission_rate" 
                type="number" 
                step="0.01" 
                min="0" 
                max="100"
                class="w-full">
                <template #trailing><div class="input_trailing">%</div></template>
              </UInput>
            </UFormField>
            <UFormField label="Track number" name="truck_number" class="col-span-2">
              <UInput v-model="state.truck_number" class="w-full" />
            </UFormField>
            <UFormField label="Trailer type" name="trailer">
              <USelect v-model="state.trailer" :items="trailerOptions" class="w-full" />
            </UFormField>
            <UFormField label="Trailer number" name="trailer_number">
              <UInput v-model="state.trailer_number" class="w-full" />
            </UFormField>
          </div>
        </div>

        <USeparator label="Weekly Deductions" />

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="ELD" name="deductions.eld">
            <UInput v-model.number="state.deductions.eld" type="number">
              <template #trailing>
                <div class="input_trailing">$</div>
              </template>
            </UInput>
          </UFormField>
          <UFormField label="Insurance" name="deductions.insurance">
            <UInput v-model.number="state.deductions.insurance" type="number">
              <template #trailing><div class="input_trailing">$</div></template>
            </UInput>
          </UFormField>
          <UFormField label="Plates" name="deductions.plates">
            <UInput v-model.number="state.deductions.plates" type="number">
              <template #trailing><div class="input_trailing">$</div></template>
            </UInput>
          </UFormField>
          <UFormField label="IFTA" name="deductions.ifta">
            <UInput v-model.number="state.deductions.ifta" type="number">
              <template #trailing><div class="input_trailing">$</div></template>
            </UInput>
          </UFormField>
          <!-- Дополнительный вычет -->
          <UCollapsible class="col-span-2 flex flex-col gap-2">
            <UButton
              label="Other deduction"
              color="neutral"
              variant="subtle"
              trailing-icon="i-lucide-chevron-down"
              block
              type="button" />
            <template #content>
              <div class="grid grid-cols-2 gap-4 pt-2">
                <UFormField label="Deduction Reason" name="deductions.other_reason">
                  <UInput v-model="state.deductions.other_reason" placeholder="e.g. Escrow, Fine" class="w-full" />
                </UFormField>
                <UFormField label="Deduction Amount" name="deductions.other_cost">
                  <UInput v-model.number="state.deductions.other_cost" type="number" min="0" class="w-full">
                    <template #trailing><div class="input_trailing">$</div></template>
                  </UInput>
                </UFormField>
              </div>
            </template>
          </UCollapsible>
        </div>

        <USeparator label="Notes" />

        <UFormField name="notes">
          <UTextarea v-model="state.notes" class="w-full" />
        </UFormField>

        <div class="flex justify-end gap-3 pt-4">
          <UButton color="neutral" variant="ghost" label="Cancel" @click="open = false" />
          <UButton type="submit" color="primary" label="Create" :loading="loading" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>