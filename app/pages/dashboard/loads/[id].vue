<!-- pages/dashboard/loads/[id].vue -->
<script setup>
definePageMeta({ 
  layout: 'dashboard'
})

const route = useRoute()
const loadId = route.params.id
const { permissions } = useRolePermissions()
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

const isEditOpen = ref(false)
const isPreviewOpen = ref(false)
const previewFile = ref(null)

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
        'factoring', 
        'shipper_address', 
        'receiver_address'
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

  return [
    {
      title: 'Shipper',
      icon: 'hugeicons:delivery-box-01',
      slot: 'shipper',
      cityState: `${shipper?.city || 'N/A'}, ${shipper?.state || 'N/A'}`,
      fullAddress: shipper?.full_address || 'No full address specified',
      pickupDate: load.value.pickup_date || '-',
      time: load.value.pickup_time ? load.value.pickup_time.slice(0, 5) : null,
      ui: {
        indicator: 'text-white bg-primary dark:bg-primary dark:text-inverted border-2 border-primary',
        separator: active 
          ? 'bg-primary flex-1 rounded-full' 
          : 'bg-gray-300 dark:bg-gray-600 flex-1 rounded-full'
      }
    },
    {
      title: 'Receiver',
      icon: 'hugeicons:dropbox',
      slot: 'receiver',
      cityState: `${receiver?.city || 'N/A'}, ${receiver?.state || 'N/A'}`,
      fullAddress: receiver?.full_address || 'No full address specified',
      deliveryDate: load.value.delivery_date || 'In Transit',
      time: load.value.delivery_time ? load.value.delivery_time.slice(0, 5) : null,
      ui: {
        indicator: active
          ? 'text-white bg-primary border-2 border-primary'
          : 'text-gray-400 bg-transparent dark:bg-transparent border-2 border-gray-300 dark:border-gray-500 dark:text-gray-500',
        separator: 'hidden'
      }
    }
  ]
})

const handleRefresh = async () => {
  await refresh()
}

const printProfile = () => {
  if (import.meta.client) {
    window.print()
  }
}
const downloadFile = (url) => {
  if (import.meta.client) {
    window.open(url, '_blank')
  }
}

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
                label="Print" 
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
                <div class="flex flex-wrap items-center justify-between gap-4">
                  <div class="flex items-center gap-4">
                    <h1 class="text-2xl font-bold text-highlighted">
                      Load #{{ load.load_number }}
                    </h1>
                    <UBadge :color="getStatusColor(load.status_load)" variant="solid" class="capitalize print-badge">
                      {{ (load.status_load || 'not_started').replace('_', ' ') }}
                    </UBadge>
                    <UBadge color="primary" class="capitalize print-badge">
                      {{ load.category }}
                    </UBadge>
                  </div>
                </div>
              </template>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm font-mono">
                <div class="p-2 border-r border-default/40 last:border-0">
                  <p class="text-xs text-gray-500">Broker</p>
                  <p class="text-highlighted font-bold text-md mt-1">
                    {{ load.broker?.name || 'N/A' }}
                  </p>
                </div>
                <div class="p-2 border-r border-default/40 last:border-0">
                  <p class="text-xs text-gray-500">Dispatcher</p>
                  <p class="text-highlighted mt-1">
                    {{ load.dispatcher?.name || load.dispatcher?.username || 'None' }}
                  </p>
                </div>
                <div class="p-2 border-r border-default/40 last:border-0">
                  <p class="text-xs text-gray-500">Pickup Date</p>
                  <p class="text-highlighted mt-1">
                    {{ load.pickup_date || '-' }}
                  </p>
                </div>
                <div class="p-2 last:border-0">
                  <p class="text-xs text-gray-500">Delivery Date</p>
                  <p class="text-highlighted mt-1">
                    {{ load.delivery_date || 'Not yet' }}
                  </p>
                </div>
              </div>
            </UCard>

            <!-- BODY -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 print-grid">
              
              <!-- LEFT COL -->
              <div class="md:col-span-2 space-y-4 print-col-span-2">
                
                <!-- ROUTE (Timeline) -->
                <UCard variant="soft" title="Route Information" class="print-card">
                  <UTimeline :items="timelineItems" class="w-full">
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
                            <UIcon name="hugeicons:calendar-03" class="w-4 h-4 text-gray-400 print-icon" />
                            {{ item.pickupDate }}
                          </span>
                          <span v-if="item.time" class="flex items-center gap-1">
                            <UIcon name="hugeicons:clock-01" class="w-4 h-4 text-gray-400 print-icon" />
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
                            {{ item.deliveryDate }}
                          </span>
                          <span v-if="item.time" class="flex items-center gap-1">
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
                    <!-- Rate Confirmation -->
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

                    <!-- POD / BOL -->
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
                      <p v-else class="text-xs text-gray-500 italic">No POD/BOL documents uploaded yet.</p>
                    </div>
                  </div>
                </UCard>

                <!-- Notes -->
                <UCard variant="soft" title="Notes" class="print-card">
                  <p v-if="load.notes" class="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed print-notes">
                    {{ load.notes }}
                  </p>
                  <p v-else class="text-sm text-gray-500 italic">No cargo notes created yet.</p>
                </UCard>

              </div>

              <!-- RIGHT COL -->
              <div class="space-y-4">
                
                <!-- Driver -->
                <UCard variant="soft" title="Driver & Transport" class="print-card">
                  <div v-if="load.driver" class="flex flex-col gap-4">
                    <div class="flex items-center gap-3">
                      <UAvatar 
                        v-if="thumbImg(load.driver.user_account.avatar)"
                        :src="thumbImg(load.driver.user_account.avatar)" 
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
                    
                    <USeparator />

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

                <!-- Factoring -->
                <UCard 
                  v-if="permissions.isAdmin || permissions.isAccounting"
                  variant="soft" 
                  title="Accounting / Factoring" 
                  class="print-card">
                  
                  <div class="space-y-3 font-mono text-xs">
                    <div class="flex justify-between items-center py-1 border-b border-default/40">
                      <span class="text-gray-500">Factoring Status</span>
                      <UBadge color="neutral" variant="solid" class="capitalize print-badge">
                        {{ (load.factoring_status || 'not_submitted').replace('_', ' ') }}
                      </UBadge>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-gray-500">Invoice Amount</span>
                      <span class="text-sm font-bold text-highlighted">
                        ${{ load.factoring?.invoice_amount || 0 }}
                      </span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-gray-500">Advance Received</span>
                      <span class="text-highlighted">
                        ${{ load.factoring?.advance_received || 0 }}
                      </span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-gray-500">Factoring Fee</span>
                      <span class="text-highlighted">
                        ${{ load.factoring?.factoring_fee || 0 }}
                      </span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-gray-500">Remaining Balance</span>
                      <span class="text-highlighted">
                        ${{ load.factoring?.remaining_balance || 0 }}
                      </span>
                    </div>
                    
                    <USeparator />

                    <div class="flex justify-between items-center">
                      <span class="text-gray-500">Funding Date</span>
                      <span class="text-highlighted">{{ load.factoring?.funding_date || '-' }}</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-gray-500">Payment Date</span>
                      <span class="text-highlighted">{{ load.factoring?.payment_date || '-' }}</span>
                    </div>
                  </div>
                </UCard>

              </div>

            </div>
          </div>
        </div>

        <div v-else class="flex-1 flex items-center justify-center p-4">
          <p class="text-muted">You do not have access rights to this section.</p>
        </div>

        <!-- Окно редактирования груза -->
        <LoadEdit v-model:open="isEditOpen" :load="load" @success="handleRefresh" />

        <!-- Модалка для предпросмотра изображений документов -->
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
                  icon="i-lucide-external-link" 
                  label="Open in new tab" 
                  color="neutral" 
                  variant="outline"
                  @click="downloadFile(previewFile?.fullUrl)" />
                <UButton 
                  icon="i-lucide-download" 
                  label="Download" 
                  color="primary" 
                  @click="downloadFile(previewFile?.fullUrl)" />
              </div>
            </div>
          </template>
        </UModal>

      </template>
    </UDashboardPanel>
  </div>
</template>