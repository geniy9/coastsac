<script setup>
const { smallImg, thumbImg } = useConfig()
const props = defineProps({
  items: {
    type: Array,
    default: []
  }
})

const carousel = useTemplateRef('carousel')
const activeIndex = ref(0)

function onClickPrev() {
  activeIndex.value--
}
function onClickNext() {
  activeIndex.value++
}
function onSelect(index) {
  activeIndex.value = index
}
function select(index) {
  activeIndex.value = index
  carousel.value?.emblaApi?.scrollTo(index)
}
</script>
<template>
  <div class="flex-1 w-full">
    <UCarousel
      ref="carousel"
      v-slot="{ item }"
      arrows
      :items="items"
      :prev="{ onClick: onClickPrev, color: 'primary' }"
      :next="{ onClick: onClickNext, color: 'primary' }"
      prev-icon="material-symbols:arrow-back-ios-new-rounded"
      next-icon="material-symbols:arrow-forward-ios-rounded"
      class="w-full max-[500px] mx-auto"
      @select="onSelect" 
      :ui="{ prev: 'start-0 sm:start-0 hidden sm:flex', next: 'end-0 sm:end-0 hidden sm:flex'}">
      <div class="flex justify-center">
        <img :src="smallImg(item)" class="rounded-lg" />
      </div>
    </UCarousel>

    <div class="flex gap-1 justify-center max-w-sm mx-auto">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="size-18 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
        :class="{ 'opacity-100': activeIndex === index }"
        @click="select(index)"
      >
        <img :src="thumbImg(item)" class="rounded-lg" />
      </div>
    </div>
  </div>
</template>