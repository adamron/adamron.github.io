/**
 * random-1d demo
 * Draws vertical bars with independently random heights to illustrate
 * why pure randomness doesn't produce natural-looking terrain.
 * Click or drag to regenerate with a new seed.
 */
registerDemo('random-1d', {
  init(container) {
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);

    const BAR_COUNT = 80;
    const BAR_COLOR = '#5a9a6a';
    const BAR_COLOR_TOP = '#7ac48a';
    let heights = generateHeights(BAR_COUNT);
    let startHeights = heights.slice();
    let targetHeights = heights.slice();
    let animStart = 0;
    const ANIM_DURATION = 280;

    function generateHeights(n) {
      const arr = new Array(n);
      for (let i = 0; i < n; i++) arr[i] = Math.random();
      return arr;
    }

    function ease(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function resize() {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }

    function currentHeights(now) {
      const t = Math.min(1, (now - animStart) / ANIM_DURATION);
      const e = ease(t);
      const out = new Array(BAR_COUNT);
      for (let i = 0; i < BAR_COUNT; i++) {
        out[i] = startHeights[i] + (targetHeights[i] - startHeights[i]) * e;
      }
      if (t >= 1) {
        startHeights = targetHeights.slice();
      }
      return out;
    }

    function draw(now) {
      heights = currentHeights(now);

      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      const dpr = window.devicePixelRatio || 1;

      ctx.clearRect(0, 0, w, h);

      const padding = 16 * dpr;
      const drawW = w - padding * 2;
      const drawH = h - padding * 2;
      const gap = 1 * dpr;
      const barW = Math.max(1, (drawW - gap * (BAR_COUNT - 1)) / BAR_COUNT);

      for (let i = 0; i < BAR_COUNT; i++) {
        const barH = Math.max(0, heights[i] * drawH);
        const x = padding + i * (barW + gap);
        const y = padding + drawH - barH;

        const grad = ctx.createLinearGradient(0, y, 0, y + barH);
        grad.addColorStop(0, BAR_COLOR_TOP);
        grad.addColorStop(1, BAR_COLOR);
        ctx.fillStyle = grad;

        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, 1.5 * dpr);
        ctx.fill();
      }

      // Keep looping while animating
      if (now - animStart < ANIM_DURATION) {
        requestAnimationFrame(draw);
      }
    }

    function regenerate() {
      // Snapshot current visual state as new start
      startHeights = currentHeights(performance.now());
      targetHeights = generateHeights(BAR_COUNT);
      animStart = performance.now();
      requestAnimationFrame(draw);
    }

    // Click or drag to regenerate (throttled while dragging)
    let dragging = false;
    let lastRegen = 0;

    canvas.addEventListener('pointerdown', () => {
      dragging = true;
      regenerate();
      lastRegen = performance.now();
    });
    canvas.addEventListener('pointermove', () => {
      const now = performance.now();
      if (dragging && now - lastRegen > 200) {
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
    // Initial draw (static, no animation needed)
    requestAnimationFrame(draw);
  }
});
