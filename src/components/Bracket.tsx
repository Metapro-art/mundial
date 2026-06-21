import type { Match, Stage } from '../data/types'
import { Flag } from './Flag'
import { formatLocalDateTime } from '../lib/time'

const COLUMNS: { stage: Stage; title: string }[] = [
  { stage: 'r32', title: 'Dieciseisavos' },
  { stage: 'r16', title: 'Octavos' },
  { stage: 'qf', title: 'Cuartos' },
  { stage: 'sf', title: 'Semifinales' },
  { stage: 'final', title: 'Final' },
]

function TeamRow({
  match,
  side,
}: {
  match: Match
  side: 'home' | 'away'
}) {
  const team = side === 'home' ? match.home : match.away
  const goals = side === 'home' ? match.homeGoals : match.awayGoals
  const otherGoals = side === 'home' ? match.awayGoals : match.homeGoals
  const winner =
    match.played && goals != null && otherGoals != null && goals > otherGoals
  return (
    <div className="flex items-center gap-2 py-1">
      <Flag team={team} size="sm" />
      <span
        className={`min-w-0 flex-1 truncate text-xs ${
          team.known ? 'text-slate-100' : 'italic text-slate-400'
        } ${winner ? 'font-bold text-emerald-300' : ''}`}
      >
        {team.label}
      </span>
      {match.played && (
        <span className="tabular-nums text-xs font-semibold text-slate-200">{goals}</span>
      )}
    </div>
  )
}

function BracketMatch({ match, onSelect }: { match: Match; onSelect: (m: Match) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(match)}
      className="w-full rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1.5 text-left transition hover:border-emerald-400/40 hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
    >
      <TeamRow match={match} side="home" />
      <div className="h-px bg-white/5" />
      <TeamRow match={match} side="away" />
      <div className="mt-1 truncate text-[10px] text-slate-500">
        {match.kickoff ? formatLocalDateTime(match.kickoff) : match.date}
      </div>
    </button>
  )
}

export function Bracket({
  matches,
  onSelect,
}: {
  matches: Match[]
  onSelect: (m: Match) => void
}) {
  const byStage = (stage: Stage) =>
    matches.filter((m) => m.stage === stage).sort((a, b) => a.date.localeCompare(b.date))
  const third = byStage('third')

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400">
        Avanzan 2 por grupo + los 8 mejores terceros. Los rivales aún no definidos se
        muestran como <span className="italic text-slate-300">1.º A</span>,{' '}
        <span className="italic text-slate-300">Mejor 3.º</span> o{' '}
        <span className="italic text-slate-300">Ganador M…</span>.
      </p>
      <div className="no-scrollbar overflow-x-auto pb-2">
        <div className="flex min-w-max gap-3">
          {COLUMNS.map(({ stage, title }) => {
            const col = byStage(stage)
            return (
              <div key={stage} className="w-52 shrink-0 space-y-2">
                <h3 className="px-1 text-xs font-bold uppercase tracking-wide text-emerald-300">
                  {title}
                </h3>
                {col.map((m) => (
                  <BracketMatch key={m.id} match={m} onSelect={onSelect} />
                ))}
                {/* el partido por el 3.º puesto va junto a la final */}
                {stage === 'final' && third.length > 0 && (
                  <div className="pt-2">
                    <h3 className="px-1 text-xs font-bold uppercase tracking-wide text-amber-300/80">
                      3.º puesto
                    </h3>
                    {third.map((m) => (
                      <BracketMatch key={m.id} match={m} onSelect={onSelect} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
