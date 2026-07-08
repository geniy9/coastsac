<!-- pages/dashboard/fuels.vue -->
<script setup>
definePageMeta({
  layout: 'dashboard'
})

const { permissions } = useRolePermissions()
const client = useStrapiClient()
const { getCards, getProcessedTransactions } = useFuel()

const isDetailsOpen = ref(false)
const selectedCard = ref(null)
const dateRange = ref('this_week')

const dateRangeOptions = [
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'last_30', label: 'Last 30 Days' },
  { value: 'all', label: 'All Time (Max 90 days)' }
]

// Функция генерации точных параметров даты для API
const getApiDateParams = (range) => {
  const now = new Date()
  
  let startDate
  let endDate = new Date() // Сегодня
  
  if (range === 'this_week') {
    const day = now.getDay()
    const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Понедельник текущей недели
    startDate = new Date(now.setDate(diff))
  } else if (range === 'last_week') {
    const day = now.getDay()
    const diffToThisMonday = now.getDate() - day + (day === 0 ? -6 : 1)
    startDate = new Date()
    startDate.setDate(diffToThisMonday - 7) // Понедельник прошлой недели
    
    endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 6) // Воскресенье прошлой недели
  } else if (range === 'last_30') {
    startDate = new Date()
    startDate.setDate(now.getDate() - 30)
  } else {
    // Для "All Time" ставим ограничение в 90 дней согласно документации API
    startDate = new Date()
    startDate.setDate(now.getDate() - 90)
  }
  
  // Устанавливаем начало дня для стартовой даты и конец дня для конечной
  startDate.setUTCHours(0, 0, 0, 0)
  endDate.setUTCHours(23, 59, 59, 999)
  
  return {
    start_timestamp: startDate.toISOString(),
    end_timestamp: endDate.toISOString()
  }
}

// Загружаем список водителей из Strapi
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

// Загружаем транзакции динамически на основе вычисленных меток времени
const { data: transactionsResponse, status: txsStatus, refresh: refreshTxs } = await useAsyncData(
  'fuel-transactions',
  () => {
    const params = getApiDateParams(dateRange.value)
    return getProcessedTransactions(params)
  },
  {
    watch: [dateRange], // Срабатывает автоматически при изменении выбранного диапазона
    default: () => ({ data: [] }) // Корректная обработка структуры { data: [...] }
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

const handleRefresh = async () => {
  await refreshTxs()
}
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
            <div v-if="permissions.canViewFuels" class="flex items-center gap-2">
              <USelect v-model="dateRange" :items="dateRangeOptions" class="w-48" />
              <UButton 
                icon="hugeicons:reload" 
                variant="ghost" 
                color="neutral" 
                :loading="txsStatus === 'pending' || cardsStatus === 'pending'"
                @click="handleRefresh" />
            </div>
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <div v-if="permissions.canViewFuels" class="flex-1 flex flex-col min-h-0 gap-4">
          
          <FuelStats 
            :total-spending="totalSpending"
            :active-cards-count="cards.filter(c => c.attributes?.status === 'Active' || c.status === 'Active').length"
            :total-cards-count="cards.length"
            :linked-drivers-count="drivers.filter(d => d.fuel_card_number).length"
            :date-range-label="dateRangeOptions.find(o => o.value === dateRange)?.label" />

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