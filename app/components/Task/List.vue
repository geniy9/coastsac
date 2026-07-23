<!-- components/TaskList.vue -->
<script setup>
import { UAvatar, UAvatarGroup, UBadge, UButton, UFieldGroup } from '#components'
import { getPaginationRowModel } from "@tanstack/table-core"
const { thumbImg, getStatusColor, formatDate, formatTime } = useConfig()

const props = defineProps({
  tasks: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})
const limit = defineModel('limit', { type: Number, default: 25 })
const pagination = ref({ pageIndex: 0, pageSize: 25 })
const table = useTemplateRef("table")

const columns = [{
  accessorKey: "subject",
  header: "Task Subject",
  cell: ({ row }) => h("span", { class: "font-semibold text-highlighted text-sm" }, row.original.subject)
}, {
  id: "date",
  header: "Created At",
  cell: ({ row }) => {
    const date = formatDate(row.original.createdAt)
    const time = formatTime(row.original.createdAt)
    const status = row.original.status_task
    return h(UFieldGroup, undefined, () => [
      h(UBadge, { color: getStatusColor(status) }, () => date),
      h(UBadge, { color: getStatusColor(status), variant: "soft" }, () => time)
    ])
  }
}, {
  id: "creator",
  header: "Creator",
  cell: ({ row }) => {
    const creator = row.original.creator
    if (!creator) return h("span", { class: "text-gray-500 italic text-xs" }, "Unassigned")
    const avatarSrc = creator.avatar ? thumbImg(creator.avatar) : ""
    const name = creator.name || creator.username
    return h("div", { class: "flex items-center gap-2" }, [
      h(UAvatar, { src: avatarSrc, alt: name, size: "sm" }),
      h("span", { class: "text-xs font-mono text-gray-500" }, name)
    ])
  }
}, {
  id: "executors",
  header: "Assigned To",
  cell: ({ row }) => {
    const executors = row.original.executors || []
    if (!executors.length) return h("span", { class: "text-gray-500 italic text-xs" }, "Unassigned")
    return h(UAvatarGroup, { max: 3, size: "sm" }, () => 
      executors.map(u => h(UAvatar, { src: u.avatar ? thumbImg(u.avatar) : "", alt: u.name || u.username }))
    )
  }
}, {
  id: "actions",
  meta: { class: { th: 'text-right', td: 'text-right' }},
  cell: ({ row }) => {
    return h("div", { class: "text-right" }, [
      h(UButton, {
        icon: "hugeicons:view",
        color: "neutral",
        variant: "soft",
        onClick: () => navigateTo(`/dashboard/tasks/${row.original.documentId}`)
      })
    ])
  }
}]
</script>
<template>
  <div class="flex-1 flex flex-col min-h-0 space-y-4">
    <UTable
      ref="table"
      v-model:pagination="pagination"
      :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
      class="shrink-0 flex-1 overflow-auto"
      :data="tasks"
      :columns="columns"
      :loading="loading"
      :ui="{
        base: 'table-fixed border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
        tbody: '[&>tr]:last:[&>td]:border-b-0',
        th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
        td: 'border-b border-default',
        separator: 'h-0'
      }" />
    <TablePagination 
      v-if="table?.tableApi"
      v-model:limit="limit"
      :table-api="table.tableApi" />
  </div>
</template>