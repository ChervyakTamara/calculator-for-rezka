import { useCallback, useEffect, useState } from 'react'
import type { JobInput, PriceSettings, SavedMetalPrice } from './types'
import { CalculatorApp } from './components/CalculatorApp'
import {
  formatDbError,
  isCloudStorageEnabled,
  loadSharedSettings,
  saveSharedSettings,
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

  useEffect(() => {
    saveSavedPrices(savedPrices)
  }, [savedPrices])

  const handleSaveSettings = async () => {
    saveSettings(settings)
    saveSavedPrices(savedPrices)
    setSaveError(null)

    if (!cloudEnabled) {
      setSaveMessage('Только на этом устройстве (облако не подключено)')
      setTimeout(() => setSaveMessage(null), 4000)
      return
    }

    setSavingSettings(true)
    try {
      await saveSharedSettings(settings, savedPrices)
      setSaveMessage('Сохранено · видно на всех устройствах')
      setTimeout(() => setSaveMessage(null), 4000)
    } catch (err) {
      setSaveError(formatDbError(err))
    } finally {
      setSavingSettings(false)
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
      onSaveMetalPrice={(name) => {
        setSavedPrices((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            name,
            price: job.metalPricePerM2,
            material: job.material,
            createdAt: Date.now(),
          },
        ])
      }}
      onDeleteSavedPrice={(id) => setSavedPrices((prev) => prev.filter((p) => p.id !== id))}
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
