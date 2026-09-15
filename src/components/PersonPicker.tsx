import { genitiveName, getRespondent } from '../data/participants.ts'
import { QUESTIONS } from '../data/questions.ts'
import { countSavedStories, loadSession } from '../storage/interviewStorage.ts'
import { RESPONDENT_IDS, type RespondentId } from '../types.ts'

interface PersonPickerProps {
  onSelect: (personId: RespondentId) => void
}

export function PersonPicker({ onSelect }: PersonPickerProps) {
  return (
    <div className="picker">
      <header className="picker__brand">
        <p className="eyebrow">Perhemuistelut</p>
        <h1>Kenen kanssa jutellaan?</h1>
        <p className="picker__lead">
          Tähän kerätään Vilin vanhempien tarinoita. Valitse haastateltava. Teksti riittää — voit
          nauhoittaa ääntä myöhemmin, jos se tuntuu luontevalta.
        </p>
      </header>

      <div className="person-cards">
        {RESPONDENT_IDS.map((personId) => {
          const person = getRespondent(personId)
          const saved = countSavedStories(loadSession(personId))
          const relation = personId === 'leena' ? 'äiti' : 'isä'
          return (
            <button
              key={personId}
              type="button"
              className="person-card"
              onClick={() => onSelect(personId)}
            >
              <span className="person-card__name">{person.name}</span>
              <span className="person-card__meta">
                Vilin {relation}, s. {person.birthYear}
              </span>
              <span className="person-card__progress">
                {saved === 0
                  ? 'Ei vielä tallennettuja tarinoita'
                  : `${saved}/${QUESTIONS.length} aihetta aloitettu`}
              </span>
              <span className="person-card__cta">Jutellaan {genitiveName(person.name)} kanssa</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
