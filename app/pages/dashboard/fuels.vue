<!-- pages/dashboard/fuels.vue -->
<script setup>
definePageMeta({ layout: 'dashboard' })

const { permissions } = useRolePermissions()
const client = useStrapiClient()
const { getCards, getProcessedTransactions } = useFuel()

const isDetailsOpen = ref(false)
const selectedCard = ref(null)

const getThisMonday = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};
const dateRange = ref({
  start: getThisMonday(),
  end: new Date(),
});

const df = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });
const dateRangeLabel = computed(() => {
  if (!dateRange.value?.start) return "";
  if (!dateRange.value?.end) return df.format(dateRange.value.start);
  return `${df.format(dateRange.value.start)} - ${df.format(dateRange.value.end)}`;
});

const getApiDateParams = (range) => {
  if (!range?.start || !range?.end) return {};

  const startDate = new Date(range.start);
  const endDate = new Date(range.end);
  startDate.setUTCHours(0, 0, 0, 0);
  endDate.setUTCHours(23, 59, 59, 999);

  return {
    start_timestamp: startDate.toISOString(),
    end_timestamp: endDate.toISOString(),
  };
};

const { data: driversResponse } = await useAsyncData('drivers-simple', () => 
  client('/drivers', {
    query: {
      fields: ['first_name', 'last_name', 'fuel_card_number', 'truck_number', 'driver_number']
    }
  }), {
    default: () => ({ data: [] })
  }
)
const drivers = computed(() => driversResponse.value?.data || [])

// Загружаем список карт
const { data: cardsResponse, status: cardsStatus } = await useAsyncData('fuel-cards', async () => {
  const res = await getCards()
  return res?.data || []
}, {
  lazy: true,
  default: () => []
})
const cards = computed(() => cardsResponse.value || [])

// Загружаем транзакции динамически на основе меток времени
const { data: transactionsResponse, status: txsStatus, refresh: refreshTxs } = await useAsyncData(
  'fuel-transactions',
  () => {
    const params = getApiDateParams(dateRange.value)
    return getProcessedTransactions(params)
  },{
    watch: [dateRange],
    default: () => ({ data: [] })
  }
)

// Извлекаем массив транзакций из структуры JSON:API
const transactions = computed(() => transactionsResponse.value?.data || [])

// Суммирование расходов по картам
const totalSpending = computed(() => {
  return cards.value.reduce((total, card) => {
    const cardTxs = transactions.value.filter(tx => {
      const attrs = tx.attributes || {}
      return String(attrs.card_id) === String(card.id) || attrs.card_number === card.card_number
    })
    const cardSum = cardTxs.reduce((sum, tx) => {
      const attrs = tx.attributes || {}
      return sum + Number(attrs.net_amount || attrs.gross_amount || 0)
    }, 0)
    return total + cardSum
  }, 0)
})

const handleViewCard = (card) => {
  selectedCard.value = card
  isDetailsOpen.value = true
}

const handleRefresh = async () => { await refreshTxs() }
useHead({ title: 'Fuels' })
</script>
<template>
  <div class="dashboard_main">
    <UDashboardPanel id="fuels">
      <template #header>
        <UDashboardNavbar title="Fuel Accounting">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
          <template #right>
            <UButton v-if="permissions.canViewFuels"
              icon="hugeicons:reload" 
              variant="soft" 
              color="neutral" 
              :loading="txsStatus === 'pending' || cardsStatus === 'pending'"
              @click="handleRefresh" />
          </template>
        </UDashboardNavbar>

        <UDashboardToolbar v-if="permissions.canViewStats">
          <template #left>
            <DateRangePicker v-model="dateRange" :max-days-limit="90" />
          </template>
        </UDashboardToolbar>
      </template>

      <template #body>
        <div v-if="permissions.canViewFuels" class="flex-1 flex flex-col min-h-0 gap-4">
          
          <FuelStats 
            :total-spending="totalSpending"
            :active-cards-count="cards.filter(c => c.attributes?.status === 'Active' || c.status === 'Active').length"
            :total-cards-count="cards.length"
            :linked-drivers-count="drivers.filter(d => d.fuel_card_number).length"
            :date-range-label="dateRangeLabel" />

          <!-- CARDS -->
          <FuelList 
            :cards="cards" 
            :drivers="drivers" 
            :transactions="transactions" 
            :loading="txsStatus === 'pending' || cardsStatus === 'pending'"
            :date-range="dateRange"
            @view-card="handleViewCard" />

          <!-- CARD DETAILS -->
          <FuelCard 
            v-model:open="isDetailsOpen" 
            :card="selectedCard" 
            :transactions="transactions" />
        </div>

        <div v-else class="flex-1 flex items-center justify-center p-4">
          <p class="text-muted">
            You do not have access rights to this section.
          </p>
        </div>
      </template>
    </UDashboardPanel>
  </div>
</template>