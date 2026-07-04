// middleware/auth.global.ts
export default defineNuxtRouteMiddleware((to) => {
  const user = useStrapiUser()
  const { permissions } = useRolePermissions()

  // ПУБЛИЧНЫЕ СТРАНИЦЫ
  const publicPaths = [
    '/', 
    '/services', 
    '/trucking-authority',
    '/bookkeeping', 
    '/auth/login', 
    '/auth/register', 
    '/auth/forgot-password', 
  ]

  // 1. Нормализуем путь (убираем завершающий слэш)
  const targetPath = to.path.replace(/\/$/, '') || '/'

  // 2. Очищаем путь от языкового префикса i18n (например, /es/services -> /services)
  // Регулярное выражение находит двухбуквенные префиксы в начале строки
  const cleanPath = targetPath.replace(/^\/[a-z]{2}(?=\/|$)/i, '') || '/'

  const isPublic = publicPaths.includes(cleanPath)

  // ЕСЛИ НЕ АВТОРИЗОВАН -> ПЕРЕНАПРАВЛЯЕМ НА СТРАНИЦУ ВХОДА
  if (!user.value && !isPublic) {
    return navigateTo('/auth/login')
  }

  // ЕСЛИ АВТОРИЗОВАН -> ПРОВЕРЯЕМ ПРАВА ДОСТУПА
  if (user.value) {
    
    // Защита страниц управления водителями (листинг и динамические карточки)
    const isDriversRoute = cleanPath === '/dashboard/drivers' || cleanPath.startsWith('/dashboard/drivers/')
    if (isDriversRoute && !permissions.value.canViewDrivers) {
      return navigateTo('/dashboard')
    }

    // Защита страниц управления грузами (листинг и динамические карточки)
    const isLoadsRoute = cleanPath === '/dashboard/loads' || cleanPath.startsWith('/dashboard/loads/')
    if (isLoadsRoute && !permissions.value.canViewLoads) {
      return navigateTo('/dashboard')
    }

    // Защита страницы управления командой (только для Admin)
    const isTeamRoute = cleanPath === '/dashboard/team' || cleanPath.startsWith('/dashboard/team/')
    if (isTeamRoute && !permissions.value.isAdmin) {
      return navigateTo('/dashboard')
    }
  }
})