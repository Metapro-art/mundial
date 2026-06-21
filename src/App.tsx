import { useEffect, useMemo, useState } from 'react'
import type { Match, WorldCupData } from './data/types'
import { loadWorldCup } from './data/fixtures'
import { Tabs, type TabId } from './components/Tabs'
import { MatchList } from './components/MatchList'
import { GroupTables } from './components/GroupTables'
import { Bracket } from './components/Bracket'
import { MatchPanel } from './components/MatchPanel'

type Status = 'loading' | 'ready' | 'error'
type MatchFilter = 'upcoming' | 'played'

export default function App() {
  const [status, setStatus] = useState<Status>('loading')
  const [data, setData] = useState<WorldCupData | null>(null)
  const [tab, setTab] = useState<TabId>('matches')
  const [filter, setFilter] = useState<MatchFilter>('upcoming')
  const [selected, setSelected] = useState<Match | null>(null)

  useEffect(() => {
    const ctrl = new AbortController()
    loadWorldCup(ctrl.signal)
      .then((d) => {
        setData(d)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
    return () => ctrl.abort()
  }, [])

  const upcoming = useMemo(
    () => data?.matches.filter((m) => !m.played) ?? [],
    [data],
  )
  const played = useMemo(
    () => data?.matches.filter((m) => m.played) ?? [],
    [data],
  )
  const knockout = useMemo(
    () => data?.matches.filter((m) => m.stage !== 'group') ?? [],
    [data],
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-pitch-950 to-pitch-900">
      <header className="border-b border-white/5 bg-pitch-950/80 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-baseline justify-between gap-2">
            <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
              <span aria-hidden>⚽</span> Mundial 2026
            </h1>
            {data && (
              <span
                className="text-[10px] uppercase tracking-wide text-slate-500"
                title={data.source === 'live' ? 'Datos en vivo de openfootball' : 'Copia local (sin conexión)'}
              >
                {data.source === 'live' ? '● en vivo' : '○ local'}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-slate-400">
            Predictor de probabilidades · modelo propio · 100% gratis
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-5">
        {status === 'loading' && (
          <div className="py-20 text-center text-slate-400">Cargando partidos…</div>
        )}

        {status === 'error' && (
          <div className="py-20 text-center text-rose-300">
            No se pudieron cargar los datos. Recarga la página.
          </div>
        )}

        {status === 'ready' && data && (
          <>
            <Tabs active={tab} onChange={setTab} />

            <div className="mt-5">
              {tab === 'matches' && (
                <>
                  <div className="mb-4 flex gap-1 rounded-lg bg-white/5 p-1 text-sm">
                    <button
                      type="button"
                      onClick={() => setFilter('upcoming')}
                      className={`flex-1 rounded-md px-3 py-1.5 font-medium transition ${
                        filter === 'upcoming' ? 'bg-white/10 text-white' : 'text-slate-400'
                      }`}
                    >
                      Próximos ({upcoming.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilter('played')}
                      className={`flex-1 rounded-md px-3 py-1.5 font-medium transition ${
                        filter === 'played' ? 'bg-white/10 text-white' : 'text-slate-400'
                      }`}
                    >
                      Jugados ({played.length})
                    </button>
                  </div>
                  <MatchList
                    matches={filter === 'upcoming' ? upcoming : played}
                    onSelect={setSelected}
                  />
                </>
              )}

              {tab === 'groups' && <GroupTables data={data} onSelect={setSelected} />}

              {tab === 'bracket' && <Bracket matches={knockout} onSelect={setSelected} />}
            </div>
          </>
        )}
      </main>

      <footer className="mx-auto max-w-4xl px-4 py-8 text-center text-xs text-slate-500">
        <p>
          Datos: openfootball · Banderas: flagcdn · Histórico: martj42/international_results
        </p>
        <p className="mt-1">
          Probabilidades calculadas con un modelo estadístico propio. No es consejo de apuestas.
        </p>
      </footer>

      {selected && (
        <MatchPanel match={selected} onClose={() => setSelected(null)}>
          <p className="text-center text-sm text-slate-400">
            Las probabilidades de mercados se calcularán en la{' '}
            <span className="font-semibold text-emerald-300">Fase 2</span> (modelo Elo +
            Dixon-Coles).
          </p>
        </MatchPanel>
      )}
    </div>
  )
}
