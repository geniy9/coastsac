<!-- components/Notes/Notifications.vue -->
<script setup>
import { formatTimeAgo } from '@vueuse/core'

const { isNotificationsOpen, notes, loading, markAllAsRead, refresh } = useNotifications()
const { getAvatar } = useConfig()

watch(isNotificationsOpen, async (isOpen) => {
  if (isOpen) {
    await refresh()
    markAllAsRead()
  }
})

const linkToEntity = (uri) => {
  if (uri?.load) return `/dashboard/loads/${uri.load?.documentId}`
  if (uri?.task) return `/dashboard/tasks/${uri.task?.documentId}`
  return
}
</script>
<template>
  <USlideover v-model:open="isNotificationsOpen" title="Recent Comments & Notes">
    <template #body>
      <!-- Загрузка -->
      <div v-if="loading && notes.length === 0" class="flex items-center justify-center py-8">
        <p class="text-sm text-gray-500">Loading recent updates...</p>
      </div>

      <!-- Нет уведомлений -->
      <div v-else-if="notes.length === 0" class="flex flex-col items-center justify-center py-12 text-center text-gray-500 text-sm gap-2">
        <UIcon name="i-lucide-message-square-off" class="w-8 h-8 text-gray-400" />
        <p>No recent comments found.</p>
      </div>

      <!-- Список уведомлений -->
      <div v-else class="space-y-3">
        <NuxtLink
          v-for="note in notes"
          :key="note.documentId || note.id"
          :to="linkToEntity(note)"
          class="px-3 py-3 rounded-md hover:bg-elevated/50 flex items-start gap-3 transition -mx-3 first:-mt-3 last:-mb-3 border-b border-default/30 last:border-0">
          <UAvatar
            v-bind="getAvatar(note.user?.avatar, note.user?.name || note.user?.username)"
            size="md"
            class="mt-0.5 shrink-0" />

          <div class="text-sm flex-1 min-w-0">
            <div class="flex items-baseline justify-between gap-1.5">
              <span class="text-highlighted font-semibold truncate">
                {{ note.user?.name || note.user?.username || 'System' }}
              </span>
              <time
                :datetime="note.createdAt"
                class="text-muted text-[11px] shrink-0 font-mono"
                v-text="formatTimeAgo(new Date(note.createdAt))" />
            </div>

            <!-- Текст сообщения -->
            <p class="text-dimmed mt-1 line-clamp-2 leading-relaxed text-xs">
              {{ note.message }}
            </p>

            <div class="mt-2 flex items-center gap-1.5 text-[11px] font-mono text-(--ui-primary)">
              <span v-if="note.load">
                Load #{{ note.load?.load_number || 'N/A' }}
              </span>
              <span v-else-if="note.task">
                Task: {{ note.task?.subject || 'N/A' }}
              </span>
            </div>
          </div>
        </NuxtLink>
      </div>
    </template>
  </USlideover>
</template>