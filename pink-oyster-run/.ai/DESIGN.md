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
