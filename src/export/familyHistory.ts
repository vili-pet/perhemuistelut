import { getQuestionById } from '../data/questions.ts'
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
      questions: session.answers.map((answer) => {
        const definition = getQuestionById(answer.questionId)
        return {
          id: answer.questionId,
          theme: answer.theme,
          question: answer.question,
          prompts: definition?.prompts ?? [],
          followUps: definition?.followUps ?? [],
          recordedAt: {
            startedAt: answer.startedAt,
            endedAt: answer.endedAt,
          },
          audio: answer.recordings,
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
  return session.respondents[0]?.id ?? 'haastattelu'
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
  const who = session.respondents.map((person) =>
    person.birthYear ? `${person.name} (s. ${person.birthYear})` : person.name,
  )
  const lines = [
    'Perhemuistelut',
    `Haastateltava: ${who.join(', ')}`,
    `Haastattelija: ${session.interviewer.name}`,
    `Päivitetty: ${session.updatedAt}`,
    '',
  ]

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
