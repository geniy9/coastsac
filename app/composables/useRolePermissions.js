// composables/useRolePermissions.js
export function useRolePermissions() {
  const user = useStrapiUser()

  const userRole = computed(() => user.value?.role?.type || '')

  const permissions = computed(() => {
    const role = userRole.value

    return {
      // Права на управление водителями
      canViewDrivers: ['admin', 'dispatcher', 'accounting'].includes(role),
      canCreateDrivers: ['admin', 'dispatcher', 'accounting'].includes(role),
      canEditDrivers: ['admin', 'dispatcher', 'accounting'].includes(role),
      canDeleteDrivers: ['admin'].includes(role), // Только администратор

      // Права на управление грузами
      canViewLoads: ['admin', 'dispatcher', 'accounting'].includes(role),
      canCreateLoads: ['admin', 'dispatcher'].includes(role), // Бухгалтер не создает грузы
      canEditLoads: ['admin', 'dispatcher', 'accounting'].includes(role), // Бухгалтер правит факторинг
      canDeleteLoads: ['admin'].includes(role), // Удаление админу

      // Дополнительные хелперы ролей
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