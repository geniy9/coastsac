// pages/dashboard/index.vue
<script setup>
definePageMeta({ 
  layout: 'dashboard',
})
import { sub } from "date-fns";
const { permissions } = useRolePermissions()

const range = shallowRef({
  start: sub(new Date(), { days: 14 }),
  end: new Date(),
});
const period = ref("daily");
</script>
<template>
  <div class="dashboard_main">
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

        <UDashboardToolbar v-if="permissions.canViewStats">
          <template #left>
            <HomeDateRangePicker v-model="range" class="-ms-1" />
            <HomePeriodSelect v-model="period" :range="range" />
          </template>
        </UDashboardToolbar>
      </template>

      <template #body>
        <HomeStats v-if="permissions.canViewStats" :period="period" :range="range" />
        <div v-else class="flex flex-col gap-2 items-center max-w-lg mx-auto">
          <UPageCard 
            title="С2С Panel Access"
            description="To gain access to the dashboard, contact the Coast to Coast Administrator"
            icon="hugeicons:access"
            orientation="horizontal"
            spotlight
            spotlight-color="primary"
            :ui="{ leadingIcon: 'size-8 shrink-0 text-primary' }">
            <div class="flex flex-col gap-2 items-center">
              <AppLogo variant="outline" class="w-36" />
              <Feedback subject="C2C Access request">
                <UButton size="sm" variant="soft">
                  Request access
                </UButton>
              </Feedback>
            </div>
          </UPageCard>
        </div>
        
        <!-- <HomeLoads :period="period" :range="range" /> -->
        <!-- <HomeChart :period="period" :range="range" /> -->
      </template>
    </UDashboardPanel>
  </div>
</template>
