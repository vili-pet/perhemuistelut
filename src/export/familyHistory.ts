import { getQuestionById } from '../data/questions.ts'
import { respondentNamesWithYears } from '../data/participants.ts'
import {
  answerHasContent,
  EMPTY_TRANSCRIPT_PLACEHOLDER,
} from '../storage/interviewStorage.ts'
import { nowIso } from '../lib/id.ts'
import type { FamilyHistoryExport, InterviewSession } from '../types.ts'

export function toFamilyHistoryExport(session: InterviewSession): FamilyHistoryExport {
  return {
    schema: 'perhemuistelut.family-history.v1',
    exportedAt: nowIso(),
    interview: {
      id: session.id,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      interviewer: session.interviewer,
      respondents: session.respondents,
      continuousRecording: true,
      audio: session.recordings,
      topicTimestamps: session.topicTimestamps,
      questions: session.answers.map((answer) => {
        const definition = getQuestionById(answer.questionId)
        return {
          id: answer.questionId,
          theme: answer.theme,
          themeId: definition?.themeId ?? 'lapsuus',
          label: definition?.label ?? answer.theme,
          question: answer.question,
          followUps: definition?.followUps ?? [],
          recordedAt: {
            startedAt: answer.startedAt,
            endedAt: answer.endedAt,
            cueOffsetMs: answer.cueOffsetMs,
          },
          transcript: {
            text: answer.transcript,
            placeholder: answer.transcript === EMPTY_TRANSCRIPT_PLACEHOLDER || answer.transcript.trim() === '',
            segments: answer.segments,
          },
          notes: answer.notes,
        }
      }),
    },
  }
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], {
    type: 'application/json;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function respondentSlug(session: InterviewSession): string {
  const ids = session.respondents.map((person) => person.id)
  return ids.length > 0 ? ids.join('-') : 'haastattelu'
}

export function exportFileName(session: InterviewSession): string {
  const date = session.updatedAt.slice(0, 10)
  return `perhemuistelut-${respondentSlug(session)}-${date}.json`
}

export function storiesFileName(session: InterviewSession): string {
  const date = session.updatedAt.slice(0, 10)
  return `perhemuistelut-${respondentSlug(session)}-${date}.txt`
}

export function toStoriesText(session: InterviewSession): string {
  const lines = [
    'Perhemuistelot',
    `Haastateltavat: ${respondentNamesWithYears(session.respondents)}`,
    `Haastattelija: ${session.interviewer.name}`,
    `Päivitetty: ${session.updatedAt}`,
    '',
  ]

  if (session.recordings.length > 0) {
    lines.push(`Nauhoja: ${session.recordings.length}`)
    lines.push('')
  }

  if (session.topicTimestamps.length > 0) {
    lines.push('Aihemerkit:')
    for (const stamp of session.topicTimestamps) {
      const seconds = Math.max(0, Math.round(stamp.offsetMs / 1000))
      lines.push(`- ${seconds}s · nauha ${stamp.tapeIndex + 1} · ${stamp.questionId}`)
    }
    lines.push('')
  }

  for (const [index, answer] of session.answers.entries()) {
    if (!answerHasContent(answer)) continue
    lines.push(`${index + 1}. ${answer.theme}`)
    lines.push(answer.question)
    lines.push('')
    if (answer.notes.trim()) {
      lines.push('Tarina:')
      lines.push(answer.notes.trim())
      lines.push('')
    }
    if (
      answer.transcript.trim() &&
      answer.transcript !== EMPTY_TRANSCRIPT_PLACEHOLDER
    ) {
      lines.push('Litteraatti:')
      lines.push(answer.transcript.trim())
      lines.push('')
    }
  }

  if (lines.at(-1) === '') lines.pop()
  return `${lines.join('\n')}\n`
}

export function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
