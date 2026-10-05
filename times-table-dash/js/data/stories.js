// Story mode content, told like a 16-bit adventure: each story is a "world", each page is a short
// dialogue scene that ends in one math challenge.
//
// To add a story, append to STORIES. Each beat has:
//   op + number ranges   add/sub use `a` and `b` ranges; div uses divisor `d` and quotient `q` ranges
//   lines(n)             dialogue before the challenge: [who, text] pairs; n = { a, b, ans }
//   ask                  the question under the dialogue
//   win(n)               one [who, text] line shown after a correct answer
// `who` is a key of CAST, or 'narr' for narrator lines (no portrait).
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

// Characters. `art` is tried in order; if none load, the emoji is shown in a pixel frame.
export const CAST = {
  kazu: { name: 'Kazu', emoji: '🦊', color: '#f2b06a', art: ['art/portraits/kazu.webp', 'art/portraits/kazu.png', 'art/kazu-idle.webp'] },
  mimi: { name: 'Mimi', emoji: '🐰', color: '#f2c4cf', art: ['art/portraits/mimi.webp', 'art/portraits/mimi.png'] },
  tanuki: { name: 'Grandpa Tanuki', emoji: '🦝', color: '#b8a48c', art: ['art/portraits/tanuki.webp', 'art/portraits/tanuki.png'] },
  gusty: { name: 'Gusty', emoji: '🌪️', color: '#bcd6e8', art: ['art/portraits/gusty.webp', 'art/portraits/gusty.png'] },
  hoot: { name: 'Professor Hoot', emoji: '🦉', color: '#c9b38f', art: ['art/portraits/hoot.webp', 'art/portraits/hoot.png'] }
};
// Per-story backdrop and music: art/story/<id>.webp (or .png) and audio/story/<id>.mp3 (both optional).
export const sceneArt = (id) => ['art/story/' + id + '.webp', 'art/story/' + id + '.png'];
export const storyMusic = (id) => 'audio/story/' + id + '.mp3';

export const STORIES = [
  {
    id: 'picnic', world: 'World 1', title: 'The Spring Picnic', kind: 'Addition', icon: '🧺', tone: 'accent', ops: ['add'],
    sky: ['#bfe3f2', '#fbe7ee'], ground: '#cfe6bf',
    intro: [
      ['narr', 'WORLD 1: Sakura Park. The sun is up and the birds are singing.'],
      ['mimi', 'Kazu! The Big Picnic starts at noon!'],
      ['kazu', "Then let's pack! Adding things up is my specialty."]
    ],
    outro: [
      ['narr', 'WORLD 1 CLEAR!'],
      ['kazu', 'Full tummy... time for a little nap...'],
      ['mimi', 'Wait. What is that whooshing sound?']
    ],
    beats: [
      { op: 'add', a: [2, 6], b: [2, 5], icon: '🍙', lines: n => [['mimi', `I made ${n.a} rice balls!`], ['kazu', `And I brought ${n.b} more!`]], ask: 'How many rice balls are in the basket?', win: n => ['kazu', `${n.ans} rice balls! Basket power: MAX!`] },
      { op: 'add', a: [3, 8], b: [2, 6], icon: '🌸', lines: n => [['narr', 'A trail of blossoms leads into the park.'], ['kazu', `${n.a} blossoms on this branch... and ${n.b} on that one!`]], ask: 'How many blossoms are there in all?', win: n => ['mimi', `${n.ans}! So pretty!`] },
      { op: 'add', a: [4, 9], b: [3, 8], icon: '🦆', lines: n => [['narr', 'QUACK! A duck parade blocks the bridge!'], ['mimi', `${n.a} ducks are swimming... oh! ${n.b} more just flew in!`]], ask: 'How many ducks are on the pond now?', win: n => ['kazu', `${n.ans} ducks. After you, ducks!`] },
      { op: 'add', a: [5, 10], b: [4, 8], icon: '🍵', lines: n => [['kazu', 'Picnic blanket: deployed!'], ['mimi', `I poured ${n.a} cups of tea, and you poured ${n.b} cups of juice.`]], ask: 'How many cups are on the blanket?', win: n => ['mimi', `${n.ans} cups. Cheers!`] },
      { op: 'add', a: [6, 12], b: [5, 8], icon: '🍓', lines: n => [['narr', 'BONUS STAGE! Dessert time!'], ['kazu', `${n.a} strawberries in the red bowl. ${n.b} in the blue bowl!`]], ask: 'How many strawberries are there altogether?', win: n => ['mimi', `${n.ans} strawberries! Best. Picnic. Ever.`] }
    ]
  },
  {
    id: 'windy', world: 'World 2', title: 'The Windy Walk', kind: 'Subtraction', icon: '🍃', tone: 'blue', ops: ['sub'],
    sky: ['#a9cfe6', '#e8eef5'], ground: '#bfd8b4',
    intro: [
      ['narr', 'WORLD 2: Breezy Hill.'],
      ['gusty', "Whoosh-whoosh! I'm Gusty, and I LOVE taking things away!"],
      ['kazu', 'Uh-oh. Mimi, hold on to everything!']
    ],
    outro: [
      ['narr', 'WORLD 2 CLEAR!'],
      ['gusty', 'Okay, okay. Maybe helping is more fun than taking.'],
      ['kazu', 'Deal! Come to the bakery with us tomorrow!']
    ],
    beats: [
      { op: 'sub', a: [5, 9], b: [1, 4], icon: '🪁', lines: n => [['narr', 'Gusty swoops down from the clouds!'], ['gusty', `Ha! I'll take ${n.b} of your ${n.a} kites!`]], ask: 'How many kites does Kazu still have?', win: n => ['kazu', `${n.ans} left. I'm holding on tight!`] },
      { op: 'sub', a: [8, 12], b: [2, 6], icon: '🍂', lines: n => [['mimi', `We stacked ${n.a} leaves on the bench...`], ['gusty', `Puff! ${n.b} blown away!`]], ask: 'How many leaves are left on the bench?', win: n => ['mimi', `Still ${n.ans}. Nice try, Gusty!`] },
      { op: 'sub', a: [9, 14], b: [3, 8], icon: '🐦', lines: n => [['narr', `${n.a} birds rest on the fence.`], ['gusty', 'BOO!'], ['narr', `${n.b} birds fly off in a flutter.`]], ask: 'How many birds stayed on the fence?', win: n => ['kazu', `${n.ans} brave birds. Respect!`] },
      { op: 'sub', a: [10, 16], b: [4, 9], icon: '🌰', lines: n => [['kazu', `I found ${n.a} acorns!`], ['gusty', 'Roll, little acorns, roll!'], ['narr', `${n.b} acorns tumble down the hill.`]], ask: 'How many acorns does Kazu have left?', win: n => ['kazu', `${n.ans} acorns. Still a good haul!`] },
      { op: 'sub', a: [12, 20], b: [5, 11], icon: '🏠', lines: n => [['narr', `FINAL STRETCH! Home is ${n.a} steps away.`], ['mimi', `We already walked ${n.b} steps!`]], ask: 'How many steps are left?', win: n => ['gusty', `Only ${n.ans}?! Huff... puff... I'm out of wind!`] }
    ]
  },
  {
    id: 'bakery', world: 'World 3', title: 'The Bakery Morning', kind: 'Mixed: + and −', icon: '🥐', tone: 'sun', ops: ['add', 'sub'],
    sky: ['#f6dcb8', '#fbf0e2'], ground: '#e7cfae',
    intro: [
      ['narr', 'WORLD 3: Tanuki Bakery. It smells like melon buns!'],
      ['tanuki', 'Ho ho! Today you are my helpers. Baking ADDS buns. Selling TAKES them away.'],
      ['gusty', "And I'll cool them down! Gentle whoosh!"]
    ],
    outro: [
      ['narr', 'WORLD 3 CLEAR!'],
      ['tanuki', 'A warm melon bun for each of you. Ho ho!'],
      ['narr', 'A letter flutters in. It is sealed with a lantern stamp...']
    ],
    beats: [
      { op: 'add', a: [4, 9], b: [3, 8], icon: '🍞', lines: n => [['tanuki', `First batch: ${n.a} melon buns.`], ['kazu', `Second batch: ${n.b} more! Ding!`]], ask: 'How many melon buns are there now?', win: n => ['tanuki', `${n.ans}! A fine start.`] },
      { op: 'sub', a: [8, 14], b: [2, 6], icon: '🍞', lines: n => [['narr', 'The door chimes. Customers!'], ['mimi', `There were ${n.a} buns on the tray, and they bought ${n.b}!`]], ask: 'How many buns are still on the tray?', win: n => ['kazu', `${n.ans} left. Business is booming!`] },
      { op: 'add', a: [5, 10], b: [4, 9], icon: '🧁', lines: n => [['gusty', `Whoosh! ${n.a} cream puffs, cooled!`], ['mimi', `And ${n.b} cupcakes, frosted!`]], ask: 'How many treats are on the new tray?', win: n => ['tanuki', `${n.ans} treats. Splendid teamwork!`] },
      { op: 'sub', a: [10, 18], b: [3, 9], icon: '🛍️', lines: n => [['tanuki', `We started with ${n.a} paper bags.`], ['kazu', `And we've used ${n.b} already.`]], ask: 'How many bags are left?', win: n => ['tanuki', `${n.ans}. Enough until closing!`] },
      { op: 'add', a: [6, 12], b: [3, 8], icon: '🪙', lines: n => [['narr', 'Tip jar check!'], ['mimi', `${n.a} coins this morning, ${n.b} coins after lunch!`]], ask: 'How many coins are in the tip jar?', win: n => ['kazu', `${n.ans} coins! We're rich! ...In coins.`] },
      { op: 'sub', a: [9, 15], b: [2, 7], icon: '🥐', lines: n => [['narr', `Closing time. ${n.a} croissants are left.`], ['tanuki', `Take ${n.b} to the neighbors, would you?`]], ask: 'How many croissants stay at the bakery?', win: n => ['mimi', `${n.ans} for tomorrow's breakfast!`] }
    ]
  },
  {
    id: 'lanterns', world: 'World 4', title: 'Lantern Night', kind: 'Division', icon: '🏮', tone: 'rose', ops: ['div'],
    sky: ['#3b3f6b', '#7a5a7e'], ground: '#4a4560', night: true,
    intro: [
      ['narr', 'WORLD 4: Riverside, at dusk.'],
      ['hoot', 'Hoo-hoo! Tonight is the Lantern Festival. Everything must be shared FAIRLY.'],
      ['kazu', 'Equal groups, same amount in each. Got it!']
    ],
    outro: [
      ['narr', 'WORLD 4 CLEAR!'],
      ['narr', 'The lanterns float up, and the sky glows gold.'],
      ['hoot', 'You know three powers now: add, take away, and share. Next stop... the Festival!']
    ],
    beats: [
      { op: 'div', d: [2, 3], q: [2, 5], icon: '🏮', lines: n => [['hoot', `We have ${n.a} lanterns and ${n.b} trees.`], ['kazu', 'The same number on every tree!']], ask: 'How many lanterns go on each tree?', win: n => ['hoot', `${n.ans} per tree. Fair and bright!`] },
      { op: 'div', d: [2, 4], q: [2, 5], icon: '✨', lines: n => [['mimi', `${n.a} glow sticks for ${n.b} friends!`], ['gusty', 'Everyone gets the same. No grabbing!']], ask: 'How many glow sticks does each friend get?', win: n => ['mimi', `${n.ans} each. So glowy!`] },
      { op: 'div', d: [2, 5], q: [2, 6], icon: '🍡', lines: n => [['tanuki', `I brought ${n.a} mochi for ${n.b} plates.`], ['kazu', 'Equal plates, coming right up!']], ask: 'How many mochi go on each plate?', win: n => ['tanuki', `${n.ans} per plate. Ho ho!`] },
      { op: 'div', d: [3, 5], q: [2, 6], icon: '🧒', lines: n => [['narr', `Fireworks soon! ${n.a} kids line up in ${n.b} equal rows.`], ['hoot', 'Hoo! Neat rows, please!']], ask: 'How many kids are in each row?', win: n => ['kazu', `${n.ans} in each row. Perfect view!`] },
      { op: 'div', d: [2, 5], q: [3, 8], icon: '🕊️', lines: n => [['narr', `FINAL WISH! Kazu folded ${n.a} paper cranes.`], ['hoot', `Place them in ${n.b} wish boxes, the same number in each.`]], ask: 'How many cranes go in each box?', win: n => ['hoot', `${n.ans} cranes per box. Your wish will fly!`] }
    ]
  },
  {
    id: 'festival', world: 'World 5', title: 'The School Festival', kind: 'Mixed: +, − and ÷', icon: '🎪', tone: 'accent', ops: ['add', 'sub', 'div'],
    sky: ['#ffd7a8', '#fde9f0'], ground: '#d9e7c4',
    intro: [
      ['narr', 'FINAL WORLD: The Sakura School Festival!'],
      ['kazu', 'Everyone is here! Mimi, Grandpa, Gusty, Professor Hoot!'],
      ['hoot', 'Use every power you have learned. Hoo-hoo, good luck!']
    ],
    outro: [
      ['narr', 'ALL WORLDS CLEAR!'],
      ['kazu', 'We did it, together!'],
      ['mimi', 'Same time next year?'],
      ['narr', 'THE END. Thanks for playing! ★']
    ],
    beats: [
      { op: 'add', a: [5, 12], b: [4, 9], icon: '🖼️', lines: n => [['mimi', `We painted ${n.a} posters on Monday and ${n.b} on Tuesday!`]], ask: 'How many posters did they paint in all?', win: n => ['mimi', `${n.ans} posters. The halls look amazing!`] },
      { op: 'div', d: [2, 5], q: [2, 6], icon: '🎈', lines: n => [['gusty', `I blew up ${n.a} balloons!`], ['kazu', `Let's tie them to ${n.b} booths, the same number at each.`]], ask: 'How many balloons go at each booth?', win: n => ['gusty', `${n.ans} each! Best job ever!`] },
      { op: 'sub', a: [10, 20], b: [3, 9], icon: '🥤', lines: n => [['tanuki', `The lemonade stand had ${n.a} cups. We sold ${n.b}!`]], ask: 'How many cups are left?', win: n => ['tanuki', `${n.ans} left. Better make more!`] },
      { op: 'add', a: [6, 14], b: [5, 10], icon: '👪', lines: n => [['narr', `Families arrive! ${n.a} in the morning, ${n.b} after lunch.`]], ask: 'How many families came to the festival?', win: n => ['kazu', `${n.ans} families! Full house!`] },
      { op: 'sub', a: [12, 20], b: [4, 10], icon: '🎟️', lines: n => [['kazu', `I have ${n.a} game tickets.`], ['mimi', `And you spent ${n.b} on the ring toss!`]], ask: 'How many tickets does Kazu have left?', win: n => ['kazu', `${n.ans} left... and I won a tiny hat!`] },
      { op: 'div', d: [2, 4], q: [3, 7], icon: '🎀', lines: n => [['narr', 'BOSS STAGE: The Grand Prize!'], ['hoot', `${n.a} prize ribbons for ${n.b} teams. Share them fairly!`]], ask: 'How many ribbons does each team get?', win: n => ['hoot', `${n.ans} each. Everyone wins!`] }
    ]
  }
];
// split text so numbers can be shown in bold without v-html
export const toParts = (s) => s.split(/(\d+)/).filter(Boolean).map(t => ({ t, n: /^\d+$/.test(t) }));
