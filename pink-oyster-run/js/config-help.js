// Plain-language help for every admin knob: what it does, and what playing at its min / default / max feels like.
// Shown under each row of the admin panel (admin-help.js). tests/admin-help.test.js checks every knob has an entry.
export const CONFIG_HELP = {
  time: {
    secondsPerDay: { what: 'Real seconds one game day lasts at 1× playback.', min: '30 s: a week flies by in 2.5 min; hard to keep up.', def: '180 s: a week takes 15 min at 1× (use 4–8× to skim).', max: '600 s: very slow; mostly for watching growth closely.' },
    bioDaysPerGameDay: { what: 'Real-world growing days packed into one game day.', min: '1: real time; a jar takes 12 game days.', def: '2.5: a jar takes ~5 game days.', max: '5: everything races; the pipeline fills in days.' },
  },
  growth: {
    growthScale: { what: 'Multiplies every growth duration (colonizing, pinning, fruiting, rest).', min: '0.25: four times faster than real growers see.', def: '1: real-world durations.', max: '3: three times slower; long waits.' },
    yieldScale: { what: 'Multiplies every harvest weight.', min: '0.3: tiny harvests; fruiting barely pays.', def: '1: realistic biological efficiency.', max: '3: huge flushes; money stops mattering.' },
  },
  contam: {
    hazardScale: { what: 'Multiplies every chance of mold.', min: '0: no mold at all (sandbox).', def: '1: realistic hobby odds.', max: '3: brutal; only sterile, clean work survives.' },
    sabFactor: { what: 'Mold odds in a still-air box vs the open counter.', min: '0.05: the box is nearly perfect.', def: '0.3: about 70% fewer spores.', max: '1: the box does nothing.' },
    flowHoodFactor: { what: 'Mold odds at a flow hood vs the open counter.', min: '0.01: practically sterile.', def: '0.1: about 90% fewer spores.', max: '1: the hood does nothing.' },
    openAirInoc: { what: 'Chance one inoculation on the open counter lets spores in (the box/hood multiply it).', min: '0: inoculating is always safe.', def: '0.15: 1 in 7 open-air jobs catch something.', max: '0.5: every other open-air job is contaminated.' },
    revealDays: { what: 'Real days between infection and visible mold.', min: '0: mold shows instantly; nothing hides.', def: '3: you can spawn from a plate before you see its mold.', max: '10: infections hide a long time and spread downstream.' },
    overrunDays: { what: 'Real days from visible mold to a fully overrun vessel.', min: '1: little time to react.', def: '6: time to cut a clean edge or toss it.', max: '15: mold creeps slowly.' },
  },
  economy: {
    priceFresh: { what: 'Market price for fresh pinks, $/lb.', min: '$6: fresh barely beats the booth fee.', def: '$14: middle of the researched range.', max: '$30: fresh is a gold mine.' },
    priceDried: { what: 'Price for dried pinks, per pound of fresh weight.', min: '$2: drying only avoids waste.', def: '$8: worth drying a surplus.', max: '$30: drying beats selling fresh.' },
    shelfLife: { what: 'Real days fresh pinks last before rotting.', min: '1: sell or dry almost immediately.', def: '2.5: about one game day.', max: '7: rot is rarely a problem.' },
    marketEvery: { what: 'Game days between farmers-market days.', min: '1: a market every day.', def: '2: plan harvests a day or two ahead.', max: '5: weekly; most fresh rots unless dried.' },
    boothFee: { what: 'Booth fee per market day, charged only if you bring product.', min: '$0: markets are free.', def: '$25: small harvests barely cover it.', max: '$100: only big harvests are worth a booth.' },
    heaterCost: { what: 'Electricity per game day for each heat-mat step.', min: '$0: heating is free.', def: '$1: noticeable, never ruinous.', max: '$10: heat only when blocks are fruiting.' },
  },
  shop: {
    priceScale: { what: 'Multiplies every equipment price.', min: '0.25: gear is cheap; buy everything.', def: '1: approximate US retail.', max: '3: every purchase is a hard choice.' },
    demand: { what: 'Online sales per game day per listed product at base price and reputation 50.', min: '0.1: listings sit for weeks.', def: '1: about one sale a day per product.', max: '5: everything you list sells fast.' },
    elasticity: { what: 'How strongly price changes sales.', min: '0: price doesn’t affect sales; charge the max.', def: '2: double the price, about 1/7 the sales.', max: '6: any markup kills sales.' },
    stageMult: { what: 'Base price step for each later stage (plates → jars → kits).', min: '1: every product is worth the same.', def: '1.25: later stages pay more.', max: '2: later stages pay much more.' },
    startReputation: { what: 'Starting shop reputation (0–100), and where it recovers to.', min: '10: a slow start; few buyers.', def: '50: neutral.', max: '100: famous on day one.' },
    refundHit: { what: 'Reputation lost when a moldy item reaches a customer.', min: '0: refunds only cost the sale.', def: '8: a few refunds hurt for weeks.', max: '30: one bad shipment wrecks you.' },
    recovery: { what: 'Reputation regained per game day while below the start value.', min: '0: damage is permanent.', def: '0.5: about two weeks to recover from a refund.', max: '5: bad reviews are forgotten in days.' },
  },
  equipment: {
    cookerDays: { what: 'Real days per pressure-cooker cycle, including cooling.', min: '0.25: the cooker is never the bottleneck.', def: '1: a cycle a day; plan batches.', max: '3: the cooker limits everything.' },
  },
  room: {
    houseTemp: { what: 'Thermostat. Kitchen +2°F, closet +4°F, tent + heat mat.', min: '55°F: everything crawls without heat.', def: '68°F: closet 72°F, a good incubation temperature.', max: '80°F: warm everywhere; heat mats barely needed.' },
    seasonStartTemp: { what: 'Outdoor temperature (garage, yard) at the start.', min: '50°F: the garage is cold from day one.', def: '63°F: a mild start.', max: '85°F: a hot start.' },
    seasonEndTemp: { what: 'Outdoor temperature after 12 weeks (it drifts toward this).', min: '40°F: winter; the garage is useless.', def: '55°F: autumn chill.', max: '85°F: summer.' },
    coldSnapChance: { what: 'Chance per game day of a forecast cold snap.', min: '0: no cold snaps.', def: '0.04: roughly one every few weeks.', max: '0.3: constant cold snaps.' },
  },
  progression: {
    unitsScale: { what: 'Multiplies the good units each stage needs after its checklist.', min: '0.25: one good unit masters a stage.', def: '1: 2–3 units (6 lb at market).', max: '3: long grind per stage.' },
  },
  difficulty: {
    relaxedCash: { what: 'Starting cash on Relaxed.', min: '$100: Relaxed rules, tight money.', def: '$2,500: buy most gear early.', max: '$10,000: money never matters.' },
    normalCash: { what: 'Starting cash on Normal.', min: '$100: almost no gear.', def: '$1,500: core gear plus a few choices.', max: '$10,000: money never matters.' },
    hardcoreCash: { what: 'Starting cash on Hardcore.', min: '$100: survival mode.', def: '$800: every purchase counts.', max: '$10,000: only the mold rules stay hard.' },
    graceHazard: { what: 'Mold odds during the grace weeks (Relaxed/Normal: weeks 0–1; Hardcore: week 0).', min: '0: no mold while learning.', def: '0.4: mold still happens, just less.', max: '1: no grace at all.' },
    relaxedHazard: { what: 'Mold odds on Relaxed after the grace weeks.', min: '0.1: Relaxed is nearly mold-free.', def: '0.6: noticeably gentler.', max: '1: same odds as Normal.' },
    salvageQuality: { what: 'Relaxed: share of yield or uses kept after cutting mold out.', min: '0.2: salvage barely helps.', def: '0.6: a real second chance.', max: '1: salvage is free.' },
  },
  look: {
    customImages: { what: 'Use your generated images from assets/img when they exist.', min: 'Off: always the built-in placeholder art.', def: 'On: custom images where found.', max: '—' },
    tips: { what: 'Show the “Next:” coaching line.', min: 'Off: no hints; harder.', def: 'On: always a suggested next step.', max: '—' },
    sfxVolume: { what: 'Sound-effect volume.', min: '0: silent.', def: '0.6: comfortable.', max: '1: loud.' },
  },
  dev: {
    timeScale: { what: 'Developer slow-mo / fast-forward on top of playback speed.', min: '0.1: inspect animations frame by frame.', def: '1: normal.', max: '3: triple speed on top of playback.' },
    paused: { what: 'Freeze the simulation (the UI still works).', min: 'Off: running.', def: 'Off.', max: 'On: frozen.' },
    god: { what: 'No mold and no rot, for testing the rest.', min: 'Off: normal rules.', def: 'Off.', max: 'On: nothing ever contaminates or rots.' },
    debug: { what: 'Show hidden infections, hazards and timers on each spot.', min: 'Off.', def: 'Off.', max: 'On: spoilers on every card.' },
    juice: { what: 'Sounds, animations and floaters. Off = grey-box test of the bare loop.', min: 'Off: no motion or sound.', def: 'On.', max: '—' },
    startLevel: { what: 'Game week to start a new game in (time only, not stages).', min: '0: start at the beginning.', def: '0.', max: '8: test later weather and weeks.' },
  },
};
