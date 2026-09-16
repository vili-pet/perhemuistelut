import { useEffect, useState, type ReactNode } from 'react'
import { clientAllowedUserIds } from './allowlist.ts'
import { decideAccess, type AccessDecision } from './access.ts'
import { isTelegramEnabled } from './enabled.ts'
import {
  bootstrapTelegramWebApp,
  getTelegramUser,
  getTelegramWebApp,
  loadTelegramWebAppScript,
} from './webapp.ts'

export function AccessGate({ children }: { children: ReactNode }) {
  const telegramEnabled = isTelegramEnabled()
  const [decision, setDecision] = useState<AccessDecision | { status: 'loading' }>(() =>
    telegramEnabled ? { status: 'loading' } : { status: 'allow', reason: 'web' },
  )

  useEffect(() => {
    if (!telegramEnabled) return

    let cancelled = false

    async function resolveAccess() {
      await loadTelegramWebAppScript()
      bootstrapTelegramWebApp()
      const app = getTelegramWebApp()
      const user = getTelegramUser()
      const allowedIds = clientAllowedUserIds()
      const isDev = import.meta.env.DEV

      if (app?.initData) {
        try {
          const response = await fetch('/api/telegram-verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Telegram-Init-Data': app.initData,
            },
            body: JSON.stringify({ initData: app.initData }),
          })
          if (response.ok) {
            const body: { ok?: boolean } = await response.json()
            if (body.ok && !cancelled) {
              setDecision({ status: 'allow', reason: 'telegram' })
              return
            }
          }
          if (response.status === 401 || response.status === 403) {
            const body: { message?: string; userId?: string | number } = await response
              .json()
              .catch(() => ({}))
            if (!cancelled) {
              setDecision({
                status: 'deny',
                message:
                  body.message ||
                  'Tämä Mini App on vain Vilin haastattelutyökalu. Sinulla ei ole lupaa.',
                userId:
                  body.userId != null
                    ? String(body.userId)
                    : user?.id != null
                      ? String(user.id)
                      : undefined,
              })
            }
            return
          }
        } catch {
          // API is optional in local `npm run dev` without the bot.
        }
      }

      const local = decideAccess({
        isDev,
        telegramEnabled: true,
        allowedIds,
        telegramUserId: user?.id,
        hasTelegramUser: Boolean(user?.id),
      })
      if (!cancelled) setDecision(local)
    }

    void resolveAccess()
    return () => {
      cancelled = true
    }
  }, [telegramEnabled])

  if (decision.status === 'loading') {
    return (
      <main className="access-gate" aria-busy="true">
        <p className="eyebrow">Perhemuistelot</p>
        <h1>Tarkistetaan Telegram-käyttäjää…</h1>
      </main>
    )
  }

  if (decision.status === 'deny') {
    return (
      <main className="access-gate access-gate--denied" role="alert">
        <p className="eyebrow">Perhemuistelot</p>
        <h1>Ei käyttöoikeutta</h1>
        <p>{decision.message}</p>
        {decision.userId ? (
          <p className="access-gate__id">
            Telegram-id: <code>{decision.userId}</code>
          </p>
        ) : null}
      </main>
    )
  }

  return (
    <>
      {decision.reason === 'dev-local' ? (
        <p className="dev-banner" role="status">
          Paikallinen kehitys ilman Telegram-istuntoa. Mini App -portti on päällä (`VITE_TELEGRAM=1`).
        </p>
      ) : null}
      {children}
    </>
  )
}
