export function parseAllowedUserIds(raw) {
  if (!raw) return []
  return String(raw)
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

export function isAllowedUserId(userId, allowedIds) {
  if (userId == null || !allowedIds || allowedIds.length === 0) return false
  return allowedIds.includes(String(userId))
}

export function serverAllowedUserIds(env = process.env) {
  return parseAllowedUserIds(env.TELEGRAM_ALLOWED_USER_ID || env.VITE_TELEGRAM_ALLOWED_USER_ID)
}

export function deniedFinnish(userId) {
  const idLine = userId != null ? ` Sinun Telegram-id: ${userId}.` : ''
  return `Tämä botti on vain Vilin haastattelutyökalu. Sinulla ei ole lupaa.${idLine}`
}

export function missingAllowlistFinnish(userId) {
  const idLine = userId != null ? ` Sinun Telegram-id: ${userId}. Lisää se TELEGRAM_ALLOWED_USER_ID-muuttujaan.` : ''
  return `Kukaan ei ole allowlistissä.${idLine}`
}
