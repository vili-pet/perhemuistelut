import type { ChangeEvent } from 'react'
import { SPEAKER_LABELS } from '../data/participants.ts'
import { SPEAKER_IDS, type SpeakerId, type SpeakerSegment } from '../types.ts'

interface TranscriptEditorProps {
  notes: string
  transcript: string
  segments: SpeakerSegment[]
  adapterName: string
  adapterMessage?: string
  onNotesChange: (value: string) => void
  onTranscriptChange: (value: string) => void
  onAddSegment: (speaker?: SpeakerId) => void
  onUpdateSegment: (id: string, patch: Partial<SpeakerSegment>) => void
  onRemoveSegment: (id: string) => void
  onRequestTranscription: () => void
  onMergeSegments: () => void
}

export function TranscriptEditor({
  notes,
  transcript,
  segments,
  adapterName,
  adapterMessage,
  onNotesChange,
  onTranscriptChange,
  onAddSegment,
  onUpdateSegment,
  onRemoveSegment,
  onRequestTranscription,
  onMergeSegments,
}: TranscriptEditorProps) {
  return (
    <section className="editor" aria-labelledby="tarina-otsikko">
      <h2 id="tarina-otsikko">Tämän aiheen muistiinpanot</h2>
      <p className="editor__hint">
        Leena ja Jorma juttelevat yhdessä. Kirjoita vapaasti. Teksti tallentuu tälle laitteelle
        automaattisesti. Äänitys on vapaaehtoinen.
      </p>

      <label className="field">
        <span>Muistiinpanot ja tarina</span>
        <textarea
          value={notes}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onNotesChange(event.target.value)}
          rows={12}
          placeholder="Kirjoita tähän Leenan ja Jorman muisto omilla sanoilla…"
        />
      </label>

      <details className="extra-tools">
        <summary>Litterointi ja puhujajaksot (valinnainen)</summary>
        <p className="editor__hint">
          Adapteri: <strong>{adapterName}</strong>. Puhujat: Vili, Leena, Jorma tai Tuntematon.
          Selainnauhoitus on lähde. Letterly ja Hedy kytketään vasta jälkeenpäin — ei live-webhookia
          haastattelun aikana.
        </p>

        <label className="field">
          <span>Litteraatti</span>
          <textarea
            value={transcript}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
              onTranscriptChange(event.target.value)
            }
            rows={6}
          />
        </label>

        <div className="button-row">
          <button type="button" className="btn" onClick={() => onAddSegment('unknown')}>
            Lisää jakso
          </button>
          <button type="button" className="btn" onClick={onMergeSegments}>
            Yhdistä jaksot litteraatiksi
          </button>
          <button type="button" className="btn btn--ghost" onClick={onRequestTranscription}>
            Valmistele litterointipyyntö
          </button>
        </div>

        {adapterMessage ? (
          <p className="status-line" role="status">
            {adapterMessage}
          </p>
        ) : null}

        <ol className="segments">
          {segments.map((segment, index) => (
            <li key={segment.id} className="segment">
              <div className="segment__meta">
                <label>
                  <span className="visually-hidden">Puhuja jaksossa {index + 1}</span>
                  <select
                    value={segment.speaker}
                    onChange={(event) =>
                      onUpdateSegment(segment.id, { speaker: event.target.value as SpeakerId })
                    }
                  >
                    {SPEAKER_IDS.map((id) => (
                      <option key={id} value={id}>
                        {SPEAKER_LABELS[id]}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="btn btn--tiny"
                  onClick={() => onRemoveSegment(segment.id)}
                >
                  Poista jakso
                </button>
              </div>
              <label className="field">
                <span className="visually-hidden">Teksti, {SPEAKER_LABELS[segment.speaker]}</span>
                <textarea
                  value={segment.text}
                  onChange={(event) => onUpdateSegment(segment.id, { text: event.target.value })}
                  rows={3}
                  placeholder="Puhujan sanat…"
                />
              </label>
            </li>
          ))}
        </ol>
      </details>
    </section>
  )
}
