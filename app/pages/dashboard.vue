// pages/dashboard.vue
<script setup>
definePageMeta({ layout: 'dashboard' })

const { isNotificationsOpen, hasUnread } = useNotifications()
const { permissions } = useRolePermissions()
const open = ref(false)

const links = computed(() => {
  const rawLinks = [{
    label: "Dashboard",
    icon: "hugeicons:dashboard-square-02",
    to: "/dashboard",
    exact: true, 
    visible: true
  },{
    label: "Drivers",
    icon: "hugeicons:user-group-02",
    to: "/dashboard/drivers",
    visible: permissions.value.canViewDrivers
  },{
    label: "Loads",
    icon: "hugeicons:lift-truck",
    to: "/dashboard/loads",
    visible: permissions.value.canViewLoads
  },{
    label: "Settlements",
    icon: "hugeicons:briefcase-dollar",
    to: "/dashboard/settlements",
    visible: permissions.value.canViewSettlements
  },{
    label: "Fuels",
    icon: "hugeicons:fuel-station",
    to: "/dashboard/fuels",
    visible: permissions.value.canViewFuels
  },{
    label: "Tasks",
    icon: "hugeicons:task-01",
    to: "/dashboard/tasks",
    visible: permissions.value.canViewTasks
  },{
    label: "Settings",
    to: "/dashboard/settings",
    icon: "hugeicons:account-setting-01",
    defaultOpen: true,
    type: "trigger",
    visible: true,
    children: [
      { label: "General", to: "/dashboard/settings", exact: true },
      { label: "Security", to: "/dashboard/settings/security" }
    ]
  }]
  const items = rawLinks.filter(link => link.visible).map(({ visible, ...link }) => {
    if (link.children) {
      return {
        ...link,
        children: link.children.map(child => ({
          ...child,
          onSelect: () => { open.value = false }
        }))
      }
    }
    return {
      ...link,
      onSelect: () => { open.value = false }
    }
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
          <MainMenu :collapsed="collapsed" />
        </template>

        <template #default="{ collapsed }">
          <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />
          <UNavigationMenu
            :collapsed="collapsed"
            :items="links[0]" 
            color="neutral"
            orientation="vertical"
            tooltip
            popover />
          <UButton 
            v-if="permissions.canViewNotes"
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
              <span v-if="!collapsed">Notifications</span>
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