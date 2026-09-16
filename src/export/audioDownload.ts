import { extensionForMime } from '../recording/mediaRecorder.ts'
import type { AudioRecordingMeta, InterviewSession } from '../types.ts'
import { respondentSlug } from './familyHistory.ts'

export function audioFileName(
  session: InterviewSession,
  recording: Pick<AudioRecordingMeta, 'mimeType' | 'fileName'>,
  tapeIndex: number,
): string {
  const uploaded = recording.fileName?.trim()
  if (uploaded) return uploaded
  const date = session.updatedAt.slice(0, 10)
  const ext = extensionForMime(recording.mimeType)
  return `perhemuistelut-${respondentSlug(session)}-nauha-${tapeIndex + 1}-${date}.${ext}`
}

export function pendingAudioFileName(session: InterviewSession, mimeType: string): string {
  const alreadySaved = session.recordings.length
  const tapeIndex = alreadySaved > 0 ? alreadySaved - 1 : 0
  return audioFileName(session, { mimeType }, tapeIndex)
}

export function downloadAudioBlob(filename: string, blob: Blob): void {
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
