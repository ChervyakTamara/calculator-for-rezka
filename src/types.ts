export type Material = 'steel' | 'stainless' | 'aluminum' | 'brass' | 'copper'

export type GasType = 'auto' | 'o2' | 'n2' | 'air'

export interface MetalCoefficients {
  steel: number
  stainless: number
  aluminum: number
  brass: number
  copper: number
}

export interface PriceSettings {
  electricityKwh: number
  laserKw: number
  coolingKw: number
  exhaustKw: number
  compressorKw: number
  otherKw: number
  nozzleDiameter: number
  gasFlowCoef: number
  o2Price: number
  o2Pressure: number
  n2Price: number
  n2Pressure: number
  airPressure: number
  depreciationPerHour: number
  operatorPerHour: number
  operatorCoef: number
  markupPercent: number
  thinCoeffs: MetalCoefficients
  mediumCoeffs: MetalCoefficients
  thickCoeffs: MetalCoefficients
}

export interface JobInput {
  material: Material
  thickness: number
  gas: GasType
  cutLength: number
  cutSpeed: number
  partLength: number
  partWidth: number
  pierceCount: number
  partCount: number
  piercePrice: number
  layoutPrice: number
  metalPricePerM2: number
}

export interface CalculationResult {
  resolvedGas: Exclude<GasType, 'auto'>
  thicknessCoef: number
  cutTimeMin: number
  pierceTimeMin: number
  timePerPartMin: number
  totalTimeMin: number
  totalTimeHours: number
  materialCost: number
  electricityCost: number
  gasCost: number
  pierceCost: number
  layoutCost: number
  depreciationCost: number
  operatorCost: number
  subtotal: number
  markupAmount: number
  totalCost: number
  costPerPart: number
}

export interface SavedMetalPrice {
  id: string
  name: string
  price: number
  material: Material
  createdAt: number
}
