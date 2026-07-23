<!-- components/TablePagination.vue -->
<script setup>
const props = defineProps({
  tableApi: {
    type: Object,
    default: null
  },
  selectedCount: {
    type: Number,
    default: 0
  },
  showLimit: {
    type: Boolean,
    default: true
  },
  totalLabel: {
    type: String,
    default: ''
  },
  total: {
    type: Number,
    default: 0
  }
})

const limit = defineModel('limit', { type: Number, default: 25 })
const page = defineModel('page', { type: Number, default: 1 })

const totalRows = computed(() => {
  if (props.tableApi) {
    return props.tableApi.getFilteredRowModel()?.rows?.length || 0
  }
  return props.total
})
const pageIndex = computed(() => {
  if (props.tableApi) {
    return props.tableApi.getState()?.pagination?.pageIndex ?? 0
  }
  return page.value - 1
})
const pageSize = computed(() => {
  if (props.tableApi) {
    return props.tableApi.getState()?.pagination?.pageSize ?? 25
  }
  return limit.value
})
const isVisible = computed(() => {
  if (props.showLimit) {
    return totalRows.value > 25
  }
  return totalRows.value > pageSize.value
})
const setPage = (p) => {
  if (props.tableApi) {
    props.tableApi.setPageIndex(p - 1)
  } else {
    page.value = p
  }
}

watch(() => props.tableApi, (api) => {
    if (api) api.setPageSize(limit.value)
  },
  { immediate: true }
)
if (props.showLimit) {
  watch(limit, (newVal) => {
    if (props.tableApi) {
      props.tableApi.setPageSize(newVal)
      props.tableApi.setPageIndex(0)
    }
  })
}
</script>
<template>
  <ClientOnly>
    <div v-if="isVisible" class="flex items-center justify-between gap-3 mt-auto">
      <div class="flex items-center gap-4 text-sm text-muted">
        <USelectMenu 
          v-if="showLimit" 
          v-model="limit" 
          :items="[25, 50, 100]" 
          class="w-16" 
          size="sm" />
        <span>
          <template v-if="totalLabel">{{ totalLabel }}: {{ totalRows }}</template>
          <template v-else>Selected: {{ selectedCount }} of {{ totalRows }}</template>
        </span>
      </div>
      <div class="flex items-center gap-1.5">
        <UPagination 
          size="sm"
          :default-page="pageIndex + 1"
          :items-per-page="pageSize"
          :total="totalRows"
          @update:page="setPage" />
      </div>
    </div>
  </ClientOnly>
</template>