import { QUESTIONS } from '../data/questions.ts'
import { isFlaggedAnswer } from '../storage/interviewStorage.ts'
import type { QuestionAnswer } from '../types.ts'

interface BookmarkListProps {
  answers: QuestionAnswer[]
  currentIndex: number
  onJump: (index: number) => void
}

export function BookmarkList({ answers, currentIndex, onJump }: BookmarkListProps) {
  const flagged = answers
    .map((answer, index) => ({ answer, index }))
    .filter((item) => isFlaggedAnswer(item.answer))

  if (flagged.length === 0) return null

  return (
    <section className="bookmarks" aria-labelledby="paluu-otsikko">
      <h2 id="paluu-otsikko">Palaa myöhemmin</h2>
      <p className="editor__hint">Hyppää aiheeseen. Nauhoitus jatkuu, jos se on käynnissä.</p>
      <ul className="bookmark-list">
        {flagged.map(({ answer, index }) => {
          const question = QUESTIONS[index]
          const tags = [
            answer.mark.interesting ? 'kiinnostava' : null,
            answer.mark.returnLater ? 'palaa myöhemmin' : null,
          ].filter(Boolean)
          return (
            <li key={answer.questionId}>
              <button
                type="button"
                className={index === currentIndex ? 'bookmark bookmark--current' : 'bookmark'}
                onClick={() => onJump(index)}
              >
                <span className="bookmark__label">
                  {index + 1}. {question?.label ?? answer.theme}
                </span>
                <span className="bookmark__tags">{tags.join(' · ')}</span>
                {answer.mark.note.trim() ? (
                  <span className="bookmark__note">{answer.mark.note.trim()}</span>
                ) : null}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
