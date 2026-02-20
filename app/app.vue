<script setup>
useHead({
  titleTemplate: (title) => {
    return title ? `${title} | LIGHT FREIGHT` : "LIGHT FREIGHT"
  },
  script: [
    {
      children: `!function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '1982855955827405');
      fbq('track', 'PageView');`,
      type: 'text/javascript'
    }
  ],
  noscript: [
    {
      children: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=1982855955827405&ev=PageView&noscript=1" />`
    }
  ]
})
</script>
<template>
  <UApp>
    <div class="flex flex-col min-h-screen overflow-hidden bg-white text-gray-900 dark:bg-primary dark:text-white">
      <Headers />
      <div class="flex-grow">
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
      </div>
      <Footers />
    </div>
  </UApp>
</template>
<!-- <style>
.page-enter-active,
.page-leave-active {
  transition: all 0.5s;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(24px);
}
</style> -->
