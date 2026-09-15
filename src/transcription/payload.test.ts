import { describe, expect, it } from 'vitest'
import { PlaceholderTranscriptionAdapter } from './adapter.ts'
import { buildWebhookPayload, exampleWebhookPayload, toSpeakerHints } from './payload.ts'

describe('transcription webhook payload', () => {
  it('erottelee Vilin, Leenan, Jorman ja tuntemattoman', () => {
    const payload = exampleWebhookPayload()
    expect(payload.event).toBe('transcription.requested')
    expect(payload.language).toBe('fi')
    expect(payload.diarization.enabled).toBe(true)
    expect(payload.diarization.interviewerId).toBe('vili')
    expect(payload.diarization.respondentIds).toEqual(['leena', 'jorma'])
    expect(payload.diarization.labelUnknownAs).toBe('unknown')
    expect(payload.diarization.knownSpeakers.map((speaker) => speaker.id)).toEqual([
      'vili',
      'leena',
      'jorma',
      'unknown',
    ])
  })

  it('rakentaa adapterin kautta saman rajapinnan', async () => {
    const adapter = new PlaceholderTranscriptionAdapter()
    const request = {
      interviewId: 'haastattelu-1',
      questionId: 'koti',
      question: 'Millainen koti teillä oli?',
      language: 'fi' as const,
      audioBlobRef: 'nauha-1',
      mimeType: 'audio/webm',
      speakers: toSpeakerHints(),
      diarization: true as const,
    }
    const result = await adapter.transcribe(request)
    expect(result.status).toBe('placeholder')
    expect(result.segments).toEqual([])
    expect(adapter.buildWebhookPayload(request).questionId).toBe('koti')
    expect(buildWebhookPayload(request).output.format).toBe('speaker-attributed-segments')
  })
})
