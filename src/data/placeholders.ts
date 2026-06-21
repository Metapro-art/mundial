// Traduce los códigos placeholder de openfootball (cuando aún no se conoce el
// rival) a etiquetas legibles en español.
//
// Códigos observados en worldcup.json 2026:
//   "1A".."1L"  -> ganador de grupo            -> "1.º A"
//   "2A".."2L"  -> segundo de grupo            -> "2.º A"
//   "3A/B/C/D/F" -> mejor tercero de ese grupo de candidatos -> "Mejor 3.º (A/B/C/D/F)"
//   "W73".."W102" -> ganador del partido N      -> "Ganador M73"
//   "L101","L102" -> perdedor del partido N      -> "Perdedor M101"

export function placeholderLabel(raw: string): string {
  let m: RegExpMatchArray | null

  m = raw.match(/^([12])([A-L])$/)
  if (m) return `${m[1]}.º ${m[2]}`

  m = raw.match(/^3([A-L](?:\/[A-L])*)$/)
  if (m) return `Mejor 3.º (${m[1]})`

  m = raw.match(/^W(\d+)$/)
  if (m) return `Ganador M${m[1]}`

  m = raw.match(/^L(\d+)$/)
  if (m) return `Perdedor M${m[1]}`

  return raw // desconocido: mostrar tal cual
}
