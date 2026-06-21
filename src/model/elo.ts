import type { IntlResult } from '../data/types'
import { MODEL } from './config'
import { classifyCompetition } from './competitions'

// Elo de selecciones al estilo "World Football Elo":
// - K base según la importancia del torneo.
// - Multiplicador por el margen de goles.
// - Ventaja de localía solo si el partido no fue en cancha neutral.

export type EloRatings = Map<string, number>

/** Importancia del partido → K base. */
export function competitionWeight(tournament: string): number {
  return MODEL.kBase[classifyCompetition(tournament)]
}

/** Multiplicador por margen de goles (World Football Elo). */
export function marginMultiplier(goalDiff: number): number {
  const m = Math.abs(goalDiff)
  if (m <= 1) return 1
  if (m === 2) return 1.5
  return (11 + m) / 8 // 3→1.75, 4→1.875, 5→2.0, …
}

/** Resultado esperado del local (0..1) dado el Elo y la ventaja de localía. */
export function expectedScore(ratingHome: number, ratingAway: number, homeAdv: number): number {
  return 1 / (1 + 10 ** (-(ratingHome + homeAdv - ratingAway) / 400))
}

/** Puntuación real del local: victoria 1, empate 0.5, derrota 0. */
function actualScore(homeGoals: number, awayGoals: number): number {
  if (homeGoals > awayGoals) return 1
  if (homeGoals < awayGoals) return 0
  return 0.5
}

/**
 * Aplica un partido a los ratings (mutación in-place). Suma cero: lo que gana
 * un equipo lo pierde el otro. Devuelve el delta aplicado al local.
 */
export function updateElo(ratings: EloRatings, m: IntlResult): number {
  const rH = ratings.get(m.home) ?? MODEL.eloInitial
  const rA = ratings.get(m.away) ?? MODEL.eloInitial
  const homeAdv = m.neutral ? 0 : MODEL.eloHomeAdvantage
  const expected = expectedScore(rH, rA, homeAdv)
  const actual = actualScore(m.homeGoals, m.awayGoals)
  const k = competitionWeight(m.competition) * marginMultiplier(m.homeGoals - m.awayGoals)
  const delta = k * (actual - expected)
  ratings.set(m.home, rH + delta)
  ratings.set(m.away, rA - delta)
  return delta
}

/** Calcula los ratings Elo procesando el corpus en orden cronológico. */
export function computeElo(results: IntlResult[]): EloRatings {
  const ratings: EloRatings = new Map()
  const ordered = [...results].sort((a, b) => a.date.localeCompare(b.date))
  for (const m of ordered) updateElo(ratings, m)
  return ratings
}

export function getRating(ratings: EloRatings, team: string): number {
  return ratings.get(team) ?? MODEL.eloInitial
}
