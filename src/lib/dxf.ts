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
type Entity = { controlPoints?: Point[]; knotValues?: number[]; degreeOfSplineCurve?: number; weights?: number[]; closed?: boolean; periodic?: boolean; type: string; vertices?: Point[]; center?: Point; radius?: number; startAngle?: number; endAngle?: number; shape?: boolean; inPaperSpace?: boolean; extrusionDirection?: Point }
type Edge = { a: Point; b: Point; length: number; bounds: Point[]; key: string }
const TAU = Math.PI * 2
const norm = (a: number) => (a % TAU + TAU) % TAU
const pointKey = (p: Point) => `${p.x.toFixed(4)},${p.y.toFixed(4)}`
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)

export function parseDxf(text: string, fileName: string): ImportedPart {
  if (text.startsWith('AutoCAD Binary DXF')) throw new Error('Сохраните чертёж в текстовом формате DXF (ASCII).')
  const pairs = text.replace(/^\uFEFF/, '').split(/\r?\n/)
  let inEntities = false
  const splineWeights: number[][] = []
  let currentWeights: number[] | undefined
  const allowed = new Set(['LINE','LWPOLYLINE','POLYLINE','VERTEX','SEQEND','ARC','CIRCLE','SPLINE','TEXT','MTEXT','DIMENSION','POINT','VIEWPORT','ATTDEF','ATTRIB'])
  for (let i = 0; i + 1 < pairs.length; i += 2) {
    const code = pairs[i].trim(), value = pairs[i + 1].trim()
    if (code === '2' && value === 'ENTITIES') inEntities = true
    if (code === '0' && value === 'ENDSEC') inEntities = false
    if (inEntities && code === '0') { currentWeights = value === 'SPLINE' ? [] : undefined; if (currentWeights) splineWeights.push(currentWeights) }
    if (inEntities && code === '41' && currentWeights) currentWeights.push(Number(value))
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
  let splineIndex = 0
  const ignored = new Set(['TEXT', 'MTEXT', 'DIMENSION', 'POINT', 'VIEWPORT', 'ATTDEF', 'ATTRIB'])
  for (const e of doc.entities as unknown as Entity[]) {
    if (e.type === 'SPLINE') e.weights = splineWeights[splineIndex++]
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
    } else if (e.type === 'SPLINE') {
      const points = sampleSpline(e, scale)
      const forward = points.map(pointKey).join(';'), reverse = [...points].reverse().map(pointKey).join(';')
      add({ a: points[0], b: points[points.length - 1], bounds: points, length: points.slice(1).reduce((sum, point, i) => sum + distance(points[i], point), 0), key: 'S' + (forward < reverse ? forward : reverse) })
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



// Rational B-spline evaluation in homogeneous coordinates (de Boor).
function sampleSpline(e: Entity, scale: number): Point[] {
  const cp = e.controlPoints ?? [], knots = e.knotValues ?? [], p = e.degreeOfSplineCurve ?? 0
  const weights = e.weights?.length ? e.weights : cp.map(() => 1)
  if (p < 1 || p > 10 || cp.length <= p || knots.length !== cp.length + p + 1 || weights.length !== cp.length ||
      knots.some((v, i) => !Number.isFinite(v) || (i > 0 && v < knots[i - 1])) ||
      weights.some(w => !Number.isFinite(w) || w <= 0) || cp.some(v => !Number.isFinite(v.x) || !Number.isFinite(v.y) || Math.abs(v.z ?? 0) > 1e-6)) {
    throw new Error('SPLINE содержит некорректные узлы или контрольные точки. Сохраните DXF с контрольными точками сплайна.')
  }
  const evaluate = (u: number, span: number): Point => {
    const d = Array.from({ length: p + 1 }, (_, j) => {
      const i = span - p + j, w = weights[i]
      return [cp[i].x * w, cp[i].y * w, w]
    })
    for (let r = 1; r <= p; r++) for (let j = p; j >= r; j--) {
      const i = span - p + j, denominator = knots[i + p - r + 1] - knots[i]
      const alpha = denominator ? (u - knots[i]) / denominator : 0
      d[j] = d[j].map((v, k) => (1 - alpha) * d[j - 1][k] + alpha * v)
    }
    return { x: d[p][0] / d[p][2], y: d[p][1] / d[p][2] }
  }
  const points: Point[] = []
  const tolerance = 0.001 / scale
  function subdivide(a: number, b: number, pa: Point, pb: Point, span: number, depth: number) {
    const mid = (a + b) / 2, pm = evaluate(mid, span)
    const q1 = evaluate((a + mid) / 2, span), q3 = evaluate((mid + b) / 2, span)
    const length = distance(pa, q1) + distance(q1, pm) + distance(pm, q3) + distance(q3, pb)
    const deviation = Math.max(distance(q1, { x: pa.x * .75 + pb.x * .25, y: pa.y * .75 + pb.y * .25 }), distance(pm, { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 }), distance(q3, { x: pa.x * .25 + pb.x * .75, y: pa.y * .25 + pb.y * .75 }))
    if (deviation <= tolerance && length - distance(pa, pb) <= tolerance) { points.push(pb); return }
    if (depth >= 20 || points.length > 100000) throw new Error('Сплайн слишком сложный для точного расчёта в браузере.')
    subdivide(a, mid, pa, pm, span, depth + 1); subdivide(mid, b, pm, pb, span, depth + 1)
  }
  for (let span = p; span < cp.length; span++) {
    const a = knots[span], b = knots[span + 1]
    if (b <= a) continue
    const first = evaluate(a, span), last = evaluate(b, span)
    if (!points.length) points.push(first)
    else if (distance(points[points.length - 1], first) > tolerance) throw new Error('Сплайн содержит разрыв. Разделите его на отдельные контуры.')
    subdivide(a, b, first, last, span, 0)
  }
  if (points.length < 2) throw new Error('У сплайна нет ненулевого диапазона узлов.')
  if (e.closed || e.periodic) {
    if (distance(points[0], points[points.length - 1]) > tolerance * 2) throw new Error('Замкнутый сплайн имеет несовпадающие концы. Проверьте чертёж.')
    points[points.length - 1] = points[0]
  }
  return points
}

