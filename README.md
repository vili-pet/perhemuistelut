# Perhemuistelot

Suomenkielinen haastattelijan näkymä, jolla **Vili** kerää vanhempiensa **Leenan** ja **Jorman** (s. 1957) tarinoita.

Yksi yhteinen istunto. Ei henkilövalitsinta. Vanhemmat juttelevat yhdessä — he eivät käytä ruutua. Ruudulla on yksi keskustelunaihe kerrallaan. **Seuraava** / **Edellinen** vaihtavat vain aiheen; ääni ei katkea.

Kymmenen pääkysymystä ovat täsmälleen [kysymykset.md](https://github.com/vili-pet/perhemuistelut)-tiedostosta. Niitä ei kirjoiteta uusiksi. Kirjautumista ei ole.

Selainnauhoitus on totuus. Letterly ja Hedy tulevat vasta litterointiin jälkeenpäin. Haastattelun aikana ei ole live-webhookia.

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

Valinnaiset avaimet: kopioi `.env.example` tiedostoksi `.env`. Mikään niistä ei ole pakollinen. Haastattelu toimii ilman verkkoa.

## Nauhoitus

Yksi nauha voi sisältää koko kymmenen aiheen setin.

1. Selain yrittää `MediaRecorder` + `getUserMedia` -nauhoitusta, jos konteksti on suojattu ja API on tuettu.
2. Tuetut mime-tyypit kokeillaan järjestyksessä: `audio/webm;codecs=opus`, `audio/webm`, `audio/mp4`, `audio/ogg`.
3. **Nauhoita**, **Tauko**, **Lopeta** ja **Tallenna** ovat erillisiä nappeja. Lopeta ei tallenna; Tallenna ei lopeta.
4. Edellinen / Seuraava merkitsevät aiheeseen aikaleiman, jos nauhoitus on käynnissä tai tauolla. Ne eivät pysäytä MediaRecorderia.
5. Jos MediaRecorder puuttuu, lupa evätään tai yhteys ei ole suojattu, kirjoittaminen ja tiedoston liittäminen toimivat silti.
6. Ääniblobit tallennetaan **IndexedDB**:hen. `localStorage` pitää metadatan, aihemerkit, faktat ja `blobRef`-viitteen.

Pikanäppäimet: `R` nauhoita, `P` tauko, `E` lopeta, `S` tallenna, `N`/→ seuraava, `B`/← edellinen, `Alt+K` alusta.

Kesken nauhoituksen Vili voi liputtaa aiheen kiinnostavaksi, kirjoittaa lyhyen merkin, merkitä **palaa myöhemmin** ja hypätä takaisin listasta. Ääni ei katkea.

## Tallennus

`localStorage`-avain:

- `perhemuistelut.interview.v1` — yksi yhteinen istunto: haastattelija Vili, vastaajat Leena ja Jorma, 10 aihetta, session nauhat, aihemerkit, muistiinpanot, litteraattipaikat, puhujajaksot, merkit, faktapankki, henkilökohtaiset tukikysymykset

Ääni:

- IndexedDB `perhemuistelut-audio` / `clips` — blobit `blobRef`-avaimella

Vienti:

- **Lataa tarinat tekstinä** tekee luettavan `.txt`-kopion.
- **Lataa JSON** vie skeeman `perhemuistelut.family-history.v1` (molemmat vastaajat, `continuousRecording`, session `audio`, `topicTimestamps`, `facts`, merkit, henkilökohtaiset tukikysymykset; ei äänibittiä).

## Litterointi

- Adapteri (`placeholder` tai `webhook`) rakentaa esimerkkipayloadin, jossa on koko istunnon ääni, aihemerkit, faktapankki, henkilökohtaiset tukikysymykset ja diarisointiohjeet: Vili / Leena / Jorma / Tuntematon.
- Pyyntö lähtee vain napista **Valmistele litterointipyyntö**. Haastattelun aikana ei ole live-webhookia eikä tuplanauhoitusta.
- `VITE_TRANSCRIPTION_WEBHOOK_URL` on valinnainen. Ilman sitä paikkateksti jää ruudulle, ja Vili voi kirjoittaa jaksot käsin.

## Faktapankki ja henkilökohtaistaminen

Kun aihe vaihtuu (Seuraava, etenemisnappi, Edellinen uuteen) tai nauha lopetetaan, edellisen aiheen muistiinpanot, litteraatti ja puhujajaksot skannataan. Sääntöpohjainen poimija kerää paikkoja, vuosia ja muita avainfaktoja (esim. syntymäpaikka: Simpele).

Seuraavan teeman tukikysymykset täydentyvät faktoista. Esimerkki: jos he kertoivat syntyneensä Simpeleellä, lapsuuden jatko voi kysyä *minä vuonna muutitte pois Simpeleeltä?* Pääkysymysten 10 kehotetta pysyvät ennallaan.

- Vili näkee faktat muokattavina siruina.
- Ilman LLM-avainta käytetään paikallisia mallilauseita.
- Valinnainen `VITE_LLM_URL` (tai `VITE_PERSONALIZE_URL`) voi palauttaa tukikysymyksiä. Kutsu tapahtuu aiheenvaihdossa / lopetuksen jälkeen, ei toisena live-nauhoittajana. Epäonnistuminen ei katkaise haastattelua.

## Valinnaiset API-adapterit

Nämä eivät ole pakollisia runtime-riippuvuuksia.

- **Kysymys-/arkisto-API** (`VITE_QUESTIONS_API_URL`, `VITE_ARCHIVE_API_URL`, Bearer-avain): voi täydentää tukikysymyksiä. Paikalliset 10 kehotetta ovat kanonisia.
- **Poke.com** `POST https://poke.com/api/v1/inbound/api-message` on **uloslähtevä muistutus** merkinnälle *palaa myöhemmin*. Se ei ole kysymys-API eikä palauta Q&A:ta. `VITE_POKE_API_KEY` on valinnainen.

## Saavutettavuus

- Suomi, luettava leipäteksti, suurempi Vilin chat-kupla
- Korkea kontrasti, näkyvä `focus-visible`
- `lang="fi"`, skip-linkki, `aria-live`, progressbar, erilliset nauhoitusnapit
- **Puhelin ensin (~360–430 px):** isot napit (≥44 px), ei hover-only-toimintoja, ei vaakasivutusta. Nauhoituspalkki on pienellä ruudulla alareunassa (record / tauko / lopeta / tallenna + edellinen / seuraava). Kehote jää sen yläpuolelle; palkki ei peitä Vilin chat-kuplaa, koska sisältö saa alareunaan tilaa.
- Tabletti/työpöytä: `min-width` 768 px tuo nauhoituksen takaisin sivupolkuun, 960 px kaksi palstaa.
