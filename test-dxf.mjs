import assert from 'node:assert/strict'
import { parseDxf } from './src/lib/dxf.ts'
const wrap = body => `0\nSECTION\n2\nENTITIES\n${body}0\nENDSEC\n0\nEOF\n`
const line = (x,y,a,b) => `0\nLINE\n10\n${x}\n20\n${y}\n11\n${a}\n21\n${b}\n`
const rect = line(0,0,100,0)+line(100,0,100,80)+line(100,80,0,80)+line(0,80,0,0)
const circle = '0\nCIRCLE\n10\n50\n20\n40\n40\n10\n'
const p = parseDxf(wrap(rect+circle+line(100,0,0,0)), '2_ст3_Деталь_10_г.dxf')
assert.equal(p.partLength,100); assert.equal(p.partWidth,80); assert.equal(p.pierceCount,2)
assert.equal(p.cutLength,422.83); assert.equal(p.partCount,10); assert.equal(p.thickness,2)
assert.equal(parseDxf(wrap(rect),'1,5_ст3_A_2.dxf').thickness,1.5)
assert.equal(parseDxf(wrap(rect),'unknown.dxf').thickness,0)
assert.match(parseDxf(wrap(line(0,0,10,0)),'2_ст3_A_1.dxf').warnings.join(),/открытые/)
assert.throws(()=>parseDxf(wrap('0\nSPLINE\n'),'2_ст3_A_1.dxf'))
console.log('DXF: rectangle, circle, reversed duplicate, contours, filename and invalid geometry passed')

const arc = '0\nARC\n10\n0\n20\n0\n40\n10\n50\n0\n51\n180\n'
const a = parseDxf(wrap(arc),'2_ст3_A_1.dxf')
assert.equal(a.partLength,20); assert.equal(a.partWidth,10); assert.equal(a.cutLength,31.42)
const poly = '0\nLWPOLYLINE\n90\n2\n70\n1\n10\n-10\n20\n0\n42\n1\n10\n10\n20\n0\n42\n1\n'
const b = parseDxf(wrap(poly),'2_ст3_A_1.dxf')
assert.equal(b.pierceCount,1); assert.equal(b.cutLength,62.83); assert.equal(b.partWidth,20)
assert.throws(()=>parseDxf(wrap(rect+'0\nELLIPSE\n'),'2_ст3_A_1.dxf'))
console.log('DXF: arcs, bulged polylines and mixed unsupported entities passed')
