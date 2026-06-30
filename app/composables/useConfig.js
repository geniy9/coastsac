// composables/useConfig.js
export default () => {
  const config = useRuntimeConfig()
  const imageUrl = config.public.STRAPI_URL
  const originUrl = config.public.ORIGIN
  const toast = useToast()
  const appConfig = useAppConfig()
  const tailwindColorsHex = {
    orange: "f97316",
    yellow: "eab308",
    lime: "84cc16",
    green: "22c55e",
    teal: "14b8a6",
    sky: "0ea5e9",
    blue: "3b82f6",
    violet: "8b5cf6",
    pink: "ec4899",
    red: "ef4444",
    dark: "000000",
  }
  const getAvatar = (img, name) => {
    return {
      src: img ? `${img.formats?.thumbnail ? imageUrl + img.formats?.thumbnail?.url : null}` : null,
      alt: name || "User Avatar"
    }
  }
  const getMime = (file) => {
    return (file.ext ? file.ext.replace(/^\./, '') : 'file').toUpperCase()
  }
  const getStatusColor = (status) => {
    switch (status) {
      case 'not_started': return 'neutral'
      case 'in_transit': return 'info'
      case 'loaded': return 'warning'
      case 'unloaded': return 'success'
      case 'cancelled': return 'error'
      case 'tonu': return 'error'
      default: return 'neutral'
    }
  }
  return {
    imageUrl,
    originUrl,
    getAvatar,
    getMime,
    getStatusColor,
    trailerOptions: [
      { value: 'van', label: 'Van', icon: 'hugeicons:van' },
      { value: 'reefer', label: 'Reefer', icon: 'ph:truck-trailer' },
      { value: 'flatbed', label: 'Flatbed', icon: 'bi:truck-flatbed' },
      { value: 'stepdeck', label: 'Stepdeck', icon: 'hugeicons:tanker-truck' },
      { value: 'conestoga', label: 'Conestoga', icon: 'streamline-ultimate:shipping-truck-style-2' },
      { value: 'power_only', label: 'Power Only', icon: 'hugeicons:semi-truck' }
    ],
    driverTypeOptions: [
      { value: 'company_driver', label: 'Company Driver' },
      { value: 'owner_operator', label: 'Owner Operator' }
    ],
    statesList: [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    ],
    loadStatusOptions: [
      { value: 'not_started', label: 'Not Started' },
      { value: 'in_transit', label: 'In Transit' },
      { value: 'loaded', label: 'Loaded' },
      { value: 'unloaded', label: 'Unloaded' },
      { value: 'cancelled', label: 'Cancelled' },
      { value: 'tonu', label: 'TONU' }
    ],
    categoryOptions: [
      { value: 'active', label: 'Active' },
      { value: 'next', label: 'Next' },
      { value: 'completed', label: 'Completed' }
    ],
    factoringStatusOptions: [
      { value: 'not_submitted', label: 'Not Submitted' },
      { value: 'submitted', label: 'Submitted' },
      { value: 'paid', label: 'Paid' }
    ],
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
      return `${imageUrl}${img?.formats?.small ? img.formats.small.url : img.url}`
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
  }
}