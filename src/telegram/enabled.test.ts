import { describe, expect, it } from 'vitest'
import { isTelegramEnabled } from './enabled.ts'

describe('isTelegramEnabled', () => {
  it('on oletuksena pois, jotta selain-MVP aukeaa ilman Telegramia', () => {
    expect(isTelegramEnabled()).toBe(false)
  })
})
