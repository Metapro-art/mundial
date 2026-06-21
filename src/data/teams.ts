import teamsJson from './teams.json'

export interface TeamInfo {
  name: string // canónico (openfootball)
  es: string // nombre en español para la UI
  iso2: string // código flagcdn ("mx", "gb-eng")
  fifa: string // código FIFA de 3 letras
  emoji: string
  group: string // "A".."L"
  confed: string
  aliases: string[]
}

export const TEAMS: TeamInfo[] = teamsJson as TeamInfo[]

/** Normaliza un nombre a una clave comparable: sin acentos, sin signos, minúsculas. */
export function normKey(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita diacríticos
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // quita espacios y puntuación
}

const byCanonical = new Map<string, TeamInfo>()
const byKey = new Map<string, TeamInfo>() // alias/nombre normalizado -> info

for (const t of TEAMS) {
  byCanonical.set(t.name, t)
  for (const variant of [t.name, t.es, ...t.aliases]) {
    byKey.set(normKey(variant), t)
  }
}

/** Devuelve la info del equipo por nombre canónico exacto. */
export function getTeam(name: string): TeamInfo | undefined {
  return byCanonical.get(name)
}

/**
 * Resuelve cualquier variante (canónico, español, alias, otra fuente) al
 * nombre canónico de openfootball. Devuelve undefined si no se reconoce.
 */
export function toCanonical(raw: string): string | undefined {
  const direct = byCanonical.get(raw)
  if (direct) return direct.name
  const viaKey = byKey.get(normKey(raw))
  return viaKey?.name
}
