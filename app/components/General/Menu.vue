<script setup>
defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
})

const teams = ref([{
  label: 'C2C Dashboard',
  src: ''
},{
  label: 'Light Freight',
  src: '/32.png',
  to: '/'
},{
  label: 'Bookkeeping',
  src: '/c2c.svg',
  to: '/bookkeeping'
}])
const selectedTeam = ref(teams.value[0])

const items = computed(() => {
  return [
    teams.value.map(team => ({
      ...team,
      onSelect() {
        selectedTeam.value = team
      }
    })), 
    [{
      label: 'Manage team',
      icon: 'i-lucide-cog',
      to: '/dashboard/team'
    }]
  ]
})
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
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :class="[!collapsed && 'py-2']"
      :ui="{
        trailingIcon: 'text-dimmed'
      }">
      <template #leading>
        <AppLogo :src="selectedTeam.src" :alt="selectedTeam.label" class="size-5 shrink-0" />
      </template>
    </UButton>

    <template #item-leading="{ item }">
      <AppLogo v-if="item.src !== undefined" :src="item.src" :alt="item.label" class="size-5 shrink-0" />
    </template>
  </UDropdownMenu>
</template>