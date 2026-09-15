import { QUESTIONS } from '../data/questions.ts'

interface ProgressHeaderProps {
  questionIndex: number
  questionCount: number
  onGoTo: (index: number) => void
}

export function ProgressHeader({ questionIndex, questionCount, onGoTo }: ProgressHeaderProps) {
  const percent = ((questionIndex + 1) / questionCount) * 100

  return (
    <header className="masthead">
      <div className="masthead__brand">
        <p className="eyebrow">Perhemuistelut</p>
        <h1>Haastatteluohjaamo</h1>
        <p className="masthead__people">
          Haastattelija <strong>Vili</strong> · Vastaajat <strong>Leena</strong> ja{' '}
          <strong>Jorma</strong> (s. 1957)
        </p>
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
