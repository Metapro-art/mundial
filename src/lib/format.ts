// Helpers de formato para la UI.

/** Convierte una probabilidad 0..1 a porcentaje con 1 decimal: 0.4123 -> "41.2%". */
export function pct(p: number, digits = 1): string {
  return `${(p * 100).toFixed(digits)}%`
}

/** Porcentaje entero: 0.4123 -> "41%". */
export function pct0(p: number): string {
  return `${Math.round(p * 100)}%`
}

/** Cuota decimal a partir de una probabilidad (1/p), o "—" si p<=0. */
export function impliedOdds(p: number): string {
  if (p <= 0) return '—'
  return (1 / p).toFixed(2)
}
