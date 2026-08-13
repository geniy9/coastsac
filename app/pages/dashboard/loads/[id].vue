<!-- pages/dashboard/loads/[id].vue -->
<script setup>
definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const loadId = route.params.id
const { permissions } = useRolePermissions()
const client = useStrapiClient()
const user = useStrapiUser()
const { 
  trailerOptions, 
  getFileUrl,
  isImageFile,
  thumbImg, 
  copyBoofer, 
  getStatusColor,
  getMime
} = useConfig()

const toast = useToast()

const isEditOpen = ref(false)
const isPreviewOpen = ref(false)
const previewFile = ref(null)

const rateUploaderPageRef = ref(null)
const podUploaderPageRef = ref(null)
const uploadingPageRate = ref(false)
const uploadingPagePod = ref(false)
const statusUpdating = ref(false)
const isOpenActions = ref(false)

const isTonuMode = ref(false)
const tonuAmount = ref(0)

const isOpenSendLoadModal = ref(false)
const isSendingLoad = ref(false)
const ccLoadEmail = ref('')

const handleOpenSendLoadModal = () => {
  ccLoadEmail.value = user.value?.email || ''
  isOpenSendLoadModal.value = true
}

const handleSendLoadEmail = async () => {
  isSendingLoad.value = true
  try {
    await client(`/loads/${load.value.documentId}/send-to-driver`, {
      method: 'POST',
      body: { ccEmail: ccLoadEmail.value }
    })
    toast.add({ title: 'Load confirmation sent to driver', color: 'success' })
    isOpenSendLoadModal.value = false
    await handleRefresh()
  } catch (e) {
    toast.add({ title: 'Failed to send', description: e.message, color: 'error' })
  } finally {
    isSendingLoad.value = false
  }
}

watch(isOpenActions, (newVal) => {
  if (!newVal) {
    isTonuMode.value = false
    tonuAmount.value = 0
  }
})

const { data: response, status, refresh } = await useAsyncData(`load-${loadId}`, () => 
  client(`/loads/${loadId}`, {
    query: {
      populate: [
        'dispatcher', 
        'driver.user_account.avatar', 
        'broker', 
        'doc_rate_confirmation', 
        'doc_pod_bol', 
        'shipper_address', 
        'receiver_address',
        'notes.user.avatar'
      ]
    }
  }), {
    lazy: true,
    default: () => null
  }
)
const load = computed(() => response.value?.data || response.value || null)
const isDelivered = computed(() => !!load.value?.delivery_date)

const timelineItems = computed(() => {
  if (!load.value) return []

  const shippers = Array.isArray(load.value.shipper_address) ? load.value.shipper_address : [load.value.shipper_address]
  const receivers = Array.isArray(load.value.receiver_address) ? load.value.receiver_address : [load.value.receiver_address]
  const active = isDelivered.value

  const pTime = load.value.pickup_time ? load.value.pickup_time.slice(0, 5) : null
  const pTimeEnd = load.value.pickup_time_end ? load.value.pickup_time_end.slice(0, 5) : null
  const displayPickupTime = pTimeEnd ? `${pTime} - ${pTimeEnd}` : pTime

  const dTime = load.value.delivery_time ? load.value.delivery_time.slice(0, 5) : null
  const dTimeEnd = load.value.delivery_time_end ? load.value.delivery_time_end.slice(0, 5) : null
  const displayDeliveryTime = dTimeEnd ? `${dTime} - ${dTimeEnd}` : dTime

  const items = []

  // (Shippers)
  shippers.forEach((shipper, idx) => {
    items.push({
      title: shippers.length > 1 ? `Shipper #${idx + 1}` : 'Shipper',
      icon: 'hugeicons:delivery-box-01',
      slot: `shipper-${idx}`,
      cityState: `${shipper?.city || 'N/A'}, ${shipper?.state || 'N/A'}`,
      fullAddress: shipper?.full_address || '',
      pickupDate: idx === 0 ? (load.value.pickup_date || '-') : '',
      time: idx === 0 ? displayPickupTime : '',
      ui: {
        indicator: 'text-white bg-primary dark:bg-primary dark:text-black border-2 border-primary print:text-gray-500',
        separator: active || (idx < shippers.length - 1)
          ? 'bg-primary print:bg-gray-500 flex-1 rounded-full' 
          : 'bg-gray-300 dark:bg-gray-500 flex-1 rounded-full'
      }
    })
  })
  // (Receivers)
  receivers.forEach((receiver, idx) => {
    const isLast = idx === receivers.length - 1
    items.push({
      title: receivers.length > 1 ? `Receiver #${idx + 1}` : 'Receiver',
      icon: 'hugeicons:dropbox',
      slot: `receiver-${idx}`,
      cityState: `${receiver?.city || 'N/A'}, ${receiver?.state || 'N/A'}`,
      fullAddress: receiver?.full_address || '',
      deliveryDate: isLast ? (load.value.delivery_date || '') : '',
      time: isLast ? displayDeliveryTime : '',
      ui: {
        indicator: active
          ? 'text-white bg-primary dark:bg-primary dark:text-black border-2 border-primary print:text-gray-500'
          : 'text-gray-400 bg-transparent dark:bg-transparent border-2 border-gray-300 dark:border-gray-500 dark:text-gray-500',
        separator: !isLast
          ? (active ? 'bg-primary print:bg-gray-500 flex-1 rounded-full' : 'bg-gray-300 dark:bg-gray-500 flex-1 rounded-full')
          : 'hidden'
      }
    })
  })

  return items
})

const handleRefresh = async () => { await refresh() }
const printProfile = () => { if (import.meta.client) { window.print() } }
const downloadFile = (url) => { if (import.meta.client) { window.open(url, '_blank') } }

// HELPERS
const getTrailerIcon = (type) => {
  const option = trailerOptions.find(opt => opt.value === type)
  return option ? option.icon : 'hugeicons:semi-truck'
}
const getTrailerLabel = (type) => {
  const option = trailerOptions.find(opt => opt.value === type)
  return option ? option.label : type
}
const getFileIcon = (file) => {
  const ext = (file.ext || '').replace(/^\./, '').toLowerCase()
  if (ext === 'pdf') return 'hugeicons:pdf-01'
  if (isImageFile(file)) return 'hugeicons:document-attachment'
  return 'hugeicons:file-not-found'
}

const handleFileClick = (file) => {
  const fullUrl = getFileUrl(file)
  if (isImageFile(file)) {
    previewFile.value = { ...file, fullUrl }
    isPreviewOpen.value = true
  } else {
    downloadFile(fullUrl)
  }
}

// Определение элементов аккордеона в зависимости от роли
const accordionItems = computed(() => {
  const items = []
  if (permissions.value.isDispatcher || permissions.value.isAdmin) {
    items.push({
      label: 'Upload Rate Confirmation',
      slot: 'rate-conf-upload'
    })
  }
  if (permissions.value.isDriver || permissions.value.isDispatcher || permissions.value.isAdmin) {
    items.push({
      label: 'Upload Proof of Delivery',
      slot: 'pod-upload'
    })
  }
  return items
})

// Загрузка Rate Confirmation
const handleUploadPageRate = async () => {
  if (!rateUploaderPageRef.value?.hasFiles) return
  uploadingPageRate.value = true
  try {
    const newIds = await rateUploaderPageRef.value.uploadFiles()
    const existingIds = load.value?.doc_rate_confirmation?.map(f => f.id) || []
    
    await client(`/loads/${load.value.documentId}`, {
      method: 'PUT',
      body: {
        data: {
          doc_rate_confirmation: [...existingIds, ...newIds]
        }
      }
    })
    toast.add({ title: 'Success', description: 'Rate Confirmation uploaded', color: 'success' })
    rateUploaderPageRef.value.clear()
    await handleRefresh()
  } catch (error) {
    console.error(error)
  } finally {
    uploadingPageRate.value = false
  }
}

// Загрузка POD / BOL
const handleUploadPagePod = async () => {
  if (!podUploaderPageRef.value?.hasFiles) return
  uploadingPagePod.value = true
  try {
    const newIds = await podUploaderPageRef.value.uploadFiles()
    const existingIds = load.value?.doc_pod_bol?.map(f => f.id) || []
    
    const updateData = {
      doc_pod_bol: [...existingIds, ...newIds],
      status_load: 'unloaded',
      category: 'completed'
    }

    // Устанавливаем дату и время доставки, только если они пусты
    if (!load.value?.delivery_date) {
      updateData.delivery_date = new Date().toISOString().split('T')[0]
    }
    if (!load.value?.delivery_time) {
      const now = new Date()
      updateData.delivery_time = new Time(now.getHours(), now.getMinutes())
    }
    
    await client(`/loads/${load.value.documentId}`, {
      method: 'PUT',
      body: {
        data: updateData
      }
    })
    
    toast.add({ title: 'Success', description: 'POD / BOL uploaded', color: 'success' })
    podUploaderPageRef.value.clear()
    await handleRefresh()
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Error', description: 'Failed to upload POD / BOL', color: 'error' })
  } finally {
    uploadingPagePod.value = false
  }
}

// CHANGE STATUS
const changeStatusDirectly = async (newStatus) => {
  if (!confirm(`Are you sure you want to set status to "${newStatus.replace('_', ' ')}"?`)) return
  statusUpdating.value = true
  try {
    await client(`/loads/${load.value.documentId}`, {
      method: 'PUT',
      body: {
        data: {
          status_load: newStatus
        }
      }
    })
    toast.add({ 
      title: 'Status Updated', 
      description: `Load is now ${newStatus.replace('_', ' ')}`, 
      color: 'success'
    })
    isOpenActions.value = false
    await handleRefresh()
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Error', description: 'Failed to update status', color: 'error' })
  } finally {
    statusUpdating.value = false
  }
}
// Изменение статуса на TONU с суммой компенсации
const confirmTonuDirectly = async () => {
  if (tonuAmount.value <= 0) {
    toast.add({ title: 'Validation Error', description: 'TONU amount must be greater than 0', color: 'error' })
    return
  }
  statusUpdating.value = true
  try {
    await client(`/loads/${load.value.documentId}`, {
      method: 'PUT',
      body: {
        data: {
          status_load: 'tonu',
          category: 'completed',
          tonu_amount: tonuAmount.value,
          drivers_rate: 0,
          original_rate: 0,
          miles: 0,
          weight: 0,
          delivery_date: new Date().toISOString().split('T')[0]
        }
      }
    })
    toast.add({ 
      title: 'Status Updated', 
      description: `Load status changed to TONU with compensation $${tonuAmount.value}`, 
      color: 'success'
    })
    isOpenActions.value = false
    await handleRefresh()
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Error', description: 'Failed to update status to TONU', color: 'error' })
  } finally {
    statusUpdating.value = false
  }
}
useHead({ title: () => `Load ${load.value ? load.value.load_number : ''}` })
</script>
<template>
  <div class="dashboard_main">
    <UDashboardPanel :id="loadId || 'load-id'">
      <template #header>
        <UDashboardNavbar :title="load ? `Load ${load.load_number}` : 'Loading...'" class="no-print">
          <template #leading>
            <UDashboardSidebarCollapse />
            <UButton 
              icon="i-lucide-arrow-left" 
              color="neutral" 
              variant="ghost" 
              to="/dashboard/loads" />
          </template>
          <template #right>
            <div class="flex items-center gap-2">
              <UButton 
                v-if="permissions.canEditLoads && load?.driver?.email"
                icon="hugeicons:mail-send-02" 
                label="Send Email"
                color="info" 
                variant="soft" 
                @click="handleOpenSendLoadModal" />
              <UButton 
                icon="hugeicons:printer" 
                color="neutral" 
                variant="outline" 
                @click="printProfile" />
              <UButton 
                v-if="permissions.canEditLoads"
                icon="hugeicons:pencil-edit-02" 
                label="Edit" 
                color="primary" 
                variant="soft"
                @click="isEditOpen = true" />
            </div>
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <div class="flex-1 flex flex-col min-h-0" v-if="permissions.canViewLoads">
          <div v-if="status === 'pending' && !load" class="flex-1 flex flex-col items-center justify-center gap-2">
            <p class="text-sm text-gray-500">Loading load data...</p>
          </div>
          
          <!-- Load not found -->
          <div v-else-if="!load" class="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
            <p class="text-lg font-semibold text-error">Load details not found</p>
            <UButton to="/dashboard/loads" label="Go to Loads List" color="neutral" variant="ghost" />
          </div>

          <div v-else class="print-area no-scrollbar space-y-4 overflow-y-auto flex-1 w-full">
            
            <!-- HEAD -->
            <UCard variant="soft" class="print-card">
              <template #header>
                <div class="flex flex-wrap items-center md:justify-between gap-4">
                  <div class="flex items-center flex-wrap gap-3">
                    <h1 class="text-2xl font-bold text-highlighted">
                      {{ load.load_number }}
                    </h1>
                    <UBadge color="primary" size="lg" class="capitalize no-print">
                      {{ load.category }}
                    </UBadge>
                    <UFieldGroup class="no-print" size="sm">
                      <UButton :color="getStatusColor(load.status_load)" variant="solid" class="uppercase">
                        {{ (load.status_load || 'not_started').replace('_', ' ') }}
                      </UButton>
                      <UButton 
                        v-if="permissions.isDriver || permissions.isDispatcher || permissions.isAdmin"
                        icon="hugeicons:pencil-edit-02" 
                        color="neutral"
                        variant="outline"
                        @click="isOpenActions = true" />
                    </UFieldGroup>
                  </div>
                  <div class="flex items-center gap-2 no-print">
                    <div class="flex items-center gap-2 no-print">
                      <p class="text-xs text-gray-500">Factoring:</p>
                      <div class="flex items-center gap-1.5">
                        <UFieldGroup>
                          <UBadge 
                            :color="load.status_factoring === 'sent' ? 'success' : 'neutral'" 
                            class="uppercase text-[11px] font-bold">
                            {{ load.status_factoring === 'sent' ? 'Sent' : 'Not Submitted' }}
                          </UBadge>
                          <UBadge v-if="load.status_factoring === 'sent' && load.factoring_sent_at" class="font-mono" color="neutral" variant="soft">
                            {{ new Date(load.factoring_sent_at).toLocaleDateString() }}
                          </UBadge>
                        </UFieldGroup>
                      </div>
                    </div>
                    <div class="flex items-center gap-2 no-print ml-4">
                      <p class="text-xs text-gray-500">Email Status:</p>
                      <UBadge 
                        :color="load.status_email === 'sent' ? 'success' : 'neutral'" 
                        class="uppercase text-[11px] font-bold">
                        {{ load.status_email === 'sent' ? 'Sent to Driver' : 'Not Sent' }}
                      </UBadge>
                    </div>
                  </div>
                </div>
              </template>

              <div class="flex items-start justify-between gap-6">
                <div class="grid gap-3 text-sm font-mono">
                  <div class="flex gap-8">
                    <div>
                      <p class="text-xs text-gray-500">Broker</p>
                      <p class="text-highlighted font-bold">
                        {{ load.broker?.name || 'N/A' }}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500">Dispatcher</p>
                      <p class="text-highlighted font-bold">
                        {{ load.dispatcher?.name || load.dispatcher?.username || 'None' }}
                      </p>
                    </div>
                  </div>
                  <div class="flex flex-col gap-2">
                    <div v-if="load.status_load === 'tonu'">
                      <p class="text-xs font-semibold">TONU Amount</p>
                      <p class="text-highlighted font-bold">
                        $ {{ load.tonu_amount || 0 }}
                      </p>
                    </div>
                    <div v-else class="flex gap-8">
                      <div v-if="permissions.canViewDriversRate">
                        <p class="text-xs text-gray-500">
                          <span class="no-print">Driver's</span> Rate
                        </p>
                        <p class="text-highlighted font-bold">
                          $ {{ load.drivers_rate }}
                        </p>
                      </div>
                      <div v-if="permissions.canViewOriginalRate" class="no-print">
                        <p class="text-xs text-gray-500">Original Rate</p>
                        <p class="text-highlighted font-bold">
                          $ {{ load.original_rate }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-4 font-mono">
                    <UBadge v-if="load.miles" :label="`DISTANCE: ${load.miles} Miles`" variant="soft" />
                    <UBadge v-if="load.weight" :label="`WEIGHT:  ${load.weight} Lbs`" variant="soft" />
                  </div>
                </div>

                <div class="text-right">
                  <img src="/coast_to_coast_480x200.png" class="w-60" alt="COAST TO COAST INC." />
                </div>
              </div>
            </UCard>

            <!-- ROUTE -->
            <UCard title="Route" variant="soft" class="print-card">
              <UTimeline :items="timelineItems" 
                :orientation="timelineItems.length > 5 ? 'vertical' : 'horizontal'" class="w-full">
                <template v-for="item in timelineItems" :key="item.slot" #[`${item.slot}-title`]="{ item: currentItem }">
                  <TimelineCard 
                    :title="currentItem.title"
                    :city-state="currentItem.cityState"
                    :full-address="currentItem.fullAddress"
                    :date="currentItem.pickupDate || currentItem.deliveryDate"
                    :time="currentItem.time" />
                </template>
              </UTimeline>
            </UCard>

            <!-- DRIVER -->
            <UCard variant="soft" class="print-card">
              <template #header>
                <ULink v-if="load.driver" :to="`/dashboard/drivers/${load.driver.documentId}`" class="flex items-center justify-between w-full gap-3">
                  <p class="font-bold text-highlighted">
                    {{ load.driver.first_name }} {{ load.driver.last_name }}
                  </p>
                  <p class="text-xs text-gray-500">
                    {{ load.driver.email || 'No email' }}
                  </p>
                </ULink>
              </template>
              <div v-if="load.driver" class="flex flex-col gap-4 w-full">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm font-mono">
                  <div>
                    <p class="text-xs text-gray-500">Truck No.</p>
                    <UFieldGroup v-if="load.driver.truck_number">
                      <UButton :label="load.driver.truck_number" variant="link" size="sm" />
                      <UButton 
                        icon="hugeicons:copy-01" 
                        variant="link" 
                        size="sm"
                        class="no-print"
                        @click="copyBoofer(load.driver.truck_number)" />
                    </UFieldGroup>
                    <p v-else class="italic text-gray-500">N/A</p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-500">Trailer No.</p>
                    <UFieldGroup v-if="load.driver.trailer_number">
                      <UButton :label="load.driver.trailer_number" variant="link" size="sm" />
                      <UButton 
                        icon="hugeicons:copy-01" 
                        variant="link" 
                        size="sm"
                        class="no-print"
                        @click="copyBoofer(load.driver.trailer_number)" />
                    </UFieldGroup>
                    <p v-else class="italic text-gray-500">N/A</p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-500">Trailer Type</p>
                    <div class="flex items-center gap-1 text-sm font-semibold text-highlighted capitalize">
                      <UIcon :name="getTrailerIcon(load.driver.trailer)" class="w-5 h-5 text-primary print-icon" />
                      {{ getTrailerLabel(load.driver.trailer) }}
                    </div>
                  </div>
                  <div>
                    <p class="text-xs text-gray-500">Phone</p>
                    <p class="text-highlighted text-sm">
                      {{ load.driver.phone || 'N/A' }}
                    </p>
                  </div>
                </div>
              </div>
              <div v-else class="text-center p-4">
                <p class="text-sm text-red-500 font-semibold">Unassigned</p>
                <p class="text-xs text-gray-500 mt-1">This load has no dispatcher/driver link.</p>
              </div>
            </UCard>

            <!-- DOCS -->
            <UCard title="Attachments" variant="soft" class="no-print">
              <div class="space-y-6">
                <div>
                  <h4 class="text-xs text-gray-500 font-semibold uppercase mb-2">
                    Rate Confirmation
                  </h4>
                  <div v-if="load.doc_rate_confirmation?.length" class="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div v-for="file in load.doc_rate_confirmation" :key="file.id" 
                      class="flex items-center gap-3 p-2 border border-primary/20 rounded-lg hover:border-primary/50 transition cursor-pointer group print-file-row"
                      @click="handleFileClick(file)">
                      <div class="w-12 h-12 shrink-0 rounded-md overflow-hidden flex items-center justify-center">
                        <img v-if="isImageFile(file)" :src="thumbImg(file)" class="w-full h-full object-cover" />
                        <UIcon v-else :name="getFileIcon(file)" class="w-8 h-8 text-primary print-icon" />
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="text-xs font-semibold text-highlighted truncate group-hover:text-primary transition">
                          {{ file.name || file.url.split('/').pop() }}
                        </p>
                        <p class="text-xs text-gray-500 uppercase mt-1 font-mono">
                          {{ getMime(file) }}
                        </p>
                      </div>
                      <UButton 
                        icon="hugeicons:download-01" 
                        variant="soft" 
                        size="sm" 
                        title="Download"
                        class="no-print"
                        @click.stop="downloadFile(getFileUrl(file))" />
                    </div>
                  </div>
                  <p v-else class="text-xs text-gray-500 italic">No Rate Confirmation uploaded.</p>
                </div>

                <USeparator />

                <div>
                  <h4 class="text-xs text-gray-500 font-semibold uppercase mb-2">
                    Proof of Delivery
                  </h4>
                  <div v-if="load.doc_pod_bol?.length" class="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div v-for="file in load.doc_pod_bol" :key="file.id" 
                      class="flex items-center gap-3 p-2 border border-primary/20 rounded-lg hover:border-primary/50 transition cursor-pointer group print-file-row"
                      @click="handleFileClick(file)">
                      <div class="w-12 h-12 shrink-0 rounded-md overflow-hidden flex items-center justify-center">
                        <img v-if="isImageFile(file)" :src="thumbImg(file)" class="w-full h-full object-cover" />
                        <UIcon v-else :name="getFileIcon(file)" class="w-8 h-8 text-primary" />
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="text-xs font-semibold text-highlighted truncate group-hover:text-primary transition">
                          {{ file.name || file.url.split('/').pop() }}
                        </p>
                        <p class="text-xs text-gray-500 uppercase mt-1 font-mono">
                          {{ getMime(file) }}
                        </p>
                      </div>
                      <UButton 
                        icon="hugeicons:download-01" 
                        variant="soft" 
                        size="sm" 
                        title="Download"
                        class="no-print"
                        @click.stop="downloadFile(getFileUrl(file))" />
                    </div>
                  </div>
                  <p v-else class="text-xs text-gray-500 italic">No POD/BOL documents uploaded yet.</p>
                </div>
              </div>

              <UAccordion v-if="accordionItems.length"
                :items="accordionItems" 
                trailing-icon="hugeicons:add-01"
                class="no-print mt-4">
                <template #rate-conf-upload>
                  <div class="p-4 space-y-4 bg-muted/20 border border-default rounded-lg">
                    <UploaderFiles 
                      ref="rateUploaderPageRef" 
                      label="Rate Confirmation" />
                    <div class="flex justify-end">
                      <UButton 
                        label="Upload Rate Confirmation" 
                        color="primary" 
                        :loading="uploadingPageRate" 
                        @click="handleUploadPageRate" />
                    </div>
                  </div>
                </template>

                <template #pod-upload>
                  <div class="p-4 space-y-2 bg-muted/20 border border-default rounded-lg">
                    <UploaderFiles ref="podUploaderPageRef" label="Proof of Delivery (POD / BOL)" />
                    <div class="flex justify-end">
                      <UButton 
                        label="Upload POD/BOL" 
                        color="primary" 
                        :loading="uploadingPagePod" 
                        @click="handleUploadPagePod" />
                    </div>
                  </div>
                </template>
              </UAccordion>
            </UCard>

            <div class="grid grid-cols-2 gap-4 print-grid-2">
              <UCard variant="soft" class="print-card">
                <h4 class="text-xs text-gray-500 font-semibold uppercase mb-2">
                  Pickup Number
                </h4>
                <p class="text-xs text-highlighted font-mono wrap-anywhere">
                  {{ load.pickup_number || 'N/A' }}
                </p>
              </UCard>
              <UCard variant="soft" class="print-card">
                <h4 class="text-xs text-gray-500 font-semibold uppercase mb-2">
                  Delivery Number
                </h4>
                <p class="text-xs text-highlighted font-mono wrap-anywhere">
                  {{ load.delivery_number || 'N/A' }}
                </p>
              </UCard>
            </div>

            <!-- NOTES -->
            <Notes 
              v-if="permissions.canViewNotes"  
              :load-id="load?.documentId" 
              :notes="load?.notes || []" 
              @refresh="handleRefresh" />
          </div>
        </div>

        <div v-else class="flex-1 flex items-center justify-center p-4">
          <p class="text-muted">You do not have access rights to this section.</p>
        </div>

        <!-- LOAD EDIT -->
        <LoadEdit v-model:open="isEditOpen" :load="load" @success="handleRefresh" />

        <!-- FILE/PHOTO PREVIEW -->
        <UModal v-model:open="isPreviewOpen" :ui="{ width: 'sm:max-w-3xl' }">
          <template #content>
            <div class="p-4 flex flex-col items-center">
              <div class="w-full flex justify-between items-center mb-3">
                <h4 class="text-sm font-bold truncate text-highlighted max-w-lg">
                  {{ previewFile?.name }}
                </h4>
                <UButton icon="i-lucide-x" color="neutral" variant="ghost" @click="isPreviewOpen = false" />
              </div>
              <div class="relative max-h-[75vh] overflow-auto flex items-center justify-center bg-black/40 rounded-lg p-2 w-full">
                <img :src="previewFile?.fullUrl" 
                  class="max-h-[65vh] w-auto h-auto object-contain rounded-md" 
                  alt="Document attachment preview" />
              </div>
              <div class="mt-3 flex justify-end w-full gap-2">
                <UButton 
                  icon="hugeicons:link-square-02" 
                  label="Open in new tab" 
                  color="neutral" 
                  variant="outline"
                  @click="downloadFile(previewFile?.fullUrl)" />
                <UButton 
                  icon="hugeicons:cloud-download" 
                  label="Download" 
                  color="primary" 
                  @click="downloadFile(previewFile?.fullUrl)" />
              </div>
            </div>
          </template>
        </UModal>

        <!-- CHANGE LOAD STATUS -->
        <UModal v-model:open="isOpenActions" :title="`Change status load: ${load?.load_number}`" close-icon="hugeicons:cancel-01" :ui="{ content: 'sm:max-w-xs' }">
          <template #body>
            <div v-if="(permissions.isDispatcher || permissions.isAdmin) && ['not_started', 'in_transit', 'loaded'].includes(load.status_load)" class="space-y-3">
              <template v-if="!isTonuMode">
                <p class="text-xs text-gray-500 font-semibold">
                  Current: <span class="uppercase text-highlighted">
                    {{ (load?.status_load).replace('_', ' ') }}
                  </span>
                </p>
                <div class="flex flex-col gap-3">
                  <UButton 
                    v-if="(permissions.isDriver || permissions.isDispatcher || permissions.isAdmin)"
                    icon="hugeicons:package-delivered" 
                    :label="load?.status_load === 'in_transit' ? 'Mark as Loaded' : 'Mark as In Transit'" 
                    color="info" 
                    :loading="statusUpdating" 
                    @click="changeStatusDirectly(load?.status_load === 'in_transit' ? 'loaded' : 'in_transit')" 
                    block />
                  <UButton 
                    label="Set TONU" 
                    color="error" 
                    icon="hugeicons:alert-02" 
                    @click="isTonuMode = true" 
                    block />
                  <UButton 
                    label="Cancel Load" 
                    color="error" 
                    icon="hugeicons:cancel-circle" 
                    :loading="statusUpdating"
                    @click="changeStatusDirectly('cancelled')" 
                    block />
                </div>
              </template>
              <template v-else>
                <div class="space-y-4">
                  <p class="text-sm text-gray-500">
                    Please specify the TONU compensation amount for the driver:
                  </p>
                  <UFormField label="TONU Amount" required>
                    <UInput v-model.number="tonuAmount" type="number" step="0.01" min="0.01" placeholder="Enter amount (e.g. 150)" class="w-full">
                      <template #trailing><div class="input_trailing">$</div></template>
                    </UInput>
                  </UFormField>
                  <div class="flex gap-2">
                    <UButton label="Cancel" color="neutral" variant="ghost" @click="isTonuMode = false" class="flex-1" />
                    <UButton label="Confirm TONU" color="error" :loading="statusUpdating" :disabled="tonuAmount <= 0" @click="confirmTonuDirectly" class="flex-1" />
                  </div>
                </div>
              </template>
            </div>
            <div v-else>
              <p class="text-sm text-gray-400 italic">
                No quick actions available for the current status.
              </p>
            </div>
          </template>
        </UModal>

        <!-- SEND PDF TO DRIVER BY EMAIL -->
        <UModal v-model:open="isOpenSendLoadModal" title="Send Load to Driver" close-icon="hugeicons:cancel-01" :ui="{ content: 'sm:max-w-xs' }">
          <template #body>
            <div class="space-y-3">
              <p class="text-sm text-gray-500">
                Review the email addresses before dispatching the load details.
              </p>
              <UFormField label="Driver's Email">
                <UInput 
                  :model-value="load?.driver?.email" 
                  disabled 
                  icon="hugeicons:mail-01" 
                  class="w-full" />
              </UFormField>
              <UFormField label="Send CC to (your email)">
                <UInput 
                  v-model="ccLoadEmail" 
                  type="email" 
                  icon="hugeicons:mail-send-01" 
                  class="w-full" />
              </UFormField>
            </div>

            <div class="dashboard flex justify-between gap-2 pt-6">
              <UButton 
                label="Cancel" 
                color="neutral" 
                variant="soft" 
                @click="isOpenSendLoadModal = false" />
              <UButton 
                label="Confirm & Send" 
                color="primary" 
                variant="solid" 
                :loading="isSendingLoad" 
                @click="handleSendLoadEmail" />
            </div>
          </template>
        </UModal>

      </template>
    </UDashboardPanel>
  </div>
</template>