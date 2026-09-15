import { describe, expect, it } from 'vitest'
import { createEmptySession } from '../storage/interviewStorage.ts'
import { audioFileName, pendingAudioFileName } from './audioDownload.ts'

describe('audio download names', () => {
  it('antaa webm/m4a/ogg-päätteen mime-tyypistä', () => {
    const session = createEmptySession()
    expect(audioFileName(session, { mimeType: 'audio/webm;codecs=opus' }, 0)).toMatch(
      /^perhemuistelut-leena-jorma-nauha-1-\d{4}-\d{2}-\d{2}\.webm$/,
    )
    expect(audioFileName(session, { mimeType: 'audio/mp4' }, 1)).toContain('nauha-2')
    expect(audioFileName(session, { mimeType: 'audio/mp4' }, 1)).toMatch(/\.m4a$/)
    expect(audioFileName(session, { mimeType: 'audio/ogg;codecs=opus' }, 0)).toMatch(/\.ogg$/)
  })

  it('säilyttää liitetyn tiedoston nimen', () => {
    const session = createEmptySession()
    expect(
      audioFileName(session, { mimeType: 'audio/mpeg', fileName: 'kesa-78.m4a' }, 0),
    ).toBe('kesa-78.m4a')
  })

  it('nimeää pysäytetyn nauhan viimeisimmän tallenteen mukaan', () => {
    const session = createEmptySession()
    session.recordings.push({
      id: 'nauha-1',
      blobRef: 'nauha-1',
      mimeType: 'audio/webm',
      createdAt: session.createdAt,
      source: 'media-recorder',
    })
    expect(pendingAudioFileName(session, 'audio/webm')).toContain('nauha-1')
  })
})
