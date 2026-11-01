// Root Vue template (compiled in the browser by vue.esm-browser).
export default `
<div class="game" :class="{nojuice:!CONFIG.dev.juice}">

  <!-- ============ TITLE ============ -->
  <section v-if="ui.screen==='title'" class="title">
    <div class="hero card">
      <img class="heroimg" :src="src('title_hero')" alt="Pink oyster mushrooms fruiting in a small home grow room">
      <div>
        <span class="label">Learn to grow gourmet mushrooms at home</span>
        <h1 style="margin-top:6px">Pink Oyster <em>Run</em></h1>
        <p class="lede">Start with a petri dish and an empty spare room. Each week a new part of the craft opens up, from agar to grain to substrate to fruiting, until your pink oysters reach the market table.</p>
        <div class="actions">
          <button class="btn big" @click="ui.screen='setup'">New game</button>
          <button class="btn ghost" @click="openNb('guide')">Grower's notebook</button>
        </div>
        <div class="facts">
          <div><span class="label">Best profit</span><b>{{ ui.best==null ? '—' : money(ui.best) }}</b></div>
          <div><span class="label">Lessons found</span><b>{{ lessonCount }}/{{ LESSON_IDS.length }}</b></div>
          <div><span class="label">Season</span><b>{{ CONFIG.time.seasonWeeks }} weeks</b></div>
        </div>
      </div>
    </div>
    <div class="howto">
      <div><b>1 · One stage at a time</b>Weeks 0–1 are just agar plates. Grain jars, substrate bags and the grow room open one per week after that.</div>
      <div><b>2 · Gamble on richness</b>Richer substrate means bigger flushes and more mold. The pressure cooker is your bottleneck.</div>
      <div><b>3 · Run the fruiting room</b>Heat, fresh air and mist decide whether blocks pin, and how good the clusters look.</div>
      <div><b>4 · Real numbers</b>Time is compressed (1 game day ≈ {{ CONFIG.time.bioDaysPerGameDay }} real growing days), but everything shows real-world durations, prices in $/lb, and real techniques.</div>
    </div>
  </section>

  <!-- ============ SETUP ============ -->
  <section v-else-if="ui.screen==='setup'" class="title">
    <div class="card">
      <span class="label">New game</span>
      <h2 style="font-size:clamp(28px,4vw,40px);margin:6px 0 4px">How forgiving should mold be?</h2>
      <p class="muted">You can change the numbers behind each mode in the admin panel (⚙).</p>
      <div class="modes">
        <button v-for="m in MODES_UI" :key="m.id" class="mode" :class="{rec:m.id==='normal'}" @click="start(m.id)">
          <b>{{ m.name }}</b><span class="mono">{{ money(m.cash) }} to start</span><small>{{ m.blurb }}</small>
        </button>
      </div>
      <div class="actions" style="margin-top:12px"><button class="btn ghost sm" @click="ui.screen='title'">Back</button></div>
    </div>
  </section>

  <!-- ============ PLAY ============ -->
  <section v-else-if="ui.screen==='play' && g">
    <header class="hud">
      <span class="logo">Pink Oyster <em>Run</em></span>
      <div class="hs day"><span class="label">Week {{ g.week }} · day {{ dayOfWeek }}</span><b>{{ clockText }}<span class="muted" style="font-size:12px"> / {{ CONFIG.time.seasonWeeks }} wk</span></b><div class="mini"><i :style="{width:Math.min(100,g.day/season*100)+'%'}"></i></div></div>
      <div class="hs"><span class="label">Cash</span><b>{{ money(g.cash) }}</b></div>
      <div class="hs"><span class="label">{{ roomOpen ? 'Room' : 'Closet' }}</span><b>{{ env.temp }}°F <span class="chip" :class="tS[0]" v-if="roomOpen">{{ tS[1] }}</span></b></div>
      <div class="hs" v-if="roomOpen"><span class="label">Market</span><b>{{ marketIn<=0.05 ? 'today' : 'in '+marketIn.toFixed(1)+'d' }}</b></div>
      <div class="hudbtns">
        <div class="speeds" role="group" aria-label="Playback speed">
          <button class="ib" @click="togglePause" :aria-pressed="ui.paused" :aria-label="ui.paused?'Resume':'Pause'" title="Pause (Space)">{{ ui.paused ? '▶' : '⏸' }}</button>
          <button v-for="sp in SPEEDS" :key="sp" class="sp" :aria-pressed="!ui.paused && ui.speed===sp" @click="setSpeed(sp)" :title="'Speed '+sp+'× ( [ and ] )'">{{ sp }}×</button>
        </div>
        <button v-if="roomOpen" class="ib heat" @click="setHeater((g.heater+1)%3)" :aria-label="'Heater: '+['off','low','high'][g.heater]+'. Tap to change.'" title="Heater (H)">🔥<small>{{ ['Off','Low','High'][g.heater] }}</small></button>
        <button class="ib" @click="openNb()" aria-label="Grower's notebook" title="Notebook (N)">📓</button>
        <button class="ib" @click="toggleMute" :aria-label="ui.muted?'Unmute':'Mute'" title="Mute (M)">{{ ui.muted ? '🔇' : '🔊' }}</button>
      </div>
    </header>
    <button class="tip" v-if="CONFIG.look.tips" aria-live="polite" @click="doTip"><b>Next:</b> {{ tip.t }}<span v-if="tip.slot!=null || tip.room || tip.dry || tip.heat" class="go"> →</span></button>
    <div v-else style="height:10px"></div>

    <div class="playgrid">
      <main class="bench" aria-label="Shelves">
        <button v-for="(v,i) in g.slots" :key="i+'-'+(v?v.id:0)" class="slot" :class="slotCls(v,i)" :data-slot="i" @click="tapSlot(i)" :aria-label="slotAria(v,i)">
          <template v-if="v">
            <span class="art"><img v-for="(l,k) in layers(v)" :key="k" :src="src(l.id)" :style="l.style" alt=""></span>
            <span class="slbl">#{{ v.id }} {{ vName(v) }}</span>
            <span class="sbadge" v-if="badge(v)">{{ badge(v) }}</span>
            <span class="sstat">{{ status(v) }}</span>
            <span class="sbar"><i :style="{width:barPct(v)+'%',background:barColor(v)}"></i></span>
            <span v-if="CONFIG.dev.debug" class="dbg">{{ dbg(v) }}</span>
          </template>
          <span v-else class="empty">+<small>Empty shelf</small></span>
          <span class="key" v-if="i<9">{{ i+1 }}</span>
        </button>
      </main>

      <aside class="side">
        <div class="card" v-if="!roomOpen">
          <div class="cardh"><span class="label">Grow room</span><span class="chip">Week {{ unlockWeek('room') }}</span></div>
          <p style="font-size:14.5px">Locked until week {{ unlockWeek('room') }}. Until then everything incubates in the closet at a steady {{ env.temp }}°F, so you can focus on clean technique.</p>
        </div>
        <div class="card" id="room" v-else>
          <div class="cardh"><span class="label">Grow room</span><span class="mono" style="font-size:12px">Room quality {{ Math.round(env.score*100) }}%</span></div>
          <div class="readout">
            <div><b>{{ env.temp }}°F</b><span>{{ tS[1] }}</span></div>
            <div><b>{{ env.co2 }}</b><span>ppm CO₂ · {{ cS[1] }}</span></div>
            <div><b>{{ env.rh }}%</b><span>RH · {{ hS[1] }}</span></div>
          </div>
          <div class="ctl">
            <div class="row"><label>Heater</label><span class="mono" style="font-size:12px">{{ money(g.heater*CONFIG.economy.heaterCost,2) }}/game day</span></div>
            <div class="seg" role="group" aria-label="Heater">
              <button v-for="h in [0,1,2]" :key="h" :aria-pressed="g.heater===h" @click="setHeater(h)">{{ ['Off','Low','High'][h] }}</button>
            </div>
            <span class="hint">Season {{ baseTemp }}°F{{ g.snap ? ' (cold snap!)' : '' }}{{ g.forecast ? ' · cold snap tomorrow' : '' }}. Heater adds {{ RULES.heaterStep }}°F per step.</span>
          </div>
          <div class="ctl">
            <div class="row"><label for="fae">Fresh air</label><span class="chip" :class="cS[0]">{{ cS[1] }}</span></div>
            <input id="fae" type="range" min="0" max="10" step="1" v-model.number="g.fae">
            <span class="hint">More air lowers CO₂ but dries the room.</span>
          </div>
          <div class="ctl">
            <div class="row"><label for="mist">Mist</label><span class="chip" :class="hS[0]">{{ hS[1] }}</span></div>
            <input id="mist" type="range" min="60" max="110" step="1" v-model.number="g.mist">
            <span class="hint">Aim for 85–95% RH. Above ~96% invites bacteria.</span>
          </div>
        </div>

        <div class="card gear">
          <img :src="src('cooker')" alt="">
          <div>
            <div class="cardh" style="margin:0"><b>Pressure cooker</b><span class="mono" style="font-size:12px">{{ g.cooker.batch.length }}/{{ CONFIG.equipment.cookerCapacity }}</span></div>
            <div class="mini" style="margin:5px 0"><i :style="{width:(g.cooker.batch.length?g.cooker.t/CONFIG.equipment.cookerDays*100:0)+'%'}"></i></div>
            <span class="muted" style="font-size:13px">{{ g.cooker.batch.length ? 'Sterilizing · '+Math.max(0,CONFIG.equipment.cookerDays-g.cooker.t).toFixed(1)+' days left' : 'Idle' }}{{ g.queue.length ? ' · '+g.queue.length+' waiting' : '' }}</span>
          </div>
        </div>

        <div class="card" v-if="roomOpen">
          <div class="gear">
            <img :src="src('crate_fresh')" alt="">
            <div>
              <div class="cardh" style="margin:0"><b>Fresh crate</b><span class="mono">{{ fmtLb(freshKg) }}</span></div>
              <span class="muted" style="font-size:13px">{{ money(CONFIG.economy.priceFresh) }}/lb at market · lasts ~{{ shelfLife }} real days</span>
            </div>
          </div>
          <div class="lots" v-if="g.lots.length">
            <div v-for="l in g.lots" :key="l.id" class="lot" :class="lotCls(l)">
              <span class="mono">{{ fmtLb(l.kg) }}</span>
              <span class="mini"><i :style="{width:Math.max(0,100-l.age/shelfLife*100)+'%'}"></i></span>
              <span class="mono muted" :title="'Real days of freshness left'">{{ Math.max(0,shelfLife-l.age).toFixed(1) }}d</span>
            </div>
          </div>
          <div class="gear" style="margin-top:10px">
            <img :src="src('crate_dried')" alt="">
            <div>
              <div class="cardh" style="margin:0"><b>Dried</b><span class="mono">{{ fmtLb(g.dried) }}</span></div>
              <span class="muted" style="font-size:13px">{{ money(CONFIG.economy.priceDried) }} per fresh lb · keeps all season</span>
            </div>
          </div>
          <div class="actions" style="margin-top:10px"><button class="btn sm" :disabled="!g.lots.length" @click="dryAll">Dehydrate all fresh (D)</button></div>
        </div>

        <div class="card">
          <div class="cardh"><span class="label">Grow log</span></div>
          <ul class="log"><li v-for="(l,i) in g.log.slice(0,14)" :key="i" :class="l.c"><span class="mono muted">d{{ l.d }}</span><span>{{ l.t }}</span></li></ul>
        </div>
      </aside>
    </div>
  </section>

  <!-- ============ REPORT ============ -->
  <section v-else-if="ui.screen==='report' && g" class="report">
    <div class="card">
      <span class="label">Season report · {{ g.endReason==='broke' ? 'ran out of money in week '+g.week : CONFIG.time.seasonWeeks+' weeks' }} · {{ g.mode }}{{ ui.newBest ? ' · new best' : '' }}</span>
      <div class="rank">{{ rank[0] }}</div>
      <p>{{ rank[1] }}</p>
      <div class="stats">
        <div class="stat"><span class="label">Profit</span><b>{{ money(profit) }}</b></div>
        <div class="stat"><span class="label">Harvested</span><b>{{ fmtLb(g.stats.harvestKg) }}</b></div>
        <div class="stat"><span class="label">Sold fresh</span><b>{{ fmtLb(g.stats.freshKg) }}</b></div>
        <div class="stat"><span class="label">Sold dried</span><b>{{ fmtLb(g.stats.driedKg) }}</b></div>
        <div class="stat"><span class="label">Rotted</span><b>{{ fmtLb(g.stats.rotKg) }}</b></div>
        <div class="stat"><span class="label">Lost to mold</span><b>{{ lostTotal }}</b></div>
        <div class="stat"><span class="label">Clusters dropped</span><b>{{ g.stats.dropped }}</b></div>
        <div class="stat"><span class="label">Heating bill</span><b>{{ money(g.stats.energy) }}</b></div>
      </div>
      <div class="actions"><button class="btn" @click="ui.screen='setup'">Play another season</button><button class="btn ghost" @click="openNb('lessons')">Notebook</button><button class="btn ghost" @click="ui.screen='title'">Title</button></div>
    </div>
    <div class="card" v-if="lostTotal">
      <span class="label">What the mold cost you</span>
      <div class="grid2" style="margin-top:8px">
        <div v-for="(n,why) in g.stats.lost" :key="why" class="mistake">
          <h4>{{ n }} × {{ LESSONS[why].title }}</h4>
          <p class="muted">{{ LESSONS[why].why }}</p>
          <p class="fix"><b>Fix:</b> {{ LESSONS[why].fix }}</p>
        </div>
      </div>
    </div>
    <div class="card">
      <span class="label">Lessons from this season · {{ g.learned.length }}</span>
      <div class="grid2" style="margin-top:8px" v-if="g.learned.length">
        <div v-for="id in g.learned" :key="id" class="mistake" :class="{good:LESSONS[id].good}">
          <h4>{{ LESSONS[id].title }}</h4><p class="muted">{{ LESSONS[id].why }}</p><p class="fix"><b>{{ LESSONS[id].good ? 'Keep doing it:' : 'Fix:' }}</b> {{ LESSONS[id].fix }}</p>
        </div>
      </div>
      <p v-else class="muted" style="margin-top:6px">None this time.</p>
    </div>
  </section>

  <!-- ============ ACTION SHEET ============ -->
  <div v-if="ui.sheet && g" class="scrim" @click.self="closeSheet">
    <div class="sheet" role="dialog" aria-modal="true" :aria-label="sheetTitle">
      <div class="sheethead">
        <img :src="src(sheetImg)" alt="">
        <div><span class="label">Shelf {{ ui.sheet.slot+1 }}{{ sv ? ' · #'+sv.id : '' }}</span><h3>{{ sheetTitle }}</h3></div>
        <button class="ib" @click="closeSheet" aria-label="Close">✕</button>
      </div>

      <!-- empty shelf: build menu -->
      <template v-if="!sv">
        <div class="secth"><b>Pour an agar plate</b><span class="mono muted">{{ money(SUPPLIES.plate) }} · from your clean fridge slant</span></div>
        <div class="ws" :class="g.hasSab?'ok':'warn'">
          <template v-if="g.hasSab">✓ Working in your still-air box: far fewer spores reach plates and jars.</template>
          <template v-else><span>⚠ You're working on the open counter. Moving air carries mold spores.</span><button class="btn sm" @click="buildSab">Build a still-air box · {{ money(SUPPLIES.sab) }}</button></template>
        </div>
        <div class="choice">
          <button v-for="(m,k) in MEDIA" :key="k" class="opt" @click="pourPlate(ui.sheet.slot,k)"><span><b>{{ m.full }}</b><small>{{ m.blurb }}</small></span><span class="cost" :title="'Real growers: about '+plateDaysFor(k)+' days'">{{ plateDaysFor(k) }} real d<br><small>{{ gameDays(plateDaysFor(k)) }} game d</small></span></button>
        </div>
        <div class="secth"><b>Prep a grain jar</b><span class="mono muted">{{ money(SUPPLIES.jar) }} · rye, field capacity, 1% gypsum</span></div>
        <p v-if="!isOpen('jar')" class="locked">🔒 Grain jars open in week {{ unlockWeek('jar') }}. Get clean plates going first.</p>
        <div class="choice" v-else>
          <button class="opt" @click="prepJar(ui.sheet.slot,'ster')"><span><b>Pressure-cook (sterilize)</b><small>90–120 min at 15 psi, ~{{ CONFIG.equipment.cookerDays }} real day incl. cooling. Waits for a cooker slot ({{ cookerLine }}). Real growers: colonized in {{ SPECIES.bio.jarReal }}.</small></span><span class="cost">cooker</span></button>
          <button class="opt" @click="prepJar(ui.sheet.slot,'past')"><span><b>Hot-water bath (pasteurize)</b><small>Quick: ready in half a real day, no cooker needed.</small></span><span class="cost">½ real d</span></button>
        </div>
        <div class="secth"><b>Prep a substrate bag</b><span class="mono muted">1 kg (2.2 lb) dry substrate</span></div>
        <p v-if="!isOpen('bag')" class="locked">🔒 Substrate bags open in week {{ unlockWeek('bag') }}.</p>
        <div class="subt" v-else>
          <div v-for="(r,k) in BUYABLE" :key="k" class="subrow">
            <span><b>{{ r.name }}</b> <span class="rich" :aria-label="'Richness '+r.rich+' of 4'">{{ '●'.repeat(r.rich)+'○'.repeat(4-r.rich) }}</span><small>{{ r.blurb }} ~{{ fmtLb(r.be*CONFIG.growth.yieldScale) }} first flush · colonizes in {{ r.colReal }} · {{ money(r.cost) }}</small></span>
            <button class="btn sm" @click="prepBag(ui.sheet.slot,k,'ster')" :aria-label="'Sterilize '+r.name">Sterilize</button>
            <button class="btn ghost sm" @click="prepBag(ui.sheet.slot,k,'past')" :aria-label="'Pasteurize '+r.name">Pasteurize</button>
          </div>
        </div>
        <details class="note"><summary>Field notes: sterilize or pasteurize?</summary>
          <ul><li v-for="p in PREP" :key="p[0]"><b>{{ p[0] }}</b> ({{ p[1].toLowerCase() }}): <span class="ok-t">{{ p[2] }}</span>, not {{ p[3].toLowerCase() }}.</li></ul>
          <p class="muted" style="margin-top:6px">Rule of thumb: the more nitrogen in the mix, the more sterile it has to be.</p>
        </details>
      </template>

      <!-- vessel -->
      <template v-else>
        <div class="facts2">
          <div v-for="f in sheetFacts" :key="f[0]"><span>{{ f[0] }}</span><b>{{ f[1] }}</b></div>
        </div>
        <p v-if="sheetNote" style="margin:6px 0">{{ sheetNote }}</p>

        <!-- inoculation sources -->
        <template v-if="sv.state==='ready'">
          <div class="secth"><b>Inoculate from {{ sv.kind==='jar' ? 'a colonized plate' : 'a colonized grain jar' }}</b></div>
          <div class="choice" v-if="sources(sv).length">
            <button v-for="s in sources(sv)" :key="s.v.id" class="opt" :class="{warn:s.v.contam.vis>0}" @click="inoculate(ui.sheet.slot,s.i)">
              <span><b>#{{ s.v.id }} {{ vName(s.v) }}</b><small>{{ s.v.uses }} use{{ s.v.uses>1?'s':'' }} left{{ s.v.contam.vis>0 ? ' · ⚠ mold visible on it' : ' · looks clean' }}</small></span><span class="cost">use</span>
            </button>
          </div>
          <p v-else class="muted">Nothing to spawn from yet. {{ sv.kind==='jar' ? 'Pour a plate and let it colonize.' : 'Colonize a grain jar first.' }}</p>
        </template>

        <div class="choice">
          <button v-if="sv.kind==='jar' && sv.state==='colonizing'" class="opt" :disabled="!canShake(sv)" @click="shake(ui.sheet.slot)"><span><b>Break and shake</b><small>{{ sv.shaken ? 'Already shaken.' : canShake(sv) ? 'Spreads colonized kernels: finishes faster.' : 'Best at about 20–65% colonized.' }}</small></span><span class="cost">free</span></button>
          <button v-if="sv.kind==='plate' && sv.contam.vis>0 && sv.state!=='lost'" class="opt" @click="cutEdge(ui.sheet.slot)"><span><b>Cut a clean edge onto a fresh plate</b><small>Take clean leading-edge mycelium far from the mold. Back to 30%.</small></span><span class="cost">{{ money(CONFIG.economy.plateCost) }}</span></button>
          <button v-if="sv.state==='growing' && sv.prog>=.6" class="opt" @click="harvest(ui.sheet.slot)"><span><b>Harvest early</b><small>Young clusters weigh about {{ Math.round(RULES.stageMult.young*100) }}% of a peak harvest.</small></span><span class="cost">pick</span></button>
          <button v-if="sv.state==='spent' && sv.flush===2" class="opt" @click="soak(ui.sheet.slot)"><span><b>Soak for a third flush</b><small>Tail flushes are small and old blocks invite mold.</small></span><span class="cost">~{{ Math.round(RULES.flushMult[2]*100) }}%</span></button>
          <button v-if="isBlock(sv) && !(sv.contam.vis>0)" class="opt" @click="retire(ui.sheet.slot)"><span><b>Retire block</b><small>Compost it and free the shelf.</small></span><span class="cost">free</span></button>
          <button v-if="canSalvage(sv)" class="opt" @click="salvage(ui.sheet.slot)"><span><b>Cut out the moldy patch (Relaxed)</b><small>Keeps going at {{ Math.round(CONFIG.difficulty.salvageQuality*100) }}% of its yield.</small></span><span class="cost">free</span></button>
          <button v-if="!isBlock(sv) || sv.contam.vis>0" class="opt" @click="toss(ui.sheet.slot)"><span><b>{{ sv.contam.vis>0 ? 'Toss it (moldy)' : 'Toss it' }}</b><small>{{ sv.contam.vis>0 ? 'Contaminated vessels don’t recover. Don’t use it downstream.' : 'Throw it out and free the shelf.' }}</small></span><span class="cost">free</span></button>
        </div>

        <details class="note" v-if="sheetGuide"><summary>Field notes: {{ sheetGuide.name.toLowerCase() }}</summary>
          <ul><li v-for="m in sheetGuide.mistakes.slice(0,4)" :key="m[0]"><b>Avoid:</b> {{ m[0].toLowerCase() }}. {{ m[2] }}</li></ul>
        </details>
      </template>
    </div>
  </div>

  <!-- ============ EVENT MODALS ============ -->
  <div v-if="ui.modal" class="scrim">
    <div class="sheet" role="dialog" aria-modal="true">
      <template v-if="ui.modal.type==='quiz'">
        <span class="label">Market day · a customer asks</span>
        <p class="myth">“{{ ui.modal.m.s }}” Fact or myth?</p>
        <div class="tf" v-if="ui.modal.ans===null">
          <button class="btn ghost big" @click="answer(true)">Fact</button>
          <button class="btn ghost big" @click="answer(false)">Myth</button>
        </div>
        <template v-else>
          <div class="verdict" :class="ui.modal.ans===ui.modal.m.a?'good':'bad'">
            <b>{{ ui.modal.ans===ui.modal.m.a ? 'Right! They tip you '+money(RULES.quizTip)+'.' : 'Not quite.' }}</b>
            {{ ui.modal.m.a ? 'Fact.' : 'Myth.' }} {{ ui.modal.m.w }}
          </div>
          <div class="actions" style="margin-top:12px"><button class="btn" @click="closeModal">Back to the farm</button></div>
        </template>
      </template>
      <template v-else-if="ui.modal.type==='week'">
        <span class="label">Week {{ ui.modal.week }} begins</span>
        <template v-for="c in ui.modal.cards" :key="c.title">
          <h3 style="font-size:24px;margin:8px 0 6px">{{ c.title }}</h3>
          <ul class="weeklines"><li v-for="l in c.lines" :key="l">{{ l }}</li></ul>
        </template>
        <div class="actions" style="margin-top:14px"><button class="btn" @click="closeModal">Got it</button></div>
      </template>
      <template v-else-if="ui.modal.type==='coffee'">
        <span class="label">Day {{ Math.floor(g.day)+1 }} · a neighbor stops by</span>
        <h3 style="font-size:24px;margin:6px 0 8px">Free coffee grounds?</h3>
        <p>They drop off five gallons of coffee grounds from <b>last week’s</b> café runs. “Mushrooms love this stuff!”</p>
        <div class="choice" style="margin-top:12px">
          <button class="opt" @click="coffee(true)"><span><b>Bag it up (free, pasteurized)</b><small>Takes an empty shelf.</small></span><span class="cost">$0</span></button>
          <button class="opt" @click="coffee(false)"><span><b>Thanks, but no</b><small>Politely decline.</small></span><span class="cost">—</span></button>
        </div>
      </template>
    </div>
  </div>

  <!-- ============ PAUSE ============ -->
  <div v-if="ui.screen==='play' && (ui.paused||ui.autoPaused) && !ui.sheet && !ui.modal && !ui.notebook" class="scrim" @click.self="resume">
    <div class="sheet pausebox">
      <h3 style="font-size:28px">Paused</h3>
      <p class="muted">Week {{ g.week }} of {{ CONFIG.time.seasonWeeks }} · {{ money(g.cash) }}</p>
      <div class="actions" style="justify-content:center"><button class="btn big" @click="resume">Resume</button><button class="btn ghost" @click="openNb()">Notebook</button><button class="btn ghost" @click="quit">End season now</button></div>
    </div>
  </div>

  <!-- ============ NOTEBOOK ============ -->
  <div v-if="ui.notebook" class="scrim" @click.self="ui.notebook=false">
    <div class="sheet wide" role="dialog" aria-modal="true" aria-label="Grower's notebook">
      <div class="sheethead" style="grid-template-columns:minmax(0,1fr) auto">
        <div><span class="label">Grower's notebook</span><h3>Pink oyster, <i>Pleurotus djamor</i></h3></div>
        <button class="ib" @click="ui.notebook=false" aria-label="Close">✕</button>
      </div>
      <nav class="nbtabs">
        <button v-for="t in NB_TABS" :key="t[0]" :aria-pressed="ui.nbTab===t[0]" @click="ui.nbTab=t[0]">{{ t[1] }}</button>
      </nav>

      <template v-if="ui.nbTab==='guide'">
        <div class="stages"><button v-for="s in GUIDE" :key="s.id" :aria-pressed="ui.nbStage===s.id" @click="ui.nbStage=s.id">{{ s.name }}</button></div>
        <div style="display:grid;gap:10px">
          <p>{{ nbGuide.what }}</p>
          <p><span class="label">Optimizing for</span><br><b>{{ nbGuide.target }}</b> <span class="muted">Success looks like: {{ nbGuide.success }}</span></p>
          <div><span class="label">Best → acceptable</span><ol style="margin:4px 0 0;padding-left:20px"><li v-for="p in nbGuide.picks" :key="p[0]"><b>{{ p[0] }}</b> <span class="muted">{{ p[1] }}</span></li></ol></div>
          <div v-if="nbGuide.adds.length"><span class="label">Good additives</span><p v-for="a in nbGuide.adds" :key="a[0]" style="font-size:14.5px"><b>{{ a[0] }}</b> · {{ a[1] }}</p></div>
          <span class="label">Common mistakes</span>
          <div class="grid2"><div v-for="m in nbGuide.mistakes" :key="m[0]" class="mistake"><h4>{{ m[0] }}</h4><p class="muted">{{ m[1] }}</p><p class="fix"><b>Fix:</b> {{ m[2] }}</p></div></div>
        </div>
      </template>

      <template v-else-if="ui.nbTab==='lessons'">
        <p class="muted" style="margin-bottom:10px">Lessons you've run into on the farm. Found {{ lessonCount }} of {{ LESSON_IDS.length }}. Locked ones are still out there.</p>
        <div class="grid2">
          <div v-for="id in LESSON_IDS" :key="id" class="mistake" :class="{good:LESSONS[id].good, locked:!ui.lessons[id]}">
            <template v-if="ui.lessons[id]"><h4>{{ LESSONS[id].title }}</h4><p class="muted">{{ LESSONS[id].why }}</p><p class="fix"><b>{{ LESSONS[id].good ? 'Keep doing it:' : 'Fix:' }}</b> {{ LESSONS[id].fix }}</p></template>
            <template v-else><h4>??? · {{ guideName(LESSONS[id].stage) }}</h4><p>Not found yet.</p></template>
          </div>
        </div>
      </template>

      <template v-else-if="ui.nbTab==='cheat'">
        <span class="label">Timeline: real growers vs this game</span>
        <div class="tblwrap" style="margin:6px 0 14px"><table>
          <thead><tr><th>Step</th><th>Real world</th><th>In game (now)</th></tr></thead>
          <tbody><tr v-for="r in timeline" :key="r[0]"><td><b>{{ r[0] }}</b></td><td>{{ r[1] }}</td><td class="mono">{{ r[2] }} game days</td></tr></tbody>
        </table></div>
        <p class="muted" style="font-size:13.5px;margin:-6px 0 14px">1 game day = {{ CONFIG.time.bioDaysPerGameDay }} real growing days. At 1× a game day takes {{ Math.round(CONFIG.time.secondsPerDay/60*10)/10 }} real minutes.</p>
        <span class="label">Numbers to remember</span>
        <div class="nums" style="margin:6px 0 14px"><div v-for="n in NUMS" :key="n[0]+n[1]" class="num"><b>{{ n[0] }}</b><span>{{ n[1] }}</span></div></div>
        <span class="label">Pasteurize or sterilize?</span>
        <div class="tblwrap" style="margin:6px 0 14px"><table>
          <thead><tr><th>Material</th><th>Nutrition</th><th>Do</th><th>Don’t</th></tr></thead>
          <tbody><tr v-for="p in PREP" :key="p[0]"><td><b>{{ p[0] }}</b></td><td>{{ p[1] }}</td><td class="ok-t">{{ p[2] }}</td><td class="no-t">{{ p[3] }}</td></tr></tbody>
        </table></div>
        <span class="label">Myths, busted</span>
        <div class="grid2" style="margin-top:6px"><div v-for="m in MYTHS" :key="m.s" class="mistake" :class="{good:m.a}"><span><span class="chip" :class="m.a?'good':'bad'">{{ m.a ? 'Fact' : 'Myth' }}</span></span><span>{{ m.s }}</span><span class="muted">{{ m.w }}</span></div></div>
      </template>

      <template v-else>
        <p style="margin-bottom:8px">Every picture comes from <code>assets/images.json</code>. Drop a file at the listed path to replace the built-in placeholder. {{ artFound }} of {{ manifest.images.length }} custom images found{{ CONFIG.look.customImages ? '' : ' (custom images are switched off in the admin panel)' }}.</p>
        <div class="tblwrap"><table>
          <thead><tr><th>Id</th><th>File</th><th>Size</th><th>Status</th></tr></thead>
          <tbody><tr v-for="m in manifest.images" :key="m.id"><td><code>{{ m.id }}</code></td><td><code>{{ m.file }}</code></td><td class="mono">{{ m.width }}×{{ m.height }}</td><td :class="manifest.status[m.id]==='loaded'?'ok-t':'muted'">{{ manifest.status[m.id]==='loaded' ? 'custom' : manifest.status[m.id]==='missing' ? 'placeholder' : 'checking…' }}</td></tr></tbody>
        </table></div>
        <p class="muted" style="margin-top:8px;font-size:13.5px">Manifest source: {{ manifest.source }}.</p>
      </template>
    </div>
  </div>

  <div class="toasts" aria-live="polite">
    <div v-for="t in ui.toasts" :key="t.id" class="toast" :class="t.c"><template v-if="t.title"><b>{{ t.title }}</b> · </template>{{ t.text }}</div>
  </div>
  <template v-for="f in ui.floats" :key="f.id">
    <span v-if="f.kind==='t'" class="float" :class="f.c" :style="{left:f.x+'px',top:f.y+'px'}">{{ f.text }}</span>
    <span v-else class="spore" :style="{left:f.x+'px',top:f.y+'px','--dx':f.dx+'px','--dy':f.dy+'px'}"></span>
  </template>
</div>
`;
