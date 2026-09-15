import type { ChangeEvent } from 'react'
import { QUESTIONS } from '../data/questions.ts'
import { formatDuration } from '../lib/format.ts'
import type { RecorderSupport } from '../recording/mediaRecorder.ts'
import type { AudioRecordingMeta, TopicTimestamp } from '../types.ts'
import type { RecorderUiState } from '../hooks/useRecorder.ts'

interface RecordingControlsProps {
  support: RecorderSupport
  uiState: RecorderUiState
  elapsedMs: number
  errorMessage: string | null
  canPause: boolean
  recordings: AudioRecordingMeta[]
  topicTimestamps: TopicTimestamp[]
  playbackUrls: Record<string, string>
  onRecord: () => void
  onPause: () => void
  onStop: () => void
  onSave: () => void
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
  if (uiState === 'recording') return 'Nauhoitus käynnissä. Aiheen vaihto ei katkaise ääntä.'
  if (uiState === 'paused') return 'Nauhoitus tauolla. Kello ja nauha jatkuvat kun jatkat.'
  if (uiState === 'pending') return 'Nauhoitus lopetettu. Tallenna nauha tälle laitteelle.'
  if (uiState === 'saving') return 'Tallennetaan nauhoitusta'
  if (uiState === 'error') return 'Nauhoituksessa tapahtui virhe'
  return 'Valmis nauhoittamaan. Yksi nauha voi kattaa koko haastattelun.'
}

export function RecordingControls({
  support,
  uiState,
  elapsedMs,
  errorMessage,
  canPause,
  recordings,
  topicTimestamps,
  playbackUrls,
  onRecord,
  onPause,
  onStop,
  onSave,
  onNext,
  onPrevious,
  onRestart,
  onUpload,
  isFirst,
  isLast,
}: RecordingControlsProps) {
  const recording = uiState === 'recording'
  const paused = uiState === 'paused'
  const pending = uiState === 'pending'
  const live = recording || paused
  const supported = support === 'supported'

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) onUpload(file)
    event.target.value = ''
  }

  return (
    <>
      <section className="recording-dock" aria-labelledby="nauhoitus-otsikko">
        <div className="recording-dock__head">
          <h2 id="nauhoitus-otsikko">Nauhoitus</h2>
          <p className="timer" aria-live="polite">
            {formatDuration(elapsedMs)}
          </p>
        </div>
        <p className="recording-dock__status" role="status" aria-live="polite">
          {statusText(uiState, support)}
          {errorMessage ? ` ${errorMessage}` : ''}
        </p>
        <div className="recording-dock__record" role="group" aria-label="Nauhoituksen ohjaus">
          <button
            type="button"
            className="btn btn--record"
            onClick={onRecord}
            disabled={!supported || live || pending || uiState === 'saving'}
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
          <button type="button" className="btn" onClick={onStop} disabled={!supported || !live}>
            Lopeta
          </button>
          <button
            type="button"
            className="btn btn--save"
            onClick={onSave}
            disabled={!supported || !pending}
          >
            Tallenna
          </button>
        </div>
        <div className="recording-dock__nav" role="group" aria-label="Aiheiden ohjaus">
          <button type="button" className="btn" onClick={onPrevious} disabled={isFirst}>
            Edellinen
          </button>
          <button type="button" className="btn" onClick={onNext} disabled={isLast}>
            Seuraava
          </button>
        </div>
      </section>

      <section className="controls" aria-labelledby="nauha-lisat-otsikko">
        <h2 id="nauha-lisat-otsikko">Nauhan tiedot</h2>
        <p className="controls__note">
          Edellinen ja Seuraava vaihtavat vain ruudun aiheen. Ääni loppuu vain Lopeta-napista.
        </p>
        <div className="button-row">
          <button type="button" className="btn btn--ghost" onClick={onRestart}>
            Aloita alusta
          </button>
        </div>

        <label className="upload">
          <span>Liitä äänitiedosto (varatapa)</span>
          <input type="file" accept="audio/*" onChange={handleUpload} />
        </label>

        <details className="shortcuts">
          <summary>Pikanäppäimet</summary>
          <p>
            <kbd>R</kbd> nauhoita, <kbd>P</kbd> tauko, <kbd>E</kbd> lopeta, <kbd>S</kbd> tallenna,{' '}
            <kbd>←</kbd>/<kbd>B</kbd> edellinen, <kbd>→</kbd>/<kbd>N</kbd> seuraava,{' '}
            <kbd>Alt</kbd>+<kbd>K</kbd> alusta. Tekstikentässä käytä Alt-yhdistelmää.
          </p>
        </details>

        <section className="recordings" aria-labelledby="aihemerkit-otsikko">
          <h3 id="aihemerkit-otsikko">Aihemerkit tällä nauhalla</h3>
          {topicTimestamps.length === 0 ? (
            <p>Ei vielä aihemerkkejä. Merkki syntyy, kun vaihdat aihetta nauhoituksen aikana.</p>
          ) : (
            <ol>
              {topicTimestamps.map((stamp) => (
                <li key={stamp.id}>
                  {formatDuration(stamp.offsetMs)} · nauha {stamp.tapeIndex + 1} ·{' '}
                  {QUESTIONS[stamp.questionIndex]?.label ?? stamp.questionId}
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="recordings" aria-labelledby="nauhahistoria-otsikko">
          <h3 id="nauhahistoria-otsikko">Istunnon nauhat</h3>
          {recordings.length === 0 ? (
            <p>Ei vielä nauhoituksia. Yksi nauha voi sisältää koko kymmenen aiheen setin.</p>
          ) : (
            <ul>
              {recordings.map((item, index) => (
                <li key={item.id}>
                  <p>
                    Nauha {index + 1} · {item.mimeType || 'ääni'} ·{' '}
                    {item.durationMs != null ? formatDuration(item.durationMs) : 'kesto tuntematon'}{' '}
                    · {item.source === 'file-upload' ? 'liitetty tiedosto' : 'MediaRecorder'}
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
    </>
  )
}
