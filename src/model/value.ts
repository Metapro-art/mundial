// Valor / edge a partir de cuotas (Fase 3).
//
// Quita el margen (vig) de las cuotas decimales del mercado y compara la
// probabilidad implícita resultante con la del modelo:  edge = p_modelo − p_implícita.
// Si no hay cuotas, la app funciona igual sin esta columna.

/** Probabilidades implícitas SIN vig (normalizadas) a partir de cuotas decimales. */
export function devig(decimalOdds: number[]): number[] {
  const raw = decimalOdds.map((o) => (o > 0 ? 1 / o : 0))
  const overround = raw.reduce((s, p) => s + p, 0)
  if (overround <= 0) return raw.map(() => 0)
  return raw.map((p) => p / overround)
}

export interface EdgeRow {
  /** Probabilidad del modelo (0..1). */
  model: number
  /** Probabilidad implícita sin vig (0..1). */
  implied: number
  /** edge = model − implied. Positivo => valor a favor. */
  edge: number
}

/** Empareja prob. del modelo con prob. implícita (mismo orden de resultados). */
export function edges(modelProbs: number[], decimalOdds: number[]): EdgeRow[] {
  const implied = devig(decimalOdds)
  return modelProbs.map((model, i) => ({
    model,
    implied: implied[i] ?? 0,
    edge: model - (implied[i] ?? 0),
  }))
}
