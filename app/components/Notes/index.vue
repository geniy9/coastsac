<!-- components/Notes.vue -->
<script setup>
import { format } from 'date-fns'

const props = defineProps({
  loadId: {
    type: String,
    required: true
  },
  notes: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['refresh'])

const client = useStrapiClient()
const user = useStrapiUser()
const toast = useToast()
const { getAvatar } = useConfig()
const { permissions } = useRolePermissions()

const messageText = ref('')
const sending = ref(false)

// Преобразование заметок из Strapi в структуру сообщений для UChatMessages
const mappedMessages = computed(() => {
  // Сортируем комментарии в хронологическом порядке (от старых к новым)
  const sortedNotes = [...props.notes].sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })

  return sortedNotes.map(note => {
    const noteUser = note.user || {}
    const isMe = noteUser.id === user.value?.id
    
    // Получаем структурированный аватар с помощью хелпера из useConfig
    const avatarData = getAvatar(noteUser.avatar, noteUser.name || noteUser.username)

    // Действия с сообщением (кнопка удаления комментария)
    const actions = []
    const canDelete = permissions.value.isAdmin || isMe

    if (canDelete) {
      actions.push({
        icon: 'i-lucide-trash',
        color: 'error',
        variant: 'ghost',
        size: 'xs',
        onClick: async () => {
          if (confirm('Are you sure you want to delete this comment?')) {
            try {
              await client(`/notes/${note.documentId}`, { method: 'DELETE' })
              toast.add({
                title: 'Deleted',
                description: 'Comment was successfully removed.',
                color: 'success'
              })
              emit('refresh')
            } catch (err) {
              console.error(err)
              toast.add({
                title: 'Error',
                description: 'Failed to delete comment',
                color: 'error'
              })
            }
          }
        }
      })
    }

    return {
      id: note.documentId || note.id,
      role: isMe ? 'user' : 'assistant', // Влияет на стили по умолчанию
      side: isMe ? 'right' : 'left',     // Расположение справа/слева
      avatar: avatarData,
      parts: [
        {
          type: 'text',
          text: note.message || ''
        }
      ],
      actions,
      metadata: {
        userName: noteUser.name || noteUser.username || 'System',
        createdAt: note.createdAt
      }
    }
  })
})

const onSend = async () => {
  const trimmed = messageText.value.trim()
  if (!trimmed) return

  sending.value = true
  try {
    const payload = {
      data: {
        message: trimmed,
        load: props.loadId, // Привязка к текущему грузу
        user: user.value?.id // Привязка к автору
      }
    }

    await client('/notes', {
      method: 'POST',
      body: payload
    })

    messageText.value = ''
    emit('refresh') // Обновляем данные на детальной странице груза
  } catch (error) {
    console.error(error)
    toast.add({
      title: 'Error',
      description: error?.message || 'Failed to post comment',
      color: 'error'
    })
  } finally {
    sending.value = false
  }
}

// Форматирование даты
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return format(new Date(dateStr), 'MMM d, yyyy HH:mm')
}
</script>
<template>
  <UCard variant="soft" class="flex flex-col print-card">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-highlighted flex items-center gap-1.5">
          <UIcon name="hugeicons:message-01" class="w-4 h-4 text-primary" />
          Notes
        </h3>
        <UBadge color="neutral" variant="soft" size="sm">
          {{ notes.length }}
        </UBadge>
      </div>
    </template>

    <div class="flex-1 min-h-60 flex flex-col justify-between">
      <!-- Scrollable Message List -->
      <div class="flex-1 min-h-0 overflow-y-auto pr-1">
        <div v-if="!notes || notes.length === 0" class="h-full flex flex-col items-center justify-center p-6 text-center text-gray-500 text-sm gap-2">
          <UIcon name="hugeicons:bubble-chat-blocked" class="w-8 h-8 text-gray-400" />
          <p>No comments yet.</p>
        </div>

        <UChatMessages
          v-else
          :messages="mappedMessages"
          :user="{ side: 'right', variant: 'soft' }"
          :assistant="{ side: 'left', variant: 'solid' }"
          should-scroll-to-bottom
          class="space-y-4">
          <template #header="{ message }">
            <div class="flex items-center gap-1.5 text-xs mb-1" :class="message.side === 'right' ? 'justify-end' : 'justify-start'">
              <span class="font-semibold text-highlighted">
                {{ message.metadata.userName }}
              </span>
              <span class="text-[10px] text-gray-500">
                {{ formatDate(message.metadata.createdAt) }}
              </span>
            </div>
          </template>
        </UChatMessages>
      </div>

      <!-- Quick Message Input -->
      <div class="mt-4 border-t border-default/40 pt-4 bg-transparent no-print">
        <div class="flex gap-2">
          <UChatPrompt
            v-model="messageText"
            placeholder="Type note"
            :disabled="sending"
            class="flex-1"
            @submit="onSend">
            <template #submit>
              <UChatPromptSubmit :loading="sending" @click="onSend" />
            </template>
          </UChatPrompt>
        </div>
      </div>
    </div>
  </UCard>
</template>