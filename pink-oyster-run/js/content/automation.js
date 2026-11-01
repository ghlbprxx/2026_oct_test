// Optional automation: after you master a stage on the species you're growing, you can pay someone (or something)
// to run that stage's routine. Weekly fees compete with gear, booth fees and inventory for your cash.
// `stages`: stage ids that unlock it (on the current species). `fee`: $ per week while switched on.
// Tuned so a fully automated pink farm roughly breaks even: you buy back attention, not profit (tests/automation.test.js).
export const AUTOMATION = {
  agar:      { name: 'Lab helper: plates', stages: ['agar'], fee: 3, effect: 'Keeps two MEA plates going in your clean workspace and tosses moldy ones.' },
  grain:     { name: 'Grain routine', stages: ['grain'], fee: 4, effect: 'Preps and cooks grain jars, spawns them from clean cultures, and shakes them on time.' },
  substrate: { name: 'Bag routine', stages: ['substrate', 'spawn'], fee: 5, effect: 'Preps the recommended bags for this species and spawns them from clean jars.' },
  fruiting:  { name: 'Climate controller', stages: ['fruiting'], fee: 3, effect: 'Holds the tent at this species’ settings and moves colonized blocks into free tent spots.' },
  bed:       { name: 'Drip irrigation', stages: ['bed'], fee: 2, effect: 'Waters yard beds before they dry out.' },
  harvest:   { name: 'Harvest crew', stages: ['harvest'], fee: 5, effect: 'Picks at peak, retires spent blocks, dries fresh product before it would rot, and lists dried product online.' },
};
export const AUTOMATION_ORDER = Object.keys(AUTOMATION);
