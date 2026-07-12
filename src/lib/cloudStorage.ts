import type { PriceSettings, SavedMetalPrice } from '../types'

export const isCloudStorageEnabled = import.meta.env.PROD

export interface SharedSettingsData {
  settings: PriceSettings
  metalPrices: SavedMetalPrice[]
  updatedAt?: string
}

const API_BASE = typeof window !== 'undefined' ? window.location.origin : ''

export function formatDbError(error: unknown): string {
  if (error instanceof TypeError) {
    return (
      'Нет связи с сервером. Проверьте: 1) Redeploy на Vercel 2) папка api/ в GitHub 3) BLOB_READ_WRITE_TOKEN. ' +
      `Откройте ${API_BASE}/api/health — должен ответить {"ok":true}`
    )
  }
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'error' in error) {
    return String((error as { error: string }).error)
  }
  return 'Неизвестная ошибка'
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${API_BASE}${path}`
  try {
    return await fetch(url, { ...init, cache: 'no-store' })
  } catch {
    throw new TypeError('Failed to fetch')
  }
}

async function parseError(response: Response): Promise<never> {
  const body = await response.json().catch(() => ({ error: response.statusText }))
  throw new Error(body.error || `Ошибка ${response.status}`)
}

async function patchStorage(
  partial: Partial<{ settings: PriceSettings; metalPrices: SavedMetalPrice[] }>,
): Promise<void> {
  const response = await apiFetch('/api/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(partial),
  })

  if (!response.ok) await parseError(response)
}

export async function loadSharedSettings(): Promise<SharedSettingsData | null> {
  const response = await apiFetch('/api/settings')
  if (!response.ok) await parseError(response)

  const data = await response.json()

  if (!data.updatedAt) return null

  return {
    settings: data.settings as PriceSettings,
    metalPrices: (data.metalPrices as SavedMetalPrice[]) ?? [],
    updatedAt: data.updatedAt as string,
  }
}

export async function saveSharedPriceSettings(settings: PriceSettings): Promise<void> {
  await patchStorage({ settings })
}

export async function saveSharedMetalPrices(metalPrices: SavedMetalPrice[]): Promise<void> {
  await patchStorage({ metalPrices })
}
