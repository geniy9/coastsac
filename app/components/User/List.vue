<!-- components/UserList.vue -->
<script setup>
import { UButton, UDropdownMenu, UCheckbox, UBadge, UAvatar, USelect, USwitch, UIcon } from '#components'
import { getPaginationRowModel } from "@tanstack/table-core";
const { getAvatar } = useConfig()

const props = defineProps({
  users: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['refresh'])
const toast = useToast()
const client = useStrapiClient()
const currentUser = useStrapiUser()

const roles = ref([])
const updatingUserId = ref(null)
const togglingBlockId = ref(null)
const table = useTemplateRef("table")

const columnFilters = ref([{ id: "email", value: "" }])
const columnVisibility = ref()
const rowSelection = ref({})

const isConfirmDeleteOpen = ref(false)
const userToDelete = ref(null)
const isDeleting = ref(false)

onMounted(async () => {
  try {
    const res = await client('/users-permissions/roles')
    roles.value = res.roles || []
  } catch (err) {
    console.error('Failed to fetch system roles:', err)
    toast.add({
      title: 'Error',
      description: 'Failed to load system roles.',
      color: 'error'
    })
  }
})

const roleOptions = computed(() => {
  return roles.value.map(r => ({
    value: r.id,
    label: r.name
  }))
})

// Directly updates user's system role
const changeUserRole = async (user, newRoleId) => {
  updatingUserId.value = user.id
  try {
    await client(`/users/${user.id}`, {
      method: 'PUT',
      body: { role: newRoleId }
    })

    const selectedRole = roles.value.find(r => r.id === newRoleId)
    if (selectedRole) {
      user.role = {
        id: selectedRole.id,
        name: selectedRole.name,
        type: selectedRole.type
      }
    }

    toast.add({
      title: 'Success',
      description: `Role for ${user.username} successfully updated!`,
      color: 'success'
    })
    emit('refresh')
  } catch (err) {
    console.error(err)
    toast.add({
      title: 'Error',
      description: err?.data?.error?.message || 'Failed to update user role.',
      color: 'error'
    })
  } finally {
    updatingUserId.value = null
  }
}

// Directly blocks/unblocks a user
const toggleBlockStatus = async (user, isBlocked) => {
  togglingBlockId.value = user.id
  try {
    await client(`/users/${user.id}`, {
      method: 'PUT',
      body: { blocked: isBlocked }
    })
    user.blocked = isBlocked
    toast.add({
      title: 'Success',
      description: `${user.username} has been successfully ${isBlocked ? 'blocked' : 'unblocked'}.`,
      color: 'success'
    })
    emit('refresh')
  } catch (err) {
    console.error(err)
    toast.add({
      title: 'Error',
      description: err?.data?.error?.message || 'Failed to update user status.',
      color: 'error'
    })
  } finally {
    togglingBlockId.value = null
  }
}

const columns = [{
  id: "select",
  header: ({ table }) =>
    h(UCheckbox, {
      modelValue: table.getIsSomePageRowsSelected()
        ? "indeterminate"
        : table.getIsAllPageRowsSelected(),
      "onUpdate:modelValue": (value) => table.toggleAllPageRowsSelected(!!value),
      ariaLabel: "Select all"
    }),
  cell: ({ row }) =>
    h(UCheckbox, {
      modelValue: row.getIsSelected(),
      "onUpdate:modelValue": (value) => row.toggleSelected(!!value),
      ariaLabel: "Select row"
    })
},{
  id: "name",
  header: "Name",
  cell: ({ row }) => {
    const displayName = row.original.name || row.original.username || 'No Name'
    const avatar = getAvatar(row.original.avatar, row.original.name || row.original.username || 'No Name')

    return h("div", { class: "flex items-center gap-3" }, [
      h(UAvatar, avatar),
      h("div", undefined, [
        h("p", { class: "font-medium text-highlighted" }, displayName),
        h("p", { class: "text-xs text-gray-500" }, `@${row.original.username}`)
      ])
    ])
  }
},{
  accessorKey: "email",
  header: "Email",
  cell: ({ row }) => h("span", { class: "text-sm text-gray-400" }, row.original.email || '-')
},{
  id: "status",
  header: "Account Status",
  cell: ({ row }) => {
    const isConfirmed = row.original.confirmed
    const isBlocked = row.original.blocked
    const isSelf = row.original.id === currentUser.value?.id

    return h("div", { class: "flex flex-col gap-2 text-xs" }, [
      h("div", undefined, 
        h(UBadge, { 
          color: isConfirmed ? 'success' : 'warning', 
          variant: 'soft', 
          size: 'sm' 
        }, () => isConfirmed ? 'Email Confirmed' : 'Email Unconfirmed')
      ),
      h("div", { class: "flex items-center gap-2" }, [
        h("span", { class: "text-gray-500 text-xs" }, "Blocked:"),
        h(USwitch, {
          modelValue: isBlocked,
          loading: togglingBlockId.value === row.original.id,
          disabled: isSelf, 
          'onUpdate:modelValue': (value) => toggleBlockStatus(row.original, value)
        })
      ])
    ])
  }
},{
  id: "role",
  header: "Access Role",
  meta: { class: { th: 'text-right', td: 'text-right' }},
  cell: ({ row }) => {
    const isSelf = row.original.id === currentUser.value?.id
    return h("div", undefined, 
      h(USelect, {
        modelValue: row.original.role?.id,
        items: roleOptions.value,
        loading: updatingUserId.value === row.original.id,
        disabled: isSelf,
        class: "w-40",
        'onUpdate:modelValue': (newRoleId) => changeUserRole(row.original, newRoleId)
      })
    )
  }
},{
  id: "actions",
  meta: { class: { th: 'text-right', td: 'text-right' }},
  cell: ({ row }) => {
    return h(UDropdownMenu, { content: { align: "center", side: "left" }, items: getRowItems(row) },
      () => h(UButton, {
        icon: "hugeicons:more-vertical-circle-01",
        color: "neutral",
        variant: "soft",
      })
    )
  }
}]

function getRowItems(row) {
  const isSelf = row.original.id === currentUser.value?.id
  return [[{
    label: "Delete",
    icon: "hugeicons:user-remove-01",
    color: "error",
    disabled: isSelf,
    onSelect() {
      userToDelete.value = row.original
      isConfirmDeleteOpen.value = true
    }
  }]]
}

// Запрос на удаление пользователя
const confirmDelete = async () => {
  if (!userToDelete.value) return
  isDeleting.value = true
  try {
    await client(`/users/${userToDelete.value.id}`, {
      method: 'DELETE'
    })
    toast.add({
      title: 'Success',
      description: `User ${userToDelete.value.username} has been deleted.`,
      color: 'success'
    })
    emit('refresh')
    isConfirmDeleteOpen.value = false
  } catch (err) {
    console.error(err)
    toast.add({
      title: 'Error',
      description: err?.data?.error?.message || 'Failed to delete user.',
      color: 'error'
    })
  } finally {
    isDeleting.value = false
    userToDelete.value = null
  }
}

const emailSearch = computed({
  get: () => table.value?.tableApi?.getColumn("email")?.getFilterValue() || "",
  set: (value) => {
    table.value?.tableApi?.getColumn("email")?.setFilterValue(value || undefined);
  }
})

const pagination = ref({ pageIndex: 0, pageSize: 24 })
</script>
<template>
  <div class="flex-1 flex flex-col min-h-0 space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-1.5">
        <UInput
          v-model="emailSearch"
          class="w-full md:w-xs"
          icon="i-lucide-search"
          placeholder="Search employees by email..." />
      </div>
    </div>

    <UTable
      ref="table"
      v-model:column-filters="columnFilters"
      v-model:column-visibility="columnVisibility"
      v-model:row-selection="rowSelection"
      v-model:pagination="pagination"
      :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
      class="shrink-0 flex-1 overflow-auto"
      :data="users"
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

    <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
      <div class="text-sm text-muted">
        Selected: {{ Object.keys(rowSelection).length }} of {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }}
      </div>
      <div class="flex items-center gap-1.5">
        <UPagination
          :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
          :items-per-page="table?.tableApi?.getState().pagination.pageSize"
          :total="table?.tableApi?.getFilteredRowModel().rows.length"
          @update:page="(p) => table?.tableApi?.setPageIndex(p - 1)" />
      </div>
    </div>

    <!-- Модальное окно подтверждения удаления -->
    <UModal v-model:open="isConfirmDeleteOpen" :ui="{ width: 'sm:max-w-sm' }">
      <template #content>
        <div class="p-6 flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center bg-error/10 rounded-full text-error w-12 h-12">
              <UIcon name="hugeicons:user-remove-01" class="w-6 h-6" />
            </div>
            <h4 class="text-base font-bold text-highlighted">
              Delete {{ userToDelete?.name || 'User' }}
            </h4>
          </div>
          
          <div class="text-sm text-gray-400 leading-relaxed">
            <p>Are you sure you want to delete user 
              <span class="font-semibold text-highlighted">@{{ userToDelete?.username }}</span>? 
            </p>
            <p>This action cannot be undone.</p>
          </div>

          <div class="flex justify-end gap-2 mt-2">
            <UButton 
              label="Cancel" 
              color="neutral" 
              variant="outline" 
              :disabled="isDeleting"
              @click="isConfirmDeleteOpen = false" />
            <UButton 
              label="Delete" 
              color="error" 
              :loading="isDeleting"
              @click="confirmDelete" />
          </div>
        </div>
      </template>
    </UModal>
    
  </div>
</template>