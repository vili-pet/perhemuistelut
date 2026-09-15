import type { ChangeEvent } from 'react'
import { formatDuration } from '../lib/format.ts'
import type { RecorderSupport } from '../recording/mediaRecorder.ts'
import type { AudioRecordingMeta } from '../types.ts'
import type { RecorderUiState } from '../hooks/useRecorder.ts'

interface RecordingControlsProps {
  support: RecorderSupport
  uiState: RecorderUiState
  elapsedMs: number
  errorMessage: string | null
  canPause: boolean
  recordings: AudioRecordingMeta[]
  playbackUrls: Record<string, string>
  onRecord: () => void
  onPause: () => void
  onStopSave: () => void
  onNext: () => void
  onPrevious: () => void
  onRestart: () => void
  onUpload: (file: File) => void
  isFirst: boolean
  isLast: boolean
}

function statusText(uiState: RecorderUiState, support: RecorderSupport): string {
  if (support === 'unsupported') {
    return 'Selain ei tue MediaRecorderia. Voit liittää äänitiedoston tai kirjoittaa muistiinpanot.'
  }
  if (support === 'insecure-context') {
    return 'Nauhoitus vaatii localhostin tai HTTPS-yhteyden. Voit silti liittää tiedoston.'
  }
  if (uiState === 'recording') return 'Nauhoitus käynnissä'
  if (uiState === 'paused') return 'Nauhoitus tauolla'
  if (uiState === 'saving') return 'Tallennetaan nauhoitusta'
  if (uiState === 'error') return 'Nauhoituksessa tapahtui virhe'
  return 'Valmis nauhoittamaan'
}

export function RecordingControls({
  support,
  uiState,
  elapsedMs,
  errorMessage,
  canPause,
  recordings,
  playbackUrls,
  onRecord,
  onPause,
  onStopSave,
  onNext,
  onPrevious,
  onRestart,
  onUpload,
  isFirst,
  isLast,
}: RecordingControlsProps) {
  const recording = uiState === 'recording'
  const paused = uiState === 'paused'
  const busy = recording || paused || uiState === 'saving'
  const supported = support === 'supported'

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) onUpload(file)
    event.target.value = ''
  }

  return (
    <section className="controls" aria-labelledby="nauhoitus-otsikko">
      <div className="controls__head">
        <h2 id="nauhoitus-otsikko">Nauhoitus ja siirtymät</h2>
        <p className="timer" aria-live="polite">
          {formatDuration(elapsedMs)}
        </p>
      </div>

      <p className="status-line" role="status" aria-live="polite">
        {statusText(uiState, support)}
        {errorMessage ? ` ${errorMessage}` : ''}
      </p>

      <div className="button-row" role="group" aria-label="Nauhoituksen ohjaus">
        <button
          type="button"
          className="btn btn--record"
          onClick={onRecord}
          disabled={!supported || busy}
        >
          Nauhoita
        </button>
        <button
          type="button"
          className="btn"
          onClick={onPause}
          disabled={!supported || !canPause || (!recording && !paused)}
        >
          {paused ? 'Jatka' : 'Tauko'}
        </button>
        <button
          type="button"
          className="btn btn--save"
          onClick={onStopSave}
          disabled={!supported || (!recording && !paused)}
        >
          Lopeta ja tallenna
        </button>
      </div>

      <div className="button-row" role="group" aria-label="Kysymysten ohjaus">
        <button type="button" className="btn" onClick={onPrevious} disabled={isFirst}>
          Edellinen
        </button>
        <button type="button" className="btn" onClick={onNext} disabled={isLast}>
          Seuraava
        </button>
        <button type="button" className="btn btn--ghost" onClick={onRestart}>
          Aloita alusta
        </button>
      </div>

      <label className="upload">
        <span>Liitä äänitiedosto (varatapa)</span>
        <input type="file" accept="audio/*" onChange={handleUpload} />
      </label>

      <p className="shortcuts">
        Pikanäppäimet: <kbd>R</kbd> nauhoita, <kbd>P</kbd> tauko, <kbd>S</kbd> tallenna,{' '}
        <kbd>←</kbd>/<kbd>B</kbd> edellinen, <kbd>→</kbd>/<kbd>N</kbd> seuraava, <kbd>Alt</kbd>+
        <kbd>K</kbd> alusta. Tekstikentässä käytä Alt-yhdistelmää.
      </p>

      <section className="recordings" aria-labelledby="nauhahistoria-otsikko">
        <h3 id="nauhahistoria-otsikko">Tämän kysymyksen nauhat</h3>
        {recordings.length === 0 ? (
          <p>Ei vielä nauhoituksia.</p>
        ) : (
          <ul>
            {recordings.map((item, index) => (
              <li key={item.id}>
                <p>
                  Nauha {index + 1} · {item.mimeType || 'ääni'} ·{' '}
                  {item.durationMs != null ? formatDuration(item.durationMs) : 'kesto tuntematon'} ·{' '}
                  {item.source === 'file-upload' ? 'liitetty tiedosto' : 'MediaRecorder'}
                </p>
                {playbackUrls[item.id] ? (
                  <audio controls src={playbackUrls[item.id]} preload="metadata">
                    Selaimesi ei toista ääntä.
                  </audio>
                ) : (
                  <p>Äänitiedostoa ei voitu avata tästä laitteesta.</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  )
}
