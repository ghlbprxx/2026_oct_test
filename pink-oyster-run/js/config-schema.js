// All tuning knobs. Pure data: imported by the admin panel (config.js) and by node tests.
export const CONFIG_SCHEMA = {
  time: {
    secondsPerDay: { value: 180, min: 30, max: 600, step: 10, note: 'Real seconds per game day at 1× playback. Brief: ~3 minutes.' },
    bioDaysPerGameDay: { value: 2.5, min: 1, max: 5, step: 0.25, note: 'Real-world growing days that pass per game day (compressed biology). UI still shows real durations.' },
  },
  growth: {
    growthScale: { value: 1, min: 0.25, max: 3, step: 0.05, note: 'Multiplies every species duration (colonization, pinning, fruiting, rest). <1 = faster.' },
    yieldScale: { value: 1, min: 0.3, max: 3, step: 0.05, note: 'Multiplies every harvest (1 kg dry substrate × BE)' },
  },
  contam: {
    hazardScale: { value: 1, min: 0, max: 3, step: 0.05, note: 'Multiplies every species contamination chance' },
    sabFactor: { value: 0.3, min: 0.05, max: 1, step: 0.05, note: 'Still-air box multiplier on open-air risk (hobby claims: 85–95% clean vs 50–70% open)' },
    flowHoodFactor: { value: 0.1, min: 0.01, max: 1, step: 0.01, note: 'Flow hood multiplier on open-air risk (claims: 99%+ clean)' },
    openAirInoc: { value: 0.15, min: 0, max: 0.5, step: 0.01, note: 'Chance one inoculation in open air carries spores in (SAB multiplies it)' },
    revealDays: { value: 3, min: 0, max: 10, step: 0.5, note: 'Real days from infection until mold is visible' },
    overrunDays: { value: 6, min: 1, max: 15, step: 0.5, note: 'Real days from visible mold to a fully overrun vessel' },
  },
  economy: {
    priceFresh: { value: 14, min: 6, max: 30, step: 0.5, note: '$/lb fresh at market. Research: oysters ~$8–12/lb, specialty colors higher (low confidence).' },
    priceDried: { value: 8, min: 2, max: 30, step: 0.5, note: '$ per fresh-lb once dried (~10:1 weight loss). Keep below fresh.' },
    shelfLife: { value: 2.5, min: 1, max: 7, step: 0.25, note: 'Real days fresh pinks last (real: 1–3; they dislike the fridge)' },
    marketEvery: { value: 2, min: 1, max: 5, step: 1, note: 'Game days between farmers-market days (markets open with the fruiting stage)' },
    heaterCost: { value: 1, min: 0, max: 10, step: 0.25, note: '$ per game day per heater step (small thermostat heater in a closed room)' },
    boothFee: { value: 25, min: 0, max: 100, step: 1, note: 'Farmers-market booth fee, paid only on market days you bring product' },
  },
  shop: {
    priceScale: { value: 1, min: 0.25, max: 3, step: 0.05, note: 'Multiplies every equipment price (approximate US retail)' },
    demand: { value: 1, min: 0.1, max: 5, step: 0.1, note: 'Online sales per game day per listed product at its base price and 50 reputation' },
    elasticity: { value: 2, min: 0, max: 6, step: 0.25, note: 'How sharply sales fall as you price above base (and rise below it)' },
    stageMult: { value: 1.25, min: 1, max: 2, step: 0.05, note: 'Base price multiplier per later stage (plates → jars → kits)' },
    startReputation: { value: 50, min: 10, max: 100, step: 5, note: 'Starting shop reputation (0–100); also where it slowly recovers to' },
    refundHit: { value: 8, min: 0, max: 30, step: 1, note: 'Reputation lost per refund (contaminated item shipped)' },
    recovery: { value: 0.5, min: 0, max: 5, step: 0.25, note: 'Reputation regained per game day while below the start value' },
  },
  equipment: {
    cookerDays: { value: 1, min: 0.25, max: 3, step: 0.25, note: 'Real days per cooker cycle incl. cooling' },
  },
  room: {
    houseTemp: { value: 68, min: 55, max: 80, step: 1, note: 'Thermostat °F: kitchen +2, closet +4, tent + heat mat' },
    seasonStartTemp: { value: 63, min: 50, max: 85, step: 1, note: 'Outdoor °F (garage, yard) at the start of the season' },
    seasonEndTemp: { value: 55, min: 40, max: 85, step: 1, note: 'Outdoor °F at the end of the season' },
    coldSnapChance: { value: 0.04, min: 0, max: 0.3, step: 0.01, note: 'Chance per game day of a forecast cold snap (hits the garage hard, the house a little)' },
  },
  progression: {
    unitsScale: { value: 1, min: 0.25, max: 3, step: 0.25, note: 'Multiplies the good units each stage needs after its checklist' },
  },
  difficulty: {
    relaxedCash: { value: 2500, min: 100, max: 10000, step: 100, note: 'Starting cash, Relaxed' },
    normalCash: { value: 1500, min: 100, max: 10000, step: 100, note: 'Starting cash, Normal' },
    hardcoreCash: { value: 800, min: 100, max: 10000, step: 100, note: 'Starting cash, Hardcore' },
    graceHazard: { value: 0.4, min: 0, max: 1, step: 0.05, note: 'Contamination multiplier during grace weeks (Relaxed/Normal: weeks 0–1; Hardcore: week 0)' },
    relaxedHazard: { value: 0.6, min: 0.1, max: 1, step: 0.05, note: 'Relaxed: contamination multiplier after grace' },
    salvageQuality: { value: 0.6, min: 0.2, max: 1, step: 0.05, note: 'Relaxed: yield/uses kept after cutting mold out of a jar or bag' },
  },
  look: {
    customImages: { value: true, note: 'Off = always use the built-in placeholder art' },
    tips: { value: true, note: 'Show the "Next:" coaching line' },
    sfxVolume: { value: 0.6, min: 0, max: 1, step: 0.05, note: 'Sound effects volume' },
  },
  dev: {
    timeScale: { value: 1, min: 0.1, max: 3, step: 0.1, note: 'Slow-mo to inspect feel (multiplies playback speed)' },
    paused: { value: false },
    god: { value: false, note: 'No damage: no mold, no rot' },
    debug: { value: false, note: 'Shows hidden mold, hazards and timers on each shelf' },
    juice: { value: true, note: 'Off = grey-box test (no sounds, floaters, pulses)' },
    startLevel: { value: 0, min: 0, max: 8, step: 1, restart: true, note: 'Game week to start in (time only; use the Master current stage action to skip stages)' },
  },
};

// Plain default values, for tests and for code that runs without the panel.
export const defaultConfig = () => Object.fromEntries(Object.entries(CONFIG_SCHEMA).map(([g, f]) =>
  [g, Object.fromEntries(Object.entries(f).map(([k, d]) => [k, d.value]))]));
