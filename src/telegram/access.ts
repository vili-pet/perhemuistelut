import { isAllowedUserId } from './allowlist.ts'

export type AccessDecision =
  | { status: 'allow'; reason: 'telegram' | 'dev-local' }
  | { status: 'deny'; message: string; userId?: string }

export function deniedMessage(userId?: string): string {
  const idLine = userId
    ? ` Sinun Telegram-id: ${userId}. Jos olet Vili, lisää se allowlistiin.`
    : ''
  return `Tämä Mini App on vain Vilin haastattelutyökalu. Sinulla ei ole lupaa.${idLine}`
}

export function missingAllowlistMessage(userId?: string): string {
  const idLine = userId ? ` Sinun Telegram-id: ${userId}.` : ''
  return `Allowlist puuttuu. Aseta TELEGRAM_ALLOWED_USER_ID (ja VITE_TELEGRAM_ALLOWED_USER_ID Mini Appia varten).${idLine}`
}

export function outsideTelegramMessage(): string {
  return 'Avaa Perhemuistelot Vilin Telegram-botista. Tämä sivu ei ole julkinen erillinen sovellus.'
}

export function decideAccess(input: {
  isDev: boolean
  allowedIds: readonly string[]
  telegramUserId?: string | number
  hasTelegramUser: boolean
}): AccessDecision {
  const userId = input.telegramUserId == null ? undefined : String(input.telegramUserId)

  if (input.hasTelegramUser) {
    if (input.allowedIds.length === 0) {
      return { status: 'deny', message: missingAllowlistMessage(userId), userId }
    }
    if (isAllowedUserId(userId, input.allowedIds)) {
      return { status: 'allow', reason: 'telegram' }
    }
    return { status: 'deny', message: deniedMessage(userId), userId }
  }

  if (input.isDev) {
    return { status: 'allow', reason: 'dev-local' }
  }

  if (input.allowedIds.length === 0) {
    return { status: 'deny', message: missingAllowlistMessage(), userId }
  }

  return { status: 'deny', message: outsideTelegramMessage(), userId }
}
