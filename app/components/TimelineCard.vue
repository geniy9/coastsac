<!-- components/TimelineCard.vue -->
<script setup>
defineProps({
  title: String,
  cityState: String,
  fullAddress: String,
  date: String,
  time: String
})
</script>
<template>
  <div class="grid min-h-36 gap-2">
    <div class="flex flex-col gap-0.5 text-gray-500 text-xs">
      <span class="uppercase tracking-wider font-semibold">
        {{ title }}
      </span>
      <p class="text-sm font-bold text-highlighted">
        {{ cityState }}
      </p>
      <p class="italic">{{ fullAddress }}</p>
    </div>
    <div class="flex flex-col gap-1 text-sm font-mono text-highlighted mt-auto">
      <span v-if="date" class="flex items-center gap-1">
        <UIcon name="hugeicons:calendar-03" class="w-4 h-4" />
        {{ date }}
      </span>
      <span v-if="time" class="flex items-center gap-1">
        <UIcon name="hugeicons:clock-01" class="w-4 h-4" />
        {{ time }}
      </span>
    </div>
  </div>
</template>