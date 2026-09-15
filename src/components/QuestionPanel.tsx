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

      <section aria-labelledby="tukikysymykset-otsikko">
        <h3 id="tukikysymykset-otsikko">Voitte jatkaa näillä</h3>
        <ul>
          {question.prompts.map((prompt) => (
            <li key={prompt}>{prompt}</li>
          ))}
        </ul>
      </section>

      <details className="follow-ups">
        <summary>Jatko-ohjeet Vilille</summary>
        <ul>
          {question.followUps.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </details>
    </section>
  )
}
