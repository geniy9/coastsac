<!-- components/FuelStats.vue -->
<script setup>
const props = defineProps({
  totalSpending: {
    type: Number,
    required: true
  },
  activeCardsCount: {
    type: Number,
    required: true
  },
  totalCardsCount: {
    type: Number,
    required: true
  },
  linkedDriversCount: {
    type: Number,
    required: true
  },
  dateRangeLabel: {
    type: String,
    default: 'Period'
  }
})

function formatCurrency(value) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  })
}
</script>

<template>
  <UPageGrid class="lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-px">
    <!-- Spending -->
    <UPageCard
      icon="hugeicons:briefcase-dollar"
      :title="`Total Spending (${dateRangeLabel})`"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading: 'p-2.5 rounded-full bg-primary/10 flex-col',
        title: 'font-normal text-muted text-xs uppercase',
      }"
      class="lg:rounded-none first:rounded-l-lg hover:z-1"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl font-semibold text-highlighted">
          {{ formatCurrency(props.totalSpending) }}
        </span>
      </div>
    </UPageCard>

    <!-- Active Cards -->
    <UPageCard
      icon="hugeicons:credit-card"
      title="Active Cards"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading: 'p-2.5 rounded-full bg-primary/10 flex-col',
        title: 'font-normal text-muted text-xs uppercase',
      }"
      class="lg:rounded-none hover:z-1"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl font-semibold text-highlighted">
          {{ props.activeCardsCount }}
        </span>
        <span class="text-xs text-muted">/ {{ props.totalCardsCount }}</span>
      </div>
    </UPageCard>

    <!-- Linked Drivers -->
    <UPageCard
      icon="hugeicons:checkmark-circle-03"
      title="Drivers Linked"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading: 'p-2.5 rounded-full bg-primary/10 flex-col',
        title: 'font-normal text-muted text-xs uppercase',
      }"
      class="lg:rounded-none last:rounded-r-lg hover:z-1"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl font-semibold text-highlighted">
          {{ props.linkedDriversCount }}
        </span>
      </div>
    </UPageCard>
  </UPageGrid>
</template>