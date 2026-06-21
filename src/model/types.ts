export interface OneXTwo {
  home: number
  draw: number
  away: number
}

export interface OverUnder {
  line: number // 0.5, 1.5, 2.5, 3.5
  over: number
  under: number
}

export interface Btts {
  yes: number
  no: number
}

export interface ScoreLine {
  home: number
  away: number
  prob: number
}

export interface Markets {
  oneXtwo: OneXTwo
  overUnder: OverUnder[]
  btts: Btts
  topScores: ScoreLine[]
  /** Goles esperados (media de la matriz). */
  expected: { home: number; away: number }
  /** λ usados para construir la matriz. */
  lambdas: { home: number; away: number }
}

export interface Prediction extends Markets {
  home: string
  away: string
  elo: { home: number; away: number }
  /** Qué lado recibió ventaja de localía (anfitrión), si alguno. */
  hostAdvantage: 'home' | 'away' | null
}
