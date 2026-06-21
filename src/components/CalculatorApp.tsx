import { useMemo, useState } from 'react'
import type { JobInput, SavedMetalPrice } from '../types'
import { calculateJob, formatMoney, formatNumber, formatTime } from '../lib/calculator'
import { GAS_LABELS, MATERIAL_LABELS } from '../lib/defaults'
import type { PriceSettings } from '../types'
import { encodeShareState } from '../lib/storage'
import { PriceSettingsPanel } from './PriceSettingsPanel'
import {
  Button,
  Card,
  Field,
  NumberInput,
  ResultRow,
  SelectInput,
  TextInput,
} from './ui'

interface Props {
  job: JobInput
  settings: PriceSettings
  savedPrices: SavedMetalPrice[]
  onJobChange: (job: JobInput) => void
  onSettingsChange: (settings: PriceSettings) => void
  onSaveSettings: () => void
  onSaveMetalPrice: (name: string) => void
  onDeleteSavedPrice: (id: string) => void
  onApplySavedPrice: (price: SavedMetalPrice) => void
}

export function CalculatorApp({
  job,
  settings,
  savedPrices,
  onJobChange,
  onSettingsChange,
  onSaveSettings,
  onSaveMetalPrice,
  onDeleteSavedPrice,
  onApplySavedPrice,
}: Props) {
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [metalName, setMetalName] = useState('')
  const [selectedPriceId, setSelectedPriceId] = useState('')
  const [shareCopied, setShareCopied] = useState(false)

  const result = useMemo(() => calculateJob(job, settings), [job, settings])

  const update = <K extends keyof JobInput>(key: K, value: JobInput[K]) => {
    onJobChange({ ...job, [key]: value })
  }

  const handleSaveSettings = () => {
    onSaveSettings()
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 2000)
  }

  const handleShare = async () => {
    const encoded = encodeShareState(job)
    const url = `${window.location.origin}${window.location.pathname}?calc=${encoded}`
    try {
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    } catch {
      window.prompt('Скопируйте ссылку на расчёт:', url)
    }
  }

  const handleInstallHint = () => {
    alert(
      'Чтобы установить как приложение на телефон:\n\n' +
        '• Android (Chrome): меню ⋮ → «Установить приложение» или «Добавить на главный экран»\n' +
        '• iPhone (Safari): Поделиться → «На экран Домой»',
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-4 px-4 py-5 pb-8 sm:px-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Калькулятор лазерной резки
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Расчёт времени и стоимости · работает офлайн
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleShare}>
            {shareCopied ? 'Ссылка скопирована' : 'Поделиться'}
          </Button>
          <Button variant="ghost" onClick={handleInstallHint}>
            📱 Установить
          </Button>
        </div>
      </header>

      <Card title="Параметры заказа">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Материал">
            <SelectInput
              value={job.material}
              onChange={(e) => update('material', e.target.value as JobInput['material'])}
            >
              {Object.entries(MATERIAL_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field label="Толщина, мм">
            <NumberInput
              step="0.1"
              min="0"
              value={job.thickness || ''}
              onChange={(e) => update('thickness', parseFloat(e.target.value) || 0)}
            />
          </Field>

          <Field label="Газ">
            <SelectInput
              value={job.gas}
              onChange={(e) => update('gas', e.target.value as JobInput['gas'])}
            >
              {Object.entries(GAS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field label="Длина реза, мм">
            <NumberInput
              step="1"
              min="0"
              value={job.cutLength || ''}
              onChange={(e) => update('cutLength', parseFloat(e.target.value) || 0)}
            />
          </Field>

          <Field label="Скорость реза, м/мин">
            <NumberInput
              step="0.1"
              min="0"
              value={job.cutSpeed || ''}
              onChange={(e) => update('cutSpeed', parseFloat(e.target.value) || 0)}
            />
          </Field>

          <Field label="Длина детали, мм">
            <NumberInput
              step="1"
              min="0"
              value={job.partLength || ''}
              onChange={(e) => update('partLength', parseFloat(e.target.value) || 0)}
            />
          </Field>

          <Field label="Ширина детали, мм">
            <NumberInput
              step="1"
              min="0"
              value={job.partWidth || ''}
              onChange={(e) => update('partWidth', parseFloat(e.target.value) || 0)}
            />
          </Field>

          <Field label="Кол-во врезок">
            <NumberInput
              step="1"
              min="0"
              value={job.pierceCount || ''}
              onChange={(e) => update('pierceCount', parseInt(e.target.value, 10) || 0)}
            />
          </Field>

          <Field label="Кол-во деталей">
            <NumberInput
              step="1"
              min="1"
              value={job.partCount || ''}
              onChange={(e) => update('partCount', parseInt(e.target.value, 10) || 1)}
            />
          </Field>

          <Field label="Цена врезки, ₽">
            <NumberInput
              step="1"
              min="0"
              value={job.piercePrice || ''}
              onChange={(e) => update('piercePrice', parseFloat(e.target.value) || 0)}
            />
          </Field>

          <Field label="Разработка макета, ₽">
            <NumberInput
              step="10"
              min="0"
              value={job.layoutPrice || ''}
              onChange={(e) => update('layoutPrice', parseFloat(e.target.value) || 0)}
            />
          </Field>

          <Field label="Коэф. оператора">
            <NumberInput
              step="0.1"
              min="0"
              value={job.operatorCoef || ''}
              onChange={(e) => update('operatorCoef', parseFloat(e.target.value) || 0)}
            />
          </Field>

          <Field label="Цена металла, ₽/м²">
            <div className="flex gap-2">
              <NumberInput
                step="10"
                min="0"
                value={job.metalPricePerM2 || ''}
                onChange={(e) => update('metalPricePerM2', parseFloat(e.target.value) || 0)}
              />
              <Button variant="secondary" onClick={() => setShowSaveModal(true)}>
                Сохранить
              </Button>
            </div>
          </Field>

          <Field label="Сохранённые цены">
            <div className="flex gap-2">
              <SelectInput
                value={selectedPriceId}
                onChange={(e) => {
                  const id = e.target.value
                  setSelectedPriceId(id)
                  const found = savedPrices.find((p) => p.id === id)
                  if (found) onApplySavedPrice(found)
                }}
              >
                <option value="">— выбрать —</option>
                {savedPrices.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({formatMoney(p.price)})
                  </option>
                ))}
              </SelectInput>
              <Button
                variant="danger"
                disabled={!selectedPriceId}
                onClick={() => {
                  if (selectedPriceId) {
                    onDeleteSavedPrice(selectedPriceId)
                    setSelectedPriceId('')
                  }
                }}
              >
                Удалить
              </Button>
            </div>
          </Field>
        </div>
      </Card>

      <PriceSettingsPanel
        settings={settings}
        onChange={onSettingsChange}
        onSave={handleSaveSettings}
        saved={settingsSaved}
      />

      <Card title="Расчёт лазерной резки">
        <div className="space-y-2">
          <ResultRow label="Газ (расчётный)" value={GAS_LABELS[result.resolvedGas]} />
          <ResultRow
            label="Коэф. по толщине"
            value={formatNumber(result.thicknessCoef, 3)}
          />
          <ResultRow label="Время на 1 деталь" value={formatTime(result.timePerPartMin)} />
          <ResultRow label="Общее время" value={formatTime(result.totalTimeMin)} />
        </div>

        <div className="mt-4 border-t border-slate-700/60 pt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            Стоимость
          </p>
          <div className="space-y-2">
            <ResultRow label="Металл" value={formatMoney(result.materialCost)} />
            <ResultRow label="Электроэнергия" value={formatMoney(result.electricityCost)} />
            <ResultRow label="Газ" value={formatMoney(result.gasCost)} />
            <ResultRow label="Врезки" value={formatMoney(result.pierceCost)} />
            <ResultRow label="Разработка макета" value={formatMoney(result.layoutCost)} />
            <ResultRow label="Амортизация" value={formatMoney(result.depreciationCost)} />
            <ResultRow label="Оператор" value={formatMoney(result.operatorCost)} />
            <ResultRow label="Подитог" value={formatMoney(result.subtotal)} />
            <ResultRow
              label={`Наценка (${settings.markupPercent}%)`}
              value={formatMoney(result.markupAmount)}
            />
            <ResultRow label="Итого" value={formatMoney(result.totalCost)} highlight />
            <ResultRow label="За 1 деталь" value={formatMoney(result.costPerPart)} highlight />
          </div>
        </div>
      </Card>

      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-slate-600 bg-slate-900 p-5 shadow-2xl">
            <h3 className="mb-3 text-lg font-semibold">Название марки металла</h3>
            <TextInput
              autoFocus
              placeholder="Например: Ст3 3мм"
              value={metalName}
              onChange={(e) => setMetalName(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowSaveModal(false)}>
                Отмена
              </Button>
              <Button
                onClick={() => {
                  if (metalName.trim()) {
                    onSaveMetalPrice(metalName.trim())
                    setMetalName('')
                    setShowSaveModal(false)
                  }
                }}
              >
                Сохранить
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
