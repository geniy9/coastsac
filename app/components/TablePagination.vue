<!-- components/TablePagination.vue -->
<script setup>
const apiStore = useApiStore()

const props = defineProps({
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
  },
  pageSizeOptions: {
    type: Array,
    default: undefined
  }
})
const pagination = defineModel('pagination', {
  type: Object,
  default: () => ({ pageIndex: 0, pageSize: 25 })
})
const limitItems = computed(() => props.pageSizeOptions || apiStore.pageSizeOptions)
const isVisible = computed(() => props.total > 0)

const onLimitChange = (newLimit) => {
  pagination.value = {
    pageIndex: 0,
    pageSize: Number(newLimit)
  }
}
const onPageChange = (newPage) => {
  pagination.value = {
    ...pagination.value,
    pageIndex: newPage - 1
  }
}
</script>
<template>
  <div v-if="isVisible" class="flex items-center justify-between gap-3 mt-auto">
    <div class="flex items-center gap-4 text-sm text-muted">
      <USelectMenu 
        v-if="showLimit" 
        :model-value="pagination.pageSize" 
        :items="limitItems" 
        class="w-16" 
        size="sm"
        @update:model-value="onLimitChange" />
      <span>
        <template v-if="totalLabel">{{ totalLabel }}: {{ total }}</template>
        <template v-else>Selected: {{ selectedCount }} of {{ total }}</template>
      </span>
    </div>
    <div class="flex items-center gap-1.5">
      <UPagination 
        v-if="total > pagination.pageSize"
        size="sm"
        :page="pagination.pageIndex + 1"
        :items-per-page="pagination.pageSize"
        :total="total"
        @update:page="onPageChange" />
    </div>
  </div>
</template>