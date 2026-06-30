import { defineEventHandler, getQuery, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = config.fuelCardApiToken

  if (!token) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Fuel Card API Token is not configured on the server.'
    })
  }

  // Извлекаем оставшуюся часть пути (например, customers/46876/cards)
  const rawPath = event.context.params?.path || ''
  const query = getQuery(event)

  // Базовый URL API из документации
  const targetUrl = `https://api.fleet.msfuelcard.com/v1/${rawPath}`

  try {
    const response = await $fetch(targetUrl, {
      query,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })
    return response
  } catch (error: any) {
    throw createError({
      statusCode: error.response?.status || 500,
      statusMessage: error.response?.statusText || 'External Fuel API Error',
      data: error.data
    })
  }
})