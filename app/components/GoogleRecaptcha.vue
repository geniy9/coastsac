<script setup>
const emit = defineEmits(['update:modelValue'])
const config = useRuntimeConfig()

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const { $recaptcha } = useNuxtApp()
const recaptchaWidgetId = ref(null)
const recaptchaToken = ref(undefined)

const renderRecaptcha = async () => {
  await $recaptcha.ready()
  if (recaptchaWidgetId.value !== null) {
    window.grecaptcha.reset(recaptchaWidgetId.value);
    return;
  }
  recaptchaWidgetId.value = window.grecaptcha.render('recaptcha-container', {
    sitekey: config.public.RECAPTCHA_SITE_KEY,
    callback: (token) => { recaptchaToken.value = token },
    'expired-callback': () => { recaptchaToken.value = undefined },
  })
}
onMounted(() => { renderRecaptcha() })

watch(() => recaptchaToken.value, (value) => { emit('update:modelValue', value) })

function reset() {
  if (recaptchaWidgetId.value !== null) {
    window.grecaptcha.reset(recaptchaWidgetId.value);
    recaptchaToken.value = undefined;
  }
}
defineExpose({ reset })
</script>
<template>
  <div id="recaptcha-container"></div>
</template>