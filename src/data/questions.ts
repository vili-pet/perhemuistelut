import type { InterviewQuestion } from '../types.ts'

export const QUESTIONS: InterviewQuestion[] = [
  {
    id: 'lapsuus',
    themeId: 'lapsuus',
    theme: 'Lapsuus',
    question:
      'Miltä lapsuutenne näytti? Mitä muistatte ensimmäisistä vuosistanne — leikeistä, koulusta ja siitä, miltä maailma silloin tuntui?',
    prompts: [
      'Missä asuitte pienenä ja keitä kuului perheeseen?',
      'Millaisia leikkejä ja kesäpäiviä muistatte?',
      'Kuka oli teille tärkeä aikuinen lapsena?',
    ],
    followUps: [
      'Kertokaa yksi konkreettinen tilanne, joka on jäänyt mieleen kuin elokuva.',
      'Miltä arkiaamu kuulosti ja tuoksui?',
      'Leena ja Jorma: muistatteko saman asian eri tavalla?',
    ],
  },
  {
    id: 'koti',
    themeId: 'koti',
    theme: 'Koti',
    question:
      'Millainen koti teillä oli, ja miltä arki siellä tuntui? Mitä huoneita, ääniä ja tapoja muistatte edelleen?',
    prompts: [
      'Kuvaikaa kotia oven avauksesta keittiöön.',
      'Mikä paikka kotona oli teidän omintakeisin nurkkaus?',
      'Miten naapurit ja pihapiiri kuuluivat elämään?',
    ],
    followUps: [
      'Onko jokin esine tai huonekalu, joka edustaa kotia vieläkin?',
      'Mitä kotona ei saanut tehdä — ja mitä sai?',
      'Jos palaisitte sinne nyt, mitä etsisitte ensimmäisenä?',
    ],
  },
  {
    id: 'perinteet',
    themeId: 'perinteet',
    theme: 'Perheen perinteet',
    question:
      'Mitä perinteitä perheessänne vaalittiin juhlissa ja arjessa? Mikä teki juuri teidän perheestä teidän perheen?',
    prompts: [
      'Miten joulu, juhannus tai syntymäpäivät vietettiin?',
      'Mitä ruokia, lauluja tai tapoja ei saanut unohtaa?',
      'Kuka piti perinteitä yllä?',
    ],
    followUps: [
      'Mikä perinne on jatkunut tähän päivään?',
      'Onko jokin tapa, jota kadutte että jäi pois?',
      'Haluaisitteko, että jokin tietty tarina kerrotaan aina uudelleen?',
    ],
  },
  {
    id: 'tyo',
    themeId: 'tyo',
    theme: 'Työ',
    question:
      'Millaista työelämänne oli? Mikä työssä oli tärkeää, ja mitä se opetti teistä itsestänne?',
    prompts: [
      'Mikä oli ensimmäinen oikea työnne?',
      'Mistä työstä olette ylpeimpiä?',
      'Ketkä työtoverit tai esimiehet jäivät mieleen?',
    ],
    followUps: [
      'Miten työ ja perhe-elämä mahtuivat samaan viikkoon?',
      'Muuttuiko työn merkitys iän myötä?',
      'Jos nuori kysyisi neuvoa työelämään, mitä sanoisitte ensin?',
    ],
  },
  {
    id: 'rakkaus',
    themeId: 'rakkaus',
    theme: 'Rakkaus ja perhe',
    question:
      'Miten teistä tuli perhe, ja mitä rakkaus on merkinnyt matkan varrella — arjessa, ei vain juhlissa?',
    prompts: [
      'Miten kohtasitte toisenne?',
      'Millainen oli yhteisen elämän alku?',
      'Mitä lapset ja läheiset ovat opettaneet rakkaudesta?',
    ],
    followUps: [
      'Mikä pieni arkinen ele on merkinnyt eniten?',
      'Miten olette pitäneet yhtä vaikeina kausina?',
      'Mitä haluaisitte Vilin ja tulevien sukupolvien ymmärtävän teidän tarinastanne?',
    ],
  },
  {
    id: 'vaikeat-ajat',
    themeId: 'vaikeat-ajat',
    theme: 'Vaikeat ajat',
    question:
      'Oletteko kokeneet aikoja, jotka olivat erityisen raskaita? Mikä auttoi eteenpäin, ja mitä niistä jäi käteen?',
    prompts: [
      'Saatte valita, kuinka syvälle mennään — tauko on aina sallittu.',
      'Kuka tai mikä kantoi silloinkin, kun voimat olivat vähissä?',
      'Onko jokin lause tai ajatus, joka piti pystyssä?',
    ],
    followUps: [
      'Mitä toivoisitte, että joku olisi sanonut teille silloin?',
      'Miten se aika muutti teitä?',
      'Haluatteko, että tämä osa jää perhehistoriaan vai jääkö se tähän huoneeseen?',
    ],
  },
  {
    id: 'paikat',
    themeId: 'paikat',
    theme: 'Paikat',
    question:
      'Mitkä paikat ovat jääneet sydämeen? Missä olette tunteneet kuuluvanne, ja mitkä maisemat palaavat unissa?',
    prompts: [
      'Kotiseutu, mökki, kaupunki, metsä, kirkko, kahvila — mikä nousee ensin?',
      'Onko paikka, jota ei enää ole?',
      'Minne veisitte meidät, jos voisimme kävellä sinne yhdessä?',
    ],
    followUps: [
      'Kuvaikaa paikka niin, että sen voi nähdä silmät kiinni.',
      'Kenen kanssa se paikka liittyy yhteen?',
      'Onko jokin haju, ääni tai vuodenaika, joka vie sinne heti?',
    ],
  },
  {
    id: 'teknologia',
    themeId: 'teknologia',
    theme: 'Teknologia ja muutos',
    question:
      'Miten maailma ja arjen tekniikka ovat muuttuneet elämänne aikana? Mikä muutos on ollut suurin — ja mikä yllätti?',
    prompts: [
      'Muistatteko ajan ennen televisiota, automaattivaihdetta tai kännykkää?',
      'Mikä uusi vekotin ihastutti, mikä ärsytti?',
      'Miten yhteydenpito läheisiin on muuttunut?',
    ],
    followUps: [
      'Mikä vanha tapa oli parempi kuin nykyinen?',
      'Mikä nykyajan juttu on teille aidosti hyödyllinen?',
      'Miltä 1950–60-lukujen arki tuntuisi nuorelle nyt?',
    ],
  },
  {
    id: 'neuvo',
    themeId: 'neuvo',
    theme: 'Neuvo',
    question:
      'Mitä neuvoisin nuoremmille? Mitä olisitte itse halunneet tietää aiemmin — työstä, rakkaudesta, rahasta tai rohkeudesta?',
    prompts: [
      'Yksi neuvo, jonka toivoisitte jäävän mieleen.',
      'Mitä tekisitte toisin, jos aloittaisitte alusta?',
      'Mitä ette vaihtaisi mistään hinnasta?',
    ],
    followUps: [
      'Onko neuvo erilainen Leenalle ja Jormalle — antakaa molemmat ommanne.',
      'Mitä neuvoisin Vilille juuri nyt?',
      'Mikä oppi tuli vasta myöhään, mutta oli sen arvoinen?',
    ],
  },
  {
    id: 'viesti',
    themeId: 'viesti',
    theme: 'Viesti tuleville sukupolville',
    question:
      'Minkä viestin haluaisitte jättää lapsenlapsille ja tuleville sukupolville? Mitä ei saa unohtaa teistä ja suvusta?',
    prompts: [
      'Kertokaa se niin, että se voidaan lukea ääneen vuosien päästä.',
      'Mitkä arvot kannattelevat perhettä?',
      'Onko jokin tarina, joka pitää kertoa uudelleen ja uudelleen?',
    ],
    followUps: [
      'Haluatteko sanoa jotain suoraan Vilille?',
      'Jos tästä haastattelusta jäisi yksi lause, mikä se olisi?',
      'Kiitos — onko vielä jotain, mitä emme kysyneet mutta mikä kuuluu mukaan?',
    ],
  },
]

export function getQuestionById(id: string): InterviewQuestion | undefined {
  return QUESTIONS.find((question) => question.id === id)
}
