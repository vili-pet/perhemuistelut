# Perhemuistelot

Telegram Mini App, jolla **Vili** haastattelee **Leenaa** ja **Jormaa** (s. 1957) puhelimen Telegramissa. Erillistä sovellusta ei avata.

Yksi yhteinen istunto. Vanhemmat juttelevat yhdessä — he eivät käytä ruutua. Ruudulla on yksi keskustelunaihe kerrallaan. **Seuraava** / **Edellinen** vaihtavat vain aiheen; Mini Appin ääni ei katkea.

Kymmenen pääkysymystä ovat täsmälleen [kysymykset.md](https://github.com/vili-pet/perhemuistelut)-tiedostosta. Niitä ei kirjoiteta uusiksi.

Pääsy: vain Vilin Telegram-käyttäjä (`TELEGRAM_ALLOWED_USER_ID`). Muut saavat suomenkielisen hylkäyksen.

## Telegram Mini App

1. Luo botti [@BotFather](https://t.me/BotFather) komennolla `/newbot`. Saat `TELEGRAM_BOT_TOKEN`.
2. Deployaa tämä repo Verceliin (HTTPS). Kopioi preview- tai production-URL.
3. BotFather: `/newapp` tai `/setmenubutton` → Web App URL = Vercel-osoite (juuri, esim. `https://….vercel.app`).
4. Hae oma numerinen id (`@userinfobot` tai botti kertoo sen hylkäysviestissä). Aseta se allowlistiin.
5. Vercel Environment Variables:
   - `TELEGRAM_BOT_TOKEN` (salaisuus, ei `VITE_`)
   - `TELEGRAM_ALLOWED_USER_ID` (Vilin numerinen id)
   - `VITE_TELEGRAM_ALLOWED_USER_ID` (sama id Mini Appin client-portille; ei salaisuus)
   - `TELEGRAM_WEBAPP_URL` (sama HTTPS-osoite kuin BotFatherissa)
   - valinnainen `TELEGRAM_WEBHOOK_SECRET`
6. Kytke webhook (älä aja `npm run bot` samaan aikaan):

```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=https://YOUR.vercel.app/api/telegram" \
  -d "secret_token=$TELEGRAM_WEBHOOK_SECRET"
```

7. Telegramissa `/start` → **Avaa haastattelu**. Napit: nykyinen aihe, edellinen/seuraava, kiinnostava, palaa myöhemmin.

Päänauha on Mini Appin **MediaRecorder**. Telegram-ääniviesti on varatapa; botti ei ota sitä, jos Mini App nauhoittaa jo.

## Käynnistys

```bash
npm install
cp .env.example .env   # täytä Telegram-kentät bottia varten
npm run dev
```

Avaa Vite-osoite selaimessa (yleensä `http://localhost:5173`). Paikallinen kehitys on sallittu ilman Telegramia. Nauhoitus toimii localhostissa ja HTTPS-ympäristössä.

Botti (long poll, poista webhook ensin):

```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/deleteWebhook"
npm run bot
```

Botti kuuntelee Telegramia ja tarjoaa paikallisen APIn `http://127.0.0.1:8787` (`/api/session`, `/api/telegram`, `/api/telegram-verify`). Vite proxyttaa `/api` sinne.

Tuotantoversio:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

Vercel ajaa `npm run build` (`tsc -b && vite build`), julkaisee `dist/` ja serverless-reitit `api/*.js` (botti webhook + istunto). TypeScript-virheet katkaisevat deployn.

## Putki

1. **Nauhoita** selaimessa (yksi teema ruudulla, ääni jatkuu koko keskustelun).
2. **Lopeta** keskustelun päätteeksi ja **tallenna äänitiedosto koneelle tai puhelimeen** (webm / m4a / ogg). Selain-localStorage / IndexedDB ei ole ainoa kopio.
3. **Myöhemmin Hedy:** asennettu Hedy-sovellus ottaa äänitiedoston. Valmiit litteroinnit palaavat API:sta tai webhookista.
4. Vili tarkistaa puhujatägit. Diarisointi on luonnos, ei lopullinen.

Hedya ei tarvita haastattelun aikana. Ei tuplanauhoitusta Hedyssä haastatellessa. Haastattelun aikana ei ole live-webhookia.

## Nauhoitus

Yksi nauha voi sisältää koko kymmenen aiheen setin.

1. Selain yrittää `MediaRecorder` + `getUserMedia` -nauhoitusta, jos konteksti on suojattu ja API on tuettu.
2. Tuetut mime-tyypit kokeillaan järjestyksessä: `audio/webm;codecs=opus`, `audio/webm`, `audio/mp4`, `audio/ogg`.
3. **Nauhoita**, **Tauko**, **Lopeta** ja **Tallenna äänitiedosto** ovat erillisiä nappeja. Lopeta ei katkaise aiheen vaihtoa. Aiheen vaihto ei katkaise ääntä.
4. Lopetuksen jälkeen nauha autosaveataan IndexedDB:hen, mutta **pakollinen UX** on lataus pois selaimesta: *Tallenna äänitiedosto koneelle/puhelimeen*. Sama nappi on myöhemmin istunnon nauhoissa.
5. Edellinen / Seuraava merkitsevät aiheeseen aikaleiman, jos nauhoitus on käynnissä tai tauolla. Ne eivät pysäytä MediaRecorderia.
6. Jos MediaRecorder puuttuu, lupa evätään tai yhteys ei ole suojattu, kirjoittaminen ja tiedoston liittäminen toimivat silti.

Pikanäppäimet: `R` nauhoita, `P` tauko, `E` lopeta, `S` tallenna äänitiedosto, `N`/→ seuraava, `B`/← edellinen, `Alt+K` alusta.

Kesken nauhoituksen Vili voi liputtaa aiheen kiinnostavaksi, kirjoittaa lyhyen merkin, merkitä **palaa myöhemmin** ja hypätä takaisin listasta. Ääni ei katkea.

## Tallennus

`localStorage`-avain:

- `perhemuistelut.interview.v1` — yksi yhteinen istunto: haastattelija Vili, vastaajat Leena ja Jorma, 10 aihetta, session nauhat, aihemerkit, muistiinpanot, litteraattipaikat, puhujajaksot, merkit, faktapankki, henkilökohtaiset tukikysymykset

Ääni:

- IndexedDB `perhemuistelut-audio` / `clips` — blobit `blobRef`-avaimella (autosave, ei ainoa kopio)
- **Tallenna äänitiedosto koneelle/puhelimeen** lataa MediaRecorder-blobin (webm / m4a / ogg)

Vienti:

- **Tallenna äänitiedosto koneelle/puhelimeen** on varmuuskopio pois selaimesta.
- **Lataa tarinat tekstinä** tekee luettavan `.txt`-kopion.
- **Lataa JSON** vie skeeman `perhemuistelut.family-history.v1` (molemmat vastaajat, `continuousRecording`, session `audio`, `topicTimestamps`, `facts`, merkit, henkilökohtaiset tukikysymykset; ei äänibittiä).

## Hedy-jälkikäsittely

- Hedy ei kaappaa live-ääntä. Asennettu Hedy-sovellus vastaanottaa ladatun äänitiedoston.
- Adapteri (`hedy-placeholder` tai `hedy`) rakentaa esimerkkipayloadin: äänimetatieto, blob/file-viite, aihemerkit, puhujat Vili / Leena / Jorma / Tuntematon, `diarizationDraft: true`, `humanReviewRequired: true`.
- Pyyntö lähtee vain napista **Valmistele Hedy-pyyntö jälkeenpäin**. Nauhoituksen aikana nappi on pois päältä. Ei live-webhookia, ei tuplanauhoitusta.
- `VITE_HEDY_WEBHOOK_URL` / `VITE_HEDY_API_URL` ovat valinnaisia. Ilman niitä paikka-adapteri näyttää ohjeen, ja Vili voi kirjoittaa jaksot käsin.
- Puhujatägit ovat luonnos, kunnes Vili tarkistaa ne. Diarisointi ei ole koskaan lopullinen.

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
- **Puhelin ensin (~360–430 px):** isot napit (≥44 px), ei hover-only-toimintoja, ei vaakasivutusta. Nauhoituspalkki on pienellä ruudulla alareunassa (record / tauko / lopeta / tallenna äänitiedosto + edellinen / seuraava). Kehote jää sen yläpuolelle; palkki ei peitä Vilin chat-kuplaa, koska sisältö saa alareunaan tilaa.
- Tabletti/työpöytä: `min-width` 768 px tuo nauhoituksen takaisin sivupolkuun, 960 px kaksi palstaa.
