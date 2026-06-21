import type { JobInput, PriceSettings, SavedMetalPrice } from '../types'
import { DEFAULT_JOB, DEFAULT_SETTINGS } from './defaults'

const SETTINGS_KEY = 'laser-calc-settings'
const JOB_KEY = 'laser-calc-job'
const PRICES_KEY = 'laser-calc-metal-prices'

export function loadSettings(): PriceSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: PriceSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function loadJob(): JobInput {
  try {
    const raw = localStorage.getItem(JOB_KEY)
    if (!raw) return DEFAULT_JOB
    return { ...DEFAULT_JOB, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_JOB
  }
}

export function saveJob(job: JobInput): void {
  localStorage.setItem(JOB_KEY, JSON.stringify(job))
}

export function loadSavedPrices(): SavedMetalPrice[] {
  try {
    const raw = localStorage.getItem(PRICES_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function saveSavedPrices(prices: SavedMetalPrice[]): void {
  localStorage.setItem(PRICES_KEY, JSON.stringify(prices))
}

export function encodeShareState(job: JobInput): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(job))))
}

export function decodeShareState(encoded: string): JobInput | null {
  try {
    const json = decodeURIComponent(escape(atob(encoded)))
    return { ...DEFAULT_JOB, ...JSON.parse(json) }
  } catch {
    return null
  }
}
