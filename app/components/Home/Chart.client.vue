<!-- components/HomeChart.vue -->
<script setup>
import {
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  format,
  startOfWeek
} from "date-fns";
import {
  VisXYContainer,
  VisLine,
  VisAxis,
  VisArea,
  VisCrosshair,
  VisTooltip,
} from "@unovis/vue";

const cardRef = useTemplateRef("cardRef");

const props = defineProps({
  period: { type: null, required: true },
  range: { type: null, required: true },
  chartData: { type: Array, default: () => [] }, // Принимаем массив грузов за выбранный период
  loading: { type: Boolean, default: false }
});

const { width } = useElementSize(cardRef);

const data = ref([]);

// Группировка данных на клиенте без повторных сетевых запросов
watch(
  [() => props.period, () => props.range, () => props.chartData],
  () => {
    if (!props.range?.start || !props.range?.end) return;

    // Генерируем массив интервалов в зависимости от выбранного периода
    const dates = {
      daily: eachDayOfInterval,
      weekly: eachWeekOfInterval,
      monthly: eachMonthOfInterval,
    }[props.period](props.range);

    const rawLoads = props.chartData || [];

    data.value = dates.map((date) => {
      let amount = 0;

      if (props.period === "daily") {
        const dateStr = format(date, "yyyy-MM-dd");
        amount = rawLoads
          .filter(load => load.delivery_date === dateStr)
          .reduce((sum, load) => sum + (Number(load.original_rate) || 0), 0);
          
      } else if (props.period === "weekly") {
        // Определяем границы текущей недели (пн - вс)
        const startOfW = startOfWeek(date, { weekStartsOn: 1 });
        const endOfW = new Date(startOfW);
        endOfW.setDate(endOfW.getDate() + 6);

        amount = rawLoads
          .filter(load => {
            if (!load.delivery_date) return false;
            const delDate = new Date(load.delivery_date);
            return delDate >= startOfW && delDate <= endOfW;
          })
          .reduce((sum, load) => sum + (Number(load.original_rate) || 0), 0);
          
      } else if (props.period === "monthly") {
        const monthStr = format(date, "yyyy-MM");
        amount = rawLoads
          .filter(load => load.delivery_date && load.delivery_date.startsWith(monthStr))
          .reduce((sum, load) => sum + (Number(load.original_rate) || 0), 0);
      }

      return {
        date,
        amount,
      };
    });
  },
  { immediate: true },
);

const x = (_, i) => i;
const y = (d) => d.amount;

const total = computed(() =>
  data.value.reduce((acc, { amount }) => acc + amount, 0),
);

const formatNumber = new Intl.NumberFormat("en", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
}).format;

const formatDate = (date) => {
  return {
    daily: format(date, "d MMM"),
    weekly: format(date, "d MMM"),
    monthly: format(date, "MMM yyyy"),
  }[props.period];
};

const xTicks = (i) => {
  if (i === 0 || i === data.value.length - 1 || !data.value[i]) {
    return "";
  }

  return formatDate(data.value[i].date);
};

const template = (d) => `${formatDate(d.date)}: ${formatNumber(d.amount)}`;
</script>

<template>
  <UCard ref="cardRef" :ui="{ root: 'overflow-visible', body: 'px-0! pt-0! pb-3!' }">
    <template #header>
      <div class="flex justify-between items-end">
        <div>
          <p class="text-xs text-muted uppercase mb-1.5">Gross (Period Sum)</p>
          <p class="text-3xl text-highlighted font-semibold">
            {{ formatNumber(total) }}
          </p>
        </div>
        <p v-if="loading" class="text-xs text-primary animate-pulse pb-1 font-mono">
          Reloading chart data...
        </p>
      </div>
    </template>

    <VisXYContainer :data="data" :padding="{ top: 40 }" class="h-64" :width="width">
      <VisLine :x="x" :y="y" color="var(--ui-primary)" />
      <VisArea :x="x" :y="y" color="var(--ui-primary)" :opacity="0.1" />
      <VisAxis type="x" :x="x" :tick-format="xTicks" />
      <VisCrosshair color="var(--ui-primary)" :template="template" />
      <VisTooltip />
    </VisXYContainer>
  </UCard>
</template>

<style scoped>
.unovis-xy-container {
  --vis-crosshair-line-stroke-color: var(--ui-primary);
  --vis-crosshair-circle-stroke-color: var(--ui-bg);

  --vis-axis-grid-color: var(--ui-border);
  --vis-axis-tick-color: var(--ui-border);
  --vis-axis-tick-label-color: var(--ui-text-dimmed);

  --vis-tooltip-background-color: var(--ui-bg);
  --vis-tooltip-border-color: var(--ui-border);
  --vis-tooltip-text-color: var(--ui-text-highlighted);
}
</style>