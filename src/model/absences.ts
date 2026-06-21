import absencesJson from '../data/absences.json'
import { toCanonical } from '../data/teams'
import { MODEL } from './config'
import type { Absence, AbsenceImpact, AbsencesFile } from './types'

export type { Absence, AbsenceImpact } from './types'

// Ajuste manual opcional por ausencias (lesiones/suspensiones), declarado en
// src/data/absences.json. Si el archivo está vacío ({}), no afecta nada.
//
//   attack  -> reduce el ataque del equipo:          λ_equipo *= (1 - attack)
//   defense -> debilita su defensa (concede más):    λ_rival  *= (1 + defense)

const RAW = absencesJson as AbsencesFile

// Indexa por nombre canónico (acepta "France" o "Francia" como clave).
const byTeam = new Map<string, Absence[]>()
for (const [key, list] of Object.entries(RAW)) {
  if (!Array.isArray(list) || list.length === 0) continue
  const canon = toCanonical(key) ?? key
  byTeam.set(canon, [...(byTeam.get(canon) ?? []), ...list])
}

export function getAbsences(team: string): Absence[] {
  return byTeam.get(team) ?? []
}

/** Suma (y limita) el impacto de una lista de ausencias. Función pura. */
export function combineAbsences(list: Absence[]): AbsenceImpact {
  let attack = 0
  let defense = 0
  for (const a of list) {
    attack += Math.max(0, a.attack ?? 0)
    defense += Math.max(0, a.defense ?? 0)
  }
  const cap = MODEL.absenceMaxImpact
  return { attack: Math.min(cap, attack), defense: Math.min(cap, defense) }
}

export function absenceImpact(team: string): AbsenceImpact {
  return combineAbsences(getAbsences(team))
}

/**
 * Aplica las ausencias a los λ finales de un partido. Función pura.
 * `absHome`/`absAway` son los impactos de cada equipo.
 */
export function adjustLambdas(
  lambdaHome: number,
  lambdaAway: number,
  absHome: AbsenceImpact,
  absAway: AbsenceImpact,
): [number, number] {
  return [
    lambdaHome * (1 - absHome.attack) * (1 + absAway.defense),
    lambdaAway * (1 - absAway.attack) * (1 + absHome.defense),
  ]
}
