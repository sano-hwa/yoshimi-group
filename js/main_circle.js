const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
let W, H, DPR;

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener('resize', resize);
resize();

function makeCluster(seed) {
  return {
    baseX: seed.x,
    baseY: seed.y,
    radius: seed.radius,   // shared radius for all ellipses
    aspect: seed.aspect,   // ry / rx, <1 makes a flatter ellipse
    opacity: seed.opacity
  };
}

// Fixed, hand-picked offsets and tilts — one entry per ellipse.
// Position and angle step forward a little each time (rotation
// +3° per ellipse), so the set reads as one shape traced again
// and again with a slight, consistent turn — not scattered.
// The whole group is also rotated 90° from its original layout.
// dx/dy shift the center (in px); rotation is in radians.
// These never change over time: only the orbiting dots move.
const DEG3 = 3 * Math.PI / 180;
const GROUP_ROTATION = Math.PI / 2; // rotate the whole cluster 90°
const ellipseLayout = [
  { dx: -24, dy: -14, rotation: -0.15 - DEG3 * 2 + GROUP_ROTATION },
  { dx: -10, dy:  -6, rotation: -0.15 - DEG3 * 1 + GROUP_ROTATION },
  { dx:   0, dy:   0, rotation: -0.15 + GROUP_ROTATION },
  { dx:  10, dy:   6, rotation: -0.15 + DEG3 * 1 + GROUP_ROTATION },
  { dx:  22, dy:  13, rotation: -0.15 + DEG3 * 2 + GROUP_ROTATION },
].map(l => ({
  // rotate each ellipse's center offset by the same 90°
  dx: l.dx * Math.cos(GROUP_ROTATION) - l.dy * Math.sin(GROUP_ROTATION),
  dy: l.dx * Math.sin(GROUP_ROTATION) + l.dy * Math.cos(GROUP_ROTATION),
  rotation: l.rotation
}));

const clusters = [
  makeCluster({ x: 0.50, y: 0.46, radius: 310, aspect: 0.62, opacity: 0.5 }),
];

// The whole set sways together as one rigid shape — a single
// shared angle rotates every ellipse's position AND tilt in the
// same direction at the same time, so the motion reads as one
// coherent turn rather than five ellipses wobbling separately.
// Outer ellipses (larger index) swing a little further, giving
// a gentle fan/pinwheel feel without breaking the unity.
// Because it's driven by one sin(phase), it always returns to
// exactly 0 — and the base layout — once per full cycle.
const LOOP_PERIOD_MS = 18000; // one full cycle, in milliseconds
const MAX_SWAY = 40 * Math.PI / 180; // how far the group swings, in radians

function draw(t) {
  ctx.clearRect(0, 0, W, H);

  const phase = (t % LOOP_PERIOD_MS) / LOOP_PERIOD_MS * Math.PI * 2;
  const sway = Math.sin(phase); // -1..1, single shared driver

  clusters.forEach(cl => {
    const cx = cl.baseX * W;
    const cy = cl.baseY * H;
    const rx = cl.radius;
    const ry = rx * cl.aspect;

    ellipseLayout.forEach((layout, i) => {
      // each ellipse swings by the same sway value, scaled by
      // its own weight — same direction and timing for everyone
      const weight = 0.2 + i * 0.15;
      const swayAngle = sway * MAX_SWAY * weight;

      // rotate this ellipse's base offset around the cluster
      // center by the shared sway angle, so the whole group
      // turns together like one rigid piece
      const cos = Math.cos(swayAngle);
      const sin = Math.sin(swayAngle);
      const ex = cx + layout.dx * cos - layout.dy * sin;
      const ey = cy + layout.dx * sin + layout.dy * cos;
      const rot = layout.rotation + swayAngle;

      // the ellipse outline
      ctx.beginPath();
      ctx.ellipse(ex, ey, rx, ry, rot, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${cl.opacity})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // an orbiting dot, riding this ellipse's current shape/angle.
      // Direction and speed alternate per ellipse so dots don't
      // all line up, like small bodies on independent orbits.
      const dir = i % 2 === 0 ? 1 : -1;
      const orbitSpeed = 0.00045 * dir / (1 + (i % 3) * 0.3);
      const angle = t * orbitSpeed + i * 1.7;

      const dx = Math.cos(angle) * rx;
      const dy = Math.sin(angle) * ry;
      const px = ex + dx * Math.cos(rot) - dy * Math.sin(rot);
      const py = ey + dx * Math.sin(rot) + dy * Math.cos(rot);

      const dotAlpha = 0.9;
      const dotR = 3;

      // soft glow
      ctx.beginPath();
      ctx.arc(px, py, dotR * 2.6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${dotAlpha * 0.12})`;
      ctx.fill();

      // core dot
      ctx.beginPath();
      ctx.arc(px, py, dotR, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${dotAlpha})`;
      ctx.fill();
    });
  });

  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);