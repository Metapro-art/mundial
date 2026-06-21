/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Clave opcional de OddsPapi (fase 3). Si no existe, la app funciona sin cuotas. */
  readonly VITE_ODDS_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
