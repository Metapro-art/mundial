import { describe, it, expect } from 'vitest'
import { computeStrength, attackOf, defenseOf } from './strength'
import type { IntlResult } from '../data/types'

function m(home: string, away: string, hg: number, ag: number, date = '2025-06-01'): IntlResult {
  return { date, home, away, homeGoals: hg, awayGoals: ag, competition: 'Friendly', neutral: true }
}

describe('computeStrength', () => {
  it('μ es el promedio de goles por equipo por partido', () => {
    // 2 partidos, total 6 goles => 6 / (2*2) = 1.5
    const s = computeStrength([m('A', 'B', 2, 1), m('C', 'D', 2, 1)], '2025-06-01')
    expect(s.mu).toBeCloseTo(1.5, 6)
  })

  it('un equipo goleador tiene attack>1; uno goleado tiene defense>1', () => {
    const data: IntlResult[] = []
    for (let i = 0; i < 8; i++) {
      data.push(m('Scorer', 'Victim', 4, 0, `2025-0${(i % 8) + 1}-01`))
    }
    // añade ruido para que la media no sea trivial
    for (let i = 0; i < 8; i++) data.push(m('X', 'Y', 1, 1, `2025-0${(i % 8) + 1}-02`))
    const s = computeStrength(data, '2025-08-02')
    expect(attackOf(s, 'Scorer')).toBeGreaterThan(1)
    expect(defenseOf(s, 'Scorer')).toBeLessThan(1)
    expect(defenseOf(s, 'Victim')).toBeGreaterThan(1)
    expect(attackOf(s, 'Victim')).toBeLessThan(1)
  })

  it('el shrinkage acerca a 1 a los equipos con pocos partidos', () => {
    // Un equipo con 1 solo partido extremo no debe llegar al extremo crudo.
    const data = [m('Solo', 'Opp', 5, 0), m('P', 'Q', 1, 1), m('R', 'S', 1, 1)]
    const s = computeStrength(data, '2025-06-01')
    const raw = 5 / s.mu // attack crudo si no hubiera shrinkage
    expect(attackOf(s, 'Solo')).toBeLessThan(raw)
    expect(attackOf(s, 'Solo')).toBeGreaterThan(1)
  })

  it('el decaimiento da más peso a los partidos recientes', () => {
    // Mismo equipo: malo hace mucho, bueno hace poco => attack debe tirar a bueno.
    const data = [
      m('T', 'O1', 0, 3, '2023-01-01'), // viejo, malo
      m('T', 'O2', 4, 0, '2025-06-01'), // reciente, bueno
      m('Z', 'W', 1, 1, '2025-06-01'),
    ]
    const s = computeStrength(data, '2025-06-01')
    // como el reciente pesa más, marca por encima de la media
    expect(attackOf(s, 'T')).toBeGreaterThan(1)
  })

  it('equipo desconocido => fuerza neutra 1', () => {
    const s = computeStrength([m('A', 'B', 1, 1)], '2025-06-01')
    expect(attackOf(s, 'Inexistente')).toBe(1)
    expect(defenseOf(s, 'Inexistente')).toBe(1)
  })
})
