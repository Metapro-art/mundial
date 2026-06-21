// ---------------------------------------------------------------------------
// Tipos crudos: la forma EXACTA del JSON de openfootball/worldcup.json (2026).
// Verificado contra:
//   https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json
// ---------------------------------------------------------------------------

export interface RawGoal {
  name: string
  minute?: string | number
  score?: [number, number]
  penalty?: boolean
  owngoal?: boolean
}

export interface RawScore {
  ft?: [number, number] // final
  ht?: [number, number] // medio tiempo
}

export interface RawMatch {
  round: string // "Matchday 1".."Matchday 17", "Round of 32"..."Final"
  date: string // "2026-06-11"
  time?: string // "13:00 UTC-6"  (hora local de la sede + offset)
  team1: string // nombre real ("Mexico") o placeholder ("2A", "W74", "3A/B/C/D/F")
  team2: string
  score?: RawScore // ausente => no jugado
  goals1?: RawGoal[]
  goals2?: RawGoal[]
  group?: string // "Group A".."Group L"  (solo fase de grupos)
  ground?: string
}

export interface RawWorldCup {
  name: string
  matches: RawMatch[]
}

// ---------------------------------------------------------------------------
// Tipos normalizados que usa la app.
// ---------------------------------------------------------------------------

export type Stage = 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'third' | 'final'

/** Una "selección" en un partido: o un equipo real conocido, o un placeholder. */
export interface TeamRef {
  /** Texto crudo de openfootball: "Mexico" o "2A"/"W74"/"3A/B/C/D/F". */
  raw: string
  /** true si `raw` corresponde a un equipo real de nuestro registro. */
  known: boolean
  /** Nombre canónico (openfootball) si se conoce; si no, el crudo. */
  name: string
  /** Etiqueta para mostrar: "México" o "2.º A" o "Ganador M74". */
  label: string
  /** Código ISO-2 para flagcdn (ej. "mx", "gb-eng"); null si placeholder. */
  iso2: string | null
  /** Emoji de bandera como respaldo; null si placeholder. */
  emoji: string | null
}

export interface Match {
  id: string
  round: string
  stage: Stage
  /** Letra de grupo "A".."L", o null en eliminatorias. */
  group: string | null
  date: string // fecha de la sede "2026-06-11"
  /** Instante absoluto del saque inicial, o null si no hay hora. */
  kickoff: Date | null
  /** Offset original de la sede en minutos (ej. -360 para UTC-6). */
  venueOffsetMin: number | null
  ground: string | null
  home: TeamRef // team1
  away: TeamRef // team2
  played: boolean
  homeGoals: number | null
  awayGoals: number | null
}

export interface GroupDef {
  letter: string // "A"
  name: string // "Group A"
  teams: string[] // nombres canónicos
}

/** Una fila de la tabla de un grupo (calculada desde los partidos jugados). */
export interface StandingRow {
  team: string // nombre canónico
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
}

export interface WorldCupData {
  name: string
  matches: Match[]
  groups: GroupDef[]
  /** Fuente efectiva de los datos: 'live' (raw.githubusercontent) o 'snapshot'. */
  source: 'live' | 'snapshot'
}

// Una partida histórica del corpus internacional (semilla del modelo).
export interface IntlResult {
  date: string // "2025-06-10"
  home: string // nombre canónico
  away: string
  homeGoals: number
  awayGoals: number
  competition: string // "FIFA World Cup", "Friendly", ...
  neutral: boolean
}
