import type { Match } from '../data/types'
import type { MatchOdds } from '../data/odds'
import type { Absence, Prediction } from '../model/types'
import { MarketBar, TwoWay } from './MarketBar'
import { devig } from '../model/value'
import { pct } from '../lib/format'
import type { ReactNode } from 'react'

type ModelStatus = 'idle' | 'loading' | 'ready' | 'error'

/** 1X2 con tres columnas: prob. modelo / prob. implícita / edge (Fase 3). */
function OneXTwoWithEdge({
  rows,
  odds,
}: {
  rows: { label: string; model: number }[]
  odds: MatchOdds
}) {
  const implied = devig([odds.home, odds.draw, odds.away])
  return (
    <div>
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 text-[11px] uppercase tracking-wide text-slate-500">
        <span />
        <span className="text-right">Modelo</span>
        <span className="text-right">Implíc.</span>
        <span className="text-right">Edge</span>
      </div>
      {rows.map((r, i) => {
        const edge = r.model - implied[i]
        return (
          <div
            key={r.label}
            className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 border-t border-white/5 py-1.5 text-sm"
          >
            <span className="truncate text-slate-200">{r.label}</span>
            <span className="text-right tabular-nums text-slate-300">{pct(r.model)}</span>
            <span className="text-right tabular-nums text-slate-400">{pct(implied[i])}</span>
            <span
              className={`text-right font-semibold tabular-nums ${
                edge > 0.005 ? 'text-emerald-400' : edge < -0.005 ? 'text-rose-400/80' : 'text-slate-500'
              }`}
            >
              {edge > 0 ? '+' : ''}
              {pct(edge)}
            </span>
          </div>
        )
      })}
      <p className="mt-1.5 text-[11px] text-slate-500">
        Cuotas: {odds.bookmaker} · edge verde = valor a favor del modelo
      </p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5 first:mt-0">
      <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-300">{title}</h4>
      <div className="space-y-2.5">{children}</div>
    </section>
  )
}

function Info({ children }: { children: ReactNode }) {
  return <p className="py-4 text-center text-sm text-slate-400">{children}</p>
}

function absenceText(a: Absence): string {
  const parts: string[] = []
  if (a.attack) parts.push(`ataque −${Math.round(a.attack * 100)}%`)
  if (a.defense) parts.push(`defensa −${Math.round(a.defense * 100)}%`)
  return parts.join(', ')
}

function TeamAbsences({ label, list }: { label: string; list: Absence[] }) {
  return (
    <div className="text-slate-300">
      <span className="text-slate-400">{label}:</span>{' '}
      {list
        .map((a) => `${a.player ?? 'jugador'}${absenceText(a) ? ` (${absenceText(a)})` : ''}`)
        .join(' · ')}
    </div>
  )
}

export function MarketsView({
  match,
  prediction,
  status,
  odds,
}: {
  match: Match
  prediction: Prediction | null
  status: ModelStatus
  odds?: MatchOdds | null
}) {
  if (!match.home.known || !match.away.known) {
    return <Info>Las probabilidades aparecerán cuando se conozcan ambas selecciones.</Info>
  }
  if (status === 'error') return <Info>No se pudo cargar el modelo de probabilidades.</Info>
  if (!prediction || status === 'loading' || status === 'idle') {
    return <Info>Calculando probabilidades…</Info>
  }

  const { oneXtwo, overUnder, btts, topScores, expected, elo, hostAdvantage, absences } = prediction
  const maxOutcome = Math.max(oneXtwo.home, oneXtwo.draw, oneXtwo.away)
  const home = match.home.label
  const away = match.away.label

  const hostNote =
    hostAdvantage === 'home'
      ? `Ventaja de localía: ${home} (anfitrión)`
      : hostAdvantage === 'away'
        ? `Ventaja de localía: ${away} (anfitrión)`
        : 'Sede neutral (sin ventaja de localía)'

  return (
    <div>
      {/* Resumen */}
      <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-white/[0.03] p-3 text-xs text-slate-400">
        <div>
          <span className="text-slate-500">Goles esperados</span>
          <div className="mt-0.5 font-semibold tabular-nums text-slate-200">
            {expected.home.toFixed(2)} – {expected.away.toFixed(2)}
          </div>
        </div>
        <div>
          <span className="text-slate-500">Elo</span>
          <div className="mt-0.5 font-semibold tabular-nums text-slate-200">
            {Math.round(elo.home)} – {Math.round(elo.away)}
          </div>
        </div>
        <div className="col-span-2 text-[11px] text-slate-500">{hostNote}</div>
      </div>

      {(absences.home.length > 0 || absences.away.length > 0) && (
        <div className="mb-4 rounded-lg border border-amber-400/20 bg-amber-400/[0.06] p-3 text-xs">
          <div className="mb-1 font-semibold text-amber-300">Ausencias consideradas</div>
          {absences.home.length > 0 && <TeamAbsences label={home} list={absences.home} />}
          {absences.away.length > 0 && <TeamAbsences label={away} list={absences.away} />}
        </div>
      )}

      {/* 1X2 (con columna de edge si hay cuotas) */}
      <Section title="Resultado (1X2)">
        {odds ? (
          <OneXTwoWithEdge
            rows={[
              { label: home, model: oneXtwo.home },
              { label: 'Empate', model: oneXtwo.draw },
              { label: away, model: oneXtwo.away },
            ]}
            odds={odds}
          />
        ) : (
          <>
            <MarketBar label={home} value={oneXtwo.home} highlight={oneXtwo.home === maxOutcome} />
            <MarketBar label="Empate" value={oneXtwo.draw} highlight={oneXtwo.draw === maxOutcome} />
            <MarketBar label={away} value={oneXtwo.away} highlight={oneXtwo.away === maxOutcome} />
          </>
        )}
      </Section>

      {/* Over / Under */}
      <Section title="Más / Menos goles">
        {overUnder.map((ou) => (
          <TwoWay
            key={ou.line}
            leftLabel={`Más de ${ou.line}`}
            rightLabel={`Menos`}
            pLeft={ou.over}
          />
        ))}
      </Section>

      {/* BTTS */}
      <Section title="Ambos equipos anotan">
        <TwoWay leftLabel="Sí" rightLabel="No" pLeft={btts.yes} />
      </Section>

      {/* Marcadores */}
      <Section title="Marcadores más probables">
        <p className="-mt-1 mb-1 text-[11px] text-slate-500">
          {home} (local) – {away} (visitante)
        </p>
        {topScores.map((s, i) => (
          <MarketBar
            key={`${s.home}-${s.away}`}
            label={`${s.home} – ${s.away}`}
            value={s.prob}
            highlight={i === 0}
          />
        ))}
      </Section>
    </div>
  )
}
