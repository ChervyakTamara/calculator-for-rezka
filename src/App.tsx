import { useCallback, useEffect, useState } from 'react'
import type { JobInput, PriceSettings, SavedMetalPrice } from './types'
import { CalculatorApp } from './components/CalculatorApp'
import {
  formatDbError,
  isCloudStorageEnabled,
  loadSharedSettings,
  saveSharedMetalPrices,
  saveSharedPriceSettings,
} from './lib/cloudStorage'
import { DEFAULT_SETTINGS } from './lib/defaults'
import {
  decodeShareState,
  loadJob,
  loadSavedPrices,
  loadSettings,
  saveJob,
  saveSavedPrices,
  saveSettings,
} from './lib/storage'

function App() {
  const sharedCalc = new URLSearchParams(window.location.search).get('calc')

  const [ready, setReady] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [savingMetal, setSavingMetal] = useState(false)
  const [metalMessage, setMetalMessage] = useState<string | null>(null)
  const [metalError, setMetalError] = useState<string | null>(null)

  const [job, setJob] = useState<JobInput>(() => {
    const decoded = sharedCalc ? decodeShareState(sharedCalc) : null
    return decoded ?? loadJob()
  })
  const [settings, setSettings] = useState<PriceSettings>(loadSettings)
  const [savedPrices, setSavedPrices] = useState<SavedMetalPrice[]>(loadSavedPrices)

  const cloudEnabled = isCloudStorageEnabled

  const applySharedSettings = useCallback((data: Awaited<ReturnType<typeof loadSharedSettings>>) => {
    if (!data) return
    setSettings({ ...DEFAULT_SETTINGS, ...data.settings })
    setSavedPrices(data.metalPrices)
    saveSettings({ ...DEFAULT_SETTINGS, ...data.settings })
    saveSavedPrices(data.metalPrices)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function init() {
      if (!cloudEnabled) {
        if (!cancelled) setReady(true)
        return
      }

      try {
        const data = await loadSharedSettings()
        if (!cancelled && data) applySharedSettings(data)
      } catch {
        /* локальная копия уже загружена */
      } finally {
        if (!cancelled) setReady(true)
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [cloudEnabled, applySharedSettings])

  useEffect(() => {
    if (!cloudEnabled || !ready) return

    const refresh = async () => {
      try {
        const data = await loadSharedSettings()
        applySharedSettings(data)
      } catch {
        /* ignore */
      }
    }

    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [cloudEnabled, ready, applySharedSettings])

  useEffect(() => {
    saveJob(job)
  }, [job])

  const handleSaveSettings = async () => {
    saveSettings(settings)
    setSaveError(null)

    if (!cloudEnabled) {
      setSaveMessage('Только на этом устройстве (облако не подключено)')
      setTimeout(() => setSaveMessage(null), 4000)
      return
    }

    setSavingSettings(true)
    try {
      await saveSharedPriceSettings(settings)
      setSaveMessage('Настройки сохранены · видны на всех устройствах')
      setTimeout(() => setSaveMessage(null), 4000)
    } catch (err) {
      setSaveError(formatDbError(err))
    } finally {
      setSavingSettings(false)
    }
  }

  const handleSaveMetalPrice = async (name: string) => {
    const entry: SavedMetalPrice = {
      id: crypto.randomUUID(),
      name,
      price: job.metalPricePerM2,
      material: job.material,
      createdAt: Date.now(),
    }
    const next = [...savedPrices, entry]
    setSavedPrices(next)
    saveSavedPrices(next)
    setMetalError(null)

    if (!cloudEnabled) {
      setMetalMessage('Металл сохранён на этом устройстве')
      setTimeout(() => setMetalMessage(null), 4000)
      return
    }

    setSavingMetal(true)
    try {
      await saveSharedMetalPrices(next)
      setMetalMessage('Металл сохранён · виден на всех устройствах')
      setTimeout(() => setMetalMessage(null), 4000)
    } catch (err) {
      setMetalError(formatDbError(err))
    } finally {
      setSavingMetal(false)
    }
  }

  const handleDeleteSavedPrice = async (id: string) => {
    const next = savedPrices.filter((p) => p.id !== id)
    setSavedPrices(next)
    saveSavedPrices(next)
    setMetalError(null)

    if (!cloudEnabled) return

    try {
      await saveSharedMetalPrices(next)
      setMetalMessage('Список металлов обновлён')
      setTimeout(() => setMetalMessage(null), 3000)
    } catch (err) {
      setMetalError(formatDbError(err))
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-neutral-200 text-sm uppercase tracking-wider text-neutral-600">
        Загрузка…
      </div>
    )
  }

  return (
    <CalculatorApp
      job={job}
      settings={settings}
      savedPrices={savedPrices}
      onJobChange={setJob}
      onSettingsChange={setSettings}
      onSaveSettings={handleSaveSettings}
      savingSettings={savingSettings}
      saveSettingsMessage={saveMessage}
      saveSettingsError={saveError}
      cloudConnected={cloudEnabled}
      onSaveMetalPrice={handleSaveMetalPrice}
      savingMetal={savingMetal}
      metalSaveMessage={metalMessage}
      metalSaveError={metalError}
      onDeleteSavedPrice={handleDeleteSavedPrice}
      onApplySavedPrice={(price) => {
        setJob((prev) => ({
          ...prev,
          metalPricePerM2: price.price,
          material: price.material,
        }))
      }}
    />
  )
}

export default App
