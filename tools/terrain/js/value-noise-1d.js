/**
 * value-noise-1d demo
 * Draws a smooth curve through random lattice points using Perlin's
 * smoothstep interpolation. Lattice points shown as dots.
 * Frequency slider controls how many lattice points span the width.
 * Click/drag to regenerate with new random values.
 */
registerDemo('value-noise-1d', {
  init(container) {
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);

    const CURVE_COLOR = '#5a9a6a';
    const FILL_COLOR = 'rgba(90, 154, 106, 0.12)';
    const DOT_COLOR = '#7ac48a';
    const SAMPLES = 400; // points along the curve for smoothness

    // We generate more lattice values than we'll ever need at max frequency
    const MAX_LATTICE = 32;
    let lattice = generateLattice();
    let startLattice = lattice.slice();
    let targetLattice = lattice.slice();
    let animStart = 0;
    const ANIM_DURATION = 350;
    let frequency = 8;

    // Find the frequency slider in the parent demo-container
    const demoContainer = container.closest('.demo-container');
    const freqSlider = demoContainer.querySelector('[data-control="frequency"]');
    if (freqSlider) {
      frequency = parseInt(freqSlider.value, 10);
      freqSlider.addEventListener('input', () => {
        frequency = parseInt(freqSlider.value, 10);
        requestAnimationFrame(draw);
      });
    }

    function generateLattice() {
      const arr = new Array(MAX_LATTICE);
      for (let i = 0; i < MAX_LATTICE; i++) arr[i] = Math.random();
      return arr;
    }

    // Perlin's improved smoothstep: 6t^5 - 15t^4 + 10t^3
    function smoothstep(t) {
      return t * t * t * (t * (t * 6 - 15) + 10);
    }

    function sampleNoise(x, latticeValues) {
      // x is in [0, 1], scale by frequency
      const scaled = x * frequency;
      const i0 = Math.floor(scaled);
      const t = scaled - i0;
      const v0 = latticeValues[i0 % MAX_LATTICE];
      const v1 = latticeValues[(i0 + 1) % MAX_LATTICE];
      return v0 + smoothstep(t) * (v1 - v0);
    }

    function animEase(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function currentLattice(now) {
      const t = Math.min(1, (now - animStart) / ANIM_DURATION);
      const e = animEase(t);
      const out = new Array(MAX_LATTICE);
      for (let i = 0; i < MAX_LATTICE; i++) {
        out[i] = startLattice[i] + (targetLattice[i] - startLattice[i]) * e;
      }
      if (t >= 1) {
        startLattice = targetLattice.slice();
      }
      return out;
    }

    function resize() {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }

    function draw(now) {
      if (typeof now !== 'number') now = performance.now();
      lattice = currentLattice(now);

      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      const dpr = window.devicePixelRatio || 1;

      ctx.clearRect(0, 0, w, h);

      const padding = 20 * dpr;
      const drawW = w - padding * 2;
      const drawH = h - padding * 2;

      // Draw filled area under curve
      ctx.beginPath();
      ctx.moveTo(padding, padding + drawH);
      for (let s = 0; s <= SAMPLES; s++) {
        const x = s / SAMPLES;
        const val = sampleNoise(x, lattice);
        const px = padding + x * drawW;
        const py = padding + drawH - val * drawH;
        ctx.lineTo(px, py);
      }
      ctx.lineTo(padding + drawW, padding + drawH);
      ctx.closePath();
      ctx.fillStyle = FILL_COLOR;
      ctx.fill();

      // Draw curve
      ctx.beginPath();
      for (let s = 0; s <= SAMPLES; s++) {
        const x = s / SAMPLES;
        const val = sampleNoise(x, lattice);
        const px = padding + x * drawW;
        const py = padding + drawH - val * drawH;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = CURVE_COLOR;
      ctx.lineWidth = 2 * dpr;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Draw lattice dots
      ctx.fillStyle = DOT_COLOR;
      for (let i = 0; i <= frequency; i++) {
        const x = i / frequency;
        if (x > 1) break;
        const val = lattice[i % MAX_LATTICE];
        const px = padding + x * drawW;
        const py = padding + drawH - val * drawH;
        ctx.beginPath();
        ctx.arc(px, py, 4 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      if (now - animStart < ANIM_DURATION) {
        requestAnimationFrame(draw);
      }
    }

    function regenerate() {
      startLattice = currentLattice(performance.now());
      targetLattice = generateLattice();
      animStart = performance.now();
      requestAnimationFrame(draw);
    }

    // Click or drag to regenerate
    let dragging = false;
    let lastRegen = 0;

    canvas.addEventListener('pointerdown', () => {
      dragging = true;
      regenerate();
      lastRegen = performance.now();
    });
    canvas.addEventListener('pointermove', () => {
      const now = performance.now();
      if (dragging && now - lastRegen > 250) {
        regenerate();
        lastRegen = now;
      }
    });
    canvas.addEventListener('pointerup', () => { dragging = false; });
    canvas.addEventListener('pointerleave', () => { dragging = false; });
    canvas.style.touchAction = 'none';
    canvas.style.cursor = 'pointer';

    window.addEventListener('resize', () => { resize(); requestAnimationFrame(draw); });
    resize();
    requestAnimationFrame(draw);
  }
});
