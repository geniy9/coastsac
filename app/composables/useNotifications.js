// composables/useNotifications.js
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useLocalStorage } from '@vueuse/core'

const isNotificationsOpen = ref(false)
const lastSeenNotificationTime = useLocalStorage('c2c_last_seen_note_time', '')
const lastKnownNoteId = useLocalStorage('c2c_last_known_note_id', '')

export function useNotifications() {
  const client = useStrapiClient()
  const { permissions } = useRolePermissions()
  const route = useRoute()
  const toast = useToast()

  watch(() => route.fullPath, () => {
    isNotificationsOpen.value = false
  })

  const shouldFetch = computed(() => permissions.value?.canViewNotes)

  const { data: response, refresh, status } = useAsyncData('recent-notes', () => {
    if (!shouldFetch.value) return { data: [] }
    return client('/notes', {
      query: {
        sort: 'createdAt:desc',
        pagination: { limit: 24 },
        populate: ['user.avatar', 'load', 'task']
      }
    })
  }, {
    lazy: true,
    default: () => ({ data: [] }),
    watch: [shouldFetch]
  })

  const notesList = computed(() => response.value?.data || response.value || [])

  // Запрос прав на системные уведомления в ОС/Браузере
  const requestSystemNotificationPermission = async () => {
    if (import.meta.client && 'Notification' in window) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission()
      }
    }
  }

  // Функция вызова звука и всплывающего пуша
  const triggerPushAlert = (note) => {
    if (!import.meta.client) return

    // 1. Воспроизведение звука (public/notification.mp3)
    try {
      const audio = new Audio('/audio/software-interface-start.wav')
      audio.volume = 0.5
      audio.play()
    } catch (e) {
      console.warn('Audio playback not supported or interaction required: ', e)
    }

    // 2. Всплывающий тостер в интерфейсе
    toast.add({
      title: note.user?.name || note.user?.username || 'New comment',
      description: note.message,
      color: 'primary',
      click: () => {
        isNotificationsOpen.value = true
      }
    })

    // 3. Нативный пуш браузера (сработает даже если вкладка свернута)
    if ('Notification' in window && Notification.permission === 'granted') {
      const systemNotification = new Notification(note.user?.name || note.user?.username || 'Coast to Coast', {
        body: note.message,
        icon: '/c2c.svg'
      })
      systemNotification.onclick = () => {
        window.focus()
        isNotificationsOpen.value = true
      }
    }
  }

  // Слушатель новых входящих комментариев
  watch(notesList, (newNotes) => {
    if (newNotes.length === 0) return

    const latest = newNotes[0]
    const latestId = latest.documentId || latest.id

    // Если ID отличается от последнего известного — это новый комментарий, шлем пуш
    if (lastKnownNoteId.value && lastKnownNoteId.value !== latestId) {
      triggerPushAlert(latest)
    }

    // Запоминаем текущий ID как последний
    lastKnownNoteId.value = latestId
  }, { deep: true })

  // Опрос сервера в фоне
  let fetchInterval = null
  onMounted(() => {
    if (!import.meta.client) return
    requestSystemNotificationPermission()

    // Раз в 20 секунд опрашиваем бэкенд, только если вкладка видима для экономии ресурсов
    fetchInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && shouldFetch.value) {
        refresh()
      }
    }, 20000)
  })

  onBeforeUnmount(() => {
    if (fetchInterval) clearInterval(fetchInterval)
  })

  const hasUnread = computed(() => {
    if (!shouldFetch.value || notesList.value.length === 0) return false
    const latestNote = notesList.value[0]
    if (!latestNote?.createdAt) return false
    if (!lastSeenNotificationTime.value) return true
    return new Date(latestNote.createdAt).getTime() > new Date(lastSeenNotificationTime.value).getTime()
  })

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