import type { PostgrestError } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PriceSettings, SavedMetalPrice } from '../types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isCloudStorageEnabled = Boolean(url && anonKey)

const SETTINGS_ID = 'main'

let clientPromise: Promise<SupabaseClient | null> | null = null

async function getClient(): Promise<SupabaseClient | null> {
  if (!isCloudStorageEnabled) return null
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(url!, anonKey!),
    )
  }
  return clientPromise
}

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

  return msg
}

async function ensureRow(client: SupabaseClient): Promise<void> {
  const { data, error: readError } = await client
    .from('app_settings')
    .select('id')
    .eq('id', SETTINGS_ID)
    .maybeSingle()

  if (readError) throw readError
  if (data) return

  const { error: insertError } = await client.from('app_settings').insert({
    id: SETTINGS_ID,
    settings: {},
    metal_prices: [],
  })

  if (insertError) throw insertError
}

export async function loadSharedSettings(): Promise<SharedSettingsData | null> {
  const client = await getClient()
  if (!client) return null

  const { data, error } = await client
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

export async function saveSharedPriceSettings(settings: PriceSettings): Promise<void> {
  const client = await getClient()
  if (!client) {
    throw new Error('Облако не подключено')
  }

  await ensureRow(client)

  const { error } = await client
    .from('app_settings')
    .update({
      settings,
      updated_at: new Date().toISOString(),
    })
    .eq('id', SETTINGS_ID)

  if (error) throw error
}

export async function saveSharedMetalPrices(metalPrices: SavedMetalPrice[]): Promise<void> {
  const client = await getClient()
  if (!client) {
    throw new Error('Облако не подключено')
  }

  await ensureRow(client)

  const { error } = await client
    .from('app_settings')
    .update({
      metal_prices: metalPrices,
      updated_at: new Date().toISOString(),
    })
    .eq('id', SETTINGS_ID)

  if (error) throw error
}
