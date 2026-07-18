// composables/useRolePermissions.js
export function useRolePermissions() {
  const user = useStrapiUser()

  const userRole = computed(() => user.value?.role?.type || '')

  const permissions = computed(() => {
    const role = userRole.value

    return {
      // Access to home stats
      canViewStats: ['admin', 'dispatcher', 'accounting'].includes(role),

      // Access to driver management
      canViewDrivers: ['admin', 'dispatcher', 'accounting'].includes(role),
      canCreateDrivers: ['admin', 'dispatcher', 'accounting'].includes(role),
      canEditDrivers: ['admin', 'dispatcher', 'accounting'].includes(role),
      canDeleteDrivers: ['admin'].includes(role),

      // Access to loads management
      canViewLoads: ['admin', 'dispatcher', 'accounting', 'driver'].includes(role),
      canCreateLoads: ['admin', 'dispatcher'].includes(role),
      canEditLoads: ['admin', 'dispatcher', 'accounting'].includes(role),
      canDeleteLoads: ['admin'].includes(role),

      // Access to fuels management
      canViewFuels: ['admin', 'accounting'].includes(role),

      // Access to rates
      canViewDriversRate: ['admin', 'dispatcher', 'accounting'].includes(role),
      canViewOriginalRate: ['admin', 'dispatcher', 'accounting'].includes(role),

      // Access to notes
      canViewNotes: ['admin', 'dispatcher', 'accounting'].includes(role),

      // Access to settlements
      canViewSettlements: ['admin', 'accounting'].includes(role),

      // Access to tasks
      canViewTasks: ['admin', 'dispatcher', 'accounting'].includes(role),
      canCreateTasks: ['admin', 'dispatcher', 'accounting'].includes(role),
      canEditTasks: ['admin', 'dispatcher', 'accounting'].includes(role),
      canDeleteTasks: ['admin'].includes(role),

      // role helpers
      isAdmin: role === 'admin',
      isDispatcher: role === 'dispatcher',
      isAccounting: role === 'accounting',
      isDriver: role === 'driver'
    }
  })

  return {
    userRole,
    permissions
  }
}