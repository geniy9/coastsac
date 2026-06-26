<script setup>
const props = defineProps({
  period: { 
    type: null, 
    required: true
  },
  range: { 
    type: null, 
    required: true
  },
});

function formatCurrency(value) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

const baseStats = [{
  title: "Gross",
  icon: "hugeicons:dollar-01",
  minValue: 200000,
  maxValue: 500000,
  minVariation: -20,
  maxVariation: 30,
  formatter: formatCurrency,
},{
  title: "Active trucks",
  icon: "hugeicons:tanker-truck",
  minValue: 1000,
  maxValue: 2000,
  minVariation: -10,
  maxVariation: 20,
},{
  title: "Loads completed",
  icon: "hugeicons:pie-chart",
  minValue: 100,
  maxValue: 300,
  minVariation: -5,
  maxVariation: 15,
},{
  title: "Drivers",
  icon: "hugeicons:user-group-02",
  minValue: 400,
  maxValue: 1000,
  minVariation: -15,
  maxVariation: 25,
}];

const { data: stats } = await useAsyncData("stats",
  async () => {
    return baseStats.map((stat) => {
      const value = randomInt(stat.minValue, stat.maxValue);
      const variation = randomInt(stat.minVariation, stat.maxVariation);

      return {
        title: stat.title,
        icon: stat.icon,
        value: stat.formatter ? stat.formatter(value) : value,
        variation,
      };
    });
  },
  {
    watch: [() => props.period, () => props.range],
    default: () => [],
  },
);
</script>
<template>
  <UPageGrid class="lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-px">
    <UPageCard
      v-for="(stat, index) in stats"
      :key="index"
      :icon="stat.icon"
      :title="stat.title"
      to="/drivers"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading: 'p-2.5 rounded-full bg-primary/10 flex-col',
        title: 'font-normal text-muted text-xs uppercase',
      }"
      class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1">
      <div class="flex items-center gap-2">
        <span class="text-2xl font-semibold text-highlighted">
          {{ stat.value }}
        </span>

        <UBadge
          :color="stat.variation > 0 ? 'success' : 'error'"
          variant="subtle"
          class="text-xs">
          {{ stat.variation > 0 ? "+" : "" }}{{ stat.variation }}%
        </UBadge>
      </div>
    </UPageCard>
  </UPageGrid>
</template>
