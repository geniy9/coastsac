<script setup>
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})
const emit = defineEmits(['update:modelValue'])
const colors = [
  { color: 'rgb(0,0,0)' },
  { color: 'rgb(51,133,255)' },
]
const options = ref({
  penColor: colors[0].color,
  backgroundColor: 'rgba(255,255,255,0)',
  maxWidth: 4,
  minWidth: 2,
})
const signaturePadRef = ref()

// function handleUndo() { return signaturePadRef.value?.undo() }
function changeColorCanvas(color) { 
  options.value.penColor = color
  return signaturePadRef.value?.clearCanvas()
}
function handleClearCanvas() { 
  signaturePadRef.value?.clearCanvas()
  emit('update:modelValue', '')
}
function handleSaveSignature() {
  if (signaturePadRef.value?.isCanvasEmpty()) {
    emit('update:modelValue', '')
    return
  }
  const signatureData = signaturePadRef.value?.saveSignature('image/png')
  emit('update:modelValue', signatureData) 
}
</script>
<template>
  <div class='flex flex-col space-y-2'>
    <div class='p-2 bg-white rounded-md border-2 border-dashed border-gray-400'>
      <div class='relative flex flex-col items-center justify-center border-2 border-dashed border-gray-400 rounded-md'>
        <NuxtSignaturePad 
          ref="signaturePadRef"
          height="320px"
          width="320px"
          :max-width="options.maxWidth"
          :min-width="options.minWidth"
          :options="{
            penColor: options.penColor,
            backgroundColor: options.backgroundColor,
          }"
        />
        <div class=' flex items-center justify-center gap-2 bottom-0 w-full'>
          <div class='flex items-center gap-1'>
            <div v-for='color in colors' :key='color.color'>
              <div :style='{ background: color.color }'
                class='grid w-6 h-6 rounded-full place-items-center cursor-pointer'
                @click='changeColorCanvas(color.color)'>
                <span v-if='options.penColor === color.color'>
                  <UIcon name="hugeicons:checkmark-circle-01" class="bg-white w-6 h-6" />
                </span>
              </div>
            </div>
          </div>
          <!-- <UButton @click='handleUndo' icon="hugeicons:undo-03" size="sm" color="primary" variant="solid">
            Back
          </UButton> -->
          <UButton @click='handleClearCanvas' icon="hugeicons:eraser" size="sm" color="error" variant="solid">
            Clear
          </UButton>
          <UButton @click='handleSaveSignature' icon="hugeicons:signature" size="sm" color="primary" variant="solid">
            Save
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
