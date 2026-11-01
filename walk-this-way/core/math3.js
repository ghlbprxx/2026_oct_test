// Minimal vector / quaternion math. Vectors are [x, y, z]; quaternions are [x, y, z, w].

export const vAdd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const vSub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const vScale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const vLen = (a) => Math.hypot(a[0], a[1], a[2]);

export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
export const smoothstep = (u) => { const t = clamp(u, 0, 1); return t * t * (3 - 2 * t); };

export const IDENTITY_Q = [0, 0, 0, 1];

export function qMul(a, b) {
  const [ax, ay, az, aw] = a;
  const [bx, by, bz, bw] = b;
  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  ];
}

export const qConj = (q) => [-q[0], -q[1], -q[2], q[3]];

// Same convention as THREE.Euler(x, y, z, 'YXZ'): R = Ry · Rx · Rz.
export function qFromEulerYXZ(x, y, z) {
  const qx = [Math.sin(x / 2), 0, 0, Math.cos(x / 2)];
  const qy = [0, Math.sin(y / 2), 0, Math.cos(y / 2)];
  const qz = [0, 0, Math.sin(z / 2), Math.cos(z / 2)];
  return qMul(qMul(qy, qx), qz);
}

export function qRotate(q, v) {
  const [qx, qy, qz, qw] = q;
  const [vx, vy, vz] = v;
  const tx = 2 * (qy * vz - qz * vy);
  const ty = 2 * (qz * vx - qx * vz);
  const tz = 2 * (qx * vy - qy * vx);
  return [
    vx + qw * tx + (qy * tz - qz * ty),
    vy + qw * ty + (qz * tx - qx * tz),
    vz + qw * tz + (qx * ty - qy * tx),
  ];
}
