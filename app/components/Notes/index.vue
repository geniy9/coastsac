<!-- components/Notes.vue -->
<script setup>
import { format } from 'date-fns'

const props = defineProps({
  loadId: {
    type: String,
    required: false
  },
  taskId: {
    type: String,
    required: false
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

const mappedMessages = computed(() => {
  const sortedNotes = [...props.notes].sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })

  return sortedNotes.map(note => {
    const noteUser = note.user || {}
    const isMe = noteUser.id === user.value?.id
    const avatarData = getAvatar(noteUser.avatar, noteUser.name || noteUser.username)

    return {
      id: note.documentId || note.id,
      role: isMe ? 'user' : 'assistant',
      side: isMe ? 'right' : 'left',
      avatar: avatarData,
      parts: [{
        type: 'text',
        text: note.message || ''
      }],
      metadata: {
        userName: noteUser.name || noteUser.username || 'System',
        createdAt: note.createdAt
      }
    }
  })
})

const getContextMenuItems = (message) => {
  const isMe = message.role === 'user'
  const canDelete = permissions.value.isAdmin || isMe
  const items = [
    [{
      label: 'Copy',
      icon: 'hugeicons:copy-01',
      onSelect: () => {
        navigator.clipboard.writeText(message.parts[0]?.text || '')
        toast.add({
          title: 'Copied',
          description: 'Note text copied to clipboard',
          color: 'primary'
        })
      }
    }]
  ]
  if (canDelete) {
    items.push([{
      label: 'Delete',
      color: 'error',
      icon: 'hugeicons:delete-02',
      onSelect: () => handleDelete(message.id)
    }])
  }
  return items
}

// Метод удаления заметки
const handleDelete = async (noteId) => {
  if (confirm('Are you sure you want to delete this note?')) {
    try {
      await client(`/notes/${noteId}`, { method: 'DELETE' })
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

const onSend = async () => {
  const trimmed = messageText.value.trim()
  if (!trimmed) return

  sending.value = true
  try {
    const payload = {
      data: {
        message: trimmed,
        user: user.value?.id // Привязка к автору
      }
    }
    if (props.loadId) payload.data.load = props.loadId
    if (props.taskId) payload.data.task = props.taskId

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

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return format(new Date(dateStr), 'MMM d, yyyy HH:mm')
}
</script>
<template>
  <UCard variant="soft" class="flex flex-col print-card" 
    :ui="{ body: 'flex-1 flex flex-col min-h-0' }">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-highlighted">
          Notes
        </h3>
        <UBadge icon="hugeicons:message-01" color="neutral" variant="soft" class="no-print">
          {{ notes.length }}
        </UBadge>
      </div>
    </template>

    <div 
      class="flex-1 min-h-0 flex flex-col justify-between"
      :class="(taskId || loadId) ? 'max-h-[60vh]' : ''"
    >
      <!-- Scrollable Message List -->
      <div class="flex-1 min-h-0 overflow-y-auto pr-1">
        <div v-if="!notes || notes.length === 0" class="h-full flex flex-col items-center justify-center p-6 text-center text-gray-500 text-sm gap-2 no-print">
          <UIcon name="hugeicons:bubble-chat-blocked" class="w-8 h-8" />
          <p>No comments yet.</p>
        </div>

        <UChatMessages v-else
          :messages="mappedMessages"
          :user="{ side: 'right', variant: 'soft' }"
          :assistant="{ side: 'left', variant: 'solid' }"
          should-scroll-to-bottom>
          <template #header="{ message }">
            <div class="flex items-center gap-2 text-xs" :class="message.side === 'right' ? 'justify-end' : 'justify-start'">
              <span class="font-semibold text-highlighted">
                {{ message.metadata.userName }}
              </span>
              <span class="text-[10px] text-gray-500">
                {{ formatDate(message.metadata.createdAt) }}
              </span>
            </div>
          </template>
          <template #leading="{ avatar }">
            <UAvatar :src="avatar.src" :alt="avatar.alt" class="no-print" />
          </template>
          <template #content="{ message }">
            <UContextMenu :items="getContextMenuItems(message)" :ui="{ content: 'w-32' }">
              <div class="whitespace-pre-wrap select-text">
                {{ message.parts[0]?.text || '' }}
              </div>
            </UContextMenu>
          </template>
        </UChatMessages>
      </div>

      <!-- Message Input -->
      <div class="mt-2 pt-2 shrink-0 no-print">
        <div class="flex gap-2">
          <UChatPrompt
            v-model="messageText"
            placeholder="Type note"
            :disabled="sending" 
            :autofocus="false"
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