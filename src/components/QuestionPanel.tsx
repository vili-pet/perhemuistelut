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

      <div className="chat-thread">
        <article className="chat-bubble chat-bubble--vili" aria-labelledby="kysymys-otsikko">
          <p className="chat-bubble__speaker">Vili</p>
          <h2 id="kysymys-otsikko" className="question-text">
            {question.question}
          </h2>
        </article>

        <section aria-labelledby="tukikysymykset-otsikko">
          <h3 id="tukikysymykset-otsikko">Voitte jatkaa näillä</h3>
          <ul className="chat-followups">
            {question.followUps.map((item) => (
              <li key={item}>
                <article className="chat-bubble chat-bubble--follow">
                  <p className="chat-bubble__speaker">Vili</p>
                  <p className="chat-bubble__text">{item}</p>
                </article>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  )
}
