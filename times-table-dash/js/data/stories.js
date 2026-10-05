// Story mode: a short campaign told like a 16-bit adventure. Each chapter is a quick dialogue intro,
// then a timed round with a point goal. Reach the goal to win the chapter; fall short and the story
// tells you how close you got and lets you retry.
//
// To add a chapter, append to CHAPTERS:
//   round    { ops, level, tables, from, to, duration, goal }; same shape as practice settings (see problems.js)
//   foe      a CAST key for a boss fight (the meter shows its HP draining), or null for a quest (the meter fills)
//   meter    label for the goal meter
//   intro    [who, text] lines before the round; `who` is a CAST key or 'narr' (narrator, no portrait)
//   win      lines after reaching the goal
//   lose(r)  lines after falling short; r = { score, goal, need, pct, tries }
//   tip      one line of advice shown on a loss
import { range } from '../core/util.js';

// Characters. `art` is tried in order (see ASSET_PROMPTS.md); if none load, the emoji is shown instead.
const portrait = (id) => ['art/portraits/' + id + '.webp', 'art/portraits/' + id + '.png'];
export const CAST = {
  kazu: { name: 'Kazu', emoji: '🦊', color: '#f2b06a', art: [...portrait('kazu'), 'art/kazu-idle.webp'] },
  mimi: { name: 'Mimi', emoji: '🐰', color: '#f2c4cf', art: portrait('mimi') },
  tanuki: { name: 'Grandpa Tanuki', emoji: '🦝', color: '#b8a48c', art: portrait('tanuki') },
  hoot: { name: 'Professor Hoot', emoji: '🦉', color: '#c9b38f', art: portrait('hoot') },
  gusty: { name: 'Gusty', emoji: '🌪️', color: '#bcd6e8', art: portrait('gusty') },
  golem: { name: 'Times Golem', emoji: '🗿', color: '#b9b2a6', art: portrait('golem') },
  riku: { name: 'Riku', emoji: '🐦', color: '#8f9bb8', art: portrait('riku') },
  calculo: { name: 'Count Calculo', emoji: '🕰️', color: '#c7a0d8', art: portrait('calculo') }
};
// Optional chapter backdrop: art/story/<id>.webp or .png
export const sceneArt = (id) => ['art/story/' + id + '.webp', 'art/story/' + id + '.png'];
// Optional music: one theme for story screens, one for quest rounds, one for boss rounds, one for the final boss.
export const STORY_MUSIC = { theme: 'audio/story/theme.mp3', quest: 'audio/story/quest.mp3', boss: 'audio/story/boss.mp3', final: 'audio/story/final-boss.mp3' };

const T2_9 = range(2, 9), T2_12 = range(2, 12);

export const CHAPTERS = [
  {
    id: 'bridge', title: 'The Broken Bridge', icon: '🌉', foe: null, meter: 'Bridge rebuilt', tone: 'accent',
    sky: ['#bfe3f2', '#fbe7ee'], ground: '#cfe6bf',
    round: { ops: ['add'], level: 'easy', tables: T2_9, from: 1, to: 10, duration: 30, goal: 80 },
    intro: [
      ['narr', 'The night before the Sakura Festival, the town clock stopped at 11:59.'],
      ['calculo', 'Mwa-ha-ha! I am COUNT CALCULO! No clock, no festival!'],
      ['hoot', 'Kazu! To reach the clock tower you must cross the river, but the storm broke the bridge.'],
      ['kazu', "Then we'll ADD it back together, one plank at a time!"]
    ],
    win: [['narr', 'The last plank clicks into place!'], ['mimi', "The bridge is fixed! Kazu, wait for me!"]],
    lose: r => [['narr', `The bridge is ${r.pct}% rebuilt... but the river is rising!`], ['hoot', `You scored ${r.score}. You need ${r.goal}. Only ${r.need} more points!`]],
    tip: 'Add the ones first, then the tens. 47 + 8 → 47 + 3 = 50, then + 5 = 55.'
  },
  {
    id: 'gale', title: "Gusty's Gale", icon: '🌪️', foe: 'gusty', meter: "Gusty's wind", tone: 'blue',
    sky: ['#a9cfe6', '#e8eef5'], ground: '#bfd8b4',
    round: { ops: ['sub'], level: 'easy', tables: T2_9, from: 1, to: 10, duration: 30, goal: 80 },
    intro: [
      ['narr', 'On Breezy Hill, a whirlwind blocks the path.'],
      ['gusty', "Whoosh! The Count says I can take away ANYTHING I want. Starting with your snacks!"],
      ['mimi', "Kazu, every time you subtract, you weaken Gusty's wind!"],
      ['kazu', "Let's take away your wind power, then!"]
    ],
    win: [['gusty', "Huff... puff... I'm out of wind! Okay, okay. The Count isn't even nice to me."], ['kazu', 'Then come with us! We could use a friend who can fly.'], ['gusty', '...Really? Whoosh! Deal!']],
    lose: r => [['gusty', `Ha! You only blew away ${r.pct}% of my wind!`], ['mimi', `${r.score} points. ${r.need} more and Gusty is grounded. Try again!`]],
    tip: 'Count up instead of back: 52 − 7 → 7 + 3 = 10, 10 + 42 = 52, so the answer is 3 + 42 = 45.'
  },
  {
    id: 'market', title: 'Market Mix-Up', icon: '🏮', foe: null, meter: 'Orders filled', tone: 'sun',
    sky: ['#f6dcb8', '#fbf0e2'], ground: '#e7cfae',
    round: { ops: ['add', 'sub'], level: 'medium', tables: T2_9, from: 1, to: 10, duration: 60, goal: 120 },
    intro: [
      ['narr', 'Town Market. Count Calculo scrambled every price tag!'],
      ['tanuki', "Ho ho, what a mess! Customers are waiting and my register only counts nonsense."],
      ['tanuki', 'Add up what they buy, subtract what they pay. Can you keep up?'],
      ['gusty', "I'll blow the receipts over to you. Fast ones!"]
    ],
    win: [['tanuki', 'Every order filled! Here, take these melon buns for the road.'], ['tanuki', 'And a tip: the Count hides in the Times Tower. Something big guards the door...']],
    lose: r => [['narr', `The line is still out the door. Orders filled: ${r.pct}%.`], ['tanuki', `${r.score} out of ${r.goal}. Close! Take a deep breath and try again.`]],
    tip: 'Make a ten: 38 + 27 → 38 + 2 = 40, then + 25 = 65.'
  },
  {
    id: 'tower', title: 'The Times Tower', icon: '🗿', foe: 'golem', meter: "Golem's armor", tone: 'rose',
    sky: ['#c9c3e6', '#efe8f5'], ground: '#cbc2b4',
    round: { ops: ['mul'], level: 'medium', tables: T2_9, from: 1, to: 10, duration: 30, goal: 120 },
    intro: [
      ['narr', 'At the Times Tower, a stone giant blocks the door.'],
      ['golem', 'NONE... SHALL... PASS. UNLESS... YOU... KNOW... YOUR... TIMES... TABLES.'],
      ['hoot', 'Its armor is made of multiplication facts. Answer fast and it will crumble!'],
      ['kazu', 'Times tables? I practice those every day!']
    ],
    win: [['narr', 'CRASH! The armor crumbles into a pile of number blocks.'], ['golem', '...Correct. Very... correct. You... may... pass.']],
    lose: r => [['golem', `ARMOR... STILL... AT... ${100 - r.pct}%.`], ['hoot', `${r.score} points, and you need ${r.goal}. Speed bonuses help: try to answer in under 2 seconds!`]],
    tip: 'Stuck on 7 × 8? Remember 5, 6, 7, 8: 56 = 7 × 8.'
  },
  {
    id: 'lanterns', title: 'The Lantern Stairs', icon: '🕯️', foe: null, meter: 'Lanterns lit', tone: 'sun',
    sky: ['#3b3f6b', '#7a5a7e'], ground: '#4a4560', night: true,
    round: { ops: ['div'], level: 'medium', tables: T2_9, from: 1, to: 10, duration: 60, goal: 220 },
    intro: [
      ['narr', "Inside the tower, it's pitch dark. A long staircase winds up into the shadows."],
      ['hoot', 'Each lantern needs an EQUAL share of oil, or it will not light.'],
      ['mimi', 'So we divide the oil evenly. Every answer lights another lantern!'],
      ['gusty', "I'll keep the flames steady. Gently. Very gently."]
    ],
    win: [['narr', 'One by one, the lanterns glow all the way to the top.'], ['kazu', "I can see a door... and someone's waiting in front of it."]],
    lose: r => [['narr', `Only ${r.pct}% of the lanterns are lit. The stairs are still too dark.`], ['hoot', `${r.score} points. ${r.need} more to light the way. Try again!`]],
    tip: 'Division is multiplication backwards: 56 ÷ 8 asks "8 times what is 56?" The answer is 7.'
  },
  {
    id: 'rival', title: "Riku's Challenge", icon: '🐦', foe: 'riku', meter: "Riku's confidence", tone: 'blue',
    sky: ['#8fa7c9', '#e3d9ef'], ground: '#9aa3b5',
    round: { ops: ['mul', 'div'], level: 'medium', tables: T2_12, from: 1, to: 12, duration: 60, goal: 260 },
    intro: [
      ['riku', "Well, well. Kazu. The Count hired me to stop you. I'm the fastest math brain in town."],
      ['kazu', 'Riku? We used to practice together!'],
      ['riku', 'And I always won. Multiplication AND division, all the way to 12s. Ready to lose?'],
      ['mimi', "Don't let Riku rattle you, Kazu. Just one fact at a time!"]
    ],
    win: [['riku', "...You've gotten really good."], ['riku', "Fine. The Count promised me a trophy, but he never keeps promises. Go. He's at the top."], ['kazu', 'Thanks, Riku. Come watch the festival with us after!']],
    lose: r => [['riku', `Ha! ${r.score} points? I told you I'm faster.`], ['kazu', `Only ${r.need} more... I know these facts. One more try!`]],
    tip: 'For 11s and 12s: 12 × 7 = 10 × 7 + 2 × 7 = 70 + 14 = 84.'
  },
  {
    id: 'clock', title: "Count Calculo's Clock", icon: '🕰️', foe: 'calculo', meter: "Count Calculo's power", tone: 'rose', final: true,
    sky: ['#4b3b6b', '#c58aa6'], ground: '#5b4a6e', night: true,
    round: { ops: ['add', 'sub', 'mul', 'div'], level: 'medium', tables: T2_12, from: 1, to: 12, duration: 60, goal: 220 },
    intro: [
      ['narr', 'The top of the clock tower. Gears grind. The hands are frozen at 11:59.'],
      ['calculo', "You made it this far? Impressive. But can you handle ALL FOUR operations at once?"],
      ['hoot', "This is what you've trained for, Kazu. Adding, subtracting, multiplying, dividing."],
      ['kazu', "Everyone helped me get here. Let's restart that clock!"]
    ],
    win: [
      ['calculo', 'No... NO! My beautiful frozen clock!'],
      ['narr', 'TICK. TOCK. The hands move to 12:00, and the whole town cheers.'],
      ['calculo', '...Fine. I only stopped it because nobody ever invited me to the festival.'],
      ['kazu', "Then you're invited! Everyone is."],
      ['narr', 'THE END. The Sakura Festival is saved! ★']
    ],
    lose: r => [['calculo', `Mwa-ha-ha! Only ${r.pct}% of my power is gone!`], ['mimi', `${r.score} points, Kazu! You need ${r.need} more. We believe in you!`]],
    tip: 'Read the sign first! A quick look at + − × ÷ saves you from the most common mistakes.'
  }
];
