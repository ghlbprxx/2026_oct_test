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
          <button class="btn big" v-if="ui.saved" @click="resumeRun">Continue · week {{ ui.saved.week }}, {{ ui.saved.stage }}<template v-if="ui.saved.runType && ui.saved.runType!=='free'"> · {{ ui.saved.runType }}</template></button>
          <button class="btn" :class="ui.saved ? 'ghost' : 'big'" @click="ui.screen='setup'">New game</button>
          <button class="btn ghost" @click="openNb('guide')">Grower's notebook</button>
        </div>
        <div class="facts">
          <div><span class="label">Best operating profit</span><b>{{ ui.best==null ? '—' : money(ui.best) }}</b></div>
          <div><span class="label">Lessons found</span><b>{{ lessonCount }}/{{ LESSON_IDS.length }}</b></div>
          <div><span class="label">Stages</span><b>{{ STAGES.length }} per species</b></div>
        </div>
      </div>
    </div>
    <div class="howto">
      <div><b>1 · One stage a week</b>Each week ends with a review. Do the mentor’s checklist, then make enough good product, and the next stage opens: agar → grain → substrate → fruiting → market.</div>
      <div><b>2 · Gamble on richness</b>Richer substrate means bigger flushes and more mold. The pressure cooker is your bottleneck.</div>
      <div><b>3 · Run the fruiting room</b>Heat, fresh air and mist decide whether blocks pin, and how good the clusters look.</div>
      <div><b>4 · Real numbers</b>Time is compressed (1 game day ≈ {{ CONFIG.time.bioDaysPerGameDay }} real growing days), but everything shows real-world durations, prices in $/lb, and real techniques.</div>
    </div>
  </section>

  <!-- ============ SETUP ============ -->
  <section v-else-if="ui.screen==='setup'" class="title">
    <div class="card">
      <span class="label">New game</span>
      <h2 style="font-size:clamp(28px,4vw,40px);margin:6px 0 4px">Set up your run</h2>
      <p class="muted">Pick a mode, a play style, and how harsh mold should be. You can switch play style any time from the pause menu.</p>
      <div class="playstyle" role="group" aria-label="Mode">
        <span class="label">Mode</span>
        <div class="seg four">
          <button v-for="r in RUN_TYPES_UI" :key="r.id" :data-run="r.id" :aria-pressed="ui.runType===r.id" :disabled="r.locked" @click="setRunType(r.id)"><b>{{ r.locked ? '🔒 ' : '' }}{{ r.name }}<span v-if="r.id==='tutorial' && !ui.tutorialDone" class="chip good" style="margin-left:6px">new player</span></b><small>{{ r.blurb }}</small></button>
        </div>
      </div>
      <div class="playstyle" role="group" aria-label="Play style" style="margin-top:14px">
        <span class="label">Play style</span>
        <div class="seg two">
          <button :aria-pressed="ui.playMode==='basic'" @click="setPlayMode('basic')"><b>Basic</b><small>Quick play: recommended choices first, auto climate and market, no tuning panel.</small></button>
          <button :aria-pressed="ui.playMode==='advanced'" @click="setPlayMode('advanced')"><b>Advanced</b><small>Every option: prices, market booking, all gear, fine climate control, the admin panel.</small></button>
        </div>
      </div>
      <span class="label" style="display:block;margin-top:14px">Difficulty</span>
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
      <div class="hs day"><span class="label">Week {{ g.week }} · day {{ dayOfWeek }}</span><b>{{ clockText }}</b><div class="mini" title="Week progress until the weekly review"><i :style="{width:weekPct+'%'}"></i></div></div>
      <div class="hs cash" ref="cash"><span class="label">Cash</span><b>{{ money(g.cash) }}</b></div>
      <div class="hs"><span class="label">House</span><b>{{ houseTemp }}°F<span v-if="g.snap" class="chip bad" style="margin-left:4px">cold snap</span></b></div>
      <div class="hs" v-if="roomOpen"><span class="label">Market</span><b>{{ marketIn<=0.05 ? 'today' : 'in '+marketIn.toFixed(1)+'d' }}</b></div>
      <div class="hs stagechip"><span class="label">{{ sp.name }} · stage {{ Math.min(g.stage+1, ladder.length) }}/{{ ladder.length }}</span><b>{{ stage.name }}<span v-if="g.speciesDone" class="chip good" style="margin-left:4px">mastered</span></b></div>
      <div class="hudbtns">
        <div class="speeds" role="group" aria-label="Playback speed">
          <button class="ib" @click="togglePause" :aria-pressed="ui.paused" :aria-label="ui.paused?'Resume':'Pause'" title="Pause (Space)">{{ ui.paused ? '▶' : '⏸' }}</button>
          <button v-for="sp in SPEEDS" :key="sp" class="sp" :aria-pressed="!ui.paused && ui.speed===sp" @click="setSpeed(sp)" :title="'Speed '+sp+'× ( [ and ] )'">{{ sp }}×</button>
        </div>
        <button class="ib shopbtn" @click="openShop" aria-label="Equipment shop" title="Shop (S)">🛒<small>Shop</small></button>
        <button class="ib" @click="openNb()" aria-label="Grower's notebook" title="Notebook (N)">📓</button>
        <button class="ib" @click="toggleMute" :aria-label="ui.muted?'Unmute':'Mute'" title="Mute (M)">{{ ui.muted ? '🔇' : '🔊' }}</button>
      </div>
    </header>
    <button class="tip" v-if="showTip" aria-live="polite" @click="doTip"><b>Next:</b> {{ tip.t }}<span v-if="tip.slot!=null || tip.room || tip.dry || tip.heat || tip.shop" class="go"> →</span></button>
    <div v-else style="height:10px"></div>

    <!-- side-view cutaway: upstairs closet + tent, downstairs kitchen + garage, yard out the back door -->
    <main class="house" aria-label="Your home, side view">
      <div class="roof" aria-hidden="true"></div>
      <section v-for="z in ZONES" :key="z.id" class="zone" :class="['z-'+z.id, {locked:!zoneIsOpen(z.id), hot:ui.hover!=null && zoneOfSpot(ui.hover)===z.id}]" :data-zone="z.id" :aria-label="z.name">
        <img class="zbg" :src="src(z.img)" alt="" aria-hidden="true">
        <header class="zhead">
          <b>{{ z.name }}</b>
          <span class="zread" v-if="zoneIsOpen(z.id)">{{ readout(z.id).temp }} · {{ readout(z.id).rh }}<template v-if="z.id==='tent' || readout(z.id).exact"> · {{ readout(z.id).air }}</template></span>
        </header>
        <div class="ambient" aria-hidden="true">
          <i v-if="z.id==='tent' && g.gear.humidifier" class="mist" v-for="k in 5" :key="k" :style="{'--k':k}"></i>
          <i v-if="z.id==='garage' && cooking" class="steam" v-for="k in 3" :key="'s'+k" :style="{'--k':k}"></i>
          <img v-if="z.id==='garage' && g.cookers.length" class="zgear" :src="src(g.cookers[g.cookers.length-1].id==='cooker23'?'gear_cooker23':'gear_cooker16')" alt="">
          <img v-if="z.id==='kitchen' && (g.gear.sab || g.gear.flowhood)" class="zgear" :src="src(g.gear.flowhood?'gear_flowhood':'gear_sab')" alt="">
        </div>
        <div class="spots">
          <button v-for="i in spotsIn(z.id)" :key="i+'-'+(g.slots[i]?g.slots[i].id:0)" class="slot" :class="[slotCls(g.slots[i]), g.slots[i] ? 'sp-'+(g.slots[i].sp||'pink-oyster') : '', {locked:!spotIsOpen(i)}]" :data-slot="i"
                  @click="tapSlot(i)" @mouseenter="ui.hover=i" @mouseleave="ui.hover=null" @focus="ui.hover=i" @blur="ui.hover=null" :aria-label="slotAria(g.slots[i],i)">
            <template v-if="g.slots[i]">
              <span class="art"><img v-for="(l,k) in layers(g.slots[i])" :key="k" :src="src(l.id)" :style="l.style" alt=""></span>
              <span class="slbl">#{{ g.slots[i].id }} {{ vName(g.slots[i]) }}</span>
              <span class="sbadge" v-if="badge(g.slots[i])">{{ badge(g.slots[i]) }}</span>
              <span class="fitwarn" v-else-if="fitOf(g.slots[i]).level==='bad'" :title="fitOf(g.slots[i]).note">⚠</span>
              <span class="sstat">{{ status(g.slots[i]) }}</span>
              <span class="sbar"><i :style="{width:barPct(g.slots[i])+'%',background:barColor(g.slots[i])}"></i></span>
              <span v-if="CONFIG.dev.debug" class="dbg">{{ dbg(g.slots[i]) }}</span>
            </template>
            <span v-else-if="spotIsOpen(i)" class="empty">+<small>Empty</small></span>
            <span v-else-if="zoneIsOpen(z.id)" class="empty" title="Buy a wire shelf rack in the shop">🔒<small>Shelf rack</small></span>
            <span v-else class="empty">🔒</span>
            <span class="key" v-if="keyFor(i)">{{ keyFor(i) }}</span>
          </button>
        </div>
        <div v-if="!zoneIsOpen(z.id)" class="zlock">{{ lockText(z) }}</div>
      </section>
    </main>
    <div class="spotinfo" aria-live="polite">
      <template v-if="ui.hover!=null">
        <b>{{ zoneById(zoneOfSpot(ui.hover)).name }}</b> · {{ readout(zoneOfSpot(ui.hover)).temp }} · {{ readout(zoneOfSpot(ui.hover)).rh }} · {{ readout(zoneOfSpot(ui.hover)).air }} · cleanliness: {{ readout(zoneOfSpot(ui.hover)).clean }}.
        <span class="muted">{{ zoneById(zoneOfSpot(ui.hover)).purpose }}</span>
        <span v-if="g.slots[ui.hover] && fitOf(g.slots[ui.hover]).note" :class="fitOf(g.slots[ui.hover]).level==='bad'?'no-t':''"> {{ fitOf(g.slots[ui.hover]).note }}</span>
      </template>
      <span v-else class="muted">Hover or focus a spot to read its conditions. {{ g.gear.hygrometer ? '' : 'Exact numbers need a hygrometer (shop).' }}</span>
    </div>

    <div class="panels">
      <div class="card mastery" id="mastery">
        <div class="cardh"><span class="label">Mastering · {{ stage.name }}</span><span class="mono" style="font-size:12px">week {{ g.week }}<template v-if="g.weeksRepeated"> · {{ g.weeksRepeated }} repeated</template></span></div>
        <template v-if="!g.speciesDone">
          <p class="muted" style="font-size:13px;margin-bottom:6px">1 · The mentor’s checklist</p>
          <ul class="checks"><li v-for="it in stageList" :key="it.key" :class="{done:it.done}"><span class="tick" :class="{on:it.done}" aria-hidden="true">{{ it.done ? '✓' : '' }}</span><span>{{ it.text }} <span class="mono muted">{{ it.have >= 1 || it.n > 1 ? (Math.floor(it.have*10)/10)+'/'+it.n : '' }}</span></span></li></ul>
          <p class="muted" style="font-size:13px;margin:8px 0 4px">2 · Then: {{ need }} {{ stage.unitName }}</p>
          <div class="mini" :class="{dim:!listDone}"><i :style="{width:Math.min(100,g.units/need*100)+'%'}"></i></div>
          <p class="mono" style="font-size:12px;margin-top:3px">{{ listDone ? (Math.floor(g.units*10)/10)+' / '+need : 'counts once the checklist is done' }}</p>
          <p class="hint" style="font-size:12.5px;margin-top:6px">Verdict at the weekly review (end of day 5).</p>
        </template>
        <template v-else>
          <p>{{ sp.name }} mastered.<template v-if="nextSp"> Next up: <b>{{ nextSp.name }}</b> (<i>{{ nextSp.latin }}</i>): {{ nextSp.climateText }}. Stages you already mastered need half the units.</template><template v-else> All three species mastered. Keep growing in free play.</template></p>
          <div class="actions" style="margin-top:8px" v-if="nextSp"><button class="btn sm" data-act="next-species" @click="startNextSpecies">Start {{ nextSp.name.toLowerCase() }}</button><span class="hint" style="align-self:center">or keep growing {{ sp.short }} first</span></div>
        </template>
      </div>

      <div class="card" id="automation" v-if="g.mastered.length || autoFee">
        <div class="cardh"><span class="label">Automation · optional</span><span class="mono" style="font-size:12px">{{ money(autoFee) }}/week</span></div>
        <p class="hint" style="font-size:12.5px;margin-bottom:6px">Hand off a stage you’ve mastered on this species. Fees are paid at each weekly review.</p>
        <div class="prod" v-for="a in autos" :key="a.id" :class="{locked:!a.ok}" :data-auto="a.id">
          <div><b>{{ a.name }}</b><small v-if="a.ok">{{ a.effect }} {{ money(a.fee) }}/week<template v-if="a.done"> · {{ a.done }} tasks so far</template></small><small v-else>Master {{ (a.stageName||'').toLowerCase() }} on this species first.</small></div>
          <button v-if="a.ok" class="btn sm" :class="{ghost:!a.on}" :aria-pressed="a.on" @click="toggleAuto(a.id)">{{ a.on ? 'On' : 'Off' }}</button>
        </div>
      </div>

      <div class="card" id="webshop">
        <div class="cardh"><span class="label">Online shop</span><span class="mono" style="font-size:12px">Reputation {{ Math.round(g.rep) }}/100</span></div>
        <div class="mini rep"><i :style="{width:g.rep+'%'}"></i></div>
        <div class="prod" v-for="p in products" :key="p.id" :class="{locked:!p.open}">
          <div><b>{{ p.name }}</b><small v-if="p.open">{{ p.stock }} in stock · {{ money(p.price) }} · ~{{ p.rate.toFixed(1) }} sales/game day</small><small v-else>Opens when you master {{ p.stageName.toLowerCase() }}.</small></div>
          <div class="pricer" v-if="p.open && advanced">
            <button class="ib" @click="bumpPrice(p.id,-1)" :aria-label="'Lower price of '+p.name">−</button>
            <span class="mono" :title="'Base price '+money(p.base)">{{ money(p.price) }}</span>
            <button class="ib" @click="bumpPrice(p.id,1)" :aria-label="'Raise price of '+p.name">+</button>
          </div>
        </div>
        <p class="hint" style="font-size:12.5px;margin-top:6px">List colonized plates, jars or kits from their spot (tap → List). Hidden mold ships too: refunds cost reputation.</p>
        <div class="actions" style="margin-top:6px" v-if="products.find(x=>x.id==='dried').open"><button class="btn sm" :disabled="g.dried*2.2046<1" @click="listDried">List dried mushrooms online</button></div>
      </div>

      <div class="card" id="room">
        <div class="cardh"><span class="label">Grow tent</span><span class="mono" style="font-size:12px" v-if="g.gear.tent">{{ readout('tent').exact ? 'Conditions '+Math.round(tentEnv.score*100)+'%' : 'Buy a hygrometer to read it' }}</span></div>
        <template v-if="!g.gear.tent">
          <p style="font-size:14.5px">{{ roomOpen ? 'Colonized blocks need a humid tent with fresh air to fruit. It’s in the shop.' : 'Fruiting opens at the '+STAGES[3].name.toLowerCase()+' stage. For now, plates and jars incubate best in the closet.' }}</p>
          <div class="actions" style="margin-top:8px" v-if="roomOpen"><button class="btn sm" @click="openShop">Open the shop</button></div>
        </template>
        <template v-else>
          <div class="actions" style="margin:4px 0 6px"><button class="btn sm" @click="autoClimate">Set for {{ sp.climate ? sp.short : 'pinks' }}</button><span class="hint" style="align-self:center">{{ (sp.climate||{label:'heat mat Low, fan 5'}).label }}, mist {{ g.gear.humidifier ? (sp.climate||{mist:98}).mist : 88 }}</span></div>
          <details class="note" :open="advanced" style="margin-top:4px"><summary>Fine-tune heat, air and mist</summary>
          <div class="ctl" v-if="g.gear.heatmat">
            <div class="row"><label>Heat mat</label><span class="mono" style="font-size:12px">{{ money(g.heater*CONFIG.economy.heaterCost,2) }}/game day</span></div>
            <div class="seg" role="group" aria-label="Heat mat">
              <button v-for="h in [0,1,2]" :key="h" :aria-pressed="g.heater===h" @click="setHeater(h)">{{ ['Off','Low','High'][h] }}</button>
            </div>
            <span class="hint">House {{ houseTemp }}°F + {{ RULES.heaterStep }}°F per step. {{ sp.climate ? sp.name+' wants '+sp.fruiting.bestLo+'–'+sp.fruiting.bestHi+'°F.' : 'Pinks want 70–85°F.' }}</span>
          </div>
          <p v-else class="hint" style="font-size:13px">No heat mat: the tent sits at house temperature ({{ houseTemp }}°F).</p>
          <div class="ctl">
            <div class="row"><label for="fae">Fan (fresh air)</label><span class="chip" v-if="g.gear.co2" :class="cS[0]">{{ cS[1] }}</span></div>
            <input id="fae" type="range" min="0" max="10" step="1" v-model.number="g.fae">
            <span class="hint">More air lowers CO₂ but dries the tent.</span>
          </div>
          <div class="ctl">
            <div class="row"><label for="mist">Mist</label><span class="chip" v-if="g.gear.hygrometer" :class="hS[0]">{{ hS[1] }}</span></div>
            <input id="mist" type="range" min="60" :max="g.gear.humidifier?110:88" step="1" v-model.number="g.mist">
            <span class="hint">{{ g.gear.humidifier ? 'Aim for 85–95% RH. Above ~96% invites bacteria.' : 'Hand misting tops out around 88%. A humidifier goes higher.' }}</span>
          </div>
          </details>
        </template>
      </div>

      <div class="card">
        <div class="cardh"><span class="label">Pressure cookers</span><span class="mono muted" style="font-size:12px">{{ g.queue.length }} queued</span></div>
        <p v-if="!g.cookers.length" style="font-size:14px">None yet. Grain must be sterilized: the 16 qt takes 7 jars, the 23 qt also fits 2 grow bags.</p>
        <div v-for="k in g.cookers" :key="k.id" class="gear" style="margin-top:6px">
          <img :src="src(k.id==='cooker23'?'gear_cooker23':'gear_cooker16')" alt="">
          <div>
            <div class="cardh" style="margin:0"><b>{{ EQUIPMENT[k.id].name }}</b><span class="mono" style="font-size:12px">{{ k.batch.length }} in</span></div>
            <div class="mini" style="margin:5px 0"><i :style="{width:(k.batch.length?k.t/CONFIG.equipment.cookerDays*100:0)+'%'}"></i></div>
            <span class="muted" style="font-size:13px">{{ k.batch.length ? 'Sterilizing · '+Math.max(0,CONFIG.equipment.cookerDays-k.t).toFixed(1)+' real days left' : 'Idle' }}</span>
          </div>
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
        <div class="actions" style="margin-top:10px"><button class="btn sm" :disabled="!g.lots.length || !g.gear.dehydrator" @click="dryAll">{{ g.gear.dehydrator ? 'Dehydrate all fresh (D)' : 'Needs a dehydrator' }}</button></div>
        <div class="ctl" style="margin-top:10px">
          <div class="row"><label>Farmers market</label><span v-if="!advanced" class="chip good">Auto</span></div>
          <div class="seg" v-if="advanced" role="group" aria-label="Market booking">
            <button v-for="m in ['auto','book','skip']" :key="m" :aria-pressed="(g.marketMode||'auto')===m" @click="setMarket(m)">{{ {auto:'Auto',book:'Always',skip:'Skip'}[m] }}</button>
          </div>
          <span class="hint">Every {{ CONFIG.economy.marketEvery }} game days. Booth {{ money(CONFIG.economy.boothFee) }}{{ (g.marketMode||'auto')==='auto' ? ', booked only when your haul is worth 3× the fee' : ', paid when you bring product' }}. Fresh sells only here (up to {{ RULES.marketDemandLb }} lb a day).</span>
        </div>
      </div>

      <div class="card">
        <div class="cardh"><span class="label">Grow log</span></div>
        <ul class="log"><li v-for="(l,i) in g.log.slice(0,14)" :key="i" :class="l.c"><span class="mono muted">d{{ l.d }}</span><span>{{ l.t }}</span></li></ul>
      </div>
    </div>
  </section>

  <!-- ============ REPORT ============ -->
  <section v-else-if="ui.screen==='report' && g" class="report">
    <div class="card">
      <span class="label">Season report · {{ g.endReason==='broke' ? 'ran out of money in week '+g.week : CONFIG.time.seasonWeeks+' weeks' }} · {{ g.mode }}{{ ui.newBest ? ' · new best' : '' }}</span>
      <div class="rank">{{ g.endReason==='broke' ? 'Out of money' : 'Season over' }}</div>
      <p>{{ g.endReason==='broke' ? 'Nothing left growing and no cash for supplies. Read the lessons below, then try again (Relaxed starts with more cash).' : '' }} Stages mastered: {{ g.mastered.length }}/{{ STAGES.length }} in {{ g.week }} weeks.</p>
      <div class="stats">
        <div class="stat"><span class="label">Operating profit</span><b>{{ money(profit) }}</b></div>
        <div class="stat"><span class="label">Gear bought (yours)</span><b>{{ money(g.stats.gear || 0) }}</b></div>
        <div class="stat"><span class="label">Harvested</span><b>{{ fmtLb(g.stats.harvestKg) }}</b></div>
        <div class="stat"><span class="label">Sold fresh</span><b>{{ fmtLb(g.stats.freshKg) }}</b></div>
        <div class="stat"><span class="label">Sold dried</span><b>{{ fmtLb(g.stats.driedKg) }}</b></div>
        <div class="stat"><span class="label">Rotted</span><b>{{ fmtLb(g.stats.rotKg) }}</b></div>
        <div class="stat"><span class="label">Lost to mold</span><b>{{ lostTotal }}</b></div>
        <div class="stat"><span class="label">Clusters dropped</span><b>{{ g.stats.dropped }}</b></div>
        <div class="stat"><span class="label">Heating bill</span><b>{{ money(g.stats.energy) }}</b></div>
      </div>
      <div class="actions"><button class="btn" @click="ui.screen='setup'">New game</button><button class="btn ghost" @click="openNb('lessons')">Notebook</button><button class="btn ghost" @click="ui.screen='title'">Title</button></div>
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
      <template v-if="!sv && isYard">
        <div class="secth"><b>Build a wine cap bed</b><span class="mono muted">a 4×8 ft bed, about a wheelbarrow of material</span></div>
        <p class="muted" style="font-size:13.5px;margin-bottom:8px">Outdoors: it colonizes with the weather over weeks, needs to stay moist (rain or the hose), then flushes after wet spells for years.</p>
        <div class="choice">
          <button v-for="(b,k) in sp.beds" :key="k" class="opt" :data-bed="k" @click="buildBed(ui.sheet.slot,k)"><span><b>{{ b.name }}</b><small>{{ b.blurb }} ~{{ fmtLb(b.be*CONFIG.growth.yieldScale) }} per flush · colonizes in {{ b.colReal }}{{ b.maxFlush ? ' · '+b.maxFlush+' flushes' : '' }}</small></span><span class="cost">{{ b.cost ? money(b.cost) : 'free' }}</span></button>
        </div>
      </template>
      <template v-else-if="!sv">
        <div class="secth"><b>Pour an agar plate</b><span class="mono muted">{{ money(SUPPLIES.plate) }} · from your clean fridge slant</span></div>
        <div class="ws" :class="workspaceName!=='open'?'ok':'warn'">
          <template v-if="workspaceName==='hood'">✓ Working at your flow hood: almost no spores reach plates and jars.</template>
          <template v-else-if="workspaceName==='sab'">✓ Working in your still-air box: far fewer spores reach plates and jars.</template>
          <template v-else><span>⚠ You're working on the open counter. Moving air carries mold spores.</span><button class="btn sm" @click="buyGear('sab')">Buy a still-air box · {{ money(priceOf('sab')) }}</button></template>
        </div>
        <div class="zonefit" v-if="sheetZoneNote">{{ sheetZoneNote }}</div>
        <div class="choice">
          <button v-for="(m,k) in mediaShown" :key="k" class="opt" @click="pourPlate(ui.sheet.slot,k)"><span><b>{{ m.full }}</b><small>{{ m.blurb }}</small></span><span class="cost" :title="'Real growers: about '+plateDaysFor(k)+' days'">{{ plateDaysFor(k) }} real d<br><small>{{ gameDays(plateDaysFor(k)) }} game d</small></span></button>
        </div>
        <template v-if="isOpen('lc')">
          <div class="secth"><b>Mix a liquid culture <span class="chip">Expert</span></b><span class="mono muted">{{ money(SUPPLIES.lc) }} · pressure-cooked, then seeded from a plate</span></div>
          <div class="choice">
            <button v-for="(m,k) in LC_MEDIA" :key="k" class="opt" :data-lc="k" :disabled="!g.cookers.length" @click="prepLC(ui.sheet.slot,k)"><span><b>{{ m.full }}</b><small>{{ g.cookers.length ? '' : 'Needs a pressure cooker (shop). ' }}{{ m.blurb }}</small></span><span class="cost">cooker</span></button>
          </div>
        </template>
        <div class="secth"><b>Prep a grain jar</b><span class="mono muted">{{ money(SUPPLIES.jar) }} · rye, field capacity, 1% gypsum</span></div>
        <p v-if="!isOpen('jar')" class="locked">🔒 Grain jars open when you master agar. Get clean plates going first.</p>
        <div class="choice" v-else>
          <button class="opt" :disabled="!g.cookers.length" @click="prepJar(ui.sheet.slot,'ster')"><span><b>Pressure-cook (sterilize)</b><small>{{ g.cookers.length ? '' : 'Needs a pressure cooker (shop). ' }}90–120 min at 15 psi, ~{{ CONFIG.equipment.cookerDays }} real day incl. cooling ({{ cookerLine }}). Real growers: colonized in {{ sp.bio.jarReal }}.</small></span><span class="cost">cooker</span></button>
          <button class="opt" v-if="showAll" @click="prepJar(ui.sheet.slot,'past')"><span><b>Hot-water bath (pasteurize)</b><small>Quick: ready in half a real day, no cooker needed.</small></span><span class="cost">½ real d</span></button>
        </div>
        <div class="secth"><b>{{ sp.bagFruits ? 'Prep a substrate bag' : 'Prep a sawdust spawn bag' }}</b><span class="mono muted">{{ sp.bagFruits ? '1 kg (2.2 lb) dry substrate' : 'colonizes, then inoculates a yard bed' }}</span></div>
        <p v-if="!isOpen('bag')" class="locked">🔒 Substrate bags open when you master grain spawn.</p>
        <div class="subt" v-else>
          <div v-for="(r,k) in bagsShown" :key="k" class="subrow">
            <span><b>{{ r.name }}</b> <span class="rich" :aria-label="'Richness '+r.rich+' of 4'">{{ '●'.repeat(r.rich)+'○'.repeat(4-r.rich) }}</span><small>{{ r.blurb }} ~{{ fmtLb(r.be*CONFIG.growth.yieldScale) }} first flush · colonizes in {{ r.colReal }} · {{ money(r.cost) }}</small></span>
            <button class="btn sm" v-if="showAll || r.rich >= 3" :disabled="!canBags" @click="prepBag(ui.sheet.slot,k,'ster')" :aria-label="'Sterilize '+r.name" :title="canBags?'':'Bags only fit the 23 qt canner'">Sterilize</button>
            <button class="btn ghost sm" v-if="showAll || r.rich < 3" @click="prepBag(ui.sheet.slot,k,'past')" :aria-label="'Pasteurize '+r.name">Pasteurize</button>
          </div>
        </div>
        <button v-if="!showAll" class="linkbtn" @click="ui.moreOpts=true">Show all options (other agar media, pasteurized grain, more substrates)</button>
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
        <button v-if="sv.kind==='bed' && !['spent','lost'].includes(sv.state)" class="opt" data-act="water" @click="waterBed(ui.sheet.slot)"><span><b>Water the bed</b><small>{{ sv.water >= 0.5 ? 'It’s still moist. Rain does this for free.' : 'Dry beds stall and let competitor fungi in.' }}</small></span><span class="cost">💧</span></button>
        <button v-if="sheetProduct" class="opt" :disabled="!sheetProduct.open" @click="listIt(ui.sheet.slot)"><span><b>List in the online shop · {{ money(sheetProduct.price) }}</b><small>{{ sheetProduct.open ? sheetProduct.name+'. Sells over time; hidden mold means a refund.' : 'Opens when you master '+sheetProduct.stageName.toLowerCase()+'.' }}</small></span><span class="cost">🛍</span></button>
        <div class="zonefit" :class="sheetFit.level" v-if="sheetFit.note">{{ sheetZone.short }}: {{ sheetFit.note }}</div>
        <details class="note" v-if="moveTargets.length && !['cooking','queued'].includes(sv.state)" :open="sheetFit.level!=='good' || isBlock(sv)">
          <summary>Move to another spot</summary>
          <div class="movegrid">
            <button v-for="t in moveTargets" :key="t.i" :data-zone="zoneOfSpot(t.i)" class="opt" :class="{warn:t.fit.level==='bad'}" @click="moveTo(ui.sheet.slot,t.i)"><span><b>{{ t.zone }}</b><small>{{ t.fit.level==='good' ? '✓ good fit' : t.fit.level==='ok' ? 'OK' : '⚠ poor fit' }}</small></span><span class="cost">→</span></button>
          </div>
        </details>

        <!-- inoculation sources -->
        <template v-if="sv.state==='ready'">
          <div class="secth"><b>Inoculate from {{ sv.kind==='jar' ? (isOpen('lc') ? 'a colonized plate or liquid culture' : 'a colonized plate') : sv.kind==='lc' ? 'a colonized plate' : sv.kind==='bed' ? 'a colonized spawn bag' : 'a colonized grain jar' }}</b></div>
          <div class="choice" v-if="sources(sv).length">
            <button v-for="s in sources(sv)" :key="s.v.id" class="opt" :class="{warn:s.v.contam.vis>0}" @click="inoculate(ui.sheet.slot,s.i)">
              <span><b>#{{ s.v.id }} {{ vName(s.v) }}</b><small>{{ s.v.uses }} use{{ s.v.uses>1?'s':'' }} left{{ s.v.contam.vis>0 ? ' · ⚠ mold visible on it' : ' · looks clean' }}</small></span><span class="cost">use</span>
            </button>
          </div>
          <p v-else class="muted">Nothing to spawn from yet. {{ sv.kind==='jar' ? 'Pour a plate and let it colonize.' : sv.kind==='bed' ? 'Colonize a sawdust spawn bag first (indoors).' : 'Colonize a grain jar first.' }}</p>
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
  <div v-if="ui.modal && ui.modal.type==='scene' && scLine" class="scrim talk" @click.self="sceneNext">
    <div class="dialog" role="dialog" aria-modal="true" :aria-label="'Story: '+cast(scLine.who).name" :data-scene="ui.modal.key">
      <img class="face" :class="scLine.who" :src="src(cast(scLine.who).portrait)" :alt="cast(scLine.who).alt" :key="scLine.who">
      <div class="said">
        <span class="who">{{ cast(scLine.who).name }} <small>· {{ cast(scLine.who).role }}</small></span>
        <p class="bubble" :data-line="scLine.id" :key="scLine.id">{{ scLine.text }}</p>
        <div class="talkbar">
          <span class="dots" aria-hidden="true"><i v-for="(l,k) in ui.modal.lines" :key="k" :class="{on:k===ui.modal.i}"></i></span>
          <button v-if="ui.modal.i < ui.modal.lines.length-1" class="linkbtn" @click="sceneSkip">Skip</button>
          <button class="btn sm" @click="sceneNext" autofocus>{{ ui.modal.i < ui.modal.lines.length-1 ? 'Next ›' : 'OK' }}</button>
        </div>
      </div>
    </div>
  </div>
  <div v-else-if="ui.modal" class="scrim">
    <div class="sheet" role="dialog" aria-modal="true">
      <template v-if="ui.modal.type==='quiz' && ui.modal.guru">
        <span class="label">Market day · a customer shows you the forum</span>
        <div class="mentor guru">
          <img :src="src(cast('guru').portrait)" :alt="cast('guru').alt">
          <div><span class="who">{{ cast('guru').name }} <small>· {{ cast('guru').role }}</small></span>
            <p class="bubble" :data-line="ui.modal.guru.open.id">{{ ui.modal.guru.open.text }} <b :data-line="ui.modal.guru.claim.id">{{ ui.modal.m.s }}</b></p></div>
        </div>
        <p class="muted" style="margin:2px 0 10px">The customer wants to know: is the guru right?</p>
        <div class="tf" v-if="ui.modal.ans===null">
          <button class="btn ghost big" @click="answer(true)">Guru’s right</button>
          <button class="btn ghost big" @click="answer(false)">Guru’s wrong</button>
        </div>
        <template v-else>
          <div class="verdict" :class="ui.modal.ans===ui.modal.m.a?'good':'bad'">
            <b>{{ ui.modal.ans===ui.modal.m.a ? 'You called it. The customer tips you '+money(RULES.quizTip)+'.' : 'Not quite.' }}</b>
            {{ ui.modal.m.a ? 'Fact.' : 'Myth.' }} {{ ui.modal.m.w }}
          </div>
          <div class="mentor" style="margin-top:10px">
            <img :src="src(cast('mentor').portrait)" :alt="cast('mentor').alt">
            <p class="bubble" :data-line="ui.modal.guru.react.id">{{ ui.modal.guru.react.text }}</p>
          </div>
          <div class="actions" style="margin-top:12px"><button class="btn" @click="closeModal">Back to the farm</button></div>
        </template>
      </template>
      <template v-else-if="ui.modal.type==='quiz'">
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
      <template v-else-if="ui.modal.type==='review'">
        <span class="label">Weekly review · week {{ ui.modal.r.week }} · {{ ui.modal.r.stageName }}</span>
        <h3 class="verdict-h" :class="ui.modal.r.mastered?'ok':'again'" style="font-size:26px;margin:6px 0 10px">{{ ui.modal.r.mastered ? (ui.modal.r.last ? 'Species mastered!' : 'Stage mastered!') : 'Not yet: repeat the week' }}</h3>
        <div class="mentor rc">
          <img :src="src('portrait_mentor')" alt="Your neighbor, a retired mycologist">
          <p class="bubble" :data-line="ui.modal.r.mentor.id">{{ ui.modal.r.mentor.text }}</p>
        </div>
        <div class="stats rc">
          <div class="stat"><span class="label">Money in</span><b>{{ money(ui.modal.r.money.in) }}</b></div>
          <div class="stat"><span class="label">Money out</span><b>{{ money(ui.modal.r.money.out) }}</b></div>
          <div class="stat"><span class="label">Clean rate</span><b>{{ ui.modal.r.cleanRate==null ? '—' : Math.round(ui.modal.r.cleanRate*100)+'%' }}</b></div>
          <div class="stat"><span class="label">Good plates / jars / bags</span><b>{{ ui.modal.r.yield.plates }} / {{ ui.modal.r.yield.jars }} / {{ ui.modal.r.yield.bags }}</b></div>
          <div class="stat" v-if="ui.modal.r.yield.harvestKg"><span class="label">Harvested</span><b>{{ fmtLb(ui.modal.r.yield.harvestKg) }}</b></div>
          <div class="stat" v-if="ui.modal.r.yield.rotKg"><span class="label">Rotted</span><b>{{ fmtLb(ui.modal.r.yield.rotKg) }}</b></div>
          <div class="stat" v-if="ui.modal.r.automation && (ui.modal.r.automation.paid || ui.modal.r.automation.tasks)"><span class="label">Automation</span><b>{{ ui.modal.r.automation.tasks }} tasks · {{ money(ui.modal.r.automation.paid) }}</b></div>
          <div class="stat" v-if="ui.modal.r.yield.sales"><span class="label">Shop sales / refunds</span><b>{{ ui.modal.r.yield.sales }} / {{ ui.modal.r.yield.refunds }}</b></div>
        </div>
        <div class="rc" v-if="Object.keys(ui.modal.r.causes).length">
          <span class="label">Mold this week</span>
          <div class="grid2" style="margin-top:6px"><div v-for="(n,why) in ui.modal.r.causes" :key="why" class="mistake"><h4>{{ n }} × {{ LESSONS[why].title }}</h4><p class="fix"><b>Fix:</b> {{ LESSONS[why].fix }}</p></div></div>
        </div>
        <div class="rc">
          <span class="label">Checklist · then {{ ui.modal.r.need }} {{ ui.modal.r.unitName }}</span>
          <ul class="checks" style="margin-top:6px"><li v-for="it in ui.modal.r.checklist" :key="it.key" :class="{done:it.done}"><span class="tick" :class="{on:it.done}">{{ it.done ? '✓' : '' }}</span><span>{{ it.text }}</span></li></ul>
          <p class="mono" style="font-size:12.5px;margin-top:4px">Units: {{ Math.floor(ui.modal.r.units*10)/10 }} / {{ ui.modal.r.need }}</p>
        </div>
        <div class="rc" v-if="ui.modal.r.tips.length"><span class="label">Tips for next week</span><ul class="weeklines" style="margin-top:6px"><li v-for="t in ui.modal.r.tips" :key="t">{{ t }}</li></ul></div>
        <div class="actions rc" style="margin-top:14px"><button class="btn" @click="closeModal">{{ ui.modal.r.mastered ? (ui.modal.r.last ? 'Keep growing' : 'On to '+nextStageName(ladder.findIndex(x=>x.id===ui.modal.r.stage)+1).toLowerCase()) : 'Start week '+(ui.modal.r.week+1) }}</button><button class="btn ghost" @click="openNb('lessons')">Notebook</button></div>
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
      <p class="muted" style="font-size:13.5px">Play style: <b>{{ ui.playMode==='advanced' ? 'Advanced' : 'Basic' }}</b> · <button class="linkbtn" @click="setPlayMode(ui.playMode==='advanced'?'basic':'advanced')">switch to {{ ui.playMode==='advanced' ? 'Basic' : 'Advanced' }}</button></p>
    </div>
  </div>

  <!-- ============ SHOP ============ -->
  <div v-if="ui.shop && g" class="scrim" @click.self="ui.shop=false">
    <div class="sheet wide" role="dialog" aria-modal="true" aria-label="Equipment shop">
      <div class="sheethead" style="grid-template-columns:minmax(0,1fr) auto">
        <div><span class="label">Equipment · {{ money(g.cash) }} to spend</span><h3>The shop</h3></div>
        <button class="ib" @click="ui.shop=false" aria-label="Close">✕</button>
      </div>
      <p class="muted" style="font-size:13.5px;margin-bottom:10px">Prices are approximate US retail. Each item changes what you can do or your odds, not just a number.</p>
      <div class="shopgrid">
        <div v-for="id in gearShown" :key="id" class="item" :class="{owned:g.gear[id]}" :data-item="id">
          <img :src="src(EQUIPMENT[id].img)" alt="">
          <div>
            <span class="label">{{ EQUIPMENT[id].cat }}</span>
            <b>{{ EQUIPMENT[id].name }}</b>
            <small>{{ EQUIPMENT[id].effect }}</small>
          </div>
          <button class="btn sm" :class="{ghost:!buyState(id).ok}" :disabled="!buyState(id).ok" @click="buyGear(id)">{{ g.gear[id] ? 'Owned ✓' : buyState(id).ok ? money(priceOf(id)) : buyState(id).why }}</button>
        </div>
      </div>
      <button v-if="!advanced && !ui.moreGear" class="linkbtn" style="margin-top:10px" @click="ui.moreGear=true">More gear (16 qt cooker, scale, impulse sealer, CO₂ monitor, flow hood)</button>
    </div>
  </div>

  <!-- ============ NOTEBOOK ============ -->
  <div v-if="ui.notebook" class="scrim" @click.self="ui.notebook=false">
    <div class="sheet wide" role="dialog" aria-modal="true" aria-label="Grower's notebook">
      <div class="sheethead" style="grid-template-columns:minmax(0,1fr) auto">
        <div><span class="label">Grower's notebook</span><h3>{{ g ? sp.name : 'Pink oyster' }}, <i>{{ g ? sp.latin : 'Pleurotus djamor' }}</i></h3></div>
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

  <!-- ============ TUTORIAL COACH ============ -->
  <template v-if="ui.screen==='play' && ui.coach && tutStep">
    <div v-if="ui.coach.ring" class="coach-ring" aria-hidden="true" :style="{left:ui.coach.ring.x+'px',top:ui.coach.ring.y+'px',width:ui.coach.ring.w+'px',height:ui.coach.ring.h+'px'}"></div>
    <div class="coach" :class="ui.coach.top?'top':'bottom'" role="dialog" aria-live="polite" :aria-label="'Tutorial: '+tutStep.title" :data-step="tutStep.id">
      <img :src="src('portrait_mentor')" alt="">
      <div>
        <span class="label">Tutorial · {{ ui.tut.k+1 }}/{{ TUTORIAL.length }} · time paused</span>
        <b>{{ tutStep.title }}</b>
        <p>{{ tutStep.text }}</p>
        <div class="actions">
          <button v-if="!tutStep.done" class="btn sm" @click="tutNext">{{ ui.tut.k===TUTORIAL.length-1 ? 'Start the clock' : 'Next ›' }}</button>
          <span v-else class="hint">Do it to continue.</span>
          <button class="linkbtn" @click="tutSkip">Skip tutorial</button>
        </div>
      </div>
    </div>
  </template>

  <div class="toasts" :class="toastSpot" aria-live="polite">
    <div v-for="t in ui.toasts" :key="t.id" class="toast" :class="t.c"><template v-if="t.title"><b>{{ t.title }}</b> · </template>{{ t.text }}</div>
  </div>
  <template v-for="f in ui.floats" :key="f.id">
    <span v-if="f.kind==='t'" class="float" :class="f.c" :style="{left:f.x+'px',top:f.y+'px'}">{{ f.text }}</span>
    <span v-else class="spore" :style="{left:f.x+'px',top:f.y+'px','--dx':f.dx+'px','--dy':f.dy+'px'}"></span>
  </template>
</div>
`;
