import { useCallback, useEffect, useMemo, useState } from 'react'
import { getRespondent } from '../data/participants.ts'
import { QUESTIONS } from '../data/questions.ts'
import { toFamilyHistoryExport } from '../export/familyHistory.ts'
import { createId, nowIso } from '../lib/id.ts'
import { deleteAudioClips } from '../storage/audioStore.ts'
import {
  clearSession,
  createEmptySession,
  listBlobRefs,
  loadOrCreateSession,
  saveSession,
} from '../storage/interviewStorage.ts'
import type {
  AudioRecordingMeta,
  InterviewSession,
  RespondentId,
  SpeakerId,
  SpeakerSegment,
} from '../types.ts'

function touchAnswer(
  session: InterviewSession,
  index: number,
  updater: (answer: InterviewSession['answers'][number]) => InterviewSession['answers'][number],
): InterviewSession {
  return {
    ...session,
    updatedAt: nowIso(),
    answers: session.answers.map((answer, answerIndex) =>
      answerIndex === index ? updater(answer) : answer,
    ),
  }
}

export function useInterview(personId: RespondentId) {
  const [session, setSession] = useState<InterviewSession>(() => loadOrCreateSession(personId))

  useEffect(() => {
    try {
      saveSession(session)
    } catch {
      // Quota or private-mode failures should not break the cockpit.
    }
  }, [session])

  const questionIndex = session.currentQuestionIndex
  const question = QUESTIONS[questionIndex]
  const answer = session.answers[questionIndex]
  const isFirst = questionIndex === 0
  const isLast = questionIndex === QUESTIONS.length - 1
  const respondent = session.respondents[0] ?? getRespondent(personId)

  const goTo = useCallback((index: number) => {
    setSession((current) => ({
      ...current,
      currentQuestionIndex: Math.min(Math.max(index, 0), QUESTIONS.length - 1),
      updatedAt: nowIso(),
    }))
  }, [])

  const next = useCallback(() => {
    setSession((current) => ({
      ...current,
      currentQuestionIndex: Math.min(current.currentQuestionIndex + 1, QUESTIONS.length - 1),
      updatedAt: nowIso(),
    }))
  }, [])

  const previous = useCallback(() => {
    setSession((current) => ({
      ...current,
      currentQuestionIndex: Math.max(current.currentQuestionIndex - 1, 0),
      updatedAt: nowIso(),
    }))
  }, [])

  const updateNotes = useCallback((notes: string) => {
    setSession((current) =>
      touchAnswer(current, current.currentQuestionIndex, (item) => ({
        ...item,
        notes,
        startedAt: item.startedAt ?? nowIso(),
      })),
    )
  }, [])

  const updateTranscript = useCallback((transcript: string) => {
    setSession((current) =>
      touchAnswer(current, current.currentQuestionIndex, (item) => ({
        ...item,
        transcript,
      })),
    )
  }, [])

  const addSegment = useCallback((speaker: SpeakerId = personId) => {
    const segment: SpeakerSegment = {
      id: createId('jakso'),
      speaker,
      text: '',
    }
    setSession((current) =>
      touchAnswer(current, current.currentQuestionIndex, (item) => ({
        ...item,
        segments: [...item.segments, segment],
      })),
    )
    return segment.id
  }, [personId])

  const updateSegment = useCallback((segmentId: string, patch: Partial<SpeakerSegment>) => {
    setSession((current) =>
      touchAnswer(current, current.currentQuestionIndex, (item) => ({
        ...item,
        segments: item.segments.map((segment) =>
          segment.id === segmentId ? { ...segment, ...patch } : segment,
        ),
      })),
    )
  }, [])

  const removeSegment = useCallback((segmentId: string) => {
    setSession((current) =>
      touchAnswer(current, current.currentQuestionIndex, (item) => ({
        ...item,
        segments: item.segments.filter((segment) => segment.id !== segmentId),
      })),
    )
  }, [])

  const setSegments = useCallback((segments: SpeakerSegment[]) => {
    setSession((current) =>
      touchAnswer(current, current.currentQuestionIndex, (item) => ({
        ...item,
        segments,
      })),
    )
  }, [])

  const addRecording = useCallback((recording: AudioRecordingMeta) => {
    setSession((current) =>
      touchAnswer(current, current.currentQuestionIndex, (item) => ({
        ...item,
        startedAt: item.startedAt ?? recording.createdAt,
        endedAt: recording.createdAt,
        recordings: [...item.recordings, recording],
      })),
    )
  }, [])

  const markRecordingWindow = useCallback(() => {
    const stamp = nowIso()
    setSession((current) =>
      touchAnswer(current, current.currentQuestionIndex, (item) => ({
        ...item,
        startedAt: item.startedAt ?? stamp,
        endedAt: stamp,
      })),
    )
  }, [])

  const restart = useCallback(async () => {
    const refs = listBlobRefs(session)
    try {
      await deleteAudioClips(refs)
    } catch {
      // Audio cleanup is best-effort.
    }
    clearSession(personId)
    setSession(createEmptySession(getRespondent(personId)))
  }, [personId, session])

  const exportDocument = useMemo(() => toFamilyHistoryExport(session), [session])

  return {
    session,
    respondent,
    question,
    answer,
    questionIndex,
    questionCount: QUESTIONS.length,
    isFirst,
    isLast,
    goTo,
    next,
    previous,
    updateNotes,
    updateTranscript,
    addSegment,
    updateSegment,
    removeSegment,
    setSegments,
    addRecording,
    markRecordingWindow,
    restart,
    exportDocument,
  }
}
