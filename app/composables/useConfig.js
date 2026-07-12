// composables/useConfig.js
export default () => {
  const config = useRuntimeConfig()
  const imageUrl = config.public.STRAPI_URL
  const originUrl = config.public.ORIGIN
  const toast = useToast()
  const getPayableAmount = (rate, commissionRate) => {
    const r = Number(rate) || 0
    const c = Number(commissionRate) || 0
    if (c <= 0) return r
    return r - (r * c / 100)
  }
  const getAvatar = (img, name) => {
    return {
      src: thumbImg(img),
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
      case 'loaded': return 'primary'
      case 'unloaded': return 'success'
      case 'cancelled': return 'error'
      case 'tonu': return 'error'
      default: return 'neutral'
    }
  }
  const getExpiryColor = (dateStr) => {
    if (!dateStr || dateStr === '-') return 'neutral'
    return lessThanWeek(dateStr) ? 'error' : 'success'
  }
  const lessThanWeek = (dateStr) => {
    if (!dateStr || dateStr === '-') return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expiryDate = new Date(dateStr)
    expiryDate.setHours(0, 0, 0, 0)
    const diffDays = (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    return diffDays < 7
  }
  const isImageFile = (file) => {
    const mime = file.mime || ''
    const ext = file.ext || ''
    return mime.startsWith('image/') || /\.(jpe?g|png|gif)$/i.test(ext || file.url)
  }
  const getFileUrl = (file) => {
    if (!file) return ''
    if (file.url.startsWith('http')) return file.url
    return `${imageUrl}${file.url}`
  }
  const thumbImg = (file) => {
    if (!file) return ''
    if (isImageFile(file)) {
      if (file.formats?.thumbnail) { return getFileUrl(file.formats.thumbnail) }
      return getFileUrl(file)
    }
    return ''
  }
  const smallImg = (file) => {
    if (!file) return ''
    if (isImageFile(file)) {
      if (file.formats?.small) { return getFileUrl(file.formats.small) }
      return getFileUrl(file)
    }
    return ''
  }
  const mediumImg = (file) => {
    if (!file) return ''
    if (isImageFile(file)) {
      if (file.formats?.medium) { return getFileUrl(file.formats.medium) }
      return getFileUrl(file)
    }
    return ''
  }
  return {
    imageUrl,
    originUrl,
    getPayableAmount,
    getAvatar,
    getMime,
    getStatusColor,
    getExpiryColor,
    isImageFile,
    getFileUrl,
    thumbImg,
    smallImg,
    mediumImg,
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
  }
}