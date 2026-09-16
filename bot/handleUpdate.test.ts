import { describe, expect, it, vi } from 'vitest'
import { handleTelegramUpdate } from './handleUpdate.mjs'
import { createBotSession } from './interview.mjs'

function mockApi() {
  return {
    sendMessage: vi.fn(async () => ({})),
    answerCallbackQuery: vi.fn(async () => ({})),
    setChatMenuButton: vi.fn(async () => ({})),
  }
}

describe('handleTelegramUpdate', () => {
  it('avaa Mini Appin /start-komennosta sallitulle Vilille', async () => {
    const api = mockApi()
    const session = createBotSession()
    const result = await handleTelegramUpdate(
      { message: { from: { id: 42, first_name: 'Vili' }, chat: { id: 42 }, text: '/start' } },
      {
        api,
        session,
        replaceSession: async (next) => next,
        allowedIds: ['42'],
        webAppUrl: 'https://example.vercel.app',
      },
    )
    expect(result.ok).toBe(true)
    expect(api.sendMessage).toHaveBeenCalled()
    const text = api.sendMessage.mock.calls[0]?.[1] as string
    expect(text).toContain('Avaa Mini App')
    const extra = api.sendMessage.mock.calls[0]?.[2] as { reply_markup: { inline_keyboard: unknown[][] } }
    expect(JSON.stringify(extra.reply_markup)).toContain('web_app')
    expect(JSON.stringify(extra.reply_markup)).toContain('Seuraava')
  })

  it('hylkää muut suomeksi', async () => {
    const api = mockApi()
    const result = await handleTelegramUpdate(
      { message: { from: { id: 99, first_name: 'Muu' }, chat: { id: 99 }, text: '/start' } },
      {
        api,
        session: createBotSession(),
        replaceSession: async (next) => next,
        allowedIds: ['42'],
        webAppUrl: 'https://example.vercel.app',
      },
    )
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('denied')
    expect(api.sendMessage.mock.calls[0]?.[1]).toContain('vain Vilin')
  })

  it('vaihtaa aihetta napeista', async () => {
    const api = mockApi()
    let session = createBotSession()
    const result = await handleTelegramUpdate(
      {
        callback_query: {
          id: 'cb1',
          data: 'next',
          from: { id: 42, first_name: 'Vili' },
          message: { chat: { id: 42 } },
        },
      },
      {
        api,
        session,
        replaceSession: async (next) => {
          session = next
          return next
        },
        allowedIds: ['42'],
        webAppUrl: 'https://example.vercel.app',
      },
    )
    expect(result.ok).toBe(true)
    expect(session.currentQuestionIndex).toBe(1)
    expect(api.sendMessage.mock.calls[0]?.[1]).toContain('Eka auto')
  })

  it('ei ota Telegram-ääntä Mini Appin nauhoituksen aikana', async () => {
    const api = mockApi()
    const session = { ...createBotSession(), miniAppRecording: true }
    const result = await handleTelegramUpdate(
      {
        message: {
          from: { id: 42, first_name: 'Vili' },
          chat: { id: 42 },
          voice: { file_id: 'file-1', duration: 3 },
        },
      },
      {
        api,
        session,
        replaceSession: async (next) => next,
        allowedIds: ['42'],
        webAppUrl: 'https://example.vercel.app',
      },
    )
    expect(result.kind).toBe('voice-blocked')
    expect(api.sendMessage.mock.calls[0]?.[1]).toContain('MediaRecorderilla')
  })
})
