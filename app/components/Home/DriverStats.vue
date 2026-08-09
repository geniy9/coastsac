<!-- components/HomeDriverStats.vue -->
<script setup>
import { h, ref, computed, useTemplateRef } from 'vue'
import { useElementSize } from '@vueuse/core'
import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, startOfWeek } from 'date-fns'
import { VisXYContainer, VisLine, VisAxis, VisCrosshair, VisTooltip } from '@unovis/vue'

const props = defineProps({
  period: { type: null, required: true },
  range: { type: null, required: true },
  chartData: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})

const cardRef = useTemplateRef("cardRef")
const { width } = useElementSize(cardRef)
const currentView = ref('table') // 'table' | 'chart'

const colors = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
]

function formatCurrency(value) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  })
}

function formatWeight(value) {
  return `${value.toLocaleString("en-US")}`
}

// Агрегируем общие данные по каждому водителю за период
const driverStats = computed(() => {
  const driversMap = {}

  props.chartData.forEach(load => {
    const driver = load.driver
    const driverId = driver?.documentId || 'unassigned'
    const driverName = driver ? `${driver.first_name || ''} ${driver.last_name || ''}`.trim() : 'Unassigned'

    if (!driversMap[driverId]) {
      driversMap[driverId] = {
        id: driverId,
        name: driverName,
        loadsCount: 0,
        totalWeight: 0,
        driverGross: 0,
        originalGross: 0,
        loads: []
      }
    }

    const stats = driversMap[driverId]
    stats.loadsCount += 1
    stats.totalWeight += Number(load.weight) || 0
    stats.driverGross += Number(load.drivers_rate) || 0

    const originalRate = load.status_load === 'tonu' ? (load.tonu_amount || 0) : (load.original_rate || 0)
    stats.originalGross += Number(originalRate) || 0
    stats.loads.push(load)
  })

  return Object.values(driversMap).sort((a, b) => b.originalGross - a.originalGross)
})

// Форматируем данные для отображения графиков водителей на временной шкале
const chartDataFormatted = computed(() => {
  if (!props.range?.start || !props.range?.end) return []

  const dates = {
    daily: eachDayOfInterval,
    weekly: eachWeekOfInterval,
    monthly: eachMonthOfInterval,
  }[props.period](props.range)

  const drivers = driverStats.value

  return dates.map((date) => {
    const row = { date }
    
    drivers.forEach(driver => {
      let amount = 0
      const rawLoads = driver.loads

      if (props.period === "daily") {
        const dateStr = format(date, "yyyy-MM-dd")
        amount = rawLoads
          .filter(load => load.pickup_date === dateStr)
          .reduce((sum, load) => {
            const rate = load.status_load === 'tonu' ? (load.tonu_amount || 0) : (load.original_rate || 0)
            return sum + (Number(rate) || 0)
          }, 0)
      } else if (props.period === "weekly") {
        const startOfW = startOfWeek(date, { weekStartsOn: 1 })
        const endOfW = new Date(startOfW)
        endOfW.setDate(endOfW.getDate() + 6)

        amount = rawLoads
          .filter(load => {
            if (!load.pickup_date) return false
            const [year, month, day] = load.pickup_date.split('-').map(Number)
            const pDate = new Date(year, month - 1, day)
            return pDate >= startOfW && pDate <= endOfW
          })
          .reduce((sum, load) => {
            const rate = load.status_load === 'tonu' ? (load.tonu_amount || 0) : (load.original_rate || 0)
            return sum + (Number(rate) || 0)
          }, 0)
      } else if (props.period === "monthly") {
        const monthStr = format(date, "yyyy-MM")
        amount = rawLoads
          .filter(load => load.pickup_date && load.pickup_date.startsWith(monthStr))
          .reduce((sum, load) => {
            const rate = load.status_load === 'tonu' ? (load.tonu_amount || 0) : (load.original_rate || 0)
            return sum + (Number(rate) || 0)
          }, 0)
      }

      row[driver.id] = amount
    })

    return row
  })
})

const columns = [{
  accessorKey: "name",
  header: "Driver",
  cell: ({ row }) => h("span", { class: "font-semibold text-highlighted" }, row.original.name)
}, {
  accessorKey: "loadsCount",
  header: "Loads Completed",
  meta: { class: { th: 'text-center', td: 'text-center' }},
  cell: ({ row }) => h("span", undefined, row.original.loadsCount)
}, {
  accessorKey: "totalWeight",
  header: "Total Weight (lbs)",
  meta: { class: { th: 'text-center', td: 'text-center' }},
  cell: ({ row }) => h("span", undefined, formatWeight(row.original.totalWeight))
}, {
  accessorKey: "driverGross",
  header: "Driver's Gross",
  meta: { class: { th: 'text-right', td: 'text-right font-semibold' }},
  cell: ({ row }) => h("span", { class: "text-primary" }, formatCurrency(row.original.driverGross))
}, {
  accessorKey: "originalGross",
  header: "Original Gross",
  meta: { class: { th: 'text-right', td: 'text-right font-semibold' }},
  cell: ({ row }) => h("span", { class: "text-highlighted" }, formatCurrency(row.original.originalGross))
}]

const x = (_, i) => i

const formatDateLabel = (date) => {
  return {
    daily: format(date, "d MMM"),
    weekly: format(date, "d MMM"),
    monthly: format(date, "MMM yyyy"),
  }[props.period]
}

const xTicks = (i) => {
  if (i === 0 || i === chartDataFormatted.value.length - 1 || !chartDataFormatted.value[i]) {
    return ""
  }
  return formatDateLabel(chartDataFormatted.value[i].date)
}

const template = (d) => {
  const dateStr = formatDateLabel(d.date)
  let html = `<div class="p-2 font-sans text-xs min-w-[180px]"><strong>${dateStr}</strong><hr class="my-1 border-neutral-700"/>`
  
  driverStats.value.forEach((driver, index) => {
    const val = d[driver.id] || 0
    if (val > 0) {
      const color = colors[index % colors.length]
      html += `
        <div class="flex items-center gap-2 justify-between mt-1">
          <span class="flex items-center gap-1.5 text-gray-400">
            <span class="w-2 h-2 rounded-full inline-block" style="background-color: ${color}"></span>
            ${driver.name}
          </span>
          <span class="font-semibold text-white">${formatCurrency(val)}</span>
        </div>`
    }
  })
  
  html += `</div>`
  return html
}
</script>
<template>
  <UCard ref="cardRef" :ui="{ root: 'overflow-visible', body: 'p-0!' }">
    <template #header>
      <div class="flex justify-between items-center">
        <div>
          <h3 class="text-base font-semibold text-highlighted">Driver Performance</h3>
          <p class="text-xs text-muted">Statistics and gross breakdown per driver for the selected period</p>
        </div>
        
        <div class="flex gap-1 bg-neutral-900/50 p-1 rounded-lg border border-default">
          <UButton 
            size="xs" 
            :variant="currentView === 'table' ? 'solid' : 'ghost'" 
            color="neutral" 
            @click="currentView = 'table'">
            Table
          </UButton>
          <UButton 
            size="xs" 
            :variant="currentView === 'chart' ? 'solid' : 'ghost'" 
            color="neutral" 
            @click="currentView = 'chart'">
            Chart
          </UButton>
        </div>
      </div>
    </template>

    <div v-if="loading" class="flex items-center justify-center py-12">
      <p class="text-xs text-primary animate-pulse pb-1 font-mono">Updating driver stats...</p>
    </div>

    <div v-else-if="driverStats.length === 0" class="flex items-center justify-center py-12">
      <p class="text-sm text-gray-500">No driver data for this period</p>
    </div>

    <div v-else class="p-4">
      <!-- Табличный вид -->
      <UTable
        v-if="currentView === 'table'"
        :data="driverStats"
        :columns="columns"
        class="overflow-auto"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default py-3',
          separator: 'h-0'
        }" />

      <!-- Графический вид -->
      <div v-else-if="currentView === 'chart'" class="pt-4">
        <VisXYContainer :data="chartDataFormatted" :padding="{ top: 20, bottom: 10 }" class="h-80" :width="width">
          <VisLine 
            v-for="(driver, index) in driverStats" 
            :key="driver.id" 
            :x="x" 
            :y="d => d[driver.id]" 
            :color="colors[index % colors.length]" />
          <VisAxis type="x" :x="x" :tick-format="xTicks" />
          <VisCrosshair color="var(--ui-primary)" :template="template" />
          <VisTooltip />
        </VisXYContainer>
        
        <!-- Легенда графика -->
        <div class="flex flex-wrap gap-4 mt-4 px-4 justify-center">
          <div 
            v-for="(driver, index) in driverStats" 
            :key="driver.id" 
            class="flex items-center gap-1.5 text-xs">
            <span class="w-3 h-3 rounded-full inline-block" :style="{ backgroundColor: colors[index % colors.length] }"></span>
            <span class="text-gray-400 font-medium">{{ driver.name }}</span>
          </div>
        </div>
      </div>
    </div>
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