// Fixed-timestep accumulator with playback speed, pause, and single-frame stepping.

export function createClock(simCfg) {
  const { fixedStep, frameStep, maxStepsPerFrame } = simCfg;
  let acc = 0;
  let pending = 0;
  return {
    speed: 1,
    paused: false,
    // Returns how many fixed steps to run for this real-time delta.
    advance(realDt) {
      let sim;
      if (this.paused) { sim = pending; pending = 0; }
      else sim = Math.min(Math.max(realDt, 0), 0.1) * this.speed;
      acc += sim;
      const n = Math.min(Math.floor((acc + 1e-9) / fixedStep), maxStepsPerFrame);
      acc = Math.max(0, acc - n * fixedStep);
      return n;
    },
    frameStep() { if (this.paused) pending += frameStep; },
    fixedStep,
  };
}
