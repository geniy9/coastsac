<!-- pages/dashboard/settlements/[id].vue -->
<script setup>
definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const client = useStrapiClient()
const { getPayableAmount } = useConfig()
const toast = useToast()

const id = route.params.id
const isSending = ref(false)

const { data: response, refresh } = await useAsyncData(`settlement-detail-${id}`, () =>
  client(`/settlements/${id}`, {
    query: {
      populate: [
        'driver.deductions', 
        'loads'
      ]
    } 
  })
)
const settlement = computed(() => response.value?.data || null)

// Кастомные корректировки
const newAdjReason = ref('')
const newAdjAmount = ref(0)
const newAdjType = ref('deduction')

const handleAddAdjustment = async () => {
  if (!newAdjReason.value || newAdjAmount.value <= 0) return

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
  }
}

// Отправка
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
            <UButton icon="i-lucide-arrow-left" to="/dashboard/settlements" variant="ghost" />
          </template>
          <template #right>
            <div class="flex items-center gap-2">
              <UButton icon="hugeicons:printer" color="neutral" variant="outline" @click="handlePrint" />
              <UButton icon="hugeicons:mail-send-02" label="Send" color="primary" :loading="isSending" @click="handleSendEmail" />
            </div>
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <div v-if="settlement" class="grid grid-cols-1 md:grid-cols-3 gap-6 print-layout">
          
          <!-- PRINT TEMPLATE & MAIN VIEW -->
          <div class="md:col-span-2 space-y-6 printable-area">
            
            <div class="border border-default rounded-xl p-6 bg-elevated/10 space-y-6">
              
              <!-- Statement Head -->
              <div class="flex justify-between items-start">
                <div class="flex flex-col gap-x-4 gap-y-8">
                  <h1 class="text-xl font-bold text-highlighted">
                    Weekly Statement
                  </h1>
                  <div class="grid gap-2">
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
                  <h2 class="text-md font-bold text-primary">
                    COAST TO COAST INC.</h2>
                  <p class="text-xs text-gray-500 font-mono">ID: SETT-{{ settlement.id }}</p>
                </div>
              </div>

              <!-- Loads table -->
              <div class="space-y-2">
                <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  RC Detail
                </h3>
                <div class="border-y border-default py-2">
                  <div class="grid grid-cols-4 font-bold text-highlighted text-xs pb-1">
                    <span>Load ID</span>
                    <span class="text-center">Loaded Miles</span>
                    <span class="text-right">Freight Amount</span>
                    <span class="text-right">Payable Amount</span>
                  </div>
                  <div v-for="load in settlement.loads" :key="load.id" class="grid grid-cols-4 text-xs py-1 text-gray-300">
                    <span>#{{ load.load_number }}</span>
                    <span class="text-center font-mono">{{ load.miles || 0 }}</span>
                    <span class="text-right font-mono">${{ load.drivers_rate }}</span>
                    <span class="text-right font-mono">
                      ${{ getPayableAmount(load.drivers_rate, settlement.driver?.commission_rate).toFixed(2) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Aggregates / Gross -->
              <div class="flex justify-between items-center bg-elevated/40 p-3 text-xs font-bold text-highlighted">
                <span>Gross Accumulations:</span>
                <div class="flex gap-12 font-mono">
                  <span>Freight: ${{ settlement.gross_freight }}</span>
                  <span>Payable: ${{ settlement.gross_payable }}</span>
                </div>
              </div>

              <!-- Deductions ledger -->
              <div class="space-y-2">
                <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Weekly Deductions
                </h3>
                <div class="space-y-1.5 text-xs font-mono">
                  <div class="flex justify-between pb-2 border-b border-default">
                    <span>Fuel Expenses</span>
                    <span class="text-red-500">${{ settlement.total_fuel }}</span>
                  </div>
                  <div class="flex justify-between pb-2 border-b border-default">
                    <span>ELD</span>
                    <span>${{ settlement.driver?.deductions?.eld || 0 }}</span>
                  </div>
                  <div class="flex justify-between pb-2 border-b border-default">
                    <span>Insurance</span>
                    <span>${{ settlement.driver?.deductions?.insurance || 0 }}</span>
                  </div>
                  <div class="flex justify-between pb-2 border-b border-default">
                    <span>IFTA</span>
                    <span>${{ settlement.driver?.deductions?.ifta || 0 }}</span>
                  </div>
                  <div v-if="settlement.driver?.deductions?.other_reason" class="flex justify-between pb-2 border-b border-default">
                    <span>{{ settlement.driver?.deductions?.other_reason }}</span>
                    <span>${{ settlement.driver?.deductions?.other_cost || 0 }}</span>
                  </div>

                  <!-- Динамические корректировки -->
                  <div v-for="(adj, idx) in settlement.custom_adjustments" :key="idx" class="flex justify-between pb-2 border-b border-default">
                    <span>{{ adj.reason }}</span>
                    <span :class="adj.type === 'deduction' ? 'text-red-500' : 'text-green-500'">
                      {{ adj.type === 'deduction' ? '-' : '+' }}${{ adj.amount }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Net Payout -->
              <div class="flex justify-between items-center font-bold">
                <span class="text-sm text-highlighted">
                  Total Amount After Deductions (Net Payout):
                </span>
                <span class="text-lg" :class="(settlement.net_payout >= 0) ? 'text-primary' : 'text-red-500'">
                  $ {{ settlement.net_payout }}
                </span>
              </div>

            </div>

          </div>

          <!-- SIDEBAR EDIT MANUAL ADJUSTMENTS (NO PRINT) -->
          <div class="space-y-4 no-print">
            <UCard variant="soft" title="Add manual adjustment">
              <div class="grid gap-4">
                <UFormField label="Reason">
                  <UInput v-model="newAdjReason" placeholder="e.g. Physical Damage" class="w-full" />
                </UFormField>
                <div class="grid grid-cols-2 gap-2">
                  <UFormField label="Type">
                    <USelect v-model="newAdjType" :items="[{value: 'deduction', label: 'Deduction'}, {value: 'bonus', label: 'Bonus'}]" class="w-full" />
                  </UFormField>
                  <UFormField label="Amount">
                    <UInput v-model.number="newAdjAmount" type="number" :ui="{
                        base: 'pl-6 pr-2',
                        leading: 'pointer-events-none'
                      }">
                      <template #leading><p class="text-sm text-muted">$</p></template>
                    </UInput>
                  </UFormField>
                </div>
                <UButton 
                  label="Apply Adjustment" 
                  :disabled="(!newAdjReason || newAdjAmount <= 0)"
                  variant="soft" 
                  color="primary" 
                  block 
                  @click="handleAddAdjustment" />
              </div>
            </UCard>
          </div>

        </div>
      </template>
    </UDashboardPanel>
  </div>
</template>
<style>
@media print {
  body {
    background: white !important;
    color: black !important;
  }
  .no-print {
    display: none !important;
  }
  .print-layout {
    display: block !important;
  }
  .printable-area {
    width: 100% !important;
    max-width: 100% !important;
  }
}
</style>