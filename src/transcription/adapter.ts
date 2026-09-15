import { createId } from '../lib/id.ts'
import { EMPTY_TRANSCRIPT_PLACEHOLDER } from '../storage/interviewStorage.ts'
import { buildWebhookPayload, hedyCallbackUrl, hedyEndpoint } from './payload.ts'
import type {
  TranscriptionAdapter,
  TranscriptionRequest,
  TranscriptionResult,
  TranscriptionWebhookPayload,
} from './types.ts'

export class PlaceholderTranscriptionAdapter implements TranscriptionAdapter {
  readonly name = 'hedy-placeholder'

  async transcribe(_request: TranscriptionRequest): Promise<TranscriptionResult> {
    return {
      status: 'placeholder',
      transcript: EMPTY_TRANSCRIPT_PLACEHOLDER,
      segments: [],
      provider: this.name,
      message:
        'Hedy on jälkikäsittely, ei live-kaappaus. Tämä paikka-adapteri ei lähetä ääntä minnekään ' +
        'eikä kutsu Hedya haastattelun aikana. Tallenna äänitiedosto koneelle, avaa se asennetussa ' +
        'Hedy-sovelluksessa myöhemmin, ja palauta litterointi API:lla tai webhookilla. ' +
        'Puhujatägit (Vili / Leena / Jorma / Tuntematon) ovat luonnos, kunnes Vili tarkistaa ne. ' +
        'Aseta VITE_HEDY_WEBHOOK_URL tai VITE_HEDY_API_URL, jos haluat jonottaa pyynnön jälkeenpäin.',
    }
  }

  buildWebhookPayload(request: TranscriptionRequest, callbackUrl?: string): TranscriptionWebhookPayload {
    return buildWebhookPayload(request, callbackUrl)
  }
}

export class WebhookTranscriptionAdapter implements TranscriptionAdapter {
  readonly name = 'hedy'
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
          message: `Hedy-webhook vastasi tilalla ${response.status}. Litterointi jää luonnokseksi, kunnes Vili tarkistaa.`,
        }
      }
      return {
        status: 'queued',
        transcript: EMPTY_TRANSCRIPT_PLACEHOLDER,
        segments: [
          {
            id: createId('jakso'),
            speaker: 'unknown',
            text:
              'Litterointi jonossa Hedyssä (jälkikäsittely). Puhujat luonnoksena: Vili / Leena / Jorma / Tuntematon. Vili tarkistaa tägit.',
          },
        ],
        provider: this.name,
        message:
          'Pyyntö jonotettiin Hedyyn jälkeenpäin. Mukana on äänimetatieto, blob/file-viite, aihemerkit ja ' +
          'puhujaluonnos (Vili / Leena / Jorma / Tuntematon). Diarisointi ei ole lopullinen — Vili tarkistaa tägit. ' +
          'Haastattelun aikana ei ole live-kutsua eikä tuplanauhoitusta.',
      }
    } catch {
      return {
        status: 'failed',
        transcript: EMPTY_TRANSCRIPT_PLACEHOLDER,
        segments: [],
        provider: this.name,
        message:
          'Hedy-kutsu epäonnistui. Tarkista VITE_HEDY_WEBHOOK_URL / VITE_HEDY_API_URL. ' +
          'Ääntä ei lähetetty haastattelun aikana.',
      }
    }
  }

  buildWebhookPayload(request: TranscriptionRequest, callbackUrl?: string): TranscriptionWebhookPayload {
    return buildWebhookPayload(request, callbackUrl ?? this.callbackUrl)
  }
}

export function createTranscriptionAdapter(): TranscriptionAdapter {
  const endpoint = hedyEndpoint()
  const callback = hedyCallbackUrl()
  if (endpoint) {
    return new WebhookTranscriptionAdapter(endpoint, callback)
  }
  return new PlaceholderTranscriptionAdapter()
}
