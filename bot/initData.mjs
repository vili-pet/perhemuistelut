import { createHmac, timingSafeEqual } from 'node:crypto'

export function parseInitData(initData) {
  const params = new URLSearchParams(initData)
  const hash = params.get('hash') ?? ''
  params.delete('hash')
  const pairs = [...params.entries()]
    .map(([key, value]) => `${key}=${value}`)
    .sort()
  const dataCheckString = pairs.join('\n')
  const userRaw = params.get('user')
  let user
  try {
    user = userRaw ? JSON.parse(userRaw) : undefined
  } catch {
    user = undefined
  }
  const authDate = Number(params.get('auth_date') || 0)
  return { hash, dataCheckString, user, authDate }
}

export function signInitData(dataCheckString, botToken) {
  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest()
  return createHmac('sha256', secret).update(dataCheckString).digest('hex')
}

export function verifyInitData(initData, botToken, maxAgeSec = 86_400) {
  if (!initData || !botToken) {
    return { ok: false, reason: 'missing' }
  }
  const parsed = parseInitData(initData)
  if (!parsed.hash) {
    return { ok: false, reason: 'no-hash' }
  }
  const hmac = signInitData(parsed.dataCheckString, botToken)
  const left = Buffer.from(hmac, 'hex')
  const right = Buffer.from(parsed.hash, 'hex')
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return { ok: false, reason: 'bad-hmac' }
  }
  const now = Math.floor(Date.now() / 1000)
  if (parsed.authDate && now - parsed.authDate > maxAgeSec) {
    return { ok: false, reason: 'expired' }
  }
  return { ok: true, user: parsed.user, authDate: parsed.authDate }
}

export function buildInitDataForTest(user, botToken, authDate = Math.floor(Date.now() / 1000)) {
  const params = new URLSearchParams()
  params.set('auth_date', String(authDate))
  params.set('user', JSON.stringify(user))
  params.set('query_id', 'test-query')
  const pairs = [...params.entries()]
    .map(([key, value]) => `${key}=${value}`)
    .sort()
  const hash = signInitData(pairs.join('\n'), botToken)
  params.set('hash', hash)
  return params.toString()
}
