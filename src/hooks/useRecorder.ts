import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BrowserRecorder,
  getRecorderSupport,
  isPauseSupported,
  type RecorderSupport,
  type RecordingResult,
} from '../recording/mediaRecorder.ts'

export type RecorderUiState = 'idle' | 'recording' | 'paused' | 'pending' | 'saving' | 'error'

export function useRecorder() {
  const recorderRef = useRef<BrowserRecorder | null>(null)
  const timerRef = useRef<number | undefined>(undefined)
  const elapsedBaseRef = useRef(0)
  const elapsedMsRef = useRef(0)
  const pendingRef = useRef<RecordingResult | null>(null)
  const [support] = useState<RecorderSupport>(() => getRecorderSupport())
  const [uiState, setUiState] = useState<RecorderUiState>('idle')
  const [elapsedMs, setElapsedMs] = useState(0)
  const [pending, setPending] = useState<RecordingResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const canPause = isPauseSupported()

  const stopTimer = useCallback(() => {
    if (timerRef.current !== undefined) {
      window.clearInterval(timerRef.current)
      timerRef.current = undefined
    }
  }, [])

  const captureElapsed = useCallback(() => {
    if (timerRef.current === undefined) return elapsedMsRef.current
    const next = Math.round(performance.now() - elapsedBaseRef.current)
    elapsedMsRef.current = next
    setElapsedMs(next)
    return next
  }, [])

  const startTimer = useCallback((fromMs: number) => {
    stopTimer()
    elapsedMsRef.current = fromMs
    setElapsedMs(fromMs)
    elapsedBaseRef.current = performance.now() - fromMs
    timerRef.current = window.setInterval(() => {
      const next = Math.round(performance.now() - elapsedBaseRef.current)
      elapsedMsRef.current = next
      setElapsedMs(next)
    }, 200)
  }, [stopTimer])

  useEffect(() => () => {
    stopTimer()
    recorderRef.current?.release()
  }, [stopTimer])

  const start = useCallback(async () => {
    if (support !== 'supported') {
      setErrorMessage(
        support === 'insecure-context'
          ? 'Nauhoitus vaatii suojatun yhteyden (localhost tai HTTPS).'
          : 'Tämä selain ei tue MediaRecorder-nauhoitusta. Liitä äänitiedosto tai kirjoita muistiinpanot.',
      )
      setUiState('error')
      return null
    }

    if (pendingRef.current) {
      setErrorMessage('Tallenna tai hylkää pysäytetty nauha ennen uutta nauhoitusta.')
      setUiState('pending')
      return null
    }

    try {
      const recorder = new BrowserRecorder()
      recorderRef.current = recorder
      pendingRef.current = null
      setPending(null)
      setErrorMessage(null)
      elapsedMsRef.current = 0
      setElapsedMs(0)
      await recorder.start()
      setUiState('recording')
      startTimer(0)
      return true
    } catch {
      setErrorMessage('Mikrofonin käyttö epäonnistui. Tarkista lupa ja kokeile uudelleen.')
      setUiState('error')
      recorderRef.current?.release()
      recorderRef.current = null
      return null
    }
  }, [startTimer, support])

  const pause = useCallback(() => {
    if (!canPause || !recorderRef.current) return
    recorderRef.current.pause()
    captureElapsed()
    stopTimer()
    setUiState('paused')
  }, [canPause, captureElapsed, stopTimer])

  const resume = useCallback(() => {
    if (!recorderRef.current) return
    recorderRef.current.resume()
    startTimer(elapsedMsRef.current)
    setUiState('recording')
  }, [startTimer])

  const stop = useCallback(async (): Promise<RecordingResult | null> => {
    if (!recorderRef.current) return pendingRef.current
    stopTimer()
    captureElapsed()
    try {
      const result = await recorderRef.current.stop()
      recorderRef.current = null
      pendingRef.current = result
      setPending(result)
      setUiState('pending')
      elapsedMsRef.current = result.durationMs
      setElapsedMs(result.durationMs)
      return result
    } catch {
      setErrorMessage('Nauhoituksen lopetus epäonnistui.')
      setUiState('error')
      recorderRef.current = null
      return null
    }
  }, [captureElapsed, stopTimer])

  const save = useCallback(async (): Promise<RecordingResult | null> => {
    const result = pendingRef.current
    if (!result) return null
    setUiState('saving')
    pendingRef.current = null
    setPending(null)
    elapsedMsRef.current = 0
    setElapsedMs(0)
    setUiState('idle')
    return result
  }, [])

  const discard = useCallback(async () => {
    stopTimer()
    if (recorderRef.current) {
      try {
        await recorderRef.current.stop()
      } catch {
        recorderRef.current.release()
      }
      recorderRef.current = null
    }
    pendingRef.current = null
    setPending(null)
    elapsedMsRef.current = 0
    setElapsedMs(0)
    setErrorMessage(null)
    setUiState('idle')
  }, [stopTimer])

  return {
    support,
    uiState,
    elapsedMs,
    pending,
    errorMessage,
    canPause,
    supported: support === 'supported',
    start,
    pause,
    resume,
    stop,
    save,
    discard,
  }
}
