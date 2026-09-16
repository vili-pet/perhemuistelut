/** Canonical 10 prompts — must match src/data/questions.ts EXACT_PROMPTS. */
export const TOPICS = [
  {
    id: 'eka-telkkari',
    label: 'Eka telkkari',
    question: 'Mikä oli teidän perheen eka telkkari, ja milloin se vaihtu mustavalkosesta väriin?',
  },
  {
    id: 'eka-auto',
    label: 'Eka auto',
    question: 'Mikä oli teidän eka oma auto, ja mihin sillä tehtiin se kovin reissu?',
  },
  {
    id: 'kuu-1969',
    label: 'Kuu 1969',
    question: 'Muistatteko missä olitte ku ihminen laskeutu kuuhun 1969?',
  },
  {
    id: 'musa-70-luku',
    label: '70-luvun musa',
    question: 'Mitä musaa c-kasetilta tai vinyyliltä luukutettiin teininä 70-luvun alussa?',
  },
  {
    id: 'kesaduuni',
    label: 'Eka kesäduuni',
    question: 'Millainen oli teidän eka kesäduuni ja paljonko siitä maksettiin markkoja?',
  },
  {
    id: 'tapaaminen',
    label: 'Miten tapasitte',
    question: 'Miten ja missä työ tapasitte toisenne ekaa kertaa?',
  },
  {
    id: 'lempisafka',
    label: 'Lempisafka',
    question: 'Mikä oli lapsuuden lempisafka mitä mutsi teki ja mitä ei enää nykyään syödä?',
  },
  {
    id: 'kylanraitti',
    label: 'Kylänraitti',
    question: 'Oliko teillä nuorena joku vakkari kylänraitti missä aina hengattiin viikonloppusin?',
  },
  {
    id: 'vanhat-kuvat',
    label: 'Vanhat kuvat',
    question: 'Mikä 70- tai 80-luvun vaate tai tukkatyyli naurattaa nykyään eniten vanhoissa kuvissa?',
  },
  {
    id: 'viikonloppu-uusiksi',
    label: 'Viikonloppu uusiksi',
    question: 'Jos saisitte elää yhen viikonlopun uusiks nuoruudesta, mikä se ois?',
  },
]

export function topicAt(index) {
  const i = Math.min(Math.max(index, 0), TOPICS.length - 1)
  return { index: i, topic: TOPICS[i] }
}

export function formatTopic(index) {
  const { index: i, topic } = topicAt(index)
  return `${i + 1}/${TOPICS.length} ${topic.label}\n${topic.question}`
}
