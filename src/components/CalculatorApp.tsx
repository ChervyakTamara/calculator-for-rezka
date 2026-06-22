import { useMemo, useState } from 'react'
import type { JobInput, SavedMetalPrice } from '../types'
import { calculateJob, formatMoney, formatNumber, formatTime } from '../lib/calculator'
import { GAS_LABELS, MATERIAL_LABELS } from '../lib/defaults'
import type { PriceSettings } from '../types'
import { encodeShareState } from '../lib/storage'
import { downloadCalculationPdf } from '../lib/exportPdf'
import { PriceSettingsPanel } from './PriceSettingsPanel'
import {
  Button,
  Card,
  Field,
  FormGrid,
  NumberInput,
  ResultRow,
  ResultTable,
  SelectInput,
  TextInput,
} from './ui'

interface Props {
  job: JobInput
  settings: PriceSettings
  savedPrices: SavedMetalPrice[]
  onJobChange: (job: JobInput) => void
  onSettingsChange: (settings: PriceSettings) => void
  onSaveSettings: () => void | Promise<void>
  savingSettings?: boolean
  saveSettingsMessage?: string | null
  saveSettingsError?: string | null
  cloudConnected?: boolean
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
  savingSettings = false,
  saveSettingsMessage = null,
  saveSettingsError = null,
  cloudConnected = false,
  onSaveMetalPrice,
  onDeleteSavedPrice,
  onApplySavedPrice,
}: Props) {
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [metalName, setMetalName] = useState('')
  const [selectedPriceId, setSelectedPriceId] = useState('')
  const [shareCopied, setShareCopied] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  const result = useMemo(() => calculateJob(job, settings), [job, settings])

  const update = <K extends keyof JobInput>(key: K, value: JobInput[K]) => {
    onJobChange({ ...job, [key]: value })
  }

  const handleSaveSettings = () => {
    void onSaveSettings()
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
      'Установка на телефон:\n\n' +
        'Android (Chrome): меню → «Установить приложение»\n' +
        'iPhone (Safari): Поделиться → «На экран Домой»',
    )
  }

  const handleDownloadPdf = async () => {
    setPdfLoading(true)
    try {
      await downloadCalculationPdf(job, settings, result)
    } catch {
      alert('Не удалось сформировать PDF. Попробуйте ещё раз.')
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col">
      <header className="border-b-2 border-neutral-900 bg-neutral-900 px-4 py-3 text-white sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
              Laser Calc
            </p>
            <h1 className="mt-0.5 text-base font-semibold uppercase tracking-wide sm:text-lg">
              Калькулятор лазерной резки
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="!border-neutral-600 !bg-neutral-800 !text-white hover:!bg-neutral-700"
              onClick={handleShare}
            >
              {shareCopied ? 'Скопировано' : 'Поделиться'}
            </Button>
            <Button
              variant="ghost"
              className="!text-neutral-300 hover:!text-white"
              onClick={handleInstallHint}
            >
              Установить
            </Button>
          </div>
        </div>
      </header>

      <main className="flex flex-col gap-px bg-neutral-400 p-px sm:gap-0 sm:bg-neutral-400 sm:p-4 sm:pt-5">
        <Card title="Параметры заказа">
          <FormGrid>
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
                  Сохр.
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
                  Удал.
                </Button>
              </div>
            </Field>
          </FormGrid>
        </Card>

        <div className="mt-4">
          <PriceSettingsPanel
            settings={settings}
            onChange={onSettingsChange}
            onSave={handleSaveSettings}
            saving={savingSettings}
            message={saveSettingsMessage}
            error={saveSettingsError}
            cloudConnected={cloudConnected}
          />
        </div>

        <Card
          title="Расчёт лазерной резки"
          className="mt-4"
          actions={
            <Button variant="secondary" disabled={pdfLoading} onClick={handleDownloadPdf}>
              {pdfLoading ? 'Формирование…' : 'PDF'}
            </Button>
          }
        >
          <ResultTable>
            <ResultRow label="Газ (расчётный)" value={GAS_LABELS[result.resolvedGas]} />
            <ResultRow
              label="Коэф. по толщине"
              value={formatNumber(result.thicknessCoef, 3)}
            />
            <ResultRow label="Время на 1 деталь" value={formatTime(result.timePerPartMin)} />
            <ResultRow label="Общее время" value={formatTime(result.totalTimeMin)} />
          </ResultTable>

          <div className="mt-4 border-t border-neutral-300 pt-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
              Стоимость
            </p>
            <ResultTable>
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
              <ResultRow label="Итого" value={formatMoney(result.totalCost)} total />
              <ResultRow label="За 1 деталь" value={formatMoney(result.costPerPart)} highlight />
            </ResultTable>
          </div>
        </Card>
      </main>

      <footer className="hidden" aria-hidden />

      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-md border-2 border-neutral-900 bg-white p-5">
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-800">
              Название марки металла
            </h3>
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
