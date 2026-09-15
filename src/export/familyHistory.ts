import { getQuestionById } from '../data/questions.ts'
import { EMPTY_TRANSCRIPT_PLACEHOLDER } from '../storage/interviewStorage.ts'
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

export function exportFileName(session: InterviewSession): string {
  const date = session.updatedAt.slice(0, 10)
  return `perhemuistelut-${date}.json`
}
