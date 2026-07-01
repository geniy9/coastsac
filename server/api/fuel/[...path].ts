// server/api/fuel/[...path].ts
import { getFuelToken, clearFuelTokenCache } from '../../utils/fuelAuth'
import { defineEventHandler, getQuery, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const rawPath = event.context.params?.path || ''
  const query = getQuery(event)
  const targetUrl = `https://api.fleet.msfuelcard.com/v1/${rawPath}`

  // Не проксируем повторно роут логина, если он вызван напрямую
  if (rawPath === 'login') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Manual login through proxy is restricted'
    })
  }

  // Получаем токен из кэша или авторизуемся
  let token = await getFuelToken()

  const makeRequest = async (authToken: string) => {
    return await $fetch(targetUrl, {
      query,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Accept': 'application/json'
      }
    })
  }

  try {
    return await makeRequest(token)
  } catch (error: any) {
    // Обработка непредвиденного истечения срока токена (401)
    if (error.response?.status === 401) {
      console.warn('[Fuel Proxy] Received 401 Unauthorized, clearing token cache and retrying...')
      clearFuelTokenCache()
      
      try {
        const freshToken = await getFuelToken()
        return await makeRequest(freshToken)
      } catch (retryError: any) {
        throw createError({
          statusCode: retryError.response?.status || 401,
          statusMessage: 'Fuel API retry with fresh token failed',
          data: retryError.data
        })
      }
    }

    throw createError({
      statusCode: error.response?.status || 500,
      statusMessage: error.response?.statusText || 'External Fuel API Error',
      data: error.data
    })
  }
})