// All tuning knobs. Pure data: imported by the admin panel (config.js) and by node tests.
export const CONFIG_SCHEMA = {
  time: {
    secondsPerDay: { value: 5, min: 1.5, max: 15, step: 0.5, note: 'Real seconds per game day. The main pacing knob.' },
    seasonDays: { value: 50, min: 20, max: 120, step: 5, restart: true, note: 'Season length. 50 days x 5 s is about 4 minutes of sim time.' },
    pauseInMenus: { value: true, note: 'Freeze time while an action sheet is open. Readability over pressure.' },
  },
  growth: {
    plateDays: { value: 6, min: 2, max: 14, step: 0.5, note: 'Days for an MEA plate to fully colonize at ideal temperature' },
    jarDays: { value: 8, min: 2, max: 20, step: 0.5, note: 'Days for a grain jar to fully colonize' },
    bagDays: { value: 10, min: 3, max: 24, step: 0.5, note: 'Days for a substrate bag to fully colonize' },
    pinDays: { value: 3, min: 1, max: 8, step: 0.5, note: 'Days from colonized block to pins (when warm)' },
    growDays: { value: 3, min: 1, max: 8, step: 0.5, note: 'Days from pins to a peak cluster' },
    peakWindow: { value: 1.5, min: 0.5, max: 4, step: 0.25, note: 'Days at peak before over-ripening, and again before dropping' },
    restDays: { value: 4, min: 1, max: 10, step: 0.5, note: 'Rest between flushes' },
    shakeBoost: { value: 0.35, min: 0, max: 0.8, step: 0.05, note: 'Share of the remaining jar time a shake removes' },
    yieldScale: { value: 1, min: 0.3, max: 3, step: 0.05, note: 'Multiplies every harvest (kg per 1 kg dry substrate x BE)' },
  },
  contam: {
    plateHazard: { value: 0.03, min: 0, max: 0.3, step: 0.005, note: 'Chance per day a plate catches mold' },
    jarSterile: { value: 0.01, min: 0, max: 0.2, step: 0.005, note: 'Daily mold chance, pressure-cooked grain' },
    jarPasteurized: { value: 0.2, min: 0, max: 0.6, step: 0.01, note: 'Daily mold chance, pasteurized grain (should feel near-certain)' },
    bagScale: { value: 1, min: 0, max: 3, step: 0.05, note: 'Multiplies every substrate recipe’s mold chance' },
    fruitingMult: { value: 0.3, min: 0, max: 1, step: 0.05, note: 'Mold chance on fruiting blocks vs colonizing bags' },
    revealDays: { value: 1.5, min: 0, max: 6, step: 0.25, note: 'Days from infection until mold is visible' },
    superAgarHide: { value: 3, min: 1, max: 6, step: 0.25, note: 'Super agar multiplies the reveal delay (hides mold)' },
    overrunDays: { value: 3, min: 0.5, max: 8, step: 0.25, note: 'Days from visible mold to a fully overrun vessel' },
  },
  economy: {
    startCash: { value: 30, min: 5, max: 200, step: 1, restart: true, note: 'Starting money' },
    priceFresh: { value: 12, min: 1, max: 40, step: 0.5, note: 'Market price per kg fresh' },
    priceDried: { value: 7, min: 1, max: 40, step: 0.5, note: 'Price per fresh-kg once dried. Keep below fresh.' },
    plateCost: { value: 1, min: 0, max: 10, step: 0.5, note: 'Cost to pour a plate' },
    jarCost: { value: 2, min: 0, max: 10, step: 0.5, note: 'Cost of a grain jar' },
    heaterCost: { value: 0.25, min: 0, max: 2, step: 0.05, note: 'Cost per day per heater step' },
    marketEvery: { value: 3, min: 1, max: 7, step: 1, note: 'Days between market days' },
    shelfLife: { value: 2, min: 0.5, max: 7, step: 0.25, note: 'Days fresh pinks last before rotting' },
    quizChance: { value: 0.5, min: 0, max: 1, step: 0.05, note: 'Chance a customer asks a myth-or-fact on market day' },
    targetProfit: { value: 120, min: 20, max: 500, step: 5, note: 'Profit that earns the top rank' },
  },
  equipment: {
    slots: { value: 9, min: 4, max: 15, step: 1, restart: true, note: 'Shelves in the grow room' },
    cookerCapacity: { value: 3, min: 1, max: 9, step: 1, note: 'Vessels per pressure-cooker batch: the sterility bottleneck' },
    cookerDays: { value: 1.5, min: 0.25, max: 5, step: 0.25, note: 'Days per cooker batch (load, cook, cool)' },
  },
  room: {
    seasonStartTemp: { value: 63, min: 50, max: 85, step: 1, note: 'Unheated room temperature on day 1 (°F)' },
    seasonEndTemp: { value: 55, min: 40, max: 85, step: 1, note: 'Unheated room temperature on the last day' },
    heaterStep: { value: 8, min: 2, max: 15, step: 1, note: '°F added per heater step' },
    coldSnapChance: { value: 0.04, min: 0, max: 0.3, step: 0.01, note: 'Daily chance of a forecast cold snap after day 8' },
  },
  look: {
    customImages: { value: true, note: 'Off = always use the built-in placeholder art' },
    tips: { value: true, note: 'Show the "Next:" coaching line' },
    sfxVolume: { value: 0.6, min: 0, max: 1, step: 0.05, note: 'Sound effects volume' },
  },
  dev: {
    timeScale: { value: 1, min: 0.1, max: 3, step: 0.1, note: 'Slow-mo to inspect feel' },
    paused: { value: false },
    god: { value: false, note: 'No damage: no mold, no rot' },
    debug: { value: false, note: 'Shows hidden mold, hazards and timers on each shelf' },
    juice: { value: true, note: 'Off = grey-box test (no sounds, floaters, pulses)' },
    startLevel: { value: 1, min: 1, max: 2, step: 1, restart: true, note: '1 = tutorial bench (stocked), 2 = one plate, empty shelves' },
  },
};

// Plain default values, for tests and for code that runs without the panel.
export const defaultConfig = () => Object.fromEntries(Object.entries(CONFIG_SCHEMA).map(([g, f]) =>
  [g, Object.fromEntries(Object.entries(f).map(([k, d]) => [k, d.value]))]));
