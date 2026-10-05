// Story mode content. To add a story, append to STORIES; each beat is one page with one problem.
// Beat spec: add/sub use `a` and `b` ranges; div uses divisor `d` and quotient `q` ranges.
import { rint } from '../core/util.js';

// Every problem is generated so its answer is a positive whole number:
//   add: a, b >= 1                  -> a + b >= 2
//   sub: b chosen in [1, a - 1]     -> a - b >= 1
//   div: a = d * q with d, q >= 2   -> a / d = q, no remainder
export const OP_SYM = { add: '+', sub: '−', div: '÷' };
export const OP_NAME = { add: 'Addition', sub: 'Subtraction', div: 'Division' };
export const OP_TIP = {
  add: 'Tip: start at the bigger number and count on.',
  sub: 'Tip: start at the first number and count back.',
  div: 'Tip: share them out one at a time into equal groups.'
};
export function makeNums(spec) {
  if (spec.op === 'add') { const a = rint(spec.a[0], spec.a[1]), b = rint(spec.b[0], spec.b[1]); return { a, b, ans: a + b }; }
  if (spec.op === 'sub') {
    const a = rint(Math.max(2, spec.a[0]), spec.a[1]);
    const hi = Math.min(spec.b[1], a - 1), lo = Math.min(spec.b[0], hi);
    const b = rint(Math.max(1, lo), hi);
    return { a, b, ans: a - b };
  }
  const d = rint(spec.d[0], spec.d[1]), q = rint(spec.q[0], spec.q[1]);
  return { a: d * q, b: d, ans: q };
}

export const STORIES = [
  {
    id: 'picnic', title: 'The Spring Picnic', kind: 'Addition', icon: '🧺', tone: 'accent', ops: ['add'],
    intro: 'The cherry trees are blooming! Kazu and Mimi are getting ready for a picnic in the park. Help them count everything as they go.',
    outro: 'What a lovely picnic. Everyone had plenty to eat, and Kazu took a nap under the blossoms.',
    beats: [
      { op: 'add', a: [2, 6], b: [2, 5], icon: '🍙', text: n => `Kazu packs ${n.a} rice balls. Mimi packs ${n.b} more.`, ask: 'How many rice balls are in the basket?' },
      { op: 'add', a: [3, 8], b: [2, 6], icon: '🌸', text: n => `On the way, Kazu spots ${n.a} blossoms on one branch and ${n.b} on the next.`, ask: 'How many blossoms are there in all?' },
      { op: 'add', a: [4, 9], b: [3, 8], icon: '🦆', text: n => `At the pond, ${n.a} ducks are swimming. Then ${n.b} more ducks fly in.`, ask: 'How many ducks are on the pond now?' },
      { op: 'add', a: [5, 10], b: [4, 8], icon: '🍵', text: n => `Kazu pours ${n.a} cups of tea. Mimi pours ${n.b} cups of juice.`, ask: 'How many cups are on the blanket?' },
      { op: 'add', a: [6, 12], b: [5, 8], icon: '🍓', text: n => `For dessert there are ${n.a} strawberries in one bowl and ${n.b} in another.`, ask: 'How many strawberries are there altogether?' }
    ]
  },
  {
    id: 'windy', title: 'The Windy Walk', kind: 'Subtraction', icon: '🍃', tone: 'blue', ops: ['sub'],
    intro: 'A spring breeze is blowing through the schoolyard. Kazu goes for a walk, but the wind keeps carrying things away!',
    outro: 'The wind settles down at last. Kazu walks home slowly, humming a little song.',
    beats: [
      { op: 'sub', a: [5, 9], b: [1, 4], icon: '🪁', text: n => `Kazu is holding ${n.a} paper kites. A gust carries ${n.b} of them up into the sky.`, ask: 'How many kites is Kazu still holding?' },
      { op: 'sub', a: [8, 12], b: [2, 6], icon: '🍂', text: n => `There are ${n.a} leaves on a bench. The wind blows ${n.b} of them away.`, ask: 'How many leaves are left on the bench?' },
      { op: 'sub', a: [9, 14], b: [3, 8], icon: '🐦', text: n => `${n.a} birds sit on the fence. ${n.b} birds fly off together.`, ask: 'How many birds are still on the fence?' },
      { op: 'sub', a: [10, 16], b: [4, 9], icon: '🌰', text: n => `Kazu gathers ${n.a} acorns. ${n.b} of them roll down the hill.`, ask: 'How many acorns does Kazu have left?' },
      { op: 'sub', a: [12, 20], b: [5, 11], icon: '👣', text: n => `The walk home is ${n.a} blocks long. Kazu has already walked ${n.b} blocks.`, ask: 'How many blocks are left to walk?' }
    ]
  },
  {
    id: 'bakery', title: 'The Bakery Morning', kind: 'Mixed: + and −', icon: '🥐', tone: 'sun', ops: ['add', 'sub'],
    intro: 'Grandpa Tanuki’s bakery opens early. Today Kazu is helping out: baking, selling, and counting. Some puzzles add, some take away.',
    outro: 'The bakery is quiet again. Grandpa Tanuki gives Kazu a warm melon bun as a thank-you.',
    beats: [
      { op: 'add', a: [4, 9], b: [3, 8], icon: '🍞', text: n => `Kazu bakes ${n.a} melon buns, then bakes ${n.b} more.`, ask: 'How many melon buns are there now?' },
      { op: 'sub', a: [8, 14], b: [2, 6], icon: '🍞', text: n => `There are ${n.a} buns on the tray. The first customers buy ${n.b}.`, ask: 'How many buns are still on the tray?' },
      { op: 'add', a: [5, 10], b: [4, 9], icon: '🧁', text: n => `A new tray holds ${n.a} cream puffs and ${n.b} cupcakes.`, ask: 'How many treats are on the new tray?' },
      { op: 'sub', a: [10, 18], b: [3, 9], icon: '🛍️', text: n => `Grandpa has ${n.a} paper bags. By noon, ${n.b} have been used.`, ask: 'How many bags are left?' },
      { op: 'add', a: [6, 12], b: [3, 8], icon: '🪙', text: n => `Kazu earns ${n.a} coins in the morning and ${n.b} more after lunch.`, ask: 'How many coins did Kazu earn today?' },
      { op: 'sub', a: [9, 15], b: [2, 7], icon: '🥐', text: n => `At closing time there are ${n.a} croissants. Kazu gives ${n.b} to the neighbors.`, ask: 'How many croissants are left?' }
    ]
  },
  {
    id: 'lanterns', title: 'Lantern Night', kind: 'Division', icon: '🏮', tone: 'rose', ops: ['div'],
    intro: 'Tonight is the lantern festival! Kazu wants everything shared fairly, so every group gets exactly the same amount.',
    outro: 'The lanterns glow softly over the river. Everyone got a fair share, thanks to Kazu.',
    beats: [
      { op: 'div', d: [2, 3], q: [2, 5], icon: '🏮', text: n => `Kazu has ${n.a} lanterns to hang on ${n.b} trees, the same number on each tree.`, ask: 'How many lanterns go on each tree?' },
      { op: 'div', d: [2, 4], q: [2, 5], icon: '✨', text: n => `${n.a} glow sticks are shared equally among ${n.b} friends.`, ask: 'How many glow sticks does each friend get?' },
      { op: 'div', d: [2, 5], q: [2, 6], icon: '🍡', text: n => `${n.a} mochi are placed on ${n.b} plates, the same number on each plate.`, ask: 'How many mochi are on each plate?' },
      { op: 'div', d: [3, 5], q: [2, 6], icon: '🧒', text: n => `${n.a} children line up in ${n.b} equal rows to watch the fireworks.`, ask: 'How many children are in each row?' },
      { op: 'div', d: [2, 5], q: [3, 8], icon: '🕊️', text: n => `Kazu folds ${n.a} paper cranes and puts them into ${n.b} boxes, the same number in each.`, ask: 'How many cranes go in each box?' }
    ]
  },
  {
    id: 'festival', title: 'The School Festival', kind: 'Mixed: +, − and ÷', icon: '🎪', tone: 'accent', ops: ['add', 'sub', 'div'],
    intro: 'It’s the big school festival! Kazu is helping run the day. You’ll use everything you’ve learned: adding, taking away, and sharing.',
    outro: 'The festival was a success! As the sun sets, Kazu and friends sit together and watch the sky turn pink.',
    beats: [
      { op: 'add', a: [5, 12], b: [4, 9], icon: '🖼️', text: n => `The class made ${n.a} posters on Monday and ${n.b} on Tuesday.`, ask: 'How many posters did they make in all?' },
      { op: 'div', d: [2, 5], q: [2, 6], icon: '🎈', text: n => `${n.a} balloons are tied to ${n.b} booths, the same number at each booth.`, ask: 'How many balloons are at each booth?' },
      { op: 'sub', a: [10, 20], b: [3, 9], icon: '🥤', text: n => `The snack stand starts with ${n.a} cups of lemonade. ${n.b} cups are sold.`, ask: 'How many cups are left?' },
      { op: 'add', a: [6, 14], b: [5, 10], icon: '👪', text: n => `${n.a} families arrive in the morning and ${n.b} more arrive after lunch.`, ask: 'How many families visit the festival?' },
      { op: 'sub', a: [12, 20], b: [4, 10], icon: '🎟️', text: n => `Kazu has ${n.a} game tickets and uses ${n.b} of them.`, ask: 'How many tickets does Kazu have left?' },
      { op: 'div', d: [2, 4], q: [3, 7], icon: '🎀', text: n => `At the end, ${n.a} prize ribbons are shared equally by ${n.b} teams.`, ask: 'How many ribbons does each team get?' }
    ]
  }
];
// split story text so numbers can be shown in bold without v-html
export const toParts = (s) => s.split(/(\d+)/).filter(Boolean).map(t => ({ t, n: /^\d+$/.test(t) }));
