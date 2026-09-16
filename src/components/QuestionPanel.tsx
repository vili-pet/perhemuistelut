import type { InterviewQuestion } from '../types.ts'

interface QuestionPanelProps {
  question: InterviewQuestion
  index: number
  extraFollowUps?: string[]
  personalizedFollowUps: string[]
}

export function QuestionPanel({
  question,
  index,
  extraFollowUps = [],
  personalizedFollowUps,
}: QuestionPanelProps) {
  const extras = extraFollowUps.filter((item) => !question.followUps.includes(item))

  return (
    <section className="question-panel" aria-labelledby="kysymys-otsikko">
      <p className="theme-chip">
        <span className="visually-hidden">Teema: </span>
        {index + 1}. {question.theme}
      </p>

      <div className="chat-thread" role="log" aria-live="polite" aria-relevant="additions text">
        <article className="chat-bubble chat-bubble--vili" aria-labelledby="kysymys-otsikko">
          <p className="chat-bubble__speaker">Vili</p>
          <h2 id="kysymys-otsikko" className="question-text">
            {question.question}
          </h2>
        </article>

        <details className="follow-ups" open>
          <summary id="tukikysymykset-otsikko">Voitte jatkaa näillä</summary>
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
        </details>

        {personalizedFollowUps.length > 0 ? (
          <section aria-labelledby="henkkoht-otsikko">
            <h3 id="henkkoht-otsikko">Tämän keskustelun perusteella</h3>
            <ul className="chat-followups">
              {personalizedFollowUps.map((item) => (
                <li key={item}>
                  <article className="chat-bubble chat-bubble--personal">
                    <p className="chat-bubble__speaker">Vili · henkilökohtainen</p>
                    <p className="chat-bubble__text">{item}</p>
                  </article>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {extras.length > 0 ? (
          <section aria-labelledby="arkisto-otsikko">
            <h3 id="arkisto-otsikko">Arkiston lisäkysymykset</h3>
            <ul className="chat-followups">
              {extras.map((item) => (
                <li key={item}>
                  <article className="chat-bubble chat-bubble--follow">
                    <p className="chat-bubble__speaker">Vili · arkisto</p>
                    <p className="chat-bubble__text">{item}</p>
                  </article>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </section>
  )
}
