// pages/dashboard.vue
<script setup>
definePageMeta({ 
  layout: 'dashboard'
})
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
    },{
      label: "Loads",
      icon: "hugeicons:lift-truck",
      to: "/dashboard/loads",
      onSelect: () => { open.value = false }
    })
  }
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
        :ui="{ footer: 'lg:border-t lg:border-default' }"
      >
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
          <UNavigationMenu
            :collapsed="collapsed"
            :items="links[1]"
            orientation="vertical"
            tooltip
            class="mt-auto" />
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