<!-- pages/dashboard/drivers/[id].vue -->
<script setup>
definePageMeta({ 
  layout: 'dashboard'
})

const route = useRoute()
const driverId = route.params.id
const { permissions } = useRolePermissions()
const client = useStrapiClient()
const { 
  trailerOptions, 
  driverTypeOptions, 
  getFileUrl,
  isImageFile,
  thumbImg, 
  copyBoofer, 
  getExpiryColor 
} = useConfig()

const isEditOpen = ref(false)
const isPreviewOpen = ref(false)
const previewFile = ref(null)

// REQUEST DRIVER DETAILS
const { data: response, status, refresh } = await useAsyncData(`driver-${driverId}`, () => 
  client(`/drivers/${driverId}`, {
    query: {
      populate: [
        'assigned_dispatcher', 
        'deductions', 
        'user_account.avatar',
        'extra_info.docs'
      ]
    }
  }), {
    lazy: true,
    default: () => null
  }
)
const driver = computed(() => response.value?.data || response.value || null)

const displayName = computed(() => {
  if (!driver.value) return ''
  const first = driver.value.first_name || ''
  const last = driver.value.last_name || ''
  return `${first} ${last}`.trim() || driver.value.user_account?.username || 'Driver Profile'
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
const getDriverTypeLabel = (type) => {
  const option = driverTypeOptions.find(opt => opt.value === type)
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
    <UDashboardPanel :id="driverId || 'driver-id'">
      <template #header>
        <UDashboardNavbar :title="displayName || 'Loading...'" class="no-print">
          <template #leading>
            <UDashboardSidebarCollapse />
            <UButton 
              icon="i-lucide-arrow-left" 
              color="neutral" 
              variant="ghost" 
              to="/dashboard/drivers" />
          </template>
          <template #right>
            <div class="flex items-center gap-2">
              <UButton 
                icon="hugeicons:printer" 
                color="neutral" 
                variant="outline" 
                @click="printProfile" />
              <UButton 
                v-if="permissions.canEditDrivers"
                icon="hugeicons:pencil-edit-02" 
                label="Edit" 
                color="primary" 
                @click="isEditOpen = true" />
            </div>
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <div class="flex-1 flex flex-col min-h-0" v-if="permissions.canViewDrivers">
          <div v-if="status === 'pending' && !driver" class="flex-1 flex flex-col items-center justify-center gap-2">
            <p class="text-sm text-gray-500">Loading profile data...</p>
          </div>
          <!-- Driver not found -->
          <div v-else-if="!driver" class="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
            <p class="text-lg font-semibold text-error">Driver profile not found</p>
            <UButton to="/dashboard/drivers" label="Go to Drivers List" color="neutral" variant="ghost" />
          </div>

          <div v-else class="print-area space-y-4 overflow-y-auto flex-1 w-full pr-4">
            
            <!-- HEAD PROFILE-->
            <UCard variant="soft">
              <template #header>
                <div class="flex flex-wrap items-center gap-4">
                  <h1 class="text-2xl font-bold text-highlighted">
                    {{ displayName }}
                  </h1>
                  <UBadge color="primary" variant="solid">
                    {{ getDriverTypeLabel(driver.driver_type) }}
                  </UBadge>
                  <UBadge :color="driver.user_account?.blocked ? 'error' : 'success'" variant="soft">
                    {{ driver.user_account ? (driver.user_account.blocked ? 'No Access' : 'Has Access') : 'No Account' }}
                  </UBadge>
                </div>
              </template>

              <div class="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div class="flex items-center gap-5">
                  <UAvatar 
                    :src="driver.user_account?.avatar ? thumbImg(driver.user_account.avatar) : ''" 
                    :alt="displayName"
                    class="w-20 h-20 sm:w-32 sm:h-32 rounded-full border-2 border-primary" />
                  <div class="flex flex-col gap-2 font-mono text-sm text-gray-500">
                    <span class="flex items-center gap-2">
                      <UIcon name="hugeicons:identity-card" class="w-5 h-5" />
                      <span class="text-highlighted">Driver No: {{ driver.driver_number || '-' }}</span>
                    </span>
                    <span v-if="driver.phone" class="flex items-center gap-2">
                      <UIcon name="hugeicons:call-02" class="w-5 h-5" /> 
                      <span class="text-highlighted">{{ driver.phone }}</span>
                    </span>
                    <span v-if="driver.email" class="flex items-center gap-2">
                      <UIcon name="hugeicons:mail-01" class="w-5 h-5" /> 
                      <span class="text-highlighted">{{ driver.email }}</span>
                    </span>
                  </div>
                </div>
                
                <div class="flex flex-row md:flex-col gap-2 w-full md:w-auto text-sm font-mono">
                  <div class="p-3 flex-1 md:text-right">
                    <p class="text-xs text-gray-500">Hired Date</p>
                    <p class="text-highlighted">
                      {{ driver.hired_date || '-' }}
                    </p>
                  </div>
                  <div class="p-3 flex-1 md:text-right">
                    <p class="text-xs text-gray-500">Assigned Dispatcher</p>
                    <p class="text-highlighted">
                      {{ driver.assigned_dispatcher?.name || driver.assigned_dispatcher?.username || 'None' }}
                    </p>
                  </div>
                </div>
              </div>
            </UCard>

            <!-- BODY PROFILE -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <!-- LEFT -->
              <div class="md:col-span-2 space-y-4">
                
                <!-- Licenses -->
                <UCard variant="soft" title="Licenses & Compliance">
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div class="grid gap-1 justify-start">
                      <p class="text-xs text-gray-500">CDL Number</p>
                      <UFieldGroup v-if="driver.cdl_number">
                        <UButton :label="driver.cdl_number" variant="soft" size="sm" />
                        <UButton 
                          icon="hugeicons:copy-01" 
                          variant="soft" 
                          size="sm"
                          @click="copyBoofer(driver.cdl_number)" />
                      </UFieldGroup>
                      <p v-else class="text-xs text-gray-500 italic">N/A</p>
                    </div>
                    <div class="grid gap-1 justify-start">
                      <p class="text-xs text-gray-500">CDL Expiry</p>
                      <UBadge :color="getExpiryColor(driver.cdl_expiry)" variant="soft">
                        {{ driver.cdl_expiry || 'N/A' }}
                      </UBadge>
                    </div>
                    <div class="grid gap-1 justify-start">
                      <p class="text-xs text-gray-500">Medical Expiry</p>
                      <UBadge :color="getExpiryColor(driver.medical_expiry)" variant="soft">
                        {{ driver.medical_expiry || 'N/A' }}
                      </UBadge>
                    </div>
                  </div>
                </UCard>

                <!-- Extra info -->
                <UCard variant="soft" title="Extra Information">
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div class="grid gap-1">
                      <p class="text-xs text-gray-500">Company Name</p>
                      <p class="text-sm text-highlighted">
                        {{ driver.extra_info?.company_name || 'N/A' }}
                      </p>
                    </div>
                    <div class="grid gap-1">
                      <p class="text-xs text-gray-500">Emergency Phone</p>
                      <p class="text-sm text-highlighted font-mono">
                        {{ driver.extra_info?.emergency_phone || 'N/A' }}
                      </p>
                    </div>
                    <div class="grid gap-1">
                      <p class="text-xs text-gray-500">EIN Number</p>
                      <p class="text-sm text-highlighted font-mono">
                        {{ driver.extra_info?.ein_number || 'N/A' }}
                      </p>
                    </div>
                  </div>
                  <div class="grid gap-1">
                    <p class="text-xs text-gray-500">Home Address</p>
                    <p class="text-sm text-highlighted">
                      {{ driver.extra_info?.home_address || 'N/A' }}
                    </p>
                  </div>
                </UCard>

                <!-- ATTACHMENTS -->
                <UCard variant="soft">
                  <template #header>
                    <div class="flex items-center justify-between">
                      <h2 class="text-md font-semibold text-highlighted">
                        Attached Documents
                      </h2>
                      <span class="text-xs text-gray-500">
                        {{ driver.extra_info?.docs?.length || 0 }} files
                      </span>
                    </div>
                  </template>
                  <div v-if="driver.extra_info?.docs?.length" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div v-for="file in driver.extra_info.docs" :key="file.id" 
                      class="flex items-center gap-3 p-2 border border-primary/20 rounded-lg hover:border-primary/50 transition cursor-pointer group"
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
                          {{ (file.ext || 'FILE').replace('.', '') }}
                        </p>
                      </div>
                      <div class="flex items-center gap-1">
                        <UButton 
                          icon="hugeicons:download-01" 
                          variant="soft" 
                          size="sm" 
                          title="Download"
                          @click.stop="downloadFile(getFileUrl(file))" />
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-center text-sm text-gray-500">
                    <p>No documents uploaded.</p>
                  </div>
                </UCard>

                <UCard variant="soft" title="Notes">
                  <p v-if="driver.notes" class="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {{ driver.notes }}
                  </p>
                  <p v-else class="text-sm text-gray-500 italic">No notes created yet.</p>
                </UCard>
              </div>

              <!-- RIGHT -->
              <div class="space-y-4">
                
                <!-- Transport -->
                <UCard variant="soft" title="Transport">
                  <div class="flex flex-col gap-2">
                    <div class="flex justify-between items-center">
                      <span class="text-xs text-gray-500">Truck Number</span>
                      <UFieldGroup v-if="driver.truck_number">
                        <UButton :label="driver.truck_number" variant="soft" size="sm" />
                        <UButton 
                          icon="hugeicons:copy-01" 
                          variant="soft" 
                          size="sm"
                          @click="copyBoofer(driver.truck_number)" />
                      </UFieldGroup>
                      <p v-else class="text-xs text-gray-500 italic">N/A</p>
                    </div>
                    <div class="flex justify-between items-center py-0.5">
                      <span class="text-xs text-gray-500">Trailer Type</span>
                      <div class="flex items-center gap-1.5 text-sm text-highlighted font-semibold capitalize">
                        <UIcon :name="getTrailerIcon(driver.trailer)" class="w-5 h-5 text-primary" />
                        {{ getTrailerLabel(driver.trailer) }}
                      </div>
                    </div>
                  </div>
                </UCard>

                <!-- Deductions -->
                <UCard variant="soft" title="Weekly Deductions">
                  <div class="space-y-3 font-mono">
                    <div class="flex justify-between items-center">
                      <span class="text-xs text-gray-500">ELD</span>
                      <span class="text-sm text-highlighted">
                        ${{ driver.deductions?.eld || 0 }}
                      </span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-xs text-gray-500">Insurance</span>
                      <span class="text-sm text-highlighted">
                        ${{ driver.deductions?.insurance || 0 }}
                      </span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-xs text-gray-500">Plates</span>
                      <span class="text-sm text-highlighted">
                        ${{ driver.deductions?.plates || 0 }}
                      </span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-xs text-gray-500">IFTA</span>
                      <span class="text-sm text-highlighted">
                        ${{ driver.deductions?.ifta || 0 }}
                      </span>
                    </div>
                    <!-- Отображение дополнительного вычета -->
                    <div v-if="driver.deductions?.other_cost && driver.deductions?.other_reason" class="flex justify-between items-center">
                      <span class="text-xs text-gray-500 truncate max-w-40" :title="driver.deductions.other_reason">
                        {{ driver.deductions.other_reason }}
                      </span>
                      <span class="text-sm text-highlighted">
                        ${{ driver.deductions.other_cost }}
                      </span>
                    </div>
                    <div class="pt-2 flex justify-between items-center font-semibold">
                      <span class="text-xs text-gray-400">Total</span>
                      <span class="text-sm text-primary">
                        ${{ (driver.deductions?.eld || 0) + (driver.deductions?.insurance || 0) + (driver.deductions?.plates || 0) + (driver.deductions?.ifta || 0) + (driver.deductions?.other_cost || 0) }}
                      </span>
                    </div>
                  </div>
                </UCard>

                <!-- Finances & Fuel -->
                <UCard variant="soft" title="Finances & Fuel">
                  <div class="space-y-4">
                    <div class="flex justify-between items-center">
                      <span class="text-xs text-gray-500">Commission</span>
                      <span class="text-sm font-bold text-primary">
                        {{ driver.commission_rate || 0 }}%
                      </span>
                    </div>
                    <div class="flex justify-between items-center">
                      <p class="text-xs text-gray-500">Fuel Card</p>
                      <UFieldGroup v-if="driver.fuel_card_number">
                        <UButton :label="driver.fuel_card_number" variant="soft" size="sm" />
                        <UButton 
                          icon="hugeicons:copy-01" 
                          variant="soft" 
                          size="sm"
                          @click="copyBoofer(driver.fuel_card_number)" />
                      </UFieldGroup>
                      <p v-else class="text-xs text-gray-500 italic">No assigned card</p>
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


        <!-- EDIT -->
        <DriverEdit v-model:open="isEditOpen" :driver="driver" @success="handleRefresh" />
        <!-- POPUP -->
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