import { useState } from 'react'
import type { SessionFact } from '../types.ts'

interface FactBankProps {
  facts: SessionFact[]
  onEdit: (id: string, value: string) => void
  onRemove: (id: string) => void
  onAdd: (input: { kind: SessionFact['kind']; key: string; label: string; value: string }) => void
}

export function FactBank({ facts, onEdit, onRemove, onAdd }: FactBankProps) {
  const [draft, setDraft] = useState('')

  const addPlace = () => {
    const value = draft.trim()
    if (!value) return
    onAdd({
      kind: 'place',
      key: 'syntymäpaikka',
      label: 'Syntymäpaikka',
      value,
    })
    setDraft('')
  }

  return (
    <section className="facts" aria-labelledby="faktat-otsikko">
      <h2 id="faktat-otsikko">Faktapankki</h2>
      <p className="editor__hint">
        Kerätään aiheenvaihdossa muistiinpanoista ja litteraatista. Korjaa tarvittaessa, esim.
        syntymäpaikka: Simpele. Pääkysymyksiä ei kirjoiteta uusiksi.
      </p>
      {facts.length === 0 ? (
        <p>Ei vielä faktoja. Kirjoita muistiinpano tai nauhoita, sitten vaihda aihetta.</p>
      ) : (
        <ul className="fact-chips">
          {facts.map((fact) => (
            <li key={fact.id} className="fact-chip">
              <label>
                <span className="fact-chip__key">{fact.label}</span>
                <input
                  value={fact.value}
                  onChange={(event) => onEdit(fact.id, event.target.value)}
                  aria-label={`${fact.label}: ${fact.value}`}
                />
              </label>
              <button type="button" className="btn btn--tiny" onClick={() => onRemove(fact.id)}>
                Poista
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="fact-add">
        <label className="field">
          <span>Lisää tai korjaa syntymäpaikka</span>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Simpele"
          />
        </label>
        <button type="button" className="btn" onClick={addPlace}>
          Tallenna paikka
        </button>
      </div>
    </section>
  )
}
