/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Clave de OddsPapi (Fase 3). Si no existe, la app funciona sin cuotas. */
  readonly VITE_ODDS_API_KEY?: string
  /** Casa de apuestas a usar (por defecto "pinnacle"). */
  readonly VITE_ODDS_BOOKMAKER?: string
  /** IDs de torneo de OddsPapi (coma-separados) del Mundial 2026. */
  readonly VITE_ODDS_TOURNAMENT_IDS?: string
  /**
   * Mapa JSON nombre-canónico -> participantId de OddsPapi, p.ej.
   * {"Argentina": 12, "France": 7}. Necesario para emparejar de forma fiable
   * (los partidos simultáneos no se pueden distinguir solo por la hora).
   */
  readonly VITE_ODDS_TEAM_IDS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
