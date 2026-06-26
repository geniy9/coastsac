<!-- components/DriverList.vue -->
<script setup>
import { getPaginationRowModel } from "@tanstack/table-core";
const client = useStrapiClient()
const { thumbImg } = useConfig()

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

        // 1. Создаем пользователя в Strapi
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
        const credentialsText = `Login/Email: ${driver.email}\nTemporary Password: ${tempPassword}`
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
          description: `Access has been suspended for ${driver.first_name}.`,
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

function getRowItems(row) {
  return [{
    type: "label",
    label: "Actions"
  },{
    label: "Edit",
    icon: "i-lucide-edit",
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
      ariaLabel: "Выбрать все"
    }),
  cell: ({ row }) =>
    h(UCheckbox, {
      modelValue: row.getIsSelected(),
      "onUpdate:modelValue": (value) => row.toggleSelected(!!value),
      ariaLabel: "Выбрать строку"
    })
},{
  accessorKey: "email",
  header: "Name/Email",
  cell: ({ row }) => {
    const first = row.original.first_name || ''
    const last = row.original.last_name || ''
    const displayName = `${first} ${last}`.trim() || row.original.user_account?.username || 'No Name'
    const avatarSrc = row.original.user_account?.avatar ? thumbImg(row.original.user_account?.avatar) : ''

    return h("div", { class: "flex flex-col" }, [
      h("div", { class: "flex items-center gap-3" }, [
        h(UAvatar, { src: avatarSrc, alt: displayName, size: "md" }),
        h("div", undefined, [
          h("p", { class: "font-medium text-highlighted" }, displayName),
          h("p", { class: "text-xs text-gray-500" }, row.original.phone || 'No phone')
        ])
      ]),
      h("span", { class: "text-xs text-gray-500" }, row.original.email || '')
    ])
  }
},{
  id: "numbers",
  header: "No. #",
  cell: ({ row }) => {
    const driver_number = row.original.driver_number || '-'
    const truck = row.original.truck_number || '-'
    const trailer = row.original.trailer || '-'
    return h("div", { class: "text-xs font-mono" }, [
      h("p", undefined, `Driver #: ${driver_number}`),
      h("p", undefined, `Truck #: ${truck}`),
      h("p", { class: "capitalize" }, `Trailer: ${trailer.replace('_', ' ')}`)
    ])
  }
},{
  accessorKey: "driver_type",
  header: "Driver Type",
  cell: ({ row }) => {
    const type = row.original.driver_type
    if (!type) return '-'
    const isOwner = type === 'owner_operator'
    return h(UBadge, { 
      color: 'neutral', 
      variant: 'soft' 
    }, () => isOwner ? 'Owner Operator' : 'Company Driver')
  }
},{
  accessorKey: "dispatcher",
  header: "Dispatcher",
  cell: ({ row }) => {
    const dispatcher = row.original.assigned_dispatcher
    return h("span", { class: "text-sm text-gray-500" }, dispatcher?.name || dispatcher?.username)
  }
},{
  accessorKey: "commission_rate",
  header: "Rate",
  cell: ({ row }) => {
    const rate = row.original.commission_rate
    return h("span", { class: "text-sm" }, `${rate}%` || '-')
  }
},{
  id: "deductions",
  header: "Deductions",
  cell: ({ row }) => {
    const eld = row.original.deductions.eld || '-'
    const insurance = row.original.deductions.insurance || '-'
    const plates = row.original.deductions.plates || '-'
    return h("div", { class: "text-xs text-gray-500 font-mono" }, [
      h("p", undefined, `${eld}$ ELD`),
      h("p", undefined, `${insurance}$ Insurance`),
      h("p", undefined, `${plates}$ Plates`)
    ])
  }
},{
  id: "expirations",
  header: "Expirations",
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
  cell: ({ row }) => {
    const driverEmail = row.original.email
    const driverId = row.original.id
    const hasAccess = !!row.original.user_account && !row.original.user_account?.blocked

    return h("div", { class: "flex flex-col gap-1 items-start" }, [
      h(USwitch, {
        modelValue: hasAccess,
        loading: togglingAccessId.value === driverId,
        disabled: !driverEmail,
        'onUpdate:modelValue': (value) => toggleAccess(row.original, value)
      }),
      !driverEmail ? h("span", { class: "text-xs text-red-500 font-medium" }, "No Email") : null
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

const getExpiryColor = (dateStr) => {
  if (!dateStr || dateStr === '-') return 'neutral'; // Серый цвет, если дата отсутствует
  return lessThanWeek(dateStr) ? 'error' : 'success';
}
const lessThanWeek = (dateStr) => {
  if (!dateStr || dateStr === '-') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiryDate = new Date(dateStr);
  expiryDate.setHours(0, 0, 0, 0);
  const diffDays = (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays < 7;
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