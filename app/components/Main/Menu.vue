<script setup>
const { permissions } = useRolePermissions()
defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
})

const teams = ref([{
  label: 'Dashboard',
  icon: "hugeicons:dashboard-square-02",
  to: '/dashboard',
  visible: true
},{
  label: 'Light Freight',
  src: '/lf.svg',
  to: '/',
  visible: true
},{
  label: 'Bookkeeping',
  src: '/c2c.svg',
  to: '/bookkeeping',
  visible: true
},{
  label: 'Manage team',
  icon: 'i-lucide-cog',
  to: '/dashboard/team',
  visible: permissions.value.isAdmin
}])

const selectedTeam = ref(teams.value[0])
const items = computed(() => 
  teams.value
    ?.filter(item => item.visible)
    .map(item => ({
      ...item,
      onSelect: () => { selectedTeam.value = item }
    }))
)
</script>
<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-40' : 'w-(--reka-dropdown-menu-trigger-width)' }">
    <UButton
      v-bind="{
        ...selectedTeam,
        avatar: undefined, 
        label: collapsed ? undefined : selectedTeam?.label,
        trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down'
      }"
      color="neutral"
      variant="ghost"
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :class="[!collapsed && 'py-2']"
      :ui="{ trailingIcon: 'text-dimmed' }"
      block>
      <template #leading>
        <AppLogo :src="selectedTeam.src" :alt="selectedTeam.label" class="size-5 shrink-0" />
      </template>
    </UButton>

    <template #item-leading="{ item }">
      <AppLogo v-if="item.src !== undefined" :src="item.src" :alt="item.label" class="size-5 shrink-0" />
    </template>
  </UDropdownMenu>
</template>