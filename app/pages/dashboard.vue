// pages/dashboard.vue
<script setup>
definePageMeta({ 
  layout: 'dashboard'
})
const { isNotificationsOpen, hasUnread } = useNotifications()
const user = useStrapiUser()
const open = ref(false)

const links = computed(() => {
  const items = []
  
  items.push({
    label: "Dashboard",
    icon: "hugeicons:dashboard-square-02",
    to: "/dashboard",
    exact: true, 
    onSelect: () => { open.value = false }
  })
  
  const userRole = user.value?.role?.type

  if (['admin', 'dispatcher', 'accounting'].includes(userRole)) {
    items.push({
      label: "Drivers",
      icon: "hugeicons:user-group-02",
      to: "/dashboard/drivers",
      onSelect: () => { open.value = false }
    })
  }

  if (['admin', 'dispatcher', 'accounting', 'driver'].includes(userRole)) {
    items.push({
      label: "Loads",
      icon: "hugeicons:lift-truck",
      to: "/dashboard/loads",
      onSelect: () => { open.value = false }
    })
  }

  // if (['admin', 'accounting', 'dispatcher'].includes(userRole)) {
  //   items.push({
  //     label: "Settlements",
  //     icon: "hugeicons:briefcase-dollar",
  //     to: "/dashboard/settlements",
  //     onSelect: () => { open.value = false }
  //   })
  // }

  if (['admin', 'accounting'].includes(userRole)) {
    items.push({
      label: "Fuels",
      icon: "hugeicons:fuel-station",
      to: "/dashboard/fuels",
      onSelect: () => { open.value = false }
    })
  }
  
  items.push({
    label: "Settings",
    to: "/dashboard/settings",
    icon: "hugeicons:account-setting-01",
    defaultOpen: true,
    type: "trigger",
    children: [
      { label: "General", to: "/dashboard/settings", exact: true, onSelect: () => { open.value = false } },
      { label: "Security", to: "/dashboard/settings/security", onSelect: () => { open.value = false } }
    ]
  })

  return [items]
})
const groups = computed(() => [{
  id: "links",
  label: "Go to",
  items: links.value.flat()
}])
</script>
<template>
  <div class="flex-1 flex flex-col min-h-0">
    <UDashboardGroup unit="rem">
      <UDashboardSidebar
        id="default"
        v-model:open="open"
        collapsible
        resizable
        class="bg-elevated/25"
        :ui="{ footer: 'lg:border-t lg:border-default' }">
        <template #header="{ collapsed }">
          <GeneralMenu :collapsed="collapsed" />
        </template>

        <template #default="{ collapsed }">
          <UDashboardSearchButton
            :collapsed="collapsed"
            class="bg-transparent ring-default" />
          <UNavigationMenu
            :collapsed="collapsed"
            :items="links[0]"
            orientation="vertical"
            tooltip
            popover />
          <UButton 
            label="Notifications"
            color="neutral"
            variant="ghost" 
            class="mt-auto group" 
            :square="collapsed" 
            tooltip
            @click="isNotificationsOpen = true">
            <div class="flex items-center gap-1 text-gray-400 group-hover:text-white">
              <UChip color="error" :show="hasUnread" inset>
                <UIcon name="hugeicons:notification-01" class="size-5 shrink-0" />
              </UChip>
              <span v-if="!collapsed" class="">
                Notifications
              </span>
            </div>
          </UButton>
        </template>

        <template #footer="{ collapsed }">
          <AuthBar :collapsed="collapsed" />
        </template>
      </UDashboardSidebar>

      <UDashboardSearch :groups="groups" />

      <NuxtPage />

    </UDashboardGroup>
  </div>
</template>