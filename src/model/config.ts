// Parámetros del modelo. Todos centralizados y documentados para poder
// calibrarlos sin tocar la lógica.

export const MODEL = {
  // --- Fuerza ataque/defensa (strength.ts) ---
  /** Half-life del decaimiento temporal: un partido de hace 12 meses pesa 0.5. */
  halfLifeMonths: 12,
  /** Partidos "previos" hacia la media (shrinkage) para selecciones con pocos datos. */
  priorGames: 4,

  // --- Elo (elo.ts) ---
  eloInitial: 1500,
  /** Ventaja de localía en puntos Elo cuando el partido NO es en cancha neutral. */
  eloHomeAdvantage: 100,
  /** K base por importancia del partido. */
  kBase: {
    worldCup: 60,
    continentalFinals: 50,
    qualifier: 40,
    nationsLeague: 40,
    friendly: 20,
    default: 30,
  },

  // --- Mezcla Elo ↔ goles y localía del Mundial (index.ts) ---
  /** Peso del split por Elo al repartir los goles esperados (0..1). */
  eloBlend: 0.6,
  /** Goles de "supremacía" por punto Elo de diferencia (100 Elo ≈ 0.4 goles). */
  supremacyPerElo: 0.004,
  /** Tope de supremacía en goles (evita extremos). */
  supremacyCap: 3.0,
  /** Anfitriones del Mundial 2026 (única localía aplicada). */
  hosts: ['USA', 'Canada', 'Mexico'] as const,
  /** Multiplicador al λ del anfitrión (ataque). */
  hostAttackMult: 1.15,
  /** Multiplicador al λ del rival del anfitrión (su ataque baja un poco). */
  hostOpponentMult: 0.92,

  // --- Dixon-Coles (dixoncoles.ts) ---
  /** Corrección de marcadores bajos. ρ<0 infla empates 0-0/1-1. */
  rho: -0.08,
  /** Goles máximos por equipo en la matriz (0..maxGoals). */
  maxGoals: 10,
  /** λ mínimo para no degenerar. */
  minLambda: 0.05,
} as const

export type Hosts = (typeof MODEL.hosts)[number]
