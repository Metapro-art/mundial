// Parseo y formato de horarios.
//
// openfootball entrega `date` ("2026-06-11") y `time` ("13:00 UTC-6"),
// es decir la hora LOCAL de la sede más su offset UTC. Convertimos eso a un
// instante absoluto (Date) y luego lo mostramos en la zona horaria del usuario.

export interface Kickoff {
  /** Instante absoluto del saque, o null si no se pudo parsear. */
  instant: Date | null
  /** Offset de la sede en minutos (ej. -360 para UTC-6), o null. */
  offsetMin: number | null
}

const TIME_RE = /^(\d{1,2}):(\d{2})\s*UTC([+-]\d{1,2})(?::(\d{2}))?$/

/** Convierte (date, time) de openfootball a un instante absoluto. */
export function parseKickoff(date: string, time?: string): Kickoff {
  const dm = date.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!dm) return { instant: null, offsetMin: null }
  const [, ys, mos, ds] = dm
  const y = Number(ys)
  const mo = Number(mos)
  const d = Number(ds)

  if (!time) return { instant: null, offsetMin: null }
  const tm = time.trim().match(TIME_RE)
  if (!tm) return { instant: null, offsetMin: null }

  const hh = Number(tm[1])
  const mm = Number(tm[2])
  const offH = Number(tm[3])
  const offExtraMin = tm[4] ? Number(tm[4]) : 0
  const sign = offH < 0 ? -1 : 1
  const offsetMin = sign * (Math.abs(offH) * 60 + offExtraMin)

  // hora_sede = UTC + offset  =>  UTC = hora_sede - offset
  const utcMs = Date.UTC(y, mo - 1, d, hh, mm) - offsetMin * 60_000
  return { instant: new Date(utcMs), offsetMin }
}

const LOCALE = 'es'

/** Hora local del usuario, ej. "19:00". */
export function formatLocalTime(d: Date): string {
  return d.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' })
}

/** Fecha + hora local, ej. "jue 11 jun, 19:00". */
export function formatLocalDateTime(d: Date): string {
  return d.toLocaleString(LOCALE, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Encabezado de día a partir de la fecha de la sede, ej. "jueves, 11 de junio". */
export function formatDateHeading(dateStr: string): string {
  const dm = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!dm) return dateStr
  const d = new Date(Number(dm[1]), Number(dm[2]) - 1, Number(dm[3]))
  const s = d.toLocaleDateString(LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Nombre de la zona horaria del usuario, ej. "America/Bogota". */
export function localTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'tu zona local'
  }
}
