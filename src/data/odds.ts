// Cliente opcional de cuotas (Fase 3) — OddsPapi free tier (250 req/mes, incluye
// Pinnacle). TODO detrás de variables de entorno: si VITE_ODDS_API_KEY no existe,
// la app funciona igual sin la columna de cuotas. NUNCA se hardcodea la clave.
//
// API verificada (https://oddspapi.io/en/docs):
//   GET https://api.oddspapi.io/v4/odds-by-tournaments
//       ?bookmaker=pinnacle&tournamentIds=...&oddsFormat=decimal&apiKey=...
//   Mercado "101" = 1X2; outcomes 101=local, 102=empate, 103=visitante; price = cuota decimal.
//
// El emparejamiento fiable requiere un mapa nombre->participantId
// (VITE_ODDS_TEAM_IDS), porque los partidos simultáneos no se distinguen por hora.

import type { Match } from './types'

const BASE = 'https://api.oddspapi.io/v4/odds-by-tournaments'
const MARKET_1X2 = '101'
const OUT_HOME = '101'
const OUT_DRAW = '102'
const OUT_AWAY = '103'

const API_KEY = import.meta.env.VITE_ODDS_API_KEY
const BOOKMAKER = (import.meta.env.VITE_ODDS_BOOKMAKER ?? 'pinnacle').toLowerCase()
const TOURNAMENT_IDS = import.meta.env.VITE_ODDS_TOURNAMENT_IDS ?? ''

/** Cuotas decimales 1X2 ya orientadas a NUESTRO local/visitante. */
export interface MatchOdds {
  home: number
  draw: number
  away: number
  bookmaker: string
}

/** Una fixture cruda de OddsPapi, ya parseada a lo que necesitamos. */
export interface FixtureOdds {
  startTimeMs: number
  participant1Id: number
  participant2Id: number
  /** 1X2 relativo a participant1=local, participant2=visitante (o null). */
  oneXtwo: { home: number; draw: number; away: number } | null
}

// --- tipos crudos (defensivos) ---------------------------------------------
interface RawPlayer {
  price?: number
  active?: boolean
}
interface RawOutcome {
  players?: Record<string, RawPlayer>
}
interface RawMarket {
  outcomes?: Record<string, RawOutcome>
}
interface RawBookmaker {
  markets?: Record<string, RawMarket>
}
interface RawFixture {
  participant1Id?: number
  participant2Id?: number
  startTime?: string
  bookmakerOdds?: Record<string, RawBookmaker>
}

function priceOf(market: RawMarket | undefined, outcomeId: string): number | null {
  const p = market?.outcomes?.[outcomeId]?.players?.['0']?.price
  return typeof p === 'number' && p > 1 ? p : null
}

/** Parsea la respuesta cruda de OddsPapi a fixtures con 1X2 (tolerante a fallos). */
export function parseFixtures(raw: unknown, bookmaker = BOOKMAKER): FixtureOdds[] {
  if (!Array.isArray(raw)) return []
  const out: FixtureOdds[] = []
  for (const f of raw as RawFixture[]) {
    const t = f.startTime ? Date.parse(f.startTime) : NaN
    const bk = f.bookmakerOdds?.[bookmaker]
    const m = bk?.markets?.[MARKET_1X2]
    const h = priceOf(m, OUT_HOME)
    const d = priceOf(m, OUT_DRAW)
    const a = priceOf(m, OUT_AWAY)
    out.push({
      startTimeMs: t,
      participant1Id: f.participant1Id ?? -1,
      participant2Id: f.participant2Id ?? -1,
      oneXtwo: h && d && a ? { home: h, draw: d, away: a } : null,
    })
  }
  return out
}

/** Lee el mapa nombre-canónico -> participantId de la variable de entorno. */
export function teamIdMap(): Record<string, number> {
  const raw = import.meta.env.VITE_ODDS_TEAM_IDS
  if (!raw) return {}
  try {
    const obj = JSON.parse(raw) as Record<string, number>
    return obj && typeof obj === 'object' ? obj : {}
  } catch {
    return {}
  }
}

/**
 * Empareja un partido nuestro con su fixture de OddsPapi usando el mapa de IDs,
 * y ORIENTA las cuotas a nuestro local/visitante (OddsPapi puede tener el orden
 * invertido). Devuelve null si no hay datos suficientes.
 */
export function resolveMatchOdds(
  match: Match,
  fixtures: FixtureOdds[],
  ids: Record<string, number>,
  bookmaker = BOOKMAKER,
): MatchOdds | null {
  if (!match.home.known || !match.away.known) return null
  const hid = ids[match.home.name]
  const aid = ids[match.away.name]
  if (hid == null || aid == null) return null

  const fx = fixtures.find(
    (f) =>
      (f.participant1Id === hid && f.participant2Id === aid) ||
      (f.participant1Id === aid && f.participant2Id === hid),
  )
  if (!fx || !fx.oneXtwo) return null

  // orienta: si nuestro local es el participant1 de OddsPapi, el orden coincide;
  // si es el participant2, hay que intercambiar local/visitante.
  const sameOrder = fx.participant1Id === hid
  return {
    home: sameOrder ? fx.oneXtwo.home : fx.oneXtwo.away,
    draw: fx.oneXtwo.draw,
    away: sameOrder ? fx.oneXtwo.away : fx.oneXtwo.home,
    bookmaker,
  }
}

/** ¿Está configurada la integración de cuotas? */
export function oddsEnabled(): boolean {
  return Boolean(API_KEY && TOURNAMENT_IDS)
}

/** Descarga las fixtures con cuotas del Mundial (o [] si no está configurado/falla). */
export async function fetchWorldCupFixtures(signal?: AbortSignal): Promise<FixtureOdds[]> {
  if (!oddsEnabled()) return []
  const url =
    `${BASE}?bookmaker=${encodeURIComponent(BOOKMAKER)}` +
    `&tournamentIds=${encodeURIComponent(TOURNAMENT_IDS)}` +
    `&oddsFormat=decimal&apiKey=${encodeURIComponent(API_KEY!)}`
  try {
    const res = await fetch(url, { signal })
    if (!res.ok) return []
    return parseFixtures(await res.json())
  } catch {
    return []
  }
}
