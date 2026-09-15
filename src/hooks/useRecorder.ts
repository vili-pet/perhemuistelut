import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BrowserRecorder,
  getRecorderSupport,
  isPauseSupported,
  type RecorderSupport,
  type RecordingResult,
} from '../recording/mediaRecorder.ts'

export type RecorderUiState = 'idle' | 'recording' | 'paused' | 'saving' | 'error'

export function useRecorder() {
  const recorderRef = useRef<BrowserRecorder | null>(null)
  const timerRef = useRef<number | undefined>(undefined)
  const elapsedBaseRef = useRef(0)
  const [support] = useState<RecorderSupport>(() => getRecorderSupport())
  const [uiState, setUiState] = useState<RecorderUiState>('idle')
  const [elapsedMs, setElapsedMs] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const canPause = isPauseSupported()

  const stopTimer = useCallback(() => {
    if (timerRef.current !== undefined) {
      window.clearInterval(timerRef.current)
      timerRef.current = undefined
    }
  }, [])

  const startTimer = useCallback((fromMs: number) => {
    stopTimer()
    elapsedBaseRef.current = performance.now() - fromMs
    timerRef.current = window.setInterval(() => {
      setElapsedMs(Math.round(performance.now() - elapsedBaseRef.current))
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

    try {
      const recorder = new BrowserRecorder()
      recorderRef.current = recorder
      setErrorMessage(null)
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
    stopTimer()
    setUiState('paused')
  }, [canPause, stopTimer])

  const resume = useCallback(() => {
    if (!recorderRef.current) return
    recorderRef.current.resume()
    startTimer(elapsedMs)
    setUiState('recording')
  }, [elapsedMs, startTimer])

  const stop = useCallback(async (): Promise<RecordingResult | null> => {
    if (!recorderRef.current) return null
    setUiState('saving')
    stopTimer()
    try {
      const result = await recorderRef.current.stop()
      recorderRef.current = null
      setUiState('idle')
      setElapsedMs(0)
      return result
    } catch {
      setErrorMessage('Nauhoituksen tallennus epäonnistui.')
      setUiState('error')
      recorderRef.current = null
      return null
    }
  }, [stopTimer])

  return {
    support,
    uiState,
    elapsedMs,
    errorMessage,
    canPause,
    supported: support === 'supported',
    start,
    pause,
    resume,
    stop,
  }
}
