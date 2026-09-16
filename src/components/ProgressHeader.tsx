import { respondentNamesWithYears } from '../data/participants.ts'
import { QUESTIONS } from '../data/questions.ts'
import type { Person, QuestionAnswer } from '../types.ts'

interface ProgressHeaderProps {
  respondents: Person[]
  questionIndex: number
  questionCount: number
  answers: QuestionAnswer[]
  onGoTo: (index: number) => void
}

export function ProgressHeader({
  respondents,
  questionIndex,
  questionCount,
  answers,
  onGoTo,
}: ProgressHeaderProps) {
  const percent = ((questionIndex + 1) / questionCount) * 100

  return (
    <header className="masthead">
      <div className="masthead__brand">
        <p className="eyebrow">Perhemuistelot</p>
        <h1>Yhteinen haastattelu</h1>
        <p className="masthead__people">
          Haastateltavat <strong>{respondentNamesWithYears(respondents)}</strong> ·
          Haastattelija <strong>Vili</strong>
        </p>
        <p className="masthead__hint">
          Vanhemmat juttelevat yhdessä. Ruudulla on yksi aihe kerrallaan; Seuraava ei katkaise
          ääntä.
        </p>
      </div>

      <div className="progress-block">
        <div className="progress-block__label" id="eteneminen-label">
          Aihe {questionIndex + 1} / {questionCount}
          <span className="progress-block__now"> · {QUESTIONS[questionIndex].label}</span>
        </div>
        <div
          className="progress"
          role="progressbar"
          aria-labelledby="eteneminen-label"
          aria-valuemin={1}
          aria-valuemax={questionCount}
          aria-valuenow={questionIndex + 1}
          aria-valuetext={`Aihe ${questionIndex + 1} / ${questionCount}: ${QUESTIONS[questionIndex].label}`}
        >
          <div className="progress__bar" style={{ width: `${percent}%` }} />
        </div>
        <nav className="progress-nav" aria-label="Siirry aiheeseen">
          {QUESTIONS.map((question, index) => {
            const mark = answers[index]?.mark
            const flagged = Boolean(mark?.interesting || mark?.returnLater)
            return (
              <button
                key={question.id}
                type="button"
                className={index === questionIndex ? 'step step--current' : 'step'}
                aria-current={index === questionIndex ? 'step' : undefined}
                onClick={() => onGoTo(index)}
              >
                <span className="step__num">{index + 1}</span>
                <span className="step__theme">{question.label}</span>
                {flagged ? (
                  <span className="step__flag">
                    {mark?.returnLater ? 'Palaa' : 'Kiinnostava'}
                  </span>
                ) : null}
              </button>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
