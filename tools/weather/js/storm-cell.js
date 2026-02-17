/**
 * storm-cell demo
 * Animated thunderstorm cross-section showing:
 * - Updraft (warm, red-tinted particles rising on the left/centre)
 * - Downdraft (cool, blue-tinted particles sinking on the right)
 * - Rain / hail falling from the cloud mass
 * - Anvil cloud spreading at the top
 * - Wind shear tilts the storm, separating updraft from downdraft
 *
 * Sliders: instability (updraft strength), moisture (cloud/rain density),
 * wind shear (horizontal tilt with altitude).
 */
registerDemo('storm-cell', {
  init(container) {
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);

    const wrap = container.closest('.demo-container');
    const instSlider  = wrap.querySelector('[data-control="instability"]');
    const moistSlider = wrap.querySelector('[data-control="moisture"]');
    const shearSlider = wrap.querySelector('[data-control="shear"]');

    let instability = 0.6;
    let moisture = 0.6;
    let shear = 0.3;

    if (instSlider) {
      instability = parseInt(instSlider.value, 10) / 100;
      instSlider.addEventListener('input', () => {
        instability = parseInt(instSlider.value, 10) / 100;
      });
    }
    if (moistSlider) {
      moisture = parseInt(moistSlider.value, 10) / 100;
      moistSlider.addEventListener('input', () => {
        moisture = parseInt(moistSlider.value, 10) / 100;
      });
    }
    if (shearSlider) {
      shear = parseInt(shearSlider.value, 10) / 100;
      shearSlider.addEventListener('input', () => {
        shear = parseInt(shearSlider.value, 10) / 100;
      });
    }

    // --- Seeded random for stable cloud/rain positions ---
    function seededRng(seed) {
      let s = seed;
      return function () {
        s = (s * 16807 + 0) % 2147483647;
        return s / 2147483647;
      };
    }
    const rng = seededRng(314);

    // --- Cloud puffs ---
    // Main tower puffs (tall column)
    const TOWER_PUFFS = [];
    for (let i = 0; i < 45; i++) {
      TOWER_PUFFS.push({
        xn: (rng() - 0.5) * 0.28,    // centered around updraft
        yn: 0.15 + rng() * 0.70,      // altitude fraction within cloud
        rx: 0.025 + rng() * 0.05,
        ry: 0.02 + rng() * 0.04,
        a: 0.06 + rng() * 0.10,
      });
    }

    // Anvil puffs (spread horizontally at top)
    const ANVIL_PUFFS = [];
    for (let i = 0; i < 30; i++) {
      ANVIL_PUFFS.push({
        xn: (rng() - 0.3) * 0.7,      // spread right (downwind)
        yn: 0.82 + rng() * 0.16,       // near top
        rx: 0.03 + rng() * 0.06,
        ry: 0.008 + rng() * 0.015,     // flat
        a: 0.04 + rng() * 0.07,
      });
    }

    // --- Updraft particles ---
    const UP_N = 50;
    const upParticles = [];
    for (let i = 0; i < UP_N; i++) {
      upParticles.push({
        x: 0.38 + (rng() - 0.5) * 0.14,
        y: rng(),
        speed: 0.12 + rng() * 0.15,
        drift: (rng() - 0.5) * 0.02,
        size: 1.5 + rng() * 2.0,
      });
    }

    // --- Downdraft particles ---
    const DOWN_N = 40;
    const downParticles = [];
    for (let i = 0; i < DOWN_N; i++) {
      downParticles.push({
        x: 0.60 + (rng() - 0.5) * 0.14,
        y: rng(),
        speed: 0.10 + rng() * 0.12,
        drift: (rng() - 0.5) * 0.015,
        size: 1.5 + rng() * 1.5,
      });
    }

    // --- Rain drops ---
    const RAIN_N = 120;
    const raindrops = [];
    for (let i = 0; i < RAIN_N; i++) {
      raindrops.push({
        x: 0.50 + (rng() - 0.5) * 0.30,
        y: rng(),
        speed: 0.25 + rng() * 0.35,
        len: 0.008 + rng() * 0.014,
        drift: (rng() - 0.5) * 0.01,
      });
    }

    // --- Layout ---
    const GROUND_FRAC = 0.05;
    const SKY_TOP = 0.02;

    // --- Animation ---
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

      // Storm center X and shear offset at top
      const stormCX = w * 0.42;
      const shearOffset = shear * w * 0.22;  // how far top is displaced

      // Helper: x position at a given altitude fraction (0=ground, 1=top)
      // Shear shifts rightward with altitude
      function shearX(baseX, altFrac) {
        return baseX + shearOffset * altFrac * altFrac;
      }

      // --- Cloud base and top ---
      const cloudBase = 0.20;  // altitude fraction where clouds start
      const cloudTop = 0.92;

      // --- Background: updraft warm glow ---
      const upGlow = ctx.createRadialGradient(
        shearX(stormCX - w * 0.04, 0.3), skyTop + skyH * 0.7, 0,
        shearX(stormCX - w * 0.04, 0.3), skyTop + skyH * 0.7, skyH * 0.5
      );
      upGlow.addColorStop(0, `rgba(200,80,40,${instability * 0.08})`);
      upGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = upGlow;
      ctx.fillRect(0, 0, w, h);

      // --- Cloud mass (tower + anvil) ---
      const cloudAlpha = 0.4 + moisture * 0.4;

      // Tower body — vertical column
      for (const p of TOWER_PUFFS) {
        const altFrac = cloudBase + p.yn * (cloudTop - cloudBase);
        const cx = shearX(stormCX + p.xn * w, altFrac);
        const cy = skyTop + skyH * (1 - altFrac);
        const rx = p.rx * w * (0.8 + moisture * 0.4);
        const ry = p.ry * h * (0.8 + moisture * 0.4);
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,200,215,${p.a * cloudAlpha})`;
        ctx.fill();
      }

      // Anvil — spreads downwind at top
      for (const p of ANVIL_PUFFS) {
        const altFrac = p.yn;
        const cx = shearX(stormCX + p.xn * w, altFrac) + shearOffset * 0.3;
        const cy = skyTop + skyH * (1 - altFrac);
        const rx = p.rx * w * (0.7 + shear * 0.8);
        const ry = p.ry * h;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,185,200,${p.a * cloudAlpha * 0.7})`;
        ctx.fill();
      }

      // --- Updraft particles (warm, rising) ---
      const upStrength = 0.5 + instability * 1.0;
      ctx.globalAlpha = 0.6;
      for (const p of upParticles) {
        // Cycle vertically
        const cy = (p.y - time * p.speed * upStrength) % 1;
        const altFrac = 1 - ((cy % 1 + 1) % 1);  // 0 = ground, 1 = top
        const px = shearX(stormCX + (p.x - 0.42) * w, altFrac) + p.drift * w * Math.sin(time * 2 + p.x * 10);
        const py = skyTop + skyH * (1 - altFrac);

        if (py < skyTop || py > h - groundH) continue;

        // Color: warm orange/red
        const temp = Math.min(1, altFrac * 1.5);
        const r = Math.round(220 - temp * 40);
        const g = Math.round(100 + temp * 40);
        const b = Math.round(50 + temp * 80);
        const radius = p.size * dpr * (0.8 + instability * 0.4);

        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},0.5)`;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // --- Downdraft particles (cool, sinking) ---
      const downStrength = 0.4 + instability * 0.6;
      ctx.globalAlpha = 0.5;
      for (const p of downParticles) {
        const cy = (p.y + time * p.speed * downStrength) % 1;
        const altFrac = 1 - ((cy % 1 + 1) % 1);
        const baseX = stormCX + w * 0.18;
        const px = shearX(baseX + (p.x - 0.60) * w, altFrac) + p.drift * w * Math.sin(time * 1.5 + p.x * 8);
        const py = skyTop + skyH * (1 - altFrac);

        if (py < skyTop || py > h - groundH) continue;

        const radius = p.size * dpr * (0.7 + instability * 0.3);
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(70,120,200,0.45)';
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // --- Updraft / downdraft arrows ---
      const arrowAlpha = 0.15 + instability * 0.15;

      // Updraft arrows (left side of storm)
      ctx.fillStyle = `rgba(220,110,50,${arrowAlpha})`;
      ctx.strokeStyle = `rgba(220,110,50,${arrowAlpha})`;
      ctx.lineWidth = 1.8 * dpr;
      for (let i = 0; i < 4; i++) {
        const altBase = 0.05 + i * 0.18;
        const altTop = altBase + 0.16;
        const bx = stormCX + (i - 1.5) * w * 0.025;
        const x1 = shearX(bx, altBase);
        const y1 = skyTop + skyH * (1 - altBase);
        const x2 = shearX(bx, altTop);
        const y2 = skyTop + skyH * (1 - altTop);
        drawArrow(ctx, x1, y1, x2, y2, dpr);
      }

      // Downdraft arrows (right side)
      ctx.fillStyle = `rgba(70,120,210,${arrowAlpha})`;
      ctx.strokeStyle = `rgba(70,120,210,${arrowAlpha})`;
      for (let i = 0; i < 3; i++) {
        const altTop = 0.65 - i * 0.18;
        const altBase = altTop - 0.16;
        const bx = stormCX + w * 0.18 + (i - 1) * w * 0.025;
        const x1 = shearX(bx, altTop);
        const y1 = skyTop + skyH * (1 - altTop);
        const x2 = shearX(bx, altBase);
        const y2 = skyTop + skyH * (1 - altBase);
        drawArrow(ctx, x1, y1, x2, y2, dpr);
      }

      // --- Rain ---
      const rainCount = Math.floor(RAIN_N * moisture);
      ctx.lineWidth = 1 * dpr;
      for (let i = 0; i < rainCount; i++) {
        const r = raindrops[i];
        const cy = (r.y + time * r.speed) % 1;
        const altFrac = 1 - cy;

        // Rain falls from cloud base downward
        if (altFrac > cloudBase + 0.05) continue;

        const baseX = stormCX + w * 0.10;
        const px = shearX(baseX + (r.x - 0.50) * w, Math.max(0, altFrac)) + r.drift * w;
        const py = skyTop + skyH * (1 - altFrac);

        if (py < skyTop || py > h - groundH) continue;

        const rainAlpha = 0.15 + moisture * 0.20;
        ctx.strokeStyle = `rgba(150,180,230,${rainAlpha})`;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + 1 * dpr, py + r.len * h);
        ctx.stroke();
      }

      // --- Inflow arrow at ground level ---
      ctx.strokeStyle = `rgba(220,150,70,${arrowAlpha * 0.8})`;
      ctx.fillStyle = `rgba(220,150,70,${arrowAlpha * 0.8})`;
      ctx.lineWidth = 1.5 * dpr;
      const inflowY = h - groundH - skyH * 0.04;
      drawArrow(ctx, stormCX - w * 0.18, inflowY, stormCX - w * 0.04, inflowY, dpr);

      // --- Outflow arrow at ground (from downdraft spreading) ---
      ctx.strokeStyle = `rgba(70,130,210,${arrowAlpha * 0.7})`;
      ctx.fillStyle = `rgba(70,130,210,${arrowAlpha * 0.7})`;
      const outX = stormCX + w * 0.18 + shearOffset * 0.05;
      drawArrow(ctx, outX, inflowY, outX + w * 0.14, inflowY, dpr);

      // --- Ground strip ---
      ctx.fillStyle = '#3d2b18';
      ctx.fillRect(0, h - groundH, w, groundH);
      ctx.fillStyle = '#5a4030';
      ctx.fillRect(0, h - groundH, w, 1);

      // --- Ground glow under storm (rain splash zone) ---
      const splashCX = shearX(stormCX + w * 0.08, 0);
      const gg = ctx.createRadialGradient(
        splashCX, h - groundH, 0,
        splashCX, h - groundH, w * 0.18
      );
      gg.addColorStop(0, `rgba(120,160,220,${moisture * 0.10})`);
      gg.addColorStop(1, 'transparent');
      ctx.fillStyle = gg;
      ctx.fillRect(0, h - groundH - skyH * 0.1, w, skyH * 0.1 + groundH);

      // --- Labels ---
      ctx.font = `${9 * dpr}px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Updraft label
      ctx.fillStyle = 'rgba(220,130,60,0.45)';
      const upLabelAlt = 0.45;
      ctx.fillText('Updraft',
        shearX(stormCX - w * 0.07, upLabelAlt),
        skyTop + skyH * (1 - upLabelAlt)
      );

      // Downdraft label
      ctx.fillStyle = 'rgba(80,140,230,0.45)';
      const downLabelAlt = 0.40;
      ctx.fillText('Downdraft',
        shearX(stormCX + w * 0.22, downLabelAlt),
        skyTop + skyH * (1 - downLabelAlt)
      );

      // Anvil label (when shear is significant)
      if (shear > 0.2) {
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillText('Anvil',
          shearX(stormCX, 0.90) + shearOffset * 0.5,
          skyTop + skyH * 0.06
        );
      }

      // Inflow / outflow labels
      ctx.font = `${8 * dpr}px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif`;
      ctx.fillStyle = 'rgba(220,150,70,0.35)';
      ctx.fillText('Inflow', stormCX - w * 0.14, inflowY - 8 * dpr);
      ctx.fillStyle = 'rgba(70,130,210,0.35)';
      ctx.fillText('Outflow', outX + w * 0.07, inflowY - 8 * dpr);
    }

    function drawArrow(ctx, x1, y1, x2, y2, dpr) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 1) return;
      const ux = dx / len;
      const uy = dy / len;
      const aSize = 4 * dpr;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - ux * aSize - uy * aSize * 0.6, y2 - uy * aSize + ux * aSize * 0.6);
      ctx.lineTo(x2 - ux * aSize + uy * aSize * 0.6, y2 - uy * aSize - ux * aSize * 0.6);
      ctx.closePath();
      ctx.fill();
    }

    // --- Loop ---
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
