export interface TelegramWebAppUser {
  id: number
  is_bot?: boolean
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

export interface TelegramWebApp {
  initData: string
  initDataUnsafe: {
    user?: TelegramWebAppUser
    auth_date?: number
    hash?: string
  }
  ready: () => void
  expand: () => void
  close: () => void
  disableVerticalSwipes?: () => void
  setHeaderColor?: (color: string) => void
  setBackgroundColor?: (color: string) => void
  isExpanded: boolean
  colorScheme: 'light' | 'dark'
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp
    }
  }
}
