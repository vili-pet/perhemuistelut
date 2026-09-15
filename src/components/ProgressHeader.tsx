import { genitiveName } from '../data/participants.ts'
import { QUESTIONS } from '../data/questions.ts'
import type { Person } from '../types.ts'

interface ProgressHeaderProps {
  respondent: Person
  questionIndex: number
  questionCount: number
  onGoTo: (index: number) => void
  onChangePerson: () => void
}

export function ProgressHeader({
  respondent,
  questionIndex,
  questionCount,
  onGoTo,
  onChangePerson,
}: ProgressHeaderProps) {
  const percent = ((questionIndex + 1) / questionCount) * 100

  return (
    <header className="masthead">
      <div className="masthead__brand">
        <p className="eyebrow">Perhemuistelut</p>
        <h1>{genitiveName(respondent.name)} tarinat</h1>
        <p className="masthead__people">
          Haastateltava <strong>{respondent.name}</strong> (s. {respondent.birthYear}) ·
          Haastattelija <strong>Vili</strong>
        </p>
        <button type="button" className="btn btn--ghost masthead__switch" onClick={onChangePerson}>
          Vaihda haastateltavaa
        </button>
      </div>

      <div className="progress-block">
        <div className="progress-block__label" id="eteneminen-label">
          Kysymys {questionIndex + 1} / {questionCount}
        </div>
        <div
          className="progress"
          role="progressbar"
          aria-labelledby="eteneminen-label"
          aria-valuemin={1}
          aria-valuemax={questionCount}
          aria-valuenow={questionIndex + 1}
          aria-valuetext={`Kysymys ${questionIndex + 1} / ${questionCount}: ${QUESTIONS[questionIndex].theme}`}
        >
          <div className="progress__bar" style={{ width: `${percent}%` }} />
        </div>
        <nav className="progress-nav" aria-label="Siirry kysymykseen">
          {QUESTIONS.map((question, index) => (
            <button
              key={question.id}
              type="button"
              className={index === questionIndex ? 'step step--current' : 'step'}
              aria-current={index === questionIndex ? 'step' : undefined}
              onClick={() => onGoTo(index)}
            >
              <span className="step__num">{index + 1}</span>
              <span className="step__theme">{question.theme}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}
