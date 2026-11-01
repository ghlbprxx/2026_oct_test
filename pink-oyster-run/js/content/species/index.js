// Species registry. The sim looks species data up per vessel (v.sp) or per game (g.species);
// anything without a species is pink oyster, so old saves and the original tests behave exactly as before.
import { PACK as PINK } from './pink-oyster.js';
import { PACK as LIONS } from './lions-mane.js';
import { PACK as WINE } from './wine-cap.js';

export const SPECIES_BY = { 'pink-oyster': PINK, 'lions-mane': LIONS, 'wine-cap': WINE };
export const SPECIES_ORDER = ['pink-oyster', 'lions-mane', 'wine-cap'];
export const packOf = id => SPECIES_BY[id] || PINK;
export const spv = v => packOf(v && v.sp);
export const spg = g => packOf(g && g.species);
/** A vessel's recipe in its own species (falls back to pink for shared ids like the neighbor's coffee). */
export const recipeOf = v => spv(v).recipes[v.recipe] || PINK.recipes[v.recipe];
/** The species after `id`, or null at the end. */
export const nextSpecies = id => SPECIES_ORDER[SPECIES_ORDER.indexOf(id || 'pink-oyster') + 1] || null;
