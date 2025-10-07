<script setup>
import { z } from 'zod'

const toast = useToast()
const open = ref(false)
// const router = useRouter()

const schema = z.object({
  date: z.date(),
  companyName: z.string().min(1, 'companyName Required'),
  carrierMc: z.string().min(1, 'carrierMc Required'),
  phone: z.string().min(10, 'Must be at least 10 characters'),
  email: z.string().email('Invalid email'),
})

const state = reactive({
  date: new Date(),
  companyName: undefined,
  carrierMc: undefined,
  phone: undefined,
  email: undefined,
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
    state.companyName = undefined
    state.carrierMc = undefined
    state.phone = undefined
    state.email = undefined
    open.value = false
    loading.value = false
  }
}
</script>
<template>
  <UModal v-model:open="open" :title="$t('text.sign_our_carrier_packet')" 
    :ui="{content: 'max-w-md'}">
    <div>
      <slot />
    </div>
    <template #body>
      <div class="w-full bg-[url('/img/bg_agreement.jpg')] bg-no-repeat pt-30 rounded-tl-xl border-t-2 border-l-2 border-dashed border-gray-400">
        <UForm :schema="schema" :state="state" @submit="onSubmit" class="space-y-[5px]">
          <div class="ml-16 text-black">
            {{ state.date.toISOString().split('T')[0] }}
          </div>
          <UFormField name="companyName" class="ml-28">
            <UInput v-model="state.companyName" 
              placeholder="Acme Corporation" 
              required size="xs" variant="agreement" />
          </UFormField>
          <UFormField name="carrierMc" class="ml-28" required>
            <UInput v-model="state.carrierMc" placeholder="MC-123456" size="xs" variant="agreement" />
          </UFormField>
          <UFormField name="phone" class="ml-16" required>
            <UInput v-model="state.phone" placeholder="+1(555)123-4567" size="xs" variant="agreement" />
          </UFormField>
          <UFormField name="email" class="w-full flex justify-end" required>
            <UInput v-model="state.email" type="email" placeholder="invoices@company.com" size="xs" variant="agreement" class="w-40" />
          </UFormField>
          <div class="flex flex-col items-center xs:flex-row justify-center xs:justify-between mt-30 mb-6">
            <div>
              <a href="/docs/agreement.pdf" target="_blank" class="text-primary font-bold text-sm p-2">
                {{ $t('text.view_agreement_template') }}
              </a>
            </div>
            <UButton type="submit" size="lg" :loading="loading" color="primary" class="text-white">
              {{ $t('text.sign_carrier_packet') }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>