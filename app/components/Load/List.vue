<!-- components/LoadList.vue -->
<script setup>
import { getPaginationRowModel } from "@tanstack/table-core";
const { imageUrl, truncate } = useConfig()

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
const UChip = resolveComponent("UChip");
const UIcon = resolveComponent("UIcon");

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
    case 'tonu': return 'error'
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
  header: "No.",
  cell: ({ row }) => h("span", { class: "font-semibold text-highlighted" }, row.original.load_number)
},{
  id: "route",
  header: "Route",
  cell: ({ row }) => {
    const shipper = row.original.shipper_address
    const receiver = row.original.receiver_address
    return h("div", { class: "text-xs" }, [
      h("p", { class: "font-medium" }, `From: ${shipper?.city || '-'}, ${shipper?.state || '-'}`),
      h("p", { class: "text-gray-400" }, truncate(shipper?.full_address, 20) || ''),
      h("p", { class: "font-medium mt-1 text-primary" }, `To: ${receiver?.city || '-'}, ${receiver?.state || '-'}`),
      h("p", { class: "text-gray-400" }, truncate(receiver?.full_address, 20) || '')
    ])
  }
},{
  id: "pickup",
  header: "Date",
  cell: ({ row }) => {
    const pickup = row.original.pickup_date || '-'
    const rawTime = row.original.pickup_time || '-'
    const time = rawTime ? rawTime.slice(0, 5) : '-'
    const delivery = row.original.delivery_date || '-'
    return h("div", { class: "flex flex-col gap-1 text-xs font-mono" }, [
      h("div", undefined, [
        h("p", { class: "text-gray-500" }, "Pickup:"),
        h("p", undefined, pickup),
        h(UBadge, { label: time, size: 'xs' })
      ]),
      h("div", undefined, [
        h("p", { class: "text-gray-500" }, "Delivery:"),
        h("p", undefined, delivery),
      ])
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
  header: "Docs.",
  cell: ({ row }) => {
    const rcFiles = row.original.doc_rate_confirmation || []
    const pbFiles = row.original.doc_pod_bol || []

    return h("div", { class: "flex flex-col gap-1 text-xs font-mono" }, [
      
      rcFiles.length ? h("div", { class: "flex gap-1" }, rcFiles.map(file => {
        const fileType = (file.ext ? file.ext.replace(/^\./, '') : 'file').toUpperCase()
        return h("a", { 
          href: `${imageUrl}${file.url}`, 
          target: "_blank",
          class: "flex gap-1"
        }, [
          h(UIcon, { class: "w-8 h-8 text-gray-500", color: 'neutral', name: "hugeicons:document-attachment" }),
          h("div", { class: "flex flex-col" }, [
            h("span", { class: "text-gray-500" }, "Rate Con."),
            h(UBadge, { label: fileType, size: 'xs', variant: 'link' })
          ])
        ])
      })) : h("span", { class: "text-gray-500" }, "Rate Con. None"),

      pbFiles.length ? h("div", { class: "flex flex-wrap gap-1" }, pbFiles.map(file => {
        const fileType = (file.ext ? file.ext.replace(/^\./, '') : 'file').toUpperCase()
        return h("a", { 
          href: `${imageUrl}${file.url}`, 
          target: "_blank",
          class: "flex items-center gap-1 "
        }, [
          h(UIcon, { class: "w-8 h-8 text-gray-500", color: 'neutral', name: "hugeicons:document-attachment" }),
          h("div", { class: "flex flex-col" }, [
            h("span", { class: "text-gray-500" }, "POD/BOL"),
            h(UBadge, { label: fileType, size: 'xs', variant: 'link' })
          ])
        ])
      })) : h("span", { class: "text-gray-500" }, "POD/BOL: None")

    ])
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