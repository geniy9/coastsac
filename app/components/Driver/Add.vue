<!-- components/DriverAdd.vue -->
<script setup>
const open = defineModel('open', { type: Boolean, default: false })
const emit = defineEmits(['success'])

const client = useStrapiClient()
const user = useStrapiUser()
const toast = useToast()
const { trailerOptions, driverTypeOptions } = useConfig()

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
  fuel_card_number: '',
  deductions: {
    eld: 0,
    insurance: 0,
    plates: 0
  }
})
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
  try {
    const payload = {
      data: {
        ...state,
        assigned_dispatcher: user.value?.id
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
      fuel_card_number: '',
      deductions: { eld: 0, insurance: 0, plates: 0 }
    })
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
          <h3 class="text-lg font-semibold text-highlighted">
            Add a new driver
          </h3>
          <UButton icon="i-lucide-x" color="neutral" variant="ghost" @click="open = false" />
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
          <UFormField label="Driver number" name="driver_number">
            <UInput v-model="state.driver_number" placeholder="D-123" class="w-full" />
          </UFormField>
          <UFormField label="Assigned dispatcher">
            <UInput 
              :model-value="user?.name || user?.username || 'Loading...'" 
              disabled 
              icon="i-lucide-user-cog"
              class="w-full" />
          </UFormField>
          <!-- <UFormField label="Fuel Card Number" name="fuel_card_number" class="col-span-2">
            <UInput v-model="state.fuel_card_number" placeholder="0000000000000" class="w-full">
              <template #trailing>
                <UIcon class="w-5 h-5" name="hugeicons:credit-card" />
              </template>
            </UInput>
          </UFormField> -->
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
            <UFormField label="Track number" name="truck_number">
              <UInput v-model="state.truck_number" class="w-full" />
            </UFormField>
            <UFormField label="Trailer type" name="trailer">
              <USelect v-model="state.trailer" :items="trailerOptions" class="w-full" />
            </UFormField>
          </div>
        </div>

        <USeparator label="Weekly Deductions" />

        <div class="grid grid-cols-3 gap-4">
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