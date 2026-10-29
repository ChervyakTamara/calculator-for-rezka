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
const spline = (points, degree, knots, weights = [], flags = 0) => '0\nSPLINE\n70\n'+flags+'\n71\n'+degree+'\n'+knots.map(k=>'40\n'+k+'\n').join('')+weights.map(w=>'41\n'+w+'\n').join('')+points.map(([x,y])=>'10\n'+x+'\n20\n'+y+'\n').join('')
const quarter = spline([[10,0],[10,10],[0,10]],2,[0,0,0,1,1,1],[1,Math.SQRT1_2,1])
const q = parseDxf(wrap(quarter),'3_ст3_деталь22_10_г.dxf')
assert.equal(q.cutLength,15.71); assert.equal(q.partLength,10); assert.equal(q.partWidth,10); assert.equal(q.pierceCount,1)
const bezier = spline([[0,0],[50,100],[100,0]],2,[0,0,0,1,1,1])
const curve = parseDxf(wrap(bezier+line(100,0,0,0)+bezier),'3_ст3_A_10.dxf')
assert.equal(curve.partWidth,50); assert.equal(curve.partLength,100); assert.equal(curve.pierceCount,1)
assert.ok(Math.abs(curve.cutLength - 247.894286) < .02)
assert.ok(!curve.warnings.some(w=>w.includes('открытые')))
const closed = spline([[0,0],[100,0],[100,80],[0,80],[0,0]],1,[0,0,1,2,3,4,4],[],1)
assert.equal(parseDxf(wrap(closed),'3_ст3_A_1.dxf').cutLength,360)
console.log('SPLINE: rational quarter circle, quadratic extrema/length, joined contours, duplicates and closed splines passed')
const ellipse = (x,y,ax,ay,ratio,start=0,end=2*Math.PI) => `0\nELLIPSE\n10\n${x}\n20\n${y}\n11\n${ax}\n21\n${ay}\n40\n${ratio}\n41\n${start}\n42\n${end}\n`
const oval = parseDxf(wrap(ellipse(0,0,10,0,.5)), '3_ст3_овал_10.dxf')
assert.equal(oval.partLength,20); assert.equal(oval.partWidth,10); assert.equal(oval.cutLength,48.44); assert.equal(oval.pierceCount,1)
assert.ok(!oval.warnings.some(w=>w.includes('открытые')))
assert.equal(parseDxf(wrap(ellipse(0,0,10,0,.5)+ellipse(0,0,10,0,.5)),'3_ст3_A_1.dxf').cutLength,48.44)
const rotated = parseDxf(wrap(ellipse(30,-20,Math.SQRT1_2*10,Math.SQRT1_2*10,.5)),'3_ст3_A_1.dxf')
assert.equal(rotated.partLength,15.81); assert.equal(rotated.partWidth,15.81)
const quarterOval = parseDxf(wrap(ellipse(0,0,10,0,.5,0,Math.PI/2)+line(0,5,10,0)),'3_ст3_A_1.dxf')
assert.equal(quarterOval.pierceCount,1); assert.equal(quarterOval.partLength,10); assert.equal(quarterOval.partWidth,5)
assert.ok(!quarterOval.warnings.some(w=>w.includes('открытые')))
assert.equal(parseDxf(wrap(ellipse(0,0,10,0,1)),'3_ст3_A_1.dxf').cutLength,62.83)
console.log('ELLIPSE: perimeter, rotated bounds, partial arcs, joined contours, duplicates and circle limit passed')
