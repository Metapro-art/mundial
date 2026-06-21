import { describe, it, expect } from 'vitest'
import { scoreMatrix, marketsFromMatrix, markets, tau } from './dixoncoles'

function matrixSum(m: number[][]): number {
  return m.reduce((s, row) => s + row.reduce((a, b) => a + b, 0), 0)
}

describe('tau (corrección Dixon-Coles)', () => {
  it('valores correctos con ρ=-0.08', () => {
    const rho = -0.08
    expect(tau(0, 0, 1.3, 1.1, rho)).toBeCloseTo(1 - 1.3 * 1.1 * rho, 12)
    expect(tau(1, 1, 1.3, 1.1, rho)).toBeCloseTo(1 - rho, 12) // 1.08
    expect(tau(0, 1, 1.3, 1.1, rho)).toBeCloseTo(1 + 1.3 * rho, 12) // 0.896
    expect(tau(1, 0, 1.3, 1.1, rho)).toBeCloseTo(1 + 1.1 * rho, 12) // 0.912
    expect(tau(2, 2, 1.3, 1.1, rho)).toBe(1) // sin corrección fuera de los bajos
  })

  it('nunca negativo', () => {
    expect(tau(0, 1, 50, 50, -0.5)).toBe(0)
  })
})

describe('scoreMatrix', () => {
  it('suma 1 con y sin corrección', () => {
    expect(matrixSum(scoreMatrix(1.6, 1.1, 0))).toBeCloseTo(1, 10)
    expect(matrixSum(scoreMatrix(1.6, 1.1, -0.08))).toBeCloseTo(1, 10)
    expect(matrixSum(scoreMatrix(0.2, 3.4, -0.12))).toBeCloseTo(1, 10)
  })
})

describe('markets', () => {
  it('1X2, O/U y BTTS son distribuciones válidas', () => {
    const m = markets(1.7, 1.2)
    expect(m.oneXtwo.home + m.oneXtwo.draw + m.oneXtwo.away).toBeCloseTo(1, 9)
    for (const ou of m.overUnder) {
      expect(ou.over + ou.under).toBeCloseTo(1, 9)
      expect(ou.over).toBeGreaterThanOrEqual(0)
      expect(ou.over).toBeLessThanOrEqual(1)
    }
    expect(m.btts.yes + m.btts.no).toBeCloseTo(1, 9)
  })

  it('las líneas O/U están ordenadas y son monótonas (más línea => menos Over)', () => {
    const m = markets(1.7, 1.2)
    expect(m.overUnder.map((o) => o.line)).toEqual([0.5, 1.5, 2.5, 3.5])
    for (let i = 1; i < m.overUnder.length; i++) {
      expect(m.overUnder[i].over).toBeLessThan(m.overUnder[i - 1].over)
    }
  })

  it('top 5 marcadores: ordenados desc y suman ≤ 1', () => {
    const m = markets(1.7, 1.2)
    expect(m.topScores).toHaveLength(5)
    for (let i = 1; i < m.topScores.length; i++) {
      expect(m.topScores[i - 1].prob).toBeGreaterThanOrEqual(m.topScores[i].prob)
    }
    const s = m.topScores.reduce((a, b) => a + b.prob, 0)
    expect(s).toBeLessThanOrEqual(1)
    expect(s).toBeGreaterThan(0)
  })

  it('con ρ=0 los goles esperados ≈ λ (medias de Poisson)', () => {
    const m = marketsFromMatrix(scoreMatrix(2.1, 1.3, 0, 15), { home: 2.1, away: 1.3 })
    expect(m.expected.home).toBeCloseTo(2.1, 3)
    expect(m.expected.away).toBeCloseTo(1.3, 3)
  })

  it('simetría: λ iguales => P(local)=P(visitante) y BTTS simétrico', () => {
    const m = markets(1.4, 1.4)
    expect(m.oneXtwo.home).toBeCloseTo(m.oneXtwo.away, 9)
    expect(m.expected.home).toBeCloseTo(m.expected.away, 9)
  })

  it('la corrección DC (ρ<0) sube la probabilidad de empate', () => {
    const plain = markets(1.3, 1.3, 0)
    const dc = markets(1.3, 1.3, -0.08)
    expect(dc.oneXtwo.draw).toBeGreaterThan(plain.oneXtwo.draw)
  })

  it('más goles esperados => más Over 2.5', () => {
    const low = markets(0.8, 0.7)
    const high = markets(2.4, 1.9)
    const over25 = (mk: ReturnType<typeof markets>) =>
      mk.overUnder.find((o) => o.line === 2.5)!.over
    expect(over25(high)).toBeGreaterThan(over25(low))
  })

  it('favorito claro: λ alto vs bajo => gana el local con holgura', () => {
    const m = markets(2.6, 0.6)
    expect(m.oneXtwo.home).toBeGreaterThan(0.6)
    expect(m.oneXtwo.home).toBeGreaterThan(m.oneXtwo.away)
  })
})
