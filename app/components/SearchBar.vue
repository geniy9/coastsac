<script setup>
import { useApiStore } from '~/store/api'

const emit = defineEmits(['close-slideover'])
const { locale } = useI18n()
const apiStore = useApiStore()
const router = useRouter()
const route = useRoute()
const localePath = useLocalePath()

const searchValue = computed({
  get: () => apiStore.searchValue,
  set: (value) => { apiStore.searchValue = value }
})

const hasActiveFilters = computed(() => {
  return !!(searchValue.value)
})

const applyFilters = async () => {
  await apiStore.fetchServices(locale.value)
  const servicesPath = localePath('/services')
  if (route.path !== servicesPath) {
    await router.push(servicesPath)
  }
  emit('close-slideover')
}

</script>
<template>
  <div class="gap-1">
    
    <UInput
      v-model="searchValue"
      :placeholder="$t('text.search_placeholder')"
      variant="outline" 
      color="warning"
      size="lg"
      icon="material-symbols:search"
      @keydown.enter="applyFilters" 
      class="w-72 md:w-72"
    />

    <div class="grid md:flex items-center gap-2">
      <UButton v-if="hasActiveFilters"
        @click="applyFilters" 
        :label="$t('text.apply')" 
        color="secondary"
        variant="solid" 
        size="lg"
        class="cursor-pointer col-span-2" 
        :loading="apiStore.loadingServices" 
        :disabled="apiStore.loadingServices" 
        block />
    </div>

  </div>
</template>