import { describe, it, expect } from 'vitest'
import { combineAbsences, adjustLambdas, absenceImpact, getAbsences } from './absences'

describe('combineAbsences', () => {
  it('suma impactos de ataque y defensa', () => {
    const r = combineAbsences([{ attack: 0.1 }, { attack: 0.05, defense: 0.2 }])
    expect(r.attack).toBeCloseTo(0.15, 9)
    expect(r.defense).toBeCloseTo(0.2, 9)
  })

  it('limita el impacto acumulado al tope (0.5)', () => {
    expect(combineAbsences([{ attack: 0.4 }, { attack: 0.4 }]).attack).toBe(0.5)
  })

  it('ignora valores negativos y lista vacía', () => {
    expect(combineAbsences([{ attack: -1, defense: -2 }])).toEqual({ attack: 0, defense: 0 })
    expect(combineAbsences([])).toEqual({ attack: 0, defense: 0 })
  })
})

describe('adjustLambdas', () => {
  it('ataque ausente baja el λ propio; defensa ausente sube el λ del rival', () => {
    const [h, a] = adjustLambdas(2, 1, { attack: 0.2, defense: 0 }, { attack: 0, defense: 0.1 })
    expect(h).toBeCloseTo(2 * 0.8 * 1.1, 9) // local pierde ataque y rival concede más
    expect(a).toBeCloseTo(1, 9)
  })

  it('sin impactos no cambia los λ', () => {
    expect(adjustLambdas(1.7, 1.1, { attack: 0, defense: 0 }, { attack: 0, defense: 0 })).toEqual([
      1.7, 1.1,
    ])
  })
})

describe('absences.json vacío por defecto', () => {
  it('no aporta ausencias ni impacto', () => {
    expect(getAbsences('France')).toEqual([])
    expect(getAbsences('Argentina')).toEqual([])
    expect(absenceImpact('France')).toEqual({ attack: 0, defense: 0 })
  })
})
