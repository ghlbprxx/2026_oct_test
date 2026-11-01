// All tuning knobs. Pure data: imported by the admin panel (config.js) and by node tests.
export const CONFIG_SCHEMA = {
  time: {
    secondsPerDay: { value: 180, min: 30, max: 600, step: 10, note: 'Real seconds per game day at 1× playback. Brief: ~3 minutes.' },
    bioDaysPerGameDay: { value: 2.5, min: 1, max: 5, step: 0.25, note: 'Real-world growing days that pass per game day (compressed biology). UI still shows real durations.' },
    seasonWeeks: { value: 12, min: 2, max: 20, step: 1, restart: true, note: 'Weeks (5 game days each) until the closing market' },
  },
  growth: {
    growthScale: { value: 1, min: 0.25, max: 3, step: 0.05, note: 'Multiplies every species duration (colonization, pinning, fruiting, rest). <1 = faster.' },
    yieldScale: { value: 1, min: 0.3, max: 3, step: 0.05, note: 'Multiplies every harvest (1 kg dry substrate × BE)' },
  },
  contam: {
    hazardScale: { value: 1, min: 0, max: 3, step: 0.05, note: 'Multiplies every species contamination chance' },
    sabFactor: { value: 0.3, min: 0.05, max: 1, step: 0.05, note: 'Still-air box multiplier on open-air risk (hobby claims: 85–95% clean vs 50–70% open)' },
    openAirInoc: { value: 0.15, min: 0, max: 0.5, step: 0.01, note: 'Chance one inoculation in open air carries spores in (SAB multiplies it)' },
    revealDays: { value: 3, min: 0, max: 10, step: 0.5, note: 'Real days from infection until mold is visible' },
    overrunDays: { value: 6, min: 1, max: 15, step: 0.5, note: 'Real days from visible mold to a fully overrun vessel' },
  },
  economy: {
    priceFresh: { value: 14, min: 6, max: 30, step: 0.5, note: '$/lb fresh at market. Research: oysters ~$8–12/lb, specialty colors higher (low confidence).' },
    priceDried: { value: 8, min: 2, max: 30, step: 0.5, note: '$ per fresh-lb once dried (~10:1 weight loss). Keep below fresh.' },
    shelfLife: { value: 2.5, min: 1, max: 7, step: 0.25, note: 'Real days fresh pinks last (real: 1–3; they dislike the fridge)' },
    marketEvery: { value: 2, min: 1, max: 5, step: 1, note: 'Game days between market days' },
    heaterCost: { value: 1, min: 0, max: 10, step: 0.25, note: '$ per game day per heater step (small thermostat heater in a closed room)' },
    targetProfit: { value: 300, min: 50, max: 3000, step: 25, note: 'Season profit that earns the top rank' },
  },
  equipment: {
    slots: { value: 9, min: 4, max: 15, step: 1, restart: true, note: 'Shelves in the grow room' },
    cookerCapacity: { value: 7, min: 1, max: 14, step: 1, note: 'Quart jars per cooker load (Presto 16 and 23 qt: 7)' },
    cookerDays: { value: 1, min: 0.25, max: 3, step: 0.25, note: 'Real days per cooker cycle incl. cooling' },
  },
  room: {
    seasonStartTemp: { value: 63, min: 50, max: 85, step: 1, note: 'Unheated room °F at the start of the season' },
    seasonEndTemp: { value: 55, min: 40, max: 85, step: 1, note: 'Unheated room °F at the end of the season' },
    coldSnapChance: { value: 0.04, min: 0, max: 0.3, step: 0.01, note: 'Chance per game day of a forecast cold snap, once the room unlocks' },
  },
  progression: {
    unlockPace: { value: 1, min: 1, max: 3, step: 1, restart: true, note: 'Weeks between new systems (plates → jars → bags → grow room). Slow start.' },
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
    startLevel: { value: 0, min: 0, max: 8, step: 1, restart: true, note: 'Week to start in (skips the slow start for testing)' },
  },
};

// Plain default values, for tests and for code that runs without the panel.
export const defaultConfig = () => Object.fromEntries(Object.entries(CONFIG_SCHEMA).map(([g, f]) =>
  [g, Object.fromEntries(Object.entries(f).map(([k, d]) => [k, d.value]))]));
