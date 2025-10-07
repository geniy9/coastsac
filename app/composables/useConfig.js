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
    thumbImg: (img) => {
      return `${imageUrl}${img?.formats.thumbnail ? img.formats.thumbnail.url : img.url}`
    },
    smallImg: (img) => {
      return `${imageUrl}${img?.formats.small ? img.formats.small.url : img.url}`
    },
    mediumImg: (img) => {
      if (img?.formats.medium) {
        return `${imageUrl}${img.formats.medium.url}`
      } else if (img?.formats.small) {
        return `${imageUrl}${img.formats.small.url}`
      } else {
        return `${imageUrl}${img.url}`
      }
    },
    largeImg: (img) => {
      if (img?.formats.large) {
        return `${imageUrl}${img.formats.large.url}`
      } else if (img?.formats.medium) {
        return `${imageUrl}${img.formats.medium.url}`
      } else if (img?.formats.small) {
        return `${imageUrl}${img.formats.small.url}`
      } else {
        return `${imageUrl}${img.url}`
      }
    }
  }
}