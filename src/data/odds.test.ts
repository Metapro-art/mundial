import { describe, it, expect } from 'vitest'
import { parseFixtures, resolveMatchOdds, type FixtureOdds } from './odds'
import type { Match, TeamRef } from './types'

// Respuesta de ejemplo con la forma documentada de OddsPapi.
const RAW = [
  {
    fixtureId: 'id1',
    participant1Id: 3,
    participant2Id: 35,
    startTime: '2026-06-24T19:00:00.000Z',
    bookmakerOdds: {
      pinnacle: {
        markets: {
          '101': {
            outcomes: {
              '101': { players: { '0': { price: 5.01, active: true } } },
              '102': { players: { '0': { price: 4.32 } } },
              '103': { players: { '0': { price: 1.649 } } },
            },
          },
        },
      },
    },
  },
]

function teamRef(name: string): TeamRef {
  return { raw: name, known: true, name, label: name, iso2: 'xx', emoji: null }
}
function match(home: string, away: string): Match {
  return {
    id: 'm', round: 'X', stage: 'group', group: 'A', date: '2026-06-24',
    kickoff: null, venueOffsetMin: null, ground: null,
    home: teamRef(home), away: teamRef(away),
    played: false, homeGoals: null, awayGoals: null,
  }
}

describe('parseFixtures', () => {
  it('extrae el 1X2 de pinnacle con la forma documentada', () => {
    const fx = parseFixtures(RAW, 'pinnacle')
    expect(fx).toHaveLength(1)
    expect(fx[0].participant1Id).toBe(3)
    expect(fx[0].participant2Id).toBe(35)
    expect(fx[0].oneXtwo).toEqual({ home: 5.01, draw: 4.32, away: 1.649 })
    expect(fx[0].startTimeMs).toBe(Date.parse('2026-06-24T19:00:00.000Z'))
  })

  it('respuesta no-array => []', () => {
    expect(parseFixtures(null)).toEqual([])
    expect(parseFixtures({})).toEqual([])
  })

  it('sin precios completos => oneXtwo null', () => {
    const partial = [{ participant1Id: 1, participant2Id: 2, startTime: '2026-06-24T19:00:00Z', bookmakerOdds: { pinnacle: { markets: { '101': { outcomes: { '101': { players: { '0': { price: 2.1 } } } } } } } } }]
    expect(parseFixtures(partial, 'pinnacle')[0].oneXtwo).toBeNull()
  })
})

describe('resolveMatchOdds', () => {
  const fixtures: FixtureOdds[] = parseFixtures(RAW, 'pinnacle')

  it('orienta correctamente cuando nuestro local = participant1', () => {
    // ids: local=3 (participant1), visitante=35 (participant2)
    const odds = resolveMatchOdds(match('Home', 'Away'), fixtures, { Home: 3, Away: 35 }, 'pinnacle')
    expect(odds).toEqual({ home: 5.01, draw: 4.32, away: 1.649, bookmaker: 'pinnacle' })
  })

  it('INTERCAMBIA cuando nuestro local = participant2 de OddsPapi', () => {
    // Nuestro local mapea al participant2 (35), así que el "home" de OddsPapi
    // (5.01) es en realidad nuestro visitante.
    const odds = resolveMatchOdds(match('Home', 'Away'), fixtures, { Home: 35, Away: 3 }, 'pinnacle')
    expect(odds).toEqual({ home: 1.649, draw: 4.32, away: 5.01, bookmaker: 'pinnacle' })
  })

  it('null si falta algún id o el equipo no se conoce', () => {
    expect(resolveMatchOdds(match('Home', 'Away'), fixtures, { Home: 3 }, 'pinnacle')).toBeNull()
    expect(resolveMatchOdds(match('Home', 'Away'), fixtures, {}, 'pinnacle')).toBeNull()
  })
})
