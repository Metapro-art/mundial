import { pct } from '../lib/format'

/** Barra simple etiqueta + % (para 1X2 y marcadores). */
export function MarketBar({
  label,
  value,
  highlight = false,
  sub,
}: {
  label: string
  value: number
  highlight?: boolean
  sub?: string
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className={`truncate text-sm ${highlight ? 'font-semibold text-white' : 'text-slate-300'}`}>
          {label}
          {sub && <span className="ml-1.5 text-xs font-normal text-slate-500">{sub}</span>}
        </span>
        <span
          className={`shrink-0 tabular-nums text-sm ${highlight ? 'font-bold text-emerald-300' : 'text-slate-300'}`}
        >
          {pct(value)}
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all ${highlight ? 'bg-emerald-400' : 'bg-emerald-400/40'}`}
          style={{ width: `${Math.max(1.5, value * 100)}%` }}
        />
      </div>
    </div>
  )
}

/** Mercado de dos salidas en una sola barra dividida (Over/Under, BTTS). */
export function TwoWay({
  leftLabel,
  rightLabel,
  pLeft,
}: {
  leftLabel: string
  rightLabel: string
  pLeft: number
}) {
  const pRight = 1 - pLeft
  const leftWins = pLeft >= pRight
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className={leftWins ? 'font-semibold text-white' : 'text-slate-400'}>
          {leftLabel} <span className="tabular-nums">{pct(pLeft)}</span>
        </span>
        <span className={!leftWins ? 'font-semibold text-white' : 'text-slate-400'}>
          <span className="tabular-nums">{pct(pRight)}</span> {rightLabel}
        </span>
      </div>
      <div className="mt-1 flex h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full ${leftWins ? 'bg-emerald-400' : 'bg-emerald-400/40'}`}
          style={{ width: `${pLeft * 100}%` }}
        />
        <div
          className={`h-full flex-1 ${!leftWins ? 'bg-sky-400/70' : 'bg-sky-400/30'}`}
        />
      </div>
    </div>
  )
}
