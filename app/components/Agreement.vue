<script setup>
import { z } from 'zod'

const toast = useToast()
const isOpen = ref(false)
// const router = useRouter()

const items = [{
  title: 'Contacts',
  description: 'Add your contacts here',
  icon: 'hugeicons:document-attachment',
  slot: 'contacts'
},{
  title: 'Signature',
  description: 'Sign dispatch agreement',
  icon: 'hugeicons:signature',
  slot: 'signature'
}]
const stepper = useTemplateRef('stepper')

const schema = z.object({
  date: z.date(),
  companyName: z.string().min(1, 'companyName Required'),
  carrierMc: z.string().min(1, 'carrierMc Required'),
  phone: z.string().min(10, 'Must be at least 10 characters'),
  email: z.email('Invalid email'),
  contactName: z.string().min(1, 'contactName Required'),
  signature: z.string().min(1, 'Signature Required'),
})

const state = reactive({
  date: new Date(),
  companyName: undefined,
  carrierMc: undefined,
  phone: undefined,
  email: undefined,
  contactName: undefined,
  signature: undefined,
})
const loading = ref(false);

async function onSubmit(event) {
  loading.value = true;
  try {
    const agreementPayload = {
      ...event.data,
      date: event.data.date.toISOString().split('T')[0],
    }
    await $fetch('https://coastsac.com/cms/api/agreements/create-with-pdf', {
      method: 'POST',
      body: agreementPayload,
    });

    toast.add({
      title: 'Successful',
      description: 'The agreement was successfully sent and pdf generated.',
      icon: 'i-heroicons-check-circle',
      color: 'success'
    })
    // router.push('/success-page');

  } catch (error) {
    console.error('Agreement submission error:', error);
    toast.add({
      title: 'Error!',
      description: error.data?.message || 'Failed to send an agreement.',
      icon: 'i-heroicons-x-circle',
      color: 'error'
    });
  } finally {
    clearFields()
    isOpen.value = false
    loading.value = false
  }
}
function clearFields() {
  state.companyName = undefined
  state.carrierMc = undefined
  state.phone = undefined
  state.email = undefined
  state.contactName = undefined
  state.signature = undefined
}
const isDisabled = computed(() => {
  return !!(!state.date ||
  !state.companyName ||
  !state.carrierMc ||
  !state.phone ||
  !state.email ||
  !state.contactName ||
  !state.signature)
})
onUnmounted(() => clearFields())
</script>
<template>
  <UModal :dismissible="false" v-model:open="isOpen" :ui="{content: 'max-w-md'}">
    <template #header>
      <div class="flex flex-col gap-1 text-primary dark:text-white">
        <h1 class="text-xl font-bold">
          {{ $t('text.sign_our_carrier_packet') }}
        </h1>
        <a href="/docs/agreement.pdf" target="_blank" 
          class="flex gap-2 items-center leading-0">
          <span>{{ $t('text.view_agreement_template') }}</span>
          <UIcon name="hugeicons:link-square-02" class="w-5 h-5" />
        </a>
      </div>
      <div @click="isOpen = false" class="absolute top-4 end-4">
        <Icon name="hugeicons:cancel-01" @click="isOpen = false" class="w-8 h-8 cursor-pointer scale-100 hover:scale-110 transition-all dark:text-white text-primary" />
      </div>
    </template>
    <div>
      <slot />
    </div>
    <template #body>
      <div class="w-full">
        <UForm :schema="schema" :state="state" @submit="onSubmit">
          <UStepper ref="stepper" :items="items">
            <template #contacts>
              <div class="w-full space-y-2 py-4">
                <UFormField label="Company Name" name="companyName">
                  <UInput v-model="state.companyName" 
                    placeholder="Acme Corporation" required />
                </UFormField>
                <UFormField label="Carrier`s MC #" name="carrierMc" required>
                  <UInput v-model="state.carrierMc" placeholder="MC-123456" />
                </UFormField>
                <UFormField label="Phone" name="phone" required>
                  <UInput v-model="state.phone" placeholder="+1(555)123-4567" />
                </UFormField>
                <UFormField label="Company email to receive invoices" name="email" required>
                  <UInput v-model="state.email" type="email" placeholder="invoices@company.com" class="w-80" />
                </UFormField>
              </div>
            </template>

            <template #signature>
              <div class="w-full space-y-2 py-4">
                <UFormField label="Contact Name" name="contactName">
                  <UInput v-model="state.contactName" placeholder="Your full name" class="w-80" required />
                </UFormField>
                <UFormField label="Your Signature" name="signature">
                  <Signature v-model="state.signature" />
                </UFormField>
                <div class="flex flex-col items-center xs:flex-row justify-center xs:justify-between mt-6">
                  <UButton type="submit" :disabled="isDisabled" :loading="loading" color="primary" size="xl" class="text-white" block>
                    {{ $t('text.sign_carrier_packet') }}
                  </UButton>
                </div>
              </div>
            </template>
          </UStepper>

          <div class="flex gap-2 justify-between mt-4">
            <div>
              <UButton v-if="stepper?.hasPrev" 
                label="Prev"
                icon="hugeicons:arrow-left-01"
                @click="stepper?.prev()" />
            </div>
            <div>
              <UButton v-if="stepper?.hasNext" 
                label="Next"
                icon="hugeicons:arrow-right-01"
                @click="stepper?.next()" trailing />
            </div>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>