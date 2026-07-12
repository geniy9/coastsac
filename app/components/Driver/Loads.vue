<script setup>
const props = defineProps({
  driverId: { type: String, required: true },
  commissionRate: { type: Number, default: 0 }
})

const client = useStrapiClient()
const { getPayableAmount } = useConfig()
const loading = ref(false)
const loads = ref([])

const fetchCompletedLoads = async () => {
  loading.value = true
  try {
    const response = await client('/loads', {
      query: {
        'filters[driver][documentId][$eq]': props.driverId,
        'filters[category][$eq]': 'completed'
      }
    })
    loads.value = response.data || []
  } catch (error) {
    console.error('Failed to load driver loads:', error)
  } finally {
    loading.value = false
  }
}

onMounted(fetchCompletedLoads)

const totalFreight = computed(() => loads.value.reduce((sum, l) => sum + (l.drivers_rate || 0), 0))
const totalPayable = computed(() => {
  return loads.value.reduce((sum, l) => {
    let rate = l.status_load === 'tonu' ? l.tonu_amount : l.drivers_rate
    return sum + getPayableAmount(rate, props.commissionRate)
  }, 0)
})
</script>
<template>
  <div class="space-y-4">
    <div v-if="loading" class="text-center py-6 text-gray-500">
      Loading driver history...
    </div>
    <div v-else-if="!loads?.length" class="text-center py-6 text-gray-500 italic">
      No completed loads registered for this driver.
    </div>
    <div v-else class="overflow-hidden">
      <table class="w-full text-left text-xs border-collapse">
        <thead class="font-medium text-gray-500">
          <tr>
            <th class="p-3">Load No.</th>
            <th class="p-3">Delivery</th>
            <th class="p-3">Status</th>
            <th class="p-3 text-right">Freight</th>
            <th class="p-3 text-right">Est. Payable</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="load in loads" :key="load.id" class="border-b border-default hover:bg-elevated/10">
            <td class="p-3 font-semibold text-primary">
              <NuxtLink :to="`/dashboard/loads/${load.documentId}`">
                #{{ load.load_number }}
              </NuxtLink>
            </td>
            <td class="p-3">{{ load.delivery_date || 'N/A' }}</td>
            <td class="p-3 uppercase">{{ load.status_load }}</td>
            <td class="p-3 text-right font-mono">
              ${{ load.status_load === 'tonu' ? load.tonu_amount : load.drivers_rate }}
            </td>
            <td class="p-3 text-right font-mono text-highlighted">
              ${{ getPayableAmount(load.status_load === 'tonu' ? load.tonu_amount : load.drivers_rate, props.commissionRate) }}
            </td>
          </tr>
          <tr class="font-bold">
            <td colspan="3" class="p-3 text-gray-500">Total:</td>
            <td class="p-3 text-right font-mono">${{ totalFreight }}</td>
            <td class="p-3 text-right font-mono text-primary">${{ totalPayable }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>