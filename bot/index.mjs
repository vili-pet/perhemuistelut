import { createTelegramApi } from './telegramApi.mjs'
import { handleTelegramUpdate, webAppUrlFromEnv } from './handleUpdate.mjs'
import { serverAllowedUserIds } from './allowlist.mjs'
import { getSession, replaceSession } from './session.mjs'
import { startLocalApiServer } from './server.mjs'

const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) {
  console.error('Aseta TELEGRAM_BOT_TOKEN. Katso README.')
  process.exit(1)
}

const webAppUrl = webAppUrlFromEnv()
const api = createTelegramApi(token)
const port = Number(process.env.BOT_PORT || 8787)

async function poll() {
  let offset = 0
  console.log(`Perhemuistelut-botti käynnissä. Mini App: ${webAppUrl || '(TELEGRAM_WEBAPP_URL puuttuu)'}`)
  console.log(`Paikallinen API: http://127.0.0.1:${port}/api/session`)
  if (webAppUrl) {
    try {
      await api.setChatMenuButton(webAppUrl)
    } catch (error) {
      console.warn('Menu-nappia ei asetettu:', error instanceof Error ? error.message : error)
    }
  }

  while (true) {
    try {
      const updates = await apiCallGetUpdates(token, offset)
      for (const update of updates) {
        offset = update.update_id + 1
        const session = await getSession()
        await handleTelegramUpdate(update, {
          api,
          session,
          replaceSession,
          allowedIds: serverAllowedUserIds(),
          webAppUrl,
          env: process.env,
        })
      }
    } catch (error) {
      console.error('getUpdates-virhe:', error instanceof Error ? error.message : error)
      await wait(2000)
    }
  }
}

async function apiCallGetUpdates(botToken, offset) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ offset, timeout: 30, allowed_updates: ['message', 'callback_query'] }),
  })
  const body = await response.json()
  if (!body.ok) {
    throw new Error(body.description || 'getUpdates epäonnistui')
  }
  return body.result ?? []
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

await startLocalApiServer(port)
await poll()
