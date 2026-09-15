import { createId } from '../lib/id.ts'
import { EMPTY_TRANSCRIPT_PLACEHOLDER } from '../storage/interviewStorage.ts'
import { buildWebhookPayload } from './payload.ts'
import type {
  TranscriptionAdapter,
  TranscriptionRequest,
  TranscriptionResult,
  TranscriptionWebhookPayload,
} from './types.ts'

export class PlaceholderTranscriptionAdapter implements TranscriptionAdapter {
  readonly name = 'placeholder'

  async transcribe(_request: TranscriptionRequest): Promise<TranscriptionResult> {
    return {
      status: 'placeholder',
      transcript: EMPTY_TRANSCRIPT_PLACEHOLDER,
      segments: [],
      provider: this.name,
      message:
        'Litterointiputki on valmis kytkettäväksi. Tämä adapteri ei lähetä ääntä minnekään eikä ' +
        'kutsu webhookia haastattelun aikana — kirjoita jaksot käsin tai määritä webhook jälkeenpäin.',
    }
  }

  buildWebhookPayload(request: TranscriptionRequest, callbackUrl?: string): TranscriptionWebhookPayload {
    return buildWebhookPayload(request, callbackUrl)
  }
}

export class WebhookTranscriptionAdapter implements TranscriptionAdapter {
  readonly name = 'webhook'
  private readonly endpoint: string
  private readonly callbackUrl?: string

  constructor(endpoint: string, callbackUrl?: string) {
    this.endpoint = endpoint
    this.callbackUrl = callbackUrl
  }

  async transcribe(request: TranscriptionRequest): Promise<TranscriptionResult> {
    const payload = this.buildWebhookPayload(request, this.callbackUrl)
    const body = new FormData()
    body.set('payload', JSON.stringify(payload))
    if (request.audioBlob) {
      body.set('audio', request.audioBlob, `${request.interviewId}.audio`)
    }

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        body,
      })
      if (!response.ok) {
        return {
          status: 'failed',
          transcript: EMPTY_TRANSCRIPT_PLACEHOLDER,
          segments: [],
          provider: this.name,
          message: `Webhook vastasi tilalla ${response.status}.`,
        }
      }
      return {
        status: 'queued',
        transcript: EMPTY_TRANSCRIPT_PLACEHOLDER,
        segments: [
          {
            id: createId('jakso'),
            speaker: 'unknown',
            text: 'Litterointi jonossa ulkoisessa putkessa. Puhujat: Vili / Leena / Jorma / Tuntematon.',
          },
        ],
        provider: this.name,
        message:
          'Pyyntö lähetettiin litterointiputkeen jälkeenpäin. Mukana on koko istunnon ääni, aihemerkit ja ' +
          'puhujien erottelu (Vili / Leena / Jorma / Tuntematon).',
      }
    } catch {
      return {
        status: 'failed',
        transcript: EMPTY_TRANSCRIPT_PLACEHOLDER,
        segments: [],
        provider: this.name,
        message: 'Webhook-kutsu epäonnistui. Tarkista VITE_TRANSCRIPTION_WEBHOOK_URL.',
      }
    }
  }

  buildWebhookPayload(request: TranscriptionRequest, callbackUrl?: string): TranscriptionWebhookPayload {
    return buildWebhookPayload(request, callbackUrl ?? this.callbackUrl)
  }
}

export function createTranscriptionAdapter(): TranscriptionAdapter {
  const endpoint = import.meta.env.VITE_TRANSCRIPTION_WEBHOOK_URL as string | undefined
  const callback = import.meta.env.VITE_TRANSCRIPTION_CALLBACK_URL as string | undefined
  if (endpoint) {
    return new WebhookTranscriptionAdapter(endpoint, callback)
  }
  return new PlaceholderTranscriptionAdapter()
}
