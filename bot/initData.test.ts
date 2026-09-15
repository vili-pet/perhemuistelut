import { describe, expect, it } from 'vitest'
import { buildInitDataForTest, verifyInitData } from './initData.mjs'

const token = 'test-bot-token'

describe('initData HMAC', () => {
  it('hyväksyy allekirjoitetun Vilin datan', () => {
    const initData = buildInitDataForTest({ id: 42, first_name: 'Vili' }, token)
    const result = verifyInitData(initData, token)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.user?.id).toBe(42)
    }
  })

  it('hylkää väärennetyn hashin', () => {
    const initData = buildInitDataForTest({ id: 42, first_name: 'Vili' }, token)
    const tampered = initData.replace(/hash=[^&]+/, 'hash=deadbeef')
    expect(verifyInitData(tampered, token).ok).toBe(false)
  })
})
