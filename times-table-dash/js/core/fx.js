// Soft falling petals on the full-screen #fx canvas, used for celebrations. Skipped under reduced motion.
export const fx = (function () {
  const cv = document.getElementById('fx');
  const ctx = cv.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let parts = [], raf = 0, dpr = 1;
  function size() { dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = window.innerWidth * dpr; cv.height = window.innerHeight * dpr; }
  size(); window.addEventListener('resize', size);
  function rain(n) {
    if (reduce.matches) return;
    const cs = ['#f2c4cf', '#e9b3c2', '#f7dbe2', '#cfe3d8'];
    for (let i = 0; i < n; i++) {
      parts.push({ x: Math.random() * window.innerWidth, y: -20 - Math.random() * window.innerHeight * 0.7, vy: 0.7 + Math.random() * 0.9, size: 8 + Math.random() * 6, c: cs[i % cs.length], rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.04, phase: Math.random() * 6, t: 0, life: 1 });
    }
    if (!raf) raf = requestAnimationFrame(step);
  }
  function step() {
    const w = window.innerWidth, h = window.innerHeight;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    parts = parts.filter(p => p.y < h + 30 && p.life > 0);
    for (const p of parts) {
      p.t += 0.02; p.y += p.vy; p.x += Math.sin(p.t + p.phase) * 0.6; p.rot += p.vr;
      if (p.y > h * 0.7) p.life -= 0.012;
      ctx.save(); ctx.globalAlpha = 0.75 * Math.max(0, Math.min(1, p.life)); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c;
      const s = p.size / 2; ctx.beginPath(); ctx.moveTo(0, s); ctx.bezierCurveTo(s * 1.1, s * 0.3, s * 0.7, -s * 0.9, s * 0.18, -s); ctx.lineTo(0, -s * 0.7); ctx.lineTo(-s * 0.18, -s); ctx.bezierCurveTo(-s * 0.7, -s * 0.9, -s * 1.1, s * 0.3, 0, s); ctx.fill();
      ctx.restore();
    }
    if (parts.length) raf = requestAnimationFrame(step); else { raf = 0; ctx.clearRect(0, 0, w, h); }
  }
  return { rain };
})();
