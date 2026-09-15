import { createId, nowIso } from '../lib/id.ts'
import type { QuestionAnswer, SessionFact } from '../types.ts'

const PLACEHOLDER_TRANSCRIPT = '(Litterointi'

const YEAR_RE = /\b((?:19|20)\d{2})\b/g
const PROPER_RE =
  /\b([A-Z\u00c5\u00c4\u00d6][A-Za-z\u00e5\u00e4\u00f6\u00c5\u00c4\u00d6-]{2,})/g

const CAPITAL_STOP = new Set([
  'Aika',
  'Ei',
  'Ett\u00e4',
  'He',
  'Ihan',
  'Ja',
  'Joo',
  'Jorma',
  'Just',
  'Jos',
  'Ket\u00e4',
  'Kuka',
  'Kun',
  'Kyll\u00e4',
  'Leena',
  'Me',
  'Miten',
  'Mik\u00e4',
  'Milloin',
  'Miss\u00e4',
  'Mutsi',
  'Mutta',
  'My\u00f6s',
  'Niin',
  'No',
  'Nyt',
  'Oli',
  'On',
  'Ovat',
  'Se',
  'Siell\u00e4',
  'Silloin',
  'Sillon',
  'Sit',
  'Sitten',
  'Synnyin',
  'Asuimme',
  'Asuin',
  'Vuonna',
  'Tai',
  'Te',
  'T\u00e4m\u00e4',
  'T\u00e4\u00e4ll\u00e4',
  'Tuota',
  'Vaan',
  'Viel\u00e4',
  'Vili',
])

const PLACE_LOOKUP: Record<string, string> = {
  simpeleell\u00e4: 'Simpele',
  simpelell\u00e4: 'Simpele',
  simpele: 'Simpele',
  helsingiss\u00e4: 'Helsinki',
  helsinki: 'Helsinki',
  kotkassa: 'Kotka',
  imatralla: 'Imatra',
  lappeenrannassa: 'Lappeenranta',
}

function titleCase(value: string): string {
  if (!value) return value
  return value.charAt(0).toLocaleUpperCase('fi-FI') + value.slice(1)
}

export function stemPlace(raw: string): string {
  const lower = raw.toLocaleLowerCase('fi-FI')
  if (PLACE_LOOKUP[lower]) return PLACE_LOOKUP[lower]

  const suffixes = [
    'eell\u00e4',
    'eella',
    'ill\u00e4',
    'illa',
    'iss\u00e4',
    'issa',
    'll\u00e4',
    'lla',
    'ss\u00e4',
    'ssa',
    'sta',
    'st\u00e4',
    'lta',
    'lt\u00e4',
    'lle',
    'seen',
  ]
  for (const suffix of suffixes) {
    if (lower.endsWith(suffix) && lower.length > suffix.length + 2) {
      let stem = raw.slice(0, raw.length - suffix.length)
      if (/ngi$/i.test(stem)) stem = `${stem.slice(0, -3)}nki`
      else if (/ng$/i.test(stem)) stem = `${stem.slice(0, -2)}nki`
      return titleCase(stem)
    }
  }
  return titleCase(raw)
}

function inferPlaceMeta(sentence: string, value: string): Pick<SessionFact, 'key' | 'label'> {
  const lower = sentence.toLocaleLowerCase('fi-FI')
  if (/synny|syntym\u00e4|synty/.test(lower)) {
    return { key: 'syntym\u00e4paikka', label: 'Syntym\u00e4paikka' }
  }
  if (/asuimme|asuin|asutaan|asuttiin|asui\b/.test(lower)) {
    return { key: 'asuinpaikka', label: 'Asuinpaikka' }
  }
  return {
    key: `paikka-${value.toLocaleLowerCase('fi-FI')}`,
    label: 'Paikka',
  }
}

export function extractFactsFromText(text: string, sourceQuestionId: string): SessionFact[] {
  const source = text.replace(/\s+/g, ' ').trim()
  if (!source || source.startsWith('(Litterointi')) return []

  const facts: SessionFact[] = []
  const seen = new Set<string>()

  const push = (fact: Omit<SessionFact, 'id' | 'createdAt'>) => {
    if (!fact.value.trim() || seen.has(fact.key)) return
    seen.add(fact.key)
    facts.push({
      ...fact,
      id: createId('fakta'),
      sourceQuestionId,
      createdAt: nowIso(),
    })
  }

  for (const match of source.matchAll(YEAR_RE)) {
    const year = match[1]
    if (!year) continue
    push({
      kind: 'year',
      key: `vuosi-${year}`,
      label: 'Vuosi',
      value: year,
    })
  }

  for (const match of source.matchAll(PROPER_RE)) {
    const token = match[1]
    if (!token || CAPITAL_STOP.has(token.split(/\s+/)[0] ?? token)) continue
    const value = stemPlace(token)
    if (value.length < 3) continue
    const meta = inferPlaceMeta(source, value)
    push({
      kind: 'place',
      key: meta.key,
      label: meta.label,
      value,
    })
  }

  return facts
}

export function extractFactsFromAnswer(answer: QuestionAnswer): SessionFact[] {
  const transcript = answer.transcript.trim().startsWith(PLACEHOLDER_TRANSCRIPT)
    ? ''
    : answer.transcript
  const segments = answer.segments.map((segment) => segment.text).join('\n')
  return extractFactsFromText(
    [answer.notes, transcript, segments, answer.mark?.note ?? ''].join('\n'),
    answer.questionId,
  )
}

export function mergeFacts(existing: SessionFact[], incoming: SessionFact[]): SessionFact[] {
  const byKey = new Map(existing.map((fact) => [fact.key, fact]))
  for (const fact of incoming) {
    const previous = byKey.get(fact.key)
    if (previous?.edited) continue
    if (previous) {
      byKey.set(fact.key, { ...previous, value: fact.value, sourceQuestionId: fact.sourceQuestionId })
      continue
    }
    byKey.set(fact.key, fact)
  }
  return [...byKey.values()].slice(-40)
}
