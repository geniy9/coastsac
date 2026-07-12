<!-- pages/dashboard/settlements/[id].vue -->
<script setup>
definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const client = useStrapiClient()
const { permissions } = useRolePermissions()
const { getPayableAmount } = useConfig()
const toast = useToast()

const id = route.params.id
const isSending = ref(false)

const { data: response, refresh } = await useAsyncData(`settlement-detail-${id}`, () =>
  client(`/settlements/${id}`, {
    query: {
      populate: [
        'driver.deductions', 
        'loads.shipper_address',
        'loads.receiver_address'
      ]
    } 
  })
)
const settlement = computed(() => response.value?.data || null)

// Кастомные корректировки
const newAdjReason = ref('')
const newAdjAmount = ref(0)
const newAdjType = ref('deduction')
const isOpenAdjust = ref(false)
const loadingAdjust = ref(false)

const handleAddAdjustment = async () => {
  if (!newAdjReason.value || newAdjAmount.value <= 0) return
  loadingAdjust.value = true

  const adjs = settlement.value.custom_adjustments || []
  adjs.push({
    reason: newAdjReason.value,
    amount: newAdjAmount.value,
    type: newAdjType.value
  })

  // Перерасчет Net Payout
  const diff = newAdjAmount.value * (newAdjType.value === 'deduction' ? -1 : 1)
  const newNet = Number(settlement.value.net_payout) + diff
  const newDeductions = Number(settlement.value.total_deductions) + (newAdjType.value === 'deduction' ? newAdjAmount.value : 0)

  try {
    await client(`/settlements/${id}`, {
      method: 'PUT',
      body: {
        data: {
          custom_adjustments: adjs,
          net_payout: newNet,
          total_deductions: newDeductions
        }
      }
    })
    toast.add({ title: 'Adjustment Added', color: 'success' })
    newAdjReason.value = ''
    newAdjAmount.value = 0
    refresh()
  } catch (e) {
    toast.add({ title: 'Failed to update', description: e.message, color: 'error' })
  } finally {
    loadingAdjust.value = false
    isOpenAdjust.value = false
  }
}

// SENDING
const handleSendEmail = async () => {
  isSending.value = true
  try {
    await client(`/settlements/${id}/generate-send`, { method: 'POST' })
    toast.add({ title: 'Email successfully sent to driver', color: 'success' })
    refresh()
  } catch (e) {
    toast.add({ title: 'Failed to dispatch email', description: e.message, color: 'error' })
  } finally {
    isSending.value = false
  }
}

const toggleAdjustment = () => {
  isOpenAdjust.value = isOpenAdjust.value ? false : true
}
const handlePrint = () => {
  window.print()
}
</script>
<template>
  <div class="dashboard_main">
    <UDashboardPanel :id="id">
      <template #header>
        <UDashboardNavbar title="Settlement Worksheet" class="no-print">
          <template #leading>
            <UDashboardSidebarCollapse />
            <UButton icon="i-lucide-arrow-left" to="/dashboard/settlements" variant="ghost" />
          </template>
          <template #right>
            <div class="flex items-center gap-2">
              <UButton icon="hugeicons:printer" color="neutral" variant="outline" @click="handlePrint" />
              <UButton icon="hugeicons:mail-send-02" label="Send" color="info" :loading="isSending" @click="handleSendEmail" />
            </div>
          </template>
        </UDashboardNavbar>

        <UDashboardToolbar v-if="permissions.canViewSettlements" class="no-print">
          <template #left>
            <!-- ADJUSTMENTS -->
            <div class="flex gap-2">
              <div v-if="isOpenAdjust" class="flex flex-col md:flex-row items-start gap-2 py-2 transition-all">
                <UInput v-model="newAdjReason" placeholder="Reason: e.g. Physical Damage" class="w-full md:min-w-60 lg:min-w-80" />
                <UFieldGroup>
                  <UInput v-model.number="newAdjAmount" type="number" :ui="{
                      base: 'pl-6 pr-2 w-30',
                      leading: 'pointer-events-none'
                    }">
                    <template #leading><p class="text-sm text-muted">$</p></template>
                  </UInput>
                  <USelect 
                    v-model="newAdjType" 
                    :items="[{value: 'deduction', label: 'Deduction'},{value: 'bonus', label: 'Bonus'}]" class="w-30" />
                </UFieldGroup>
                <div class="flex justify-between gap-2">
                  <UButton 
                    label="Apply Adjustment" 
                    :disabled="(!newAdjReason || newAdjAmount <= 0)"
                    :loading="loadingAdjust" 
                    color="primary" 
                    @click="handleAddAdjustment" />
                  <UButton label="Cancel" @click="toggleAdjustment" variant="soft" />
                </div>
              </div>
              <UButton v-else
                label="Add manual adjustment" 
                icon="hugeicons:add-money-circle"
                @click="toggleAdjustment" 
                variant="soft" />
            </div>
          </template>
        </UDashboardToolbar>
      </template>

      <template #body>
        <div v-if="settlement" class="grid gap-6 print-area">
          
          <!-- SHEET -->
          <div class="border-default rounded-lg not-print:border p-6 space-y-6">
            <!-- HEAD -->
            <div class="flex justify-between items-start px-2">
              <div class="flex flex-col gap-x-4 gap-y-12">
                <div>
                  <h1 class="text-2xl font-bold text-highlighted">
                    Weekly Statement
                  </h1>
                  <p class="text-xs text-gray-500 font-mono">
                    ID: SETT-{{ settlement.id }}
                  </p>
                </div>
                <div class="grid gap-1">
                  <p class="text-sm font-medium">
                    <span class="text-gray-500">To: </span>
                    {{ settlement.driver?.first_name }} {{ settlement.driver?.last_name }}
                  </p>
                  <p class="text-sm font-mono">
                    <span class="text-gray-500">Date Range: </span>
                    {{ settlement.start_date }} / {{ settlement.end_date }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <img src="/coast_to_coast_480x200.png" class="w-50" alt="COAST TO COAST INC." />
              </div>
            </div>

            <!-- LOADS -->
            <div class="space-y-2">
              <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                RC Detail
              </h3>
              <div class="text-highlighted text-sm">
                <div class="grid grid-cols-5 font-bold border-y border-default py-2 pb-2 px-3">
                  <span class="col-span-2">Load ID</span>
                  <span class="text-center">Miles</span>
                  <span class="text-right">Freight Amount</span>
                  <span class="text-right">Payable Amount</span>
                </div>
                <div v-for="load in settlement.loads" :key="load.id" class="grid grid-cols-5 text-sm py-1 px-3">
                  <div class="col-span-2 grid">
                    <span>
                      #{{ load.load_number }}
                      <span v-if="load.status_load === 'tonu'" class="text-red-500 font-bold text-xs">(TONU)</span>
                    </span>
                    <span class="text-gray-500 text-xs">
                      {{ `${load.shipper_address?.city || 'N/A'}, ${load.shipper_address?.state || 'N/A'}` }} - {{ `${load.receiver_address?.city || 'N/A'}, ${load.receiver_address?.state || 'N/A'}` }}
                    </span>
                  </div>
                  <span class="text-center font-mono">
                    {{ load.status_load === 'tonu' ? '0' : (load.miles || 0) }}
                  </span>
                  <span class="text-right font-mono">
                    ${{ load.status_load === 'tonu' ? load.tonu_amount : load.drivers_rate }}
                  </span>
                  <span class="text-right font-mono">
                    ${{ load.status_load === 'tonu' ? load.tonu_amount : getPayableAmount(load.drivers_rate, settlement.driver?.commission_rate) }}
                  </span>
                </div>
              </div>
              <!-- GROSS -->
              <div class="grid grid-cols-5 gap-2 dark:bg-elevated/20 p-3 text-sm font-mono text-highlighted">
                <span class="col-span-3 font-bold">
                  Gross Accumulations:
                </span>
                <span class="text-right">Freight: ${{ settlement.gross_freight }}</span>
                <span class="text-right">Payable: ${{ settlement.gross_payable }}</span>
              </div>
            </div>

            <!-- DEDUCTIONS -->
            <div class="space-y-2">
              <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Weekly Deductions
              </h3>
              <div class="space-y-2 text-sm font-mono">
                <div class="flex justify-between pb-2 px-3 border-b border-default">
                  <span>Fuel Expenses</span>
                  <span class="text-red-500">${{ settlement.total_fuel }}</span>
                </div>
                <div class="flex justify-between pb-2 px-3 border-b border-default">
                  <span>ELD</span>
                  <span>${{ settlement.driver?.deductions?.eld || 0 }}</span>
                </div>
                <div class="flex justify-between pb-2 px-3 border-b border-default">
                  <span>Insurance</span>
                  <span>${{ settlement.driver?.deductions?.insurance || 0 }}</span>
                </div>
                <div class="flex justify-between pb-2 px-3 border-b border-default">
                  <span>Plates</span>
                  <span>${{ settlement.driver?.deductions?.plates || 0 }}</span>
                </div>
                <div class="flex justify-between pb-2 px-3 border-b border-default">
                  <span>IFTA</span>
                  <span>${{ settlement.driver?.deductions?.ifta || 0 }}</span>
                </div>
                <div v-if="settlement.driver?.deductions?.other_reason" class="flex justify-between pb-2 px-3 border-b border-default">
                  <span>{{ settlement.driver?.deductions?.other_reason }}</span>
                  <span>${{ settlement.driver?.deductions?.other_cost || 0 }}</span>
                </div>
              </div>
            </div>

            <!-- EXTRA ADJUSTMENTS -->
            <div class="space-y-2" v-if="settlement.custom_adjustments?.length > 0">
              <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Extra Adjustments
              </h3>
              <div class="grid gap-2 bg-elevated/20 p-3 text-sm font-mono text-highlighted">
                <div v-for="(adj, idx) in settlement.custom_adjustments" :key="idx" class="flex items-center justify-between">
                  <span>{{ adj.reason }}</span>
                  <span :class="adj.type === 'deduction' ? 'text-red-500' : 'text-green-500'">
                    $ {{ adj.type === 'deduction' ? '-' : '+' }}{{ adj.amount }}
                  </span>
                </div>
              </div>
            </div>

            <!-- NET PAYOUT -->
            <div class="flex justify-between items-center font-bold px-3">
              <span class="text-sm text-highlighted">
                Total Amount (Net Payout):
              </span>
              <span class="text-lg" :class="(settlement.net_payout >= 0) ? 'text-primary' : 'text-red-500'">
                $ {{ settlement.net_payout }}
              </span>
            </div>
          </div>

        </div>
      </template>
    </UDashboardPanel>
  </div>
</template>