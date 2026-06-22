import { useCallback, useEffect, useRef, useState } from 'react'
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

const SYNC_INTERVAL_MS = 60_000

function App() {
  const sharedCalc = new URLSearchParams(window.location.search).get('calc')

  const [savingSettings, setSavingSettings] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [savingMetal, setSavingMetal] = useState(false)
  const [deletingMetal, setDeletingMetal] = useState(false)
  const [metalMessage, setMetalMessage] = useState<string | null>(null)
  const [metalError, setMetalError] = useState<string | null>(null)

  const [job, setJob] = useState<JobInput>(() => {
    const decoded = sharedCalc ? decodeShareState(sharedCalc) : null
    return decoded ?? loadJob()
  })
  const [settings, setSettings] = useState<PriceSettings>(loadSettings)
  const [savedPrices, setSavedPrices] = useState<SavedMetalPrice[]>(loadSavedPrices)

  const cloudEnabled = isCloudStorageEnabled
  const lastSyncRef = useRef(0)
  const syncingRef = useRef(false)

  const applySharedSettings = useCallback((data: Awaited<ReturnType<typeof loadSharedSettings>>) => {
    if (!data) return
    setSettings({ ...DEFAULT_SETTINGS, ...data.settings })
    setSavedPrices(data.metalPrices)
    saveSettings({ ...DEFAULT_SETTINGS, ...data.settings })
    saveSavedPrices(data.metalPrices)
    lastSyncRef.current = Date.now()
  }, [])

  const syncFromCloud = useCallback(async () => {
    if (!cloudEnabled || syncingRef.current) return

    syncingRef.current = true
    try {
      const data = await loadSharedSettings()
      applySharedSettings(data)
    } catch {
      /* оставляем локальную копию */
    } finally {
      syncingRef.current = false
    }
  }, [cloudEnabled, applySharedSettings])

  useEffect(() => {
    void syncFromCloud()
  }, [syncFromCloud])

  useEffect(() => {
    if (!cloudEnabled) return

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      if (Date.now() - lastSyncRef.current < SYNC_INTERVAL_MS) return
      void syncFromCloud()
    }

    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [cloudEnabled, syncFromCloud])

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
      lastSyncRef.current = Date.now()
      setSaveMessage('Настройки сохранены · видны на всех устройствах')
      setTimeout(() => setSaveMessage(null), 4000)
    } catch (err) {
      setSaveError(formatDbError(err))
    } finally {
      setSavingSettings(false)
    }
  }

  const handleSaveMetalPrice = async (name: string) => {
    const previous = savedPrices
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
      lastSyncRef.current = Date.now()
      setMetalMessage('Металл сохранён · виден на всех устройствах')
      setTimeout(() => setMetalMessage(null), 4000)
    } catch (err) {
      setSavedPrices(previous)
      saveSavedPrices(previous)
      setMetalError(formatDbError(err))
    } finally {
      setSavingMetal(false)
    }
  }

  const handleDeleteSavedPrice = async (id: string) => {
    const previous = savedPrices
    const next = previous.filter((p) => p.id !== id)

    setSavedPrices(next)
    saveSavedPrices(next)
    setMetalError(null)

    if (!cloudEnabled) {
      setMetalMessage('Металл удалён')
      setTimeout(() => setMetalMessage(null), 3000)
      return
    }

    setDeletingMetal(true)
    try {
      await saveSharedMetalPrices(next)
      lastSyncRef.current = Date.now()
      setMetalMessage('Металл удалён')
      setTimeout(() => setMetalMessage(null), 3000)
    } catch (err) {
      setSavedPrices(previous)
      saveSavedPrices(previous)
      setMetalError(formatDbError(err))
    } finally {
      setDeletingMetal(false)
    }
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
      deletingMetal={deletingMetal}
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
