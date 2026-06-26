<!-- components/LoadList.vue -->
<script setup>
import { getPaginationRowModel } from "@tanstack/table-core";
const { imageUrl } = useConfig()

const props = defineProps({
  loads: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  currentCategory: {
    type: String,
    default: 'active'
  }
})

const emit = defineEmits(['edit', 'refresh'])

const UButton = resolveComponent("UButton");
const UDropdownMenu = resolveComponent("UDropdownMenu");
const UCheckbox = resolveComponent("UCheckbox");
const UBadge = resolveComponent("UBadge");

const table = useTemplateRef("table")
const columnFilters = ref([{ id: "load_number", value: "" }])
const columnVisibility = ref()
const rowSelection = ref({})

function getRowItems(row) {
  return [{
    type: "label",
    label: "Actions"
  },{
    label: "Edit Load",
    icon: "i-lucide-edit",
    onSelect() {
      emit('edit', row.original)
    }
  }]
}

const getStatusColor = (status) => {
  switch (status) {
    case 'not_started': return 'neutral'
    case 'in_transit': return 'primary'
    case 'loaded': return 'warning'
    case 'unloaded': return 'success'
    case 'cancelled': return 'error'
    default: return 'neutral'
  }
}

const columns = [{
  id: "select",
  header: ({ table }) =>
    h(UCheckbox, {
      modelValue: table.getIsSomePageRowsSelected()
        ? "indeterminate"
        : table.getIsAllPageRowsSelected(),
      "onUpdate:modelValue": (value) => table.toggleAllPageRowsSelected(!!value),
      ariaLabel: "Select all"
    }),
  cell: ({ row }) =>
    h(UCheckbox, {
      modelValue: row.getIsSelected(),
      "onUpdate:modelValue": (value) => row.toggleSelected(!!value),
      ariaLabel: "Select row"
    })
},{
  accessorKey: "load_number",
  header: "Load No.",
  cell: ({ row }) => h("span", { class: "font-semibold text-highlighted" }, row.original.load_number)
},{
  id: "route",
  header: "Route",
  cell: ({ row }) => {
    const shipper = row.original.shipper_address
    const receiver = row.original.receiver_address
    return h("div", { class: "text-xs" }, [
      h("p", { class: "font-medium" }, `From: ${shipper?.city || '-'}, ${shipper?.state || '-'}`),
      h("p", { class: "text-gray-400" }, shipper?.full_address || ''),
      h("p", { class: "font-medium mt-1 text-primary" }, `To: ${receiver?.city || '-'}, ${receiver?.state || '-'}`),
      h("p", { class: "text-gray-400" }, receiver?.full_address || '')
    ])
  }
},{
  id: "pickup",
  header: "Pickup",
  cell: ({ row }) => {
    const date = row.original.pickup_date || '-'
    const time = row.original.pickup_time || '-'
    return h("div", { class: "text-xs" }, [
      h("p", { class: "font-medium" }, date),
      h("p", { class: "text-gray-500" }, time)
    ])
  }
},{
  id: "driver",
  header: "Driver",
  cell: ({ row }) => {
    const driver = row.original.driver
    if (!driver) return h("span", { class: "text-red-500 text-xs" }, "Unassigned")
    const name = `${driver.first_name || ''} ${driver.last_name || ''}`.trim()
    const trailer = driver.trailer || '-'
    return h("div", { class: "text-xs" }, [
      h("p", { class: "font-medium" }, name),
      h("p", { class: "text-gray-500 font-mono" }, `Truck: ${driver.truck_number || '-'}`),
      h("p", { class: "text-gray-500 font-mono capitalize" }, `Trailer: ${trailer.replace('_', ' ')}`)
    ])
  }
},{
  id: "broker",
  header: "Broker",
  cell: ({ row }) => h("span", { class: "text-sm" }, row.original.broker?.name || '-')
},{
  accessorKey: "status_load",
  header: "Status",
  cell: ({ row }) => {
    const status = row.original.status_load || 'not_started'
    return h(UBadge, { 
      color: getStatusColor(status), 
      variant: 'soft',
      class: 'capitalize'
    }, () => status.replace('_', ' '))
  }
},{
  id: "rate_confirmation",
  header: "Rate Con.",
  cell: ({ row }) => {
    const files = row.original.doc_rate_confirmation || []
    if (!files.length) return h("span", { class: "text-gray-400 text-xs" }, "None")
    return h("div", { class: "flex flex-wrap gap-1" }, files.map((file, idx) => 
      h("a", { 
        href: `${imageUrl}${file.url}`, 
        target: "_blank", 
        class: "text-xs text-primary underline font-medium hover:text-primary/80 mr-1" 
      }, `File ${idx + 1}`)
    ))
  }
},{
  id: "actions",
  cell: ({ row }) => {
    return h("div", { class: "text-right" },
      h(UDropdownMenu, { content: { align: "end" }, items: getRowItems(row) },
        () => h(UButton, {
          icon: "i-lucide-ellipsis-vertical",
          color: "neutral",
          variant: "ghost",
          class: "ml-auto"
        })
      )
    )
  }
}]

const searchFilter = computed({
  get: () => table.value?.tableApi?.getColumn("load_number")?.getFilterValue() || "",
  set: (value) => {
    table.value?.tableApi?.getColumn("load_number")?.setFilterValue(value || undefined);
  }
})

const pagination = ref({ pageIndex: 0, pageSize: 24 })
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0 space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-1.5">
        <UInput
          v-model="searchFilter"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Search by load number..." />
      </div>
    </div>

    <UTable
      ref="table"
      v-model:column-filters="columnFilters"
      v-model:column-visibility="columnVisibility"
      v-model:row-selection="rowSelection"
      v-model:pagination="pagination"
      :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
      class="shrink-0 flex-1 overflow-auto"
      :data="loads"
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

    <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
      <div class="text-sm text-muted">
        Selected: {{ Object.keys(rowSelection).length }} of {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }}
      </div>
      <div class="flex items-center gap-1.5">
        <UPagination
          :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
          :items-per-page="table?.tableApi?.getState().pagination.pageSize"
          :total="table?.tableApi?.getFilteredRowModel().rows.length"
          @update:page="(p) => table?.tableApi?.setPageIndex(p - 1)" />
      </div>
    </div>
  </div>
</template>