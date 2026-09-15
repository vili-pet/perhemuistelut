import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createBotSession } from './interview.mjs'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function sessionFilePath(env = process.env) {
  if (env.BOT_SESSION_PATH) return env.BOT_SESSION_PATH
  if (env.VERCEL) return '/tmp/perhemuistelut-session.json'
  return resolve(rootDir, 'data/bot-session.json')
}

let memory = createBotSession()
let loaded = false

function isSession(value) {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.currentQuestionIndex === 'number' &&
    value.marks &&
    typeof value.marks === 'object'
  )
}

export async function loadSession(env = process.env) {
  if (loaded) return memory
  loaded = true
  try {
    const raw = await readFile(sessionFilePath(env), 'utf8')
    const parsed = JSON.parse(raw)
    if (isSession(parsed)) {
      memory = {
        ...createBotSession(),
        ...parsed,
        marks: parsed.marks ?? {},
        telegramVoices: parsed.telegramVoices ?? [],
      }
    }
  } catch {
    memory = createBotSession()
  }
  return memory
}

export async function saveSession(session, env = process.env) {
  memory = session
  loaded = true
  const path = sessionFilePath(env)
  try {
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, JSON.stringify(session, null, 2))
  } catch {
    // /tmp or read-only environments still keep the in-memory copy.
  }
  return memory
}

export async function getSession() {
  return loadSession()
}

export async function replaceSession(session) {
  return saveSession(session)
}

export function peekSession() {
  return memory
}

export function resetSessionMemory() {
  memory = createBotSession()
  loaded = true
}
