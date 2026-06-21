import { describe, it, expect } from 'vitest'
import { loadWorldCupSnapshot, computeStandings, buildTeamRef } from './fixtures'
import { TEAMS } from './teams'

const data = loadWorldCupSnapshot()

describe('snapshot worldcup.json', () => {
  it('tiene 104 partidos y 12 grupos', () => {
    expect(data.matches.length).toBe(104)
    expect(data.groups.length).toBe(12)
    expect(data.groups.map((g) => g.letter)).toEqual([
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
    ])
  })

  it('cada grupo tiene 4 equipos (48 en total)', () => {
    expect(TEAMS.length).toBe(48)
    for (const g of data.groups) expect(g.teams.length).toBe(4)
  })

  it('todos los partidos de grupo tienen equipos reales (conocidos)', () => {
    const groupMatches = data.matches.filter((m) => m.stage === 'group')
    expect(groupMatches.length).toBe(72)
    for (const m of groupMatches) {
      expect(m.home.known).toBe(true)
      expect(m.away.known).toBe(true)
      expect(m.home.iso2).toBeTruthy()
    }
  })

  it('los partidos de eliminatoria usan placeholders legibles', () => {
    const ko = data.matches.filter((m) => m.stage !== 'group')
    expect(ko.length).toBe(32)
    // Mientras la fase de grupos no termine, los rivales son placeholders.
    const labels = ko.flatMap((m) => [m.home.label, m.away.label])
    expect(labels.some((l) => /^\d\.º [A-L]$/.test(l))).toBe(true) // "2.º A"
    expect(labels.some((l) => /^Mejor 3\.º/.test(l))).toBe(true)
    expect(labels.some((l) => /^Ganador M\d+$/.test(l))).toBe(true)
  })

  it('marca correctamente jugados vs no jugados', () => {
    const played = data.matches.filter((m) => m.played)
    expect(played.length).toBeGreaterThan(0)
    for (const m of played) {
      expect(m.homeGoals).not.toBeNull()
      expect(m.awayGoals).not.toBeNull()
    }
    for (const m of data.matches.filter((x) => !x.played)) {
      expect(m.homeGoals).toBeNull()
    }
  })
})

describe('computeStandings', () => {
  it('los puntos cuadran con 3/1/0 y PJ por equipo ≤ 3', () => {
    for (const g of data.groups) {
      const rows = computeStandings(data.matches, g.letter)
      expect(rows.length).toBe(4)
      for (const r of rows) {
        expect(r.points).toBe(r.won * 3 + r.drawn)
        expect(r.played).toBe(r.won + r.drawn + r.lost)
        expect(r.played).toBeLessThanOrEqual(3)
        expect(r.goalDiff).toBe(r.goalsFor - r.goalsAgainst)
      }
      // ordenado por puntos desc
      for (let i = 1; i < rows.length; i++) {
        expect(rows[i - 1].points).toBeGreaterThanOrEqual(rows[i].points)
      }
    }
  })

  it('la suma de goles a favor = goles en contra dentro del grupo', () => {
    for (const g of data.groups) {
      const rows = computeStandings(data.matches, g.letter)
      const gf = rows.reduce((s, r) => s + r.goalsFor, 0)
      const ga = rows.reduce((s, r) => s + r.goalsAgainst, 0)
      expect(gf).toBe(ga)
    }
  })
})

describe('buildTeamRef', () => {
  it('resuelve nombres canónicos y placeholders', () => {
    const mex = buildTeamRef('Mexico')
    expect(mex.known).toBe(true)
    expect(mex.label).toBe('México')
    expect(mex.iso2).toBe('mx')

    const ph = buildTeamRef('3A/B/C/D/F')
    expect(ph.known).toBe(false)
    expect(ph.label).toBe('Mejor 3.º (A/B/C/D/F)')
    expect(ph.iso2).toBeNull()
  })
})
