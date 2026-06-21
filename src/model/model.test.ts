import { describe, it, expect } from 'vitest'
import { buildModel, predictMatch, CORPUS_SIZE, getRating } from './index'

const model = buildModel()

describe('buildModel (corpus real)', () => {
  it('usa todo el corpus empaquetado', () => {
    expect(model.matchCount).toBe(CORPUS_SIZE)
    expect(CORPUS_SIZE).toBeGreaterThan(1000)
    expect(model.refDate >= '2026-01-01').toBe(true)
  })

  it('asigna Elo coherente: potencias > selecciones débiles', () => {
    expect(getRating(model.elo, 'Argentina')).toBeGreaterThan(getRating(model.elo, 'Haiti'))
    expect(getRating(model.elo, 'France')).toBeGreaterThan(getRating(model.elo, 'New Zealand'))
    expect(getRating(model.elo, 'Spain')).toBeGreaterThan(getRating(model.elo, 'Curaçao'))
  })
})

describe('predictMatch (corpus real)', () => {
  it('devuelve probabilidades válidas', () => {
    const p = predictMatch(model, 'Brazil', 'Switzerland')
    expect(p.oneXtwo.home + p.oneXtwo.draw + p.oneXtwo.away).toBeCloseTo(1, 9)
    for (const v of [p.oneXtwo.home, p.oneXtwo.draw, p.oneXtwo.away, p.btts.yes, p.btts.no]) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
    expect(p.expected.home).toBeGreaterThan(0)
    expect(p.expected.away).toBeGreaterThan(0)
    expect(p.topScores).toHaveLength(5)
    // sin absences.json poblado, no hay ausencias
    expect(p.absences).toEqual({ home: [], away: [] })
  })

  it('es determinista', () => {
    const a = predictMatch(model, 'England', 'Panama')
    const b = predictMatch(model, 'England', 'Panama')
    expect(a.oneXtwo.home).toBe(b.oneXtwo.home)
    expect(a.lambdas.home).toBe(b.lambdas.home)
  })

  it('favorito claro: la potencia gana al débil con > 50%', () => {
    const pairs: [string, string][] = [
      ['France', 'Haiti'],
      ['Argentina', 'New Zealand'],
      ['Spain', 'Cape Verde'],
    ]
    for (const [fav, dog] of pairs) {
      const p = predictMatch(model, fav, dog)
      expect(p.oneXtwo.home).toBeGreaterThan(p.oneXtwo.away)
      expect(p.oneXtwo.home).toBeGreaterThan(0.5)
      // un favorito fuerte tiende a marcar: Over 1.5 alto
      expect(p.overUnder.find((o) => o.line === 1.5)!.over).toBeGreaterThan(0.5)
    }
  })

  it('aplica ventaja de localía solo a los anfitriones', () => {
    expect(predictMatch(model, 'Mexico', 'Japan').hostAdvantage).toBe('home')
    expect(predictMatch(model, 'Japan', 'Mexico').hostAdvantage).toBe('away')
    expect(predictMatch(model, 'USA', 'Germany').hostAdvantage).toBe('home')
    expect(predictMatch(model, 'Germany', 'France').hostAdvantage).toBeNull()
  })

  it('la localía del anfitrión sube su λ frente al escenario neutral', () => {
    const host = predictMatch(model, 'Mexico', 'Japan')
    const neutral = predictMatch(model, 'Mexico', 'Japan', { neutral: true })
    expect(neutral.hostAdvantage).toBeNull()
    // con ventaja, México marca más y Japón menos que en sede neutral
    expect(host.lambdas.home).toBeGreaterThan(neutral.lambdas.home)
    expect(host.lambdas.away).toBeLessThan(neutral.lambdas.away)
  })
})
