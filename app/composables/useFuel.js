// composables/useFuel.js
export function useFuel() {
  const config = useRuntimeConfig()
  const defaultCustomerId = config.public.fuelCardApiCustomerId

  // Получить список всех карт
  const getCards = async (customerId = defaultCustomerId) => {
    return await $fetch(`/api/fuel/customers/${customerId}/cards`)
  }

  // Получить базовую информацию по карте
  const getCardData = async (cardId, customerId = defaultCustomerId) => {
    return await $fetch(`/api/fuel/customers/${customerId}/cards/${cardId}`)
  }

  // Получить детальную конфигурацию карты (промпты, лимиты, политики, сгенерированные деньги)
  const getCardInfo = async (cardId, customerId = defaultCustomerId) => {
    return await $fetch(`/api/fuel/customers/${customerId}/cards/${cardId}/card_info`)
  }

  // Получить транзакции, метод принимает объект с параметрами (например, { start_date, end_date })
  const getProcessedTransactions = async (queryParams, customerId = defaultCustomerId) => {
    return await $fetch(`/api/fuel/customers/${customerId}/transactions_processed`, {
      query: queryParams
    })
  }

  // Форматирование даты-времени в часовой пояс US Central Time (America/Chicago)
  const formatToCentralTime = (dateString, dateOnly = false) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Chicago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
      const parts = formatter.formatToParts(date)
      const year = parts.find(p => p.type === 'year').value
      const month = parts.find(p => p.type === 'month').value
      const day = parts.find(p => p.type === 'day').value
      
      if (dateOnly) {
        return `${day}.${month}.${year}`
      }
      
      const hour = parts.find(p => p.type === 'hour').value
      const minute = parts.find(p => p.type === 'minute').value
      const second = parts.find(p => p.type === 'second').value
      
      return `${day}.${month}.${year}, ${hour}:${minute}:${second}`
    } catch (e) {
      return dateString
    }
  }

  // Проверка попадания транзакции в выбранный диапазон дат в часовом поясе US Central Time
  const isTxInCentralTimeRange = (timestamp, start, end) => {
    if (!timestamp || !start || !end) return false
    try {
      const txDate = new Date(timestamp)
      
      // Переводим время транзакции в формат YYYY-MM-DD по Чикаго
      const chicagoDateStr = new Intl.DateTimeFormat('fr-CA', {
        timeZone: 'America/Chicago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(txDate) // Результат: "2026-08-02"

      // Безопасное приведение дат фильтра к формату YYYY-MM-DD
      const formatDateObj = (d) => {
        if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) {
          return d.slice(0, 10)
        }
        const date = new Date(d)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }

      const startDateStr = formatDateObj(start)
      const endDateStr = formatDateObj(end)

      return chicagoDateStr >= startDateStr && chicagoDateStr <= endDateStr
    } catch (e) {
      console.error("Error filtering transaction:", e)
      return false
    }
  }

  return {
    getCards,
    getCardData,
    getCardInfo,
    getProcessedTransactions,
    formatToCentralTime,
    isTxInCentralTimeRange
  }
}