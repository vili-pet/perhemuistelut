import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'
import { EXACT_PROMPTS } from './data/questions.ts'

describe('App', () => {
  it('avaa haastatteluohjaamon selaimessa ilman Telegram-porttia', () => {
    const html = renderToString(createElement(App))
    expect(html).toContain('Yhteinen haastattelu')
    expect(html).toContain('Leena (s. 1957)')
    expect(html).toContain('Jorma (s. 1957)')
    expect(html).toContain('Aihe 1 / 10')
    expect(html).toContain(EXACT_PROMPTS[0])
    expect(html).not.toContain('Tarkistetaan Telegram')
    expect(html).not.toContain('Ei käyttöoikeutta')
    expect(html).not.toContain('Avaa Perhemuistelot Vilin Telegram-botista')
  })
})
