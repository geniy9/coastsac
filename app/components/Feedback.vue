<script setup>
import { z } from 'zod'

const client = useStrapiClient()
const toast = useToast()
const { t } = useI18n()

const props = defineProps({
  subject: {
    type: String,
    default: ''
  },
  template: {
    type: String,
    default: 'light-freight'
  }
})

const schema = z.object({
  subject: z.string(),
  template: z.string().optional(),
  name: z.string().min(3, 'Must be at least 3 characters'),
  phone: z.string().min(10, 'Must be at least 10 characters'),
  email: z.email('Invalid email'),
  message: z.string().min(10, 'Please describe your request'),
  recaptcha: z.string().min(1, 'Please complete the reCAPTCHA challenge'),
})

const state = reactive({
  subject: props.subject || 'Your Feedback on Light Freight has been received',
  template: props.template || 'light-freight',
  name: undefined,
  phone: undefined,
  email: undefined,
  message: undefined,
  recaptcha: undefined,
  response: null
})
const captchaComponent = ref(null)
const loading = ref(false);
const isOpen = ref(false);

watch(() => props.subject, (newSubject) => {
  state.subject = newSubject || 'Your Feedback on Light Freight has been received'
})
watch(() => props.template, (newTemplate) => {
  state.template = newTemplate || 'default'
})

async function onSubmit(event) {
  loading.value = true;
  try {
    const { recaptcha, ...formData } = event.data
    const payload = { ...formData, subject: state.subject, template: state.template }
    const res = await client('/feedbacks', {
      method: 'POST',
      body: { data: payload },
      headers: { 'g-recaptcha-response': state.recaptcha }
    })
    toast.add({ 
      title: t('error.feedback_success'), 
      color: 'success', 
      icon: 'hugeicons:checkmark-circle-02'
    });
    if (res) state.response = res.data

  } catch (e) {
    toast.add({ 
      title: t('error.feedback_error'), 
      description: 'Please try again.', 
      color: 'error', 
      icon: 'hugeicons:cancel-circle'
    })
    captchaComponent.value?.reset()
    clearFeedback()
  } finally {
    loading.value = false;
    clearFeedback()
  }
}

function clearFeedback() {
  state.name = undefined
  state.phone = undefined
  state.email = undefined
  state.message = undefined
}
const isDisabled = computed(() => {
  return !state.name || !state.phone || !state.email || !state.message || !state.recaptcha
})
</script>
<template>
  <UModal v-model:open="isOpen" :ui="{ 
      content: 'max-w-md p-0 bg-transparent', 
      header: 'p-0 sm:px-0 min-h-0', 
      body: 'p-0 sm:p-0',
      close: 'dark:text-white hover:text-black'
      }">
    <template #header>
      <div @click="isOpen = false" class="absolute top-4 end-4">
        <Icon name="hugeicons:cancel-01" @click="isOpen = false" class="w-7 h-7 cursor-pointer scale-100 hover:scale-110 transition-all dark:text-white text-primary" />
      </div>
    </template>
    <div>
      <slot />
    </div>
    <template #body>
      <UCard>
        <template #header>
          <h2 class="text-2xl dark:text-white font-bold">{{ props.subject }}</h2>
        </template>

        <div v-if="state.response" class="flex flex-col gap-4">
          <div>
            <h3 class="text-xl">{{ $t('text.feedback_response_title') }}</h3>
            <p>{{ $t('text.feedback_response_desc') }}</p>
          </div>
          <UButton block color="primary" @click="isOpen = false">Ok</UButton>
        </div>
        <UForm v-else :schema="schema" :state="state" class="space-y-3" @submit.prevent="onSubmit">
          <UFormField :label="$t('text.full_name')" name="name" required>
            <UInput v-model="state.name" class="w-xs" />
          </UFormField>
          <UFormField :label="$t('text.phone_number')" name="phone" required>
            <UInput v-model="state.phone" type="tel" class="w-xs" />
          </UFormField>
          <UFormField label="Email" name="email" required>
            <UInput v-model="state.email" class="w-xs" />
          </UFormField>
          <UFormField :label="$t('text.message')" name="message" required>
            <UTextarea v-model="state.message" autoresize class="w-full" />
          </UFormField>

          <UFormField name="recaptcha">
            <GoogleRecaptcha 
              ref="captchaComponent" 
              v-model="state.recaptcha" 
              class="flex justify-center" />
          </UFormField>

          <UButton 
            type="submit" 
            block size="lg" 
            :disabled="isDisabled" 
            :color="isDisabled ? 'neutral' : 'primary'"
            :loading="loading" 
            class="dark:text-gray-500 text-gray-400">
            {{ $t('text.send') }} 
          </UButton>
          
        </UForm>
      </UCard>
    </template>
  </UModal>
</template>