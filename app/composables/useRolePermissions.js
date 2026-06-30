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
      canDeleteDrivers: ['admin'].includes(role), // Только администратор

      // Access to loads management
      canViewLoads: ['admin', 'dispatcher', 'accounting'].includes(role),
      canCreateLoads: ['admin', 'dispatcher'].includes(role), // Бухгалтер не создает грузы
      canEditLoads: ['admin', 'dispatcher', 'accounting'].includes(role), // Бухгалтер правит факторинг
      canDeleteLoads: ['admin'].includes(role),

      // Access to fuels management
      canViewFuels: ['admin', 'accounting'].includes(role),

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