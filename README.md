# Perhemuistelut — haastatteluohjaamo

Saavutettava, suomenkielinen ohjaamo, jolla **Vili** haastattelee vanhempiaan **Leenaa** ja **Jormaa** (s. 1957). Kymmenen nostalgista kysymystä näytetään yksi kerrallaan: lapsuus, koti, perinteet, työ, rakkaus ja perhe, vaikeat ajat, paikat, teknologia ja muutos, neuvo sekä viesti tuleville sukupolville.

Sovellus on staattinen selainohjaamo. Se ei korvaa juurihakemiston Signal-perhebottia.

## Käynnistys

```bash
cd perhemuistelut
npm install
npm run dev
```

Avaa Vite-osoite selaimessa (yleensä `http://localhost:5173`). Nauhoitus toimii localhostissa ja HTTPS-ympäristössä.

Tuotantoversio:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

Valinnainen litterointiputki: kopioi `.env.example` tiedostoksi `.env` ja aseta `VITE_TRANSCRIPTION_WEBHOOK_URL`.

## Nauhoitus

1. Selain yrittää `MediaRecorder` + `getUserMedia` -nauhoitusta, jos konteksti on suojattu ja API on tuettu.
2. Tuetut mime-tyypit kokeillaan järjestyksessä: `audio/webm;codecs=opus`, `audio/webm`, `audio/mp4`, `audio/ogg`.
3. **Nauhoita / Tauko / Lopeta ja tallenna** ovat nappeja ja pikanäppäimiä (`R`, `P`, `S`; tekstikentässä `Alt` + kirjain).
4. Jos MediaRecorder puuttuu, lupa evätään tai yhteys ei ole suojattu, ohjaamo jää muistiinpano- ja tiedostoliitostilaan. Haastattelu ei pysähdy.
5. Ääniblobit tallennetaan **IndexedDB**:hen. `localStorage` pitää vain metadatan ja `blobRef`-viitteen, jotta kiintiö ei täyty.

## Litterointiputki

Selain ei tee puheentunnistusta itse. Rajapinta on `TranscriptionAdapter`:

| Adapteri | Milloin | Mitä tekee |
| --- | --- | --- |
| `PlaceholderTranscriptionAdapter` | oletus | Palauttaa paikkamerkin ja tyhjät puhujajaksot |
| `WebhookTranscriptionAdapter` | `VITE_TRANSCRIPTION_WEBHOOK_URL` | POST `FormData`: `payload` + valinnainen `audio` |

Esimerkkikuorma on tiedostossa `examples/transcription-webhook.payload.json`. Se pyytää **diarisointia** tunnetuille puhujille:

- `vili` — haastattelija
- `leena` — vastaaja, s. 1957
- `jorma` — vastaaja, s. 1957
- `unknown` — tunnistamaton puhuja

Paluuarvoksi odotetaan pelkkää litteraattia ja/tai `speaker`-kentällä merkittyjä jaksoja. Jaksot voi silti kirjoittaa ja muokata ohjaamossa.

## Tallennus ja vienti

`localStorage`-avain: `perhemuistelut.interview.v1`

Jokaisesta kysymyksestä säilytetään:

- kysymysteksti ja teema
- haastattelija ja vastaajat
- alku- ja loppuaikaleima
- äänimetadata ja blob-viite
- litteraatin paikkamerkki / muokattu teksti
- puhujalle attribuoidut segmentit
- vapaat muistiinpanot

**Lataa perhehistoria-JSON** vie skeeman `perhemuistelut.family-history.v1` (äänen binääriä ei upoteta; viitteet säilyvät).

## Saavutettavuus

- Suuri leipäteksti, vielä suurempi kysymys
- Korkea kontrasti, näkyvä `focus-visible`
- `lang="fi"`, skip-linkki, `aria-live`, progressbar, nappien nimet
- Vähintään ~44 px napit, ei pientä leipätekstiä
- Responsiivinen: yksi palsta puhelimessa, kaksi työpöydällä
