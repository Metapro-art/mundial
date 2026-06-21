import type {
  GroupDef,
  IntlResult,
  Match,
  RawMatch,
  RawWorldCup,
  Stage,
  StandingRow,
  TeamRef,
  WorldCupData,
} from './types'
import { TEAMS, getTeam, toCanonical } from './teams'
import { placeholderLabel } from './placeholders'
import { parseKickoff } from '../lib/time'
import snapshot from './worldcup.snapshot.json'

// Fuente en vivo (sin key, CORS abierto en raw.githubusercontent.com).
const LIVE_URL =
  'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json'

// ---------------------------------------------------------------------------
// Normalización cruda -> tipos de la app
// ---------------------------------------------------------------------------

function stageFromRound(round: string): Stage {
  if (round.startsWith('Matchday')) return 'group'
  switch (round) {
    case 'Round of 32':
      return 'r32'
    case 'Round of 16':
      return 'r16'
    case 'Quarter-final':
      return 'qf'
    case 'Semi-final':
      return 'sf'
    case 'Match for third place':
      return 'third'
    case 'Final':
      return 'final'
    default:
      // openfootball a veces usa "Round of 16" etc; cualquier otra cosa la
      // tratamos como eliminatoria genérica.
      return 'r32'
  }
}

export function buildTeamRef(raw: string): TeamRef {
  const canon = toCanonical(raw)
  if (canon) {
    const info = getTeam(canon)!
    return {
      raw,
      known: true,
      name: canon,
      label: info.es,
      iso2: info.iso2,
      emoji: info.emoji,
    }
  }
  return {
    raw,
    known: false,
    name: raw,
    label: placeholderLabel(raw),
    iso2: null,
    emoji: null,
  }
}

function groupLetter(rawGroup?: string): string | null {
  if (!rawGroup) return null
  const m = rawGroup.match(/Group\s+([A-L])/i)
  return m ? m[1].toUpperCase() : null
}

function normalizeMatch(raw: RawMatch, idx: number): Match {
  const { instant, offsetMin } = parseKickoff(raw.date, raw.time)
  const ft = raw.score?.ft
  const played = Array.isArray(ft) && ft.length === 2
  return {
    id: String(idx),
    round: raw.round,
    stage: stageFromRound(raw.round),
    group: groupLetter(raw.group),
    date: raw.date,
    kickoff: instant,
    venueOffsetMin: offsetMin,
    ground: raw.ground ?? null,
    home: buildTeamRef(raw.team1),
    away: buildTeamRef(raw.team2),
    played,
    homeGoals: played ? ft![0] : null,
    awayGoals: played ? ft![1] : null,
  }
}

/** Los 12 grupos (A..L) derivados del registro de equipos. */
export function buildGroups(): GroupDef[] {
  const letters = [...new Set(TEAMS.map((t) => t.group))].sort()
  return letters.map((letter) => ({
    letter,
    name: `Group ${letter}`,
    teams: TEAMS.filter((t) => t.group === letter).map((t) => t.name),
  }))
}

function toWorldCupData(raw: RawWorldCup, source: 'live' | 'snapshot'): WorldCupData {
  return {
    name: raw.name,
    matches: raw.matches.map(normalizeMatch),
    groups: buildGroups(),
    source,
  }
}

// ---------------------------------------------------------------------------
// Carga: intenta en vivo y cae al snapshot empaquetado.
// ---------------------------------------------------------------------------

export async function loadWorldCup(signal?: AbortSignal): Promise<WorldCupData> {
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 7000)
    signal?.addEventListener('abort', () => ctrl.abort())
    const res = await fetch(LIVE_URL, { signal: ctrl.signal })
    clearTimeout(timer)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = (await res.json()) as RawWorldCup
    if (!json?.matches?.length) throw new Error('respuesta sin partidos')
    return toWorldCupData(json, 'live')
  } catch {
    // Sin red / bloqueado / formato raro: usamos la copia empaquetada.
    return toWorldCupData(snapshot as RawWorldCup, 'snapshot')
  }
}

/** Carga sincrónica solo del snapshot (útil en tests y SSR). */
export function loadWorldCupSnapshot(): WorldCupData {
  return toWorldCupData(snapshot as RawWorldCup, 'snapshot')
}

// ---------------------------------------------------------------------------
// Tablas de grupos a partir de los partidos jugados
// ---------------------------------------------------------------------------

export function computeStandings(matches: Match[], groupLetterArg: string): StandingRow[] {
  const groupTeams = TEAMS.filter((t) => t.group === groupLetterArg).map((t) => t.name)
  const rows = new Map<string, StandingRow>()
  for (const team of groupTeams) {
    rows.set(team, {
      team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
    })
  }

  for (const m of matches) {
    if (m.stage !== 'group' || m.group !== groupLetterArg) continue
    if (!m.played || m.homeGoals == null || m.awayGoals == null) continue
    const h = rows.get(m.home.name)
    const a = rows.get(m.away.name)
    if (!h || !a) continue
    h.played++
    a.played++
    h.goalsFor += m.homeGoals
    h.goalsAgainst += m.awayGoals
    a.goalsFor += m.awayGoals
    a.goalsAgainst += m.homeGoals
    if (m.homeGoals > m.awayGoals) {
      h.won++
      h.points += 3
      a.lost++
    } else if (m.homeGoals < m.awayGoals) {
      a.won++
      a.points += 3
      h.lost++
    } else {
      h.drawn++
      a.drawn++
      h.points++
      a.points++
    }
  }

  for (const r of rows.values()) r.goalDiff = r.goalsFor - r.goalsAgainst

  return [...rows.values()].sort(
    (x, y) =>
      y.points - x.points ||
      y.goalDiff - x.goalDiff ||
      y.goalsFor - x.goalsFor ||
      x.team.localeCompare(y.team),
  )
}

/**
 * Partidos del Mundial ya jugados (entre equipos conocidos) con fecha
 * ESTRICTAMENTE posterior a `afterDate`, convertidos al formato del corpus.
 * Sirve para refrescar el modelo con resultados más nuevos que el corpus
 * empaquetado sin duplicar los que ya están en él.
 *
 * Se marcan como `neutral: true` a propósito: el JSON de openfootball no
 * codifica el PAÍS de la sede (solo el nombre del estadio), así que inferir la
 * localía desde el orden team1/team2 atribuiría mal la ventaja (un anfitrión
 * listado como visitante jugando en casa, o como local jugando en otro país
 * anfitrión en eliminatorias). La ventaja de localía del Mundial ya se modela
 * por identidad en `predictMatch` (solo anfitriones); aquí, para la
 * actualización marginal de Elo con resultados nuevos, usamos sede neutral
 * para no sesgar el rating en la dirección equivocada.
 */
export function playedResultsAfter(matches: Match[], afterDate: string): IntlResult[] {
  return matches
    .filter(
      (m) =>
        m.played &&
        m.home.known &&
        m.away.known &&
        m.homeGoals != null &&
        m.awayGoals != null &&
        m.date > afterDate,
    )
    .map((m) => ({
      date: m.date,
      home: m.home.name,
      away: m.away.name,
      homeGoals: m.homeGoals!,
      awayGoals: m.awayGoals!,
      competition: 'FIFA World Cup',
      neutral: true,
    }))
}
