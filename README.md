# Perhemuistelut

Suomenkielinen, isotekstinen haastattelunäkymä, jolla **Vili** kerää vanhempiensa **Leenan** ja **Jorman** (s. 1957) tarinoita.

Valitse ensin haastateltava. Kymmenen aihetta etenee yksi kerrallaan (lapsuus, koti, perinteet, työ, rakkaus ja perhe, vaikeat ajat, paikat, teknologia, neuvo, viesti tuleville). Tarina kirjoitetaan vapaasti; äänitys on valinnainen.

Tarinat jäävät tälle laitteelle (`localStorage`). Kirjautumista ei ole.

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

Valinnainen litterointiputki: kopioi `.env.example` tiedostoksi `.env` ja aseta `VITE_TRANSCRIPTION_WEBHOOK_URL`.

## Nauhoitus

1. Selain yrittää `MediaRecorder` + `getUserMedia` -nauhoitusta, jos konteksti on suojattu ja API on tuettu.
2. Tuetut mime-tyypit kokeillaan järjestyksessä: `audio/webm;codecs=opus`, `audio/webm`, `audio/mp4`, `audio/ogg`.
3. **Nauhoita / Tauko / Lopeta ja tallenna** ovat nappeja. Pikanäppäimet ovat valinnaisia.
4. Jos MediaRecorder puuttuu, lupa evätään tai yhteys ei ole suojattu, kirjoittaminen ja tiedoston liittäminen toimivat silti.
5. Ääniblobit tallennetaan **IndexedDB**:hen. `localStorage` pitää vain metadatan ja `blobRef`-viitteen.

## Tallennus ja vienti

`localStorage`-avaimet:

- `perhemuistelut.active-respondent.v1` — viimeksi valittu haastateltava
- `perhemuistelut.interview.v1.leena` ja `.jorma` — kummankin tarinat erikseen

**Lataa tarinat tekstinä** tekee luettavan `.txt`-kopion. **Lataa JSON** vie skeeman `perhemuistelut.family-history.v1` (äänen binääriä ei upoteta).

## Saavutettavuus

- Suuri leipäteksti, vielä suurempi kysymys
- Korkea kontrasti, näkyvä `focus-visible`
- `lang="fi"`, skip-linkki, `aria-live`, progressbar, isot napit
- Responsiivinen: yksi palsta puhelimessa, kaksi työpöydällä
