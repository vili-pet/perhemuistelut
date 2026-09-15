import {
  deniedFinnish,
  isAllowedUserId,
  missingAllowlistFinnish,
  serverAllowedUserIds,
} from './allowlist.mjs'
import { handleTelegramUpdate, webAppUrlFromEnv } from './handleUpdate.mjs'
import { verifyInitData } from './initData.mjs'
import { applyInterviewAction, createBotSession } from './interview.mjs'
import { getSession, replaceSession } from './session.mjs'

function json(status, body) {
  return { status, json: body }
}

export async function authorizeRequest({ initData, isProduction, env = process.env }) {
  const allowed = serverAllowedUserIds(env)
  const token = env.TELEGRAM_BOT_TOKEN

  if (initData && token) {
    const verified = verifyInitData(initData, token)
    if (!verified.ok) {
      return { ok: false, status: 401, message: 'Telegram-istuntoa ei voitu varmistaa.' }
    }
    const userId = verified.user?.id
    if (allowed.length === 0) {
      return { ok: false, status: 403, message: missingAllowlistFinnish(userId), userId }
    }
    if (!isAllowedUserId(userId, allowed)) {
      return { ok: false, status: 403, message: deniedFinnish(userId), userId }
    }
    return { ok: true, userId }
  }

  if (!isProduction) {
    return { ok: true, dev: true }
  }

  return { ok: false, status: 401, message: 'Avaa Mini App Telegramista.' }
}

export async function handleVerify({ initData, isProduction, env = process.env }) {
  const auth = await authorizeRequest({ initData, isProduction, env })
  if (!auth.ok) {
    return json(auth.status ?? 401, { ok: false, message: auth.message, userId: auth.userId })
  }
  return json(200, {
    ok: true,
    userId: auth.userId,
    message: auth.dev ? 'Paikallinen kehitys.' : 'Telegram-käyttäjä sallittu.',
  })
}

export async function handleSessionGet() {
  const session = await getSession()
  return json(200, session)
}

export async function handleSessionPatch(body) {
  let session = await getSession()
  if (!session) session = createBotSession()

  if (typeof body?.currentQuestionIndex === 'number') {
    session = applyInterviewAction(session, { type: 'goto', index: body.currentQuestionIndex })
  }
  if (body?.mark && typeof body.mark === 'object') {
    session = applyInterviewAction(session, {
      type: 'set-mark',
      index: session.currentQuestionIndex,
      mark: body.mark,
    })
  }
  if (typeof body?.miniAppRecording === 'boolean') {
    session = applyInterviewAction(session, { type: 'set-recording', value: body.miniAppRecording })
  }
  await replaceSession(session)
  return json(200, session)
}

export async function handleWebhook(update, env = process.env) {
  const token = env.TELEGRAM_BOT_TOKEN
  if (!token) {
    return json(500, { ok: false, message: 'TELEGRAM_BOT_TOKEN puuttuu.' })
  }
  const { createTelegramApi } = await import('./telegramApi.mjs')
  const api = createTelegramApi(token)
  const session = await getSession()
  const result = await handleTelegramUpdate(update, {
    api,
    session,
    replaceSession,
    allowedIds: serverAllowedUserIds(env),
    webAppUrl: webAppUrlFromEnv(env),
    env,
  })
  return json(200, { ok: true, result: { ok: result.ok, kind: result.kind, reason: result.reason } })
}
