/**
 * convection-cells demo
 * Particles advected through a divergence-free velocity field derived from
 * a stream function ψ = A·sin(kπx)·sin(πy), producing 3 organised
 * convection cells. Particles are heated near the ground and cool as they
 * circulate, with colour encoding temperature.
 */
registerDemo('convection-cells', {
  init(container) {
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);

    const wrap = container.closest('.demo-container');
    const heatSlider = wrap.querySelector('[data-control="heating"]');
    const stabSlider = wrap.querySelector('[data-control="stability"]');

    let heating = 0.6;
    let stability = 0.5;

    if (heatSlider) {
      heating = parseInt(heatSlider.value, 10) / 100;
      heatSlider.addEventListener('input', () => {
        heating = parseInt(heatSlider.value, 10) / 100;
      });
    }
    if (stabSlider) {
      stability = parseInt(stabSlider.value, 10) / 100;
      stabSlider.addEventListener('input', () => {
        stability = parseInt(stabSlider.value, 10) / 100;
      });
    }

    // --- Velocity field: 3 convection cells via stream function ---
    // ψ = A sin(kπx) sin(πy)   →   divergence-free
    // vx = -∂ψ/∂y = -A sin(kπx) π cos(πy)
    // vy =  ∂ψ/∂x =  A kπ cos(kπx) sin(πy)
    // With k = 6 → 3 full cells (6 half-rolls).
    // Rising centres at x = 1/6, 1/2, 5/6
    // Sinking at x = 0, 1/3, 2/3, 1

    const CELLS = 3;
    const K = CELLS * 2;          // 6
    const KPI = K * Math.PI;
    const PI = Math.PI;
    const BASE_AMP = 0.15;

    function getAmp() {
      return heating * (1.0 - 0.85 * stability) * BASE_AMP;
    }

    // --- Particles ---
    const N = 600;
    const particles = [];
    for (let i = 0; i < N; i++) {
      particles.push({
        x: Math.random(),
        y: Math.random(),
        temp: 0.08 + Math.random() * 0.12,
      });
    }

    // --- Physics ---
    const BUOYANCY = 0.25;
    const COOL_RATE = 0.30;
    const HEAT_ZONE = 0.10;
    const JITTER = 0.025;
    const PAD = 0.003;

    function step(dt) {
      const amp = getAmp();
      const heatRate = heating * 3.0;

      for (const p of particles) {
        // Temperature: heat near ground, cool everywhere
        const alt = 1 - p.y;
        if (alt < HEAT_ZONE && heatRate > 0) {
          const prox = 1 - alt / HEAT_ZONE;
          p.temp += heatRate * prox * prox * dt;
        }
        p.temp -= COOL_RATE * dt;
        if (p.temp < 0) p.temp = 0;
        if (p.temp > 1) p.temp = 1;

        // Stream-function field
        const sinKx = Math.sin(KPI * p.x);
        const cosKx = Math.cos(KPI * p.x);
        const sinY  = Math.sin(PI * p.y);
        const cosY  = Math.cos(PI * p.y);

        const fvx = -amp * sinKx * PI * cosY;
        const fvy =  amp * K * cosKx * sinY;

        // Buoyancy reinforcement: warm → upward, cool → downward
        const buoy = -(p.temp - 0.18) * BUOYANCY;

        // Advect
        p.x += (fvx + (Math.random() - 0.5) * JITTER) * dt;
        p.y += (fvy + buoy + (Math.random() - 0.5) * JITTER) * dt;

        // Keep in bounds
        if (p.x < PAD) p.x = PAD;
        if (p.x > 1 - PAD) p.x = 1 - PAD;
        if (p.y < PAD) p.y = PAD;
        if (p.y > 1 - PAD) p.y = 1 - PAD;
      }
    }

    // Warm up so cells are already established on first frame
    for (let i = 0; i < 120; i++) step(0.04);

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

      // Ground glow
      const gg = ctx.createLinearGradient(0, h, 0, h * 0.55);
      gg.addColorStop(0, `rgba(210,85,20,${heating * 0.18})`);
      gg.addColorStop(1, 'transparent');
      ctx.fillStyle = gg;
      ctx.fillRect(0, 0, w, h);

      // Faint cell-boundary markers
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4 * dpr, 6 * dpr]);
      for (let i = 1; i < CELLS; i++) {
        const bx = (i / CELLS) * w;
        ctx.beginPath();
        ctx.moveTo(bx, 0);
        ctx.lineTo(bx, h);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Ground strip
      const gH = 4 * dpr;
      ctx.fillStyle = `rgb(${Math.round(50 + 155 * heating)},${Math.round(35 + 45 * heating)},25)`;
      ctx.fillRect(0, h - gH, w, gH);
      ctx.fillStyle = `rgba(255,160,60,${heating * 0.4})`;
      ctx.fillRect(0, h - gH, w, 1);

      // Particles
      const drawH = h - gH;
      const baseR = 2.8 * dpr;
      ctx.globalAlpha = 0.7;
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

    // --- Animation loop ---
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
      if (animId) { cancelAnimationFrame(animId); animId = 0; }
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
