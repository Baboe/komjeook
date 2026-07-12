# CLAUDE.md — Ombaa

Dit bestand laadt automatisch bij elke Claude Code sessie.
Lees dit volledig voordat je iets bouwt of aanpast.

---

## Wat is Ombaa?

Ombaa is een voice-first app waar je een activiteit voorstelt en iemand anders doet mee.

**Tagline:** Kom je ook?
**Domein:** ombaa.com
**Doelgroep:** 45-65 jaar, Nederland en Nederlandstalig België
**Status:** In ontwikkeling — MVP fase

---

## De kern

Zeg wat je wil doen. Iemand doet mee.

Geen swipen. Geen foto's verplicht. Geen profielen. Gewoon je stem en wat je wil doen.

**Het woord dat we NOOIT gebruiken in de app of marketing:** eenzaamheid.

---

## Tech stack

- **React Native + Expo** — iOS én Android vanuit één codebase
- **Supabase** — authenticatie, database, opslag van voice bestanden, real-time berichten
- **Expo AV** — voor voice opnames en afspelen
- **Visual Studio Code** als editor

---

## Design systeem

### Kleuren
```
--cream:           #F5F0E8  (achtergrond)
--cream-dark:      #EDE6D6  (borders, dividers)
--terracotta:      #C4614A  (primaire actieknop, accenten)
--terracotta-light:#E8917A  (hover states)
--aubergine:       #4A2D3E  (tekst, logo, donkere elementen)
--aubergine-mid:   #7A4D68  (secundaire elementen)
--warm-gray:       #5C4A42  (body tekst, labels)
--warm-gray-light: #8C7B74  (placeholder tekst, metadata)
--text-dark:       #2C1F1A  (koppen)
--text-mid:        #3D2E28  (bodytekst)
```

### Typografie
- **Display/koppen:** Fraunces, font-weight 300
- **Body/UI:** DM Sans, font-weight 400/500
- **Minimale lettergrootte:** 13px — doelgroep is 45+, leesbaarheid is cruciaal
- **Grijstinten altijd donker genoeg** — nooit lichter dan #5C4A42 voor leesbare tekst

### Knoppen
- Primair: terracotta, border-radius 999px, padding 13-14px
- Secundair: transparant met aubergine border
- Ghost: crème achtergrond

### Icoontjes
- Altijd SVG — geen emoji's in de UI
- Lijndikte 1.5-2px, stroke-linecap round

---

## Taal & tone of voice

- Altijd Nederlands — geen Engelse termen in de UI
- Menselijk en warm — geen robot-taal, geen AI-taal
- Nooit "we hebben dit herkend" of "pas aan als nodig" — vertaald Engels
- Nooit "feed" — zeg "Kom je ook?" of "oproepen"
- Afwijzing altijd neutraal: "Sandra's oproep is vervuld" — nooit persoonlijk
- Kort en direct — één actie per scherm

---

## App structuur

### Navigatie (4 items onderaan)
1. **Kom je ook?** — hoofdoverzicht met alle oproepen
2. **Mijn oproepen** — eigen oproepen + reacties
3. **Berichten** — inbox met alle gesprekken
4. **Profiel** — eigen profiel

### Schermen (MVP — Flow 1)

**Onboarding (6 schermen)**
1. Splash — logo + "Kom je ook?" + knop "Ja, ik kom!"
2. Naam + leeftijd
3. Locatie — automatisch of stad invullen
4. Interesses — lijst aantikken + vrij invulveld
5. Telefoonnummer + SMS verificatie
6. Eerste blik — preview van een activiteit in de buurt

**Activiteit plaatsen (5 schermen)**
1. Microfoon — "Wat ga jij doen?" — houd ingedrukt
2. Opname bezig
3. Bevestigen — auto-extract activiteit/datum/locatie + "Klopt er iets niet? Tik op Wijzig." + foto optioneel max 3
4. Zelfde scherm met foto's toegevoegd
5. Geplaatst — "Je oproep staat live" + knop "Kom je ook?"

**Reacties (4 schermen)**
1. Overzicht reacties — op volgorde van binnenkomst met tijdstip
2. Sandra kiest — kiesknop verschijnt na luisteren: "Leuk Marc, laten we gaan!"
3. Bevestiging — "We laten Marc weten" — geen schuldgevoel over anderen
4. Chat opent direct met Marc

**Inbox & navigatie (3 schermen)**
1. Berichten — namen op volgorde, tijdstip, activiteit als context
2. Mijn oproepen — actief + geweest
3. Chat — gesprek binnen de app, geen telefoonnummer nodig

**Notificaties**
- Reactie op oproep: "Marc wil mee naar de Noordermarkt"
- Gekozen: "Sandra wil graag met jou gaan. Kom je ook?"
- Nieuw bericht: preview van het bericht
- Herinnering: "Morgen ga je met Marc. Veel plezier!"
- Hoe was de ontmoeting: na afloop
- Niet gekozen (neutraal): "Sandra's oproep is vervuld" of "Sandra heeft iemand gevonden"
- Afzegging: "Marc kan helaas toch niet. Wil je iemand anders vragen?"
- Verlopen: "Niemand heeft gereageerd. Zin om iets nieuws te plaatsen?"

---

## Profiel

| Veld | Verplicht | Notitie |
|------|-----------|---------|
| Voornaam | Ja | |
| Telefoonnummer | Ja | SMS verificatie — nooit zichtbaar voor anderen |
| Locatie | Ja | Automatisch of stad |
| Leeftijd | Ja | |
| Avatar | Nee | Optioneel — geen echte foto verplicht |
| Interesses | Nee | Lijst + vrij invulveld |
| Stem | Nee bij aanmaken | Verplicht vóór eerste oproep of reactie |

---

## Activiteiten & matching

- Activiteit heeft een locatie
- Reageerder stelt zelf een zoekradius in
- Stem is het echte profiel — geen swipen op foto's
- Foto's bij activiteit: optioneel, max 3

---

## Veiligheid & vertrouwen

**No-show systeem:**
- Na elke ontmoeting: "Hoe was de ontmoeting?" + 1-5 sterren + "Is iedereen gekomen?"
- Eerste no-show: vriendelijke waarschuwing
- Tweede no-show: minder zichtbaar
- Derde no-show: account tijdelijk bevroren
- Vooraf afzeggen telt NIET als no-show

**Nepaccounts:**
- Telefoonnummer verplicht + SMS verificatie bij registratie

**Privacy:**
- Telefoonnummer nooit zichtbaar voor andere gebruikers
- Chat binnen de app — geen telefoonnummer nodig om af te spreken
- Data veiligheid is cruciaal — gevoelige informatie van 45+ doelgroep

---

## Wat we NIET bouwen in MVP (Flow 1)

- Flow 2: Sandra gaat met een groepje (komt later)
- Flow 3: Afgewezen reageerders koppelen aan elkaar (komt later)
- "Marc kan toch niet" flow (komt later)
- Betaalde functies
- IRL events

---

## Bouwen in deze volgorde

1. Project setup — Expo + Supabase
2. Onboarding flow
3. Activiteit plaatsen
4. Activiteiten overzicht
5. Reacties scherm
6. Inbox & chat
7. Notificaties
8. No-show systeem

---

## Founders

- **Loeloe** — strategie, concept, product
- **Tomer Reijntjens** — netwerk Nederland/België, LinkedIn, gezicht naar buiten

---

*Versie 1 — Mei 2026*
*Gebouwd op basis van een volledige product- en designsessie.*
