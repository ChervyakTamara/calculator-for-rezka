import type { PriceSettings, SavedMetalPrice } from '../types'

/** На Vercel (production) — хранение в Blob; локально — fallback в браузер */
export const isCloudStorageEnabled = import.meta.env.PROD

export interface SharedSettingsData {
  settings: PriceSettings
  metalPrices: SavedMetalPrice[]
  updatedAt?: string
}

export function formatDbError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'error' in error) {
    return String((error as { error: string }).error)
  }
  return 'Неизвестная ошибка'
}

async function parseError(response: Response): Promise<never> {
  const body = await response.json().catch(() => ({ error: response.statusText }))
  throw new Error(body.error || response.statusText)
}

async function patchStorage(
  partial: Partial<{ settings: PriceSettings; metalPrices: SavedMetalPrice[] }>,
): Promise<void> {
  const response = await fetch('/api/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(partial),
  })

  if (!response.ok) await parseError(response)
}

export async function loadSharedSettings(): Promise<SharedSettingsData | null> {
  const response = await fetch('/api/settings', { cache: 'no-store' })
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
