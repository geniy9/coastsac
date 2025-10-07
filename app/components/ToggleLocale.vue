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
      <div v-if="locale !== loc.code" class="uppercase cursor-pointer font-bold p-2">
        {{ loc.code }}
      </div>
    </div>
  </div>
</template>