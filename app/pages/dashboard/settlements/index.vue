<!-- pages/dashboard/settlements/index.vue -->
<script setup>
import { UButton, UDropdownMenu, UCheckbox, UBadge } from '#components'
import { getPaginationRowModel } from "@tanstack/table-core"
import { sub, format, differenceInCalendarDays } from "date-fns"

definePageMeta({ layout: 'dashboard' })

const { imageUrl } = useConfig()
const { permissions } = useRolePermissions()
const client = useStrapiClient()
const toast = useToast()
const router = useRouter()

const selectedDriver = ref(null)
const range = shallowRef({
  start: sub(new Date(), { days: 7 }),
  end: new Date(),
})
const isCreating = ref(false)
const bulkInterval = ref(10)
const isDeleting = ref(false)
const table = useTemplateRef("table")
const rowSelection = ref({})
const limit = ref(25)
const pagination = ref({ pageIndex: 0, pageSize: 25 })
const activeJob = ref(null)

const isPaymentModalOpen = ref(false)
const targetSettlement = ref(null)
const modalPaymentValue = ref(false)
const isSavingPaymentStatus = ref(false)

const handleSavePaymentStatus = async () => {
  if (!targetSettlement.value) return
  isSavingPaymentStatus.value = true
  const newStatus = modalPaymentValue.value ? 'paid' : 'unpaid'
  try {
    await client(`/settlements/${targetSettlement.value.documentId}`, {
      method: 'PUT',
      body: { data: { payment_status: newStatus } }
    })
    toast.add({ title: `Settlement marked as ${newStatus}`, color: 'success' })
    isPaymentModalOpen.value = false
    refresh()
  } catch (e) {
    toast.add({ title: 'Error updating payment status', description: e.message, color: 'error' })
  } finally {
    isSavingPaymentStatus.value = false
  }
}

// Списки
const { data: driversResponse } = await useAsyncData('drivers-simple-list', () => 
  client('/drivers', { query: { fields: ['first_name', 'last_name', 'email'] } })
)
const drivers = computed(() => driversResponse.value?.data || [])
const driverItems = computed(() => drivers.value.map(d => ({
  value: d.documentId,
  label: `${d.first_name} ${d.last_name}`
})))

const { data: settlementsResponse, refresh } = await useAsyncData('settlements-list', () =>
  client('/settlements', { 
    query: { 
      populate: ['driver', 'pdf_file'],
      pagination: { limit: limit.value }
    }
  }), {
    lazy: true,
    watch: [limit],
    default: () => ({ data: [] })
  }
)
const settlements = computed(() => settlementsResponse.value?.data || [])
const jobProgress = computed(() => {
  if (!activeJob.value) return 0
  return Math.round((activeJob.value.processed_items / activeJob.value.total_items) * 100)
})

let pollingInterval = null

const startPolling = (jobId) => {
  pollingInterval = setInterval(async () => {
    try {
      const res = await client(`/settlement-jobs/${jobId}`)
      activeJob.value = res.data
      if (['completed', 'failed'].includes(res.data.status_job)) {
        clearInterval(pollingInterval)
        
        const isFailed = res.data.status_job === 'failed'
        activeJob.value = null
        
        toast.add({ 
          title: isFailed ? 'Bulk Sending Failed' : 'Bulk Sending Completed', 
          color: isFailed ? 'error' : 'success' 
        })
        
        refresh()
      }
    } catch (e) {
      clearInterval(pollingInterval)
    }
  }, 3000)
}

// Запустить расчет и сохранить в драфт
const handleCreateSettlement = async () => {
  if (!selectedDriver.value || !range.value?.start || !range.value?.end) {
    toast.add({ title: 'Validation Error', description: 'Please fill all fields', color: 'error' })
    return
  }
  isCreating.value = true
  try {
    const formattedStart = format(range.value.start, 'yyyy-MM-dd')
    const formattedEnd = format(range.value.end, 'yyyy-MM-dd')

    const calc = await client('/settlements/calculate', {
      query: { driverId: selectedDriver.value, startDate: formattedStart, endDate: formattedEnd }
    })
    const payload = {
      data: {
        start_date: formattedStart,
        end_date: formattedEnd,
        driver: selectedDriver.value,
        loads: calc.loads.map(l => l.documentId),
        gross_freight: calc.gross_freight,
        gross_payable: calc.gross_payable,
        total_fuel: calc.fuel_expense,
        total_deductions: calc.total_deductions,
        net_payout: calc.net_payout,
        status_settlement: 'draft'
      }
    }
    await client('/settlements', { method: 'POST', body: payload })
    toast.add({ title: 'Draft Settlement Saved', color: 'success' })
    refresh()
  } catch (error) {
    toast.add({ title: 'Calculation failed', description: error.message, color: 'error' })
  } finally {
    isCreating.value = false
  }
}

const isCalculateDisabled = computed(() => {
  if (!selectedDriver.value) return true
  if (!range.value?.start || !range.value?.end) return true
  const daysDifference = differenceInCalendarDays(range.value.end, range.value.start)
  return daysDifference <= 0
})

const selectedIds = computed(() => {
  return Object.keys(rowSelection.value)
    .filter(key => rowSelection.value[key])
    .map(index => settlements.value[Number(index)]?.documentId)
    .filter(Boolean)
})

// Email отправка (одиночная / массовая)
const handleSendSettlements = async (ids) => {
  const targetIds = Array.isArray(ids) ? ids : [ids]
  if (targetIds.length === 0) return
  
  try {
    const res = await client('/settlement-jobs', {
      method: 'POST',
      body: {
        settlementIds: targetIds,
        interval_sec: bulkInterval.value
      }
    })
    activeJob.value = res.job
    startPolling(res.job.documentId)
    rowSelection.value = {}
  } catch (e) {
    toast.add({ title: 'Send failed', description: e.message, color: 'error' })
  }
}

// Удаление
const handleDeleteSettlement = async (documentId) => {
  if (!confirm('Are you sure you want to delete this settlement?')) return

  isDeleting.value = true
  try {
    await client(`/settlements/${documentId}`, { method: 'DELETE' })
    toast.add({ title: 'Settlement deleted successfully', color: 'success' })
    rowSelection.value = {}
    refresh()
  } catch (error) {
    toast.add({ title: 'Failed to delete settlement', description: error.message, color: 'error' })
  } finally {
    isDeleting.value = false
  }
}

const handleRowClick = (event, row) => {
  const documentId = row.original?.documentId
  if (documentId) {
    router.push(`/dashboard/settlements/${documentId}`)
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
      ariaLabel: "Select row"
    })
},{
  id: "period",
  header: "Period",
  cell: ({ row }) => {
    return h("div", { class: "font-mono flex flex-col items-start gap-1" }, [
      h(UBadge, { 
        label: row.original.start_date || '', 
        variant: "soft", 
        icon: "hugeicons:calendar-add-02" 
      }),
      h(UBadge, { 
        label: row.original.end_date || '', 
        variant: "soft", 
        icon: "hugeicons:calendar-minus-02" 
      })
    ])
  }
},{
  id: "driver",
  header: "Driver",
  cell: ({ row }) => {
    const driver = row.original.driver
    const name = driver ? `${driver.first_name} ${driver.last_name}` : '-'
    return h("span", { class: "font-semibold text-highlighted" }, name)
  }
},{
  id: "status",
  header: "Status",
  cell: ({ row }) => {
    const status = row.original.status_settlement
    const payStatus = row.original.payment_status || 'unpaid'
    const color = status === 'sent' ? 'success' : (status === 'generated' ? 'info' : 'neutral')
    return h("div", { class: "flex flex-col gap-1 items-start" }, [
      h(UBadge, { 
        icon: status === 'sent' ? 'hugeicons:mail-01' : 'hugeicons:file-01',
        color, 
        variant: "soft", 
        class: "uppercase text-[10px]"
      }, () => status),
      h(UBadge, {
        icon: payStatus === 'paid' ? 'hugeicons:money-bag-02' : 'hugeicons:money-not-found-01',
        color: payStatus === 'paid' ? 'success' : 'error', 
        variant: "soft", 
        class: "uppercase text-[9px] font-bold"
      }, () => payStatus)
    ])
  }
},{
  id: "pdf",
  header: "PDF",
  cell: ({ row }) => {
    const pdfFile = row.original.pdf_file
    if (!pdfFile) {
      return h("span", { class: "text-gray-500 text-xs font-mono" }, "No PDF")
    }
    const fileUrl = `${imageUrl}${pdfFile.url}`
    return h("a", {
      href: fileUrl,
      target: "_blank",
      class: "flex items-center gap-1.5 text-xs text-primary font-mono hover:underline",
      onClick: (e) => e.stopPropagation()
    }, h(UIcon, { name: "hugeicons:document-attachment", class: "w-5 h-5 text-highlighted" }))
  }
},{
  id: "gross",
  header: () => h("div", { class: "text-right" }, "Gross"),
  cell: ({ row }) => {
    return h("div", { class: "text-right font-mono text-highlighted" }, `$${row.original.gross_payable || 0}`)
  }
},{
  id: "fuel",
  header: () => h("div", { class: "text-right" }, "Fuel Expense"),
  cell: ({ row }) => {
    const fuel = row.original.total_fuel || 0
    return h("div", { class: "text-right font-mono text-red-500" }, `$ ${fuel > 0 ? '-' : ''}${fuel}`)
  }
},{
  id: "net_payout",
  header: () => h("div", { class: "text-right" }, "Net Payout"),
  cell: ({ row }) => {
    const net = row.original.net_payout || 0
    const isNegative = net < 0
    return h("div", { 
      class: ["text-right font-mono", isNegative ? 'text-red-500' : 'text-highlighted'] 
    }, `$ ${net}`)
  }
},{
  id: "actions",
  cell: ({ row }) => {
    return h("div", { class: "text-right", onClick: (e) => e.stopPropagation() },
      h(UDropdownMenu, { 
        content: { align: "center", side: "left" }, 
        items: getRowItems(row) 
      }, () => h(UButton, {
          icon: "hugeicons:more-vertical-circle-01",
          color: "neutral",
          variant: "soft",
        })
      )
    )
  }
}]

function getRowItems(row) {
  const items = [{
    label: "Send Email",
    icon: "hugeicons:mail-send-01",
    onSelect() {
      handleSendSettlements(row.original.documentId)
    }
  }, {
    label: "Payment Status",
    icon: "hugeicons:money-send-01",
    onSelect() {
      targetSettlement.value = row.original
      modalPaymentValue.value = row.original.payment_status === 'paid'
      isPaymentModalOpen.value = true
    }
  }]

  const status = row.original.status_settlement
  const canDelete = permissions.value.isAdmin || (permissions.value.isAccounting && status !== 'sent')

  if (canDelete) {
    items.push({
      label: "Delete",
      icon: "hugeicons:delete-02",
      class: "text-red-500 hover:text-red-600",
      onSelect() {
        handleDeleteSettlement(row.original.documentId)
      }
    })
  }
  return items
}
onBeforeUnmount(() => {
  if (pollingInterval) clearInterval(pollingInterval)
})
useHead({ title: 'Settlements' })
</script>
<template>
  <div class="dashboard_main">
    <UDashboardPanel id="settlements">
      <template #header>
        <UDashboardNavbar title="Settlements">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>        
        </UDashboardNavbar>
        <UDashboardToolbar v-if="permissions.canViewSettlements">
          <template #default>
            <div class="flex flex-col lg:flex-row items-center justify-between gap-4 py-2 w-full">
              <div class="flex flex-col sm:flex-row items-center gap-2">
                <DateRangePicker v-model="range" />
                <div class="flex items-center gap-2">
                  <USelect 
                    v-model="selectedDriver" 
                    :items="driverItems" 
                    placeholder="Choose Driver" 
                    class="min-w-40" />
                  <UButton 
                    label="Calculate & Save" 
                    color="primary" 
                    :loading="isCreating" 
                    @click="handleCreateSettlement" 
                    :disabled="isCalculateDisabled" />
                </div>
              </div>
              <UFieldGroup v-show="selectedIds.length > 0">
                <UBadge label="Interval" variant="soft" />
                <UInput v-model="bulkInterval" type="number" class="w-20" placeholder="delay" :ui="{
                    base: 'pr-8', trailing: 'pointer-events-none'
                  }">
                  <template #trailing><p class="text-sm text-muted">sec</p></template>
                </UInput>
                <UButton 
                  icon="hugeicons:mail-send-02"
                  label="Bulk Send" 
                  color="info" 
                  :disabled="selectedIds.length === 0" 
                  @click="handleSendSettlements(selectedIds)" />
              </UFieldGroup>
            </div>
          </template>
        </UDashboardToolbar>
      </template>

      <template #body>
        <div class="flex-1 flex flex-col min-h-0 space-y-4" v-if="permissions.canViewSettlements">
          
          <!-- PROGRESS BAR -->
          <div v-if="activeJob" class="bg-primary/5 p-4 rounded-xl space-y-2">
            <div class="flex justify-between items-center text-sm text-primary font-semibold">
              <span class="flex items-center gap-1.5 animate-pulse">
                <UIcon name="i-lucide-loader-2" class="animate-spin" />
                Sending settlements...
              </span>
              <span>{{ activeJob.processed_items }} / {{ activeJob.total_items }} sent ({{ jobProgress }}%)</span>
            </div>
            <UProgress v-model="jobProgress" color="primary" />
          </div>

          <!-- SETTLEMENTS -->
          <div class="flex-1 flex flex-col min-h-0 space-y-4">
            <UTable
              ref="table"
              v-model:row-selection="rowSelection"
              v-model:pagination="pagination"
              :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
              class="shrink-0 flex-1 overflow-auto"
              :data="settlements"
              :columns="columns"
              @select="handleRowClick"
              :ui="{
                base: 'table-fixed border-separate border-spacing-0',
                thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
                tbody: '[&>tr]:last:[&>td]:border-b-0 [&>tr]:hover:bg-elevated/10 [&>tr]:cursor-pointer',
                th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
                td: 'border-b border-default',
                separator: 'h-0'
              }" />
            <TablePagination 
              v-if="table?.tableApi"
              v-model:limit="limit"
              :table-api="table.tableApi"
              :selected-count="selectedIds.length" />
          </div>

          <UModal v-model:open="isPaymentModalOpen" title="Update Payment Status" close-icon="hugeicons:cancel-01" :ui="{ content: 'sm:max-w-xs' }">
            <template #body>
              <div class="space-y-4">
                <p class="text-sm text-gray-500">
                  Change payment state for <strong><br />
                  {{ targetSettlement?.driver ? `${targetSettlement.driver.first_name} ${targetSettlement.driver.last_name}` : 'Driver' }}</strong>'s statement.
                </p>
                <UFormField label="Status">
                  <UCheckbox v-model="modalPaymentValue" 
                    :label="modalPaymentValue ? 'Mark as Unpaid' : 'Mark as Paid'" />
                </UFormField>
              </div>
              <div class="flex justify-between gap-2 pt-6 dashboard">
                <UButton label="Cancel" color="neutral" variant="soft" @click="isPaymentModalOpen = false" />
                <UButton label="Save Changes" color="primary" :loading="isSavingPaymentStatus" @click="handleSavePaymentStatus" />
              </div>
            </template>
          </UModal>

        </div>
      </template>
    </UDashboardPanel>
  </div>
</template>