// Equipment shop. Prices are approximate US retail (see .ai/DESIGN.md › Researched numbers); the admin
// knob shop.priceScale multiplies them. Every item changes a capability, odds or capacity, never "+X%".
// `opens`: sold once that system is open (see content/stages.js OPENS). `needs`: another item you must own first.
export const EQUIPMENT = {
  sab:        { name: 'Still-air box (DIY tote)', cat: 'Clean work', price: 15, img: 'gear_sab', effect: 'Plate work and inoculations catch about 70% fewer spores. Retail boxes run ~$50; a clear tote with arm holes works.' },
  flowhood:   { name: 'Laminar flow hood', cat: 'Clean work', price: 900, opens: 'bag', img: 'gear_flowhood', effect: 'HEPA-filtered airflow: about 90% fewer spores than open air. Replaces the still-air box.' },
  cooker16:   { name: 'Pressure cooker, 16 qt', cat: 'Sterilizing', price: 100, img: 'gear_cooker16', cooker: { jars: 7, bags: 0 }, effect: '7 quart jars per cycle. Too short for grow bags.' },
  cooker23:   { name: 'Pressure canner, 23 qt', cat: 'Sterilizing', price: 150, img: 'gear_cooker23', cooker: { jars: 7, bags: 2 }, effect: '7 quart jars or 2 grow bags per cycle. Needed to sterilize bags.' },
  scale:      { name: 'Kitchen scale', cat: 'Prep', price: 25, img: 'gear_scale', effect: 'Weigh water to field capacity: fewer wet spots, about 15% less mold on jars and bags you prep.' },
  sealer:     { name: 'Impulse sealer', cat: 'Prep', price: 60, img: 'gear_sealer', effect: 'Heat-seal grow bags instead of folding them: about 20% less mold on bags.' },
  tent:       { name: 'Grow tent with fan', cat: 'Fruiting', price: 90, opens: 'room', img: 'gear_tent', effect: 'Opens the 3 grow-tent spots, with a small fan for fresh air.' },
  heatmat:    { name: 'Heat mat + thermostat', cat: 'Fruiting', price: 30, needs: 'tent', img: 'gear_heatmat', effect: 'Heat control in the tent: +6°F per step.' },
  humidifier: { name: 'Humidifier', cat: 'Fruiting', price: 45, needs: 'tent', img: 'gear_humidifier', effect: 'Lets the tent go above 88% humidity. Hand misting tops out there.' },
  hygrometer: { name: 'Hygrometer', cat: 'Readings', price: 12, img: 'gear_hygrometer', effect: 'Shows temperature and humidity for every zone. Without it you only see the results.' },
  co2:        { name: 'CO₂ monitor', cat: 'Readings', price: 120, img: 'gear_co2', effect: 'Shows CO₂ ppm, so you can see stale air before clusters go leggy.' },
  dehydrator: { name: 'Dehydrator', cat: 'Harvest', price: 60, img: 'gear_dehydrator', effect: 'Dries fresh harvests so they keep instead of rotting.' },
};
export const EQUIPMENT_ORDER = ['sab', 'cooker16', 'cooker23', 'hygrometer', 'scale', 'sealer', 'tent', 'heatmat', 'humidifier', 'co2', 'dehydrator', 'flowhood'];
