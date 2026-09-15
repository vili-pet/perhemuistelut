/** Telegram Mini App is opt-in. Unset / `0` / anything except `1` or `true` keeps the web MVP ungated. */
export function isTelegramEnabled(): boolean {
  const raw = import.meta.env.VITE_TELEGRAM
  return raw === '1' || raw === 'true'
}
