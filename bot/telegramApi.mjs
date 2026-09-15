const API_ROOT = 'https://api.telegram.org'

export function telegramApiUrl(token, method) {
  return `${API_ROOT}/bot${token}/${method}`
}

export function fileUrl(token, filePath) {
  return `${API_ROOT}/file/bot${token}/${filePath}`
}

export async function telegramCall(token, method, payload) {
  const response = await fetch(telegramApiUrl(token, method), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload ?? {}),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok || body.ok === false) {
    const description = body.description || response.statusText
    throw new Error(`Telegram ${method} epäonnistui: ${description}`)
  }
  return body.result
}

export function createTelegramApi(token) {
  return {
    sendMessage(chatId, text, extra = {}) {
      return telegramCall(token, 'sendMessage', {
        chat_id: chatId,
        text,
        ...extra,
      })
    },
    answerCallbackQuery(id, text) {
      return telegramCall(token, 'answerCallbackQuery', {
        callback_query_id: id,
        text,
        show_alert: false,
      })
    },
    setChatMenuButton(webAppUrl) {
      if (!webAppUrl) return Promise.resolve()
      return telegramCall(token, 'setChatMenuButton', {
        menu_button: {
          type: 'web_app',
          text: 'Haastattelu',
          web_app: { url: webAppUrl },
        },
      })
    },
    getFile(fileId) {
      return telegramCall(token, 'getFile', { file_id: fileId })
    },
  }
}
