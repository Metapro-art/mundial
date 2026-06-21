import { useMemo } from 'react'
import type { Match } from '../data/types'
import { MatchCard } from './MatchCard'
import { formatDateHeading } from '../lib/time'

function sortKey(m: Match): number {
  return m.kickoff ? m.kickoff.getTime() : new Date(m.date).getTime()
}

export function MatchList({
  matches,
  onSelect,
}: {
  matches: Match[]
  onSelect: (m: Match) => void
}) {
  // Agrupa por fecha de la sede; ordena días y partidos cronológicamente.
  const byDate = useMemo(() => {
    const groups = new Map<string, Match[]>()
    for (const m of matches) {
      const arr = groups.get(m.date) ?? []
      arr.push(m)
      groups.set(m.date, arr)
    }
    return [...groups.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, ms]) => ({ date, matches: ms.sort((x, y) => sortKey(x) - sortKey(y)) }))
  }, [matches])

  if (matches.length === 0) {
    return (
      <p className="py-12 text-center text-slate-400">No hay partidos para mostrar.</p>
    )
  }

  return (
    <div className="space-y-6">
      {byDate.map(({ date, matches: dayMatches }) => (
        <section key={date}>
          <h3 className="sticky top-0 z-10 -mx-1 mb-2 bg-pitch-950/90 px-1 py-1 text-sm font-semibold text-emerald-300 backdrop-blur">
            {formatDateHeading(date)}
          </h3>
          <div className="space-y-2">
            {dayMatches.map((m) => (
              <MatchCard key={m.id} match={m} onSelect={onSelect} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
