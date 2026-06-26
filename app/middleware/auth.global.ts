// middleware/auth.global.ts
export default defineNuxtRouteMiddleware((to) => {
  const user = useStrapiUser()
  const { permissions } = useRolePermissions()

  // PUBLIC PAGES
  const publicPaths = [
    '/', 
    '/services', 
    '/trucking-authority',
    '/bookkeeping', 
    '/auth/login', 
    '/auth/register', 
    '/auth/forgot-password', 
  ]
  const targetPath = to.path.replace(/\/$/, '') || '/'

  const isPublic = publicPaths.includes(targetPath)

  // IF NOT AUTH > GO TO LOGIN
  if (!user.value && !isPublic) {
    return navigateTo('/auth/login')
  }

  // IF AUTH
  if (user.value) {
    // Защита страниц управления водителями
    if (targetPath.startsWith('/dashboard/drivers') && !permissions.value.canViewDrivers) {
      return navigateTo('/dashboard')
    }

    // Защита страниц управления грузами
    if (targetPath.startsWith('/dashboard/loads') && !permissions.value.canViewLoads) {
      return navigateTo('/dashboard')
    }

    // Защита страницы управления командой (только для Admin)
    if (targetPath.startsWith('/dashboard/team') && !permissions.value.isAdmin) {
      return navigateTo('/dashboard')
    }
  }
})