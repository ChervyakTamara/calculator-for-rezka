import { useRef, useState } from 'react'
import type { JobInput } from '../types'
import type { ImportedPart } from '../lib/dxf'

const columns = [
  ['thickness', 'Толщина, мм'], ['partLength', 'Длина, мм'], ['partWidth', 'Ширина, мм'],
  ['partCount', 'Деталей, шт.'], ['cutLength', 'Рез на деталь, мм'], ['pierceCount', 'Врезок на деталь'],
] as const
export function DxfImport({ job, onChange }: { job: JobInput; onChange: (job: JobInput) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const busy = useRef(false)
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [parts, setParts] = useState<ImportedPart[]>([])
  const [selected, setSelected] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const apply = (part: ImportedPart) => {
    const { thickness, partLength, partWidth, partCount, cutLength, pierceCount } = part
    onChange({ ...job, thickness, partLength, partWidth, partCount, cutLength, pierceCount })
    setSelected(part.id)
  }
  async function load(files: File[]) {
    if (!files.length || busy.current) return
    if (files.length > 50 || files.reduce((sum, f) => sum + f.size, 0) > 50 * 1024 * 1024) {
      setErrors(['За один раз можно загрузить до 50 файлов общим размером до 50 МБ.']); return
    }
    busy.current = true; setLoading(true); setErrors([])
    const next: ImportedPart[] = [], failures: string[] = []
    try {
      const { parseDxf } = await import('../lib/dxf')
      for (const file of files) {
        try {
          if (!/\.dxf$/i.test(file.name)) throw new Error('Нужен файл .dxf.')
          if (file.size > 10 * 1024 * 1024) throw new Error('Размер больше 10 МБ.')
          next.push(parseDxf(await file.text(), file.name))
        } catch (error) { failures.push(`${file.name}: ${error instanceof Error ? error.message : 'Ошибка чтения.'}`) }
        await new Promise(resolve => setTimeout(resolve, 0))
      }
      if (next.length) { setParts(next); apply(next[0]) }
      setErrors(failures)
    } catch { setErrors(['Не удалось загрузить модуль DXF. Попробуйте снова.']) }
    finally { setLoading(false); busy.current = false; if (input.current) input.current.value = '' }
  }
  function edit(part: ImportedPart, key: typeof columns[number][0], raw: string) {
    const value = Number(raw)
    if (!Number.isFinite(value) || value < 0) return
    const next = { ...part, [key]: key === 'partCount' ? Math.max(1, Math.floor(value)) : key === 'pierceCount' ? Math.floor(value) : value }
    setParts(previous => previous.map(p => p.id === next.id ? next : p))
    if (selected === part.id) apply(next)
  }
  return <section className="mb-4 border border-neutral-300 bg-white p-4 sm:p-5" aria-label="Импорт DXF">
    <input ref={input} type="file" accept=".dxf" multiple className="sr-only" aria-label="Выбрать DXF-файлы" onChange={e => void load(Array.from(e.target.files ?? []))} disabled={loading} />
    <button type="button" disabled={loading} onClick={() => input.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); void load(Array.from(e.dataTransfer.files)) }}
      className={`flex min-h-40 w-full flex-col items-center justify-center gap-3 border-2 border-dashed p-6 text-center transition focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-60 ${dragging ? 'border-blue-600 bg-blue-50' : 'border-neutral-400 bg-neutral-50 hover:bg-neutral-100'}`}>
      <span aria-hidden="true" className="text-3xl">↑</span>
      <span className="text-xl font-semibold">{loading ? 'Читаем чертежи…' : 'Загрузите файл'}</span>
      <span className="text-sm text-neutral-600">Перетащите DXF сюда или нажмите для выбора файлов</span>
      <span className="text-xs text-neutral-500">До 50 файлов · до 10 МБ каждый · всего до 50 МБ</span>
    </button>
    <p className="mt-3 text-xs leading-relaxed text-neutral-600">Имя: Толщина_Материал_Название_Количество.dxf. Например: 2_ст3_Кронштейн_10.dxf. Металл и параметры стоимости задаются вручную. Файлы обрабатываются на вашем устройстве.</p>
    <div aria-live="polite">{errors.map((error, i) => <p key={i} className="mt-2 text-sm text-red-700">{error}</p>)}</div>
    {parts.length > 0 && <div className="mt-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide">Проверка данных из DXF</h2>
      <p className="my-2 text-xs text-neutral-600">Первая деталь перенесена в калькулятор. Исправьте значения при необходимости. Кнопка «В калькулятор» переключает деталь; расчёт выполняется для одной выбранной позиции. Новая загрузка заменяет эту таблицу.</p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead><tr className="bg-neutral-100"><th className="border border-neutral-300 p-2 text-left">Файл</th>{columns.map(([key, label]) => <th key={key} className="border border-neutral-300 p-2">{label}</th>)}<th className="border border-neutral-300 p-2">Выбор</th></tr></thead>
          <tbody>{parts.map(part => <tr key={part.id} className={selected === part.id ? 'bg-blue-50' : ''}>
            <td className="min-w-40 max-w-60 break-words border border-neutral-300 p-2">{part.fileName}{part.warnings.map(w => <p key={w} className="mt-1 text-amber-800">{w}</p>)}</td>
            {columns.map(([key, label]) => <td key={key} className="border border-neutral-300 p-1"><input aria-label={`${part.fileName}: ${label}`} type="number" min={key === 'partCount' ? 1 : 0} step={key === 'partCount' || key === 'pierceCount' ? 1 : 0.01} value={part[key]} onChange={e => edit(part, key, e.target.value)} className="w-24 border border-neutral-300 bg-white px-2 py-2" /></td>)}
            <td className="border border-neutral-300 p-2"><button type="button" onClick={() => apply(part)} className="whitespace-nowrap border border-neutral-600 px-3 py-2 hover:bg-neutral-100">{selected === part.id ? 'Применить снова' : 'В калькулятор'}</button>{selected === part.id && <p className="mt-1 text-blue-800">Выбрана</p>}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </div>}
  </section>
}
