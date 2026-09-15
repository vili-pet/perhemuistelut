import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchQuestionsFromApi } from '../api/questionsSource.ts'
import { buildPokeBookmarkPayload, isPokeConfigured, sendPokeBookmark } from '../api/poke.ts'
import { SPEAKER_LABELS, respondentNamesWithYears } from '../data/participants.ts'
import {
  audioFileName,
  downloadAudioBlob,
} from '../export/audioDownload.ts'
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
import type { AudioRecordingMeta, QuestionMark } from '../types.ts'
import { BookmarkList } from './BookmarkList.tsx'
import { ExportPanel } from './ExportPanel.tsx'
import { FactBank } from './FactBank.tsx'
import { ProgressHeader } from './ProgressHeader.tsx'
import { QuestionPanel } from './QuestionPanel.tsx'
import { RecordingControls } from './RecordingControls.tsx'
import { TopicMarks } from './TopicMarks.tsx'
import { TranscriptEditor } from './TranscriptEditor.tsx'
import { useBotSync, type TelegramVoiceClip } from '../telegram/useBotSync.ts'

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
  const [pokeMessage, setPokeMessage] = useState<string>()
  const [extraFollowUps, setExtraFollowUps] = useState<string[]>([])
  const [telegramVoices, setTelegramVoices] = useState<TelegramVoiceClip[]>([])

  const liveRecording = recorder.uiState === 'recording' || recorder.uiState === 'paused'
  const pokeConfigured = isPokeConfigured()

  const topicMarker = useCallback((): TopicMarker | undefined => {
    if (!liveRecording) return undefined
    return {
      offsetMs: recorder.elapsedMs,
      tapeIndex: interview.session.recordings.length,
    }
  }, [interview.session.recordings.length, liveRecording, recorder.elapsedMs])

  useEffect(() => {
    let cancelled = false
    void fetchQuestionsFromApi().then((result) => {
      if (cancelled) return
      const match = result.questions.find((item) => item.id === interview.question.id)
      const extras = (match?.followUps ?? []).filter(
        (item) => !interview.question.followUps.includes(item),
      )
      setExtraFollowUps(extras)
    })
    return () => {
      cancelled = true
    }
  }, [interview.question.followUps, interview.question.id])

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
    async (
      meta: Omit<AudioRecordingMeta, 'id' | 'blobRef' | 'createdAt'> & { blob: Blob },
    ): Promise<AudioRecordingMeta> => {
      const id = createId('nauha')
      const createdAt = nowIso()
      await saveAudioClip({
        id,
        blob: meta.blob,
        mimeType: meta.mimeType,
        createdAt,
      })
      const saved: AudioRecordingMeta = {
        id,
        blobRef: id,
        createdAt,
        mimeType: meta.mimeType,
        durationMs: meta.durationMs,
        sizeBytes: meta.blob.size,
        source: meta.source,
        fileName: meta.fileName,
      }
      interview.addRecording(saved)
      interview.harvestFacts()
      return saved
    },
    [interview],
  )

  const beginRecording = useCallback(() => {
    void recorder.start().then((ok) => {
      if (ok) {
        interview.markTopic({
          offsetMs: 0,
          tapeIndex: interview.session.recordings.length,
        })
        interview.markRecordingWindow()
        setLiveMessage('Nauhoitus käynnissä. Aiheen vaihto ei katkaise ääntä. Hedy ei nauhoita samaan aikaan.')
      }
    })
  }, [interview, recorder])

  const handleRecord = useCallback(() => {
    if (recorder.uiState === 'pending') {
      void recorder.save().then(() => beginRecording())
      return
    }
    if (recorder.uiState === 'idle' || recorder.uiState === 'error') {
      beginRecording()
    }
  }, [beginRecording, recorder])

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
    void recorder.stop().then(async (result) => {
      if (!result) return
      interview.harvestFacts()
      try {
        await persistRecording({
          blob: result.blob,
          mimeType: result.mimeType,
          durationMs: result.durationMs,
          source: 'media-recorder',
        })
        setLiveMessage(
          'Nauhoitus lopetettu. Tallenna äänitiedosto koneelle tai puhelimeen — selaimen kopio ei yksin riitä.',
        )
      } catch {
        setLiveMessage(
          'Selainkopio epäonnistui. Tallenna äänitiedosto koneelle tai puhelimeen heti, jotta nauha ei katoa.',
        )
      }
    })
  }, [interview, persistRecording, recorder])

  const downloadTapeById = useCallback(
    async (recordingId: string) => {
      const index = interview.session.recordings.findIndex((item) => item.id === recordingId)
      const recording = interview.session.recordings[index]
      if (!recording) {
        setLiveMessage('Nauhaa ei löytynyt.')
        return
      }
      try {
        const clip = await getAudioClip(recording.blobRef)
        if (!clip) {
          setLiveMessage('Äänitiedostoa ei ole tällä selaimella. Jos latasit sen jo, se on koneella tai puhelimessa.')
          return
        }
        downloadAudioBlob(audioFileName(interview.session, recording, index), clip.blob)
        setLiveMessage('Äänitiedosto ladattiin koneelle tai puhelimeen.')
      } catch {
        setLiveMessage('Äänitiedoston lataus epäonnistui.')
      }
    },
    [interview.session],
  )

  const handleDownloadSession = useCallback(async () => {
    const pending = recorder.pending
    if (pending) {
      const matchingIndex = interview.session.recordings.findIndex(
        (item) => item.mimeType === pending.mimeType && item.durationMs === pending.durationMs,
      )
      const tapeIndex = matchingIndex >= 0 ? matchingIndex : Math.max(0, interview.session.recordings.length - 1)
      downloadAudioBlob(audioFileName(interview.session, pending, tapeIndex), pending.blob)
      await recorder.save()
      setLiveMessage('Äänitiedosto ladattiin koneelle tai puhelimeen. Vie se myöhemmin Hedyyn — ei live-nauhoitusta.')
      return
    }
    const latest = interview.session.recordings.at(-1)
    if (!latest) {
      setLiveMessage('Ei vielä äänitiedostoa. Lopeta nauhoitus ja tallenna tiedosto pois selaimesta.')
      return
    }
    await downloadTapeById(latest.id)
  }, [downloadTapeById, interview.session, recorder])

  const handleUpload = useCallback(
    async (file: File) => {
      try {
        await persistRecording({
          blob: file,
          mimeType: file.type || 'audio/*',
          source: 'file-upload',
          fileName: file.name,
        })
        setLiveMessage(
          'Tiedosto liitettiin. Tallenna äänitiedosto koneelle tai puhelimeen — selaimen kopio ei yksin riitä.',
        )
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
        ? 'Aihe vaihtui, nauhoitus jatkuu. Faktoja kerättiin edellisestä aiheesta.'
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

  const handleRemoteMark = useCallback(
    (patch: Partial<QuestionMark>) => {
      interview.updateMark(patch)
    },
    [interview],
  )

  useBotSync({
    questionIndex: interview.questionIndex,
    questionId: interview.question.id,
    mark: interview.answer.mark,
    miniAppRecording: liveRecording,
    onRemoteIndex: handleGoTo,
    onRemoteMark: handleRemoteMark,
    onRemoteVoices: setTelegramVoices,
  })

  const handleSendPoke = useCallback(async () => {
    interview.updateMark({ returnLater: true })
    const result = await sendPokeBookmark(
      buildPokeBookmarkPayload({
        session: interview.session,
        question: interview.question,
        answer: {
          ...interview.answer,
          mark: { ...interview.answer.mark, returnLater: true },
        },
      }),
    )
    setPokeMessage(result.message)
    setLiveMessage(result.message)
    if (result.ok) {
      interview.updateMark({ pokeSentAt: nowIso(), returnLater: true })
    }
  }, [interview])

  const openRestart = useCallback(() => {
    dialogRef.current?.showModal()
  }, [])

  const confirmRestart = useCallback(async () => {
    dialogRef.current?.close()
    await recorder.discard()
    await interview.restart()
    setAdapterMessage(undefined)
    setPokeMessage(undefined)
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
    if (liveRecording) {
      setLiveMessage('Nauhoitus on käynnissä. Hedy-pyyntö tehdään vasta keskustelun jälkeen.')
      return
    }
    const latest = interview.session.recordings.at(-1)
    let audioBlob: Blob | undefined = recorder.pending?.blob
    if (!audioBlob && latest) {
      try {
        const clip = await getAudioClip(latest.blobRef)
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
      mimeType: latest?.mimeType ?? recorder.pending?.mimeType,
      durationMs: latest?.durationMs ?? recorder.pending?.durationMs,
      speakers: toSpeakerHints(),
      diarization: true,
      topicTimestamps: interview.session.topicTimestamps,
      facts: interview.session.facts,
      questions: interview.session.answers.map((item) => ({
        id: item.questionId,
        question: item.question,
        theme: item.theme,
        cueOffsetMs: item.cueOffsetMs,
        personalizedFollowUps: item.personalizedFollowUps,
      })),
    })

    interview.updateTranscript(result.transcript)
    if (result.segments.length > 0) {
      interview.setSegments(result.segments)
    }
    interview.harvestFacts()
    setAdapterMessage(result.message)
    setLiveMessage(result.message)
  }, [adapter, interview, liveRecording, recorder.pending])

  useKeyboardShortcuts({
    onRecord: handleRecord,
    onPause: handlePause,
    onStop: handleStop,
    onSave: () => {
      void handleDownloadSession()
    },
    onNext: handleNext,
    onPrevious: handlePrevious,
    onRestart: openRestart,
  })

  const recordingControls = (
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
      onDownloadSession={() => {
        void handleDownloadSession()
      }}
      onDownloadTape={(recordingId) => {
        void downloadTapeById(recordingId)
      }}
      onNext={handleNext}
      onPrevious={handlePrevious}
      onRestart={openRestart}
      onUpload={(file) => {
        void handleUpload(file)
      }}
      isFirst={interview.isFirst}
      isLast={interview.isLast}
      telegramVoices={telegramVoices}
    />
  )

  return (
    <div className="cockpit">
      <a className="skip-link" href="#sisalto">
        Siirry sisältöön
      </a>

      <ProgressHeader
        respondents={interview.session.respondents}
        questionIndex={interview.questionIndex}
        questionCount={interview.questionCount}
        answers={interview.session.answers}
        onGoTo={handleGoTo}
      />

      <p className="visually-hidden" aria-live="polite">
        {liveMessage}
      </p>

      <main id="sisalto" className="layout">
        <div className="layout__primary">
          <QuestionPanel
            question={interview.question}
            index={interview.questionIndex}
            extraFollowUps={extraFollowUps}
            personalizedFollowUps={interview.answer.personalizedFollowUps}
          />
          <TopicMarks
            mark={interview.answer.mark}
            pokeConfigured={pokeConfigured}
            pokeMessage={pokeMessage}
            onChange={interview.updateMark}
            onSendPoke={() => {
              void handleSendPoke()
            }}
          />
          <TranscriptEditor
            notes={interview.answer.notes}
            transcript={interview.answer.transcript}
            segments={interview.answer.segments}
            adapterName={adapter.name}
            adapterMessage={adapterMessage}
            recordingLive={liveRecording}
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
        </div>

        <div className="layout__side">
          <BookmarkList
            answers={interview.session.answers}
            currentIndex={interview.questionIndex}
            onJump={handleGoTo}
          />
          <FactBank
            facts={interview.session.facts}
            onEdit={interview.editFact}
            onRemove={interview.deleteFact}
            onAdd={interview.addFact}
          />
          {recordingControls}
          <ExportPanel
            interviewId={interview.session.id}
            updatedAt={formatClock(interview.session.updatedAt)}
            respondentNames={respondentNamesWithYears(interview.session.respondents)}
            factCount={interview.session.facts.length}
            canDownloadAudio={
              recorder.uiState === 'pending' || interview.session.recordings.length > 0
            }
            onExportText={handleExportText}
            onExportJson={handleExportJson}
            onDownloadAudio={() => {
              void handleDownloadSession()
            }}
          />
        </div>
      </main>

      <dialog ref={dialogRef} className="confirm" aria-labelledby="alusta-otsikko">
        <h2 id="alusta-otsikko">Tyhjennetäänkö yhteinen haastattelu?</h2>
        <p>
          Tämä pyyhkii Leenan ja Jorman yhteiset muistiinpanot, litteraatit, faktat, aihemerkit ja
          nauhat tältä laitteelta. Toimintoa ei voi perua.
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
