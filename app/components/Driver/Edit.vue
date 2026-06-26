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
  trailer: 'van',
  deductions: {
    eld: 0,
    insurance: 0,
    plates: 0
  }
})
const loading = ref(false)
const deleteLoading = ref(false)

watch(() => props.driver, (newVal) => {
  if (newVal) {
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
      trailer: newVal.trailer || 'van',
      deductions: {
        eld: newVal.deductions?.eld || 0,
        insurance: newVal.deductions?.insurance || 0,
        plates: newVal.deductions?.plates || 0
      }
    })
  }
}, { immediate: true })

const assignedDispatcherName = computed(() => {
  const dispatcher = props.driver?.assigned_dispatcher
  return dispatcher ? (dispatcher.name || dispatcher.username) : 'Not assigned'
})

const onSubmit = async () => {
  if (!props.driver?.documentId) return

  loading.value = true
  try {
    const payload = {
      data: {
        ...state,
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
            <UInput v-model="state.driver_number" class="w-full" />
          </UFormField>
          <UFormField label="Assigned dispatcher">
            <UInput 
              :model-value="assignedDispatcherName" 
              disabled 
              icon="i-lucide-user-cog"
              class="w-full" />
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

        <USeparator label="Type / Rate / Transport" />

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Driver type" name="driver_type">
            <USelect v-model="state.driver_type" :items="driverTypeOptions" class="w-full" />
          </UFormField>
          <UFormField label="Commission rate" name="commission_rate">
            <UInput 
              v-model.number="state.commission_rate" 
              type="number" 
              step="0.01" 
              min="0" 
              max="100"
              class="w-full">
              <template #trailing>
                <div class="text-xs text-muted tabular-nums">%</div>
              </template>
            </UInput>
          </UFormField>
          <UFormField label="Track number" name="truck_number">
            <UInput v-model="state.truck_number" class="w-full" />
          </UFormField>
          <UFormField label="Trailer type" name="trailer">
            <USelect v-model="state.trailer" :items="trailerOptions" class="w-full" />
          </UFormField>
        </div>

        <USeparator label="Weekly Deductions" />

        <div class="grid grid-cols-3 gap-4">
          <UFormField label="ELD" name="deductions.eld">
            <UInput v-model.number="state.deductions.eld" type="number">
              <template #trailing>
                <div class="text-xs text-muted tabular-nums">$</div>
              </template>
            </UInput>
          </UFormField>
          <UFormField label="Insurance" name="deductions.insurance">
            <UInput v-model.number="state.deductions.insurance" type="number">
              <template #trailing>
                <div class="text-xs text-muted tabular-nums">$</div>
              </template>
            </UInput>
          </UFormField>
          <UFormField label="Plates" name="deductions.plates">
            <UInput v-model.number="state.deductions.plates" type="number">
              <template #trailing>
                <div class="text-xs text-muted tabular-nums">$</div>
              </template>
            </UInput>
          </UFormField>
        </div>

        <USeparator label="Notes" />

        <UFormField name="notes">
          <UTextarea v-model="state.notes" class="w-full" />
        </UFormField>

        <div class="flex justify-between items-center pt-4">
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