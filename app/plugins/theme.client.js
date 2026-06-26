// plugins/theme.client.js
export default defineNuxtPlugin(() => {
  const appConfig = useAppConfig()
  
  const savedPrimary = localStorage.getItem('theme-ui-primary') || 'sky'
  const savedNeutral = localStorage.getItem('theme-ui-neutral') || 'zinc'
  
  if (savedPrimary && appConfig.ui?.colors) {
    appConfig.ui.colors.primary = savedPrimary
  }
  
  if (savedNeutral && appConfig.ui?.colors) {
    appConfig.ui.colors.neutral = savedNeutral
  }
})