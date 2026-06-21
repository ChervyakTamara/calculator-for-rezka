import type {
  CalculationResult,
  GasType,
  JobInput,
  Material,
  MetalCoefficients,
  PriceSettings,
} from '../types'

const PIERCE_TIME_SEC = 2.5

export function resolveGas(material: Material, gas: GasType): Exclude<GasType, 'auto'> {
  if (gas !== 'auto') return gas

  switch (material) {
    case 'steel':
      return 'o2'
    case 'stainless':
    case 'aluminum':
    case 'brass':
    case 'copper':
      return 'n2'
    default:
      return 'o2'
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function getMaterialCoef(coeffs: MetalCoefficients, material: Material): number {
  return coeffs[material]
}

/** Плавная интерполяция коэффициента между диапазонами толщины */
export function getThicknessCoefficient(
  thickness: number,
  material: Material,
  settings: PriceSettings,
): number {
  const thin = getMaterialCoef(settings.thinCoeffs, material)
  const medium = getMaterialCoef(settings.mediumCoeffs, material)
  const thick = getMaterialCoef(settings.thickCoeffs, material)

  if (thickness <= 3) return thin
  if (thickness >= 10) return thick

  if (thickness <= 4) {
    const t = (thickness - 3) / 1
    return lerp(thin, medium, t)
  }

  if (thickness <= 6) return medium

  const t = (thickness - 6) / 4
  return lerp(medium, thick, t)
}

function getGasPressure(gas: Exclude<GasType, 'auto'>, settings: PriceSettings): number {
  switch (gas) {
    case 'o2':
      return settings.o2Pressure
    case 'n2':
      return settings.n2Pressure
    case 'air':
      return settings.airPressure
  }
}

function getGasPrice(gas: Exclude<GasType, 'auto'>, settings: PriceSettings): number {
  switch (gas) {
    case 'o2':
      return settings.o2Price
    case 'n2':
      return settings.n2Price
    case 'air':
      return 0
  }
}

/** Расход газа, м³/ч — упрощённая модель по соплу и давлению */
function getGasFlowM3PerHour(
  gas: Exclude<GasType, 'auto'>,
  settings: PriceSettings,
): number {
  const pressure = getGasPressure(gas, settings)
  const d = settings.nozzleDiameter
  const k = settings.gasFlowCoef

  if (gas === 'air') {
    return k * d * d * pressure * 0.35
  }

  return k * d * d * Math.sqrt(pressure) * 0.28
}

export function calculateJob(job: JobInput, settings: PriceSettings): CalculationResult {
  const resolvedGas = resolveGas(job.material, job.gas)
  const thicknessCoef = getThicknessCoefficient(job.thickness, job.material, settings)

  const cutTimeMin =
    job.cutSpeed > 0 ? job.cutLength / 1000 / job.cutSpeed : 0

  const pierceTimeMin = (job.pierceCount * PIERCE_TIME_SEC) / 60
  const timePerPartMin = cutTimeMin + pierceTimeMin
  const totalTimeMin = timePerPartMin * job.partCount
  const totalTimeHours = totalTimeMin / 60

  const areaPerPartM2 = (job.partLength * job.partWidth) / 1_000_000
  const totalAreaM2 = areaPerPartM2 * job.partCount
  const materialCost = totalAreaM2 * job.metalPricePerM2 * thicknessCoef

  const totalPowerKw =
    settings.laserKw +
    settings.coolingKw +
    settings.exhaustKw +
    settings.compressorKw +
    settings.otherKw

  const electricityCost = totalPowerKw * totalTimeHours * settings.electricityKwh

  const gasFlow = getGasFlowM3PerHour(resolvedGas, settings)
  const gasPrice = getGasPrice(resolvedGas, settings)
  const gasCost = gasFlow * totalTimeHours * gasPrice

  const pierceCost = job.pierceCount * job.piercePrice * job.partCount
  const layoutCost = job.layoutPrice
  const depreciationCost = settings.depreciationPerHour * totalTimeHours
  const operatorCost =
    settings.operatorPerHour * totalTimeHours * job.operatorCoef

  const subtotal =
    materialCost +
    electricityCost +
    gasCost +
    pierceCost +
    layoutCost +
    depreciationCost +
    operatorCost

  const markupAmount = subtotal * (settings.markupPercent / 100)
  const totalCost = subtotal + markupAmount
  const costPerPart = job.partCount > 0 ? totalCost / job.partCount : 0

  return {
    resolvedGas,
    thicknessCoef,
    cutTimeMin,
    pierceTimeMin,
    timePerPartMin,
    totalTimeMin,
    totalTimeHours,
    materialCost,
    electricityCost,
    gasCost,
    pierceCost,
    layoutCost,
    depreciationCost,
    operatorCost,
    subtotal,
    markupAmount,
    totalCost,
    costPerPart,
  }
}

export function formatTime(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '—'

  const h = Math.floor(minutes / 60)
  const m = Math.floor(minutes % 60)
  const s = Math.round((minutes % 1) * 60)

  if (h > 0) return `${h} ч ${m} мин`
  if (m > 0) return s > 0 ? `${m} мин ${s} с` : `${m} мин`
  return `${s} с`
}

export function formatMoney(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: digits,
  }).format(value)
}
