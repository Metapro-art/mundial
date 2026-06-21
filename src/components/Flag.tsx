import { useState } from 'react'
import type { TeamRef } from '../data/types'
import { flagSrcSet, flagUrl } from '../lib/flags'

const SIZES = {
  sm: 'w-6 h-[18px]',
  md: 'w-7 h-5',
  lg: 'w-9 h-6',
} as const

export function Flag({
  team,
  size = 'md',
}: {
  team: TeamRef
  size?: keyof typeof SIZES
}) {
  const [failed, setFailed] = useState(false)
  const dims = SIZES[size]

  // Placeholder (rival aún desconocido): círculo neutro.
  if (!team.iso2) {
    return (
      <span
        className={`${dims} shrink-0 inline-flex items-center justify-center rounded-sm bg-white/10 text-[10px] font-semibold text-slate-400`}
        aria-hidden
      >
        ?
      </span>
    )
  }

  // Si la imagen de flagcdn falla, caemos al emoji.
  if (failed && team.emoji) {
    return (
      <span className={`${dims} shrink-0 inline-flex items-center justify-center text-lg leading-none`}>
        {team.emoji}
      </span>
    )
  }

  return (
    <img
      src={flagUrl(team.iso2, 80)}
      srcSet={flagSrcSet(team.iso2, 80)}
      alt={`Bandera de ${team.label}`}
      width={36}
      height={24}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${dims} shrink-0 rounded-sm object-cover ring-1 ring-black/30`}
    />
  )
}
