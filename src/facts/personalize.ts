import type { InterviewQuestion, SessionFact, ThemeId } from '../types.ts'

function elativePlace(place: string): string {
  const known: Record<string, string> = {
    Simpele: 'Simpeleeltä',
    Helsinki: 'Helsingistä',
    Imatra: 'Imatralta',
    Lappeenranta: 'Lappeenrannasta',
    Tampere: 'Tampereelta',
    Turku: 'Turusta',
    Kotka: 'Kotkasta',
  }
  return known[place] ?? `${place}sta`
}

function leavePlaceLine(place: string): string {
  return `Minä vuonna muutitte pois ${elativePlace(place)}?`
}

function placeLine(themeId: ThemeId, place: string): string {
  switch (themeId) {
    case 'teknologia':
      return `Tuliko se vekotin jo ${place}lle, vai vasta my\u00f6hemmin?`
    case 'paikat':
      return `${place} j\u00e4i mieleen \u2014 liittyyk\u00f6 t\u00e4m\u00e4 reissu siihen?`
    case 'lapsuus':
      return `Olitteko ${place}ss\u00e4 silloinkin, vai oliko se joku muu paikka?`
    case 'koti':
      return `Kuulostiko ${place}n kotiin t\u00e4m\u00e4 sama musa, vai oliko se eri talo?`
    case 'tyo':
      return `Oliko se ty\u00f6 ${place}ll\u00e4, vai ihan muualla?`
    case 'rakkaus':
      return `Tapasitteko ${place}ss\u00e4, vai tuliko se paikka kuvaan vasta my\u00f6hemmin?`
    case 'perheperinteet':
      return `Tekik\u00f6 mutsi sit\u00e4 safkaa ${place}ss\u00e4, vai jossain muualla?`
    case 'vaikeat-ajat':
      return `Oliko ${place}ss\u00e4 niit\u00e4 vaikeampiakin aikoja, vai pidet\u00e4\u00e4nk\u00f6 t\u00e4m\u00e4 kevyen\u00e4?`
    case 'neuvo':
      return `Mit\u00e4 neuvoisin nuorelle itsellenne ${place}ss\u00e4?`
    case 'viesti':
      return `Jos se viikonloppu vietett\u00e4isiin ${place}ss\u00e4, mit\u00e4 siit\u00e4 j\u00e4isi lapsenlapsille?`
  }
}

function yearLine(year: string): string {
  return `Liittyyk\u00f6 t\u00e4m\u00e4 vuoteen ${year} vai oliko se eri aikaa?`
}

export function personalizeFromFacts(
  facts: SessionFact[],
  question: InterviewQuestion,
): string[] {
  const extras: string[] = []
  const seen = new Set(question.followUps)

  const push = (line: string) => {
    const text = line.trim()
    if (!text || text === question.question || seen.has(text)) return
    seen.add(text)
    extras.push(text)
  }

  for (const fact of facts) {
    if (extras.length >= 5) break
    if (fact.kind === 'place' && fact.value) {
      push(leavePlaceLine(fact.value))
      push(placeLine(question.themeId, fact.value))
    } else if (fact.kind === 'year' && fact.value) push(yearLine(fact.value))
    else if (fact.value) {
      push(`\u00c4sken tuli esiin ${fact.label.toLocaleLowerCase('fi-FI')}: ${fact.value}. Jatkuuko se t\u00e4ss\u00e4?`)
    }
  }

  return extras
}

export function exampleLlmPersonalizationPayload(
  facts: SessionFact[],
  question: InterviewQuestion,
) {
  return {
    source: 'perhemuistelut.personalize.v1',
    language: 'fi' as const,
    interviewer: 'Vili',
    respondents: ['Leena', 'Jorma'],
    instruction:
      'Kirjoita 1\u20133 tukikysymyst\u00e4 suomeksi kertyneist\u00e4 faktoista. \u00c4l\u00e4 muuta p\u00e4\u00e4kysymyst\u00e4.',
    question: {
      id: question.id,
      theme: question.theme,
      themeId: question.themeId,
      prompt: question.question,
      followUps: question.followUps,
    },
    facts: facts.map((fact) => ({
      kind: fact.kind,
      key: fact.key,
      label: fact.label,
      value: fact.value,
    })),
  }
}
