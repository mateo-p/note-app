import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { formatDate, formatLastEdited } from './utils'

describe('formatDate', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "today" for same day', () => {
    expect(formatDate('2024-06-15T08:00:00Z')).toBe('today')
  })

  it('returns "yesterday" for one day ago', () => {
    expect(formatDate('2024-06-14T08:00:00Z')).toBe('yesterday')
  })

  it('returns formatted date for older dates', () => {
    expect(formatDate('2024-06-01T08:00:00Z')).toBe('June 1')
  })

  it('returns formatted date for much older dates', () => {
    expect(formatDate('2024-01-20T08:00:00Z')).toBe('January 20')
  })
})

describe('formatLastEdited', () => {
  it('returns a human-readable date and time string', () => {
    const result = formatLastEdited('2024-06-15T14:30:00Z')
    expect(result).toMatch(/June 15, 2024/)
    expect(result).toMatch(/at/)
    expect(result).toMatch(/am|pm/)
  })

  it('includes all date components', () => {
    const result = formatLastEdited('2024-01-05T09:05:00Z')
    expect(result).toMatch(/January/)
    expect(result).toMatch(/2024/)
  })
})
