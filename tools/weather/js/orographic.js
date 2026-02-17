/**
 * orographic demo
 * Cross-section showing wind flowing over a mountain range.
 * Windward side: clouds form where terrain pushes air above the cloud base,
 * rain falls beneath them. Leeward side: air descends, warms, arrives dry.
 *
 * Sliders: mountain height (terrain amplitude), moisture (cloud base height
 * and rain density).
 */
registerDemo('orographic', {
  init(container) {
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);

    const wrap = container.closest('.demo-container');
    const heightSlider   = wrap.querySelector('[data-control="mountain-height"]');
    const moistureSlider = wrap.querySelector('[data-control="moisture"]');

    let mountainHeight = 0.60;
    let moisture = 0.50;

    if (heightSlider) {
      mountainHeight = parseInt(heightSlider.value, 10) / 100;
      heightSlider.addEventListener('input', () => {
        mountainHeight = parseInt(heightSlider.value, 10) / 100;
      });
    }
    if (moistureSlider) {
      moisture = parseInt(moistureSlider.value, 10) / 100;
      moistureSlider.addEventListener('input', () => {
        moisture = parseInt(moistureSlider.value, 10) / 100;
      });
    }

    // --- Layout constants (matching fronts.js) ---
    const GROUND_FRAC = 0.06;
    const SKY_TOP = 0.04;

    // --- Seeded RNG (matching convection-cells.js) ---
    const SEED = 97;
    function seededRandom(seed) {
      let s = seed;
      return function () {
        s = (s * 16807 + 0) % 2147483647;
        return s / 2147483647;
      };
    }
    const rng = seededRandom(SEED);

    // --- Mountain geometry ---
    // Gaussian bump centered at x = 0.40 (left of center for rain shadow room)
    const PEAK_X = 0.40;
    const SIGMA = 0.10;

    function terrainFrac(xNorm) {
      const dx = xNorm - PEAK_X;
      return mountainHeight * Math.exp(-0.5 * (dx / SIGMA) * (dx / SIGMA));
    }

    // --- Cloud base ---
    // moisture=0 → cloudBaseFrac=0.60 (very high, unreachable)
    // moisture=1 → cloudBaseFrac=0.10 (very low, forms easily)
    function getCloudBaseFrac() {
      return 0.10 + (1 - moisture) * 0.50;
    }

    // --- Pre-generate cloud puffs ---
    const CLOUD_N = 25;
    const clouds = [];
    for (let i = 0; i < CLOUD_N; i++) {
      clouds.push({
        xn: rng() * 0.35,          // 0..0.35 spread on windward side relative to peak
        alt: 0.02 + rng() * 0.30,  // altitude above cloud base (fraction of sky)
        rx: 0.02 + rng() * 0.05,
        ry: 0.012 + rng() * 0.03,
        a: 0.06 + rng() * 0.12,
      });
    }

    // --- Pre-generate rain streaks ---
    const RAIN_N = 60;
    const raindrops = [];
    for (let i = 0; i < RAIN_N; i++) {
      raindrops.push({
        xn: rng() * 0.30,          // spread on windward
        phase: rng(),
        speed: 0.3 + rng() * 0.5,
        len: 0.008 + rng() * 0.014,
      });
    }

    // --- Wind particles ---
    const WIND_N = 80;
    const windParticles = [];
    for (let i = 0; i < WIND_N; i++) {
      windParticles.push({
        x: rng(),                     // normalised x position
        f: 0.05 + rng() * 0.90,      // altitude fraction (0=surface, 1=sky top)
        speed: 0.06 + rng() * 0.06,  // horizontal speed (normalised units/s)
        size: 1.2 + rng() * 1.2,
      });
    }

    // --- Leeward descent arrows ---
    const LEE_ARROWS = [];
    for (let i = 0; i < 4; i++) {
      LEE_ARROWS.push({
        xOff: 0.08 + i * 0.10,   // offset right of peak
        altTop: 0.55 - i * 0.08,
        altBot: 0.30 - i * 0.05,
      });
    }

    // --- Animation state ---
    let time = 0;
    let animId = 0;
    let lastTime = 0;

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

      const groundH = h * GROUND_FRAC;
      const skyTop = h * SKY_TOP;
      const skyH = h - groundH - skyTop;

      // Helper: altitude fraction (0=ground, 1=sky top) → pixel y
      function altToY(frac) {
        return skyTop + skyH * (1 - frac);
      }

      // Helper: terrain height in altitude fraction at normalised x
      function terrainAltFrac(xNorm) {
        return terrainFrac(xNorm) * 0.65; // max mountain ≈ 65% of sky height
      }

      // Helper: pixel y of terrain surface at normalised x
      function terrainY(xNorm) {
        return altToY(terrainAltFrac(xNorm));
      }

      // Helper: streamline y for a particle with altitude fraction f
      function streamlineY(xNorm, f) {
        const terrainAlt = terrainAltFrac(xNorm);
        // Near ground (f→0): closely follows terrain; high (f→1): barely deflects
        const surfaceAlt = terrainAlt * (1 - f);
        const baseAlt = f;
        return altToY(surfaceAlt + baseAlt);
      }

      const cloudBase = getCloudBaseFrac();
      const peakAlt = terrainAltFrac(PEAK_X);

      // =====================
      // 1. Sky gradient
      // =====================
      const skyGrad = ctx.createLinearGradient(0, skyTop, 0, skyTop + skyH);
      skyGrad.addColorStop(0, '#1a2a4a');
      skyGrad.addColorStop(0.4, '#2a3a5a');
      skyGrad.addColorStop(1, '#3a4a6a');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, skyTop, w, skyH);

      // =====================
      // 2. Cloud puffs (windward side, above cloud base)
      // =====================
      if (mountainHeight > 0.01 && moisture > 0.01 && peakAlt > cloudBase) {
        for (const c of clouds) {
          // Position: to the left of peak
          const cx = (PEAK_X - c.xn) * w;
          const cloudAlt = cloudBase + c.alt * (1 - cloudBase);
          const cy = altToY(cloudAlt);

          // Only render if terrain at this x pushes air above cloud base
          const xNorm = cx / w;
          if (xNorm < 0 || xNorm > w) continue;
          const localTerrainAlt = terrainAltFrac(xNorm);
          // Clouds form where terrain forces air up past cloud base
          // Use a softer threshold: terrain influence extends somewhat beyond direct height
          const liftFactor = localTerrainAlt / cloudBase;
          if (liftFactor < 0.3) continue;

          const alpha = c.a * moisture * Math.min(1, liftFactor);
          const rx = c.rx * w;
          const ry = c.ry * h;
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(220,220,235,${alpha.toFixed(3)})`;
          ctx.fill();
        }
      }

      // =====================
      // 3. Rain streaks (windward side, beneath clouds)
      // =====================
      if (mountainHeight > 0.01 && moisture > 0.15 && peakAlt > cloudBase) {
        ctx.lineWidth = 1 * dpr;
        for (const r of raindrops) {
          const rx = (PEAK_X - r.xn) * w;
          const xNorm = rx / w;
          if (xNorm < 0 || xNorm > 1) continue;

          const localTerrainAlt = terrainAltFrac(xNorm);
          if (localTerrainAlt / cloudBase < 0.4) continue;

          const cloudBaseY = altToY(cloudBase);
          const groundY = terrainY(xNorm);
          const span = groundY - cloudBaseY;
          if (span <= 0) continue;

          const animPhase = (r.phase + time * r.speed * 0.5) % 1;
          const ry = cloudBaseY + animPhase * span;
          const endY = Math.min(ry + r.len * h, groundY);

          const alpha = 0.25 * moisture * Math.min(1, localTerrainAlt / cloudBase);
          ctx.strokeStyle = `rgba(150,180,220,${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx, endY);
          ctx.stroke();
        }
      }

      // =====================
      // 4. Wind particles (flowing L→R along streamlines)
      // =====================
      ctx.globalAlpha = 0.55;
      for (const p of windParticles) {
        // Advance position
        p.x += p.speed * 0.016; // ~per frame at 60fps
        if (p.x > 1.05) p.x -= 1.15; // wrap around

        const px = p.x * w;
        const py = streamlineY(p.x, p.f);

        // Don't draw if below terrain
        const tY = terrainY(p.x);
        if (py > tY - 2 * dpr) continue;

        const r = p.size * dpr;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(200,215,240,0.6)';
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // =====================
      // 5. Leeward descent arrows (warm, angled down-right)
      // =====================
      if (mountainHeight > 0.05) {
        ctx.strokeStyle = 'rgba(220,160,80,0.25)';
        ctx.lineWidth = 1.8 * dpr;
        ctx.fillStyle = 'rgba(220,160,80,0.25)';
        for (const a of LEE_ARROWS) {
          const ax = (PEAK_X + a.xOff) * w;
          const ayTop = altToY(a.altTop * mountainHeight);
          const ayBot = altToY(a.altBot * mountainHeight);
          // Angled down-right
          const dx = w * 0.03;
          ctx.beginPath();
          ctx.moveTo(ax, ayTop);
          ctx.lineTo(ax + dx, ayBot);
          ctx.stroke();
          // Arrowhead
          const aSize = 3.5 * dpr;
          const angle = Math.atan2(ayBot - ayTop, dx);
          ctx.beginPath();
          ctx.moveTo(ax + dx, ayBot);
          ctx.lineTo(ax + dx - aSize * Math.cos(angle - 0.5), ayBot - aSize * Math.sin(angle - 0.5));
          ctx.lineTo(ax + dx - aSize * Math.cos(angle + 0.5), ayBot - aSize * Math.sin(angle + 0.5));
          ctx.closePath();
          ctx.fill();
        }
      }

      // =====================
      // 6. Mountain fill (brown gradient)
      // =====================
      if (mountainHeight > 0.01) {
        ctx.beginPath();
        const steps = 80;
        for (let i = 0; i <= steps; i++) {
          const xNorm = i / steps;
          const y = terrainY(xNorm);
          if (i === 0) ctx.moveTo(xNorm * w, y);
          else ctx.lineTo(xNorm * w, y);
        }
        ctx.lineTo(w, h - groundH);
        ctx.lineTo(0, h - groundH);
        ctx.closePath();

        const mGrad = ctx.createLinearGradient(0, altToY(peakAlt), 0, h - groundH);
        mGrad.addColorStop(0, '#6a5a48');
        mGrad.addColorStop(0.4, '#5a4a38');
        mGrad.addColorStop(1, '#3d2b18');
        ctx.fillStyle = mGrad;
        ctx.fill();

        // 7. Mountain edge stroke
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const xNorm = i / steps;
          const y = terrainY(xNorm);
          if (i === 0) ctx.moveTo(xNorm * w, y);
          else ctx.lineTo(xNorm * w, y);
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1.5 * dpr;
        ctx.stroke();
      }

      // =====================
      // 8. Ground strip (matching fronts.js)
      // =====================
      ctx.fillStyle = '#3d2b18';
      ctx.fillRect(0, h - groundH, w, groundH);
      ctx.fillStyle = '#5a4030';
      ctx.fillRect(0, h - groundH, w, 1);

      // =====================
      // 9. Labels
      // =====================
      const fontSize = 10 * dpr;
      ctx.font = `${fontSize}px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif`;
      ctx.textBaseline = 'middle';

      if (mountainHeight > 0.10) {
        // "Windward" label — left of peak
        ctx.fillStyle = 'rgba(180,200,230,0.50)';
        ctx.textAlign = 'center';
        ctx.fillText('Windward', (PEAK_X - 0.18) * w, altToY(0.08));

        // "Leeward" label — right of peak
        ctx.fillText('Leeward', (PEAK_X + 0.25) * w, altToY(0.08));

        // "Rain shadow" label — further right
        if (moisture > 0.15 && peakAlt > cloudBase) {
          ctx.fillStyle = 'rgba(220,170,80,0.45)';
          const smallFont = 9 * dpr;
          ctx.font = `${smallFont}px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif`;
          ctx.fillText('Rain shadow', (PEAK_X + 0.32) * w, altToY(0.22));
        }
      }

      // Wind direction indicator
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.font = `${9 * dpr}px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('Wind →', 8 * dpr, 6 * dpr);
    }

    // --- Animation loop ---
    function frame(now) {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      time += dt;
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
