import type { Match } from '../data/types'
import { Flag } from './Flag'
import { formatLocalTime } from '../lib/time'

function TeamSide({ match, side }: { match: Match; side: 'home' | 'away' }) {
  const team = side === 'home' ? match.home : match.away
  const reverse = side === 'away'
  return (
    <div
      className={`flex min-w-0 items-center gap-2 ${
        reverse ? 'flex-row-reverse text-right' : 'text-left'
      }`}
    >
      <Flag team={team} />
      <span
        className={`truncate text-sm sm:text-base ${
          team.known ? 'font-medium text-slate-100' : 'italic text-slate-400'
        }`}
      >
        {team.label}
      </span>
    </div>
  )
}

function Center({ match }: { match: Match }) {
  if (match.played && match.homeGoals != null && match.awayGoals != null) {
    return (
      <div className="flex flex-col items-center">
        <span className="rounded-md bg-white/10 px-2 py-0.5 text-base font-bold tabular-nums text-white">
          {match.homeGoals} <span className="text-slate-500">–</span> {match.awayGoals}
        </span>
        <span className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-500">final</span>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center">
      <span className="text-sm font-semibold tabular-nums text-emerald-300">
        {match.kickoff ? formatLocalTime(match.kickoff) : '—'}
      </span>
      <span className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-500">
        {match.group ? `Grupo ${match.group}` : roundShort(match.round)}
      </span>
    </div>
  )
}

function roundShort(round: string): string {
  const map: Record<string, string> = {
    'Round of 32': '16avos',
    'Round of 16': 'Octavos',
    'Quarter-final': 'Cuartos',
    'Semi-final': 'Semis',
    'Match for third place': '3.º puesto',
    Final: 'Final',
  }
  return map[round] ?? round
}

export function MatchCard({ match, onSelect }: { match: Match; onSelect: (m: Match) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(match)}
      className="group grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-3 text-left transition hover:border-emerald-400/40 hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 sm:gap-4 sm:px-4"
    >
      <TeamSide match={match} side="home" />
      <Center match={match} />
      <TeamSide match={match} side="away" />
    </button>
  )
}
