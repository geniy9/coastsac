<!-- pages/dashboard/settlements/index.vue -->
<script setup>
definePageMeta({ layout: 'dashboard' })

const { permissions } = useRolePermissions()
const client = useStrapiClient()
const toast = useToast()

const selectedDriver = ref(null)
const startDate = ref('')
const endDate = ref('')
const isCreating = ref(false)
const bulkInterval = ref(10)
const isBulkDeleting = ref(false)
const router = useRouter()

// Списки
const { data: driversResponse } = await useAsyncData('drivers-simple-list', () => 
  client('/drivers', { query: { fields: ['first_name', 'last_name', 'email'] } })
)
const drivers = computed(() => driversResponse.value?.data || [])
const driverItems = computed(() => drivers.value.map(d => ({
  value: d.documentId,
  label: `${d.first_name} ${d.last_name}`
})))

const { data: settlementsResponse, refresh } = await useAsyncData('settlements-list', () =>
  client('/settlements', { query: { populate: ['driver'] } })
)
const settlements = computed(() => settlementsResponse.value?.data || [])

// Логика фоновой джобы
const activeJob = ref(null)
const jobProgress = computed(() => {
  if (!activeJob.value) return 0
  return Math.round((activeJob.value.processed_items / activeJob.value.total_items) * 100)
})

let pollingInterval = null

const startPolling = (jobId) => {
  pollingInterval = setInterval(async () => {
    try {
      const res = await client(`/settlement-jobs/${jobId}`)
      activeJob.value = res.data
      if (['completed', 'failed'].includes(res.data.status_job)) {
        clearInterval(pollingInterval)
        activeJob.value = null
        toast.add({ title: 'Bulk Sending Completed', color: 'success' })
        refresh()
      }
    } catch (e) {
      clearInterval(pollingInterval)
    }
  }, 3000)
}

// Запустить расчет и сохранить в драфт
const handleCreateSettlement = async () => {
  if (!selectedDriver.value || !startDate.value || !endDate.value) {
    toast.add({ title: 'Validation Error', description: 'Please fill all fields', color: 'error' })
    return
  }

  isCreating.value = true
  try {
    const calc = await client('/settlements/calculate', {
      query: { driverId: selectedDriver.value, startDate: startDate.value, endDate: endDate.value }
    })

    const payload = {
      data: {
        start_date: startDate.value,
        end_date: endDate.value,
        driver: selectedDriver.value,
        loads: calc.loads.map(l => l.documentId),
        gross_freight: calc.gross_freight,
        gross_payable: calc.gross_payable,
        total_fuel: calc.fuel_expense,
        total_deductions: calc.total_deductions,
        net_payout: calc.net_payout,
        status_settlement: 'draft'
      }
    }

    await client('/settlements', { method: 'POST', body: payload })
    toast.add({ title: 'Draft Settlement Saved', color: 'success' })
    refresh()
  } catch (error) {
    toast.add({ title: 'Calculation failed', description: error.message, color: 'error' })
  } finally {
    isCreating.value = false
  }
}

// Массовая рассылка выбранных драфтов
const selectedIds = ref([])
const handleBulkSend = async () => {
  if (selectedIds.value.length === 0) return
  
  try {
    const res = await client('/settlement-jobs', {
      method: 'POST',
      body: {
        settlementIds: selectedIds.value,
        interval_sec: bulkInterval.value
      }
    })
    activeJob.value = res.job
    startPolling(res.job.documentId)
  } catch (e) {
    toast.add({ title: 'Bulk send failed', description: e.message, color: 'error' })
  }
}

// удаление
const handleDeleteSettlement = async (documentId) => {
  if (!confirm('Are you sure you want to delete this settlement?')) return

  try {
    await client(`/settlements/${documentId}`, { method: 'DELETE' })
    toast.add({ title: 'Settlement deleted successfully', color: 'success' })
    
    // Исключаем удаленный ID из списка выбранных, если он там был
    selectedIds.value = selectedIds.value.filter(id => id !== documentId)
    refresh()
  } catch (error) {
    toast.add({ title: 'Failed to delete settlement', description: error.message, color: 'error' })
  }
}

// Массовое удаление выделенных записей
const handleBulkDelete = async () => {
  if (selectedIds.value.length === 0) return
  if (!confirm(`Are you sure you want to delete ${selectedIds.value.length} selected settlements?`)) return

  isBulkDeleting.value = true
  try {
    // Выполняем параллельное удаление всех выбранных сущностей
    await Promise.all(
      selectedIds.value.map(id => client(`/settlements/${id}`, { method: 'DELETE' }))
    )
    toast.add({ title: 'Selected settlements deleted', color: 'success' })
    selectedIds.value = []
    refresh()
  } catch (error) {
    toast.add({ title: 'Bulk deletion encountered errors', description: error.message, color: 'error' })
    refresh() // Обновляем список, чтобы синхронизировать то, что успешно удалилось
  } finally {
    isBulkDeleting.value = false
  }
}

const goToSett = (id) => {
  router.push(`/dashboard/settlements/${id}`)
}

onBeforeUnmount(() => {
  if (pollingInterval) clearInterval(pollingInterval)
})
</script>
<template>
  <div class="dashboard_main">
    <UDashboardPanel id="settlements">
      <template #header>
        <UDashboardNavbar title="Settlements" />

        <UDashboardToolbar v-if="permissions.canViewSettlements">
          <template #left>
            <!-- GENERATE NEW SETTLEMENT WIDGET -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
              <USelect v-model="selectedDriver" :items="driverItems" placeholder="Choose Driver" class="min-w-40" />
              <UFieldGroup>
                <UBadge label="Start Date" variant="soft" />
                <UInput v-model="startDate" type="date" class="w-full" />
              </UFieldGroup>
              <UFieldGroup>
                <UBadge label="End Date" variant="soft" />
                <UInput v-model="endDate" type="date" class="w-full" />
              </UFieldGroup>
              <div class="flex">
                <UButton 
                label="Calculate & Save" 
                color="primary" 
                :loading="isCreating" 
                @click="handleCreateSettlement" />
              </div>
            </div>
          </template>
        </UDashboardToolbar>
      </template>

      <template #body>
        <div class="space-y-6" v-if="permissions.canViewSettlements">
          
          <!-- PROGRESS BAR -->
          <div v-if="activeJob" class="border border-primary/20 bg-primary/5 p-4 rounded-xl space-y-2">
            <div class="flex justify-between items-center text-xs text-primary font-semibold">
              <span class="flex items-center gap-1.5 animate-pulse">
                <UIcon name="i-lucide-loader-2" class="animate-spin" />
                Sending weekly settlements...
              </span>
              <span>{{ activeJob.processed_items }} / {{ activeJob.total_items }} sent ({{ jobProgress }}%)</span>
            </div>
            <UProgress v-model="jobProgress" size="xs" color="primary" />
          </div>

          <!-- LIST OF SETTLEMENTS -->
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <h3 class="font-bold text-highlighted text-md">
                Settlements Registry
              </h3>
              <div class="flex items-center gap-3">
                <UFieldGroup>
                  <UBadge label="Interval" variant="soft" />
                  <UInput v-model="bulkInterval" type="number" class="w-24" placeholder="delay" :ui="{
                      base: 'pr-8',
                      trailing: 'pointer-events-none'
                    }">
                    <template #trailing><p class="text-sm text-muted">sec</p></template>
                  </UInput>
                  <UButton 
                    label="Bulk Send" 
                    color="info" 
                    :disabled="selectedIds.length === 0" 
                    @click="handleBulkSend" />
                </UFieldGroup>
                <UTooltip text="Delete selected" v-if="permissions.isAdmin">
                  <UButton 
                    color="error" 
                    variant="soft"
                    icon="hugeicons:delete-02"
                    :disabled="selectedIds.length === 0" 
                    :loading="isBulkDeleting"
                    @click="handleBulkDelete" />
                </UTooltip>
              </div>
            </div>

            <div class="border border-default rounded-lg overflow-hidden">
              <table class="w-full text-left text-sm border-collapse">
                <thead class="bg-elevated/50 text-primary border-b border-default">
                  <tr>
                    <th class="p-3 text-center">
                      <input type="checkbox" @change="(e) => selectedIds = e.target.checked ? settlements.map(s => s.documentId) : []" /></th>
                    <th class="p-3">Driver</th>
                    <th class="p-3">Period</th>
                    <th class="p-3">Status</th>
                    <th class="p-3 text-right">Gross</th>
                    <th class="p-3 text-right">Fuel Expense</th>
                    <th class="p-3 text-right">Net Payout</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="sett in settlements" :key="sett.id" 
                    class="border-b border-default hover:bg-elevated/10 text-sm cursor-pointer">
                    <td class="p-3 text-center">
                      <input type="checkbox" :value="sett.documentId" v-model="selectedIds" />
                    </td>
                    <td @click="goToSett(sett.documentId)" class="p-3 font-semibold text-highlighted">
                      {{ sett.driver?.first_name }} {{ sett.driver?.last_name }}
                    </td>
                    <td @click="goToSett(sett.documentId)" class="p-3 font-mono flex flex-col items-start gap-1">
                      <UBadge :label="sett.start_date" variant="soft" icon="hugeicons:calendar-add-02" />
                      <UBadge :label="sett.end_date" variant="soft" icon="hugeicons:calendar-minus-02" />
                    </td>
                    <td @click="goToSett(sett.documentId)" class="p-3">
                      <UBadge :color="sett.status_settlement === 'sent' ? 'success' : (sett.status_settlement === 'generated' ? 'info' : 'neutral')" variant="soft">
                        {{ sett.status_settlement }}
                      </UBadge>
                    </td>
                    <td @click="goToSett(sett.documentId)" class="p-3 text-right font-mono">
                      ${{ sett.gross_payable }}
                    </td>
                    <td @click="goToSett(sett.documentId)" class="p-3 text-right font-mono text-red-500">
                      ${{ sett.total_fuel }}
                    </td>
                    <td @click="goToSett(sett.documentId)" class="p-3 text-right font-mono">
                      <span :class="(sett.net_payout >= 0) ? 'text-highlighted' : 'text-red-500'">
                        ${{ sett.net_payout }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </template>
    </UDashboardPanel>
  </div>
</template>