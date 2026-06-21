import { describe, it, expect } from 'vitest'
import { classifyCompetition } from './competitions'

describe('classifyCompetition', () => {
  it('clasifica los torneos por importancia', () => {
    expect(classifyCompetition('FIFA World Cup')).toBe('worldCup')
    expect(classifyCompetition('FIFA World Cup qualification')).toBe('qualifier')
    expect(classifyCompetition('UEFA Euro qualification')).toBe('qualifier')
    expect(classifyCompetition('UEFA Nations League')).toBe('nationsLeague')
    expect(classifyCompetition('Friendly')).toBe('friendly')
    expect(classifyCompetition('UEFA Euro')).toBe('continentalFinals')
    expect(classifyCompetition('Copa América')).toBe('continentalFinals')
    expect(classifyCompetition('African Cup of Nations')).toBe('continentalFinals')
    expect(classifyCompetition('AFC Asian Cup')).toBe('continentalFinals')
    expect(classifyCompetition('Kirin Cup')).toBe('default')
  })
})
