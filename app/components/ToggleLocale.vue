<script setup>
const { locale, locales, setLocale } = useI18n()

async function changeLocale(code) {
  await refreshNuxtData()
  setLocale(code)
}
</script>
<template>
  <div>
    <div v-for="(loc, i) in locales" :key="i" @click="changeLocale(loc.code)">
      <UButton
        v-if="locale !== loc.code" 
        class="uppercase cursor-pointer"
        :label="loc.code" 
        variant="link" 
        color="white" />
    </div>
  </div>
</template>