/**
 * pressure-particles demo
 * 2D particle simulation showing warm particles rising (buoyancy)
 * and cool particles sinking (gravity). A heat source at the bottom
 * warms nearby particles, driving convection-like circulation.
 */
registerDemo('pressure-particles', {
  init(container) {
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);

    const wrap = container.closest('.demo-container');
    const heatSlider = wrap.querySelector('[data-control="heat"]');

    let heat = 0.6;
    if (heatSlider) {
      heat = parseInt(heatSlider.value, 10) / 100;
      heatSlider.addEventListener('input', () => {
        heat = parseInt(heatSlider.value, 10) / 100;
      });
    }

    // --- Particles ---
    // Coordinates are normalized [0,1]. y=0 is top, y=1 is bottom/ground.
    const N = 450;
    const particles = [];
    for (let i = 0; i < N; i++) {
      particles.push({
        x: Math.random(),
        y: 0.3 + Math.random() * 0.65,
        vx: 0,
        vy: 0,
        temp: 0.05 + Math.random() * 0.15,
      });
    }

    // --- Physics ---
    const GRAVITY = 0.55;
    const BUOYANCY = 1.5;
    const DRAG = 0.984;
    const COOL_RATE = 0.35;
    const HEAT_ZONE = 0.12;   // bottom 12% is the heat zone
    const JITTER_X = 0.12;
    const JITTER_Y = 0.04;
    const PAD = 0.005;

    function step(dt) {
      const heatRate = heat * 2.8;

      for (const p of particles) {
        // Altitude: 0 at ground (y=1), 1 at ceiling (y=0)
        const alt = 1 - p.y;

        // Heating near ground
        if (alt < HEAT_ZONE && heatRate > 0) {
          const proximity = 1 - alt / HEAT_ZONE;
          p.temp += heatRate * proximity * proximity * dt;
        }

        // Cooling everywhere
        p.temp -= COOL_RATE * dt;
        if (p.temp < 0) p.temp = 0;
        if (p.temp > 1) p.temp = 1;

        // Forces: gravity down, buoyancy up for warm particles
        const fy = GRAVITY - BUOYANCY * p.temp
                  + (Math.random() - 0.5) * JITTER_Y;
        const fx = (Math.random() - 0.5) * JITTER_X;

        p.vx += fx * dt;
        p.vy += fy * dt;

        // Frame-rate independent drag
        const d = Math.pow(DRAG, dt * 60);
        p.vx *= d;
        p.vy *= d;

        // Integrate position
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Soft boundary bounce
        if (p.x < PAD)     { p.x = PAD;     p.vx = Math.abs(p.vx) * 0.3; }
        if (p.x > 1 - PAD) { p.x = 1 - PAD; p.vx = -Math.abs(p.vx) * 0.3; }
        if (p.y < PAD)     { p.y = PAD;     p.vy = Math.abs(p.vy) * 0.3; }
        if (p.y > 1 - PAD) { p.y = 1 - PAD; p.vy = -Math.abs(p.vy) * 0.3; }
      }
    }

    // --- Color ramp: cold blue → neutral → hot red ---
    const CSTOPS = [
      { t: 0.0,  r: 45,  g: 75,  b: 175 },
      { t: 0.25, r: 90,  g: 145, b: 210 },
      { t: 0.45, r: 190, g: 195, b: 155 },
      { t: 0.65, r: 225, g: 150, b: 55  },
      { t: 1.0,  r: 235, g: 70,  b: 35  },
    ];

    function tempColor(t) {
      if (t <= 0) return `rgb(${CSTOPS[0].r},${CSTOPS[0].g},${CSTOPS[0].b})`;
      for (let i = 0; i < CSTOPS.length - 1; i++) {
        if (t <= CSTOPS[i + 1].t) {
          const f = (t - CSTOPS[i].t) / (CSTOPS[i + 1].t - CSTOPS[i].t);
          return `rgb(${
            Math.round(CSTOPS[i].r + (CSTOPS[i + 1].r - CSTOPS[i].r) * f)},${
            Math.round(CSTOPS[i].g + (CSTOPS[i + 1].g - CSTOPS[i].g) * f)},${
            Math.round(CSTOPS[i].b + (CSTOPS[i + 1].b - CSTOPS[i].b) * f)})`;
        }
      }
      const last = CSTOPS[CSTOPS.length - 1];
      return `rgb(${last.r},${last.g},${last.b})`;
    }

    // --- Rendering ---
    function resize() {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }

    function draw() {
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      const dpr = window.devicePixelRatio || 1;

      ctx.clearRect(0, 0, w, h);

      // Ground glow (heat-dependent warm light bleeding upward)
      const gg = ctx.createLinearGradient(0, h, 0, h * 0.55);
      gg.addColorStop(0, `rgba(210,85,20,${heat * 0.18})`);
      gg.addColorStop(1, 'transparent');
      ctx.fillStyle = gg;
      ctx.fillRect(0, 0, w, h);

      // Ground strip
      const gH = 4 * dpr;
      const gi = heat;
      ctx.fillStyle = `rgb(${Math.round(50 + 155 * gi)},${Math.round(35 + 45 * gi)},${Math.round(25)})`;
      ctx.fillRect(0, h - gH, w, gH);
      // Highlight
      ctx.fillStyle = `rgba(255,160,60,${gi * 0.4})`;
      ctx.fillRect(0, h - gH, w, 1);

      // Particles — map y∈[0,1] to pixel [0, h-gH]
      const drawH = h - gH;
      const baseR = 3 * dpr;
      ctx.globalAlpha = 0.72;
      for (const p of particles) {
        const px = p.x * w;
        const py = p.y * drawH;
        const r = baseR * (0.8 + 0.35 * p.temp);
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = tempColor(p.temp);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // --- Animation loop with IntersectionObserver ---
    let animId = 0;
    let lastTime = 0;

    function frame(now) {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      step(dt);
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

    window.addEventListener('resize', resize);
    resize();
    start();
  }
});
