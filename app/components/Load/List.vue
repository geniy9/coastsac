<!-- components/LoadList.vue -->
<script setup>
import { getPaginationRowModel } from "@tanstack/table-core";
const { imageUrl, getMime, truncate, getStatusColor } = useConfig()

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
const UTooltip = resolveComponent("UTooltip");
const UIcon = resolveComponent("UIcon");
const USeparator = resolveComponent("USeparator");

const table = useTemplateRef("table")
const columnFilters = ref([{ id: "load_number", value: "" }])
const columnVisibility = ref()
const rowSelection = ref({})

function getRowItems(row) {
  return [{
    label: "Edit",
    icon: "hugeicons:pencil-edit-02",
    onSelect() {
      emit('edit', row.original)
    }
  }]
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
  header: "Load",
  cell: ({ row }) => {
    const status = row.original.status_load || 'not_started'
    return h("div", { class: "flex flex-col items-start" }, [
      h("div", { class: "flex flex-col" }, [
        h("span", { class: "text-gray-500 text-xs" }, 'No.:'),
        h("span", { class: "font-semibold text-highlighted" }, `${row.original.load_number}`)
      ]),
      h("div", { class: "flex flex-col" }, [
        h("div", { class: "text-gray-500 text-xs mb-1" }, 'Status:'),
        h(UBadge, { 
          color: getStatusColor(status), 
          class: 'capitalize'
        }, () => status.replace('_', ' '))
      ])
    ])
  }
},{
  id: "route",
  header: "Route",
  cell: ({ row }) => {
    const shipper = row.original.shipper_address
    const receiver = row.original.receiver_address
    return h("div", { class: "flex flex-col text-xs text-gray-500" }, [
      h("span", undefined, [
        'From: ',
        h("span", { class: "text-highlighted" }, `${shipper?.city || '-'}, ${shipper?.state || '-'}`)
      ]),
      h(UTooltip, { text: shipper?.full_address }, [
        h('span', { class: "cursor-pointer" }, truncate(shipper?.full_address, 20) || '')
      ]),
      h("span", { class: "mt-2" }, [
        'To: ',
        h("span", { class: "text-highlighted" }, `${receiver?.city || '-'}, ${receiver?.state || '-'}`)
      ]),
      h(UTooltip, { text: receiver?.full_address }, [
        h('span', { class: "cursor-pointer" }, truncate(receiver?.full_address, 20) || '')
      ]),
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
        h("p", { class: "text-highlighted" }, pickup),
        h(UBadge, { label: time, size: 'xs', class: 'font-bold', color: 'neutral' })
      ]),
      h("div", undefined, [
        h("p", { class: "text-gray-500" }, "Delivery:"),
        h("p", { class: "text-highlighted" }, delivery),
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
    return h("div", { class: "text-xs font-mono" }, [
      h("p", { class: "text-highlighted" }, name),
      h("p", { class: "text-gray-500" }, `Truck: ${driver.truck_number || '-'}`),
      h("p", { class: "text-gray-500 capitalize" }, `Trailer: ${trailer.replace('_', ' ')}`)
    ])
  }
},{
  id: "broker",
  header: "Broker",
  cell: ({ row }) => h("span", { class: "text-highlighted text-sm" }, row.original.broker?.name || '-')
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
          h(UIcon, { class: "w-8 h-8 text-highlighted", name: "hugeicons:document-attachment" }),
          h("div", { class: "flex flex-col" }, [
            h("span", { class: "text-highlighted" }, "Rate Con."),
            h(UBadge, { label: fileType, size: 'sm', variant: 'link' })
          ])
        ])
      })) : h("span", { class: "text-gray-500" }, "Rate Con.: None"),

      pbFiles.length ? h("div", { class: "flex flex-wrap gap-1" }, pbFiles.map(file => {
        return h("a", { 
          href: `${imageUrl}${file.url}`, 
          target: "_blank",
          class: "flex items-center gap-1 "
        }, [
          h(UIcon, { class: "w-8 h-8 text-highlighted", name: "hugeicons:document-attachment" }),
          h("div", { class: "flex flex-col" }, [
            h("span", { class: "text-highlighted" }, "POD/BOL"),
            h(UBadge, { label: getMime(file), size: 'xs', variant: 'link' })
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
          icon: "hugeicons:more-vertical-circle-01",
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