import type { JobInput, Material, PriceSettings } from '../types'

export const MATERIAL_LABELS: Record<Material, string> = {
  steel: 'Сталь',
  stainless: 'Нержавейка',
  aluminum: 'Алюминий',
  brass: 'Латунь',
  copper: 'Медь',
}

export const GAS_LABELS = {
  auto: 'Авто (по материалу)',
  o2: 'O₂ — кислород',
  n2: 'N₂ — азот',
  air: 'Воздух',
} as const

export const DEFAULT_SETTINGS: PriceSettings = {
  electricityKwh: 7.5,
  laserKw: 6,
  coolingKw: 3,
  exhaustKw: 1.5,
  compressorKw: 4,
  otherKw: 0.5,
  nozzleDiameter: 1.5,
  gasFlowCoef: 0.85,
  o2Price: 45,
  o2Pressure: 1.2,
  n2Price: 35,
  n2Pressure: 12,
  airPressure: 16,
  depreciationPerHour: 800,
  operatorPerHour: 450,
  operatorCoef: 1,
  markupPercent: 25,
  thinCoeffs: {
    steel: 1,
    stainless: 1.15,
    aluminum: 1.2,
    brass: 1.35,
    copper: 1.4,
  },
  mediumCoeffs: {
    steel: 1.1,
    stainless: 1.25,
    aluminum: 1.35,
    brass: 1.5,
    copper: 1.55,
  },
  thickCoeffs: {
    steel: 1.25,
    stainless: 1.4,
    aluminum: 1.5,
    brass: 1.65,
    copper: 1.7,
  },
}

export const DEFAULT_JOB: JobInput = {
  material: 'steel',
  thickness: 3,
  gas: 'auto',
  cutLength: 500,
  cutSpeed: 3,
  partLength: 100,
  partWidth: 80,
  pierceCount: 4,
  partCount: 10,
  piercePrice: 15,
  layoutPrice: 500,
  metalPricePerM2: 8500,
}
