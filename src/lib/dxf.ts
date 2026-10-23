import DxfParser from 'dxf-parser'

export interface ImportedPart {
  id: string
  fileName: string
  thickness: number
  partLength: number
  partWidth: number
  partCount: number
  cutLength: number
  pierceCount: number
  warnings: string[]
}
type Point = { x: number; y: number; z?: number; bulge?: number }
type Entity = { type: string; vertices?: Point[]; center?: Point; radius?: number; startAngle?: number; endAngle?: number; shape?: boolean; inPaperSpace?: boolean; extrusionDirection?: Point }
type Edge = { a: Point; b: Point; length: number; bounds: Point[]; key: string }
const TAU = Math.PI * 2
const norm = (a: number) => (a % TAU + TAU) % TAU
const pointKey = (p: Point) => `${p.x.toFixed(4)},${p.y.toFixed(4)}`
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)

export function parseDxf(text: string, fileName: string): ImportedPart {
  if (text.startsWith('AutoCAD Binary DXF')) throw new Error('Сохраните чертёж в текстовом формате DXF (ASCII).')
  const pairs = text.replace(/^\uFEFF/, '').split(/\r?\n/)
  let inEntities = false
  const allowed = new Set(['LINE','LWPOLYLINE','POLYLINE','VERTEX','SEQEND','ARC','CIRCLE','TEXT','MTEXT','DIMENSION','POINT','VIEWPORT','ATTDEF','ATTRIB'])
  for (let i = 0; i + 1 < pairs.length; i += 2) {
    const code = pairs[i].trim(), value = pairs[i + 1].trim()
    if (code === '2' && value === 'ENTITIES') inEntities = true
    if (code === '0' && value === 'ENDSEC') inEntities = false
    if (inEntities && ((code === '210' || code === '220') && Number(value) !== 0 || code === '230' && Number(value) !== 1)) throw new Error('Нестандартная плоскость DXF: преобразуйте в XY.')
    if (inEntities && code === '0' && !allowed.has(value)) throw new Error(`Геометрия ${value} пока не поддерживается. Преобразуйте её в линии и дуги в CAD.`)
  }
  const doc = new DxfParser().parseSync(text)
  if (!doc?.entities?.length) throw new Error('В файле нет геометрии для резки.')
  const units = Number(doc.header?.$INSUNITS ?? 0)
  const scale = ({ 0: 1, 1: 25.4, 2: 304.8, 4: 1, 5: 10, 6: 1000 } as Record<number, number>)[units]
  if (!scale) throw new Error('Неизвестные единицы чертежа. Сохраните DXF в миллиметрах.')
  const warnings: string[] = []
  if (!units) warnings.push('Единицы не заданы: приняты миллиметры. Проверьте габариты.')
  const tokens = fileName.replace(/\.dxf$/i, '').split('_')
  if (/^[гg]$/i.test(tokens.at(-1) ?? '')) tokens.pop()
  const thickness = Number(tokens[0]?.replace(',', '.'))
  const count = Number(tokens.at(-1))
  const validName = tokens.length >= 4
  if (!validName || !(thickness > 0)) warnings.push('Укажите толщину: имя должно быть Толщина_Материал_Название_Количество.dxf.')
  if (!validName || !Number.isInteger(count) || count < 1) warnings.push('Количество не распознано: принято 1, проверьте.')
  const edges: Edge[] = []
  const seen = new Set<string>()
  const add = (e: Edge) => { if (!seen.has(e.key)) { seen.add(e.key); edges.push(e) } }
  const line = (a: Point, b: Point) => {
    if (distance(a, b) < 1e-8) return
    add({ a, b, length: distance(a, b), bounds: [a, b], key: 'L' + [pointKey(a), pointKey(b)].sort().join(':') })
  }
  const arc = (c: Point, r: number, start: number, sweep: number) => {
    const at = (angle: number) => ({ x: c.x + r * Math.cos(angle), y: c.y + r * Math.sin(angle) })
    const a = at(start), b = at(start + sweep)
    const bounds = [a, b]
    for (let q = 0; q < 4; q++) {
      const angle = q * Math.PI / 2
      if (norm(sweep >= 0 ? angle - start : start - angle) <= Math.abs(sweep) + 1e-9) bounds.push(at(angle))
    }
    const ccwStart = norm(sweep >= 0 ? start : start + sweep)
    add({ a, b, length: r * Math.abs(sweep), bounds, key: `A${pointKey(c)}:${r.toFixed(5)}:${ccwStart.toFixed(5)}:${Math.abs(sweep).toFixed(5)}` })
  }
  const ignored = new Set(['TEXT', 'MTEXT', 'DIMENSION', 'POINT', 'VIEWPORT', 'ATTDEF', 'ATTRIB'])
  for (const e of doc.entities as unknown as Entity[]) {
    if (e.inPaperSpace) continue
    if (ignored.has(e.type)) { if (!warnings.includes('Текст, размеры и точки исключены из реза.')) warnings.push('Текст, размеры и точки исключены из реза.'); continue }
    if (e.extrusionDirection && (e.extrusionDirection.x || e.extrusionDirection.y || e.extrusionDirection.z !== 1)) throw new Error('Нестандартная плоскость чертежа. Преобразуйте геометрию в плоскость XY.')
    if (e.type === 'LINE' || e.type === 'LWPOLYLINE' || e.type === 'POLYLINE') {
      const v = e.vertices ?? []
      if (v.some(p => p.z && Math.abs(p.z) > 1e-6)) throw new Error('Обнаружена 3D-геометрия. Нужен плоский DXF.')
      for (let i = 0; i < v.length - (e.shape ? 0 : 1); i++) {
        const a = v[i], b = v[(i + 1) % v.length], bulge = a.bulge ?? 0
        if (!bulge) line(a, b)
        else {
          const chord = distance(a, b)
          if (!chord) continue
          const offset = chord * (1 - bulge * bulge) / (4 * bulge)
          const c = { x: (a.x + b.x) / 2 - (b.y - a.y) / chord * offset, y: (a.y + b.y) / 2 + (b.x - a.x) / chord * offset }
          arc(c, distance(c, a), Math.atan2(a.y - c.y, a.x - c.x), 4 * Math.atan(bulge))
        }
      }
    } else if ((e.type === 'ARC' || e.type === 'CIRCLE') && e.center && e.radius) {
      arc(e.center, e.radius, e.startAngle ?? 0, e.type === 'CIRCLE' ? TAU : norm((e.endAngle ?? 0) - (e.startAngle ?? 0)))
    } else throw new Error(`Геометрия ${e.type} пока не поддерживается. Преобразуйте блоки/сплайны в линии и дуги в CAD.`)
  }
  if (!edges.length) throw new Error('Не найдены линии, дуги или окружности для резки.')
  const graph = new Map<string, string[]>()
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, length = 0
  for (const e of edges) {
    const a = pointKey(e.a), b = pointKey(e.b)
    graph.set(a, [...(graph.get(a) ?? []), b]); graph.set(b, [...(graph.get(b) ?? []), a])
    length += e.length
    for (const p of e.bounds) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y) }
  }
  let pierces = 0
  const visited = new Set<string>()
  for (const key of graph.keys()) {
    if (visited.has(key)) continue
    pierces++
    const stack = [key]
    while (stack.length) { const p = stack.pop()!; if (visited.has(p)) continue; visited.add(p); for (const next of graph.get(p) ?? []) if (!visited.has(next)) stack.push(next) }
  }
  if ([...graph.values()].some(v => v.length !== 2)) warnings.push('Есть открытые или разветвлённые контуры: число врезок предварительное, проверьте вручную.')
  const round = (n: number) => Math.round(n * scale * 100) / 100
  const values = [length, maxX - minX, maxY - minY]
  if (values.some(v => !Number.isFinite(v))) throw new Error('Повреждённая геометрия DXF.')
  return { id: crypto.randomUUID(), fileName, thickness: validName && thickness > 0 ? thickness : 0, partCount: validName && Number.isInteger(count) && count > 0 ? count : 1, partLength: round(maxX - minX), partWidth: round(maxY - minY), cutLength: round(length), pierceCount: pierces, warnings }
}


