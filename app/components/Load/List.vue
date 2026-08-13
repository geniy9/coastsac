<!-- components/LoadList.vue -->
<script setup>
import { UButton, UDropdownMenu, UCheckbox, UBadge, UTooltip, UIcon } from '#components'
import { getPaginationRowModel } from "@tanstack/table-core";
const { imageUrl, getMime, truncate, getStatusColor } = useConfig()
const { permissions } = useRolePermissions()
const emit = defineEmits(['edit', 'refresh'])

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

const table = useTemplateRef("table")
const columnFilters = ref([{ id: "load_number", value: "" }])
const columnVisibility = ref()
const rowSelection = defineModel('rowSelection', { type: Object, default: () => ({}) })

const expandedRateCon = ref({})
const expandedPodBol = ref({})

const limit = defineModel('limit', { type: Number, default: 25 })
const pagination = ref({ pageIndex: 0, pageSize: 25 })

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
      onClick: (e) => e.stopPropagation(),
      ariaLabel: "Select row"
    })
},{
  accessorKey: "load_number",
  header: "Load",
  meta: { class: { td: 'cursor-pointer' }},
  cell: ({ row }) => {
    const status = row.original.status_load || 'not_started'
    const statusFactoring = row.original.status_factoring || 'Not Submitted'
    const statusEmail = row.original.status_email || 'Not Sent'
    return h("div", { class: "flex flex-col items-start" }, [
      h("span", { class: "font-semibold text-highlighted" }, `${row.original.load_number}`),
      h("div", { class: "flex flex-col gap-0.5" }, [
        h("div", { class: "text-gray-500 text-[10px]" }, 'Status:'),
        h(UBadge, { 
          color: getStatusColor(status), 
          class: 'uppercase text-[9px]'
        }, () => status.replace('_', ' '))
      ]),
      h("div", { class: "flex flex-col gap-0.5 mt-1" }, [
        h("div", { class: "text-gray-500 text-[10px]" }, 'Factoring:'),
        h(UBadge, {
          color: statusFactoring === 'sent' ? 'success' : 'neutral',
          variant: statusFactoring === 'sent' ? 'solid' : 'soft',
          class: 'uppercase text-[9px]'
        }, () => statusFactoring === 'sent' ? 'Sent' : 'Not Submitted')
      ]),
      h("div", { class: "flex flex-col gap-0.5 mt-1" }, [
        h("div", { class: "text-gray-500 text-[10px]" }, 'Email:'),
        h(UBadge, {
          color: statusEmail === 'sent' ? 'success' : 'neutral',
          variant: statusEmail === 'sent' ? 'solid' : 'soft',
          class: 'uppercase text-[9px]'
        }, () => statusEmail.replace('_', ' '))
      ])
    ])
  }
},{
  id: "route",
  header: "Route",
  meta: { class: { td: 'cursor-pointer' }},
  cell: ({ row }) => {
    // Безопасно извлекаем первый элемент из массивов адресов
    const shippers = Array.isArray(row.original.shipper_address) ? row.original.shipper_address : [row.original.shipper_address]
    const receivers = Array.isArray(row.original.receiver_address) ? row.original.receiver_address : [row.original.receiver_address]
    
    const shipper = shippers[0] || {}
    const receiver = receivers[0] || {}
    
    const status = row.original.status_load
    const miles = status === 'tonu' ? 0 : row.original.miles
    const weight = row.original.weight
    
    // Добавим счетчик дополнительных остановок (+X stops), если они есть
    const additionalShippers = shippers.length > 1 ? ` (+${shippers.length - 1} stops)` : ''
    const additionalReceivers = receivers.length > 1 ? ` (+${receivers.length - 1} stops)` : ''

    return h("div", { class: "flex flex-col items-start text-xs text-gray-500" }, [
      h("span", undefined, [
        'From: ',
        h("span", { class: "text-highlighted" }, `${shipper?.city || '-'}, ${shipper?.state || '-'}${additionalShippers}`)
      ]),
      h(UTooltip, { text: shipper?.full_address }, () =>
        h('span', { class: "cursor-pointer" }, truncate(shipper?.full_address, 20) || '')
      ),
      h("span", { class: "mt-2" }, [
        'To: ',
        h("span", { class: "text-highlighted" }, `${receiver?.city || '-'}, ${receiver?.state || '-'}${additionalReceivers}`)
      ]),
      h(UTooltip, { text: receiver?.full_address }, () =>
        h('span', { class: "cursor-pointer" }, truncate(receiver?.full_address, 20) || '')
      ),
      h("span", { class: "mt-2" }, [
        h("span", { class: "text-highlighted font-semibold" }, miles || '0'), 
        ' Miles'
      ]),
      h("span", { class: "mt-2" }, [
        h("span", { class: "text-highlighted font-semibold" }, weight || '0'), 
        ' lbs'
      ]),
    ])
  }
  // cell: ({ row }) => {
  //   const shipper = row.original.shipper_address
  //   const receiver = row.original.receiver_address
  //   const status = row.original.status_load
  //   const miles = status === 'tonu' ? 0 : row.original.miles
  //   const weight = row.original.weight
  //   return h("div", { class: "flex flex-col items-start text-xs text-gray-500" }, [
  //     h("span", undefined, [
  //       'From: ',
  //       h("span", { class: "text-highlighted" }, `${shipper?.city || '-'}, ${shipper?.state || '-'}`)
  //     ]),
  //     h(UTooltip, { text: shipper?.full_address }, () =>
  //       h('span', { class: "cursor-pointer" }, truncate(shipper?.full_address, 20) || '')
  //     ),
  //     h("span", { class: "mt-2" }, [
  //       'To: ',
  //       h("span", { class: "text-highlighted" }, `${receiver?.city || '-'}, ${receiver?.state || '-'}`)
  //     ]),
  //     h(UTooltip, { text: receiver?.full_address }, () =>
  //       h('span', { class: "cursor-pointer" }, truncate(receiver?.full_address, 20) || '')
  //     ),
  //     h("span", { class: "mt-2" }, [
  //       h("span", { class: "text-highlighted font-semibold" }, miles || '0'), 
  //       ' Miles'
  //     ]),
  //     h("span", { class: "mt-2" }, [
  //       h("span", { class: "text-highlighted font-semibold" }, weight || '0'), 
  //       ' lbs'
  //     ]),
  //   ])
  // }
},
{
  id: "pickup",
  header: "Date",
  meta: { class: { td: 'cursor-pointer' }},
  cell: ({ row }) => {
    const pDate = row.original.pickup_date || ''
    const pTime = row.original.pickup_time ? row.original.pickup_time.slice(0, 5) : ''
    const pTimeEnd = row.original.pickup_time_end ? row.original.pickup_time_end.slice(0, 5) : ''
    
    const dDate = row.original.delivery_date || ''
    const dTime = row.original.delivery_time ? row.original.delivery_time.slice(0, 5) : ''
    const dTimeEnd = row.original.delivery_time_end ? row.original.delivery_time_end.slice(0, 5) : ''

    const pickupDisplayTime = pTimeEnd ? `${pTime} - ${pTimeEnd}` : pTime
    const deliveryDisplayTime = dTimeEnd ? `${dTime} - ${dTimeEnd}` : dTime

    return h("div", { class: "flex flex-col gap-1 text-xs font-mono" }, [
      h("div", undefined, [
        h("p", { class: "text-gray-500" }, "Pickup:"),
        h("p", { class: "text-highlighted" }, pDate),
        h(UBadge, { label: pickupDisplayTime, size: 'sm', color: 'neutral', variant: 'soft' })
      ]),
      h("div", undefined, [
        h("p", { class: "text-gray-500" }, "Delivery:"),
        (dDate && dTime) ? h("div", undefined, [
          h("p", { class: "text-highlighted" }, dDate),
          h(UBadge, { label: deliveryDisplayTime, size: 'sm', color: 'neutral', variant: 'soft' })
        ]) : h("span", { class: "text-red-500 text-xs" }, "not yet")
      ])
    ])
  }
},{
  id: "driver",
  header: "Driver",
  meta: { class: { td: 'cursor-pointer' }},
  cell: ({ row }) => {
    const driver = row.original.driver
    if (!driver) return h("span", { class: "text-red-500 text-xs" }, "Unassigned")
    const name = `${driver.first_name || ''} ${driver.last_name || ''}`.trim()
    const trailer = driver.trailer || '-'
    return h("div", { class: "text-xs font-mono" }, [
      h("p", { class: "text-highlighted mb-1" }, name),
      h("div", undefined, [
        h("p", { class: "text-gray-500" }, 'Truck:'),
        h("p", { class: "text-highlighted" }, driver.truck_number || '-'),
      ]),
      h("div", undefined, [
        h("p", { class: "text-gray-500" }, 'Trailer:'),
        h("p", { class: "text-highlighted capitalize" }, trailer.replace('_', ' '))
      ]),
    ])
  }
},{
  id: "broker",
  header: "Broker",
  meta: { class: { td: 'max-w-24 cursor-pointer' }},
  cell: ({ row }) => h("span", { 
    class: "text-highlighted text-sm text-wrap" 
  }, row.original.broker?.name || '-')
},{
  id: "rate",
  header: "Rate",
  meta: { class: { td: 'cursor-pointer' }},
  cell: ({ row }) => {
    const driversRate = row.original.drivers_rate
    const originalRate = row.original.original_rate
    const tonuAmount = row.original.tonu_amount
    const status = row.original.status_load
    const showDriversRate = permissions.value.canViewDriversRate
    const showOriginalRate = permissions.value.canViewOriginalRate
    if (status === 'tonu') {
      return h("div", { class: "text-xs space-y-1 text-red-500 font-semibold" }, [
        h("p", undefined, "TONU Amount:"),
        h("p", { class: "font-mono" }, '$ ' + (tonuAmount || 0))
      ])
    }
    return h("div", { class: "text-xs space-y-1" }, [
      showDriversRate && h("div", undefined, [
        h("p", { class: "text-gray-500" }, "Driver's Rate:"),
        h("p", { class: "text-highlighted font-mono" }, '$ ' + driversRate),
      ]),
      showOriginalRate && h("div", undefined, [
        h("p", { class: "text-gray-500" }, "Original Rate:"),
        h("p", { class: "text-highlighted font-mono" }, '$ ' + originalRate)
      ].filter(Boolean)),
    ])
  }
},{
  id: "rate_confirmation",
  header: "Docs.",
  cell: ({ row }) => {
    const rcFiles = row.original.doc_rate_confirmation || []
    const pbFiles = row.original.doc_pod_bol || []

    const loadId = row.original.documentId || row.id

    const isRcExpanded = !!expandedRateCon.value[loadId]
    const isPbExpanded = !!expandedPodBol.value[loadId]

    const displayedRc = isRcExpanded ? rcFiles : rcFiles.slice(0, 1)
    const displayedPb = isPbExpanded ? pbFiles : pbFiles.slice(0, 1)

    return h("div", { 
      class: "flex flex-col gap-3 text-xs font-mono",
      onClick: (e) => e.stopPropagation()
    }, [
      rcFiles.length ? h("div", { class: "flex flex-col gap-1" }, [
        h("div", { class: "flex flex-col gap-1" }, displayedRc.map(file => {
          return h("a", { 
          href: `${imageUrl}${file.url}`, 
          target: "_blank",
          class: "flex gap-1"
        }, [
          h(UIcon, { class: "w-7 h-7 text-highlighted", name: "hugeicons:document-attachment" }),
          h("div", { class: "flex flex-col" }, [
            h("p", { class: "text-highlighted" }, "Rate Con."),
            h("p", { class: "text-primary text-[10px]" }, getMime(file)),
          ])
        ])
      })),
      rcFiles.length > 1 && h("div", undefined, [
          h(UButton, {
            size: "xs",
            color: "neutral",
            variant: "soft",
            label: isRcExpanded ? "Less" : `+${rcFiles.length - 1}`,
            icon: isRcExpanded ? "i-lucide-chevron-up" : "i-lucide-chevron-down",
            class: "py-0.5 px-1.5",
            onClick: (e) => {
              e.stopPropagation()
              expandedRateCon.value[loadId] = !isRcExpanded
            }
          })
        ])
      ]) : h("span", { class: "text-gray-500" }, "Rate Con.: still no"),

      pbFiles.length ? h("div", { class: "flex flex-col gap-1" }, [
        h("div", { class: "flex flex-col gap-1" }, displayedPb.map(file => {
          return h("a", { 
            href: `${imageUrl}${file.url}`, 
            target: "_blank",
            class: "flex items-center gap-1 "
          }, [
            h(UIcon, { class: "w-7 h-7 text-highlighted", name: "hugeicons:document-attachment" }),
            h("div", { class: "flex flex-col" }, [
              h("p", { class: "text-highlighted" }, "POD/BOL"),
              h("p", { class: "text-primary text-[10px]" }, getMime(file)),
            ])
          ])
        })),
        pbFiles.length > 1 && h("div", undefined, [
          h(UButton, {
            size: "xs",
            color: "neutral",
            variant: "soft",
            label: isPbExpanded ? "Less" : `+${pbFiles.length - 1}`,
            icon: isPbExpanded ? "i-lucide-chevron-up" : "i-lucide-chevron-down",
            class: "py-0.5 px-1.5",
            onClick: (e) => {
              e.stopPropagation()
              expandedPodBol.value[loadId] = !isPbExpanded
            }
          })
        ])
      ]) : h("span", { class: "text-gray-500" }, "POD/BOL: still no")
    ])
  }
},{
  id: "actions",
  cell: ({ row }) => {
    return h("div", { 
      class: "text-right",
      onClick: (e) => e.stopPropagation()
    },
      h(UDropdownMenu, { content: { align: "center", side: "left" }, items: getRowItems(row) },
        () => h(UButton, {
          icon: "hugeicons:more-vertical-circle-01",
          color: "neutral",
          variant: "soft",
        })
      )
    )
  }
}]

function getRowItems(row) {
  return [{
    label: "Actions",
    class: "cursor-default"
  },{
    label: "Edit",
    icon: "hugeicons:pencil-edit-02",
    onSelect() {
      emit('edit', row.original)
    }
  }]
}
const handleRowClick = (event, row) => {
  const documentId = row.original.documentId
  if (documentId) {
    navigateTo(`/dashboard/loads/${documentId}`)
  }
}

const searchFilter = computed({
  get: () => table.value?.tableApi?.getColumn("load_number")?.getFilterValue() || "",
  set: (value) => {
    table.value?.tableApi?.getColumn("load_number")?.setFilterValue(value || undefined);
  }
})
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

    <ClientOnly>
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
        @select="handleRowClick"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default',
          separator: 'h-0'
        }" />
      <TablePagination 
        v-if="table?.tableApi"
        v-model:limit="limit"
        :table-api="table.tableApi"
        :selected-count="Object.keys(rowSelection).length" />

    </ClientOnly>
  </div>
</template>