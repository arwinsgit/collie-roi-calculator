# Collie ROI Calculator — Claude Code Briefing

## Project doel

Bouw een ROI calculator voor Collie (agritech, GPS halsbanden voor melkvee/rotationeel weiden). De calculator helpt boeren berekenen wat Collie hen oplevert per jaar.

## Tech stack

- React + Vite
- Chakra UI v3
- Supabase (scenario config + leads opslaan)
- Vercel (hosting)
- GitHub (versiecontrole)
- Google Fonts: Montserrat (headings) + Poppins (body)

---

## Kernprincipe: één calculator module

Er is **één berekeningsmodule** (`useCalculation.js`) die overal gebruikt wordt. De teaser gebruikt exact dezelfde berekeningslogica als de volledige calculator. Het enige verschil is welke input er wordt meegegeven.

De teaser vult de calculator in met:
- Boer-invoer (koeien, hectare, uren, dagen, melkrobot)
- Scenario waarden uit Supabase (conservatief of optimistisch)

De volledige calculator vult de calculator in met:
- Boer-invoer uit de teaser
- Gemiddelde scenario waarden als defaults (aanpasbaar door de boer)

---

## Applicatiestructuur

### Deel 1: ROI Calculator (publiek toegankelijk)

#### Stap 1 — Start (Teaser)

Boer vult in:
- Aantal melkkoeien
- Hectare grasland beschikbaar
- Uren per jaar weiden nu
- Dagen per jaar weiden nu
- Melkrobot (Nee/Ja toggle)

Na invullen en klikken op "Bereken":
- Laadt drie scenario's uit Supabase
- Berekent conservatief en optimistisch via `calculate(buildCalculatorState(teaserInputs, scenario))`
- Toont range: conservatief netto rendement — optimistisch netto rendement
- Knop "Start uitgebreide berekening"

#### Stap 2 — Contact

Velden: naam, email, bedrijfsnaam, telefoonnummer, provincie

Wordt opgeslagen als lead in Supabase. Verplicht om door te gaan.

#### Stap 3 — Beweiding vergelijking

Tabel Nu vs Met Collie:
- Totaal weide dagen
- Totaal weide-uren
- Beweiding arbeid (uur/dag)
- Stal arbeid weidedagen (uur/dag)
- Stal arbeid staldagen (uur/dag) — read-only, altijd gelijk aan Nu

Pre-filled vanuit gemiddeld scenario + boer teaser invoer.

#### Stap 4 — Melkproductie vergelijking

Tabel Nu vs Met Collie:
- Melkproductie per koe (kg/jaar)
- Melkingen per dag

#### Stap 5 — Voer vergelijking

Twee secties: **weidedagen** en **staldagen**

Weidedagen Nu vs Met Collie:
- Weidegras opname — **altijd berekend**: `Math.ceil((uren/dagen) × 0.75)` kg DS, niet aanpasbaar
- Graskuil opname — **altijd berekend**: `Math.max(0, 15 - weidegras)`, niet aanpasbaar
- Krachtvoer opname
- Maiskuil opname
- Bijproducten opname

Staldagen — Met Collie is altijd gelijk aan Nu (read-only, niet aanpasbaar):
- Graskuil opname
- Krachtvoer opname
- Maiskuil opname
- Bijproducten opname

#### Stap 6 — Prijzen en kosten

Pre-filled vanuit gemiddeld scenario, volledig aanpasbaar:
- Melkprijs (€/kg)
- Krachtvoer prijs (€/kg DS)
- Bijproducten prijs (€/kg DS)
- Strooisel kosten (€/dag)
- Mestuitrijden kosten (€/m³)
- Arbeid waarde (€/uur)

#### Stap 7 — Resultaat

Toont:
- Netto rendement per jaar (groot getal)
- Per koe per jaar
- Opbouw besparingen (horizontale gekleurde balk met percentages)
- Legenda: Arbeid, Krachtvoer, Kuil, Strooisel, Mest
- Kaarten: Arbeidsbesparing, Extra melkopbrengst, Krachtvoer besparing, Kuilvoer besparing, Bruto baten, Collie kosten
- Disclaimer: niet meegeteld (hekwerk, gezondheidsdata, etc.)

---

### Deel 2: Admin Panel (intern Collie, achter login)

#### Scenario board
Tabel met drie rijen: Conservatief, Gemiddeld, Optimistisch. Alle velden inline bewerkbaar. Wijzigingen worden direct opgeslagen in Supabase.

#### Berekeningen board
Overzicht van alle ingevulde calculators. Kolommen: naam, bedrijf, datum, stap bereikt, netto rendement, koeien, hectares, uren/jaar.

#### Leads board
Overzicht van contactgegevens: naam, email, bedrijf, telefoon, provincie, datum.

---

## Berekeningslogica (useCalculation.js)

### Kraagprijzen

```js
const getCollarPrice = (numCows) => {
  const collarPerYear = 50;
  const servicePerYear = 40;
  let discount = 0;
  if (numCows >= 500) discount = 0.15;
  else if (numCows >= 200) discount = 0.10;
  else if (numCows >= 100) discount = 0.05;
  return collarPerYear * (1 - discount) + servicePerYear;
};
```

### Grasopname

```js
const calcGrassIntake = (hours, days) => {
  if (!days || !hours) return 0;
  return Math.ceil((hours / days) * 0.75); // kg DS per dag
};
```

**Belangrijk:** deze functie wordt overal gebruikt — in de teaser én in de volledige calculator. Nooit een andere formule gebruiken.

### Hoofdberekening

```js
const calculate = (state) => {
  const { farm, grazing, feedGrazing, feedStable, market, collieGrazing, collieStable } = state;

  const collarPrice = getCollarPrice(farm.numCows);
  const weidedagenNu = grazing.totalDays || 0;
  const staldagenNu = 365 - weidedagenNu;
  const weidedagenCollie = collieGrazing.newTotalDays || weidedagenNu;
  const staldagenCollie = 365 - weidedagenCollie;

  // Arbeid
  const labourNuWeide = (grazing.grazingLabourHours + grazing.stallLabourHours) * weidedagenNu;
  const labourNuStal = grazing.stallLabourStaldagen * staldagenNu;
  const totalLabourNu = labourNuWeide + labourNuStal;
  const labourCollieWeide = (collieGrazing.newGrazingLabour + collieGrazing.newStallLabourWeidedagen) * weidedagenCollie;
  const labourCollieStal = collieStable.newStallLabour * staldagenCollie;
  const totalLabourCollie = labourCollieWeide + labourCollieStal;
  const labourSavingHours = totalLabourNu - totalLabourCollie;
  const labourSaving = labourSavingHours * market.labourCost;

  // Melk
  const extraMilkLitres = (collieGrazing.newMilkProduction - farm.milkProduction) * farm.numCows;
  const milkSaving = extraMilkLitres * market.milkPrice;

  // Krachtvoer
  const concentrateNuYear = (feedGrazing.concentrateIntake * weidedagenNu) + (feedStable.concentrateIntake * staldagenNu);
  const concentrateCollieYear = (collieGrazing.newConcentrateIntake * weidedagenCollie) + (collieStable.newConcentrateIntake * staldagenCollie);
  const concentrateSaved = (concentrateNuYear - concentrateCollieYear) * farm.numCows;
  const concentrateSaving = market.concentratePrice * concentrateSaved;

  // Bijproducten
  const byproductNuYear = (feedGrazing.byproductIntake * weidedagenNu) + (feedStable.byproductIntake * staldagenNu);
  const byproductCollieYear = (collieGrazing.newByproductIntake * weidedagenCollie) + (collieStable.newByproductIntake * staldagenCollie);
  const byproductSaved = (byproductNuYear - byproductCollieYear) * farm.numCows;
  const byproductSaving = market.byproductPrice * byproductSaved;

  // Kuilvoer
  const grassSilageNuYear = (feedGrazing.grassSilageIntake * weidedagenNu) + (feedStable.grassSilageIntake * staldagenNu);
  const grassSilageCollieYear = (collieGrazing.newGrassSilageIntake * weidedagenCollie) + (collieStable.newGrassSilageIntake * staldagenCollie);
  const silageSaved = (grassSilageNuYear - grassSilageCollieYear) * farm.numCows;
  const silageSaving = silageSaved * (market.silageCost - market.grassCostField);

  // Strooisel
  const litterSaving = market.litterCost * weidedagenCollie;

  // Mest
  const totalExcretionPerCowPerDay = market.urineProduction + market.manureProduction;
  const hoursInYear = 8760;
  const manureInsideCurrent = ((totalExcretionPerCowPerDay / 24) * (hoursInYear - grazing.totalGrazingHours) * farm.numCows) / 1000;
  const manureInsideCollie = ((totalExcretionPerCowPerDay / 24) * (hoursInYear - collieGrazing.newTotalGrazingHours) * farm.numCows) / 1000;
  const manureSaved = manureInsideCurrent - manureInsideCollie;
  const manureSaving = manureSaved * market.manureSpreadCost;

  const grossBenefit = labourSaving + milkSaving + concentrateSaving + byproductSaving + silageSaving + litterSaving + manureSaving;
  const collarCost = collarPrice * farm.numCows;
  const netBenefit = grossBenefit - collarCost;
  const netPerCow = farm.numCows > 0 ? netBenefit / farm.numCows : 0;

  return {
    labourSavingHours, labourSaving, extraMilkLitres, milkSaving,
    concentrateSaved, concentrateSaving, byproductSaved, byproductSaving,
    silageSaved, silageSaving, litterSaving, manureSaved, manureSaving,
    grossBenefit, collarCost, collarPrice, netBenefit, netPerCow,
    weidedagen: weidedagenNu, staldagen: staldagenNu,
    weidedagenCollie, staldagenCollie,
  };
};
```

---

## buildCalculatorState (gedeelde utility — src/utils/buildCalculatorState.js)

**Dit is de enige plek waar calculator state wordt opgebouwd.** Wordt gebruikt door zowel de teaser als de volledige calculator.

```js
export function buildCalculatorState(inputs, scenario) {
  const { numCows, hectaresAvailable, currentGrazingHours, currentGrazingDays, hasRobot } = inputs;

  const calcGrassIntake = (hours, days) => {
    if (!days || !hours) return 0;
    return Math.ceil((hours / days) * 0.75);
  };

  const currentGrassIntake = calcGrassIntake(currentGrazingHours, currentGrazingDays);
  const collieGrassIntake = calcGrassIntake(
    scenario.urenCollie ?? currentGrazingHours,
    scenario.weidedagenCollie ?? currentGrazingDays
  );
  const currentGrassSilage = Math.max(0, 15 - currentGrassIntake);
  const collieGrassSilage = Math.max(0, 15 - collieGrassIntake);

  return {
    farm: {
      numCows,
      milkProduction: scenario.melkproductie ?? 9000,
      hasRobot: hasRobot ?? false,
      hectaresGrass: hectaresAvailable,
    },
    grazing: {
      totalDays: currentGrazingDays,
      totalGrazingHours: currentGrazingHours,
      grazingLabourHours: scenario.arbeidBeweidingNuWeide ?? 1.0,
      stallLabourHours: scenario.arbeidStalNuWeide ?? 1.0,
      stallLabourStaldagen: scenario.arbeidStalNuStal ?? 2.0,
      milkingsPerDay: hasRobot
        ? (scenario.melkingenNuRobot ?? 2.3)
        : (scenario.melkingenNuMelkstal ?? 2),
    },
    feedGrazing: {
      grassIntake: currentGrassIntake,            // altijd berekend
      concentrateIntake: scenario.krachtvoerOpnameNuWeide ?? 5,
      byproductIntake: scenario.bijproductenOpnameNuWeide ?? 0,
      grassSilageIntake: currentGrassSilage,      // altijd berekend
      maizeSilageIntake: scenario.maiskuilOpnameNuWeide ?? 0,
    },
    feedStable: {
      grassIntake: 0,
      concentrateIntake: scenario.krachtvoerOpnameNuStal ?? 5,
      byproductIntake: scenario.bijproductenOpnameNuStal ?? 0,
      grassSilageIntake: scenario.graskuilOpnameNuStal ?? 15,
      maizeSilageIntake: scenario.maiskuilOpnameNuStal ?? 0,
    },
    market: {
      milkPrice: scenario.melkprijs ?? 0.45,
      concentratePrice: scenario.krachtvoerPrijs ?? 0.35,
      byproductPrice: scenario.bijproductenPrijs ?? 0.25,
      litterCost: scenario.strooiselKosten ?? 5,
      manureSpreadCost: scenario.mestuitrijdenKosten ?? 3,
      labourCost: scenario.arbeidWaarde ?? 35,
      grassCostField: 0.08,
      silageCost: 0.18,
      urineProduction: 17,
      manureProduction: 71.23,
      grassConversion: 1.64,
      extraGrassGrowth: 0.15,
    },
    collieGrazing: {
      newTotalDays: scenario.weidedagenCollie ?? currentGrazingDays,
      newTotalGrazingHours: scenario.urenCollie ?? currentGrazingHours,
      newGrazingLabour: scenario.arbeidBeweidingCollieWeide ?? 0.15,
      newStallLabourWeidedagen: scenario.arbeidStalCollieWeide ?? 0.5,
      newMilkings: hasRobot
        ? (scenario.melkingenCollieRobot ?? 2.3)
        : (scenario.melkingenCollieMelkstal ?? 2),
      newMilkProduction: scenario.melkproductieCollie ?? scenario.melkproductie ?? 9000,
      newGrassIntake: collieGrassIntake,          // altijd berekend
      newConcentrateIntake: scenario.krachtvoerOpnameCollieWeide ?? 4,
      newByproductIntake: scenario.bijproductenOpnameCollieWeide ?? 0,
      newGrassSilageIntake: collieGrassSilage,    // altijd berekend
      newMaizeSilageIntake: scenario.maiskuilOpnameCollieWeide ?? 0,
    },
    collieStable: {
      // Stal arbeid staldagen verandert NIET met Collie
      newStallLabour: scenario.arbeidStalNuStal ?? 2.0,
      newGrassIntake: 0,
      newConcentrateIntake: scenario.krachtvoerOpnameNuStal ?? 5,
      newByproductIntake: scenario.bijproductenOpnameNuStal ?? 0,
      newGrassSilageIntake: scenario.graskuilOpnameNuStal ?? 15,
      newMaizeSilageIntake: scenario.maiskuilOpnameNuStal ?? 0,
    },
  };
}
```

---

## Supabase tabellen

### scenarios
```sql
id uuid primary key default gen_random_uuid()
name text not null -- 'Conservatief' | 'Gemiddeld' | 'Optimistisch'
scenario_type text

-- Collie projecties
weidedagen_collie integer
uren_collie integer
arbeid_beweiding_collie_weide decimal
arbeid_stal_collie_weide decimal

-- Melkproductie
melkproductie integer
melkproductie_collie integer
melkingen_nu_melkstal decimal
melkingen_nu_robot decimal
melkingen_collie_melkstal decimal
melkingen_collie_robot decimal

-- Arbeid Nu
arbeid_beweiding_nu_weide decimal
arbeid_stal_nu_weide decimal
arbeid_stal_nu_stal decimal

-- Voer Nu weidedagen
krachtvoer_opname_nu_weide decimal
bijproducten_opname_nu_weide decimal
maiskuil_opname_nu_weide decimal

-- Voer Collie weidedagen
krachtvoer_opname_collie_weide decimal
bijproducten_opname_collie_weide decimal
maiskuil_opname_collie_weide decimal

-- Voer staldagen (zelfde voor Nu en Collie)
graskuil_opname_nu_stal decimal
krachtvoer_opname_nu_stal decimal
bijproducten_opname_nu_stal decimal
maiskuil_opname_nu_stal decimal

-- Prijzen
melkprijs decimal
krachtvoer_prijs decimal
bijproducten_prijs decimal
strooisel_kosten decimal
mestuitrijden_kosten decimal
arbeid_waarde decimal
```

### leads
```sql
id uuid primary key default gen_random_uuid()
created_at timestamptz default now()
naam text
email text
bedrijfsnaam text
telefoon text
provincie text
aantal_koeien integer
hectares decimal
uren_nu integer
dagen_nu integer
melkrobot boolean
```

### berekeningen
```sql
id uuid primary key default gen_random_uuid()
created_at timestamptz default now()
lead_id uuid references leads(id)
stap text
netto_rendement decimal
bruto_baten decimal
collar_kosten decimal
arbeid_besparing decimal
krachtvoer_besparing decimal
kuilvoer_besparing decimal
strooisel_besparing decimal
mest_besparing decimal
extra_melk decimal
form_data jsonb
```

---

## Initiële scenario waarden (Supabase seed data)

### Conservatief
| Veld | Waarde |
|------|--------|
| weidedagen_collie | 180 |
| uren_collie | 2000 |
| arbeid_beweiding_collie_weide | 0.20 |
| arbeid_stal_collie_weide | 0.5 |
| melkproductie | 9000 |
| melkproductie_collie | 9000 |
| melkprijs | 0.40 |
| krachtvoer_opname_nu_weide | 5 |
| krachtvoer_opname_collie_weide | 5 |
| krachtvoer_prijs | 0.35 |
| bijproducten_prijs | 0.25 |
| arbeid_beweiding_nu_weide | 1 |
| arbeid_stal_nu_weide | 1 |
| arbeid_stal_nu_stal | 2 |
| graskuil_opname_nu_stal | 15 |
| krachtvoer_opname_nu_stal | 5 |
| strooisel_kosten | 5 |
| mestuitrijden_kosten | 3 |
| arbeid_waarde | 35 |
| melkingen_nu_melkstal | 2 |
| melkingen_nu_robot | 2.3 |
| melkingen_collie_melkstal | 2 |
| melkingen_collie_robot | 2.3 |

### Gemiddeld
Zelfde als Conservatief, behalve:
| Veld | Waarde |
|------|--------|
| weidedagen_collie | 200 |
| uren_collie | 2500 |
| arbeid_beweiding_collie_weide | 0.15 |
| melkprijs | 0.45 |
| krachtvoer_opname_collie_weide | 4 |

### Optimistisch
Zelfde als Conservatief, behalve:
| Veld | Waarde |
|------|--------|
| weidedagen_collie | 220 |
| uren_collie | 3000 |
| arbeid_beweiding_collie_weide | 0.10 |
| melkprijs | 0.50 |
| krachtvoer_opname_collie_weide | 3 |

---

## Brand kleuren (CSS variables)

```css
:root {
  --collie-lime: #CDDC7F;
  --collie-lime-light: #E3EAAB;
  --collie-lime-dark: #B8C96B;
  --collie-teal: #87B8A1;
  --collie-teal-light: #E8F4EF;
  --collie-navy: #152435;
  --collie-navy-light: #2A3F58;
  --collie-white: #FFFFFF;
  --collie-bone: #FDF0FD;
  --collie-off-white: #F4F0ED;
  --font-heading: 'Montserrat', sans-serif; /* weight 700 */
  --font-body: 'Poppins', sans-serif; /* weight 500 */
  --bg-dashboard: linear-gradient(170deg, var(--collie-bone) 0%, var(--collie-off-white) 50%, #FEFCFA 100%);
  --bg-card: #FFFFFF;
  --bg-field-hover: #FAFAF8;
  --bg-field-focused: #F8FBEF;
  --border-field: #E5E5E0;
  --border-field-focused: var(--collie-lime);
  /* Chart kleuren */
  --chart-labor: var(--collie-lime);
  --chart-milk: var(--collie-teal);
  --chart-feed: #E3EAAB;
  --chart-silage: #D4A574;
  --chart-litter: #C4956F;
  --chart-manure: #8B7355;
}
```

---

## Tekst configuratie (src/config/)

Alle UI tekst staat in losse bestanden per stap zodat het makkelijk aanpasbaar is zonder in de component code te hoeven duiken.

```
src/config/
  stap1_start.js       — Teaser labels, hints, resultaat teksten
  stap2_contact.js     — Contact formulier labels en instructies
  stap3_beweiding.js   — Beweiding vergelijking labels en tooltips
  stap4_melkproductie.js — Melkproductie labels en tooltips
  stap5_voer.js        — Voer vergelijking labels en tooltips
  stap6_prijzen.js     — Prijzen labels en subtitel
  stap7_resultaat.js   — Resultaat labels, kaart titels, disclaimer
```

Elke config file exporteert een named const, bijv:

```js
// src/config/stap1_start.js
export const stap1 = {
  paginatitel: 'Bereken wat Collie voor jou kan opleveren',
  velden: {
    numCows: { label: 'Hoeveel melkkoeien heb je?', eenheid: 'koeien' },
    hectaresAvailable: { label: 'Hoeveel hectare grasland kun je beweiden?', eenheid: 'hectare' },
    currentGrazingHours: { label: 'Hoeveel uren per jaar weiden je koeien nu?', eenheid: 'uren/jaar' },
    currentGrazingDays: { label: 'Hoeveel dagen per jaar weiden je koeien nu?', eenheid: 'dagen/jaar' },
    hasRobot: { label: 'Melkrobot', optieNee: 'Nee', optieJa: 'Ja' },
  },
  knop: 'Bereken',
  invulHint: 'Vul alle velden in om je geschatte voordeel te berekenen',
  resultaat: {
    titel: 'Geschat rendement',
    conservatief: 'Conservatief',
    optimistisch: 'Optimistisch',
    eenheid: '/jaar',
    knop: 'Start uitgebreide berekening',
    tekstVeelWeide: 'Je weid al veel. Collie kan vooral helpen het makkelijker en efficiënter te maken.',
    tekstMeerPotentieel: 'We zien potentieel om meer te weiden met de {hectares} hectare die je beschikbaar hebt. Collie kan helpen dit te benutten en efficiënter te beheren.',
  },
};
```

---

## Projectstructuur

```
src/
  components/
    calculator/
      CalculatorWizard.jsx     — Hoofdcomponent, state management, navigatie
      StepProgress.jsx         — Voortgangsbalk bovenaan
      FieldRow.jsx             — Herbruikbare invoer rij met label, input, eenheid, tooltip
      CollieLogo.jsx           — Logo component
    steps/
      TeaserStep.jsx           — Stap 1: Start
      ContactStep.jsx          — Stap 2: Contact
      GrazingComparisonStep.jsx — Stap 3: Beweiding
      MilkProductionComparisonStep.jsx — Stap 4: Melkproductie
      FeedComparisonStep.jsx   — Stap 5: Voer
      CostsStep.jsx            — Stap 6: Prijzen
      ResultsStep.jsx          — Stap 7: Resultaat
    admin/
      AdminPanel.jsx           — Admin hoofdpagina
      ScenarioBoard.jsx        — Scenario's beheren
      BerekeningenBoard.jsx    — Berekeningen overzicht
      LeadsBoard.jsx           — Leads overzicht
  hooks/
    useCalculation.js          — calculate(), formatEuro(), formatNum(), getCollarPrice()
  utils/
    buildCalculatorState.js    — Enige plek waar calculator state wordt opgebouwd
    supabase.js                — Supabase client
  config/
    stap1_start.js             — Tekst config stap 1
    stap2_contact.js           — Tekst config stap 2
    stap3_beweiding.js         — Tekst config stap 3
    stap4_melkproductie.js     — Tekst config stap 4
    stap5_voer.js              — Tekst config stap 5
    stap6_prijzen.js           — Tekst config stap 6
    stap7_resultaat.js         — Tekst config stap 7
  theme-tokens.css             — CSS variabelen (kleuren, fonts)
  App.jsx                      — Router: /calculator en /admin
  main.jsx
```

---

## UI patronen die goed werken (overnemen)

- **FieldRow component**: label links, input rechts, eenheid naast input, bij focus verschijnt info tooltip eronder
- **Toggle**: twee knoppen naast elkaar (Nee/Ja), actieve knop heeft lime achtergrond
- **Vergelijkingstabel**: twee kolommen met kleurgecodeerde headers (teal = Nu, lime = Met Collie)
- **Staldagen read-only**: dezelfde UI maar grijs, cursor not-allowed, altijd gelijk aan Nu waarden
- **Resultaat balk**: horizontale gekleurde balk met percentages per categorie
- **Voortgangsbalk**: gekleurde balkjes per stap (grijs = toekomst, teal = voltooid, lime = huidig)
- **Card layout**: witte kaarten met border-radius 20px, box shadow, op gradient achtergrond
- **Navigatie**: Vorige knop links (outline), Volgende/Bereken knop rechts (lime)

---

## Startinstructie voor Claude Code

Bouw dit project op basis van deze briefing. Aanpak:

1. Maak de projectstructuur aan met Vite + React
2. Installeer dependencies: Chakra UI v3, Supabase client, lucide-react
3. Stel Supabase in (tabellen aanmaken, seed data voor de drie scenario's)
4. Bouw `useCalculation.js` en `buildCalculatorState.js` — test deze met de scenario waarden
5. Bouw de UI stap voor stap, begin met `CalculatorWizard.jsx` en de stap componenten
6. Bouw het Admin Panel
7. Stel routing in (/ voor calculator, /admin voor admin panel)
8. Configureer Vercel deployment
