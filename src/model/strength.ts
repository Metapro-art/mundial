import type { IntlResult } from '../data/types'
import { MODEL } from './config'
import { classifyCompetition } from './competitions'

// Fuerza de ataque/defensa por selección, relativa a la media del corpus, con
// decaimiento temporal (los partidos recientes pesan más) y shrinkage hacia 1.0
// para selecciones con pocos datos.
//
//   attack[t] ≈ goles que marca por partido / media        (1 = promedio)
//   defense[t] ≈ goles que recibe por partido / media       (<1 = mejor defensa)

export interface Strength {
  /** Goles promedio por equipo por partido (ponderado). */
  mu: number
  attack: Map<string, number>
  defense: Map<string, number>
  /** Suma de pesos por equipo (≈ partidos efectivos). */
  weight: Map<string, number>
}

const MS_PER_MONTH = 30.4375 * 24 * 3600 * 1000

function decayWeight(matchDate: string, refMs: number, halfLifeMonths: number): number {
  const ms = Date.parse(`${matchDate}T00:00:00Z`)
  if (Number.isNaN(ms)) return 0
  const ageMonths = Math.max(0, (refMs - ms) / MS_PER_MONTH)
  return 0.5 ** (ageMonths / halfLifeMonths)
}

export function computeStrength(results: IntlResult[], refDate?: string): Strength {
  const ref = refDate ?? results.reduce((mx, r) => (r.date > mx ? r.date : mx), '0000-00-00')
  const refMs = Date.parse(`${ref}T00:00:00Z`)
  const half = MODEL.halfLifeMonths

  const scored = new Map<string, number>()
  const conceded = new Map<string, number>()
  const wsum = new Map<string, number>()
  let globalGoals = 0
  let globalWeight = 0

  const bump = (map: Map<string, number>, key: string, v: number) =>
    map.set(key, (map.get(key) ?? 0) + v)

  for (const m of results) {
    // peso = recencia (decaimiento) × importancia del partido (Mundial > amistoso)
    const importance = MODEL.strengthImportance[classifyCompetition(m.competition)]
    const w = decayWeight(m.date, refMs, half) * importance
    if (w <= 0) continue
    bump(scored, m.home, w * m.homeGoals)
    bump(conceded, m.home, w * m.awayGoals)
    bump(wsum, m.home, w)
    bump(scored, m.away, w * m.awayGoals)
    bump(conceded, m.away, w * m.homeGoals)
    bump(wsum, m.away, w)
    globalGoals += w * (m.homeGoals + m.awayGoals)
    globalWeight += w
  }

  const mu = globalWeight > 0 ? globalGoals / (2 * globalWeight) : 1.3
  const prior = MODEL.priorGames

  const attack = new Map<string, number>()
  const defense = new Map<string, number>()
  for (const team of wsum.keys()) {
    const w = wsum.get(team) ?? 0
    // shrinkage bayesiano hacia la media (prior = `prior` partidos promedio)
    attack.set(team, (scored.get(team)! + prior * mu) / (w + prior) / mu)
    defense.set(team, (conceded.get(team)! + prior * mu) / (w + prior) / mu)
  }

  return { mu, attack, defense, weight: wsum }
}

export function attackOf(s: Strength, team: string): number {
  return s.attack.get(team) ?? 1
}
export function defenseOf(s: Strength, team: string): number {
  return s.defense.get(team) ?? 1
}
