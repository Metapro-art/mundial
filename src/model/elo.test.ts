import { describe, it, expect } from 'vitest'
import {
  expectedScore,
  marginMultiplier,
  competitionWeight,
  updateElo,
  computeElo,
  type EloRatings,
} from './elo'
import type { IntlResult } from '../data/types'

describe('expectedScore', () => {
  it('ratings iguales sin localía => 0.5', () => {
    expect(expectedScore(1500, 1500, 0)).toBeCloseTo(0.5, 12)
  })
  it('es simétrico: E(a,b)+E(b,a)=1', () => {
    expect(expectedScore(1600, 1450, 0) + expectedScore(1450, 1600, 0)).toBeCloseTo(1, 12)
  })
  it('+400 de diferencia => ~0.909', () => {
    expect(expectedScore(1900, 1500, 0)).toBeCloseTo(10 / 11, 6)
  })
  it('la localía aumenta la expectativa del local', () => {
    expect(expectedScore(1500, 1500, 100)).toBeGreaterThan(0.5)
  })
})

describe('marginMultiplier', () => {
  it('valores de la fórmula World Football Elo', () => {
    expect(marginMultiplier(0)).toBe(1)
    expect(marginMultiplier(1)).toBe(1)
    expect(marginMultiplier(-1)).toBe(1)
    expect(marginMultiplier(2)).toBe(1.5)
    expect(marginMultiplier(3)).toBeCloseTo(1.75, 12)
    expect(marginMultiplier(4)).toBeCloseTo(1.875, 12)
  })
})

describe('competitionWeight', () => {
  it('mapea importancia a K base', () => {
    expect(competitionWeight('Friendly')).toBe(20)
    expect(competitionWeight('FIFA World Cup')).toBe(60)
    expect(competitionWeight('FIFA World Cup qualification')).toBe(40)
    expect(competitionWeight('UEFA Nations League')).toBe(40)
    expect(competitionWeight('Copa América')).toBe(50)
    expect(competitionWeight('AFC Asian Cup')).toBe(50)
    expect(competitionWeight('Some Random Cup')).toBe(30)
  })
})

function match(home: string, away: string, hg: number, ag: number, extra: Partial<IntlResult> = {}): IntlResult {
  return { date: '2025-01-01', home, away, homeGoals: hg, awayGoals: ag, competition: 'Friendly', neutral: true, ...extra }
}

describe('updateElo', () => {
  it('es suma cero', () => {
    const r: EloRatings = new Map([['A', 1500], ['B', 1500]])
    const delta = updateElo(r, match('A', 'B', 2, 0))
    expect(r.get('A')! - 1500).toBeCloseTo(delta, 12)
    expect(r.get('B')! - 1500).toBeCloseTo(-delta, 12)
  })

  it('ganar suma puntos; perder los resta', () => {
    const r: EloRatings = new Map([['A', 1500], ['B', 1500]])
    updateElo(r, match('A', 'B', 1, 0))
    expect(r.get('A')!).toBeGreaterThan(1500)
    expect(r.get('B')!).toBeLessThan(1500)
  })

  it('batir a un rival más fuerte da más puntos que batir a uno más débil', () => {
    const r1: EloRatings = new Map([['A', 1500], ['Strong', 1800]])
    const d1 = updateElo(r1, match('A', 'Strong', 1, 0))
    const r2: EloRatings = new Map([['A', 1500], ['Weak', 1200]])
    const d2 = updateElo(r2, match('A', 'Weak', 1, 0))
    expect(d1).toBeGreaterThan(d2)
  })

  it('mayor margen de goles => mayor cambio', () => {
    const r1: EloRatings = new Map([['A', 1500], ['B', 1500]])
    const d1 = updateElo(r1, match('A', 'B', 1, 0))
    const r2: EloRatings = new Map([['A', 1500], ['B', 1500]])
    const d2 = updateElo(r2, match('A', 'B', 4, 0))
    expect(d2).toBeGreaterThan(d1)
  })
})

describe('computeElo', () => {
  it('un equipo que siempre gana termina arriba; el que siempre pierde, abajo', () => {
    const results: IntlResult[] = []
    for (let i = 0; i < 10; i++) {
      results.push(match('Winner', 'Loser', 2, 0, { date: `2025-01-${String(i + 1).padStart(2, '0')}` }))
    }
    const ratings = computeElo(results)
    expect(ratings.get('Winner')!).toBeGreaterThan(1500)
    expect(ratings.get('Loser')!).toBeLessThan(1500)
    expect(ratings.get('Winner')!).toBeGreaterThan(ratings.get('Loser')!)
  })

  it('es determinista y procesa en orden cronológico (orden de entrada irrelevante)', () => {
    const a = match('A', 'B', 3, 1, { date: '2025-02-01' })
    const b = match('B', 'A', 2, 2, { date: '2025-03-01' })
    const r1 = computeElo([a, b])
    const r2 = computeElo([b, a])
    expect(r1.get('A')).toBeCloseTo(r2.get('A')!, 9)
  })
})
