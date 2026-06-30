<!-- components/FuelCard.vue -->
<script setup>
const open = defineModel('open', { type: Boolean, default: false })
const props = defineProps({
  card: {
    type: Object,
    default: null
  },
  transactions: {
    type: Array,
    default: () => []
  }
})

const { getCardInfo } = useFuel()

const cardDetails = ref(null)
const loading = ref(false)

watch(() => props.card, async (newCard) => {
  if (newCard) {
    loading.value = true
    cardDetails.value = null
    try {
      const response = await getCardInfo(newCard.id)
      cardDetails.value = response?.data?.attributes || null
    } catch (e) {
      console.error("Failed to load full card info:", e)
    } finally {
      loading.value = false
    }
  }
}, { immediate: true })

const filteredTxs = computed(() => {
  if (!props.card) return []
  return props.transactions.filter(tx => {
    const attrs = tx.attributes || {}
    return String(attrs.card_id) === String(props.card.id) || attrs.card_number === props.card.card_number
  })
})
</script>

<template>
  <UModal v-model:open="open" :ui="{ width: 'max-w-4xl' }">
    <template #content>
      <div class="flex flex-col p-6 space-y-6 max-h-[85vh] overflow-y-auto">
        <!-- Заголовок -->
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-highlighted">
              Card: {{ card?.card_number }}
            </h3>
            <p class="text-xs text-gray-500">
              Details and recent transactions
            </p>
          </div>
          <UButton icon="i-lucide-x" color="neutral" variant="ghost" @click="open = false" />
        </div>

        <div v-if="loading" class="flex flex-col items-center justify-center py-12 space-y-3">
          <UIcon name="i-lucide-loader-2" class="animate-spin text-primary size-8" />
          <span class="text-sm text-muted">Loading detailed info...</span>
        </div>

        <div v-else class="space-y-6">
          <!-- Сетка с базовыми свойствами -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl border border-default bg-elevated/20">
            <div>
              <p class="text-xs text-gray-500">Status</p>
              <UBadge :color="card?.status === 'Active' ? 'success' : 'neutral'" variant="soft" class="mt-1">
                {{ card?.status }}
              </UBadge>
            </div>
            <div>
              <p class="text-xs text-gray-500">Driver Name (System)</p>
              <p class="text-sm font-medium text-highlighted mt-1">
                {{ card?.driver_name || cardDetails?.driver_name || 'N/A' }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500">Unit Number</p>
              <p class="text-sm font-medium text-highlighted mt-1">
                {{ card?.unit || cardDetails?.unit || 'N/A' }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500">VIN Number</p>
              <p class="font-mono text-highlighted mt-1 text-xs">
                {{ cardDetails?.vin || 'N/A' }}
              </p>
            </div>
          </div>

          <!-- Настройки лимитов и политик -->
          <div v-if="cardDetails" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Limits -->
            <div class="border border-default rounded-xl p-4">
              <h4 class="font-semibold text-sm text-highlighted mb-3 flex items-center gap-1.5">
                <UIcon name="i-lucide-shield-alert" class="text-warning" />
                Limits Configuration
              </h4>
              <div class="space-y-3 text-xs">
                <div v-for="limit in cardDetails.limits" :key="limit.limit_id" class="border-b border-default pb-2 last:border-none">
                  <div class="flex justify-between font-medium">
                    <span class="text-highlighted">{{ limit.limit_id }}</span>
                    <span class="text-primary">${{ limit.amount_limit }}</span>
                  </div>
                  <p class="text-gray-500 mt-1">
                    Reset days (Amt): {{ limit.amount_reset_days?.join(', ') || 'None' }}
                  </p>
                </div>
                <div v-if="!cardDetails.limits?.length" class="text-gray-500">No limits active.</div>
              </div>
            </div>

            <!-- Policies -->
            <div class="border border-default rounded-xl p-4">
              <h4 class="font-semibold text-sm text-highlighted mb-3 flex items-center gap-1.5">
                <UIcon name="i-lucide-check-square" class="text-success" />
                Product Policies
              </h4>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div 
                  v-for="policy in cardDetails.policies" 
                  :key="policy.policy_id" 
                  class="flex items-center justify-between p-2 rounded bg-elevated/30"
                >
                  <span class="text-gray-500 font-medium">{{ policy.policy_id }}</span>
                  <UBadge 
                    :color="policy.setting === 'Enabled' ? 'success' : 'neutral'" 
                    variant="soft" 
                    size="sm"
                  >
                    {{ policy.setting }}
                  </UBadge>
                </div>
              </div>
            </div>
          </div>

          <!-- Активные денежные коды -->
          <div v-if="cardDetails?.money?.length" class="border border-default rounded-xl p-4">
            <h4 class="font-semibold text-sm text-highlighted mb-3 flex items-center gap-1.5">
              <UIcon name="i-lucide-banknote" class="text-success" />
              Active Money Codes
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div v-for="money in cardDetails.money" :key="money.money_id" class="flex justify-between items-center p-3 rounded-lg border border-default">
                <div>
                  <p class="font-mono text-highlighted">Code ID: {{ money.money_id }}</p>
                  <p class="text-gray-500 mt-0.5">Exp: {{ money.expiration_date }}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-semibold text-success">${{ money.amount }}</p>
                  <UBadge color="success" size="sm" variant="soft" class="mt-1">{{ money.status }}</UBadge>
                </div>
              </div>
            </div>
          </div>

          <!-- Список обработанных транзакций -->
          <div>
            <h4 class="font-semibold text-sm text-highlighted mb-3">
              Processed Transactions
            </h4>
            <div class="border border-default rounded-xl overflow-hidden">
              <div class="max-h-60 overflow-y-auto">
                <table class="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr class="bg-elevated/50 text-gray-500 font-medium border-b border-default">
                      <th class="p-3">Date</th>
                      <th class="p-3">Merchant</th>
                      <th class="p-3">Product</th>
                      <th class="p-3 text-right">Qty</th>
                      <th class="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr 
                      v-for="tx in filteredTxs" 
                      :key="tx.id" 
                      class="border-b border-default last:border-none hover:bg-elevated/10"
                    >
                      <td class="p-3 text-gray-500">
                        {{ tx.attributes?.transaction_timestamp ? new Date(tx.attributes.transaction_timestamp).toLocaleDateString() : 'N/A' }}
                      </td>
                      <td class="p-3">
                        <p class="font-medium text-highlighted">{{ tx.attributes?.merchant_name }}</p>
                        <p class="text-gray-500 text-[10px]">{{ tx.attributes?.merchant_city }}, {{ tx.attributes?.merchant_state }}</p>
                      </td>
                      <td class="p-3 text-gray-500">
                        {{ tx.attributes?.details?.[0]?.product_name || 'N/A' }}
                      </td>
                      <td class="p-3 text-right font-mono text-gray-500">
                        {{ tx.attributes?.details?.[0]?.quantity || '-' }}
                      </td>
                      <td class="p-3 text-right font-mono font-medium text-highlighted">
                        ${{ Number(tx.attributes?.net_amount || tx.attributes?.gross_amount || 0).toFixed(2) }}
                      </td>
                    </tr>
                    <tr v-if="!filteredTxs.length">
                      <td colspan="5" class="p-6 text-center text-gray-500">
                        No transactions found for this period.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>