// composables/useDispatchers.js
export function useDispatchers() {
  const client = useStrapiClient()

  const { data: dispatchersResponse } = useAsyncData('dispatchers-list', async () => {
    try {
      return await client('/users', {
        query: {
          'filters[role][type][$in][0]': 'dispatcher',
          'filters[role][type][$in][1]': 'admin'
        }
      })
    } catch (error) {
      console.error('Failed to fetch dispatchers:', error)
      return []
    }
  }, {
    lazy: true,
    default: () => []
  })

  const dispatcherItems = computed(() => {
    const users = dispatchersResponse.value || []
    return users.map(u => ({
      id: u.id,
      label: u.name || u.username || u.email
    }))
  })

  return {
    dispatchers: dispatchersResponse,
    dispatcherItems
  }
}