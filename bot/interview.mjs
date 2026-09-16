import { TOPICS, formatTopic, topicAt } from './topics.mjs'

export function emptyMark() {
  return { interesting: false, returnLater: false, note: '' }
}

export function createBotSession() {
  return {
    currentQuestionIndex: 0,
    marks: {},
    miniAppRecording: false,
    telegramVoices: [],
    updatedAt: new Date().toISOString(),
  }
}

export function questionIdAt(index) {
  return topicAt(index).topic.id
}

function markFor(session, index = session.currentQuestionIndex) {
  const id = questionIdAt(index)
  return { ...emptyMark(), ...(session.marks[id] ?? {}) }
}

export function applyInterviewAction(session, action) {
  const next = {
    ...session,
    marks: { ...session.marks },
    telegramVoices: [...(session.telegramVoices ?? [])],
    updatedAt: new Date().toISOString(),
  }

  switch (action.type) {
    case 'next': {
      next.currentQuestionIndex = Math.min(session.currentQuestionIndex + 1, TOPICS.length - 1)
      return next
    }
    case 'prev': {
      next.currentQuestionIndex = Math.max(session.currentQuestionIndex - 1, 0)
      return next
    }
    case 'goto': {
      next.currentQuestionIndex = topicAt(action.index).index
      return next
    }
    case 'interesting': {
      const id = questionIdAt(next.currentQuestionIndex)
      const current = markFor(next)
      next.marks[id] = { ...current, interesting: action.value ?? !current.interesting }
      return next
    }
    case 'later': {
      const id = questionIdAt(next.currentQuestionIndex)
      const current = markFor(next)
      next.marks[id] = { ...current, returnLater: action.value ?? !current.returnLater }
      return next
    }
    case 'note': {
      const id = questionIdAt(next.currentQuestionIndex)
      const current = markFor(next)
      next.marks[id] = { ...current, note: action.note ?? '' }
      return next
    }
    case 'set-mark': {
      const id = questionIdAt(action.index ?? next.currentQuestionIndex)
      const current = { ...emptyMark(), ...(next.marks[id] ?? {}) }
      next.marks[id] = { ...current, ...action.mark }
      return next
    }
    case 'set-recording': {
      next.miniAppRecording = Boolean(action.value)
      return next
    }
    case 'add-voice': {
      next.telegramVoices.push({
        fileId: action.fileId,
        duration: action.duration,
        questionId: questionIdAt(next.currentQuestionIndex),
        questionIndex: next.currentQuestionIndex,
        at: new Date().toISOString(),
      })
      return next
    }
    default:
      return session
  }
}

export function describeSession(session) {
  const { index, topic } = topicAt(session.currentQuestionIndex)
  const mark = markFor(session)
  const flags = [
    mark.interesting ? 'kiinnostava' : null,
    mark.returnLater ? 'palaa myöhemmin' : null,
  ].filter(Boolean)
  const flagLine = flags.length > 0 ? `\nMerkinnät: ${flags.join(', ')}.` : '\nEi merkintöjä.'
  const noteLine = mark.note.trim() ? `\nMuistiinpano: ${mark.note.trim()}` : ''
  const recLine = session.miniAppRecording
    ? '\nMini App nauhoittaa (MediaRecorder). Älä lähetä Telegram-ääntä samaan aikaan.'
    : ''
  return `${formatTopic(index)}${flagLine}${noteLine}${recLine}\n\nLeena ja Jorma juttelevat yhdessä. Aihe: ${topic.label}.`
}

export { TOPICS, formatTopic, topicAt, markFor }
