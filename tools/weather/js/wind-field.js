/**
 * wind-field demo
 * 2D pressure map with two pressure centres (H and L). Animated wind
 * particles stream from high to low pressure, their speed proportional
 * to the pressure gradient. Pressure is shown as a colour field with
 * isobars overlaid.
 */
registerDemo('wind-field', {
  init(container) {
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);

    const wrap = container.closest('.demo-container');
    const hiSlider = wrap.querySelector('[data-control="high-pressure"]');
    const loSlider = wrap.querySelector('[data-control="low-pressure"]');

    let hiP = 0.8;
    let loP = 0.2;

    function readSliders() {
      if (hiSlider) hiP = parseInt(hiSlider.value, 10) / 100;
      if (loSlider) loP = parseInt(loSlider.value, 10) / 100;
    }
    readSliders();

    if (hiSlider) hiSlider.addEventListener('input', () => { readSliders(); });
    if (loSlider) loSlider.addEventListener('input', () => { readSliders(); });

    // --- Pressure field ---
    // Two Gaussian centres placed left (H) and right (L).
    // Background ambient is 0.5. H adds pressure, L subtracts.
    const H_POS = { x: 0.25, y: 0.5 };
    const L_POS = { x: 0.75, y: 0.5 };
    const SIGMA = 0.22; // spread of each centre

    function gaussian(dx, dy) {
      return Math.exp(-(dx * dx + dy * dy) / (2 * SIGMA * SIGMA));
    }

    // Pressure at normalised coordinate (0-1, 0-1), returned as 0-1
    function pressure(x, y) {
      const gH = gaussian(x - H_POS.x, y - H_POS.y);
      const gL = gaussian(x - L_POS.x, y - L_POS.y);
      return 0.5 + (hiP - 0.5) * gH - (0.5 - loP) * gL;
    }

    // Gradient of pressure (finite differences) → wind direction
    const EPS = 0.005;
    function pressureGradient(x, y) {
      const dpdx = (pressure(x + EPS, y) - pressure(x - EPS, y)) / (2 * EPS);
      const dpdy = (pressure(x, y + EPS) - pressure(x, y - EPS)) / (2 * EPS);
      return { x: dpdx, y: dpdy };
    }

    // --- Wind particles ---
    const N = 600;
    const particles = [];

    function spawnParticle() {
      return {
        x: Math.random(),
        y: Math.random(),
        age: Math.random() * 1, // stagger initial ages
        maxAge: 1.2 + Math.random() * 1.6,
      };
    }

    for (let i = 0; i < N; i++) particles.push(spawnParticle());

    function stepParticles(dt) {
      for (let i = 0; i < N; i++) {
        const p = particles[i];
        p.age += dt;

        if (p.age > p.maxAge || p.x < -0.02 || p.x > 1.02 || p.y < -0.02 || p.y > 1.02) {
          particles[i] = spawnParticle();
          particles[i].age = 0;
          continue;
        }

        // Wind = negative pressure gradient (flows H→L)
        const g = pressureGradient(p.x, p.y);
        const speed = 0.45;
        p.x -= g.x * speed * dt;
        p.y -= g.y * speed * dt;
      }
    }

    // --- Rendering ---
    function resize() {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }

    // Pre-render pressure field into an offscreen canvas (update when sliders change)
    let fieldCanvas = null;
    let prevHi = -1, prevLo = -1;

    function renderField(w, h, dpr) {
      fieldCanvas = document.createElement('canvas');
      fieldCanvas.width = w;
      fieldCanvas.height = h;
      const ctx = fieldCanvas.getContext('2d');

      // Colour field — sample at lower resolution for performance
      const step = Math.max(1, Math.round(4 * dpr));
      for (let py = 0; py < h; py += step) {
        for (let px = 0; px < w; px += step) {
          const nx = px / w;
          const ny = py / h;
          const p = pressure(nx, ny);
          const c = pressureColor(p);
          ctx.fillStyle = c;
          ctx.fillRect(px, py, step, step);
        }
      }

      // Isobars
      drawIsobars(ctx, w, h);

      // H and L labels
      ctx.font = `bold ${20 * dpr}px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const hx = H_POS.x * w, hy = H_POS.y * h;
      const lx = L_POS.x * w, ly = L_POS.y * h;

      // H label
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillText('H', hx, hy);
      // L label
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillText('L', lx, ly);

      prevHi = hiP;
      prevLo = loP;
    }

    // Pressure → colour: high=warm red, low=cool blue, mid=dark neutral
    function pressureColor(p) {
      // p in roughly [0,1]
      const t = Math.max(0, Math.min(1, p));
      // blue (low) → dark grey (mid) → red-orange (high)
      let r, g, b;
      if (t < 0.5) {
        const f = t / 0.5;
        r = Math.round(20 + 15 * f);
        g = Math.round(35 + 10 * f);
        b = Math.round(100 - 50 * f);
      } else {
        const f = (t - 0.5) / 0.5;
        r = Math.round(35 + 80 * f);
        g = Math.round(45 - 20 * f);
        b = Math.round(50 - 30 * f);
      }
      return `rgb(${r},${g},${b})`;
    }

    // Marching-squares-lite isobars
    function drawIsobars(ctx, w, h) {
      const RES = 80;
      const levels = [0.3, 0.4, 0.5, 0.6, 0.7];
      // Build a grid of pressure values
      const grid = [];
      for (let iy = 0; iy <= RES; iy++) {
        grid[iy] = [];
        for (let ix = 0; ix <= RES; ix++) {
          grid[iy][ix] = pressure(ix / RES, iy / RES);
        }
      }

      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1;

      for (const level of levels) {
        ctx.beginPath();
        for (let iy = 0; iy < RES; iy++) {
          for (let ix = 0; ix < RES; ix++) {
            // Check each cell edge for a crossing
            const tl = grid[iy][ix];
            const tr = grid[iy][ix + 1];
            const bl = grid[iy + 1][ix];

            // Top edge
            if ((tl - level) * (tr - level) < 0) {
              const frac = (level - tl) / (tr - tl);
              const px = ((ix + frac) / RES) * w;
              const py = (iy / RES) * h;
              // Find matching crossing in adjacent edges to draw a segment
              drawCrossSegment(ctx, grid, ix, iy, RES, level, w, h);
            }
          }
        }
        ctx.stroke();
      }
    }

    function drawCrossSegment(ctx, grid, ix, iy, RES, level, w, h) {
      // Collect crossings on the 4 edges of cell (ix, iy)
      const pts = [];
      const tl = grid[iy][ix];
      const tr = grid[iy][ix + 1];
      const bl = grid[iy + 1][ix];
      const br = grid[iy + 1][ix + 1];

      // Top edge
      if ((tl - level) * (tr - level) < 0) {
        const f = (level - tl) / (tr - tl);
        pts.push({ x: ((ix + f) / RES) * w, y: (iy / RES) * h });
      }
      // Bottom edge
      if ((bl - level) * (br - level) < 0) {
        const f = (level - bl) / (br - bl);
        pts.push({ x: ((ix + f) / RES) * w, y: ((iy + 1) / RES) * h });
      }
      // Left edge
      if ((tl - level) * (bl - level) < 0) {
        const f = (level - tl) / (bl - tl);
        pts.push({ x: (ix / RES) * w, y: ((iy + f) / RES) * h });
      }
      // Right edge
      if ((tr - level) * (br - level) < 0) {
        const f = (level - tr) / (br - tr);
        pts.push({ x: ((ix + 1) / RES) * w, y: ((iy + f) / RES) * h });
      }

      if (pts.length >= 2) {
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
      }
    }

    // --- Main draw ---
    function draw() {
      const w = canvas.width;
      const h = canvas.height;
      const dpr = window.devicePixelRatio || 1;
      const ctx = canvas.getContext('2d');

      // Re-render field if sliders changed
      if (prevHi !== hiP || prevLo !== loP || !fieldCanvas || fieldCanvas.width !== w) {
        renderField(w, h, dpr);
      }

      ctx.clearRect(0, 0, w, h);

      // Background field
      ctx.drawImage(fieldCanvas, 0, 0);

      // Wind particles: short streaks
      const TRAIL = 0.025; // trail length in normalised coords
      ctx.lineCap = 'round';

      for (const p of particles) {
        // Fade in at birth and fade out at death
        const lifeFrac = p.age / p.maxAge;
        let alpha = 1;
        if (lifeFrac < 0.1) alpha = lifeFrac / 0.1;
        else if (lifeFrac > 0.8) alpha = (1 - lifeFrac) / 0.2;
        alpha = Math.max(0, Math.min(1, alpha));

        // Wind direction at this point for the streak tail
        const g = pressureGradient(p.x, p.y);
        const mag = Math.sqrt(g.x * g.x + g.y * g.y);

        // Streak: line from current pos backwards along wind
        const tailLen = TRAIL * Math.min(1, mag * 2.5);
        const nx = mag > 0.001 ? g.x / mag : 0;
        const ny = mag > 0.001 ? g.y / mag : 0;

        const px = p.x * w;
        const py = p.y * h;
        const tx = (p.x + nx * tailLen) * w;  // tail is "upwind"
        const ty = (p.y + ny * tailLen) * h;

        // Speed → brightness
        const speed = Math.min(1, mag * 3);
        const bright = 140 + Math.round(115 * speed);

        ctx.strokeStyle = `rgba(${bright},${bright},${Math.min(255, bright + 30)},${(0.35 + 0.45 * speed) * alpha})`;
        ctx.lineWidth = (1.2 + 1.5 * speed) * dpr;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(tx, ty);
        ctx.stroke();

        // Small head dot
        ctx.beginPath();
        ctx.arc(px, py, (0.8 + 0.8 * speed) * dpr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${bright},${bright},${Math.min(255, bright + 40)},${(0.5 + 0.4 * speed) * alpha})`;
        ctx.fill();
      }
    }

    // --- Animation loop ---
    let animId = 0;
    let lastTime = 0;

    function frame(now) {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      stepParticles(dt);
      draw();
      animId = requestAnimationFrame(frame);
    }

    function start() {
      if (!animId) {
        lastTime = performance.now();
        animId = requestAnimationFrame(frame);
      }
    }

    function stop() {
      if (animId) {
        cancelAnimationFrame(animId);
        animId = 0;
      }
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) start(); else stop();
    }, { threshold: 0 });
    observer.observe(container);

    window.addEventListener('resize', () => {
      resize();
      prevHi = -1; // force field re-render
    });
    resize();
    start();
  }
});
