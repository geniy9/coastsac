// components/HomeStats.vue
<script setup>
const props = defineProps({
  data: {
    type: Object,
    default: () => null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

function formatCurrency(value) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

const stats = computed(() => {
  if (!props.data) return []
  return [{
    title: "Gross",
    icon: "hugeicons:briefcase-dollar",
    value: formatCurrency(props.data.totalGross || 0),
    isClickable: false,
    color: 'primary'
  },{
    title: "Active trucks",
    icon: "hugeicons:tanker-truck",
    value: props.data.activeCount || 0,
    isClickable: true,
    to: "/dashboard/loads",
    color: 'primary'
  },{
    title: "Loads completed",
    icon: "hugeicons:checkmark-circle-03",
    value: props.data.completedCount || 0,
    isClickable: true,
    to: "/dashboard/loads",
    color: 'primary'
  },{
    title: "Tasks",
    icon: "hugeicons:alert-02",
    value: props.data.activeTasksCount || 0,
    isClickable: true,
    to: "/dashboard/tasks",
    color: 'error'
  }]
})
</script>
<template>
  <div v-if="loading && stats.length === 0" class="flex items-center justify-center py-8">
    <p class="text-xs text-gray-500">Updating statistics...</p>
  </div>
  
  <UPageGrid v-else class="lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-px">
    <UPageCard
      v-for="(stat, index) in stats"
      :key="index"
      :icon="stat.icon"
      :title="stat.title"
      :to="stat.isClickable ? stat.to : undefined"
      spotlight
      spotlight-color="primary"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading: (stat.color === 'error' && stat.value > 0 )
          ? 'p-2.5 rounded-full bg-red-500/10 text-red-500 flex-col' 
          : 'p-2.5 rounded-full bg-primary/10 text-primary flex-col',
        title: 'font-normal text-muted text-xs uppercase',
        leadingIcon: (stat.color === 'error' && stat.value > 0) ? 'text-red-500' : 'text-primary'
      }"
      class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1 transition-all duration-200"
      :class="{ 'hover:border-primary/50 cursor-pointer': stat.isClickable }">
      
      <div class="flex items-center gap-2">
        <span class="text-2xl font-semibold text-highlighted">
          {{ stat.value }}
        </span>
      </div>
      
    </UPageCard>
  </UPageGrid>
</template>