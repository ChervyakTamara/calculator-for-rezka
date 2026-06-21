import { useEffect, useState } from 'react'
import type { JobInput, PriceSettings, SavedMetalPrice } from './types'
import { CalculatorApp } from './components/CalculatorApp'
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
  const [job, setJob] = useState<JobInput>(() => {
    const params = new URLSearchParams(window.location.search)
    const shared = params.get('calc')
    if (shared) {
      const decoded = decodeShareState(shared)
      if (decoded) return decoded
    }
    return loadJob()
  })

  const [settings, setSettings] = useState<PriceSettings>(loadSettings)
  const [savedPrices, setSavedPrices] = useState<SavedMetalPrice[]>(loadSavedPrices)

  useEffect(() => {
    saveJob(job)
  }, [job])

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  useEffect(() => {
    saveSavedPrices(savedPrices)
  }, [savedPrices])

  const handleSaveMetalPrice = (name: string) => {
    const entry: SavedMetalPrice = {
      id: crypto.randomUUID(),
      name,
      price: job.metalPricePerM2,
      material: job.material,
      createdAt: Date.now(),
    }
    setSavedPrices((prev) => [...prev, entry])
  }

  const handleApplySavedPrice = (price: SavedMetalPrice) => {
    setJob((prev) => ({
      ...prev,
      metalPricePerM2: price.price,
      material: price.material,
    }))
  }

  return (
    <CalculatorApp
      job={job}
      settings={settings}
      savedPrices={savedPrices}
      onJobChange={setJob}
      onSettingsChange={setSettings}
      onSaveSettings={() => saveSettings(settings)}
      onSaveMetalPrice={handleSaveMetalPrice}
      onDeleteSavedPrice={(id) =>
        setSavedPrices((prev) => prev.filter((p) => p.id !== id))
      }
      onApplySavedPrice={handleApplySavedPrice}
    />
  )
}

export default App
