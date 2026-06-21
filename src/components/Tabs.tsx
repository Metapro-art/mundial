export type TabId = 'matches' | 'groups' | 'bracket'

const TABS: { id: TabId; label: string }[] = [
  { id: 'matches', label: 'Partidos' },
  { id: 'groups', label: 'Grupos' },
  { id: 'bracket', label: 'Bracket' },
]

export function Tabs({
  active,
  onChange,
}: {
  active: TabId
  onChange: (id: TabId) => void
}) {
  return (
    <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl bg-white/5 p-1">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
            active === t.id
              ? 'bg-emerald-500 text-pitch-950 shadow'
              : 'text-slate-300 hover:bg-white/5'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
