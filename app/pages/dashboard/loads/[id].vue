<!-- pages/dashboard/loads/[id].vue -->
<script setup>
definePageMeta({ 
  layout: 'dashboard'
})

const route = useRoute()
const loadId = route.params.id
const { permissions, userRole } = useRolePermissions()
const client = useStrapiClient()
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

watch(isOpenActions, (newVal) => {
  if (!newVal) {
    isTonuMode.value = false
    tonuAmount.value = 0
  }
})

// Запрос детальной информации о грузе
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

  const shipper = load.value.shipper_address
  const receiver = load.value.receiver_address
  const active = isDelivered.value

  const pTime = load.value.pickup_time ? load.value.pickup_time.slice(0, 5) : null
  const pTimeEnd = load.value.pickup_time_end ? load.value.pickup_time_end.slice(0, 5) : null
  const displayPickupTime = pTimeEnd ? `${pTime} - ${pTimeEnd}` : pTime

  const dTime = load.value.delivery_time ? load.value.delivery_time.slice(0, 5) : null
  const dTimeEnd = load.value.delivery_time_end ? load.value.delivery_time_end.slice(0, 5) : null
  const displayDeliveryTime = dTimeEnd ? `${dTime} - ${dTimeEnd}` : dTime

  return [{
    title: 'Shipper',
    icon: 'hugeicons:delivery-box-01',
    slot: 'shipper',
    cityState: `${shipper?.city || 'N/A'}, ${shipper?.state || 'N/A'}`,
    fullAddress: shipper?.full_address || 'No full address specified',
    pickupDate: load.value.pickup_date || '-',
    time: displayPickupTime,
    ui: {
      indicator: 'text-white bg-primary dark:bg-primary dark:text-black border-2 border-primary print:text-gray-500',
      separator: active 
        ? 'bg-primary flex-1 rounded-full' 
        : 'bg-gray-300 dark:bg-gray-600 flex-1 rounded-full'
    }
  },{
    title: 'Receiver',
    icon: 'hugeicons:dropbox',
    slot: 'receiver',
    cityState: `${receiver?.city || 'N/A'}, ${receiver?.state || 'N/A'}`,
    fullAddress: receiver?.full_address || 'No full address specified',
    deliveryDate: load.value.delivery_date || 'Not yet',
    time: displayDeliveryTime,
    ui: {
      indicator: active
        ? 'text-white bg-primary dark:bg-primary dark:text-black border-2 border-primary print:text-gray-500'
        : 'text-gray-400 bg-transparent dark:bg-transparent border-2 border-gray-300 dark:border-gray-500 dark:text-gray-500',
      separator: 'hidden'
    }
  }]
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
    
    // Формируем объект для обновления
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
// функция изменения статуса на TONU с обязательной суммой компенсации
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
</script>
<template>
  <div class="dashboard_main">
    <UDashboardPanel :id="loadId || 'load-id'">
      <template #header>
        <UDashboardNavbar :title="load ? `Load #${load.load_number}` : 'Loading...'" class="no-print">
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

          <div v-else class="print-area space-y-4 overflow-y-auto flex-1 w-full pr-4">
            
            <!-- HEAD -->
            <UCard variant="soft" class="print-card">
              <template #header>
                <div class="flex flex-wrap items-center md:justify-between gap-4">
                  <div class="flex items-center flex-wrap gap-3">
                    <h1 class="text-2xl font-bold text-highlighted">
                      {{ load.load_number }}
                    </h1>
                    <UBadge color="primary" size="lg" class="capitalize print-badge">
                      {{ load.category }}
                    </UBadge>
                    <UFieldGroup>
                      <UButton 
                        :color="getStatusColor(load.status_load)" 
                        variant="solid" 
                        size="sm" 
                        class="uppercase print-button">
                        {{ (load.status_load || 'not_started').replace('_', ' ') }}
                      </UButton>
                      <UButton 
                        v-if="permissions.isDriver || permissions.isDispatcher || permissions.isAdmin"
                        icon="hugeicons:pencil-edit-02" 
                        color="neutral"
                        variant="outline"
                        size="sm"
                        class="no-print"
                        @click="isOpenActions = true" />
                    </UFieldGroup>
                  </div>
                  <div class="flex items-center gap-2">
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
                </div>
              </template>

              <div class="grid sm:grid-cols-3 gap-4 text-base font-mono">
                <div>
                  <p class="text-xs text-gray-500">Broker</p>
                  <p class="text-highlighted font-bold text-md mt-1">
                    {{ load.broker?.name || 'N/A' }}
                  </p>
                </div>
                <div>
                  <p class="text-xs text-gray-500">Dispatcher</p>
                  <p class="text-highlighted mt-1">
                    {{ load.dispatcher?.name || load.dispatcher?.username || 'None' }}
                  </p>
                </div>
                <div class="flex flex-col gap-2 sm:items-end sm:text-right">
                  <div v-if="load.status_load === 'tonu'">
                    <p class="text-xs text-red-500 font-semibold uppercase">TONU Amount</p>
                    <p class="text-red-500 font-bold text-md mt-1">
                      $ {{ load.tonu_amount || 0 }}
                    </p>
                  </div>
                  <template v-else>
                    <div v-if="permissions.canViewDriversRate">
                      <p class="text-xs text-gray-500">Driver's Rate</p>
                      <p class="text-highlighted mt-1">
                        $ {{ load.drivers_rate }}
                      </p>
                    </div>
                    <div v-if="permissions.canViewOriginalRate">
                      <p class="text-xs text-gray-500">Original Rate</p>
                      <p class="text-highlighted mt-1">
                        $ {{ load.original_rate }}
                      </p>
                    </div>
                  </template>
                </div>
              </div>
            </UCard>

            <!-- BODY -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 print-grid">
              
              <!-- LEFT COL -->
              <div class="md:col-span-2 space-y-4 print-col-span-2">
                
                <!-- ROUTE (Timeline) -->
                <UCard variant="soft" class="print-card">
                  <template #header>
                    <div class="flex items-center justify-between">
                      <h3 class="font-semibold text-highlighted">
                        Route
                      </h3>
                      <div class="flex items-center gap-2">
                        <UIcon name="hugeicons:road-location-01" class="w-6 h-6" />
                        <UBadge :label="`${load.miles || 0} Miles`" />
                      </div>
                    </div>
                  </template>
                  <UTimeline :items="timelineItems" orientation="horizontal" class="w-full">
                    <!-- Shipper -->
                    <template #shipper-title="{ item }">
                      <div class="flex flex-col gap-0.5">
                        <span class="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                          {{ item.title }}
                        </span>
                        <p class="text-md font-bold text-highlighted">
                          {{ item.cityState }}
                        </p>
                      </div>
                    </template>
                    <template #shipper-description="{ item }">
                      <div class="grid gap-1">
                        <p class="text-xs text-gray-400 italic">
                          {{ item.fullAddress }}
                        </p>
                        <div class="flex items-center gap-3 mt-1.5 font-mono text-xs">
                          <span class="flex items-center gap-1">
                            <UIcon name="hugeicons:calendar-03" class="w-4 h-4 text-gray-400" />
                            {{ item.pickupDate }}
                          </span>
                          <span v-if="item.time" class="flex items-center gap-1">
                            <UIcon name="hugeicons:clock-01" class="w-4 h-4 text-gray-400" />
                            {{ item.time }}
                          </span>
                        </div>
                      </div>
                    </template>

                    <!-- Receiver -->
                    <template #receiver-title="{ item }">
                      <div class="flex flex-col gap-0.5">
                        <span class="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                          {{ item.title }}
                        </span>
                        <p class="text-md font-bold text-highlighted">
                          {{ item.cityState }}
                        </p>
                      </div>
                    </template>
                    <template #receiver-description="{ item }">
                      <div class="grid gap-1">
                        <p class="text-xs text-gray-400 italic">
                          {{ item.fullAddress }}
                        </p>
                        <div class="flex items-center gap-3 mt-1.5 font-mono text-xs">
                          <span class="flex items-center gap-1">
                            <UIcon name="hugeicons:calendar-03" class="w-4 h-4 text-gray-400 print-icon" />
                            {{ item.deliveryDate || 'Not yet' }}
                          </span>
                          <span v-if="item.deliveryDate != 'Not yet' && item.time" class="flex items-center gap-1">
                            <UIcon name="hugeicons:clock-01" class="w-4 h-4 text-gray-400 print-icon" />
                            {{ item.time }}
                          </span>
                        </div>
                      </div>
                    </template>
                  </UTimeline>
                </UCard>

                <!-- DOCS -->
                <UCard variant="soft" class="print-card">
                  <template #header>
                    <h2 class="text-md font-semibold text-highlighted">
                      Attachments
                    </h2>
                  </template>
                  
                  <div class="space-y-6">
                    <div>
                      <h4 class="text-xs text-gray-500 font-semibold uppercase mb-2">
                        Rate Confirmation
                      </h4>
                      <div v-if="load.doc_rate_confirmation?.length" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <div v-if="load.doc_pod_bol?.length" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>

              <!-- RIGHT COL -->
              <div class="space-y-4">
                
                <!-- Driver -->
                <UCard variant="soft" title="Driver & Transport" class="print-card">
                  <div v-if="load.driver" class="flex flex-col gap-4">
                    <div class="flex items-center gap-3">
                      <UAvatar 
                        v-if="thumbImg(load.driver?.user_account?.avatar)"
                        :src="thumbImg(load.driver?.user_account?.avatar)" 
                        :alt="`${load.driver.first_name} ${load.driver.last_name}`"
                        size="2xl"
                        class="border border-primary print-avatar" />
                      <div>
                        <p class="font-bold text-highlighted">
                          {{ load.driver.first_name }} {{ load.driver.last_name }}
                        </p>
                        <p class="text-xs text-gray-500">
                          {{ load.driver.email || 'No email' }}
                        </p>
                      </div>
                    </div>
                    <div class="space-y-2 text-xs font-mono">
                      <div class="flex justify-between items-center">
                        <span class="text-gray-500">Truck Number</span>
                        <UFieldGroup v-if="load.driver.truck_number">
                          <UButton :label="load.driver.truck_number" variant="soft" size="sm" />
                          <UButton 
                            icon="hugeicons:copy-01" 
                            variant="soft" 
                            size="sm"
                            class="no-print"
                            @click="copyBoofer(load.driver.truck_number)" />
                        </UFieldGroup>
                        <span v-else class="italic text-gray-500">N/A</span>
                      </div>
                      <div class="flex justify-between items-center py-1">
                        <span class="text-gray-500">Trailer Type</span>
                        <div class="flex items-center gap-1 text-sm font-semibold text-highlighted capitalize">
                          <UIcon :name="getTrailerIcon(load.driver.trailer)" class="w-5 h-5 text-primary print-icon" />
                          {{ getTrailerLabel(load.driver.trailer) }}
                        </div>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-gray-500">Trailer Number</span>
                        <UFieldGroup v-if="load.driver.trailer_number">
                          <UButton :label="load.driver.trailer_number" variant="soft" size="sm" />
                          <UButton 
                            icon="hugeicons:copy-01" 
                            variant="soft" 
                            size="sm"
                            class="no-print"
                            @click="copyBoofer(load.driver.trailer_number)" />
                        </UFieldGroup>
                        <span v-else class="italic text-gray-500">N/A</span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-gray-500">Driver Phone</span>
                        <span class="text-highlighted text-sm">{{ load.driver.phone || '-' }}</span>
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-center p-4">
                    <p class="text-sm text-red-500 font-semibold">Unassigned</p>
                    <p class="text-xs text-gray-500 mt-1">This load has no dispatcher/driver link.</p>
                  </div>
                </UCard>

              </div>

            </div>

            <!-- Notes -->
            <Notes 
              v-if="permissions.canViewNotes"  
              :load-id="load?.documentId" 
              :notes="load?.notes || []" 
              @refresh="handleRefresh" 
              class="no-print" />
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

      </template>
    </UDashboardPanel>
  </div>
</template>