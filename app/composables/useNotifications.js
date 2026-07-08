// composables/useNotifications.js
import { ref, computed, watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'

// Объявляем переменные ВНЕ экспортируемой функции.
// Это делает состояние глобальным и общим для всех компонентов, вызывающих useNotifications().
const isNotificationsOpen = ref(false)
const lastSeenNotificationTime = useLocalStorage('c2c_last_seen_note_time', '')

export function useNotifications() {
  const client = useStrapiClient()
  const { permissions } = useRolePermissions()
  const route = useRoute()

  // закрываем слайдовер при переходе
  watch(() => route.fullPath, () => {
    isNotificationsOpen.value = false
  })

  // Заметки могут видеть только (Admin, Dispatcher, Accounting)
  const shouldFetch = computed(() => permissions.value?.canViewNotes)

  // Запрос последних 24 заметок со всеми связями
  const { data: response, refresh, status } = useAsyncData('recent-notes', () => {
    if (!shouldFetch.value) return { data: [] }
    return client('/notes', {
      query: {
        sort: 'createdAt:desc',
        pagination: { limit: 24 },
        populate: ['user.avatar', 'load']
      }
    })
  }, {
    lazy: true,
    default: () => ({ data: [] }),
    watch: [shouldFetch]
  })

  const notesList = computed(() => response.value?.data || response.value || [])

  // Вычисляем, есть ли новые (непрочитанные)
  const hasUnread = computed(() => {
    if (!shouldFetch.value || notesList.value.length === 0) return false
    
    const latestNote = notesList.value[0]
    if (!latestNote?.createdAt) return false

    // Если пользователь еще ни разу не открывал уведомления
    if (!lastSeenNotificationTime.value) return true

    // Сравниваем время последней заметки с временем последнего просмотра
    return new Date(latestNote.createdAt).getTime() > new Date(lastSeenNotificationTime.value).getTime()
  })

  // Фиксируем просмотр уведомлений (записываем время создания последней полученной заметки)
  const markAllAsRead = () => {
    if (!shouldFetch.value || notesList.value.length === 0) return
    const latestNote = notesList.value[0]
    if (latestNote?.createdAt) {
      lastSeenNotificationTime.value = latestNote.createdAt
    }
  }

  return {
    isNotificationsOpen,
    notes: notesList,
    loading: computed(() => status.value === 'pending'),
    hasUnread,
    refresh,
    markAllAsRead
  }
}