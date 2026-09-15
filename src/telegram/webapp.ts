import type { TelegramWebApp, TelegramWebAppUser } from './types.ts'

const TELEGRAM_SCRIPT_SRC = 'https://telegram.org/js/telegram-web-app.js'

export async function loadTelegramWebAppScript(): Promise<void> {
  if (typeof document === 'undefined') return
  if (window.Telegram?.WebApp) return

  const existing = document.querySelector<HTMLScriptElement>('script[data-telegram-web-app]')
  if (existing) {
    if (window.Telegram?.WebApp) return
    await new Promise<void>((resolve) => {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => resolve(), { once: true })
    })
    return
  }

  await new Promise<void>((resolve) => {
    const script = document.createElement('script')
    script.src = TELEGRAM_SCRIPT_SRC
    script.async = true
    script.dataset.telegramWebApp = 'true'
    script.onload = () => resolve()
    script.onerror = () => resolve()
    document.head.appendChild(script)
  })
}

export function getTelegramWebApp(): TelegramWebApp | undefined {
  if (typeof window === 'undefined') return undefined
  return window.Telegram?.WebApp
}

export function getTelegramUser(): TelegramWebAppUser | undefined {
  return getTelegramWebApp()?.initDataUnsafe?.user
}

export function bootstrapTelegramWebApp(): void {
  const app = getTelegramWebApp()
  if (!app) return
  app.ready()
  app.expand()
  app.disableVerticalSwipes?.()
  app.setHeaderColor?.('#f6efe2')
  app.setBackgroundColor?.('#f6efe2')
}
