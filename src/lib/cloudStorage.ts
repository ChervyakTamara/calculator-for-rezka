import type { PostgrestError } from '@supabase/supabase-js'
import type { PriceSettings, SavedMetalPrice } from '../types'
import { isCloudStorageEnabled, supabase } from './supabase'

const SETTINGS_ID = 'main'

export interface SharedSettingsData {
  settings: PriceSettings
  metalPrices: SavedMetalPrice[]
  updatedAt?: string
}

export function formatDbError(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Неизвестная ошибка'

  const pg = error as PostgrestError
  const msg = pg.message ?? pg.details ?? String(error)

  if (msg.includes('app_settings') && msg.includes('does not exist')) {
    return 'Таблица app_settings не создана. Выполните supabase/schema.sql в SQL Editor.'
  }
  if (pg.code === '42501') {
    return 'Нет прав на запись. Перезапустите schema.sql (раздел GRANT).'
  }
  if (pg.code === 'PGRST116') {
    return 'Запись не найдена в базе.'
  }

  return msg
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
  if (!supabase) {
    throw new Error(
      'Облако не подключено. Добавьте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY на Vercel.',
    )
  }

  const payload = {
    settings,
    metal_prices: metalPrices,
    updated_at: new Date().toISOString(),
  }

  const { data: existing, error: readError } = await supabase
    .from('app_settings')
    .select('id')
    .eq('id', SETTINGS_ID)
    .maybeSingle()

  if (readError) throw readError

  if (existing) {
    const { error } = await supabase
      .from('app_settings')
      .update(payload)
      .eq('id', SETTINGS_ID)

    if (error) throw error
    return
  }

  const { error: insertError } = await supabase.from('app_settings').insert({
    id: SETTINGS_ID,
    ...payload,
  })

  if (insertError) throw insertError
}

export { isCloudStorageEnabled }
