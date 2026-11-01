// The house, side view, left to right. Each zone has 2–3 spots and its own conditions.
// `env`: dT = °F above the thermostat (indoor) or swing = daily ± swing around the outdoor season temp;
// rh %, co2 ppm, dirt = contamination multiplier (traffic, dust, humidity).
export const ZONES = [
  { id: 'kitchen', name: 'Kitchen counter', short: 'Kitchen', spots: 2, img: 'zone_kitchen',
    purpose: 'Plate work and prep. Your still-air box (or flow hood) lives here.',
    env: { dT: 2, rh: 45, co2: 700, dirt: 1.3 }, best: ['plate'] },
  { id: 'closet', name: 'Closet shelf', short: 'Closet', spots: 6, extra: { from: 3, needs: 'rack' }, img: 'zone_closet',
    purpose: 'Incubation: dark, stable, warm-ish, still air.',
    env: { dT: 4, rh: 55, co2: 2500, dirt: 0.8 }, best: ['plate', 'jar', 'bag'] },
  { id: 'tent', name: 'Grow tent', short: 'Tent', spots: 3, img: 'zone_tent', needs: 'tent',
    purpose: 'Fruiting: humid, with a fan for fresh air. You control heat, air and mist here.',
    env: { dT: 0, dirt: 1.0 }, best: ['block'] },
  { id: 'garage', name: 'Garage', short: 'Garage', spots: 2, img: 'zone_garage',
    purpose: 'The pressure cooker and cheap storage. Temperature follows the weather.',
    env: { outdoor: true, dT: -4, swing: 7, rh: 60, co2: 500, dirt: 1.2 }, best: [] },
  { id: 'yard', name: 'Back yard', short: 'Yard', spots: 2, img: 'zone_yard',
    purpose: 'Outdoor wood-chip beds for wine cap. Rain waters them; dry spells need the hose.', opens: 'bed', locked: 'Wine cap beds open at the wine cap “outdoor bed” stage.',
    env: { outdoor: true, dT: 0, swing: 10, rh: 70, co2: 420, dirt: 1.5 }, best: ['bed'] },
];
export const ZONE_BY_ID = Object.fromEntries(ZONES.map(z => [z.id, z]));
