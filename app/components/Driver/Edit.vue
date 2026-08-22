<!-- components/DriverEdit.vue -->
<script setup>
const open = defineModel('open', { type: Boolean, default: false })
const props = defineProps({
  driver: {
    type: Object,
    default: null
  }
})
const emit = defineEmits(['success'])

const client = useStrapiClient()
const toast = useToast()
const { permissions } = useRolePermissions()
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
  hired_date: '',
  driver_number: '',
  notes: '',
  truck_number: '',
  vin_code: '',
  trailer: 'van',
  trailer_number: '',
  fuel_card_number: '',
  assigned_dispatcher: null,
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
const existingDocs = ref([])
const loading = ref(false)
const deleteLoading = ref(false)

const removeExistingDoc = (docId) => {
  existingDocs.value = existingDocs.value.filter(d => d.id !== docId)
}

const { data: cardsResponse } = await useAsyncData('fuel-cards-dropdown-edit', async () => {
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

watch([cards, () => state.fuel_card_number], ([newCards, currentCard]) => {
  if (newCards.length > 0 && currentCard) {
    const found = newCards.some(c => {
      const attrs = c.attributes || c
      return attrs.card_number === currentCard
    })
    if (!found) {
      manualCardEntry.value = true
    }
  }
}, { immediate: true })

watch(() => props.driver, (newVal) => {
  if (newVal) {
    const dispatcher = newVal.assigned_dispatcher
    Object.assign(state, {
      first_name: newVal.first_name || '',
      last_name: newVal.last_name || '',
      phone: newVal.phone || '',
      email: newVal.email || '',
      cdl_number: newVal.cdl_number || '',
      cdl_expiry: newVal.cdl_expiry ? newVal.cdl_expiry.split('T')[0] : '',
      medical_expiry: newVal.medical_expiry ? newVal.medical_expiry.split('T')[0] : '',
      driver_type: newVal.driver_type || 'company_driver',
      commission_rate: newVal.commission_rate || 0,
      hired_date: newVal.hired_date ? newVal.hired_date.split('T')[0] : '',
      driver_number: newVal.driver_number || '',
      notes: newVal.notes || '',
      truck_number: newVal.truck_number || '',
      vin_code: newVal.vin_code || '',
      trailer: newVal.trailer || 'van',
      trailer_number: newVal.trailer_number || '',
      fuel_card_number: newVal.fuel_card_number || '',
      assigned_dispatcher: dispatcher 
        ? { id: dispatcher.id, label: dispatcher.name || dispatcher.username } 
        : null,
      deductions: {
        eld: newVal.deductions?.eld || 0,
        insurance: newVal.deductions?.insurance || 0,
        plates: newVal.deductions?.plates || 0,
        ifta: newVal.deductions?.ifta || 0,
        other_reason: newVal.deductions?.other_reason || '',
        other_cost: newVal.deductions?.other_cost || 0
      },
      extra_info: {
        emergency_phone: newVal.extra_info?.emergency_phone || '',
        company_name: newVal.extra_info?.company_name || '',
        ein_number: newVal.extra_info?.ein_number || '',
        home_address: newVal.extra_info?.home_address || '',
        docs: []
      }
    })

    existingDocs.value = newVal.extra_info?.docs || []

    if (uploaderRef.value) {
      uploaderRef.value.clear()
    }
  }
}, { immediate: true })

const clearOtherDeduction = () => {
  state.deductions.other_reason = ''
  state.deductions.other_cost = 0
}

const onSubmit = async () => {
  if (!props.driver?.documentId) return

  // Приведение пустых полей к 0 или корректному значению перед валидацией
  const otherReason = state.deductions.other_reason?.trim() || ''
  const otherCost = state.deductions.other_cost === '' || state.deductions.other_cost === null 
    ? 0 
    : Number(state.deductions.other_cost)

  // Проверка взаимозависимости полей "Other deduction"
  if ((otherReason && otherCost <= 0) || (!otherReason && otherCost > 0)) {
    toast.add({
      title: 'Validation Error',
      description: 'Please provide both a valid reason and an amount (> 0) for the Other Deduction.',
      color: 'error'
    })
    return
  }

  loading.value = true
  try {
    let newUploadedDocIds = []
    if (uploaderRef.value) {
      newUploadedDocIds = await uploaderRef.value.uploadFiles()
    }
    const finalDocIds = [
      ...existingDocs.value.map(d => d.id),
      ...newUploadedDocIds
    ]

    // Санитизация всех числовых полей deductions
    const sanitizedDeductions = {
      eld: state.deductions.eld === '' || state.deductions.eld === null ? 0 : Number(state.deductions.eld),
      insurance: state.deductions.insurance === '' || state.deductions.insurance === null ? 0 : Number(state.deductions.insurance),
      plates: state.deductions.plates === '' || state.deductions.plates === null ? 0 : Number(state.deductions.plates),
      ifta: state.deductions.ifta === '' || state.deductions.ifta === null ? 0 : Number(state.deductions.ifta),
      other_reason: otherReason,
      other_cost: otherCost
    }

    const payload = {
      data: {
        ...state,
        cdl_expiry: state.cdl_expiry || null,
        medical_expiry: state.medical_expiry || null,
        hired_date: state.hired_date || null,
        deductions: sanitizedDeductions,
        assigned_dispatcher: state.assigned_dispatcher?.id || null,
        extra_info: {
          ...state.extra_info,
          docs: finalDocIds
        }
      }
    }

    await client(`/drivers/${props.driver.documentId}`, {
      method: 'PUT',
      body: payload
    })

    toast.add({
      title: 'Success',
      description: 'Information has been successfully updated!',
      color: 'success'
    })

    emit('success')
    open.value = false
  } catch (error) {
    console.error(error)
    toast.add({
      title: 'Error',
      description: error?.data?.error?.message || 'Failed to update profile',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

const onDelete = async () => {
  if (!props.driver?.documentId) return
  if (!confirm('Are you sure you want to remove this driver?')) return

  deleteLoading.value = true
  try {
    await client(`/drivers/${props.driver.documentId}`, {
      method: 'DELETE'
    })

    toast.add({
      title: 'Success',
      description: 'Driver card successfully deleted!',
      color: 'success'
    })

    emit('success')
    open.value = false
  } catch (error) {
    console.error(error)
    toast.add({
      title: 'Error',
      description: error?.data?.error?.message || 'Failed to remove driver',
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
      <UForm :state="state" @submit="onSubmit" class="grid gap-6 p-6 overflow-y-auto">
        
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-highlighted">
            Edit driver
          </h3>
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
          <UFormField label="Driver number" name="driver_number">
            <UInput v-model="state.driver_number" class="w-full" />
          </UFormField>
          <UFormField label="Assigned dispatcher" name="assigned_dispatcher">
            <USelectMenu 
              v-model="state.assigned_dispatcher" 
              :items="dispatcherItems" 
              by="id"
              placeholder="Select dispatcher"
              class="w-full" />
          </UFormField>
          <!-- <UFormField label="Assigned dispatcher">
            <UInput 
              :model-value="assignedDispatcherName" 
              disabled 
              icon="i-lucide-user-cog"
              class="w-full" />
          </UFormField> -->
          <UFormField label="Fuel Card Number" name="fuel_card_number" class="col-span-2">
            <div class="flex gap-1.5 w-full">
              <USelect 
                v-if="!manualCardEntry && cardItems.length > 0"
                v-model="state.fuel_card_number" 
                :items="cardItems" 
                placeholder="Select a fuel card"
                class="flex-1" />
              <UInput v-else
                v-model="state.fuel_card_number" 
                placeholder="Type card number manually" 
                class="flex-1">
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
          <UFormField label="Home Address" name="extra_info.home_address">
            <UInput v-model="state.extra_info.home_address" class="w-full" />
          </UFormField>
          
          <div class="col-span-2 space-y-3">
            <div v-if="existingDocs.length > 0" class="space-y-1.5">
              <p class="text-xs font-semibold text-gray-400">
                Current documents:
              </p>
              <div class="flex flex-wrap gap-2">
                <div 
                  v-for="doc in existingDocs" 
                  :key="doc.id" 
                  class="flex items-center gap-2 bg-gray-800/60 border border-gray-700 px-2 py-1 rounded-md text-xs">
                  <span class="truncate max-w-45 text-gray-300">
                    {{ doc.name || doc.url.split('/').pop() }}
                  </span>
                  <UButton 
                    icon="i-lucide-x" 
                    color="error" 
                    variant="ghost" 
                    size="xs" 
                    class="p-0.5" 
                    @click="removeExistingDoc(doc.id)" />
                </div>
              </div>
            </div>

            <UploaderFiles ref="uploaderRef" label="Driver's license, Contract, etc." />
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
          <UFormField label="VIN code" name="vin_code">
              <UInput v-model="state.vin_code" class="w-full" placeholder="1HGCR2F8XHA000000" />
            </UFormField>
          <UFormField label="Trailer type" name="trailer">
            <USelect v-model="state.trailer" :items="trailerOptions" class="w-full" />
          </UFormField>
          <UFormField label="Trailer number" name="trailer_number">
            <UInput v-model="state.trailer_number" class="w-full" />
          </UFormField>
        </div>

        <USeparator label="Weekly Deductions" />

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="ELD" name="deductions.eld">
            <UInput v-model.number="state.deductions.eld" type="number">
              <template #trailing><div class="input_trailing">$</div></template>
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
              :label="`Other deduction ${state.deductions.other_reason ? ' ['+ state.deductions.other_reason +']' : ''}`"
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
                <div v-if="state.deductions.other_reason || state.deductions.other_cost" class="col-span-2 flex justify-end">
                  <UButton 
                    label="Clear Other Deduction" 
                    color="error" 
                    variant="ghost" 
                    size="xs" 
                    icon="hugeicons:delete-02"
                    type="button" 
                    @click="clearOtherDeduction" />
                </div>
              </div>
            </template>
          </UCollapsible>
        </div>

        <USeparator label="Notes" />

        <UFormField name="notes">
          <UTextarea v-model="state.notes" class="w-full" />
        </UFormField>

        <div class="dashboard flex justify-between items-center pt-4">
          <div>
            <UButton 
              v-if="permissions.canDeleteDrivers" 
              color="error" 
              variant="soft" 
              label="Remove driver" 
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