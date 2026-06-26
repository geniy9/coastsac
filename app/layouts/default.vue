<script setup>
const route = useRoute()

useHead({
  titleTemplate: (title) => {
    return title ? `${title} | LIGHT FREIGHT` : "LIGHT FREIGHT"
  },
  script: [
    {
      id: 'fb-pixel',
      innerHTML: `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '1982855955827405');
        fbq('track', 'PageView');
      `,
      type: 'text/javascript',
    },
  ],
  noscript: [
    {
      innerHTML: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=1982855955827405&ev=PageView&noscript=1" />`
    }
  ]
})

watch(() => route.fullPath, () => {
  if (import.meta.client && window.fbq) {
    window.fbq('track', 'PageView')
  }
})

const bgColor = computed(() => {
  const routeMeta = route.meta
  return routeMeta.bgColorPage || 'dark:bg-primary dark:text-white'
})
</script>
<template>
  <div :class="bgColor" class="flex flex-col min-h-screen overflow-hidden bg-white text-gray-950">
    <Headers />
    
    <main class="grow pt-16"> 
      <slot />
    </main>
    
    <Footers />
  </div>
</template>