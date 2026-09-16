import { describe, expect, it } from 'vitest'
import { applyInterviewAction, createBotSession, describeSession } from './interview.mjs'

describe('bot interview cursor', () => {
  it('siirtää aihetta ja merkitsee kiinnostavan / palaa myöhemmin', () => {
    let session = createBotSession()
    session = applyInterviewAction(session, { type: 'next' })
    expect(session.currentQuestionIndex).toBe(1)
    session = applyInterviewAction(session, { type: 'interesting' })
    session = applyInterviewAction(session, { type: 'later' })
    expect(session.marks['eka-auto']).toMatchObject({ interesting: true, returnLater: true })
    session = applyInterviewAction(session, { type: 'prev' })
    expect(session.currentQuestionIndex).toBe(0)
    const text = describeSession(session)
    expect(text).toContain('Eka telkkari')
  })

  it('ei ylitä kymmenen aiheen settiä', () => {
    let session = createBotSession()
    session = applyInterviewAction(session, { type: 'goto', index: 99 })
    expect(session.currentQuestionIndex).toBe(9)
    session = applyInterviewAction(session, { type: 'next' })
    expect(session.currentQuestionIndex).toBe(9)
  })

  it('estää toisen live-nauhan merkinnällä miniAppRecording', () => {
    let session = createBotSession()
    session = applyInterviewAction(session, { type: 'set-recording', value: true })
    expect(session.miniAppRecording).toBe(true)
    expect(describeSession(session)).toContain('Mini App nauhoittaa')
  })
})
