import type { PriceSettings, SavedMetalPrice } from '../types'
import { isCloudStorageEnabled, supabase } from './supabase'

const SETTINGS_ID = 'main'

export interface SharedSettingsData {
  settings: PriceSettings
  metalPrices: SavedMetalPrice[]
  updatedAt?: string
}

export async function loadSharedSettings(): Promise<SharedSettingsData | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('app_settings')
    .select('settings, metal_prices, updated_at')
    .eq('id', SETTINGS_ID)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    settings: data.settings as PriceSettings,
    metalPrices: (data.metal_prices as SavedMetalPrice[]) ?? [],
    updatedAt: data.updated_at as string | undefined,
  }
}

export async function saveSharedSettings(
  settings: PriceSettings,
  metalPrices: SavedMetalPrice[],
): Promise<void> {
  if (!supabase) throw new Error('Облако не настроено')

  const { error } = await supabase.from('app_settings').upsert({
    id: SETTINGS_ID,
    settings,
    metal_prices: metalPrices,
    updated_at: new Date().toISOString(),
  })

  if (error) throw error
}

export { isCloudStorageEnabled }
