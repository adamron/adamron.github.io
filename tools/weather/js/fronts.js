/**
 * fronts demo
 * Animated cross-section showing cold-front and warm-front dynamics.
 * Cold front: dense cold air wedges steeply under warm air, forcing it
 * sharply upward → tall cumulonimbus. Warm front: warm air rides gently
 * over cold air along a shallow slope → broad layered clouds.
 *
 * The slider toggles between the two front types (0 = cold, 1 = warm).
 * Speed slider controls how fast the front advances.
 */
registerDemo('fronts', {
  init(container) {
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);

    const wrap = container.closest('.demo-container');
    const typeSlider  = wrap.querySelector('[data-control="front-type"]');
    const speedSlider = wrap.querySelector('[data-control="speed"]');

    let frontType = 0;   // 0 = cold, 1 = warm
    let speed = 0.5;

    if (typeSlider) {
      frontType = parseInt(typeSlider.value, 10);
      typeSlider.addEventListener('input', () => {
        frontType = parseInt(typeSlider.value, 10);
      });
    }
    if (speedSlider) {
      speed = parseInt(speedSlider.value, 10) / 100;
      speedSlider.addEventListener('input', () => {
        speed = parseInt(speedSlider.value, 10) / 100;
      });
    }

    // --- Layout constants ---
    const GROUND_FRAC = 0.06;     // ground strip fraction of height
    const SKY_TOP = 0.04;         // top padding fraction

    // --- Front geometry ---
    // Cold front: steep slope (~1:2 rise/run), front at leading edge
    // Warm front: shallow slope (~1:6 rise/run), front at ground contact
    const COLD_SLOPE = 0.50;      // steep
    const WARM_SLOPE = 0.14;      // gentle

    // --- Cloud parameters ---
    const CLOUD_SEED = 42;
    function seededRandom(seed) {
      let s = seed;
      return function () {
        s = (s * 16807 + 0) % 2147483647;
        return s / 2147483647;
      };
    }

    // Pre-generate clouds for cold front (tall cumulus near front)
    const rng = seededRandom(CLOUD_SEED);
    const COLD_CLOUDS = [];
    for (let i = 0; i < 18; i++) {
      // Clustered near the front boundary, tall
      COLD_CLOUDS.push({
        dx: -0.02 + rng() * 0.15,     // distance behind front
        alt: 0.15 + rng() * 0.65,      // high altitude range
        rx: 0.02 + rng() * 0.04,
        ry: 0.015 + rng() * 0.04,
        a: 0.06 + rng() * 0.10,
      });
    }

    // Pre-generate clouds for warm front (layered, broad, ahead of front)
    const WARM_CLOUDS = [];
    for (let i = 0; i < 35; i++) {
      WARM_CLOUDS.push({
        dx: rng() * 0.55,             // spread over wide area ahead
        alt: 0.20 + rng() * 0.50,
        rx: 0.03 + rng() * 0.06,
        ry: 0.008 + rng() * 0.018,    // flatter (layered)
        a: 0.04 + rng() * 0.07,
      });
    }

    // --- Rain drops ---
    const RAIN_N = 80;
    const raindrops = [];
    for (let i = 0; i < RAIN_N; i++) {
      raindrops.push({
        x: rng(),
        y: rng(),
        speed: 0.3 + rng() * 0.4,
        len: 0.008 + rng() * 0.012,
      });
    }

    // --- Arrows (updraft indicators) ---
    const ARROW_N = 6;

    // --- Animation ---
    const CYCLE = 8.0;
    const PAUSE = 1.5;
    const PERIOD = CYCLE + PAUSE;
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

      // Phase: front advances left-to-right over the cycle
      const phase = time % PERIOD;
      const t = Math.min(1, phase / CYCLE);
      const advance = speed * 0.3 + 0.15;   // base speed factor
      const frontX = t * advance;            // 0→~0.45 normalized

      // Effective front type (smooth blend)
      const ft = frontType;
      const slope = ft === 0 ? COLD_SLOPE : WARM_SLOPE;

      // --- Draw cold air mass (blue) ---
      // The cold/warm wedge shape
      ctx.save();

      if (ft === 0) {
        // COLD FRONT: cold air (blue) pushes from left, wedge under warm
        // Cold mass fills from left edge to the front boundary curve
        const frontPxX = frontX * w;

        // Wedge shape: ground contact at frontPxX, rises steeply to the left
        const wedgeTop = skyTop + skyH * (1 - Math.min(slope * 1.8, 0.85));

        ctx.beginPath();
        ctx.moveTo(0, skyTop);                           // top-left
        ctx.lineTo(0, h - groundH);                      // bottom-left
        ctx.lineTo(frontPxX, h - groundH);               // ground contact at front

        // Steep curve up from ground contact
        const cpx1 = frontPxX - w * 0.03;
        const cpy1 = h - groundH - skyH * 0.15;
        const cpx2 = frontPxX - w * 0.06;
        const cpy2 = wedgeTop + skyH * 0.15;
        ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, frontPxX - w * 0.12, wedgeTop);
        ctx.lineTo(0, wedgeTop);
        ctx.closePath();

        const cg = ctx.createLinearGradient(0, h - groundH, 0, wedgeTop);
        cg.addColorStop(0, 'rgba(60,100,180,0.25)');
        cg.addColorStop(0.5, 'rgba(60,100,180,0.18)');
        cg.addColorStop(1, 'rgba(60,100,180,0.08)');
        ctx.fillStyle = cg;
        ctx.fill();

        // Cold air boundary line
        ctx.beginPath();
        ctx.moveTo(frontPxX, h - groundH);
        ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, frontPxX - w * 0.12, wedgeTop);
        ctx.strokeStyle = 'rgba(80,130,220,0.5)';
        ctx.lineWidth = 2.5 * dpr;
        ctx.stroke();

        // Front symbol (triangles on the cold front line)
        const triSize = 5 * dpr;
        ctx.fillStyle = 'rgba(80,130,220,0.6)';
        for (let i = 0; i < 4; i++) {
          const frac = 0.15 + i * 0.22;
          // Point along the bezier - approximate with linear interp
          const bx = frontPxX + (frontPxX - w * 0.12 - frontPxX) * frac;
          const by = (h - groundH) + (wedgeTop - (h - groundH)) * frac;
          ctx.beginPath();
          ctx.moveTo(bx + triSize, by);
          ctx.lineTo(bx - triSize * 0.5, by - triSize);
          ctx.lineTo(bx - triSize * 0.5, by + triSize);
          ctx.closePath();
          ctx.fill();
        }

        // Warm air mass (orange/red) - right side, being lifted
        const warmGrad = ctx.createLinearGradient(frontPxX, 0, w, 0);
        warmGrad.addColorStop(0, 'rgba(200,100,50,0.12)');
        warmGrad.addColorStop(0.5, 'rgba(200,100,50,0.08)');
        warmGrad.addColorStop(1, 'rgba(200,100,50,0.04)');
        ctx.fillStyle = warmGrad;
        ctx.fillRect(frontPxX, skyTop, w - frontPxX, skyH);

        // Warm air label
        ctx.font = `${10 * dpr}px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif`;
        ctx.fillStyle = 'rgba(220,130,60,0.5)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (frontPxX < w * 0.7) {
          ctx.fillText('Warm air', Math.min(frontPxX + w * 0.2, w * 0.75), skyTop + skyH * 0.7);
        }

        // Cold air label
        ctx.fillStyle = 'rgba(80,140,230,0.5)';
        if (frontPxX > w * 0.15) {
          ctx.fillText('Cold air', frontPxX * 0.4, skyTop + skyH * 0.6);
        }

        // --- Updraft arrows near front ---
        ctx.strokeStyle = 'rgba(220,130,60,0.25)';
        ctx.lineWidth = 1.5 * dpr;
        for (let i = 0; i < ARROW_N; i++) {
          const ax = frontPxX + w * (0.01 + i * 0.015);
          const aBase = h - groundH - skyH * 0.05;
          const aTop = skyTop + skyH * (0.25 + i * 0.08);
          if (ax > 0 && ax < w) {
            drawArrowUp(ctx, ax, aBase, aTop, dpr);
          }
        }

        // --- Clouds (cold front: tall cumulonimbus near the front) ---
        for (const c of COLD_CLOUDS) {
          const cx = frontPxX - c.dx * w;
          const cy = skyTop + skyH * (1 - c.alt);
          if (cx < 0 || cx > w) continue;
          const rx = c.rx * w;
          const ry = c.ry * h;
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(220,220,230,${c.a})`;
          ctx.fill();
        }

        // --- Rain (narrow band near the front) ---
        ctx.strokeStyle = 'rgba(150,180,220,0.3)';
        ctx.lineWidth = 1 * dpr;
        for (const r of raindrops) {
          const rx = frontPxX - r.x * w * 0.10;
          const baseY = skyTop + skyH * 0.3;
          const ry = baseY + ((r.y + phase * r.speed * 0.5) % 1) * (h - groundH - baseY);
          if (rx < 0 || rx > w || ry > h - groundH) continue;
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx, ry + r.len * h);
          ctx.stroke();
        }

      } else {
        // WARM FRONT: warm air rides up over cold air
        const frontPxX = (1 - frontX) * w;  // front advances from right

        // Cold air sits on the right, warm air slides over from left
        // Shallow slope: ground contact at frontPxX, gentle rise to the left
        const slopeLen = w * 0.65;
        const wedgeTop = skyTop + skyH * 0.15;

        // Cold air mass (right side, ground-hugging)
        ctx.beginPath();
        ctx.moveTo(frontPxX, h - groundH);
        // Gentle curve up to the right
        const topX = frontPxX + slopeLen * 0.6;
        ctx.quadraticCurveTo(
          frontPxX + slopeLen * 0.3, h - groundH - skyH * 0.08,
          Math.min(topX, w), h - groundH - skyH * slope * 1.2
        );
        ctx.lineTo(w, h - groundH - skyH * slope * 0.5);
        ctx.lineTo(w, h - groundH);
        ctx.closePath();

        const cg = ctx.createLinearGradient(0, h - groundH, 0, wedgeTop);
        cg.addColorStop(0, 'rgba(60,100,180,0.25)');
        cg.addColorStop(0.5, 'rgba(60,100,180,0.15)');
        cg.addColorStop(1, 'rgba(60,100,180,0.05)');
        ctx.fillStyle = cg;
        ctx.fill();

        // Warm air mass (left/above)
        const warmGrad = ctx.createLinearGradient(0, 0, frontPxX, 0);
        warmGrad.addColorStop(0, 'rgba(200,100,50,0.06)');
        warmGrad.addColorStop(0.5, 'rgba(200,100,50,0.10)');
        warmGrad.addColorStop(1, 'rgba(200,100,50,0.14)');
        ctx.fillStyle = warmGrad;
        ctx.fillRect(0, skyTop, frontPxX, skyH);

        // Boundary line — gentle slope
        ctx.beginPath();
        ctx.moveTo(frontPxX, h - groundH);
        ctx.quadraticCurveTo(
          frontPxX + slopeLen * 0.3, h - groundH - skyH * 0.08,
          Math.min(topX, w), h - groundH - skyH * slope * 1.2
        );
        ctx.strokeStyle = 'rgba(200,100,50,0.4)';
        ctx.lineWidth = 2.5 * dpr;
        ctx.stroke();

        // Front symbol (semicircles on warm front line)
        ctx.fillStyle = 'rgba(200,100,50,0.5)';
        for (let i = 0; i < 5; i++) {
          const frac = 0.1 + i * 0.18;
          const bx = frontPxX + frac * slopeLen * 0.6;
          const by = (h - groundH) - frac * skyH * slope * 1.2;
          if (bx > w) continue;
          ctx.beginPath();
          ctx.arc(bx, by, 4 * dpr, -Math.PI / 2, Math.PI / 2);
          ctx.fill();
        }

        // Labels
        ctx.font = `${10 * dpr}px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(220,130,60,0.5)';
        if (frontPxX > w * 0.25) {
          ctx.fillText('Warm air', frontPxX * 0.45, skyTop + skyH * 0.35);
        }
        ctx.fillStyle = 'rgba(80,140,230,0.5)';
        ctx.fillText('Cold air', Math.min(frontPxX + w * 0.2, w * 0.85), skyTop + skyH * 0.75);

        // --- Gentle updraft arrows ---
        ctx.strokeStyle = 'rgba(220,130,60,0.20)';
        ctx.lineWidth = 1.5 * dpr;
        for (let i = 0; i < ARROW_N; i++) {
          const ax = frontPxX - w * (0.02 + i * 0.04);
          const aBase = h - groundH - skyH * 0.15;
          const aTop = skyTop + skyH * (0.30 + i * 0.06);
          if (ax > 0 && ax < w) {
            drawArrowUp(ctx, ax, aBase, aTop, dpr);
          }
        }

        // --- Clouds (warm front: layered, spread out ahead) ---
        for (const c of WARM_CLOUDS) {
          const cx = frontPxX - c.dx * w;
          const cy = skyTop + skyH * (1 - c.alt);
          if (cx < 0 || cx > w) continue;
          const rx = c.rx * w;
          const ry = c.ry * h;
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200,200,215,${c.a})`;
          ctx.fill();
        }

        // --- Rain (broad, gentle) ---
        ctx.strokeStyle = 'rgba(150,170,210,0.20)';
        ctx.lineWidth = 1 * dpr;
        for (const r of raindrops) {
          const rx = frontPxX - r.x * w * 0.40;
          const baseY = skyTop + skyH * 0.35;
          const ry = baseY + ((r.y + phase * r.speed * 0.3) % 1) * (h - groundH - baseY);
          if (rx < 0 || rx > w || ry > h - groundH) continue;
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(rx - 0.5 * dpr, ry + r.len * h * 0.7);
          ctx.stroke();
        }
      }

      ctx.restore();

      // --- Ground strip ---
      ctx.fillStyle = '#3d2b18';
      ctx.fillRect(0, h - groundH, w, groundH);
      ctx.fillStyle = '#5a4030';
      ctx.fillRect(0, h - groundH, w, 1);

      // --- Temperature gradient bar along ground ---
      if (ft === 0) {
        const frontPxX = frontX * w;
        // Cold on left, warm on right
        const tg = ctx.createLinearGradient(0, 0, w, 0);
        tg.addColorStop(0, 'rgba(60,100,200,0.25)');
        tg.addColorStop(Math.max(0, Math.min(1, frontPxX / w)), 'rgba(60,100,200,0.15)');
        tg.addColorStop(Math.max(0, Math.min(1, frontPxX / w + 0.01)), 'rgba(200,100,50,0.15)');
        tg.addColorStop(1, 'rgba(200,100,50,0.25)');
        ctx.fillStyle = tg;
        ctx.fillRect(0, h - groundH - 2 * dpr, w, 2 * dpr);
      } else {
        const frontPxX = (1 - frontX) * w;
        const tg = ctx.createLinearGradient(0, 0, w, 0);
        tg.addColorStop(0, 'rgba(200,100,50,0.25)');
        tg.addColorStop(Math.max(0, Math.min(1, frontPxX / w)), 'rgba(200,100,50,0.15)');
        tg.addColorStop(Math.max(0, Math.min(1, frontPxX / w + 0.01)), 'rgba(60,100,200,0.15)');
        tg.addColorStop(1, 'rgba(60,100,200,0.25)');
        ctx.fillStyle = tg;
        ctx.fillRect(0, h - groundH - 2 * dpr, w, 2 * dpr);
      }

      // --- Front type label ---
      ctx.font = `${9 * dpr}px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText(ft === 0 ? 'Cold front' : 'Warm front', w - 8 * dpr, 6 * dpr);

      // Direction arrow
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.textAlign = 'center';
      const arrowY = h - groundH - 14 * dpr;
      if (ft === 0) {
        ctx.fillText('→ cold air advancing →', frontX * w * 0.5, arrowY);
      } else {
        const fpx = (1 - frontX) * w;
        ctx.fillText('← warm air advancing ←', fpx * 0.5, arrowY);
      }
    }

    function drawArrowUp(ctx, x, yBottom, yTop, dpr) {
      ctx.beginPath();
      ctx.moveTo(x, yBottom);
      ctx.lineTo(x, yTop);
      ctx.stroke();
      // Arrowhead
      const aSize = 3.5 * dpr;
      ctx.beginPath();
      ctx.moveTo(x, yTop - 1);
      ctx.lineTo(x - aSize, yTop + aSize);
      ctx.lineTo(x + aSize, yTop + aSize);
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
