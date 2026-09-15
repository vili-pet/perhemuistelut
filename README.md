# Perhemuistelot

Suomenkielinen haastattelijan näkymä, jolla **Vili** kerää vanhempiensa **Leenan** ja **Jorman** (s. 1957) tarinoita.

Yksi yhteinen istunto. Ruudulla on yksi keskustelunaihe kerrallaan. Vanhemmat juttelevat yhdessä — he eivät käytä käyttöliittymää. **Seuraava** vaihtaa vain aiheen; ääni ei katkea.

Kymmenen kehotetta on [kysymykset.md](https://github.com/vili-pet/perhemuistelut)-tiedostosta. Kirjautumista ei ole. Selainnauhoitus on totuus; Letterly ja Hedy tulevat vasta litterointiin jälkeenpäin.

## Käynnistys

```bash
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

Valinnainen litterointiputki: kopioi `.env.example` tiedostoksi `.env` ja aseta `VITE_TRANSCRIPTION_WEBHOOK_URL`. Webhookia ei kutsuta haastattelun aikana.

## Nauhoitus

Yksi nauha voi sisältää koko kymmenen aiheen setin.

1. Selain yrittää `MediaRecorder` + `getUserMedia` -nauhoitusta, jos konteksti on suojattu ja API on tuettu.
2. Tuetut mime-tyypit kokeillaan järjestyksessä: `audio/webm;codecs=opus`, `audio/webm`, `audio/mp4`, `audio/ogg`.
3. **Nauhoita**, **Tauko**, **Lopeta** ja **Tallenna** ovat erillisiä nappeja. Lopeta ei tallenna; Tallenna ei lopeta.
4. Edellinen / Seuraava merkitsevät aiheeseen aikaleiman, jos nauhoitus on käynnissä tai tauolla. Ne eivät pysäytä MediaRecorderia.
5. Jos MediaRecorder puuttuu, lupa evätään tai yhteys ei ole suojattu, kirjoittaminen ja tiedoston liittäminen toimivat silti.
6. Ääniblobit tallennetaan **IndexedDB**:hen. `localStorage` pitää metadatan, aihemerkit ja `blobRef`-viitteen.

Pikanäppäimet: `R` nauhoita, `P` tauko, `E` lopeta, `S` tallenna, `N`/→ seuraava, `B`/← edellinen, `Alt+K` alusta.

## Tallennus ja transkriptio

`localStorage`-avain:

- `perhemuistelut.interview.v1` — yksi yhteinen istunto (haastattelija Vili, vastaajat Leena ja Jorma, 10 aihetta, session nauhat, aihemerkit, muistiinpanot, litteraattipaikat, puhujajaksot)

Ääni:

- IndexedDB `perhemuistelut-audio` / `clips` — blobit `blobRef`-avaimella

Vienti:

- **Lataa tarinat tekstinä** tekee luettavan `.txt`-kopion.
- **Lataa JSON** vie skeeman `perhemuistelut.family-history.v1` (molemmat vastaajat, `continuousRecording`, session `audio`, `topicTimestamps`, ei äänibittiä).

Litterointi:

- Adapteri (`placeholder` tai `webhook`) rakentaa esimerkkipayloadin, jossa on koko istunnon ääni, aihemerkit ja diarisointiohjeet: Vili / Leena / Jorma / Tuntematon.
- Pyyntö lähtee vain napista **Valmistele litterointipyyntö**. Haastattelun aikana ei ole live-webhookia.

## Saavutettavuus

- Suomi, luettava leipäteksti, suurempi Vilin chat-kupla
- Korkea kontrasti, näkyvä `focus-visible`
- `lang="fi"`, skip-linkki, `aria-live`, progressbar, erilliset nauhoitusnapit
- Responsiivinen: yksi palsta puhelimessa, kaksi työpöydällä
