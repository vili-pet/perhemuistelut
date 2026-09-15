import { useEffect, useRef } from 'react'
import { getTelegramWebApp } from './webapp.ts'
import type { QuestionMark } from '../types.ts'

export interface TelegramVoiceClip {
  fileId: string
  duration?: number
  questionId: string
  questionIndex: number
  at: string
}

export interface BotSessionSnapshot {
  currentQuestionIndex: number
  marks?: Record<string, Partial<QuestionMark>>
  miniAppRecording?: boolean
  telegramVoices?: TelegramVoiceClip[]
}

function marksDiffer(local: QuestionMark, remote?: Partial<QuestionMark>): boolean {
  if (!remote) return false
  if (Boolean(remote.interesting) !== Boolean(local.interesting)) return true
  if (Boolean(remote.returnLater) !== Boolean(local.returnLater)) return true
  if ((remote.note ?? '') !== (local.note ?? '')) return true
  return false
}

async function readSession(initData?: string): Promise<BotSessionSnapshot | null> {
  try {
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (initData) headers['X-Telegram-Init-Data'] = initData
    const response = await fetch('/api/session', { headers })
    if (!response.ok) return null
    return (await response.json()) as BotSessionSnapshot
  } catch {
    return null
  }
}

async function writeSession(
  body: {
    currentQuestionIndex: number
    mark: QuestionMark
    miniAppRecording: boolean
  },
  initData?: string,
): Promise<void> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (initData) headers['X-Telegram-Init-Data'] = initData
    await fetch('/api/session', {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    })
  } catch {
    // Bot API is optional when only the Vite UI is running.
  }
}

export function useBotSync(input: {
  questionIndex: number
  questionId: string
  mark: QuestionMark
  miniAppRecording: boolean
  onRemoteIndex: (index: number) => void
  onRemoteMark: (patch: Partial<QuestionMark>) => void
  onRemoteVoices?: (voices: TelegramVoiceClip[]) => void
}) {
  const applyingRef = useRef(false)
  const lastPostedRef = useRef('')
  const onRemoteIndexRef = useRef(input.onRemoteIndex)
  const onRemoteMarkRef = useRef(input.onRemoteMark)
  const onRemoteVoicesRef = useRef(input.onRemoteVoices)

  useEffect(() => {
    onRemoteIndexRef.current = input.onRemoteIndex
    onRemoteMarkRef.current = input.onRemoteMark
    onRemoteVoicesRef.current = input.onRemoteVoices
  }, [input.onRemoteIndex, input.onRemoteMark, input.onRemoteVoices])

  useEffect(() => {
    const initData = getTelegramWebApp()?.initData
    const payload = {
      currentQuestionIndex: input.questionIndex,
      mark: {
        interesting: input.mark.interesting,
        returnLater: input.mark.returnLater,
        note: input.mark.note,
      },
      miniAppRecording: input.miniAppRecording,
    }
    const key = JSON.stringify(payload)
    if (applyingRef.current || key === lastPostedRef.current) return
    lastPostedRef.current = key
    void writeSession(
      {
        currentQuestionIndex: input.questionIndex,
        mark: input.mark,
        miniAppRecording: input.miniAppRecording,
      },
      initData,
    )
  }, [input.mark, input.miniAppRecording, input.questionIndex])

  useEffect(() => {
    let cancelled = false

    async function pull() {
      if (document.visibilityState === 'hidden') return
      const initData = getTelegramWebApp()?.initData
      const remote = await readSession(initData)
      if (!remote || cancelled) return
      onRemoteVoicesRef.current?.(remote.telegramVoices ?? [])
      const remoteMark = remote.marks?.[input.questionId]
      if (
        typeof remote.currentQuestionIndex === 'number' &&
        remote.currentQuestionIndex !== input.questionIndex
      ) {
        applyingRef.current = true
        onRemoteIndexRef.current(remote.currentQuestionIndex)
        applyingRef.current = false
        return
      }
      if (remoteMark && marksDiffer(input.mark, remoteMark)) {
        applyingRef.current = true
        onRemoteMarkRef.current({
          interesting: Boolean(remoteMark.interesting),
          returnLater: Boolean(remoteMark.returnLater),
          note: remoteMark.note ?? input.mark.note,
        })
        applyingRef.current = false
      }
    }

    void pull()
    const timer = window.setInterval(() => {
      void pull()
    }, 2500)
    document.addEventListener('visibilitychange', pull)
    return () => {
      cancelled = true
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', pull)
    }
  }, [input.mark, input.questionId, input.questionIndex])
}
