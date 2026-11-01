# Pink Oyster Run: design (current + target)

Status legend: **[now]** = implemented, **[target]** = specified in the 2026-11-01 brief, not built yet.

## Vision / pitch
[target] You're learning to grow gourmet mushrooms at home. Each in-game week you master one stage of cultivation; mastered stages sell in your online shop. Climb to harvest + farmers market, then repeat with a harder, more profitable species (pink oyster → lion's mane → wine cap).
Fantasy: "I'm becoming a real home grower." Pillars: **Mastery**, **Discovery**, **Serious fun / real-world learning**.
[now] One 50-day season of a 9-shelf pink-oyster farm; twist = richer substrate yields more but molds more; pressure cooker is the bottleneck.

## Core loop
[now] pour plate → spawn grain → bag → fruit → pick → sell at market every 3 days → reinvest.
[target] week (5 days) of running the pipeline → Weekly Review (report card, tips, mentor, mastery verdict) → unlock next stage + its shop product.

## Progression & mastery
[target] Stage ladder per species (pink/LM: agar → grain → substrate → fruiting → harvest/market; wine cap: agar → grain → sawdust spawn → outdoor bed → harvest). Mastery = mentor checklist, then N good units. Fail = repeat week. Earlier stages keep running. Optional automation after mastery. Learned lessons persist and shorten later species. LC stage unlocks in Expert mode after first win.
[now] None: single season, rank by profit; lessons persist across runs.

## Simulation realism
[now] Numbers are game-balanced, several unrealistic (price $12/kg, flush rest 4 d, cooker is free/fixed).
[target] Real-world durations shown in UI; 1 game day ≈ 2.5 bio days; colonization varies by recipe; cookers are bought with real jar capacity; sterile technique (SAB/flow hood) matters; verified prices.

## Economy
[now] Cash; costs: plates, jars, bags, heater; income: market every 3 days (fresh/dried), quiz tips.
[target] Equipment shop; online shop listings w/ player-set price, demand, reputation; farmers market (fresh only, booth fee); dehydrator → dried sells online; ≥2 competing sinks per currency (gear vs inventory vs booth vs automation).

## Environment / zones
[now] Single room: heater (3 steps), fresh air, mist; 9 unlabeled shelves.
[target] Side-view house cutaway: kitchen counter, closet shelf, grow tent, garage, back yard; each zone 2–3 spots with own temp/RH/cleanliness; wrong-zone placement has visible, explained consequence.

## Story & mentors
[target] Retired-mycologist neighbor (blunt, dramatic about mold, secretly proud) + forum guru (confidently wrong ~half the time; source of myth quizzes). ≤3 lines per scene, speech bubbles, every line has a voice id.
[now] None (market customers ask myth questions).

## Tutorial
[target] Week 0, skippable, paused steps highlighting real UI: zones, pour a plate in the SAB, read the room, playback controls, notebook.
[now] "Next:" coaching line + stocked tutorial bench (to be removed).

## UI / UX & feel
[now] Vue 3 single page; shelf grid; side panel; action sheet; notebook (guide, lessons, cheat sheet, art); toasts/floats; admin panel.
[target] Playback controls (pause, 0.5–8×), zone cutaway with GSAP, weekly review cards, settings panel.

## Audio
[now] WebAudio synth SFX, mute.
[target] Optional manifest (music/sfx/voice) with synth fallback; Music/SFX/Voice volumes; Suno prompts; voice-lines.json + configurable gen script.

## Difficulty
[target] Relaxed / Normal / Hardcore picker (cash $2,500/$1,500/$800; contamination soft/normal/hard). All in CONFIG.
[now] Single difficulty, grace period of 4 days.

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
