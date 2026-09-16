import { isInterviewSession, migrateSession } from '../storage/interviewStorage.ts'
import type { InterviewSession } from '../types.ts'
import { jsonHeaders } from './auth.ts'

export const EXAMPLE_ARCHIVE_API_URL = 'https://example.invalid/api/perhemuistelut/interviews'

export function archiveGetUrl(baseUrl: string, interviewId: string): string {
  return `${baseUrl.replace(/\/$/, '')}/${encodeURIComponent(interviewId)}`
}

export function exampleArchivePayload(session: InterviewSession) {
  return {
    source: 'perhemuistelut.archive.v1',
    interview: session,
  }
}

export async function fetchInterviewFromArchive(
  interviewId: string,
): Promise<{ session: InterviewSession | null; message: string }> {
  const endpoint = import.meta.env.VITE_ARCHIVE_API_URL
  if (!endpoint) {
    return {
      session: null,
      message: 'Arkisto-API ei ole kytketty. Vastaukset haetaan tältä laitteelta (localStorage).',
    }
  }

  try {
    const response = await fetch(archiveGetUrl(endpoint, interviewId), {
      headers: jsonHeaders(import.meta.env.VITE_ARCHIVE_API_KEY),
    })
    if (!response.ok) {
      return {
        session: null,
        message: `Arkisto vastasi ${response.status}. Paikallinen tallenne jää voimaan.`,
      }
    }
    const payload: unknown = await response.json()
    const raw =
      payload && typeof payload === 'object' && 'interview' in payload
        ? (payload as { interview: unknown }).interview
        : payload
    if (!isInterviewSession(raw)) {
      return { session: null, message: 'Arkiston payload ei ole kelvollinen haastattelu.' }
    }
    return {
      session: migrateSession(raw),
      message: 'Haastattelu haettiin arkisto-API:sta.',
    }
  } catch {
    return {
      session: null,
      message: 'Arkisto-API:in ei saatu yhteyttä. Paikallinen tallenne jää voimaan.',
    }
  }
}
