import { poissonVector } from './poisson'
import { MODEL } from './config'
import type { Markets, OverUnder, ScoreLine } from './types'

// Modelo Dixon-Coles: matriz de marcadores Poisson con corrección de
// dependencia para marcadores bajos (parámetro ρ).

export const OU_LINES = [0.5, 1.5, 2.5, 3.5] as const

/**
 * Corrección de Dixon-Coles τ(x,y). Con ρ<0 sube la probabilidad de 0-0 y 1-1
 * y baja la de 1-0 y 0-1 (dependencia observada en marcadores bajos).
 */
export function tau(x: number, y: number, lambdaHome: number, lambdaAway: number, rho: number): number {
  let t = 1
  if (x === 0 && y === 0) t = 1 - lambdaHome * lambdaAway * rho
  else if (x === 0 && y === 1) t = 1 + lambdaHome * rho
  else if (x === 1 && y === 0) t = 1 + lambdaAway * rho
  else if (x === 1 && y === 1) t = 1 - rho
  return t < 0 ? 0 : t // nunca negativo
}

/**
 * Matriz P[i][j] = P(local marca i, visitante marca j), i,j ∈ [0, maxGoals],
 * normalizada para sumar 1.
 */
export function scoreMatrix(
  lambdaHome: number,
  lambdaAway: number,
  rho: number = MODEL.rho,
  maxGoals: number = MODEL.maxGoals,
): number[][] {
  const ph = poissonVector(lambdaHome, maxGoals)
  const pa = poissonVector(lambdaAway, maxGoals)
  const matrix: number[][] = []
  let total = 0
  for (let i = 0; i <= maxGoals; i++) {
    const row = new Array<number>(maxGoals + 1)
    for (let j = 0; j <= maxGoals; j++) {
      const p = ph[i] * pa[j] * tau(i, j, lambdaHome, lambdaAway, rho)
      row[j] = p
      total += p
    }
    matrix.push(row)
  }
  // normaliza
  if (total > 0) {
    for (let i = 0; i <= maxGoals; i++)
      for (let j = 0; j <= maxGoals; j++) matrix[i][j] /= total
  }
  return matrix
}

/** Deriva todos los mercados desde una matriz de marcadores normalizada. */
export function marketsFromMatrix(
  matrix: number[][],
  lambdas: { home: number; away: number },
): Markets {
  const n = matrix.length
  let home = 0
  let draw = 0
  let away = 0
  let bttsYes = 0
  let expHome = 0
  let expAway = 0
  const overCount: number[] = OU_LINES.map(() => 0) // P(total > línea)
  const scores: ScoreLine[] = []

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const p = matrix[i][j]
      if (p === 0) continue
      if (i > j) home += p
      else if (i === j) draw += p
      else away += p
      if (i >= 1 && j >= 1) bttsYes += p
      expHome += i * p
      expAway += j * p
      const total = i + j
      for (let k = 0; k < OU_LINES.length; k++) {
        if (total > OU_LINES[k]) overCount[k] += p
      }
      scores.push({ home: i, away: j, prob: p })
    }
  }

  const overUnder: OverUnder[] = OU_LINES.map((line, k) => ({
    line,
    over: overCount[k],
    under: 1 - overCount[k],
  }))

  const topScores = scores.sort((a, b) => b.prob - a.prob).slice(0, 5)

  return {
    oneXtwo: { home, draw, away },
    overUnder,
    btts: { yes: bttsYes, no: 1 - bttsYes },
    topScores,
    expected: { home: expHome, away: expAway },
    lambdas: { ...lambdas },
  }
}

/** Conveniencia: construye la matriz desde λ y deriva los mercados. */
export function markets(
  lambdaHome: number,
  lambdaAway: number,
  rho: number = MODEL.rho,
  maxGoals: number = MODEL.maxGoals,
): Markets {
  const matrix = scoreMatrix(lambdaHome, lambdaAway, rho, maxGoals)
  return marketsFromMatrix(matrix, { home: lambdaHome, away: lambdaAway })
}
