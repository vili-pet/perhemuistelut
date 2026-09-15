import type { InterviewQuestion } from '../types.ts'

interface QuestionPanelProps {
  question: InterviewQuestion
  index: number
}

export function QuestionPanel({ question, index }: QuestionPanelProps) {
  return (
    <section className="question-panel" aria-labelledby="kysymys-otsikko">
      <p className="theme-chip">
        <span className="visually-hidden">Teema: </span>
        {index + 1}. {question.theme}
      </p>
      <h2 id="kysymys-otsikko" className="question-text">
        {question.question}
      </h2>

      <div className="prompt-grid">
        <section aria-labelledby="tukikysymykset-otsikko">
          <h3 id="tukikysymykset-otsikko">Tukikysymykset</h3>
          <ul>
            {question.prompts.map((prompt) => (
              <li key={prompt}>{prompt}</li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="jatkot-otsikko">
          <h3 id="jatkot-otsikko">Jatko-ohjeet Vilille</h3>
          <ul>
            {question.followUps.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  )
}
