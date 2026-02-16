/**
 * octaves-1d demo
 * Shows individual octaves of value noise as colored lines and their
 * fBm sum as a white line. Controls for octave count, persistence,
 * and lacunarity. Click/drag to regenerate.
 */
registerDemo('octaves-1d', {
  init(container) {
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);

    const SAMPLES = 500;
    const MAX_OCTAVES = 8;
    const MAX_LATTICE = 256;
    const BASE_FREQ = 2;
    const OCTAVE_COLORS = [
      '#e06c75', '#e5c07b', '#61afef', '#c678dd',
      '#56b6c2', '#d19a66', '#98c379', '#be5046'
    ];
    const SUM_COLOR = '#eee';

    let lattice = generateLattice();
    let startLattice = lattice.slice();
    let targetLattice = lattice.slice();
    let animStart = 0;
    const ANIM_DURATION = 400;

    let octaveCount = 4;
    let persistence = 0.5;
    let lacunarity = 2.0;

    const demoContainer = container.closest('.demo-container');
    bindSlider('octaves', v => { octaveCount = v; });
    bindSlider('persistence', v => { persistence = v / 100; });
    bindSlider('lacunarity', v => { lacunarity = v / 100; });

    function bindSlider(name, setter) {
      const el = demoContainer.querySelector(`[data-control="${name}"]`);
      if (!el) return;
      setter(parseFloat(el.value));
      el.addEventListener('input', () => {
        setter(parseFloat(el.value));
        requestAnimationFrame(draw);
      });
    }

    function generateLattice() {
      const arr = new Array(MAX_LATTICE);
      for (let i = 0; i < MAX_LATTICE; i++) arr[i] = Math.random();
      return arr;
    }

    function smoothstep(t) {
      return t * t * t * (t * (t * 6 - 15) + 10);
    }

    function sampleNoise(x, freq, latticeValues) {
      const scaled = x * freq;
      const i0 = Math.floor(scaled);
      const t = scaled - i0;
      const v0 = latticeValues[((i0 % MAX_LATTICE) + MAX_LATTICE) % MAX_LATTICE];
      const v1 = latticeValues[(((i0 + 1) % MAX_LATTICE) + MAX_LATTICE) % MAX_LATTICE];
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
      if (t >= 1) startLattice = targetLattice.slice();
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

      // Compute max possible amplitude for normalization
      let maxAmp = 0;
      let amp = 1;
      for (let o = 0; o < octaveCount; o++) {
        maxAmp += amp;
        amp *= persistence;
      }

      // Precompute all octave sample arrays + sum
      const octaveData = [];
      const sumData = new Float32Array(SAMPLES + 1);

      amp = 1;
      let freq = BASE_FREQ;
      for (let o = 0; o < octaveCount; o++) {
        const data = new Float32Array(SAMPLES + 1);
        for (let s = 0; s <= SAMPLES; s++) {
          const x = s / SAMPLES;
          const val = (sampleNoise(x, freq, lattice) - 0.5) * amp;
          data[s] = val;
          sumData[s] += val;
        }
        octaveData.push({ data, amp });
        amp *= persistence;
        freq *= lacunarity;
      }

      // Map value to y pixel. Center vertically, scale to fit.
      function toY(val) {
        return padding + drawH / 2 - (val / maxAmp) * (drawH / 2);
      }

      // Draw individual octaves (thin, semi-transparent)
      for (let o = 0; o < octaveCount; o++) {
        ctx.beginPath();
        for (let s = 0; s <= SAMPLES; s++) {
          const px = padding + (s / SAMPLES) * drawW;
          const py = toY(octaveData[o].data[s]);
          if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = OCTAVE_COLORS[o % OCTAVE_COLORS.length];
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = 1.5 * dpr;
        ctx.lineJoin = 'round';
        ctx.stroke();
      }

      // Draw sum line (bright white, thicker)
      ctx.globalAlpha = 1;
      // Filled area under sum
      ctx.beginPath();
      ctx.moveTo(padding, toY(0));
      for (let s = 0; s <= SAMPLES; s++) {
        const px = padding + (s / SAMPLES) * drawW;
        ctx.lineTo(px, toY(sumData[s]));
      }
      ctx.lineTo(padding + drawW, toY(0));
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.fill();

      ctx.beginPath();
      for (let s = 0; s <= SAMPLES; s++) {
        const px = padding + (s / SAMPLES) * drawW;
        const py = toY(sumData[s]);
        if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = SUM_COLOR;
      ctx.lineWidth = 2.5 * dpr;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Center line (subtle)
      ctx.beginPath();
      ctx.moveTo(padding, toY(0));
      ctx.lineTo(padding + drawW, toY(0));
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1 * dpr;
      ctx.stroke();

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
