// Clasificación de la importancia de un partido a partir del nombre del torneo
// (cadenas de martj42/international_results). Se usa tanto para el K de Elo
// (elo.ts) como para el peso de importancia en las fuerzas (strength.ts).

export type CompetitionTier =
  | 'worldCup'
  | 'continentalFinals'
  | 'qualifier'
  | 'nationsLeague'
  | 'friendly'
  | 'default'

export function classifyCompetition(tournament: string): CompetitionTier {
  const t = tournament.toLowerCase()
  if (t.includes('world cup') && t.includes('qualif')) return 'qualifier'
  if (t.includes('world cup')) return 'worldCup'
  if (t.includes('qualif')) return 'qualifier'
  if (t.includes('nations league')) return 'nationsLeague'
  if (t.includes('friendly')) return 'friendly'
  if (
    t.includes('euro') ||
    t.includes('copa am') || // Copa América
    t.includes('cup of nations') || // African Cup of Nations
    t.includes('asian cup') ||
    t.includes('gold cup') ||
    t.includes('confederations')
  )
    return 'continentalFinals'
  return 'default'
}
