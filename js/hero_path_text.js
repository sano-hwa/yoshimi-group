const svg = document.querySelector('.hero__path-text');
const bg = document.getElementById('heroSloganBg');
const path = document.getElementById('heroSloganPath');
const textEl = document.getElementById('heroSloganText');
const textPath = document.getElementById('heroSloganTextPath');

if (svg && bg && path && textEl && textPath) {
  const PHRASE = 'Connecting People. Moving the Future. ';
  const COPIES = 6;
  const SPEED = 48;
  const FIGMA_W = 1512;
  const LOCK_W = 2000;
  const ELLIPSE = { cx: 456, cy: 959, rx: 1666, ry: 778 };

  textPath.textContent = PHRASE.repeat(COPIES);

  let phraseLength = 0;
  let offset = 0;
  let last = performance.now();
  let running = false;

  function layout() {
    const W = svg.clientWidth;
    const H = svg.clientHeight || 1;
    const layoutW = Math.max(W, LOCK_W);
    const sX = layoutW / FIGMA_W;
    const rx = ELLIPSE.rx * sX;
    const cx = ELLIPSE.cx * sX;
    const ry = ELLIPSE.ry;
    const cy = ELLIPSE.cy;
    const peakY = cy - ry;
    const shiftX = (W - layoutW) / 2;

    function yAtLocal(xLocal) {
      const t = (xLocal - cx) / rx;
      if (Math.abs(t) >= 1) return peakY;
      return cy - ry * Math.sqrt(1 - t * t);
    }

    const steps = 80;
    let bgD = 'M 0 -20';
    for (let i = 0; i <= steps; i++) {
      const x = (W * i) / steps;
      bgD += ` L ${x} ${yAtLocal(x - shiftX)}`;
    }
    bgD += ` L ${W} -20 Z`;

    let pathD = '';
    for (let i = 0; i <= steps; i++) {
      const xLocal = (layoutW * i) / steps;
      pathD += (i === 0 ? 'M ' : ' L ') + (shiftX + xLocal) + ' ' + yAtLocal(xLocal);
    }

    bg.setAttribute('d', bgD);
    path.setAttribute('d', pathD);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('preserveAspectRatio', 'none');
  }

  function measure() {
    phraseLength = textEl.getComputedTextLength() / COPIES;
  }

  function tick(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (phraseLength > 0) {
      offset = (offset + SPEED * dt) % phraseLength;
      textPath.setAttribute('startOffset', String(-offset));
    }
    requestAnimationFrame(tick);
  }

  function start() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(tick);
  }

  function refresh() {
    layout();
    measure();
  }

  const fontsReady = document.fonts && document.fonts.ready
    ? document.fonts.ready
    : Promise.resolve();

  fontsReady.then(() => {
    refresh();
    start();
  });

  if (window.ResizeObserver) {
    new ResizeObserver(refresh).observe(svg);
  } else {
    window.addEventListener('resize', refresh);
  }
}
