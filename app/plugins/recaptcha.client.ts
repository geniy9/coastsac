export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();
  const siteKey = config.public.RECAPTCHA_SITE_KEY;

  if (!siteKey) {
    console.warn('reCAPTCHA site key is not configured in .env file.');
    return;
  }
  const recaptchaScriptId = 'recaptcha-script';
  if (document.getElementById(recaptchaScriptId)) {
    return;
  }

  const recaptchaReady = new Promise<void>((resolve) => {
    (window as any).nuxtRecaptchaLoaded = () => {
      resolve();
      delete (window as any).nuxtRecaptchaLoaded; 
    };
  });

  const script = document.createElement('script');
  script.id = recaptchaScriptId;
  script.src = `https://www.google.com/recaptcha/api.js?onload=nuxtRecaptchaLoaded&render=explicit`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
  
  nuxtApp.provide('recaptcha', {
    ready: () => recaptchaReady,
  });
});