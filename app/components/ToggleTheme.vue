<script setup>
const colorMode = useColorMode()
function toggleTheme() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
const iconName = computed(() => {
  return colorMode.value === 'dark' ? 'hugeicons:sun-03' : 'hugeicons:moon-02'
})
</script>
<template>
  <Icon @click="toggleTheme" :name="iconName" class="w-5 h-5 leading-0 cursor-pointer text-white" />
</template>