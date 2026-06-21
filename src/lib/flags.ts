// Banderas vía https://flagcdn.com (gratis, sin key).
// Usa códigos ISO-3166-1 alfa-2 en minúscula; soporta subdivisiones del
// Reino Unido como "gb-eng" (Inglaterra) y "gb-sct" (Escocia).

export type FlagWidth = 20 | 40 | 80 | 160 | 320 | 640

/** URL PNG de una bandera para un código ISO-2 dado. */
export function flagUrl(iso2: string, width: FlagWidth = 80): string {
  return `https://flagcdn.com/w${width}/${iso2}.png`
}

/** `srcset` retina (1x/2x) para una bandera. */
export function flagSrcSet(iso2: string, width: FlagWidth = 80): string {
  const widths: FlagWidth[] = [20, 40, 80, 160, 320, 640]
  const i = widths.indexOf(width)
  const x2 = widths[Math.min(i + 1, widths.length - 1)]
  return `${flagUrl(iso2, width)} 1x, ${flagUrl(iso2, x2)} 2x`
}
