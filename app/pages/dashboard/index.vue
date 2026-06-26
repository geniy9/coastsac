// pages/dashboard/index.vue
<script setup>
definePageMeta({ 
  layout: 'dashboard',
})
import { sub } from "date-fns";

const range = shallowRef({
  start: sub(new Date(), { days: 14 }),
  end: new Date(),
});
const period = ref("daily");
</script>
<template>
  <div class="flex-1 flex flex-col min-h-0">
    <UDashboardPanel id="home">
      <template #header>
        <UDashboardNavbar title="Home" :ui="{ right: 'gap-3' }">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>

          <template #right>
            <!-- <UDropdownMenu :items="items">
              <UButton icon="i-lucide-plus" size="md" class="rounded-full" />
            </UDropdownMenu> -->
          </template>
        </UDashboardNavbar>

        <UDashboardToolbar>
          <template #left>
            <HomeDateRangePicker v-model="range" class="-ms-1" />
            <HomePeriodSelect v-model="period" :range="range" />
          </template>
        </UDashboardToolbar>
      </template>

      <template #body>
        <HomeStats :period="period" :range="range" />
        <HomeChart :period="period" :range="range" />
        <HomeLoads :period="period" :range="range" />
      </template>
    </UDashboardPanel>
  </div>
</template>
