import { createServer } from 'node:http'
import { authorizeRequest, handleSessionGet, handleSessionPatch, handleVerify, handleWebhook } from './routes.mjs'

export function isProductionEnv(env = process.env) {
  return env.VERCEL_ENV === 'production' || env.NODE_ENV === 'production'
}

function header(req, name) {
  const value = req.headers[name] ?? req.headers[name.toLowerCase()]
  return Array.isArray(value) ? value[0] : value
}

export async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string' && req.body.length > 0) {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }
  const chunks = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }
  if (chunks.length === 0) return {}
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function send(res, result) {
  const status = result.status ?? 200
  const body = result.json ?? { ok: true }
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(status).json(body)
    return
  }
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

export async function dispatchApi(req, env = process.env) {
  const url = new URL(req.url || '/', 'http://localhost')
  const path = url.pathname
  const method = (req.method || 'GET').toUpperCase()
  const initData = header(req, 'x-telegram-init-data')
  const production = isProductionEnv(env)

  if (path === '/health' && method === 'GET') {
    return { status: 200, json: { ok: true } }
  }

  if (path === '/api/telegram-verify' && method === 'POST') {
    const body = await readJsonBody(req)
    return handleVerify({
      initData: body.initData || initData,
      isProduction: production,
      env,
    })
  }

  if (path === '/api/telegram' && method === 'POST') {
    const secret = env.TELEGRAM_WEBHOOK_SECRET
    const incoming = header(req, 'x-telegram-bot-api-secret-token')
    if (secret && incoming !== secret) {
      return { status: 401, json: { ok: false, message: 'Webhook-salaisuus ei täsmää.' } }
    }
    const update = await readJsonBody(req)
    return handleWebhook(update, env)
  }

  if (path === '/api/session' && (method === 'GET' || method === 'PATCH' || method === 'PUT' || method === 'POST')) {
    const auth = await authorizeRequest({ initData, isProduction: production, env })
    if (!auth.ok) {
      return { status: auth.status ?? 401, json: { ok: false, message: auth.message, userId: auth.userId } }
    }
    if (method === 'GET') return handleSessionGet()
    const body = await readJsonBody(req)
    return handleSessionPatch(body)
  }

  return { status: 404, json: { ok: false, message: 'Tuntematon polku.' } }
}

export async function handleNodeRequest(req, res, env = process.env) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, X-Telegram-Init-Data',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,OPTIONS',
    })
    res.end()
    return
  }
  try {
    const result = await dispatchApi(req, env)
    send(res, result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Palvelinvirhe'
    send(res, { status: 500, json: { ok: false, message } })
  }
}

export function startLocalApiServer(port, env = process.env) {
  const server = createServer((req, res) => {
    void handleNodeRequest(req, res, env)
  })
  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => resolve(server))
  })
}
