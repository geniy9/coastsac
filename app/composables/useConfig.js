export default () => {
  const config = useRuntimeConfig()
  const imageUrl = config.public.STRAPI_URL
  const originUrl = config.public.ORIGIN
  const toast = useToast()
  return {
    imageUrl,
    originUrl,
    copyBoofer: (str) => {
      if (import.meta.client) {
        navigator.clipboard.writeText(str)
        toast.add({
          title: 'Copied',
          description: str,
          color: 'primary'
        })
      } else {
        console.warn("do SSR false")
      }
    },
    truncate: (str, value = 100, ends = '...') => { 
      return `${(str || '').substring(0, value)}${str?.length > value ? ends : ''}`
    },
  }
}