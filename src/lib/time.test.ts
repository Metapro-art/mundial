import { describe, it, expect } from 'vitest'
import { parseKickoff } from './time'

describe('parseKickoff', () => {
  it('convierte hora de sede + offset a instante UTC', () => {
    const k = parseKickoff('2026-06-11', '13:00 UTC-6')
    expect(k.offsetMin).toBe(-360)
    // 13:00 en UTC-6  ==  19:00 UTC
    expect(k.instant?.toISOString()).toBe('2026-06-11T19:00:00.000Z')
  })

  it('maneja cruce de medianoche', () => {
    const k = parseKickoff('2026-06-11', '20:00 UTC-6')
    // 20:00 UTC-6  ==  02:00 UTC del día siguiente
    expect(k.instant?.toISOString()).toBe('2026-06-12T02:00:00.000Z')
  })

  it('maneja offset UTC-4', () => {
    const k = parseKickoff('2026-06-29', '16:30 UTC-4')
    expect(k.offsetMin).toBe(-240)
    expect(k.instant?.toISOString()).toBe('2026-06-29T20:30:00.000Z')
  })

  it('devuelve null sin hora o con formato inválido', () => {
    expect(parseKickoff('2026-06-11').instant).toBeNull()
    expect(parseKickoff('2026-06-11', 'mañana').instant).toBeNull()
    expect(parseKickoff('fecha-mala', '13:00 UTC-6').instant).toBeNull()
  })
})
