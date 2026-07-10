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

  return {
    getCards,
    getCardData,
    getCardInfo,
    getProcessedTransactions
  }
}