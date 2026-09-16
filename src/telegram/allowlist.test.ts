import { describe, expect, it } from 'vitest'
import { isAllowedUserId, parseAllowedUserIds } from './allowlist.ts'

describe('allowlist', () => {
  it('pilkkoo id:t pilkusta ja välilyönneistä', () => {
    expect(parseAllowedUserIds(' 123, 456 789 ')).toEqual(['123', '456', '789'])
    expect(parseAllowedUserIds(undefined)).toEqual([])
  })

  it('hyväksyy vain listalla olevan id:n', () => {
    expect(isAllowedUserId(123, ['123'])).toBe(true)
    expect(isAllowedUserId('123', ['123'])).toBe(true)
    expect(isAllowedUserId(999, ['123'])).toBe(false)
    expect(isAllowedUserId(123, [])).toBe(false)
    expect(isAllowedUserId(undefined, ['123'])).toBe(false)
  })
})
