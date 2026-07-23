<!-- components/Task.vue -->
<script setup>
const { thumbImg, getStatusColor, formatDate, formatTime } = useConfig()
const props = defineProps({
  task: {
    type: Object,
    required: true
  }
})
</script>
<template>
  <UCard 
    class="cursor-pointer flex flex-col justify-between"
    @click="navigateTo(`/dashboard/tasks/${task.documentId}`)"
    variant="soft">
    <template #header>
      <div class="flex justify-between items-start gap-2">
        <UTooltip :text="task.subject">
          <span class="font-bold text-highlighted text-sm line-clamp-1">
            {{ task.subject }}
          </span>
        </UTooltip>
        <UFieldGroup size="sm">
          <UBadge :color="getStatusColor(task.status_task)">
            {{ formatDate(task.createdAt) }}
          </UBadge>
          <UBadge :color="getStatusColor(task.status_task)" variant="soft">
            {{ formatTime(task.createdAt) }}
          </UBadge>
        </UFieldGroup>
      </div>
    </template>

    <div class="space-y-3">
      <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
        {{ task.description || 'No description provided.' }}
      </p>
      <div v-if="task.load || task.driver" class="flex flex-wrap gap-1.5 pt-1">
        <UBadge v-if="task.load" color="neutral" variant="soft" icon="hugeicons:lift-truck">
          Load {{ task.load.load_number }}
        </UBadge>
        <UBadge v-if="task.driver" color="neutral" variant="soft" icon="hugeicons:user-group-02">
          {{ task.driver.first_name }} {{ task.driver.last_name }}
        </UBadge>
      </div>
    </div>

    <template #footer>
      <div class="flex flex-col items-center gap-1 w-full">
        <div class="w-full flex items-center justify-between text-[11px] text-gray-500 font-mono">  
          <span>Creator</span>
          <span>Assigned To</span>
        </div>
        <div class="w-full flex items-center justify-between gap-2 text-gray-500 font-mono text-[10px]">
          <div class="flex flex-col items-center gap-1">
            <UTooltip v-if="task.creator" :text="task.creator?.name || task.creator?.username">
              <UAvatar 
                :src="task.creator.avatar ? thumbImg(task.creator.avatar) : ''"
                :alt="task.creator.name || task.creator.username" 
                size="sm" />
            </UTooltip>
            <span v-else class="italic">Unassigned</span>
          </div>
          <span class="dark:bg-gray-600 bg-gray-400 h-0.5 w-full"></span>
          <div class="flex flex-col items-center gap-1">
            <UAvatarGroup v-if="task.executors?.length" :max="2" size="sm">
              <UTooltip v-for="u in task.executors" :key="u.id" :text="u.name || u.username">
                <UAvatar 
                  :src="u.avatar ? thumbImg(u.avatar) : ''"
                  :alt="u.name || u.username" 
                  loading="lazy" />
              </UTooltip>
            </UAvatarGroup>
            <span v-else class="italic">Unassigned</span>
          </div>
        </div>
      </div>
    </template>
  </UCard>
</template>