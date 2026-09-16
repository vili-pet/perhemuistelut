import { describe, expect, it } from 'vitest'
import { decideAccess } from './access.ts'

describe('decideAccess', () => {
  it('päästää selaimen ilman Telegramia, kun Mini App on pois päältä', () => {
    const decision = decideAccess({
      isDev: false,
      telegramEnabled: false,
      allowedIds: ['42'],
      hasTelegramUser: false,
    })
    expect(decision).toEqual({ status: 'allow', reason: 'web' })
  })

  it('päästää Vilin Mini Appista, kun id on allowlistissä', () => {
    const decision = decideAccess({
      isDev: false,
      telegramEnabled: true,
      allowedIds: ['42'],
      telegramUserId: 42,
      hasTelegramUser: true,
    })
    expect(decision).toEqual({ status: 'allow', reason: 'telegram' })
  })

  it('hylkää muut suomeksi ja näyttää id:n', () => {
    const decision = decideAccess({
      isDev: false,
      telegramEnabled: true,
      allowedIds: ['42'],
      telegramUserId: 99,
      hasTelegramUser: true,
    })
    expect(decision.status).toBe('deny')
    if (decision.status === 'deny') {
      expect(decision.message).toContain('vain Vilin')
      expect(decision.message).toContain('99')
    }
  })

  it('sallii paikallisen devin ilman Telegramia Mini App -tilassa', () => {
    const decision = decideAccess({
      isDev: true,
      telegramEnabled: true,
      allowedIds: ['42'],
      hasTelegramUser: false,
    })
    expect(decision).toEqual({ status: 'allow', reason: 'dev-local' })
  })

  it('estää tuotannon selaimen Mini App -tilassa ilman Telegramia', () => {
    const decision = decideAccess({
      isDev: false,
      telegramEnabled: true,
      allowedIds: ['42'],
      hasTelegramUser: false,
    })
    expect(decision.status).toBe('deny')
    if (decision.status === 'deny') {
      expect(decision.message).toContain('Telegram-botista')
    }
  })

  it('vaatii allowlistin Mini App -tuotannossa', () => {
    const decision = decideAccess({
      isDev: false,
      telegramEnabled: true,
      allowedIds: [],
      telegramUserId: 42,
      hasTelegramUser: true,
    })
    expect(decision.status).toBe('deny')
    if (decision.status === 'deny') {
      expect(decision.message).toContain('Allowlist puuttuu')
      expect(decision.message).toContain('42')
    }
  })
})
