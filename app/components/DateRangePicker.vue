<!-- components/DateRangePicker.vue -->
<script setup>
import {
  DateFormatter,
  getLocalTimeZone,
  CalendarDate,
  today,
} from "@internationalized/date";

const props = defineProps({
  maxDaysLimit: {
    type: Number,
    default: null,
  },
});

const isOpen = ref(false);

// Вычисляем минимальную доступную дату
const minCalendarDate = computed(() => {
  if (!props.maxDaysLimit) return undefined;
  return today(getLocalTimeZone()).subtract({ days: props.maxDaysLimit });
});
// Ограничиваем выбор будущих дат сегодняшним днем
const maxCalendarDate = computed(() => today(getLocalTimeZone()));
const filteredRanges = computed(() => {
  if (!props.maxDaysLimit) return ranges;
  return ranges.filter((range) => {
    let rangeDays = 0;
    if (range.days) rangeDays = range.days;
    else if (range.months) rangeDays = range.months * 30;
    else if (range.years) rangeDays = range.years * 365;
    return rangeDays <= props.maxDaysLimit;
  });
});

const df = new DateFormatter("en-US", {
  dateStyle: "medium",
});

const selected = defineModel({ required: true });
const ranges = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 14 days", days: 14 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 3 months", months: 3 },
  { label: "Last 6 months", months: 6 },
  { label: "Last year", years: 1 },
];

const toCalendarDate = (date) => {
  return new CalendarDate(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
  );
};

const calendarRange = computed({
  get: () => ({
    start: selected.value?.start
      ? toCalendarDate(selected.value.start)
      : undefined,
    end: selected.value?.end 
      ? toCalendarDate(selected.value.end) 
      : undefined,
  }),
  set: (newValue) => {
    selected.value = {
      start: newValue?.start 
        ? newValue.start.toDate(getLocalTimeZone()) 
        : undefined,
      end: newValue?.end 
        ? newValue.end.toDate(getLocalTimeZone()) 
        : undefined,
    };
    if (newValue?.start && newValue?.end) {
      isOpen.value = false;
    }
  },
});

const isRangeSelected = (range) => {
  if (!selected.value.start || !selected.value.end) return false;

  const currentDate = today(getLocalTimeZone());
  let startDate = currentDate.copy();

  if (range.days) {
    startDate = startDate.subtract({ days: range.days });
  } else if (range.months) {
    startDate = startDate.subtract({ months: range.months });
  } else if (range.years) {
    startDate = startDate.subtract({ years: range.years });
  }

  const selectedStart = toCalendarDate(selected.value.start);
  const selectedEnd = toCalendarDate(selected.value.end);

  return (
    selectedStart.compare(startDate) === 0 &&
    selectedEnd.compare(currentDate) === 0
  );
};

const selectRange = (range) => {
  const endDate = today(getLocalTimeZone());
  let startDate = endDate.copy();

  if (range.days) {
    startDate = startDate.subtract({ days: range.days });
  } else if (range.months) {
    startDate = startDate.subtract({ months: range.months });
  } else if (range.years) {
    startDate = startDate.subtract({ years: range.years });
  }
  selected.value = {
    start: startDate.toDate(getLocalTimeZone()),
    end: endDate.toDate(getLocalTimeZone()),
  };
  isOpen.value = false;
};
</script>
<template>
  <UPopover v-model:open="isOpen" :content="{ align: 'start' }" :modal="true">
    <UButton
      color="neutral"
      variant="ghost"
      icon="hugeicons:calendar-03"
      class="data-[state=open]:bg-elevated group">
      <span class="truncate">
        <template v-if="selected.start">
          <template v-if="selected.end">
            {{ df.format(selected.start) }} - {{ df.format(selected.end) }}
          </template>
          <template v-else>
            {{ df.format(selected.start) }}
          </template>
        </template>
        <template v-else>Pick a date</template>
      </span>

      <template #trailing>
        <UIcon
          name="i-lucide-chevron-down"
          class="shrink-0 text-dimmed size-5 group-data-[state=open]:rotate-180 transition-transform duration-200" />
      </template>
    </UButton>

    <template #content>
      <div class="flex items-stretch sm:divide-x divide-default">
        <div class="hidden sm:flex flex-col justify-center">
          <UButton
            v-for="(range, index) in filteredRanges"
            :key="index"
            :label="range.label"
            color="neutral"
            variant="ghost"
            class="rounded-none px-4"
            :class="[isRangeSelected(range) ? 'bg-elevated' : 'hover:bg-elevated/50']"
            @click="selectRange(range)" 
            truncate />
        </div>

        <UCalendar
          v-model="calendarRange"
          class="p-2"
          :number-of-months="2"
          :min-value="minCalendarDate"
          :max-value="maxCalendarDate"
          range />
      </div>
    </template>
  </UPopover>
</template>
