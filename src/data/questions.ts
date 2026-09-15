import type { InterviewQuestion, ThemeId } from '../types.ts'

export const REQUIRED_THEMES: ThemeId[] = [
  'lapsuus',
  'koti',
  'perheperinteet',
  'tyo',
  'rakkaus',
  'vaikeat-ajat',
  'paikat',
  'teknologia',
  'neuvo',
  'viesti',
]

export const EXACT_PROMPTS = [
  'Mikä oli teidän perheen eka telkkari, ja milloin se vaihtu mustavalkosesta väriin?',
  'Mikä oli teidän eka oma auto, ja mihin sillä tehtiin se kovin reissu?',
  'Muistatteko missä olitte ku ihminen laskeutu kuuhun 1969?',
  'Mitä musaa c-kasetilta tai vinyyliltä luukutettiin teininä 70-luvun alussa?',
  'Millainen oli teidän eka kesäduuni ja paljonko siitä maksettiin markkoja?',
  'Miten ja missä työ tapasitte toisenne ekaa kertaa?',
  'Mikä oli lapsuuden lempisafka mitä mutsi teki ja mitä ei enää nykyään syödä?',
  'Oliko teillä nuorena joku vakkari kylänraitti missä aina hengattiin viikonloppusin?',
  'Mikä 70- tai 80-luvun vaate tai tukkatyyli naurattaa nykyään eniten vanhoissa kuvissa?',
  'Jos saisitte elää yhen viikonlopun uusiks nuoruudesta, mikä se ois?',
] as const

export const QUESTIONS: InterviewQuestion[] = [
  {
    id: 'eka-telkkari',
    themeId: 'teknologia',
    theme: 'Teknologia ja muutos',
    label: 'Eka telkkari',
    question: EXACT_PROMPTS[0],
    followUps: [
      'Missä telkkari oli, ja kuka sai päättää mitä katsottiin?',
      'Miltä arki tuntui ennen telkkaria — radio, lehdet, naapurit?',
      'Mikä muu vekotin tuli taloon samaan aikaan, ja mikä muutos yllätti eniten?',
    ],
  },
  {
    id: 'eka-auto',
    themeId: 'paikat',
    theme: 'Paikat',
    label: 'Eka auto',
    question: EXACT_PROMPTS[1],
    followUps: [
      'Mihin sillä eka reissulla mentiin, ja mitä näitte matkalla?',
      'Missä autolla käytiin muuten — mökki, sukulaiset, tanssit?',
      'Onko se paikka vielä olemassa, vai onko se jäänyt vain muistoihin?',
    ],
  },
  {
    id: 'kuu-1969',
    themeId: 'lapsuus',
    theme: 'Lapsuus',
    label: 'Kuu 1969',
    question: EXACT_PROMPTS[2],
    followUps: [
      'Missä asuitte silloin, ja keitä oli samassa huoneessa?',
      'Mitä teitte lapsina sinä iltana — valvoitteko, vai kuulitteko vasta aamulla?',
      'Leena ja Jorma: muistatteko sen illan eri tavalla?',
    ],
  },
  {
    id: 'musa-70-luku',
    themeId: 'koti',
    theme: 'Koti',
    label: '70-luvun musa',
    question: EXACT_PROMPTS[3],
    followUps: [
      'Missä levyjä tai kasetteja kuunneltiin — keittiössä, omassa huoneessa, autotallissa?',
      'Kuka toi musan kotiin, ja saiko sitä luukuttaa ääneen?',
      'Mikä kappale palauttaa sen kodin heti mieleen?',
    ],
  },
  {
    id: 'kesaduuni',
    themeId: 'tyo',
    theme: 'Työ',
    label: 'Eka kesäduuni',
    question: EXACT_PROMPTS[4],
    followUps: [
      'Oliko se kesäduuni ensimmäinen oikea työ, ja mitä siellä tehtiin?',
      'Mihin palkka meni, ja miltä markat tuntuivat kädessä?',
      'Miten työelämä jatkui siitä eteenpäin?',
    ],
  },
  {
    id: 'tapaaminen',
    themeId: 'rakkaus',
    theme: 'Rakkaus ja perhe',
    label: 'Miten tapasitte',
    question: EXACT_PROMPTS[5],
    followUps: [
      'Kuka esitteli, vai törmäsittekö ihan itse?',
      'Mitä ajattelitte toisistanne eka illan jälkeen?',
      'Miten yhteinen elämä ja perhe kasvoivat siitä kohtaamisesta?',
    ],
  },
  {
    id: 'lempisafka',
    themeId: 'perheperinteet',
    theme: 'Perheen perinteet',
    label: 'Lempisafka',
    question: EXACT_PROMPTS[6],
    followUps: [
      'Onko se ruoka jäänyt juhlapöytään vai kadonnut?',
      'Mitä muita perinneruokia mutsi tai mummo teki jouluun tai arkeen?',
      'Haluaisitteko, että joku tekee sitä vielä — ja kuka osaisi?',
    ],
  },
  {
    id: 'kylanraitti',
    themeId: 'vaikeat-ajat',
    theme: 'Vaikeat ajat',
    label: 'Kylänraitti',
    question: EXACT_PROMPTS[7],
    followUps: [
      'Oliko aikoja, jolloin ei ollut kivaa hengata — raha, riidat, terveys, muutokset?',
      'Mikä auttoi eteenpäin, kun nuoruus ei ollut pelkkää raittia?',
      'Saatte jättää tämän kevyeksi. Tauko on aina sallittu.',
    ],
  },
  {
    id: 'vanhat-kuvat',
    themeId: 'neuvo',
    theme: 'Neuvo',
    label: 'Vanhat kuvat',
    question: EXACT_PROMPTS[8],
    followUps: [
      'Mitä neuvoisin nuorelle itsellenne, joka pukeutui noin?',
      'Mitä naurattaisi näyttää lapsenlapsille, ja mitä ei?',
      'Yksi neuvo rohkeudesta tai siitä, ettei ota itseään liian vakavasti?',
    ],
  },
  {
    id: 'viikonloppu-uusiksi',
    themeId: 'viesti',
    theme: 'Viesti tuleville sukupolville',
    label: 'Viikonloppu uusiksi',
    question: EXACT_PROMPTS[9],
    followUps: [
      'Minkä viestin se viikonloppu jättäisi lapsenlapsille?',
      'Mitä ei saa unohtaa teistä ja siitä ajasta?',
      'Haluatteko sanoa vielä jotain suoraan Vilille?',
    ],
  },
]

export function getQuestionById(id: string): InterviewQuestion | undefined {
  return QUESTIONS.find((question) => question.id === id)
}
