import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SPEAKER_LABELS, respondentNamesWithYears } from '../data/participants.ts'
import {
  downloadJson,
  downloadText,
  exportFileName,
  storiesFileName,
  toStoriesText,
} from '../export/familyHistory.ts'
import { useInterview } from '../hooks/useInterview.ts'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts.ts'
import { useRecorder } from '../hooks/useRecorder.ts'
import { createId, nowIso } from '../lib/id.ts'
import { formatClock } from '../lib/format.ts'
import { createObjectUrl, getAudioClip, saveAudioClip } from '../storage/audioStore.ts'
import type { TopicMarker } from '../storage/interviewStorage.ts'
import { createTranscriptionAdapter } from '../transcription/adapter.ts'
import { toSpeakerHints } from '../transcription/payload.ts'
import type { AudioRecordingMeta } from '../types.ts'
import { ExportPanel } from './ExportPanel.tsx'
import { ProgressHeader } from './ProgressHeader.tsx'
import { QuestionPanel } from './QuestionPanel.tsx'
import { RecordingControls } from './RecordingControls.tsx'
import { TranscriptEditor } from './TranscriptEditor.tsx'

function revokeAll(urls: Record<string, string>) {
  for (const url of Object.values(urls)) {
    URL.revokeObjectURL(url)
  }
}

export function InterviewCockpit() {
  const interview = useInterview()
  const recorder = useRecorder()
  const adapter = useMemo(() => createTranscriptionAdapter(), [])
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [playbackUrls, setPlaybackUrls] = useState<Record<string, string>>({})
  const [adapterMessage, setAdapterMessage] = useState<string>()
  const [liveMessage, setLiveMessage] = useState('Valmis kirjaamaan tarinaa.')

  const liveRecording = recorder.uiState === 'recording' || recorder.uiState === 'paused'

  const topicMarker = useCallback((): TopicMarker | undefined => {
    if (!liveRecording) return undefined
    return {
      offsetMs: recorder.elapsedMs,
      tapeIndex: interview.session.recordings.length,
    }
  }, [interview.session.recordings.length, liveRecording, recorder.elapsedMs])

  useEffect(() => {
    let cancelled = false
    const ids = interview.session.recordings.map((item) => item.id)

    async function loadUrls() {
      const next: Record<string, string> = {}
      for (const id of ids) {
        try {
          const url = await createObjectUrl(id)
          if (url) next[id] = url
        } catch {
          // Missing clip is fine after another browser or cleared storage.
        }
      }
      if (!cancelled) {
        setPlaybackUrls((previous) => {
          revokeAll(previous)
          return next
        })
      } else {
        revokeAll(next)
      }
    }

    void loadUrls()
    return () => {
      cancelled = true
    }
  }, [interview.session.recordings])

  useEffect(() => () => {
    setPlaybackUrls((previous) => {
      revokeAll(previous)
      return {}
    })
  }, [])

  const persistRecording = useCallback(
    async (meta: Omit<AudioRecordingMeta, 'id' | 'blobRef' | 'createdAt'> & { blob: Blob }) => {
      const id = createId('nauha')
      const createdAt = nowIso()
      await saveAudioClip({
        id,
        blob: meta.blob,
        mimeType: meta.mimeType,
        createdAt,
      })
      interview.addRecording({
        id,
        blobRef: id,
        createdAt,
        mimeType: meta.mimeType,
        durationMs: meta.durationMs,
        sizeBytes: meta.blob.size,
        source: meta.source,
        fileName: meta.fileName,
      })
      setLiveMessage('Nauhoitus tallennettiin yhteiseen istuntoon.')
    },
    [interview],
  )

  const handleRecord = useCallback(() => {
    if (recorder.uiState === 'idle' || recorder.uiState === 'error') {
      void recorder.start().then((ok) => {
        if (ok) {
          interview.markTopic({
            offsetMs: 0,
            tapeIndex: interview.session.recordings.length,
          })
          interview.markRecordingWindow()
          setLiveMessage('Nauhoitus käynnissä. Aiheen vaihto ei katkaise ääntä.')
        }
      })
    }
  }, [interview, recorder])

  const handlePause = useCallback(() => {
    if (recorder.uiState === 'recording') {
      recorder.pause()
      setLiveMessage('Nauhoitus tauolla. Kello jatkuu, kun jatkat.')
      return
    }
    if (recorder.uiState === 'paused') {
      recorder.resume()
      setLiveMessage('Nauhoitus jatkuu.')
    }
  }, [recorder])

  const handleStop = useCallback(() => {
    void recorder.stop().then((result) => {
      if (result) {
        setLiveMessage('Nauhoitus lopetettu. Paina Tallenna, jotta nauha jää tälle laitteelle.')
      }
    })
  }, [recorder])

  const handleSave = useCallback(async () => {
    const result = await recorder.save()
    if (!result) return
    try {
      await persistRecording({
        blob: result.blob,
        mimeType: result.mimeType,
        durationMs: result.durationMs,
        source: 'media-recorder',
      })
    } catch {
      setLiveMessage('Ääntä ei voitu tallentaa IndexedDB:hen. Muistiinpanot säilyvät.')
    }
  }, [persistRecording, recorder])

  const handleUpload = useCallback(
    async (file: File) => {
      try {
        await persistRecording({
          blob: file,
          mimeType: file.type || 'audio/*',
          source: 'file-upload',
          fileName: file.name,
        })
      } catch {
        setLiveMessage('Tiedoston liittäminen epäonnistui.')
      }
    },
    [persistRecording],
  )

  const handleNext = useCallback(() => {
    interview.next(topicMarker())
    setLiveMessage(
      liveRecording
        ? 'Aihe vaihtui, nauhoitus jatkuu.'
        : 'Seuraava aihe. Nauhoitus ei katkennut, koska se ei ollut käynnissä.',
    )
  }, [interview, liveRecording, topicMarker])

  const handlePrevious = useCallback(() => {
    interview.previous(topicMarker())
    setLiveMessage(
      liveRecording ? 'Edellinen aihe, nauhoitus jatkuu.' : 'Edellinen aihe.',
    )
  }, [interview, liveRecording, topicMarker])

  const handleGoTo = useCallback(
    (index: number) => {
      interview.goTo(index, topicMarker())
      if (liveRecording) {
        setLiveMessage('Aihe vaihtui, nauhoitus jatkuu.')
      }
    },
    [interview, liveRecording, topicMarker],
  )

  const openRestart = useCallback(() => {
    dialogRef.current?.showModal()
  }, [])

  const confirmRestart = useCallback(async () => {
    dialogRef.current?.close()
    await recorder.discard()
    await interview.restart()
    setAdapterMessage(undefined)
    setLiveMessage('Yhteinen haastattelu tyhjennettiin.')
  }, [interview, recorder])

  const handleExportJson = useCallback(() => {
    downloadJson(exportFileName(interview.session), interview.exportDocument)
    setLiveMessage('JSON-kopio ladattiin.')
  }, [interview.exportDocument, interview.session])

  const handleExportText = useCallback(() => {
    downloadText(storiesFileName(interview.session), toStoriesText(interview.session))
    setLiveMessage('Tekstitiedosto ladattiin.')
  }, [interview.session])

  const handleMergeSegments = useCallback(() => {
    const text = interview.answer.segments
      .map((segment) => `${SPEAKER_LABELS[segment.speaker]}: ${segment.text}`.trim())
      .filter((line) => line.length > 0)
      .join('\n\n')
    if (text) {
      interview.updateTranscript(text)
      setLiveMessage('Jaksot yhdistettiin litteraatiksi.')
    }
  }, [interview])

  const handleTranscription = useCallback(async () => {
    const latest = interview.session.recordings.at(-1)
    let audioBlob: Blob | undefined
    if (latest) {
      try {
        const clip = await getAudioClip(latest.id)
        audioBlob = clip?.blob
      } catch {
        audioBlob = undefined
      }
    }

    const result = await adapter.transcribe({
      interviewId: interview.session.id,
      language: 'fi',
      audioBlob,
      audioBlobRef: latest?.blobRef,
      mimeType: latest?.mimeType,
      durationMs: latest?.durationMs,
      speakers: toSpeakerHints(),
      diarization: true,
      topicTimestamps: interview.session.topicTimestamps,
      questions: interview.session.answers.map((item) => ({
        id: item.questionId,
        question: item.question,
        theme: item.theme,
        cueOffsetMs: item.cueOffsetMs,
      })),
    })

    interview.updateTranscript(result.transcript)
    if (result.segments.length > 0) {
      interview.setSegments(result.segments)
    }
    setAdapterMessage(result.message)
    setLiveMessage(result.message)
  }, [adapter, interview])

  useKeyboardShortcuts({
    onRecord: handleRecord,
    onPause: handlePause,
    onStop: handleStop,
    onSave: () => {
      void handleSave()
    },
    onNext: handleNext,
    onPrevious: handlePrevious,
    onRestart: openRestart,
  })

  return (
    <div className="cockpit">
      <a className="skip-link" href="#sisalto">
        Siirry sisältöön
      </a>

      <ProgressHeader
        respondents={interview.session.respondents}
        questionIndex={interview.questionIndex}
        questionCount={interview.questionCount}
        onGoTo={handleGoTo}
      />

      <p className="visually-hidden" aria-live="polite">
        {liveMessage}
      </p>

      <main id="sisalto" className="layout">
        <div className="layout__primary">
          <QuestionPanel question={interview.question} index={interview.questionIndex} />
          <RecordingControls
            support={recorder.support}
            uiState={recorder.uiState}
            elapsedMs={recorder.elapsedMs}
            errorMessage={recorder.errorMessage}
            canPause={recorder.canPause}
            recordings={interview.session.recordings}
            topicTimestamps={interview.session.topicTimestamps}
            playbackUrls={playbackUrls}
            onRecord={handleRecord}
            onPause={handlePause}
            onStop={handleStop}
            onSave={() => {
              void handleSave()
            }}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onRestart={openRestart}
            onUpload={(file) => {
              void handleUpload(file)
            }}
            isFirst={interview.isFirst}
            isLast={interview.isLast}
          />
        </div>

        <div className="layout__side">
          <TranscriptEditor
            notes={interview.answer.notes}
            transcript={interview.answer.transcript}
            segments={interview.answer.segments}
            adapterName={adapter.name}
            adapterMessage={adapterMessage}
            onNotesChange={interview.updateNotes}
            onTranscriptChange={interview.updateTranscript}
            onAddSegment={interview.addSegment}
            onUpdateSegment={interview.updateSegment}
            onRemoveSegment={interview.removeSegment}
            onRequestTranscription={() => {
              void handleTranscription()
            }}
            onMergeSegments={handleMergeSegments}
          />
          <ExportPanel
            interviewId={interview.session.id}
            updatedAt={formatClock(interview.session.updatedAt)}
            respondentNames={respondentNamesWithYears(interview.session.respondents)}
            onExportText={handleExportText}
            onExportJson={handleExportJson}
          />
        </div>
      </main>

      <dialog ref={dialogRef} className="confirm" aria-labelledby="alusta-otsikko">
        <h2 id="alusta-otsikko">Tyhjennetäänkö yhteinen haastattelu?</h2>
        <p>
          Tämä pyyhkii Leenan ja Jorman yhteiset muistiinpanot, litteraatit, aihemerkit ja nauhat
          tältä laitteelta. Toimintoa ei voi perua.
        </p>
        <div className="button-row">
          <button type="button" className="btn" onClick={() => dialogRef.current?.close()}>
            Peruuta
          </button>
          <button type="button" className="btn btn--record" onClick={() => void confirmRestart()}>
            Kyllä, tyhjennä
          </button>
        </div>
      </dialog>
    </div>
  )
}
