import intlResults from '../data/intl_results.json'
import type { IntlResult } from '../data/types'
import { computeElo, getRating, type EloRatings } from './elo'
import { computeStrength, attackOf, defenseOf, type Strength } from './strength'
import { markets } from './dixoncoles'
import { MODEL } from './config'
import { absenceImpact, adjustLambdas, getAbsences } from './absences'
import type { Prediction } from './types'

export * from './types'
export { updateElo, computeElo, getRating } from './elo'
export { getAbsences, absenceImpact } from './absences'
export { MODEL } from './config'

const CORPUS = intlResults as IntlResult[]
const HOSTS = new Set<string>(MODEL.hosts)

export interface Model {
  elo: EloRatings
  strength: Strength
  /** Fecha del partido más reciente usado (corpus + extras). */
  refDate: string
  matchCount: number
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x))
}

/**
 * Construye el modelo desde el corpus histórico. `extra` permite añadir
 * partidos del Mundial ya cerrados que sean MÁS NUEVOS que el corpus (para no
 * duplicar: el corpus de martj42 ya incluye los partidos jugados hasta su
 * fecha de corte).
 */
export function buildModel(extra: IntlResult[] = []): Model {
  const all = extra.length ? [...CORPUS, ...extra] : CORPUS
  const refDate = all.reduce((mx, r) => (r.date > mx ? r.date : mx), '0000-00-00')
  return {
    elo: computeElo(all),
    strength: computeStrength(all, refDate),
    refDate,
    matchCount: all.length,
  }
}

export interface PredictOptions {
  /** Si true, ignora la ventaja de localía (fuerza sede neutral). */
  neutral?: boolean
}

/** Predice todos los mercados de un partido entre dos selecciones conocidas. */
export function predictMatch(
  model: Model,
  home: string,
  away: string,
  opts: PredictOptions = {},
): Prediction {
  const s = model.strength
  const mu = s.mu

  // 1) λ desde las fuerzas ataque/defensa
  let lamH = mu * attackOf(s, home) * defenseOf(s, away)
  let lamA = mu * attackOf(s, away) * defenseOf(s, home)

  // 2) reparto por Elo: mantenemos el total de goles de las fuerzas pero
  //    ajustamos la diferencia (supremacía) según el Elo, que es más estable.
  const eH = getRating(model.elo, home)
  const eA = getRating(model.elo, away)
  const supremacy = clamp(
    (eH - eA) * MODEL.supremacyPerElo,
    -MODEL.supremacyCap,
    MODEL.supremacyCap,
  )
  const total = lamH + lamA
  const lamHElo = Math.max(MODEL.minLambda, (total + supremacy) / 2)
  const lamAElo = Math.max(MODEL.minLambda, (total - supremacy) / 2)

  const w = MODEL.eloBlend
  lamH = (1 - w) * lamH + w * lamHElo
  lamA = (1 - w) * lamA + w * lamAElo

  // 3) ventaja de localía SOLO para anfitriones (resto: sedes neutrales)
  let hostAdvantage: 'home' | 'away' | null = null
  const homeHost = !opts.neutral && HOSTS.has(home)
  const awayHost = !opts.neutral && HOSTS.has(away)
  if (homeHost && !awayHost) {
    lamH *= MODEL.hostAttackMult
    lamA *= MODEL.hostOpponentMult
    hostAdvantage = 'home'
  } else if (awayHost && !homeHost) {
    lamA *= MODEL.hostAttackMult
    lamH *= MODEL.hostOpponentMult
    hostAdvantage = 'away'
  }

  // 4) ajuste manual opcional por ausencias (lesiones/suspensiones).
  //    Reduce el ataque del equipo afectado y/o debilita su defensa (el rival
  //    marca más). Si absences.json está vacío, los impactos son 0 y no cambia nada.
  const absHome = absenceImpact(home)
  const absAway = absenceImpact(away)
  ;[lamH, lamA] = adjustLambdas(lamH, lamA, absHome, absAway)

  lamH = Math.max(MODEL.minLambda, lamH)
  lamA = Math.max(MODEL.minLambda, lamA)

  return {
    ...markets(lamH, lamA),
    home,
    away,
    elo: { home: eH, away: eA },
    hostAdvantage,
    absences: { home: getAbsences(home), away: getAbsences(away) },
  }
}

/** Número de partidos en el corpus empaquetado (sin extras). */
export const CORPUS_SIZE = CORPUS.length
