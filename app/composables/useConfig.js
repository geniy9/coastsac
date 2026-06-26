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
  const activeColor = computed(() => appConfig.ui?.colors?.primary || "orange")
  const getAvatar = (name) => {
    if (name) {
      const colorHex = tailwindColorsHex[activeColor.value] || "f97316";
      return {
        src: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=${colorHex}`,
        alt: name || "User Avatar"
      }
    }
    return {
      src: "https://github.com/benjamincanac.png",
      alt: "Guest",
    }
  }
  return {
    imageUrl,
    originUrl,
    getAvatar,
    // конфигурации Drivers
    trailerOptions: [
      { value: 'van', label: 'Van' },
      { value: 'reefer', label: 'Reefer' },
      { value: 'flatbed', label: 'Flatbed' },
      { value: 'stepdeck', label: 'Stepdeck' },
      { value: 'conestoga', label: 'Conestoga' },
      { value: 'power_only', label: 'Power Only' }
    ],
    driverTypeOptions: [
      { value: 'company_driver', label: 'Company Driver' },
      { value: 'owner_operator', label: 'Owner Operator' }
    ],
    // конфигурации Loads
    statesList: [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    ],
    loadStatusOptions: [
      { value: 'not_started', label: 'Not Started' },
      { value: 'in_transit', label: 'In Transit' },
      { value: 'loaded', label: 'Loaded' },
      { value: 'unloaded', label: 'Unloaded' },
      { value: 'cancelled', label: 'Cancelled' }
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