import type { CalculationResult, JobInput, PriceSettings } from '../types'
import { formatMoney, formatNumber, formatTime } from './calculator'
import { GAS_LABELS, MATERIAL_LABELS } from './defaults'

function row(label: string, value: string, bold = false) {
  return [
    { text: label, style: 'label' },
    { text: value, style: bold ? 'valueBold' : 'value' },
  ]
}

function formatDate(): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())
}

function fileNameDate(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export async function downloadCalculationPdf(
  job: JobInput,
  settings: PriceSettings,
  result: CalculationResult,
): Promise<void> {
  const [{ default: pdfMake }, { default: pdfFonts }] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ])

  pdfMake.addVirtualFileSystem(pdfFonts)

  const gasInput = job.gas === 'auto' ? GAS_LABELS.auto : GAS_LABELS[job.gas]

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 48, 40, 48],
    content: [
      { text: 'РАСЧЁТ ЛАЗЕРНОЙ РЕЗКИ', style: 'title' },
      { text: `Дата формирования: ${formatDate()}`, style: 'meta', margin: [0, 4, 0, 16] },

      { text: 'ПАРАМЕТРЫ ЗАКАЗА', style: 'section' },
      {
        table: {
          widths: ['*', '*'],
          body: [
            row('Материал', MATERIAL_LABELS[job.material]),
            row('Толщина', `${formatNumber(job.thickness, 1)} мм`),
            row('Газ', gasInput),
            row('Длина реза', `${formatNumber(job.cutLength, 0)} мм`),
            row('Скорость реза', `${formatNumber(job.cutSpeed, 2)} м/мин`),
            row('Длина детали', `${formatNumber(job.partLength, 0)} мм`),
            row('Ширина детали', `${formatNumber(job.partWidth, 0)} мм`),
            row('Кол-во врезок', String(job.pierceCount)),
            row('Кол-во деталей', String(job.partCount)),
            row('Цена врезки', formatMoney(job.piercePrice)),
            row('Разработка макета', formatMoney(job.layoutPrice)),
            row('Коэф. оператора', formatNumber(settings.operatorCoef, 2)),
            row('Цена металла', `${formatMoney(job.metalPricePerM2)}/м²`),
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 12],
      },

      { text: 'ВРЕМЯ', style: 'section' },
      {
        table: {
          widths: ['*', '*'],
          body: [
            row('Газ (расчётный)', GAS_LABELS[result.resolvedGas]),
            row('Коэф. по толщине', formatNumber(result.thicknessCoef, 3)),
            row('Время на 1 деталь', formatTime(result.timePerPartMin)),
            row('Общее время', formatTime(result.totalTimeMin), true),
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 12],
      },

      { text: 'СТОИМОСТЬ', style: 'section' },
      {
        table: {
          widths: ['*', '*'],
          body: [
            row('Металл', formatMoney(result.materialCost)),
            row('Электроэнергия', formatMoney(result.electricityCost)),
            row('Газ', formatMoney(result.gasCost)),
            row('Врезки', formatMoney(result.pierceCost)),
            row('Разработка макета', formatMoney(result.layoutCost)),
            row('Амортизация', formatMoney(result.depreciationCost)),
            row('Оператор', formatMoney(result.operatorCost)),
            row('Подитог', formatMoney(result.subtotal)),
            row(`Наценка (${settings.markupPercent}%)`, formatMoney(result.markupAmount)),
            row('ИТОГО', formatMoney(result.totalCost), true),
            row('За 1 деталь', formatMoney(result.costPerPart), true),
          ],
        },
        layout: 'lightHorizontalLines',
      },

      {
        text: 'Документ сформирован калькулятором лазерной резки',
        style: 'footer',
        margin: [0, 24, 0, 0],
      },
    ],
    styles: {
      title: { fontSize: 14, bold: true, alignment: 'center', characterSpacing: 0.5 },
      meta: { fontSize: 8, color: '#616161', alignment: 'center' },
      section: { fontSize: 9, bold: true, margin: [0, 0, 0, 6], characterSpacing: 0.8 },
      label: { fontSize: 9, color: '#424242' },
      value: { fontSize: 9, alignment: 'right' },
      valueBold: { fontSize: 9, bold: true, alignment: 'right' },
      footer: { fontSize: 7, color: '#9e9e9e', alignment: 'center', italics: true },
    },
    defaultStyle: {
      font: 'Roboto',
      fontSize: 9,
    },
  }

  await pdfMake.createPdf(docDefinition).download(`raschet-lazernoj-rezki-${fileNameDate()}.pdf`)
}
