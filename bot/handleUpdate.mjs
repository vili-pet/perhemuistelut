import {
  deniedFinnish,
  isAllowedUserId,
  missingAllowlistFinnish,
  serverAllowedUserIds,
} from './allowlist.mjs'
import {
  applyInterviewAction,
  describeSession,
  formatTopic,
} from './interview.mjs'

export function webAppUrlFromEnv(env = process.env) {
  if (env.TELEGRAM_WEBAPP_URL) return env.TELEGRAM_WEBAPP_URL.replace(/\/$/, '')
  if (env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${env.VERCEL_PROJECT_PRODUCTION_URL.replace(/^https?:\/\//, '')}`
  }
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL.replace(/^https?:\/\//, '')}`
  return ''
}

export function controlKeyboard(webAppUrl) {
  const rows = []
  if (webAppUrl) {
    rows.push([{ text: 'Avaa haastattelu', web_app: { url: webAppUrl } }])
  }
  rows.push([{ text: 'Nykyinen aihe', callback_data: 'topic' }])
  rows.push([
    { text: 'Edellinen', callback_data: 'prev' },
    { text: 'Seuraava', callback_data: 'next' },
  ])
  rows.push([
    { text: 'Kiinnostava', callback_data: 'interesting' },
    { text: 'Palaa myöhemmin', callback_data: 'later' },
  ])
  return { inline_keyboard: rows }
}

export function startMessage(webAppUrl) {
  const openLine = webAppUrl
    ? 'Avaa Mini App napista. Se on sama Vite-haastattelunäkymä, nyt Telegramissa.'
    : 'Aseta TELEGRAM_WEBAPP_URL (Vercel-HTTPS) ja BotFather Web App URL.'
  return [
    'Perhemuistelot — Vilin haastattelutyökalu Leenalle ja Jormalle.',
    openLine,
    'Ruudulla yksi aihe. Seuraava ei katkaise Mini Appin nauhaa.',
    'Nauhoitus: Mini Appin MediaRecorder. Telegram-ääni on varatapa, ei toinen live-nauha.',
    '',
    'Komennot: /aihe /seuraava /edellinen /kiinnostava /palaa',
  ].join('\n')
}

function senderFromUpdate(update) {
  const msg = update.message || update.edited_message
  if (msg?.from) {
    return { user: msg.from, chatId: msg.chat.id, message: msg }
  }
  const cb = update.callback_query
  if (cb?.from) {
    return { user: cb.from, chatId: cb.message?.chat?.id ?? cb.from.id, callback: cb }
  }
  return { user: undefined, chatId: undefined }
}

export function classifyText(text) {
  const raw = (text || '').trim()
  const normalized = raw.toLowerCase()
  if (!raw) return 'none'
  if (normalized.startsWith('/start') || normalized.startsWith('/help')) return 'start'
  if (normalized.startsWith('/aihe') || normalized.startsWith('/nykyinen') || normalized === 'nykyinen aihe') {
    return 'topic'
  }
  if (normalized.startsWith('/seuraava') || normalized === 'seuraava' || normalized.startsWith('/next')) {
    return 'next'
  }
  if (normalized.startsWith('/edellinen') || normalized === 'edellinen' || normalized.startsWith('/prev')) {
    return 'prev'
  }
  if (normalized.startsWith('/kiinnostava') || normalized === 'kiinnostava') return 'interesting'
  if (
    normalized.startsWith('/palaa') ||
    normalized.startsWith('/myohemmin') ||
    normalized.startsWith('/myöh') ||
    normalized === 'palaa myöhemmin'
  ) {
    return 'later'
  }
  return 'unknown'
}

function actionFromKind(kind) {
  if (kind === 'next') return { type: 'next' }
  if (kind === 'prev') return { type: 'prev' }
  if (kind === 'interesting') return { type: 'interesting' }
  if (kind === 'later') return { type: 'later' }
  return null
}

export async function handleTelegramUpdate(update, ctx) {
  const { user, chatId, message, callback } = senderFromUpdate(update)
  if (!user || chatId == null) {
    return { ok: true, ignored: true }
  }

  const allowed = ctx.allowedIds ?? serverAllowedUserIds(ctx.env)
  if (allowed.length === 0) {
    await ctx.api.sendMessage(chatId, missingAllowlistFinnish(user.id), {
      reply_markup: controlKeyboard(ctx.webAppUrl),
    })
    return { ok: false, reason: 'no-allowlist', userId: user.id }
  }
  if (!isAllowedUserId(user.id, allowed)) {
    await ctx.api.sendMessage(chatId, deniedFinnish(user.id))
    return { ok: false, reason: 'denied', userId: user.id }
  }

  const kind = callback?.data || classifyText(message?.text || message?.caption || '')
  const keyboard = controlKeyboard(ctx.webAppUrl)

  if (kind === 'start') {
    if (ctx.api.setChatMenuButton && ctx.webAppUrl) {
      try {
        await ctx.api.setChatMenuButton(ctx.webAppUrl)
      } catch {
        // Menu button is optional.
      }
    }
    await ctx.api.sendMessage(chatId, `${startMessage(ctx.webAppUrl)}\n\n${describeSession(ctx.session)}`, {
      reply_markup: keyboard,
    })
    return { ok: true, kind, session: ctx.session }
  }

  const voice = message?.voice || message?.audio
  if (voice?.file_id) {
    if (ctx.session.miniAppRecording) {
      const text =
        'Mini App nauhoittaa jo MediaRecorderilla. Telegram-ääntä ei otettu, jotta ei tule kahta live-nauhaa.'
      await ctx.api.sendMessage(chatId, text, { reply_markup: keyboard })
      return { ok: true, kind: 'voice-blocked', session: ctx.session }
    }
    const session = applyInterviewAction(ctx.session, {
      type: 'add-voice',
      fileId: voice.file_id,
      duration: voice.duration,
    })
    await ctx.replaceSession(session)
    await ctx.api.sendMessage(
      chatId,
      `Telegram-ääni otettiin varatavaksi.\n${formatTopic(session.currentQuestionIndex)}\nPäänauha on Mini Appin MediaRecorder. Älä nauhoita molempia yhtä aikaa.`,
      { reply_markup: keyboard },
    )
    return { ok: true, kind: 'voice', session }
  }

  const action = actionFromKind(kind)
  if (action) {
    const session = applyInterviewAction(ctx.session, action)
    await ctx.replaceSession(session)
    const text = describeSession(session)
    if (callback?.id) {
      try {
        await ctx.api.answerCallbackQuery(callback.id, kind === 'topic' ? 'Nykyinen aihe' : 'Päivitetty')
      } catch {
        // Callback answers expire quickly.
      }
    }
    await ctx.api.sendMessage(chatId, text, { reply_markup: keyboard })
    return { ok: true, kind, session }
  }

  if (kind === 'topic') {
    if (callback?.id) {
      try {
        await ctx.api.answerCallbackQuery(callback.id, 'Nykyinen aihe')
      } catch {
        // ignore
      }
    }
    await ctx.api.sendMessage(chatId, describeSession(ctx.session), { reply_markup: keyboard })
    return { ok: true, kind, session: ctx.session }
  }

  if (kind === 'unknown' && message?.text) {
    await ctx.api.sendMessage(
      chatId,
      `En tunne komentoa. ${startMessage(ctx.webAppUrl)}\n\n${describeSession(ctx.session)}`,
      { reply_markup: keyboard },
    )
    return { ok: true, kind, session: ctx.session }
  }

  return { ok: true, ignored: true, session: ctx.session }
}
