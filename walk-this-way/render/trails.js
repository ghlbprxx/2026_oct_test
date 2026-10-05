// Long-exposure motion trails. Core records each trail point relative to the walker's root at the
// fixed sim rate, along with how far the walker had travelled. Drawing each sample shifted back by
// the distance walked since makes treadmill motion read like walking over ground: foot arcs,
// head-bob waves, and stride spacing.
import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

const FADE_TO = new THREE.Color('#f1ece2'); // floor tone

export function createTrails(scene, trailCfg, sideColors) {
  const material = new LineMaterial({ linewidth: trailCfg.width, vertexColors: true, worldUnits: false });
  const tracks = new Map(); // walker key → Line2 per trail point
  const color = new THREE.Color();

  function linesFor(key) {
    if (!tracks.has(key)) {
      tracks.set(key, trailCfg.points.map(([, side]) => {
        const line = new Line2(new LineGeometry(), material);
        line.frustumCulled = false;
        line.visible = false;
        line.userData.color = new THREE.Color(sideColors[side]);
        scene.add(line);
        return line;
      }));
    }
    return tracks.get(key);
  }

  // walker: { trail, cycles, distance }; root: [x, z] lane origin;
  // travel(distance) → floor offset in floor mode, or null on the treadmill.
  function update(key, walker, root, travel, visible) {
    const lines = linesFor(key);
    let samples = walker.trail;
    if (travel && samples.length) {
      // Keep only the run since the last wrap of the looping floor.
      let i = samples.length - 1;
      while (i > 0 && travel(samples[i - 1].distance) <= travel(samples[i].distance)) i--;
      samples = samples.slice(i);
    }
    const n = samples.length;
    lines.forEach((line, j) => {
      line.visible = visible && n >= 2;
      if (!line.visible) return;
      const positions = new Float32Array(n * 3);
      const colors = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const s = samples[i];
        const p = s.pts[j];
        const shift = travel ? travel(s.distance) : s.distance - walker.distance;
        positions[i * 3] = root[0] + p[0];
        positions[i * 3 + 1] = p[1];
        positions[i * 3 + 2] = root[1] + p[2] + shift;
        const age = Math.min(1, (walker.cycles - s.cycles) / trailCfg.cycles);
        color.copy(line.userData.color).lerp(FADE_TO, age ** 1.5);
        colors[i * 3] = color.r; colors[i * 3 + 1] = color.g; colors[i * 3 + 2] = color.b;
      }
      line.geometry.dispose();
      line.geometry = new LineGeometry();
      line.geometry.setPositions(positions);
      line.geometry.setColors(colors);
    });
  }

  return {
    update,
    dispose() {
      for (const lines of tracks.values()) for (const l of lines) { l.geometry.dispose(); scene.remove(l); }
      material.dispose();
    },
  };
}
