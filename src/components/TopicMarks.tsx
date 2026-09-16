import type { QuestionMark } from '../types.ts'

interface TopicMarksProps {
  mark: QuestionMark
  pokeConfigured: boolean
  pokeMessage?: string
  onChange: (patch: Partial<QuestionMark>) => void
  onSendPoke: () => void
}

export function TopicMarks({
  mark,
  pokeConfigured,
  pokeMessage,
  onChange,
  onSendPoke,
}: TopicMarksProps) {
  return (
    <section className="marks" aria-labelledby="merkit-otsikko">
      <h2 id="merkit-otsikko">Merkinnät</h2>
      <p className="editor__hint">
        Liputa aihe kesken puheen. Ääni ei katkea. Palaa myöhemmin -listasta hyppäät takaisin.
      </p>
      <div className="marks__toggles" role="group" aria-label="Aiheen merkit">
        <button
          type="button"
          className={mark.interesting ? 'btn btn--save' : 'btn'}
          aria-pressed={mark.interesting}
          onClick={() => onChange({ interesting: !mark.interesting })}
        >
          Kiinnostava
        </button>
        <button
          type="button"
          className={mark.returnLater ? 'btn btn--record' : 'btn'}
          aria-pressed={mark.returnLater}
          onClick={() => onChange({ returnLater: !mark.returnLater })}
        >
          Palaa myöhemmin
        </button>
      </div>
      <label className="field">
        <span>Lyhyt merkintä</span>
        <textarea
          value={mark.note}
          onChange={(event) => onChange({ note: event.target.value })}
          rows={2}
          placeholder="Esim. palataan autoon, kun Jorma muistaa merkin."
        />
      </label>
      {mark.returnLater ? (
        <div className="button-row">
          <button
            type="button"
            className="btn"
            onClick={onSendPoke}
            disabled={Boolean(mark.pokeSentAt)}
          >
            {mark.pokeSentAt
              ? 'Poke-muistutus lähetetty'
              : pokeConfigured
                ? 'Lähetä Poke-muistutus'
                : 'Merkitse paikallisesti (Poke ei kytketty)'}
          </button>
        </div>
      ) : null}
      {!pokeConfigured ? (
        <p className="editor__hint">
          Poke on valinnainen muistutus ulos. Se ei hae kysymyksiä. Avain:{' '}
          <code>VITE_POKE_API_KEY</code>.
        </p>
      ) : null}
      {pokeMessage ? (
        <p className="status-line" role="status">
          {pokeMessage}
        </p>
      ) : null}
    </section>
  )
}
