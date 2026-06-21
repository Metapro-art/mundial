import { describe, it, expect } from 'vitest'
import { devig, edges } from './value'

describe('devig', () => {
  it('cuotas justas (sin vig) dan las mismas probabilidades', () => {
    // 2.0 / 4.0 / 4.0 => 0.5 / 0.25 / 0.25, overround = 1
    const p = devig([2, 4, 4])
    expect(p[0]).toBeCloseTo(0.5, 9)
    expect(p[1]).toBeCloseTo(0.25, 9)
    expect(p[2]).toBeCloseTo(0.25, 9)
  })

  it('quita el margen: las probabilidades implícitas suman 1', () => {
    const p = devig([1.9, 3.5, 4.0]) // overround > 1
    expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9)
    // mantiene el orden de favoritismo
    expect(p[0]).toBeGreaterThan(p[1])
    expect(p[1]).toBeGreaterThan(p[2])
  })

  it('maneja cuotas inválidas sin romperse', () => {
    expect(devig([0, 0, 0]).every((x) => x === 0)).toBe(true)
  })
})

describe('edges', () => {
  it('edge = prob_modelo − prob_implícita', () => {
    const rows = edges([0.6, 0.25, 0.15], [2, 4, 4]) // implícitas 0.5/0.25/0.25
    expect(rows[0].edge).toBeCloseTo(0.1, 9)
    expect(rows[1].edge).toBeCloseTo(0, 9)
    expect(rows[2].edge).toBeCloseTo(-0.1, 9)
    expect(rows[0].implied).toBeCloseTo(0.5, 9)
  })
})
