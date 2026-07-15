<!-- components/DriverList.vue -->
<script setup>
import { getPaginationRowModel } from "@tanstack/table-core";
const client = useStrapiClient()
const { thumbImg, getExpiryColor } = useConfig()

const props = defineProps({
  drivers: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['edit', 'refresh'])

const UAvatar = resolveComponent("UAvatar");
const UButton = resolveComponent("UButton");
const UDropdownMenu = resolveComponent("UDropdownMenu");
const UCheckbox = resolveComponent("UCheckbox");
const UBadge = resolveComponent("UBadge");
const USwitch = resolveComponent("USwitch");

const toast = useToast()
const table = useTemplateRef("table")

const columnFilters = ref([{ id: "email", value: "" }])
const columnVisibility = ref()
const rowSelection = ref({})
const roles = ref([])
const togglingAccessId = ref(null)

onMounted(async () => {
  try {
    const res = await client('/users-permissions/roles')
    roles.value = res.roles || []
  } catch (e) {
    console.error('Failed to load system roles:', e)
  }
})

const driverRole = computed(() => roles.value.find(r => r.type === 'driver'))

const toggleAccess = async (driver, isGranted) => {
  togglingAccessId.value = driver.id
  try {
    if (isGranted) {
      // КЕЙС 1: У водителя уже есть аккаунт (просто разблокируем его)
      if (driver.user_account) {
        await client(`/users/${driver.user_account.id}`, {
          method: 'PUT',
          body: {
            blocked: false,
            role: driverRole.value?.id
          }
        })
        driver.user_account.blocked = false
        toast.add({
          title: 'Access Restored',
          description: `Existing account for ${driver.first_name} has been unblocked.`,
          color: 'success'
        })
      } 
      // КЕЙС 2: Создаем новый аккаунт с нуля
      else {
        if (!driver.email) {
          throw new Error('Driver must have an email address to create an account.')
        }

        // gen pass
        const tempPassword = Math.random().toString(36).slice(-8) + 'Dr!'
        const username = `${driver.first_name || ''}_${driver.last_name || ''}`
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '') || `driver_${driver.id}`
        const name = `${driver.first_name ? driver.first_name + ' ' : ''}${driver.last_name || ''}` || ''

        // 1. Создаем пользователя
        const newUser = await client('/users', {
          method: 'POST',
          body: {
            username,
            name,
            email: driver.email,
            password: tempPassword,
            role: driverRole.value?.id,
            confirmed: true,
            blocked: false
          }
        })

        // 2. Связываем пользователя с карточкой водителя
        await client(`/drivers/${driver.documentId}`, {
          method: 'PUT',
          body: {
            data: {
              user_account: newUser.id
            }
          }
        })

        driver.user_account = newUser

        // Копируем креды в буфер обмена для удобства диспетчера
        const credentialsText = `Login: ${driver.email}\n Temporary Password: ${tempPassword}`
        await navigator.clipboard.writeText(credentialsText)

        toast.add({
          title: 'Account Created',
          description: `Account created! Temp password: "${tempPassword}" (Credentials copied to clipboard)`,
          color: 'success',
          timeout: 12000
        })
      }
    } else {
      // КЕЙС 3: Блокируем доступ
      if (driver.user_account) {
        await client(`/users/${driver.user_account.id}`, {
          method: 'PUT',
          body: {
            blocked: true
          }
        })
        driver.user_account.blocked = true
        toast.add({
          title: 'Access Blocked',
          description: `Access has been suspended for ${driver.first_name || driver.username}.`,
          color: 'warning'
        })
      }
    }
    emit('refresh')
  } catch (error) {
    console.error(error)
    toast.add({
      title: 'Error',
      description: error?.message || error?.data?.error?.message || 'Failed to update access',
      color: 'error'
    })
  } finally {
    togglingAccessId.value = null
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
      onClick: (e) => e.stopPropagation(),
      ariaLabel: "Select line"
    })
},{
  accessorKey: "email",
  header: "Driver",
  meta: { class: { td: 'cursor-pointer' }},
  cell: ({ row }) => {
    const first = row.original.first_name || ''
    const last = row.original.last_name || ''
    const displayName = `${first} ${last}`.trim() || row.original.user_account?.username || 'No Name'
    const avatarSrc = thumbImg(row.original.user_account?.avatar)
    const type = row.original.driver_type
    const isOwner = (type === 'owner_operator' ? 'Owner Operator' : 'Company Driver') || false

    return h("div", { class: "flex flex-col gap-1 items-start" }, [
      h("div", { class: "flex items-center gap-3" }, [
        h(UAvatar, { src: avatarSrc, alt: displayName, size: "md" }),
        h("div", undefined, [
          h("p", { class: "font-medium text-highlighted" }, displayName),
          h("p", { class: "text-xs text-gray-500" }, row.original.phone || 'No phone')
        ])
      ]),
      h("span", { class: "text-xs text-gray-500" }, row.original.email || ''),
      isOwner ? h(UBadge, { color: 'neutral', variant: 'soft', size: 'sm' }, () => isOwner) : ''
    ])
  }
},{
  id: "numbers",
  header: "No.",
  meta: { class: { td: 'cursor-pointer' }},
  cell: ({ row }) => {
    const driver_number = row.original.driver_number || '-'
    const truckNo = row.original.truck_number || '-'
    const trailer = row.original.trailer || '-'
    const trailerNo = row.original.trailer_number || '-'
    return h("div", { class: "text-xs font-mono" }, [
      h("div", undefined, [
        h("p", { class: "text-gray-500" }, 'Driver:'),
        h("p", { class: "text-highlighted" }, driver_number),
      ]),
      h("div", undefined, [
        h("p", { class: "text-gray-500" }, 'Truck No:'),
        h("p", { class: "text-highlighted" }, truckNo),
      ]),
      h("div", undefined, [
        h("p", { class: "text-gray-500" }, 'Trailer:'),
        h("p", { class: "text-highlighted capitalize" }, trailer.replace('_', ' ')),
      ]),
      h("div", undefined, [
        h("p", { class: "text-gray-500" }, 'Trailer No:'),
        h("p", { class: "text-highlighted" }, trailerNo),
      ]),
    ])
  }
},{
  accessorKey: "dispatcher",
  header: "Dispatcher",
  meta: { class: { th: 'text-center', td: 'cursor-pointer text-center' }},
  cell: ({ row }) => {
    const dispatcher = row.original.assigned_dispatcher
    return h("span", { class: "text-sm text-gray-500 text-wrap" }, dispatcher?.name || dispatcher?.username)
  }
},{
  accessorKey: "commission_rate",
  header: "Commission",
  meta: { class: { th: 'text-center', td: 'cursor-pointer text-center' }},
  cell: ({ row }) => {
    const commission = row.original.commission_rate
    return h("span", { class: "text-sm" }, `${commission}%` || '-')
  }
},{
  id: "deductions",
  header: "Deductions",
  meta: { class: { td: 'cursor-pointer' }},
  cell: ({ row }) => {
    const deductions = row.original.deductions || {}
    const eld = deductions.eld || '0'
    const insurance = deductions.insurance || '0'
    const plates = deductions.plates || '0'
    const ifta = deductions.ifta || '0'
    const other_reason = deductions.other_reason || ''
    const other_cost = deductions.other_cost || 0

    return h("div", { class: "text-xs text-gray-500 font-mono" }, [
      h("p", undefined, `$${eld} ELD`),
      h("p", undefined, `$${insurance} Insurance`),
      h("p", undefined, `$${plates} Plates`),
      h("p", undefined, `$${ifta} IFTA`),
      other_cost > 0 && other_reason 
        ? h("p", { class: "text-primary font-semibold" }, `$${other_cost} ${other_reason}`) 
        : null
    ])
  }
},{
  id: "expirations",
  header: "Expirations",
  meta: { class: { td: 'cursor-pointer' }},
  cell: ({ row }) => {
    const cdl = row.original.cdl_expiry || '-'
    const medical = row.original.medical_expiry || '-'
    return h("div", { class: "flex flex-col gap-1 text-xs" }, [
      h("div", { class: "flex items-center gap-1" }, [
        h(UBadge, { color: getExpiryColor(cdl), variant: 'soft', size: 'sm' }, () => cdl),
        h("p", { class: "text-gray-500" }, `CDL`),
      ]),
      h("div", { class: "flex items-center gap-1" }, [
        h(UBadge, { color: getExpiryColor(medical), variant: 'soft', size: 'sm' }, () => medical),
        h("p", { class: "text-gray-500" }, `Medical`)
      ])
    ])
  }
},{
  id: "access",
  header: "Access",
  meta: { class: { th: 'text-center', td: 'text-center' }},
  cell: ({ row }) => {
    const driverEmail = row.original.email
    const driverId = row.original.id
    const hasAccess = !!row.original.user_account && !row.original.user_account?.blocked

    return h("div", { 
      class: "flex flex-col gap-1 items-center",
      onClick: (e) => e.stopPropagation() 
    }, [
      h(USwitch, {
        modelValue: hasAccess,
        loading: togglingAccessId.value === driverId,
        disabled: !driverEmail,
        'onUpdate:modelValue': (value) => toggleAccess(row.original, value)
      }),
      !driverEmail ? h("span", { class: "text-xs text-red-500 font-medium" }, "No Email") : null,
      h("div", { class: "text-xs" }, [ hasAccess ? 
        h("span", { class: "" },  'Has access') :
        h("span", { class: "text-gray-500" },  'Blocked')
      ])
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
          variant: "ghost",
          class: "ml-auto"
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
    navigateTo(`/dashboard/drivers/${documentId}`)
  }
}

const emailSearch = computed({
  get: () => table.value?.tableApi?.getColumn("email")?.getFilterValue() || "",
  set: (value) => {
    table.value?.tableApi?.getColumn("email")?.setFilterValue(value || undefined);
  }
})

const pagination = ref({ pageIndex: 0, pageSize: 24 })
</script>
<template>
  <div class="flex-1 flex flex-col min-h-0 space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-1.5">
        <UInput
          v-model="emailSearch"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Search by email..." />
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
      :data="drivers"
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

    <div class="flex items-center justify-between gap-3 mt-auto">
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