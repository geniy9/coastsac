// server/utils/fuelAuth.ts
import { useRuntimeConfig } from '#imports'
import { createError } from 'h3'

let cachedToken: string | null = null
let tokenExpiry: number | null = null // UNIX-timestamp 

// безопасно декодируем JWT на стороне Node.js
function parseJwt(token: string) {
  try {
    const parts = token.split('.')
    const base64Url = parts[1]
    
    if (!base64Url) {
      return null
    }
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8')
    return JSON.parse(jsonPayload)
  } catch (e) {
    return null
  }
}

export async function getFuelToken(): Promise<string> {
  const config = useRuntimeConfig()
  const username = config.fuelCardApiUsername
  const password = config.fuelCardApiPassword
  const baseUrl = 'https://api.fleet.msfuelcard.com/v1'

  const nowInSeconds = Math.floor(Date.now() / 1000)

  // Если токен есть в кэше и он валиден (с запасом 15 минут до истечения)
  if (cachedToken && tokenExpiry && (tokenExpiry - nowInSeconds > 900)) {
    return cachedToken
  }

  // Если кэша нет или он просрочен — выполняем авторизацию
  try {
    const response: any = await $fetch(`${baseUrl}/login`, {
      method: 'POST',
      body: { username, password }
    })

    const token = response?.data?.attributes?.api_token
    if (!token || typeof token !== 'string') {
      throw new Error('No api_token returned from login endpoint')
    }

    cachedToken = token

    // Декодируем токен для извлечения времени жизни exp
    const decoded = parseJwt(token)
    if (decoded && typeof decoded.exp === 'number') {
      tokenExpiry = decoded.exp
    } else {
      // Резервный вариант: кэшируем на 28 дней
      tokenExpiry = nowInSeconds + (28 * 24 * 60 * 60)
    }

    return token
  } catch (error: any) {
    console.error('[Fuel Auth Error] Failed to login to external API:', error?.data || error?.message)
    throw createError({
      statusCode: 401,
      statusMessage: 'Fuel API Authentication Failed'
    })
  }
}

// Принудительный сброс кэша
export function clearFuelTokenCache(): void {
  cachedToken = null
  tokenExpiry = null
}