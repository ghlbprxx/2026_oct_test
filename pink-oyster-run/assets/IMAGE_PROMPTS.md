# Image prompts — Pink Oyster Run

Generated from `assets/images.json` by `node assets/tools/gen-images.mjs --write-md`. Edit the JSON, not this file.

Every prompt below already includes its style and background instructions. Default negative prompt: text, letters, numbers, labels, watermark, logo, signature, hands, people, faces, photorealistic, grainy noise, busy background, cropped subject, multiple separate subjects, frame, border

Images marked **align with** are layered over another image: make them by editing that image (image-to-image / inpaint) so outlines line up.

## plate_empty

- **Save as:** `assets/img/plate_empty.png` (512×512, transparent)
- **Used for:** Agar plate on a shelf before mycelium grows. Bottom layer of every plate.

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. A round glass petri dish seen from slightly above, filled with smooth, glossy honey-amber agar. Clean and empty: no growth, no spots. Small specular highlight on the upper-left rim. Framing: Dish centered at 50% x, 49% y. Outer rim diameter about 86% of the canvas width. Agar surface radius about 40% of the width. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## plate_colonized

- **Save as:** `assets/img/plate_colonized.png` (512×512, transparent)
- **Used for:** Revealed over plate_empty as a growing circle while the plate colonizes.
- **Align with:** `plate_empty` (assets/img/plate_empty.png)

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. The exact same petri dish as the reference, now covered edge to edge in dense, fluffy cream-white mycelium, with fine ropey rhizomorphic strands radiating outward from a small square agar wedge in the center. Healthy and clean: no green, no other colors. Framing: Identical framing to plate_empty. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## jar_empty

- **Save as:** `assets/img/jar_empty.png` (512×512, transparent)
- **Used for:** Grain spawn jar before colonization (also while in the pressure cooker or waiting for spawn).

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. A quart glass mason jar with a grey metal lid that has a small round white filter patch in its center, filled about 90% with plump, hydrated golden-brown rye berries. Clean glass, kernels loose, no water pooling at the bottom. Framing: Jar centered. Lid top at about 8% of the height, jar bottom at about 94%. Grain fills from about 27% to 92% of the height. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## jar_colonized

- **Save as:** `assets/img/jar_colonized.png` (512×512, transparent)
- **Used for:** Revealed over jar_empty from the top down as the grain colonizes.
- **Align with:** `jar_empty` (assets/img/jar_empty.png)

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. The exact same mason jar as the reference, the grain now fully colonized: every rye kernel bound together by bright cream-white mycelium, a few kernels faintly visible through the white. Framing: Identical framing to jar_empty. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## bag_straw

- **Save as:** `assets/img/bag_straw.png` (512×512, transparent)
- **Used for:** Grow bag filled with chopped straw (pasteurized or sterilized), before colonization.

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. A clear plastic mushroom grow bag standing upright, top folded flat, with a small white rectangular filter patch near the top. The bottom 60% is filled with chopped golden wheat straw pieces. Framing: Bag centered. Bag top at about 5%, bottom at about 95% of the height. Substrate top edge at about 39% of the height. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## bag_sawdust

- **Save as:** `assets/img/bag_sawdust.png` (512×512, transparent)
- **Used for:** Grow bag filled with supplemented hardwood (sawdust + bran, or Masters Mix), before colonization.
- **Align with:** `bag_straw` (assets/img/bag_straw.png)

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. The exact same grow bag as the reference, but the bottom 60% is filled with dense dark-brown hardwood sawdust and pellets with lighter tan flecks of soy hulls and bran. Framing: Identical framing to bag_straw. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## bag_coir

- **Save as:** `assets/img/bag_coir.png` (512×512, transparent)
- **Used for:** Grow bag filled with coir + vermiculite (also used for the coffee-grounds event bag).
- **Align with:** `bag_straw` (assets/img/bag_straw.png)

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. The exact same grow bag as the reference, but the bottom 60% is filled with dark-brown fluffy coco coir mixed with small sparkly white-grey vermiculite flecks. Framing: Identical framing to bag_straw. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## bag_colonized

- **Save as:** `assets/img/bag_colonized.png` (512×512, transparent)
- **Used for:** Revealed over any of the three bag images from the top down while the bag colonizes.
- **Align with:** `bag_sawdust` (assets/img/bag_sawdust.png)

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. The exact same grow bag as the reference, the substrate now fully colonized into a solid cream-white block of mycelium, with faint texture of the substrate showing underneath. Framing: Identical framing to bag_straw / bag_sawdust. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## block_ready

- **Save as:** `assets/img/block_ready.png` (512×512, transparent)
- **Used for:** Colonized fruiting block before pins appear, and while resting between flushes.

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. A fully colonized cream-white rectangular mushroom block with the plastic bag cut away, standing upright, with a small X-shaped cut on the front center. No mushrooms yet. Framing: Block in the lower half: top edge at about 51%, bottom at about 95% of the height, about 42% of the width wide. X-cut centered at about 50% x, 65% y. Keep the upper half empty so clusters can grow into it. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## block_pins

- **Save as:** `assets/img/block_pins.png` (512×512, transparent)
- **Used for:** Block that is pinning (tiny primordia forming).
- **Align with:** `block_ready` (assets/img/block_ready.png)

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. The exact same block as the reference, with a tight cluster of tiny bright-pink mushroom pins (primordia) bursting from the X-cut. Framing: Identical framing to block_ready. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## cluster_young

- **Save as:** `assets/img/cluster_young.png` (512×512, transparent)
- **Used for:** Cluster growing toward harvest.
- **Align with:** `block_ready` (assets/img/block_ready.png)

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. The exact same block as the reference, with a small young cluster of pink oyster mushrooms (Pleurotus djamor) growing from the X-cut: 5 to 6 small fan-shaped caps with edges curled under, rich flamingo pink. Framing: Identical block framing to block_ready. The cluster may grow up into the empty upper half. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## cluster_peak

- **Save as:** `assets/img/cluster_peak.png` (512×512, transparent)
- **Used for:** Healthy cluster at peak: the harvest moment.
- **Align with:** `block_ready` (assets/img/block_ready.png)

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. The exact same block as the reference, with a large, perfect cluster of pink oyster mushrooms growing from the X-cut: 8 to 10 broad ruffled fan-shaped caps, edges still slightly curled down, vivid flamingo pink with deeper rose edges, short pale stems, pale-pink gills visible under the caps. Harvest-ready. Framing: Identical block framing to block_ready. The cluster fills most of the upper half. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## cluster_leggy

- **Save as:** `assets/img/cluster_leggy.png` (512×512, transparent)
- **Used for:** Cluster grown in stale, high-CO2 air (too little fresh air exchange).
- **Align with:** `block_ready` (assets/img/block_ready.png)

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. The exact same block as the reference, with a stretched, leggy cluster of pink oyster mushrooms: long thin pale stems reaching upward and small, undersized pink caps, the look of too little fresh air. Framing: Identical block framing to block_ready. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## cluster_dry

- **Save as:** `assets/img/cluster_dry.png` (512×512, transparent)
- **Used for:** Cluster grown in air that is too dry (low humidity).
- **Align with:** `block_ready` (assets/img/block_ready.png)

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. The exact same block as the reference, with a pink oyster cluster whose caps are dry and cracked: split edges curling upward, slightly faded pink, a few crispy brown edges, the look of low humidity. Framing: Identical block framing to block_ready. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## cluster_overripe

- **Save as:** `assets/img/cluster_overripe.png` (512×512, transparent)
- **Used for:** Cluster left past its peak; will drop if not picked.
- **Align with:** `block_ready` (assets/img/block_ready.png)

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. The exact same block as the reference, with an overripe pink oyster cluster: caps flattened and turned up at the edges, color faded to washed-out pale pink, wavy edges, and a fine dusting of pale spores on the block below. Framing: Identical block framing to block_ready. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## block_spent

- **Save as:** `assets/img/block_spent.png` (512×512, transparent)
- **Used for:** Block after its flushes are used up, waiting to be retired.
- **Align with:** `block_ready` (assets/img/block_ready.png)

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. The exact same block as the reference, now tired and spent: shrunken, dented, slightly yellowed tan-cream, with a couple of small dried brown mushroom stubs at the X-cut. Framing: Identical framing to block_ready. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## mold_overlay

- **Save as:** `assets/img/mold_overlay.png` (512×512, transparent)
- **Used for:** Drawn on top of any plate, jar or bag when contamination becomes visible. Opacity and size grow with the infection.

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. Only patches of green Trichoderma mold and nothing else: 5 to 7 fuzzy round colonies, dark emerald-green centers fading to a soft white fuzzy ring at the edges, scattered across the middle of the frame. Framing: Patches stay inside the central 60% of the canvas. Transparency everywhere else is essential: this layer sits on top of other images. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## crate_fresh

- **Save as:** `assets/img/crate_fresh.png` (256×256, transparent)
- **Used for:** Icon for the fresh-harvest crate.

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. A small woven wicker basket heaped with fresh, bright pink oyster mushroom clusters. Framing: Basket centered, filling about 85% of the canvas. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## crate_dried

- **Save as:** `assets/img/crate_dried.png` (256×256, transparent)
- **Used for:** Icon for dehydrated mushrooms.

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. A small glass jar with a cork lid filled with dried, shriveled tan and faded-pink oyster mushroom pieces. Framing: Jar centered, filling about 85% of the canvas. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## cooker

- **Save as:** `assets/img/cooker.png` (256×256, transparent)
- **Used for:** Icon for the pressure cooker (sterilizer) widget.

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. A stovetop aluminum pressure cooker with a round pressure gauge on the lid and two black handles, a small puff of steam rising from the valve. Framing: Pot centered, filling about 85% of the canvas. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## title_hero

- **Save as:** `assets/img/title_hero.png` (1280×720, opaque)
- **Used for:** Title screen illustration.
- **Negative prompt:** text, letters, numbers, labels, watermark, logo, signature, people, faces, hands, photorealistic, grainy noise, harsh shadows, fisheye, frame, border

```text
Cozy storybook illustration for a casual mobile game, same art style as the object images: clean vector-like shapes, soft cel shading, gentle gradients, dark plum outlines (#2a1b2e), warm muted palette with flamingo-pink (#e2557a) accents. Flat, straight-on dollhouse-cutaway view, soft even lighting, low detail so overlaid game pieces stay readable. A cozy small home mushroom grow room in the evening: wooden shelves holding petri dishes, mason jars of white grain spawn and grow bags; in the foreground right, a large vivid pink oyster mushroom cluster fruiting from a cream block; soft warm lamp light and a little humidifier mist; pastel pink and cream palette. Framing: Wide 16:9 scene. Main cluster in the right half. Full-bleed scene that fills the whole canvas. No transparency.
```

## zone_kitchen

- **Save as:** `assets/img/zone_kitchen.png` (768×384, opaque)
- **Used for:** Background of the kitchen zone in the side-view house. Drawn at ~55% opacity behind the vessel spots.
- **Negative prompt:** text, letters, numbers, labels, watermark, logo, signature, people, faces, hands, photorealistic, grainy noise, harsh shadows, fisheye, frame, border

```text
Cozy storybook illustration for a casual mobile game, same art style as the object images: clean vector-like shapes, soft cel shading, gentle gradients, dark plum outlines (#2a1b2e), warm muted palette with flamingo-pink (#e2557a) accents. Flat, straight-on dollhouse-cutaway view, soft even lighting, low detail so overlaid game pieces stay readable. A cozy home kitchen wall seen straight on: cream tile backsplash, warm wooden upper cabinets, a small window with daylight, a butcher-block counter running along the bottom. Clean and tidy, warm morning light. Framing: Wide 2:1 interior/exterior wall, seen straight on like a dollhouse cutaway. Keep the lower two-thirds calm and uncluttered: vessel cards sit on top of it. No people. Full-bleed scene that fills the whole canvas. No transparency.
```

## zone_closet

- **Save as:** `assets/img/zone_closet.png` (768×384, opaque)
- **Used for:** Background of the closet zone in the side-view house. Drawn at ~55% opacity behind the vessel spots.
- **Negative prompt:** text, letters, numbers, labels, watermark, logo, signature, people, faces, hands, photorealistic, grainy noise, harsh shadows, fisheye, frame, border

```text
Cozy storybook illustration for a casual mobile game, same art style as the object images: clean vector-like shapes, soft cel shading, gentle gradients, dark plum outlines (#2a1b2e), warm muted palette with flamingo-pink (#e2557a) accents. Flat, straight-on dollhouse-cutaway view, soft even lighting, low detail so overlaid game pieces stay readable. The inside of a small wooden closet seen straight on: dark wood paneling, a sturdy shelf near the bottom, a warm dim glow from a small lamp at the top, cozy and still. Dark, calm, stable mood. Framing: Wide 2:1 interior/exterior wall, seen straight on like a dollhouse cutaway. Keep the lower two-thirds calm and uncluttered: vessel cards sit on top of it. No people. Full-bleed scene that fills the whole canvas. No transparency.
```

## zone_tent

- **Save as:** `assets/img/zone_tent.png` (768×384, opaque)
- **Used for:** Background of the tent zone in the side-view house. Drawn at ~55% opacity behind the vessel spots.
- **Negative prompt:** text, letters, numbers, labels, watermark, logo, signature, people, faces, hands, photorealistic, grainy noise, harsh shadows, fisheye, frame, border

```text
Cozy storybook illustration for a casual mobile game, same art style as the object images: clean vector-like shapes, soft cel shading, gentle gradients, dark plum outlines (#2a1b2e), warm muted palette with flamingo-pink (#e2557a) accents. Flat, straight-on dollhouse-cutaway view, soft even lighting, low detail so overlaid game pieces stay readable. The inside of a small hobby grow tent seen straight on: reflective silver mylar walls with soft vertical folds, black frame poles at the edges, a small round clip fan in the upper left, an LED light bar along the top, a faint humid haze. Framing: Wide 2:1 interior/exterior wall, seen straight on like a dollhouse cutaway. Keep the lower two-thirds calm and uncluttered: vessel cards sit on top of it. No people. Full-bleed scene that fills the whole canvas. No transparency.
```

## zone_garage

- **Save as:** `assets/img/zone_garage.png` (768×384, opaque)
- **Used for:** Background of the garage zone in the side-view house. Drawn at ~55% opacity behind the vessel spots.
- **Negative prompt:** text, letters, numbers, labels, watermark, logo, signature, people, faces, hands, photorealistic, grainy noise, harsh shadows, fisheye, frame, border

```text
Cozy storybook illustration for a casual mobile game, same art style as the object images: clean vector-like shapes, soft cel shading, gentle gradients, dark plum outlines (#2a1b2e), warm muted palette with flamingo-pink (#e2557a) accents. Flat, straight-on dollhouse-cutaway view, soft even lighting, low detail so overlaid game pieces stay readable. A home garage wall seen straight on: grey concrete block wall, a pegboard with a few hand tools, a wooden workbench, part of a roll-up door with horizontal panels on the right, cool and slightly drafty light. Framing: Wide 2:1 interior/exterior wall, seen straight on like a dollhouse cutaway. Keep the lower two-thirds calm and uncluttered: vessel cards sit on top of it. No people. Full-bleed scene that fills the whole canvas. No transparency.
```

## zone_yard

- **Save as:** `assets/img/zone_yard.png` (768×384, opaque)
- **Used for:** Background of the yard zone in the side-view house. Drawn at ~55% opacity behind the vessel spots.
- **Negative prompt:** text, letters, numbers, labels, watermark, logo, signature, people, faces, hands, photorealistic, grainy noise, harsh shadows, fisheye, frame, border

```text
Cozy storybook illustration for a casual mobile game, same art style as the object images: clean vector-like shapes, soft cel shading, gentle gradients, dark plum outlines (#2a1b2e), warm muted palette with flamingo-pink (#e2557a) accents. Flat, straight-on dollhouse-cutaway view, soft even lighting, low detail so overlaid game pieces stay readable. A small back yard seen from the back door: pale blue sky, a wooden privacy fence, a leafy tree on the right, green lawn, and a long low raised bed of fresh hardwood chips in the foreground. Framing: Wide 2:1 interior/exterior wall, seen straight on like a dollhouse cutaway. Keep the lower two-thirds calm and uncluttered: vessel cards sit on top of it. No people. Full-bleed scene that fills the whole canvas. No transparency.
```

## gear_sab

- **Save as:** `assets/img/gear_sab.png` (256×256, transparent)
- **Used for:** Shop icon for the still-air box; also drawn small inside its zone once owned.

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. A DIY still-air box for mushroom work: a clear plastic storage tote turned on its side with two round arm holes cut in the front, lid on, very clean. Framing: Object centered, filling about 80% of the canvas, slight three-quarter view. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## gear_flowhood

- **Save as:** `assets/img/gear_flowhood.png` (256×256, transparent)
- **Used for:** Shop icon for the laminar flow hood; also drawn small inside its zone once owned.

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. A compact laminar flow hood for a home mushroom lab: a metal box with a large white HEPA filter face covered in a fine grille, a small power switch. Framing: Object centered, filling about 80% of the canvas, slight three-quarter view. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## gear_cooker16

- **Save as:** `assets/img/gear_cooker16.png` (256×256, transparent)
- **Used for:** Shop icon for the 16-quart pressure cooker; also drawn small inside its zone once owned.

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. A 16-quart aluminum stovetop pressure cooker, medium height, with a weighted regulator on the lid and two black handles. Framing: Object centered, filling about 80% of the canvas, slight three-quarter view. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## gear_cooker23

- **Save as:** `assets/img/gear_cooker23.png` (256×256, transparent)
- **Used for:** Shop icon for the 23-quart pressure canner; also drawn small inside its zone once owned.

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. A tall 23-quart aluminum pressure canner with a round dial pressure gauge on the lid and two black handles. Framing: Object centered, filling about 80% of the canvas, slight three-quarter view. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## gear_rack

- **Save as:** `assets/img/gear_rack.png` (256×256, transparent)
- **Used for:** Shop icon for the wire shelf rack (3 extra closet spots).

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. A small chrome wire shelving rack with three shelves, a few mason jars of white grain spawn standing on the middle shelf. Framing: Object centered, filling about 80% of the canvas, slight three-quarter view. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## gear_scale

- **Save as:** `assets/img/gear_scale.png` (256×256, transparent)
- **Used for:** Shop icon for the kitchen scale; also drawn small inside its zone once owned.

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. A flat digital kitchen scale with a stainless steel platform and a small green LCD display (no readable digits). Framing: Object centered, filling about 80% of the canvas, slight three-quarter view. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## gear_sealer

- **Save as:** `assets/img/gear_sealer.png` (256×256, transparent)
- **Used for:** Shop icon for the impulse sealer; also drawn small inside its zone once owned.

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. A tabletop impulse bag sealer: a white base with a hinged grey sealing arm and a thin heating strip. Framing: Object centered, filling about 80% of the canvas, slight three-quarter view. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## gear_tent

- **Save as:** `assets/img/gear_tent.png` (256×256, transparent)
- **Used for:** Shop icon for the grow tent; also drawn small inside its zone once owned.

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. A small black fabric grow tent, front panel zipped partly open showing a reflective silver interior and a small clip fan. Framing: Object centered, filling about 80% of the canvas, slight three-quarter view. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## gear_heatmat

- **Save as:** `assets/img/gear_heatmat.png` (256×256, transparent)
- **Used for:** Shop icon for the heat mat with thermostat; also drawn small inside its zone once owned.

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. A thin black seedling heat mat with a small plug-in digital thermostat controller beside it. Framing: Object centered, filling about 80% of the canvas, slight three-quarter view. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## gear_humidifier

- **Save as:** `assets/img/gear_humidifier.png` (256×256, transparent)
- **Used for:** Shop icon for the humidifier; also drawn small inside its zone once owned.

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. A small white ultrasonic humidifier with a soft plume of mist rising from the top nozzle. Framing: Object centered, filling about 80% of the canvas, slight three-quarter view. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## gear_hygrometer

- **Save as:** `assets/img/gear_hygrometer.png` (256×256, transparent)
- **Used for:** Shop icon for the hygrometer; also drawn small inside its zone once owned.

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. A round analog hygrometer/thermometer dial with a green comfort zone arc and a red needle, no readable numbers. Framing: Object centered, filling about 80% of the canvas, slight three-quarter view. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## gear_co2

- **Save as:** `assets/img/gear_co2.png` (256×256, transparent)
- **Used for:** Shop icon for the CO2 monitor; also drawn small inside its zone once owned.

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. A small white desktop CO2 monitor with a dark display panel and three status lights (green, amber, red), no readable text. Framing: Object centered, filling about 80% of the canvas, slight three-quarter view. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## gear_dehydrator

- **Save as:** `assets/img/gear_dehydrator.png` (256×256, transparent)
- **Used for:** Shop icon for the dehydrator; also drawn small inside its zone once owned.

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. A round stacking food dehydrator with four translucent trays holding sliced pink oyster mushrooms. Framing: Object centered, filling about 80% of the canvas, slight three-quarter view. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## portrait_mentor

- **Save as:** `assets/img/portrait_mentor.png` (512×512, transparent)
- **Used for:** Speech-bubble portrait of the mentor: a retired mycologist who lives next door (story mode, weekly reviews).
- **Negative prompt:** text, letters, numbers, watermark, logo, signature, photorealistic, uncanny, extra fingers, deformed hands, multiple people, busy background, frame, border

```text
Cozy storybook character portrait for a casual mobile game, same art style as the object images: clean vector-like shapes, soft cel shading, dark plum outlines (#2a1b2e), warm palette with flamingo-pink (#e2557a) accents, expressive but friendly face, readable at small sizes. Head-and-shoulders portrait of a retired mycologist neighbor in their late 60s: silver hair in a loose bun, round glasses, raised skeptical eyebrows, a hint of a proud smile, a purple cardigan with a small pink mushroom pin. Expressive, warm, a little dramatic. Framing: Bust portrait, face centered in the upper half, shoulders cut by the bottom edge, facing slightly right. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## portrait_guru

- **Save as:** `assets/img/portrait_guru.png` (512×512, transparent)
- **Used for:** Speech-bubble portrait of the forum guru: a confidently-wrong-half-the-time internet mushroom poster (myth quizzes).
- **Negative prompt:** text, letters, numbers, watermark, logo, signature, photorealistic, uncanny, extra fingers, deformed hands, multiple people, busy background, frame, border

```text
Cozy storybook character portrait for a casual mobile game, same art style as the object images: clean vector-like shapes, soft cel shading, dark plum outlines (#2a1b2e), warm palette with flamingo-pink (#e2557a) accents, expressive but friendly face, readable at small sizes. Head-and-shoulders portrait of an enthusiastic internet mushroom-forum guru in their late 20s: mustard beanie, big confident grin, eyebrows mid-lecture, holding up a smartphone, a green hoodie. Comedic, friendly, slightly overconfident. Framing: Bust portrait, face centered in the upper half, shoulders cut by the bottom edge, facing slightly left. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## bed

- **Save as:** `assets/img/bed.png` (256×256, transparent)
- **Used for:** A wine cap bed of wood chips in the back yard (yard spots). Wine cap clusters are drawn on top when it fruits.

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. A low rounded mound of fresh hardwood wood chips mixed with a little straw, a few white threads of mycelium showing at the edge, viewed slightly from the side. Framing: Mound centered along the bottom third, filling about 85% of the width, empty space above for mushrooms drawn on top. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## lc_jar

- **Save as:** `assets/img/lc_jar.png` (256×256, transparent)
- **Used for:** Expert mode: a liquid-culture jar (amber broth, lid with an injection port). Growth is drawn on top.

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. A clear glass mason jar about two-thirds full of clear amber malt broth, a metal lid with a small grey self-healing injection port, simple and clean. Framing: Jar centered, filling about 80% of the height. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## lc_growth

- **Save as:** `assets/img/lc_growth.png` (256×256, transparent)
- **Used for:** Overlay on lc_jar: white mycelium clouds and strands growing in the broth; faded in as the culture colonizes.
- **Align with:** `lc_jar` (assets/img/lc_jar.png)

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. Only the contents of the jar: soft white wispy mycelium clouds and thin strands suspended in liquid, settled into a fluffy white mat at the bottom. Nothing else. Framing: Match lc_jar exactly: same position and size as the broth inside the jar. Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## lm_young

- **Save as:** `assets/img/lm_young.png` (512×512, transparent)
- **Used for:** Lion’s mane, growing (first 70%).
- **Align with:** `block_ready` (assets/img/block_ready.png)

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. The exact same block as the reference, with a small young Lion’s mane (Hericium erinaceus): a single rounded head made of hundreds of soft, hanging, icicle-like white spines, no caps, no gills. About the size of a golf ball, short spines. Framing: Identical framing to block_ready (layered exactly on top of it). Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## lm_peak

- **Save as:** `assets/img/lm_peak.png` (512×512, transparent)
- **Used for:** Lion’s mane at peak (and when quality is low).
- **Align with:** `block_ready` (assets/img/block_ready.png)

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. The exact same block as the reference, with a large, perfect Lion’s mane (Hericium erinaceus): a single rounded head made of hundreds of soft, hanging, icicle-like white spines, no caps, no gills. About the size of a fist, spines about 1 cm long, pure white. Harvest-ready. Framing: Identical framing to block_ready (layered exactly on top of it). Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## lm_overripe

- **Save as:** `assets/img/lm_overripe.png` (512×512, transparent)
- **Used for:** Lion’s mane past peak: pick now.
- **Align with:** `block_ready` (assets/img/block_ready.png)

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. The exact same block as the reference, with an over-mature Lion’s mane (Hericium erinaceus): a single rounded head made of hundreds of soft, hanging, icicle-like white spines, no caps, no gills. Spines long and drooping, turning yellow-tan at the tips. Framing: Identical framing to block_ready (layered exactly on top of it). Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## wc_young

- **Save as:** `assets/img/wc_young.png` (256×256, transparent)
- **Used for:** Wine cap bed, flush growing.
- **Align with:** `bed` (assets/img/bed.png)

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. The exact same wood-chip mound as the reference, with three small young Wine cap mushrooms (Stropharia rugosoannulata): burgundy-red smooth round caps on thick white stems, growing out of the wood-chip mound. Caps still rounded like buttons. Framing: Identical framing to bed (layered exactly on top of it). Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## wc_peak

- **Save as:** `assets/img/wc_peak.png` (256×256, transparent)
- **Used for:** Wine cap bed at peak.
- **Align with:** `bed` (assets/img/bed.png)

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. The exact same wood-chip mound as the reference, with a cluster of four mature Wine cap mushrooms (Stropharia rugosoannulata): burgundy-red smooth round caps on thick white stems, growing out of the wood-chip mound. Caps broad and domed, a white ring on each stem. Harvest-ready, veil just about to tear. Framing: Identical framing to bed (layered exactly on top of it). Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

## wc_overripe

- **Save as:** `assets/img/wc_overripe.png` (256×256, transparent)
- **Used for:** Wine cap flush past peak.
- **Align with:** `bed` (assets/img/bed.png)

```text
Cozy storybook illustration for a casual mobile game. Clean vector-like shapes, soft cel shading and gentle gradients, confident dark plum outlines (#2a1b2e). Warm palette: flamingo pink (#e2557a), deep rose (#b8325a), cream-white mycelium (#fbf8f1), honey-amber agar (#ead7a8), wheat straw (#d9b65a), sawdust brown (#8a6040). One centered subject, front view tilted slightly from above, soft contact shadow directly underneath, even studio lighting, readable at small sizes. The exact same wood-chip mound as the reference, with over-mature Wine cap mushrooms (Stropharia rugosoannulata): burgundy-red smooth round caps on thick white stems, growing out of the wood-chip mound. Caps flattened and faded to tan-brown, edges cracked. Framing: Identical framing to bed (layered exactly on top of it). Isolated subject on a fully transparent background (PNG alpha channel). Nothing else in frame.
```

