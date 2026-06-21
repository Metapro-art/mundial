// Distribución de Poisson (en forma logarítmica para evitar overflow).

const logFactCache: number[] = [0, 0]

export function logFactorial(n: number): number {
  if (n < 2) return 0
  for (let i = logFactCache.length; i <= n; i++) {
    logFactCache[i] = logFactCache[i - 1] + Math.log(i)
  }
  return logFactCache[n]
}

/** P(X = k) para X ~ Poisson(λ). */
export function poissonPmf(lambda: number, k: number): number {
  if (k < 0 || !Number.isInteger(k)) return 0
  if (lambda <= 0) return k === 0 ? 1 : 0
  // exp(-λ) · λ^k / k!
  return Math.exp(-lambda + k * Math.log(lambda) - logFactorial(k))
}

/** Vector [P(0), P(1), …, P(maxGoals)] para Poisson(λ). */
export function poissonVector(lambda: number, maxGoals: number): number[] {
  const v = new Array<number>(maxGoals + 1)
  for (let k = 0; k <= maxGoals; k++) v[k] = poissonPmf(lambda, k)
  return v
}
