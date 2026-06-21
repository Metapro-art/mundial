import { useEffect, type ReactNode } from 'react'
import type { Match } from '../data/types'
import { Flag } from './Flag'
import { formatLocalDateTime, localTimezone } from '../lib/time'

const ROUND_ES: Record<string, string> = {
  'Round of 32': 'Dieciseisavos de final',
  'Round of 16': 'Octavos de final',
  'Quarter-final': 'Cuartos de final',
  'Semi-final': 'Semifinal',
  'Match for third place': 'Partido por el 3.er puesto',
  Final: 'Final',
}

function roundLabel(m: Match): string {
  if (m.group) return `Grupo ${m.group}`
  return ROUND_ES[m.round] ?? m.round
}

function Side({ match, side }: { match: Match; side: 'home' | 'away' }) {
  const team = side === 'home' ? match.home : match.away
  return (
    <div className="flex flex-1 flex-col items-center gap-2 text-center">
      <Flag team={team} size="lg" />
      <span
        className={`text-sm font-semibold ${team.known ? 'text-slate-100' : 'italic text-slate-400'}`}
      >
        {team.label}
      </span>
    </div>
  )
}

export function MatchPanel({
  match,
  onClose,
  children,
}: {
  match: Match
  onClose: () => void
  children?: ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const score =
    match.played && match.homeGoals != null && match.awayGoals != null
      ? `${match.homeGoals} – ${match.awayGoals}`
      : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-white/10 bg-pitch-900 shadow-2xl sm:max-w-lg sm:rounded-2xl"
      >
        {/* Encabezado */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-pitch-900/95 px-4 py-3 backdrop-blur">
          <div className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
            {roundLabel(match)}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-md p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Enfrentamiento */}
        <div className="flex items-center gap-3 px-4 py-5">
          <Side match={match} side="home" />
          <div className="flex shrink-0 flex-col items-center">
            {score ? (
              <span className="text-2xl font-extrabold tabular-nums text-white">{score}</span>
            ) : (
              <span className="text-lg font-bold tabular-nums text-emerald-300">
                {match.kickoff ? formatLocalDateTime(match.kickoff) : match.date}
              </span>
            )}
            <span className="mt-1 text-[10px] uppercase tracking-wide text-slate-500">
              {score ? 'Final' : 'vs'}
            </span>
          </div>
          <Side match={match} side="away" />
        </div>

        {/* Metadatos */}
        <div className="border-t border-white/10 px-4 py-3 text-xs text-slate-400">
          {match.ground && <div>📍 {match.ground}</div>}
          {!score && match.kickoff && (
            <div className="mt-1">🕑 Hora mostrada en {localTimezone()}</div>
          )}
        </div>

        {/* Mercados / probabilidades (Fase 2) */}
        <div className="border-t border-white/10 px-4 py-4">{children}</div>
      </div>
    </div>
  )
}
