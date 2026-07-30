<!-- pages/dashboard/index.vue -->
<script setup>
definePageMeta({ layout: 'dashboard' })
import { startOfWeek } from "date-fns";
const { permissions } = useRolePermissions()
const { isNotificationsOpen, hasUnread } = useNotifications()
const client = useStrapiClient()

const range = shallowRef({
  start: startOfWeek(new Date(), { weekStartsOn: 1 }),
  end: new Date(),
});
const period = ref("daily");

const formatDate = (date) => {
  if (!date) return null
  return date instanceof Date ? date.toISOString().split('T')[0] : new Date(date).toISOString().split('T')[0]
}

const { data: dashboardData, status } = await useAsyncData("dashboard-data", async () => {
  if (!permissions.value.canViewStats) return
  const startDateStr = formatDate(range.value?.start)
  const endDateStr = formatDate(range.value?.end)

  return await client('/loads/dashboard-stats', {
    query: {
      startDate: startDateStr,
      endDate: endDateStr
    }
  })
}, {
  watch: [range]
})
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
            <UTooltip text="Notifications" v-if="permissions.canViewNotes">
              <UButton
                color="neutral"
                variant="ghost"
                square
                @click="isNotificationsOpen = true">
                <UChip color="error" :show="hasUnread" inset>
                  <UIcon name="hugeicons:notification-01" class="size-5 shrink-0" />
                </UChip>
              </UButton>
            </UTooltip>
          </template>
        </UDashboardNavbar>

        <UDashboardToolbar v-if="permissions.canViewStats">
          <template #left>
            <DateRangePicker v-model="range" />
            <HomePeriodSelect v-model="period" :range="range" />
          </template>
        </UDashboardToolbar>
      </template>

      <template #body>
        <div class="flex flex-col gap-6 w-full" v-if="permissions.canViewStats">
          <HomeStats :data="dashboardData" :loading="status === 'pending'" />
          <HomeChart 
            :period="period" 
            :range="range" 
            :chart-data="dashboardData?.chartData || []" 
            :loading="status === 'pending'" />
        </div>

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
      </template>
    </UDashboardPanel>
  </div>
</template>