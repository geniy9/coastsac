<!-- components/FuelList.vue -->
<script setup>
import { UButton, UBadge, UFieldGroup } from '#components'
import { getPaginationRowModel } from "@tanstack/table-core"

const emit = defineEmits(['view-card'])
const { copyBoofer } = useConfig()

const props = defineProps({
  cards: {
    type: Array,
    required: true
  },
  drivers: {
    type: Array,
    required: true
  },
  transactions: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const table = useTemplateRef("table")

// Связываем карты с транзакциями и водителями
const calculatedCards = computed(() => {
  return props.cards.map(card => {
    const cardAttrs = card.attributes || card

    // 1. Поиск водителя
    const matchedDriver = props.drivers.find(
      d => d.fuel_card_number && d.fuel_card_number.trim() === cardAttrs.card_number?.trim()
    )
    // 2. Поиск транзакций конкретной карты по её ID/номеру (смотрим внутрь attributes транзакции)
    const cardTxs = props.transactions.filter(tx => {
      const attrs = tx.attributes || {}
      return String(attrs.card_id) === String(card.id) || attrs.card_number === cardAttrs.card_number
    })
    // 3. Суммируем расходы (используем net_amount, либо gross_amount)
    const totalSpent = cardTxs.reduce((sum, tx) => {
      const attrs = tx.attributes || {}
      const amt = Number(attrs.net_amount || attrs.gross_amount || 0)
      return sum + amt
    }, 0)

    // Получаем последнюю транзакцию
    const lastTx = cardTxs[0] ? cardTxs[0].attributes : (cardAttrs.last_transaction || null)

    return {
      ...card,
      ...cardAttrs, // Раскрываем свойства карты для таблицы
      driver: matchedDriver,
      totalSpent,
      txCount: cardTxs.length,
      lastTx
    }
  })
})

const columns = [{
  accessorKey: "card_number",
  header: "Card",
  cell: ({ row }) => {
    const cardNum = row.original.card_number || 'Unknown'
    const status = row.original.status || 'Inactive'
    const isSuccess = status === 'Active'
    return h("div", { class: "flex flex-col items-start gap-0.5" }, [
      h(UFieldGroup, { size: 'sm' }, [
        h(UButton, {
          icon: "hugeicons:credit-card",
          color: "neutral",
          variant: "outline",
          onClick: () => copyBoofer(cardNum)
        }, () => cardNum),
        h(UButton, { 
          color: isSuccess ? 'success' : 'neutral', 
          variant: isSuccess ? 'solid' : 'soft',  
        }, () => status)
      ])
    ])
  }
}, {
  id: "assigned_driver",
  header: "Driver",
  cell: ({ row }) => {
    const driver = row.original.driver
    if (!driver) {
      return h("span", { class: "text-xs text-gray-500 italic" }, "Unassigned")
    }
    const fullName = `${driver.first_name || ''} ${driver.last_name || ''}`.trim() || 'No Name'
    return h("div", { class: "flex flex-col" }, [
      h("span", { class: "font-medium text-highlighted" }, fullName),
      h("span", { class: "text-xs text-gray-500 font-mono" }, `Unit: ${driver.truck_number || '-'}`)
    ])
  }
}, {
  id: "transactions_summary",
  header: "Transactions / Spent",
  cell: ({ row }) => {
    const amount = row.original.totalSpent
    const count = row.original.txCount
    return h("div", { class: "flex flex-col" }, [
      h("span", { class: "font-semibold text-highlighted" }, `$${amount.toFixed(2)}`),
      h("span", { class: "text-xs text-gray-500" }, `${count} transaction(s)`)
    ])
  }
}, {
  id: "last_activity",
  header: "Last Transaction",
  cell: ({ row }) => {
    const tx = row.original.lastTx
    if (!tx || (!tx.merchant_city && !tx.city && !tx.transaction_timestamp)) {
      return h("span", { class: "text-xs text-gray-500 italic" }, "No recent activity")
    }
    const city = tx.merchant_city || tx.city || ""
    const state = tx.merchant_state || tx.state || ""
    const location = [city, state].filter(Boolean).join(", ") || "Unknown"
    const date = tx.transaction_timestamp || tx.transaction_timestamp || ""
    return h("div", { class: "text-xs text-gray-500" }, [
      h("p", { class: "text-highlighted font-medium" }, location),
      date ? h("p", undefined, new Date(date).toLocaleString()) : null
    ])
  }
}, {
  id: "actions",
  header: "Details",
  meta: { class: { th: 'text-right' }},
  cell: ({ row }) => {
    return h("div", { class: "text-right" }, [
      h(UButton, {
        icon: "hugeicons:view",
        color: "neutral",
        variant: "soft",
        onClick: () => emit('view-card', row.original)
      })
    ])
  }
}]

const cardSearchFilter = computed({
  get: () => table.value?.tableApi?.getColumn("card_number")?.getFilterValue() || "",
  set: (value) => {
    table.value?.tableApi?.getColumn("card_number")?.setFilterValue(value || undefined)
  }
})
const columnFilters = ref([{ id: "card_number", value: "" }])
const pagination = ref({ pageIndex: 0, pageSize: 15 })
</script>
<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <UInput
        v-model="cardSearchFilter"
        class="max-w-full w-xs"
        icon="i-lucide-search"
        placeholder="Search by card number..." />
    </div>

    <UTable
      ref="table"
      v-model:column-filters="columnFilters"
      v-model:pagination="pagination"
      :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
      class="shrink-0 flex-1 overflow-auto"
      :data="calculatedCards"
      :columns="columns"
      :loading="loading"
      :ui="{
        base: 'table-fixed border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
        tbody: '[&>tr]:last:[&>td]:border-b-0',
        th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
        td: 'border-b border-default',
        separator: 'h-0'
      }" />
    <TablePagination 
      v-if="table?.tableApi"
      :table-api="table.tableApi"
      :show-limit="false"
      total-label="Total cards" />
  </div>
</template>