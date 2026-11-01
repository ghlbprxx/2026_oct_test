# Pink Oyster Run: design (current + target)

Status legend: **[now]** = implemented, **[target]** = specified in the 2026-11-01 brief, not built yet.

## Vision / pitch
[target] You're learning to grow gourmet mushrooms at home. Each in-game week you master one stage of cultivation; mastered stages sell in your online shop. Climb to harvest + farmers market, then repeat with a harder, more profitable species (pink oyster → lion's mane → wine cap).
Fantasy: "I'm becoming a real home grower." Pillars: **Mastery**, **Discovery**, **Serious fun / real-world learning**.
[now] One 50-day season of a 9-shelf pink-oyster farm; twist = richer substrate yields more but molds more; pressure cooker is the bottleneck.

## Core loop
[now] pour plate → spawn grain → bag → fruit → pick → sell at market every 3 days → reinvest.
[now] week (5 days) of running the pipeline → Weekly Review (report card, tips, mentor, mastery verdict) → unlock next stage + its shop product.

## Progression & mastery
[target] Stage ladder per species (pink/LM: agar → grain → substrate → fruiting → harvest/market; wine cap: agar → grain → sawdust spawn → outdoor bed → harvest). Mastery = mentor checklist, then N good units. Fail = repeat week. Earlier stages keep running. Optional automation after mastery. Learned lessons persist and shorten later species. LC stage unlocks in Expert mode after first win.
[now] Phase 6: three species (pink → lion's mane → wine cap) via content/species/index.js; per-species ladders (LADDERS, ladderOf(species, expert)); "opens" looked up by stage id (OPENS_BY/opensIndex); startSpecies resets the ladder, archives mastered/counts (masteredBy/countsBy), halves units for stages mastered before (RULES.transferUnits). Expert inserts LC after agar. Optional automation per mastered stage (current species), weekly fees.
[now] Stage ladder (content/stages.js): agar → grain → substrate → fruiting → harvest & market. Weekly review every 5 game days: report card, mold causes + lessons, ≤3 tips, mentor line (id'd), verdict. Mastery = checklist then N units (counted after the list). Repeat week otherwise. Products unlock in the online shop per mastered stage. Species mastered → free play. Autosave/Continue.

## Simulation realism
[now] Real-day biology in content/species/pink-oyster.js (plate 7, jar 12, straw 12, saw+bran 16, Masters 18, pin 4, grow 4, rest 10, peak 1.5, cooker 1 incl. cooling); 1 game day = 2.5 real days; $/lb prices; SAB cuts open-air plate/inoculation risk to 30%.
[target] Real-world durations shown in UI; 1 game day ≈ 2.5 bio days; colonization varies by recipe; cookers are bought with real jar capacity; sterile technique (SAB/flow hood) matters; verified prices.

## Economy
[now] Cash by difficulty ($2,500/$1,500/$800); costs: plates $1.50, jars $3, bags $3–7, SAB $15, heater $1/step/game day; income: market every 2 game days once the grow room opens (fresh $14/lb, dried $8/fresh-lb), quiz tips. Careful-bot season (12 wk): +$125..+$350. Cash is far more than consumables need until Phase 3's equipment shop.
[now] Equipment shop (12 items, capability-changing, approx. US prices, shop.priceScale). Season ranked by operating profit (gear excluded). [target] Online shop listings w/ player-set price, demand, reputation; farmers market (fresh only, booth fee); dehydrator → dried sells online; ≥2 competing sinks per currency (gear vs inventory vs booth vs automation).

## Species [now, Phase 6]
Pink (70–85°F, heat mat, $14/lb, 2.5 d). Lion's mane (60–70°F, maxTemp 78 stalls + lesson too_warm, fresh air, hardwood only, flushMult [1,.35,.1], ×20/14 price, ×2.5 shelf). Wine cap (outdoor beds; colShift 12°F; bed colDays 70 chips / 45 straw (max 3 flushes) / pine ×0.35 + lesson; water decays 0.12/real day, rain 30%/game day refills; flushes need water ≥ 0.5; ×12/14 price, ×1.6 shelf). Wine cap bed stage units = moist colonizing bed-days (inoculation-count units deadlocked: beds last years and the yard has 2 spots).
## Expert + liquid culture [now, Phase 6]
LC jar (dilute 0.006/real day hazard vs rich 0.05, reveal lag ×2.5), cooker-sterilized, seeded from a plate, 10 real days, 6 uses; LC jars colonize ×0.75 time. LC stage: checklist 2 dilute LCs + 1 clean colonized LC; units = grain jars seeded from dilute LC (3).
## Automation [now, Phase 6]
content/automation.js + sim/automation.js: 6 routines, unlocked by stages mastered on the current species, $2–5/week each, run 4×/game day using the player's actions; metrics: g.stats.autoActions/autoBy/automation, review line, runEnd automationPaid/automationTasks. Fully automated pink farm ≈ break-even over 15 hands-off weeks (tested).

## Environment / zones
[now] Side-view house: kitchen 2 (70°F, dry, dirt 1.3), closet 3 (72°F steady, CO₂ 2500, dirt 0.8), tent 3 (needs tent; heat mat +6°F/step, fan, mist capped 88% without humidifier), garage 2 (outdoor season −4°F ±7 swing, cold snaps), yard 2 (locked until wine cap). zoneFit explains wrong-zone placement; move action with GSAP fly. Readings need hygrometer / CO₂ monitor, else qualitative.
[target] Side-view house cutaway: kitchen counter, closet shelf, grow tent, garage, back yard; each zone 2–3 spots with own temp/RH/cleanliness; wrong-zone placement has visible, explained consequence.

## Story & mentors
[target] Retired-mycologist neighbor (blunt, dramatic about mold, secretly proud) + forum guru (confidently wrong ~half the time; source of myth quizzes). ≤3 lines per scene, speech bubbles, every line has a voice id.
[now] content/story.js + director.js: mentor Dr. Ines Marlow + guru u/SporeLord_9000; ≤3 lines per scene, dialogue bar one line at a time, every line id'd. Scenes: intro, stage_grain/substrate/fruiting/harvest (fruiting includes the golden-oyster invasive aside), first_mold, cold_snap (sim emits `forecast`), coffee_yes/no, species_done (arborist wood chips teaser for wine cap). Market quiz in story runs = guru post (guru claims the statement; right iff fact, 6/13), mentor reacts. Free play/expert: no scenes, customer quiz.

## Tutorial
[target] Week 0, skippable, paused steps highlighting real UI: zones, pour a plate in the SAB, read the room, playback controls, notebook.
[now] Tutorial mode: content/tutorial.js (7 steps: house, sab, pour, room, speed, notebook, mastery) + ui/coach.js (highlight ring on a real element, card placed on the free side, action steps auto-advance from game state, clock held via ui.tut). Ends by starting the clock in week 0 (there is no separate week before agar). "Next:" line + stage intro cards still show in every mode except Expert (no Next: line).

## UI / UX & feel
[now] Vue 3 single page; shelf grid; side panel; action sheet; notebook (guide, lessons, cheat sheet, art); toasts/floats; admin panel.
[now] Playback bar (pause, 0.5–8×, `[` `]`). GSAP: place/move/stage pops/pluck/cash/mold alarm/week cards/house entrance; CSS tent mist + cooker steam. [target] Zone cutaway with GSAP, weekly review cards, settings panel.

## Audio
[now] WebAudio synth SFX, mute.
[target] Optional manifest (music/sfx/voice) with synth fallback; Music/SFX/Voice volumes; Suno prompts; voice-lines.json + configurable gen script.

## Difficulty
[target] Relaxed / Normal / Hardcore picker (cash $2,500/$1,500/$800; contamination soft/normal/hard). All in CONFIG.
[now] Relaxed / Normal / Hardcore picker implemented as specified.

## Ethics guardrails
No FOMO timers, no streak penalties, no paid randomness, no deadlines on shop listings. Weekly reviews are natural stopping points. Losses always explained with a lesson + fix.

## Researched numbers (2026-11-01, for Phase 2) — confidence noted; sources are mostly retailers/hobby blogs
| Item | Finding | Confidence | Proposed default (knob range) |
|---|---|---|---|
| Fresh oyster, farmers market | ~$8–12/lb for oysters generally; specialty colors often priced higher; US wholesale ~$3.90/lb (5-lb carton, Tridge Oct 2025). Brief says $12–20/lb for pinks. | low–medium | $14/lb pink (6–30) |
| Lion's mane, farmers market | $15–28/lb quoted by consumer guides; sources disagree | low | $20/lb (8–40) |
| Pressure canner capacity | Presto 23-qt: 7 quart jars. Presto 16-qt: **also 7 quart jars** per HealthyCanning table; the 23-qt mainly adds pint/half-pint room. Brief's "16-qt ≈ 4 quarts" is not supported. | medium | 16-qt: 7 jars (cheaper, shorter for tall bags), 23-qt: 7 jars + fits filter-patch bags; decide in Phase 3 |
| Still-air box | ~$43–55 retail (Bella Bora); DIY tote far cheaper | medium | $50 |
| Laminar flow hood | ~$600–2,000 | low–medium | $900 |
| SAB vs hood effect | Hobby claims: SAB 85–95% clean, hood 99%+; a small home test showed a modest gain only | low | plate hazard × (open air 1, SAB ~0.35, hood ~0.1), knobs |
| Wine cap bed | First flush ~2–6 months after spring/fall inoculation (range 2–12); beds produce 2–4 years; aged hardwood chips better; conifer chips inhibit; straw-only beds faster but exhaust in a season | medium | bed colonization ~90 bio days (60–180) |
| Grain / substrate / rest (brief) | grain 10–14 d (7–10 with shake), straw 10–14 d, supplemented 14–21 d, flush rest 7–14 d | brief-provided; consistent with common grower guidance, not independently re-verified this session | as brief |
Sources: dev.to/bibimbop123 mushroom revenue; dir.tridge.com fresh oyster US; healthycanning.com/presto-canners; walmart.com Presto 23-qt; hydrobuilder.com Bella Bora SAB; shroomcraftlab.pages.dev LFH vs SAB; northspore.com wine cap; out-grow.com wine cap guide.


## Economy proof (2026-11-01, tools/playtest.mjs, 9 seeds × 24 weeks, medians)
- careful (online + market): 5/5 stages on all difficulties (78–89% of runs finish the species by week 24); profit Relaxed +$608, Normal +$384, Hardcore +$384; lowest cash $1,961 / $946 / $259; revenue ~60–75% online.
- marketOnly: 5/5 stages, profit −$64..−$199 (fresh rarely lasts to market; ~85% of harvest is dried).
- sloppy 0/5 (no SAB → agar checklist fails), random 1/5 and −$310, idle $0.
- Changes made to get here: wire shelf rack ($60, +3 closet spots); market 'auto' booking (books only when haul ≥ 3× fee); species-mastered no longer re-masters each week.
- Difficulty differs mostly in starting cash and the dip toward zero, as specified; outcomes for careful play are similar.

## Play style (UI only)
- Basic (default): recommended options first, auto climate button, fixed prices, auto market, essential gear, no admin panel, starts at 4×.
- Advanced: everything + admin panel (15 essential knobs, "Show all knobs").
