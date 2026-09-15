import type { TelegramWebApp, TelegramWebAppUser } from './types.ts'

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
