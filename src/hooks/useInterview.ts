import { useCallback, useEffect, useMemo, useState } from 'react'
import { QUESTIONS } from '../data/questions.ts'
import { toFamilyHistoryExport } from '../export/familyHistory.ts'
import { generatePersonalizedFollowUps } from '../facts/llm.ts'
import { createId, nowIso } from '../lib/id.ts'
import { deleteAudioClips } from '../storage/audioStore.ts'
import {
  addManualFact,
  clearSession,
  createEmptySession,
  listBlobRefs,
  loadOrCreateSession,
  patchAnswerMark,
  removeFact,
  saveSession,
  snapshotTopicAndPersonalize,
  updateFactValue,
  withPersonalizedFollowUps,
  withQuestionIndex,
  type TopicMarker,
} from '../storage/interviewStorage.ts'
import type {
  AudioRecordingMeta,
  InterviewSession,
  QuestionMark,
  SessionFact,
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

export function useInterview() {
  const [session, setSession] = useState<InterviewSession>(() => loadOrCreateSession())

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

  const refineFollowUps = useCallback((snapshot: InterviewSession, destIndex: number) => {
    const dest = QUESTIONS[destIndex]
    if (!dest) return
    void generatePersonalizedFollowUps({ facts: snapshot.facts, question: dest })
      .then((result) => {
        if (result.source !== 'llm' || result.followUps.length === 0) return
        setSession((current) => withPersonalizedFollowUps(current, destIndex, result.followUps))
      })
      .catch(() => {
        // Template follow-ups already sit on the session.
      })
  }, [])

  const moveTo = useCallback(
    (index: number, marker?: TopicMarker) => {
      setSession((current) => {
        const from = current.currentQuestionIndex
        const moved = withQuestionIndex(current, index, marker)
        if (moved.currentQuestionIndex !== from) {
          refineFollowUps(moved, moved.currentQuestionIndex)
        }
        return moved
      })
    },
    [refineFollowUps],
  )

  const goTo = useCallback(
    (index: number, marker?: TopicMarker) => {
      moveTo(index, marker)
    },
    [moveTo],
  )

  const next = useCallback(
    (marker?: TopicMarker) => {
      setSession((current) => {
        const moved = withQuestionIndex(current, current.currentQuestionIndex + 1, marker)
        if (moved.currentQuestionIndex !== current.currentQuestionIndex) {
          refineFollowUps(moved, moved.currentQuestionIndex)
        }
        return moved
      })
    },
    [refineFollowUps],
  )

  const previous = useCallback(
    (marker?: TopicMarker) => {
      setSession((current) => {
        const moved = withQuestionIndex(current, current.currentQuestionIndex - 1, marker)
        if (moved.currentQuestionIndex !== current.currentQuestionIndex) {
          refineFollowUps(moved, moved.currentQuestionIndex)
        }
        return moved
      })
    },
    [refineFollowUps],
  )

  const markTopic = useCallback((marker: TopicMarker) => {
    setSession((current) => withQuestionIndex(current, current.currentQuestionIndex, marker))
  }, [])

  const harvestFacts = useCallback(() => {
    setSession((current) => {
      const harvested = snapshotTopicAndPersonalize(
        current,
        current.currentQuestionIndex,
        current.currentQuestionIndex,
      )
      refineFollowUps(harvested, harvested.currentQuestionIndex)
      return harvested
    })
  }, [refineFollowUps])

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

  const addSegment = useCallback((speaker: SpeakerId = 'unknown') => {
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
  }, [])

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

  const updateMark = useCallback((patch: Partial<QuestionMark>) => {
    setSession((current) => patchAnswerMark(current, current.currentQuestionIndex, patch))
  }, [])

  const editFact = useCallback((factId: string, value: string) => {
    setSession((current) => updateFactValue(current, factId, value))
  }, [])

  const deleteFact = useCallback((factId: string) => {
    setSession((current) => removeFact(current, factId))
  }, [])

  const addFact = useCallback((input: Pick<SessionFact, 'kind' | 'key' | 'label' | 'value'>) => {
    setSession((current) => addManualFact(current, input))
  }, [])

  const addRecording = useCallback((recording: AudioRecordingMeta) => {
    setSession((current) => ({
      ...current,
      recordings: [...current.recordings, recording],
      updatedAt: nowIso(),
      answers: current.answers.map((item, index) =>
        index === current.currentQuestionIndex
          ? {
              ...item,
              startedAt: item.startedAt ?? recording.createdAt,
              endedAt: recording.createdAt,
            }
          : item,
      ),
    }))
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
    clearSession()
    setSession(createEmptySession())
  }, [session])

  const exportDocument = useMemo(() => toFamilyHistoryExport(session), [session])

  return {
    session,
    question,
    answer,
    questionIndex,
    questionCount: QUESTIONS.length,
    isFirst,
    isLast,
    goTo,
    next,
    previous,
    markTopic,
    harvestFacts,
    updateNotes,
    updateTranscript,
    addSegment,
    updateSegment,
    removeSegment,
    setSegments,
    updateMark,
    editFact,
    deleteFact,
    addFact,
    addRecording,
    markRecordingWindow,
    restart,
    exportDocument,
  }
}
