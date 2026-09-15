import { describe, expect, it } from 'vitest'
import { extensionForMime, getRecorderSupport, pickMimeType } from './mediaRecorder.ts'

describe('mediaRecorder helpers', () => {
  it('palauttaa tiedostopäätteen mime-tyypistä', () => {
    expect(extensionForMime('audio/webm;codecs=opus')).toBe('webm')
    expect(extensionForMime('audio/mp4')).toBe('m4a')
    expect(extensionForMime('audio/ogg')).toBe('ogg')
  })

  it('kertoo tuen tai varatavan jsdomissa', () => {
    const support = getRecorderSupport()
    expect(['supported', 'unsupported', 'insecure-context']).toContain(support)
    expect(pickMimeType() === undefined || typeof pickMimeType() === 'string').toBe(true)
  })
})
