import { describe, it, expect } from 'vitest'
import { poissonPmf, poissonVector, logFactorial } from './poisson'

describe('poisson', () => {
  it('logFactorial coincide con log(n!)', () => {
    expect(logFactorial(0)).toBe(0)
    expect(logFactorial(1)).toBe(0)
    expect(logFactorial(5)).toBeCloseTo(Math.log(120), 10)
  })

  it('pmf(λ,0) = e^-λ', () => {
    expect(poissonPmf(2.3, 0)).toBeCloseTo(Math.exp(-2.3), 12)
  })

  it('valor conocido pmf(2,1) = 2·e^-2', () => {
    expect(poissonPmf(2, 1)).toBeCloseTo(2 * Math.exp(-2), 12)
  })

  it('la pmf suma ~1 sobre 0..60', () => {
    for (const lambda of [0.3, 1.3, 2.7, 5]) {
      let s = 0
      for (let k = 0; k <= 60; k++) s += poissonPmf(lambda, k)
      expect(s).toBeCloseTo(1, 9)
    }
  })

  it('k negativo o no entero => 0', () => {
    expect(poissonPmf(2, -1)).toBe(0)
    expect(poissonPmf(2, 1.5)).toBe(0)
  })

  it('poissonVector tiene longitud maxGoals+1', () => {
    expect(poissonVector(1.5, 10)).toHaveLength(11)
  })
})
