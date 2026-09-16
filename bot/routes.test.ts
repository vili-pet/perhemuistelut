import { afterEach, describe, expect, it } from 'vitest'
import { authorizeRequest, handleSessionPatch, handleVerify } from './routes.mjs'
import { buildInitDataForTest } from './initData.mjs'
import { resetSessionMemory } from './session.mjs'

const token = 'test-bot-token'
const env = {
  TELEGRAM_BOT_TOKEN: token,
  TELEGRAM_ALLOWED_USER_ID: '42',
}

afterEach(() => {
  resetSessionMemory()
})

describe('telegram routes', () => {
  it('varmistaa initDatan ja allowlistin', async () => {
    const initData = buildInitDataForTest({ id: 42, first_name: 'Vili' }, token)
    const allowed = await handleVerify({ initData, isProduction: true, env })
    expect(allowed.status).toBe(200)
    expect(allowed.json.ok).toBe(true)

    const denied = await handleVerify({
      initData: buildInitDataForTest({ id: 7, first_name: 'Muu' }, token),
      isProduction: true,
      env,
    })
    expect(denied.status).toBe(403)
    expect(denied.json.message).toContain('vain Vilin')
  })

  it('päivittää botin aiheen Mini Appista', async () => {
    const result = await handleSessionPatch({
      currentQuestionIndex: 2,
      mark: { interesting: true, returnLater: false, note: 'kuu' },
      miniAppRecording: true,
    })
    expect(result.status).toBe(200)
    expect(result.json.currentQuestionIndex).toBe(2)
    expect(result.json.miniAppRecording).toBe(true)
    expect(result.json.marks['kuu-1969']).toMatchObject({ interesting: true, note: 'kuu' })
  })

  it('sallii devin ilman Telegramia', async () => {
    const auth = await authorizeRequest({ isProduction: false, env })
    expect(auth.ok).toBe(true)
    expect(auth.dev).toBe(true)
  })
})
