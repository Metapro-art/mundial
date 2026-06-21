import { useMemo } from 'react'
import type { Match, WorldCupData } from '../data/types'
import { computeStandings, buildTeamRef } from '../data/fixtures'
import { Flag } from './Flag'

function StandingTable({ data, letter }: { data: WorldCupData; letter: string }) {
  const rows = useMemo(
    () => computeStandings(data.matches, letter),
    [data.matches, letter],
  )
  const anyPlayed = rows.some((r) => r.played > 0)

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
      <h3 className="mb-2 px-1 text-sm font-bold text-emerald-300">Grupo {letter}</h3>
      <table className="w-full border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="text-slate-400">
            <th className="py-1 pl-1 text-left font-medium">Equipo</th>
            <th className="w-7 text-center font-medium" title="Partidos jugados">PJ</th>
            <th className="hidden w-7 text-center font-medium sm:table-cell" title="Ganados">G</th>
            <th className="hidden w-7 text-center font-medium sm:table-cell" title="Empatados">E</th>
            <th className="hidden w-7 text-center font-medium sm:table-cell" title="Perdidos">P</th>
            <th className="w-9 text-center font-medium" title="Diferencia de goles">DG</th>
            <th className="w-9 text-center font-semibold text-slate-200" title="Puntos">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const ref = buildTeamRef(r.team)
            // 1.º y 2.º clasifican directo; 3.º puede entrar como mejor tercero.
            const accent =
              i < 2
                ? 'border-l-2 border-emerald-400'
                : i === 2
                  ? 'border-l-2 border-amber-400/70'
                  : 'border-l-2 border-transparent'
            return (
              <tr key={r.team} className={`${accent} odd:bg-white/[0.02]`}>
                <td className="py-1.5 pl-2">
                  <div className="flex items-center gap-2">
                    <Flag team={ref} size="sm" />
                    <span className="truncate text-slate-100">{ref.label}</span>
                  </div>
                </td>
                <td className="text-center tabular-nums text-slate-300">{r.played}</td>
                <td className="hidden text-center tabular-nums text-slate-300 sm:table-cell">{r.won}</td>
                <td className="hidden text-center tabular-nums text-slate-300 sm:table-cell">{r.drawn}</td>
                <td className="hidden text-center tabular-nums text-slate-300 sm:table-cell">{r.lost}</td>
                <td className="text-center tabular-nums text-slate-300">
                  {r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}
                </td>
                <td className="text-center font-bold tabular-nums text-white">{r.points}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {!anyPlayed && (
        <p className="mt-2 px-1 text-[11px] text-slate-500">Aún sin partidos jugados.</p>
      )}
    </div>
  )
}

export function GroupTables({ data }: { data: WorldCupData; onSelect?: (m: Match) => void }) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-1 rounded bg-emerald-400" /> Clasifican (1.º y 2.º)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-1 rounded bg-amber-400/70" /> Mejor 3.º (8 avanzan)
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data.groups.map((g) => (
          <StandingTable key={g.letter} data={data} letter={g.letter} />
        ))}
      </div>
    </div>
  )
}
