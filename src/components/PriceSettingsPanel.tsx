import type { PriceSettings } from '../types'
import { MetalCoefficientsEditor } from './MetalCoefficientsEditor'
import { Button, Field, NumberInput, Section, SubsectionTitle } from './ui'

interface Props {
  settings: PriceSettings
  onChange: (settings: PriceSettings) => void
  onSave: () => void
  saving?: boolean
  message?: string | null
  error?: string | null
  cloudConnected?: boolean
}

export function PriceSettingsPanel({
  settings,
  onChange,
  onSave,
  saving = false,
  message = null,
  error = null,
  cloudConnected = false,
}: Props) {
  const update = <K extends keyof PriceSettings>(key: K, value: PriceSettings[K]) => {
    onChange({ ...settings, [key]: value })
  }

  return (
    <Section title="Настройки цен">
      <div className="space-y-5">
        <div>
          <SubsectionTitle>Электроэнергия</SubsectionTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="Цена кВт·ч, ₽">
              <NumberInput
                step="0.1"
                value={settings.electricityKwh}
                onChange={(e) => update('electricityKwh', parseFloat(e.target.value) || 0)}
              />
            </Field>
            <Field label="Лазер, кВт">
              <NumberInput
                step="0.1"
                value={settings.laserKw}
                onChange={(e) => update('laserKw', parseFloat(e.target.value) || 0)}
              />
            </Field>
            <Field label="Охлаждение, кВт">
              <NumberInput
                step="0.1"
                value={settings.coolingKw}
                onChange={(e) => update('coolingKw', parseFloat(e.target.value) || 0)}
              />
            </Field>
            <Field label="Вытяжка, кВт">
              <NumberInput
                step="0.1"
                value={settings.exhaustKw}
                onChange={(e) => update('exhaustKw', parseFloat(e.target.value) || 0)}
              />
            </Field>
            <Field label="Компрессор, кВт">
              <NumberInput
                step="0.1"
                value={settings.compressorKw}
                onChange={(e) => update('compressorKw', parseFloat(e.target.value) || 0)}
              />
            </Field>
            <Field label="Прочее, кВт">
              <NumberInput
                step="0.1"
                value={settings.otherKw}
                onChange={(e) => update('otherKw', parseFloat(e.target.value) || 0)}
              />
            </Field>
          </div>
        </div>

        <div>
          <SubsectionTitle>Газ — общие параметры</SubsectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ø сопла, мм">
              <NumberInput
                step="0.1"
                value={settings.nozzleDiameter}
                onChange={(e) => update('nozzleDiameter', parseFloat(e.target.value) || 0)}
              />
            </Field>
            <Field label="Коэф. расхода">
              <NumberInput
                step="0.01"
                value={settings.gasFlowCoef}
                onChange={(e) => update('gasFlowCoef', parseFloat(e.target.value) || 0)}
              />
            </Field>
          </div>
        </div>

        <div>
          <SubsectionTitle>Газ O₂</SubsectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Цена, ₽/м³">
              <NumberInput
                step="1"
                value={settings.o2Price}
                onChange={(e) => update('o2Price', parseFloat(e.target.value) || 0)}
              />
            </Field>
            <Field label="Давление, бар">
              <NumberInput
                step="0.1"
                value={settings.o2Pressure}
                onChange={(e) => update('o2Pressure', parseFloat(e.target.value) || 0)}
              />
            </Field>
          </div>
        </div>

        <div>
          <SubsectionTitle>Газ N₂</SubsectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Цена, ₽/м³">
              <NumberInput
                step="1"
                value={settings.n2Price}
                onChange={(e) => update('n2Price', parseFloat(e.target.value) || 0)}
              />
            </Field>
            <Field label="Давление, бар">
              <NumberInput
                step="0.1"
                value={settings.n2Pressure}
                onChange={(e) => update('n2Pressure', parseFloat(e.target.value) || 0)}
              />
            </Field>
          </div>
        </div>

        <div>
          <SubsectionTitle>Воздух</SubsectionTitle>
          <Field label="Давление, бар">
            <NumberInput
              step="0.1"
              value={settings.airPressure}
              onChange={(e) => update('airPressure', parseFloat(e.target.value) || 0)}
            />
          </Field>
        </div>

        <div>
          <SubsectionTitle>Прочие расходы</SubsectionTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="Амортизация, ₽/час">
              <NumberInput
                step="10"
                value={settings.depreciationPerHour}
                onChange={(e) =>
                  update('depreciationPerHour', parseFloat(e.target.value) || 0)
                }
              />
            </Field>
            <Field label="Оператор, ₽/час">
              <NumberInput
                step="10"
                value={settings.operatorPerHour}
                onChange={(e) => update('operatorPerHour', parseFloat(e.target.value) || 0)}
              />
            </Field>
            <Field label="Наценка, %">
              <NumberInput
                step="1"
                value={settings.markupPercent}
                onChange={(e) => update('markupPercent', parseFloat(e.target.value) || 0)}
              />
            </Field>
          </div>
        </div>

        <div>
          <SubsectionTitle>Коэффициент стоимости по металлам</SubsectionTitle>
          <MetalCoefficientsEditor
            thin={settings.thinCoeffs}
            medium={settings.mediumCoeffs}
            thick={settings.thickCoeffs}
            onChange={(key, value) => update(key, value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={onSave} disabled={saving}>
            {saving ? 'Сохранение…' : 'Сохранить настройки'}
          </Button>
          {cloudConnected ? (
            <span className="text-[10px] uppercase tracking-wider text-neutral-500">
              Облако Vercel
            </span>
          ) : (
            <span className="text-[10px] uppercase tracking-wider text-amber-700">
              Только на этом устройстве
            </span>
          )}
          {message && (
            <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-600">
              {message}
            </span>
          )}
          {error && (
            <span className="text-[11px] font-semibold uppercase tracking-wide text-red-700">
              {error}
            </span>
          )}
        </div>
      </div>
    </Section>
  )
}
