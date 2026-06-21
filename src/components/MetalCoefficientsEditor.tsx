import type { Material, MetalCoefficients } from '../types'
import { MATERIAL_LABELS } from '../lib/defaults'
import { Field, NumberInput } from './ui'

const MATERIALS: Material[] = ['steel', 'stainless', 'aluminum', 'brass', 'copper']

interface Props {
  thin: MetalCoefficients
  medium: MetalCoefficients
  thick: MetalCoefficients
  onChange: (key: 'thinCoeffs' | 'mediumCoeffs' | 'thickCoeffs', value: MetalCoefficients) => void
}

function CoefTable({
  title,
  coeffs,
  onUpdate,
}: {
  title: string
  coeffs: MetalCoefficients
  onUpdate: (value: MetalCoefficients) => void
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">{title}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {MATERIALS.map((m) => (
          <Field key={m} label={MATERIAL_LABELS[m]}>
            <NumberInput
              step="0.01"
              min="0"
              value={coeffs[m]}
              onChange={(e) =>
                onUpdate({ ...coeffs, [m]: parseFloat(e.target.value) || 0 })
              }
            />
          </Field>
        ))}
      </div>
    </div>
  )
}

export function MetalCoefficientsEditor({ thin, medium, thick, onChange }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        Между диапазонами (3–4 и 6–10 мм) коэффициент меняется плавно.
      </p>
      <CoefTable
        title="Тонкая ≤3 мм"
        coeffs={thin}
        onUpdate={(v) => onChange('thinCoeffs', v)}
      />
      <CoefTable
        title="Средняя 4–6 мм"
        coeffs={medium}
        onUpdate={(v) => onChange('mediumCoeffs', v)}
      />
      <CoefTable
        title="Толстая ≥10 мм"
        coeffs={thick}
        onUpdate={(v) => onChange('thickCoeffs', v)}
      />
    </div>
  )
}
