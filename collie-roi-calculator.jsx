import { useState, useEffect, useRef } from "react";

const STEPS = [
  { id: "farm", title: "Jouw Bedrijf", icon: "🏡" },
  { id: "grazing", title: "Beweiding", icon: "🌿" },
  { id: "feed", title: "Voerrantsoen", icon: "🌾" },
  { id: "costs", title: "Kosten & Prijzen", icon: "💰" },
  { id: "collie", title: "Met Collie", icon: "🐕" },
  { id: "results", title: "Resultaat", icon: "📊" },
];

const DEFAULT_MARKET = {
  collarPrice: 90,
  milkPrice: 0.48,
  concentratePrice: 0.35,
  byproductPrice: 0.25,
  litterCost: 5,
  manureSpreadCost: 3,
  labourCost: 35,
  grassCostField: 0.08,
  silageCost: 0.18,
  urineProduction: 17,
  manureProduction: 71.23,
  grassConversion: 1.64,
  extraGrassGrowth: 0.15,
  extraMilkFactor: 0.15,
  nedapCost: 15,
};

const DEFAULT_FARM = {
  numCows: 100,
  milkProduction: 9000,
  hectaresGrass: 55,
  hectaresNature: 0,
  hectaresTotal: 55,
  hectaresMaize: 0,
  hasRobot: false,
};

const DEFAULT_GRAZING = {
  fullDaysOut: 60,
  halfDaysOut: 140,
  grazingLabourHours: 1.5,
  stallLabourHours: 1.5,
  milkingsPerDay: 2.3,
  totalGrazingHours: 1800,
};

const DEFAULT_FEED = {
  grassIntake: 10,
  concentrateIntake: 5,
  byproductIntake: 0,
  grassSilageIntake: 7,
  maizeSilageIntake: 0,
};

const DEFAULT_COLLIE = {
  newGrazingLabour: 0.1,
  newStallLabour: 0.5,
  newMilkings: 2.3,
  newGrassIntake: 13,
  newConcentrateIntake: 4,
  newByproductIntake: 0,
  newGrassSilageIntake: 5,
  newMaizeSilageIntake: 0,
  newFullDaysOut: 100,
  newHalfDaysOut: 100,
  newTotalGrazingHours: 2500,
  newMilkProduction: 9000,
};

function formatEuro(val) {
  if (val === null || val === undefined || isNaN(val)) return "€ 0";
  const abs = Math.abs(Math.round(val));
  const formatted = abs.toLocaleString("nl-NL");
  return val < 0 ? `-€ ${formatted}` : `€ ${formatted}`;
}

function formatNum(val, dec = 0) {
  if (val === null || val === undefined || isNaN(val)) return "0";
  return Number(val).toLocaleString("nl-NL", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function Tooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-block", marginLeft: 6, cursor: "pointer" }}>
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 18, height: 18, borderRadius: "50%", background: "#e0e7ef",
          color: "#3a6b35", fontSize: 11, fontWeight: 700,
        }}
      >?</span>
      {show && (
        <div style={{
          position: "absolute", bottom: "130%", left: "50%", transform: "translateX(-50%)",
          background: "#1a2e1a", color: "#e8f0e0", padding: "10px 14px", borderRadius: 8,
          fontSize: 13, lineHeight: 1.5, width: 260, zIndex: 100, boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          pointerEvents: "none",
        }}>
          {text}
          <div style={{
            position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
            border: "6px solid transparent", borderTopColor: "#1a2e1a",
          }} />
        </div>
      )}
    </span>
  );
}

function InputField({ label, value, onChange, unit, tooltip, min, max, step = 1, type = "number", highlight }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 4, padding: "10px 0",
      borderBottom: "1px solid #e8f0e0",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <label style={{ fontSize: 14, color: "#2d4a2d", fontWeight: 500 }}>{label}</label>
        {tooltip && <Tooltip text={tooltip} />}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {type === "toggle" ? (
          <button
            onClick={() => onChange(!value)}
            style={{
              padding: "6px 20px", borderRadius: 6, border: "2px solid #3a6b35",
              background: value ? "#3a6b35" : "white", color: value ? "white" : "#3a6b35",
              fontWeight: 600, cursor: "pointer", fontSize: 14, transition: "all 0.2s",
            }}
          >{value ? "Ja" : "Nee"}</button>
        ) : (
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            min={min}
            max={max}
            step={step}
            style={{
              padding: "8px 12px", borderRadius: 6, border: highlight ? "2px solid #f59e0b" : "1.5px solid #c2d4b8",
              fontSize: 15, width: 120, fontWeight: 500, color: "#1a2e1a",
              background: highlight ? "#fffbeb" : "white", outline: "none",
              transition: "border 0.2s",
            }}
          />
        )}
        {unit && <span style={{ fontSize: 13, color: "#6b8a6b" }}>{unit}</span>}
      </div>
    </div>
  );
}

function ResultCard({ label, value, unit, color, big, tooltip }) {
  return (
    <div style={{
      background: color || "#f0f7ec", borderRadius: 12, padding: big ? "20px 24px" : "14px 18px",
      display: "flex", flexDirection: "column", gap: 4,
      border: big ? "2px solid #3a6b35" : "1px solid #d4e4cc",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontSize: big ? 13 : 12, color: "#5a7a5a", fontWeight: 500 }}>{label}</span>
        {tooltip && <Tooltip text={tooltip} />}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontSize: big ? 28 : 20, fontWeight: 700, color: "#1a2e1a" }}>{value}</span>
        {unit && <span style={{ fontSize: 12, color: "#6b8a6b" }}>{unit}</span>}
      </div>
    </div>
  );
}

function BreakdownBar({ items, total }) {
  const positiveItems = items.filter(i => i.value > 0);
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 32 }}>
        {positiveItems.map((item, i) => {
          const pct = total > 0 ? (item.value / total) * 100 : 0;
          if (pct < 1) return null;
          return (
            <div key={i} style={{
              width: `${pct}%`, background: item.color, display: "flex",
              alignItems: "center", justifyContent: "center", position: "relative",
              transition: "width 0.5s ease",
            }}>
              {pct > 8 && <span style={{ fontSize: 10, color: "white", fontWeight: 600 }}>{Math.round(pct)}%</span>}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 10 }}>
        {positiveItems.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color }} />
            <span style={{ fontSize: 12, color: "#4a6a4a" }}>{item.label}: {formatEuro(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CollieROICalculator() {
  const [step, setStep] = useState(0);
  const [farm, setFarm] = useState(DEFAULT_FARM);
  const [grazing, setGrazing] = useState(DEFAULT_GRAZING);
  const [feed, setFeed] = useState(DEFAULT_FEED);
  const [market, setMarket] = useState(DEFAULT_MARKET);
  const [collie, setCollie] = useState(DEFAULT_COLLIE);
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [step]);

  // Auto-sync collie defaults when farm data changes
  useEffect(() => {
    setCollie(prev => ({ ...prev, newMilkProduction: farm.milkProduction }));
  }, [farm.milkProduction]);

  // Calculations (matching the Excel logic from "Rekenmodel uitgebreid")
  const calc = (() => {
    const grazingDaysWithCollie = collie.newFullDaysOut + collie.newHalfDaysOut / 2;
    const grazingDaysCurrent = grazing.fullDaysOut + grazing.halfDaysOut / 2;

    // Labour saving
    const labourSavingHoursPerDay = (grazing.grazingLabourHours + grazing.stallLabourHours / 7)
      - (collie.newGrazingLabour + collie.newStallLabour / 7);
    const labourSavingHours = labourSavingHoursPerDay * (grazing.fullDaysOut + grazing.halfDaysOut);
    const labourSaving = labourSavingHours * market.labourCost;

    // Milk production
    const milkingChange = collie.newMilkings - grazing.milkingsPerDay;
    const extraMilkPerCowDay = farm.milkProduction * market.extraMilkFactor * milkingChange / 365;
    const extraMilkLitres = extraMilkPerCowDay * farm.numCows * grazingDaysWithCollie
      + (collie.newMilkProduction - farm.milkProduction) * farm.numCows;
    const milkSaving = extraMilkLitres * market.milkPrice;

    // Concentrate savings
    const concentrateSaved = (feed.concentrateIntake - collie.newConcentrateIntake) * grazingDaysWithCollie * farm.numCows;
    const concentrateSaving = market.concentratePrice * concentrateSaved;

    // Byproduct savings
    const byproductSaved = (feed.byproductIntake - collie.newByproductIntake) * grazingDaysWithCollie * farm.numCows;
    const byproductSaving = market.byproductPrice * byproductSaved;

    // Silage savings
    const silageSaved = (feed.grassSilageIntake - collie.newGrassSilageIntake) * farm.numCows * grazingDaysWithCollie;
    const silageSaving = silageSaved * (market.silageCost - market.grassCostField);

    // Litter savings
    const litterSaving = market.litterCost * grazingDaysWithCollie;

    // Manure savings
    const totalExcretionPerCowPerDay = (market.urineProduction + market.manureProduction);
    const hoursInYear = 8760;
    const manureInsideCurrent = ((totalExcretionPerCowPerDay / 24) * (hoursInYear - grazing.totalGrazingHours) * farm.numCows) / 1000;
    const manureInsideCollie = ((totalExcretionPerCowPerDay / 24) * (hoursInYear - collie.newTotalGrazingHours) * farm.numCows) / 1000;
    const manureSaved = manureInsideCurrent - manureInsideCollie;
    const manureSaving = manureSaved * market.manureSpreadCost;

    const grossBenefit = labourSaving + milkSaving + concentrateSaving + byproductSaving + silageSaving + litterSaving + manureSaving;
    const collarCost = market.collarPrice * farm.numCows;
    const netBenefit = grossBenefit - collarCost;
    const netPerCow = farm.numCows > 0 ? netBenefit / farm.numCows : 0;
    const grossPerCow = farm.numCows > 0 ? grossBenefit / farm.numCows : 0;

    return {
      labourSavingHours, labourSaving,
      extraMilkLitres, milkSaving,
      concentrateSaved, concentrateSaving,
      byproductSaved, byproductSaving,
      silageSaved, silageSaving,
      litterSaving,
      manureSaved, manureSaving,
      grossBenefit, collarCost, netBenefit, netPerCow, grossPerCow,
      grazingDaysWithCollie, grazingDaysCurrent,
    };
  })();

  const totalFeedCurrent = feed.grassIntake + feed.concentrateIntake + feed.byproductIntake + feed.grassSilageIntake + feed.maizeSilageIntake;
  const totalFeedCollie = collie.newGrassIntake + collie.newConcentrateIntake + collie.newByproductIntake + collie.newGrassSilageIntake + collie.newMaizeSilageIntake;

  const renderStep = () => {
    switch (step) {
      case 0: // Farm info
        return (
          <div>
            <h2 style={{ fontSize: 20, color: "#1a2e1a", marginBottom: 4 }}>🏡 Vertel ons over jouw bedrijf</h2>
            <p style={{ fontSize: 13, color: "#6b8a6b", marginBottom: 16 }}>
              We beginnen met de basis. Dit helpt ons jouw situatie goed in te schatten.
            </p>
            <InputField label="Aantal melkkoeien" value={farm.numCows} onChange={v => setFarm(p => ({ ...p, numCows: v }))} unit="koeien" min={1}
              tooltip="Tel alleen je melkgevende koeien mee, niet het jongvee. Het gemiddelde Nederlandse melkveebedrijf heeft ~100 koeien." />
            <InputField label="Melkproductie per koe" value={farm.milkProduction} onChange={v => setFarm(p => ({ ...p, milkProduction: v }))} unit="kg/koe/jaar" step={100}
              tooltip="Jouw rollend jaargemiddelde. Het NL gemiddelde ligt rond 9.000 kg/koe/jaar. Check je MPR voor het exacte getal." />
            <InputField label="Melkrobot" value={farm.hasRobot} onChange={v => setFarm(p => ({ ...p, hasRobot: v }))} type="toggle"
              tooltip="Met een melkrobot kan Collie extra melkgiften stimuleren doordat koeien vaker naar de robot gaan wanneer ze buitenlopen." />
            <InputField label="Hectares grasland beweiding" value={farm.hectaresGrass} onChange={v => setFarm(p => ({ ...p, hectaresGrass: v, hectaresTotal: v + farm.hectaresNature }))} unit="ha"
              tooltip="Alleen het grasland dat je nu (of straks) voor beweiding gebruikt. Het NL gemiddelde is ~55 ha." />
            <InputField label="Hectares natuurland beweiding" value={farm.hectaresNature} onChange={v => setFarm(p => ({ ...p, hectaresNature: v, hectaresTotal: farm.hectaresGrass + v }))} unit="ha"
              tooltip="Heb je natuurgrond waar je koeien op laat lopen? Collie maakt dit veel makkelijker te managen." />
            <InputField label="Hectares maisland" value={farm.hectaresMaize} onChange={v => setFarm(p => ({ ...p, hectaresMaize: v }))} unit="ha" />

            <div style={{ background: "#f8faf5", borderRadius: 10, padding: 14, marginTop: 16, border: "1px solid #e0edd8" }}>
              <div style={{ fontSize: 12, color: "#6b8a6b", fontWeight: 600, marginBottom: 6 }}>💡 WIST JE DAT</div>
              <div style={{ fontSize: 13, color: "#3a5a3a", lineHeight: 1.6 }}>
                De grootste besparingen voor melkveehouders komen vaak niet van waar ze verwachten.
                Minder mest uitrijden, minder kuilvoer, en arbeidsbesparing samen vaak meer waard dan de extra melkopbrengst.
              </div>
            </div>
          </div>
        );

      case 1: // Grazing
        return (
          <div>
            <h2 style={{ fontSize: 20, color: "#1a2e1a", marginBottom: 4 }}>🌿 Huidige beweiding</h2>
            <p style={{ fontSize: 13, color: "#6b8a6b", marginBottom: 16 }}>
              Hoe weidt jouw vee nu? Denk goed na over de daadwerkelijke uren — vaak overschatten boeren de hoeveelheid.
            </p>
            <InputField label="Dag-en-nacht weiden" value={grazing.fullDaysOut} onChange={v => setGrazing(p => ({ ...p, fullDaysOut: v }))} unit="dagen/seizoen"
              tooltip="Hoeveel dagen staan je koeien 24 uur per dag buiten? Het NL gemiddelde is ~60 dagen voor bedrijven die dit doen." />
            <InputField label="Halve dagen weiden" value={grazing.halfDaysOut} onChange={v => setGrazing(p => ({ ...p, halfDaysOut: v }))} unit="dagen/seizoen"
              tooltip="Overdag buiten, 's nachts binnen. Dit is het meest voorkomende systeem in NL (~85% van de weideweken)." />
            <InputField label="Totaal weide-uren per jaar" value={grazing.totalGrazingHours} onChange={v => setGrazing(p => ({ ...p, totalGrazingHours: v }))} unit="uren"
              tooltip="Totale uren beweiding. NL gemiddelde rond 1.500-1.800 uur. Bij dag-en-nacht grazen: ~24×dagen. Bij halve dagen: ~7-10×dagen." highlight />
            <InputField label="Beweiding arbeid" value={grazing.grazingLabourHours} onChange={v => setGrazing(p => ({ ...p, grazingLabourHours: v }))} unit="uur/dag" step={0.25}
              tooltip="Hoeveel tijd besteed je dagelijks aan beweidingsmanagement? Denk ook aan: draden verleggen, koeien ophalen, gras beoordelen, hekken open/dicht. Vaak meer dan je denkt!" />
            <InputField label="Stal arbeid voor beweiding" value={grazing.stallLabourHours} onChange={v => setGrazing(p => ({ ...p, stallLabourHours: v }))} unit="uur/dag" step={0.25}
              tooltip="Extra stalwerk door beweiding, bijv. koeien binnenhalen voor melken, wachtruimte leegmaken, etc." />
            <InputField label="Melkingen per koe per dag" value={grazing.milkingsPerDay} onChange={v => setGrazing(p => ({ ...p, milkingsPerDay: v }))} unit="melkingen" step={0.1}
              tooltip="Bij AMS (robot): gemiddeld 2.3-3.0. Bij conventioneel: meestal 2.0. Met beter beweidingsmanagement kan dit stijgen." />

            <div style={{ background: "#fff8ec", borderRadius: 10, padding: 14, marginTop: 16, border: "1px solid #f0ddb8" }}>
              <div style={{ fontSize: 12, color: "#8a7040", fontWeight: 600, marginBottom: 6 }}>⏱️ VERGETEN TIJDKOSTEN</div>
              <div style={{ fontSize: 13, color: "#5a4a2a", lineHeight: 1.6 }}>
                Vergeet niet: draad verplaatsen voor maaien, percelen controleren, koeien ophalen die niet willen komen,
                planning van percelen, en stroomdraden onderhouden. Met Collie heb je dit allemaal niet meer.
              </div>
            </div>
          </div>
        );

      case 2: // Feed
        return (
          <div>
            <h2 style={{ fontSize: 20, color: "#1a2e1a", marginBottom: 4 }}>🌾 Huidig voerrantsoen (zomer)</h2>
            <p style={{ fontSize: 13, color: "#6b8a6b", marginBottom: 16 }}>
              Wat eet jouw koe per dag tijdens het weideseizoen? Dit is cruciaal voor de berekening.
            </p>
            <InputField label="Weidegras opname" value={feed.grassIntake} onChange={v => setFeed(p => ({ ...p, grassIntake: v }))} unit="kg DS/koe/dag" step={0.5}
              tooltip="Hoeveel vers gras nemen je koeien op in de wei? Bij beperkt weiden vaak 3-6 kg DS, bij dag-en-nacht 10-16 kg DS. Weet je dit niet? Kijk naar je rantsoenberekening." />
            <InputField label="Krachtvoer opname" value={feed.concentrateIntake} onChange={v => setFeed(p => ({ ...p, concentrateIntake: v }))} unit="kg DS/koe/dag" step={0.5}
              tooltip="NL gemiddelde: ~5 kg/dag. Inclusief brok, meel en korrels. Check je voerleverancier voor exacte cijfers." />
            <InputField label="Bijproducten opname" value={feed.byproductIntake} onChange={v => setFeed(p => ({ ...p, byproductIntake: v }))} unit="kg DS/koe/dag" step={0.5}
              tooltip="Bijv. bierbostel, citruspulp, sojaschroot, etc. Dit zijn krachtvoervervangers die vaak goedkoper zijn." />
            <InputField label="Graskuil opname" value={feed.grassSilageIntake} onChange={v => setFeed(p => ({ ...p, grassSilageIntake: v }))} unit="kg DS/koe/dag" step={0.5}
              tooltip="Hoeveel graskuil voer je in de zomer bij? Bij volledig weiden kan dit 0 zijn, bij beperkt weiden vaak 5-8 kg DS." />
            <InputField label="Maiskuil opname" value={feed.maizeSilageIntake} onChange={v => setFeed(p => ({ ...p, maizeSilageIntake: v }))} unit="kg DS/koe/dag" step={0.5}
              tooltip="Mais in de zomer bijvoeren? Vaak 0-4 kg DS afhankelijk van rantsoenopbouw." />

            <div style={{
              background: "#f0f7ec", borderRadius: 10, padding: 14, marginTop: 16, border: "1px solid #d4e4cc",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontSize: 14, color: "#2d4a2d", fontWeight: 600 }}>Totale opname zomer</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#1a2e1a" }}>{formatNum(totalFeedCurrent, 1)} kg DS/dag</span>
            </div>
          </div>
        );

      case 3: // Costs
        return (
          <div>
            <h2 style={{ fontSize: 20, color: "#1a2e1a", marginBottom: 4 }}>💰 Marktprijzen & kosten</h2>
            <p style={{ fontSize: 13, color: "#6b8a6b", marginBottom: 16 }}>
              We hebben standaard NL-gemiddelden ingevuld. Pas aan naar jouw werkelijke prijzen voor een nauwkeuriger resultaat.
            </p>
            <InputField label="Melkprijs" value={market.milkPrice} onChange={v => setMarket(p => ({ ...p, milkPrice: v }))} unit="€/kg" step={0.01}
              tooltip="Jouw uitbetaalprijs per kg melk. Kijk op je melkafrekening. NL gemiddelde schommelt rond €0.45-0.55." highlight />
            <InputField label="Krachtvoer prijs" value={market.concentratePrice} onChange={v => setMarket(p => ({ ...p, concentratePrice: v }))} unit="€/kg DS" step={0.01}
              tooltip="Prijs per kg droge stof krachtvoer. NL gemiddelde ~€0.34/kg DS." />
            <InputField label="Bijproducten prijs" value={market.byproductPrice} onChange={v => setMarket(p => ({ ...p, byproductPrice: v }))} unit="€/kg DS" step={0.01}
              tooltip="Gemiddelde prijs van je bijproducten (bierbostel, pulp, etc.)." />
            <InputField label="Strooisel kosten" value={market.litterCost} onChange={v => setMarket(p => ({ ...p, litterCost: v }))} unit="€/dag"
              tooltip="Als koeien meer buiten staan, bespaar je op strooisel/ligboxbedekking. Denk aan zaagsel, stro, etc." />
            <InputField label="Loonwerk kosten mestuitrijden" value={market.manureSpreadCost} onChange={v => setMarket(p => ({ ...p, manureSpreadCost: v }))} unit="€/m³" step={0.5}
              tooltip="Wat betaal je de loonwerker per kuub mest uitrijden? Gemiddeld €3/m³, maar kan oplopen tot €5/m³." />
            <InputField label="Arbeid waarde" value={market.labourCost} onChange={v => setMarket(p => ({ ...p, labourCost: v }))} unit="€/uur"
              tooltip="Wat is een uur van jouw tijd waard? Denk hier goed over na — als je een werknemer moest inhuren, wat zou dat kosten?" highlight />
            <InputField label="Collie halsband prijs" value={market.collarPrice} onChange={v => setMarket(p => ({ ...p, collarPrice: v }))} unit="€/koe/jaar"
              tooltip="De standaard Collie halsband prijs. Bij grotere kuddes kan een staffelkorting gelden." />
          </div>
        );

      case 4: // Collie expectations
        return (
          <div>
            <h2 style={{ fontSize: 20, color: "#1a2e1a", marginBottom: 4 }}>🐕 Verwachte situatie met Collie</h2>
            <p style={{ fontSize: 13, color: "#6b8a6b", marginBottom: 16 }}>
              Hoe ziet jouw bedrijf eruit na implementatie van Collie? We vullen realistische verwachtingen in,
              maar pas aan naar jouw specifieke situatie.
            </p>

            <div style={{ fontSize: 13, fontWeight: 600, color: "#3a6b35", margin: "12px 0 4px", borderTop: "2px solid #d4e4cc", paddingTop: 12 }}>BEWEIDING</div>
            <InputField label="Dag-en-nacht weiden" value={collie.newFullDaysOut} onChange={v => setCollie(p => ({ ...p, newFullDaysOut: v }))} unit="dagen"
              tooltip="Met Collie's virtuele hekken heb je geen fysieke draden meer nodig, waardoor dag-en-nacht weiden makkelijker wordt." />
            <InputField label="Halve dagen weiden" value={collie.newHalfDaysOut} onChange={v => setCollie(p => ({ ...p, newHalfDaysOut: v }))} unit="dagen" />
            <InputField label="Totaal weide-uren" value={collie.newTotalGrazingHours} onChange={v => setCollie(p => ({ ...p, newTotalGrazingHours: v }))} unit="uren" highlight />

            <div style={{ fontSize: 13, fontWeight: 600, color: "#3a6b35", margin: "12px 0 4px", borderTop: "2px solid #d4e4cc", paddingTop: 12 }}>ARBEID</div>
            <InputField label="Beweiding arbeid" value={collie.newGrazingLabour} onChange={v => setCollie(p => ({ ...p, newGrazingLabour: v }))} unit="uur/dag" step={0.1}
              tooltip="Met Collie beweeg je je koeien vanuit de app. Geen draden meer verleggen, geen koeien ophalen. Gemiddeld 5-10 minuten per dag." />
            <InputField label="Stal arbeid" value={collie.newStallLabour} onChange={v => setCollie(p => ({ ...p, newStallLabour: v }))} unit="uur/dag" step={0.25} />

            <div style={{ fontSize: 13, fontWeight: 600, color: "#3a6b35", margin: "12px 0 4px", borderTop: "2px solid #d4e4cc", paddingTop: 12 }}>VOER (ZOMER)</div>
            <InputField label="Weidegras opname" value={collie.newGrassIntake} onChange={v => setCollie(p => ({ ...p, newGrassIntake: v }))} unit="kg DS/dag" step={0.5}
              tooltip="Door meer en beter weiden neemt de grasopname flink toe. Stripgrazen met Collie optimaliseert grasbenutting." />
            <InputField label="Krachtvoer opname" value={collie.newConcentrateIntake} onChange={v => setCollie(p => ({ ...p, newConcentrateIntake: v }))} unit="kg DS/dag" step={0.5}
              tooltip="Meer vers gras = minder krachtvoer nodig. Elke kg DS vers gras vervangt ~1 kg DS krachtvoer." />
            <InputField label="Bijproducten opname" value={collie.newByproductIntake} onChange={v => setCollie(p => ({ ...p, newByproductIntake: v }))} unit="kg DS/dag" step={0.5} />
            <InputField label="Graskuil opname" value={collie.newGrassSilageIntake} onChange={v => setCollie(p => ({ ...p, newGrassSilageIntake: v }))} unit="kg DS/dag" step={0.5}
              tooltip="Minder bijvoeren in de zomer! Door langere en betere beweiding heb je minder kuil nodig." />
            <InputField label="Maiskuil opname" value={collie.newMaizeSilageIntake} onChange={v => setCollie(p => ({ ...p, newMaizeSilageIntake: v }))} unit="kg DS/dag" step={0.5} />

            <div style={{
              background: "#f0f7ec", borderRadius: 10, padding: 14, marginTop: 16, border: "1px solid #d4e4cc",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontSize: 14, color: "#2d4a2d", fontWeight: 600 }}>Nieuwe totale opname</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#1a2e1a" }}>{formatNum(totalFeedCollie, 1)} kg DS/dag</span>
            </div>
          </div>
        );

      case 5: // Results
        return (
          <div>
            <h2 style={{ fontSize: 20, color: "#1a2e1a", marginBottom: 4 }}>📊 Jouw Collie ROI</h2>
            <p style={{ fontSize: 13, color: "#6b8a6b", marginBottom: 20 }}>
              Op basis van jouw gegevens verwachten we de volgende besparingen en opbrengsten per jaar.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <ResultCard label="Netto rendement" value={formatEuro(calc.netBenefit)} unit="/jaar" big
                color={calc.netBenefit >= 0 ? "#e8f5e0" : "#fde8e8"}
                tooltip="Totale baten minus kosten Collie systeem." />
              <ResultCard label="Per koe" value={formatEuro(calc.netPerCow)} unit="/koe/jaar" big
                color={calc.netPerCow >= 0 ? "#e8f5e0" : "#fde8e8"} />
            </div>

            <div style={{ marginTop: 20, background: "#f8faf5", borderRadius: 12, padding: 16, border: "1px solid #e0edd8" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1a2e1a", marginBottom: 12 }}>Opbouw besparingen</div>

              <BreakdownBar
                total={calc.grossBenefit}
                items={[
                  { label: "Arbeid", value: calc.labourSaving, color: "#3a6b35" },
                  { label: "Melk", value: calc.milkSaving, color: "#5a9a55" },
                  { label: "Krachtvoer", value: calc.concentrateSaving, color: "#7abb75" },
                  { label: "Bijproducten", value: calc.byproductSaving, color: "#9ad495" },
                  { label: "Kuil", value: calc.silageSaving, color: "#f59e0b" },
                  { label: "Strooisel", value: calc.litterSaving, color: "#d97706" },
                  { label: "Mest", value: calc.manureSaving, color: "#8b6914" },
                ]}
              />
            </div>

            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <ResultCard label="Arbeidsbesparing" value={formatEuro(calc.labourSaving)}
                tooltip={`${formatNum(calc.labourSavingHours, 0)} uur bespaard × €${market.labourCost}/uur`} />
              <ResultCard label="Extra melkopbrengst" value={formatEuro(calc.milkSaving)}
                tooltip={`${formatNum(calc.extraMilkLitres, 0)} liter extra × €${market.milkPrice}/kg`} />
              <ResultCard label="Krachtvoer besparing" value={formatEuro(calc.concentrateSaving)}
                tooltip={`${formatNum(calc.concentrateSaved, 0)} kg DS bespaard × €${market.concentratePrice}/kg`} />
              <ResultCard label="Kuilvoer besparing" value={formatEuro(calc.silageSaving)}
                tooltip={`Minder graskuil nodig door meer vers gras opname`} />
              <ResultCard label="Mestbesparing" value={formatEuro(calc.manureSaving)}
                tooltip={`${formatNum(calc.manureSaved, 0)} m³ minder mest uitrijden`} />
              <ResultCard label="Strooisel besparing" value={formatEuro(calc.litterSaving)}
                tooltip="Meer buiten = minder stalgebruik = minder strooisel" />
            </div>

            <div style={{
              marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
            }}>
              <ResultCard label="Bruto baten" value={formatEuro(calc.grossBenefit)} unit="/jaar" />
              <ResultCard label="Collie kosten" value={formatEuro(-calc.collarCost)} unit="/jaar"
                color="#fff5f5" tooltip={`${farm.numCows} koeien × €${market.collarPrice}/jaar`} />
            </div>

            <div style={{ background: "#fff8ec", borderRadius: 10, padding: 14, marginTop: 20, border: "1px solid #f0ddb8" }}>
              <div style={{ fontSize: 12, color: "#8a7040", fontWeight: 600, marginBottom: 6 }}>💡 NIET MEEGETELD</div>
              <div style={{ fontSize: 13, color: "#5a4a2a", lineHeight: 1.6 }}>
                Deze berekening telt nog <strong>niet</strong> mee: besparing op fysiek hekwerk & onderhoud,
                besparing op Nedap/sensorkosten ({formatEuro(market.nedapCost * farm.numCows)}/jaar),
                waarde van gezondheidsdata, flexibiliteit in perceelbeheer, en het gemak van beweiding op afstand.
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "linear-gradient(170deg, #f0f7ec 0%, #e0edd8 50%, #d4e4cc 100%)",
      display: "flex", justifyContent: "center", padding: "24px 16px",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    }}>
      <div style={{ maxWidth: 600, width: "100%" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#1a2e1a", letterSpacing: -1 }}>
            🐕 Collie ROI Calculator
          </div>
          <div style={{ fontSize: 14, color: "#5a7a5a", marginTop: 4 }}>
            Bereken wat virtueel weiden jou oplevert
          </div>
        </div>

        {/* Progress */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
          {STEPS.map((s, i) => (
            <button key={i} onClick={() => setStep(i)} style={{
              flex: 1, padding: "8px 4px", borderRadius: 8, border: "none", cursor: "pointer",
              background: i === step ? "#3a6b35" : i < step ? "#7abb75" : "#d4e4cc",
              color: i <= step ? "white" : "#6b8a6b",
              fontSize: 11, fontWeight: 600, transition: "all 0.3s",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            }}>
              <span style={{ fontSize: 16 }}>{s.icon}</span>
              <span>{s.title}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div ref={contentRef} style={{
          background: "white", borderRadius: 16, padding: "24px 28px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          minHeight: 400,
        }}>
          {renderStep()}
        </div>

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            style={{
              padding: "12px 24px", borderRadius: 10, border: "2px solid #3a6b35",
              background: "white", color: "#3a6b35", fontWeight: 600, fontSize: 14,
              cursor: step === 0 ? "not-allowed" : "pointer", opacity: step === 0 ? 0.4 : 1,
            }}
          >← Vorige</button>

          {/* Live mini result */}
          {step < 5 && (
            <div style={{ textAlign: "center", padding: "4px 0" }}>
              <div style={{ fontSize: 10, color: "#6b8a6b" }}>Geschat netto rendement</div>
              <div style={{
                fontSize: 18, fontWeight: 700,
                color: calc.netBenefit >= 0 ? "#3a6b35" : "#dc2626",
              }}>
                {formatEuro(calc.netBenefit)}/jaar
              </div>
            </div>
          )}

          <button
            onClick={() => setStep(Math.min(5, step + 1))}
            disabled={step === 5}
            style={{
              padding: "12px 24px", borderRadius: 10, border: "none",
              background: step === 5 ? "#d4e4cc" : "#3a6b35", color: "white",
              fontWeight: 600, fontSize: 14,
              cursor: step === 5 ? "not-allowed" : "pointer", opacity: step === 5 ? 0.5 : 1,
            }}
          >{step === 4 ? "Bekijk resultaat →" : "Volgende →"}</button>
        </div>
      </div>
    </div>
  );
}
