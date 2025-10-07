<script setup>
const props = defineProps({
  items: {
    type: Array,
    default: []
  },
  loading: {
    type: Boolean,
    default: false
  }
})
</script>
<template>
  <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-4">
    <USkeleton v-for="i in 5" class="rounded-3xl h-44" :class="{'sm:col-span-2' : i === 1}" />
  </div>
  <div v-else-if="items.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-4">
    <div v-for="(item, i) in items" :key="i" 
      class="rounded-tl-[48px] rounded-tr-2xl rounded-bl-2xl rounded-br-[48px] p-4 bg-gradient-to-tl" 
      :class="[(i === 0) ? 'sm:col-span-2 bg-primary' : 'col-span-1 from-gray-50 to-gray-200']">
      
      <NuxtLinkLocale :to="`/${item.slug}`">
        <div class="grid grid-cols-2 items-center justify-evenly gap-6 p-2 xs:p-4">
          <div class="flex flex-col items-start gap-2">
            <h3 :class="[(i === 0) 
              ? 'text-white text-base xs:text-lg sm:text-xl md:text-2xl xl:text-3xl' 
              : 'text-sm sm:text-base']" 
              class="font-bold mb-2 uppercase">
              {{ item.name }}
            </h3>
            <div class="uppercase text-xs font-bold text-gray-700 bg-white cursor-pointer px-4 py-2 rounded-md">
              {{ $t('text.more') }}
            </div>
          </div>
          <img :src="`/img/${item.slug}.png`"  
            :class="[(i === 0) ? 'scale-100 sm:scale-125 md:scale-150 w-40 xs:w-44 sm:w-52': 'w-40 xs:w-44']"/>
        </div>
      </NuxtLinkLocale>

    </div>
  </div>
</template>