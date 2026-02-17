/**
 * global-circulation demo
 * Hemisphere cross-section from equator (left) to pole (right) showing
 * three circulation cells: Hadley, Ferrel, Polar. Particles circulate
 * within each cell. Surface wind labels (trade winds, westerlies, polar
 * easterlies) and key latitude markers are drawn. A jet stream ribbon
 * appears at ~60° where polar and Ferrel cells meet.
 *
 * Sliders: rotation rate (Coriolis strength → cell separation),
 * solar heating (circulation vigour).
 */
registerDemo('global-circulation', {
  init(container) {
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);

    const wrap = container.closest('.demo-container');
    const rotSlider  = wrap.querySelector('[data-control="rotation"]');
    const heatSlider = wrap.querySelector('[data-control="heating"]');

    let rotation = 0.5;
    let heating = 0.7;

    if (rotSlider) {
      rotation = parseInt(rotSlider.value, 10) / 100;
      rotSlider.addEventListener('input', () => {
        rotation = parseInt(rotSlider.value, 10) / 100;
      });
    }
    if (heatSlider) {
      heating = parseInt(heatSlider.value, 10) / 100;
      heatSlider.addEventListener('input', () => {
        heating = parseInt(heatSlider.value, 10) / 100;
      });
    }

    // --- Seeded RNG ---
    function seededRng(seed) {
      let s = seed;
      return function () {
        s = (s * 16807 + 0) % 2147483647;
        return s / 2147483647;
      };
    }
    const rng = seededRng(271);

    // --- Cell boundaries (as fraction of equator→pole, 0=equator, 1=pole) ---
    // Hadley: 0–0.333, Ferrel: 0.333–0.667, Polar: 0.667–1.0
    const CELLS = [
      { name: 'Hadley',  x0: 0, x1: 0.333, dir: 1, color: [220, 120, 50] },
      { name: 'Ferrel',  x0: 0.333, x1: 0.667, dir: -1, color: [140, 170, 100] },
      { name: 'Polar',   x0: 0.667, x1: 1.0, dir: 1, color: [80, 140, 220] },
    ];
    // dir: 1 = thermally direct (rise at warm side, sink at cool side)
    //     -1 = indirect (Ferrel)

    // --- Particles per cell ---
    const PARTICLES_PER_CELL = 70;
    const particles = [];
    for (const cell of CELLS) {
      for (let i = 0; i < PARTICLES_PER_CELL; i++) {
        particles.push({
          cell,
          // Phase along the loop: 0→1 = full circuit
          phase: rng(),
          // Slight random offset for visual spread
          xOff: (rng() - 0.5) * 0.015,
          yOff: (rng() - 0.5) * 0.03,
          speed: 0.7 + rng() * 0.6,
          size: 1.2 + rng() * 1.5,
        });
      }
    }

    // --- Layout ---
    const GROUND_FRAC = 0.05;
    const TOP_PAD = 0.06;

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

    // Compute a particle's (x, y) in normalised space from its phase.
    // Each cell is a rectangular loop:
    //   phase 0.00–0.25: bottom, moving from warm side → cool side (surface wind)
    //   phase 0.25–0.50: rising at cool/warm boundary
    //   phase 0.50–0.75: top, moving from cool side → warm side (upper flow)
    //   phase 0.75–1.00: sinking at the other boundary
    // "dir" flips the sense for indirect (Ferrel) cell.
    function cellPos(cell, phase, rot) {
      const { x0, x1, dir } = cell;
      const cx0 = x0, cx1 = x1;
      const width = cx1 - cx0;

      // Smooth the loop using sinusoidal interpolation for rounded corners
      let xn, yn; // xn: 0=left boundary of cell, 1=right; yn: 0=ground, 1=top

      const p = phase % 1;

      if (p < 0.25) {
        // Bottom: left → right (or right → left for dir=-1)
        const t = p / 0.25;
        xn = dir === 1 ? t : 1 - t;
        yn = 0.5 - 0.5 * Math.cos(t * Math.PI * 0.15); // slight arch off ground
      } else if (p < 0.50) {
        // Rising side
        const t = (p - 0.25) / 0.25;
        xn = dir === 1 ? 1 : 0;
        // Smooth ease
        const ease = 0.5 - 0.5 * Math.cos(t * Math.PI);
        yn = ease;
        // Slight inward curve
        xn += dir * (1 - 4 * (t - 0.5) * (t - 0.5)) * -0.08;
      } else if (p < 0.75) {
        // Top: right → left (or left → right for dir=-1)
        const t = (p - 0.50) / 0.25;
        xn = dir === 1 ? 1 - t : t;
        yn = 1 - 0.5 * (1 - Math.cos(t * Math.PI * 0.15)); // slight dip from top
      } else {
        // Sinking side
        const t = (p - 0.75) / 0.25;
        xn = dir === 1 ? 0 : 1;
        const ease = 0.5 - 0.5 * Math.cos(t * Math.PI);
        yn = 1 - ease;
        xn += dir * (1 - 4 * (t - 0.5) * (t - 0.5)) * 0.08;
      }

      // Map to cell extent
      const x = cx0 + xn * width;
      const y = yn;
      return { x, y };
    }

    function draw() {
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      const dpr = window.devicePixelRatio || 1;

      ctx.clearRect(0, 0, w, h);

      const groundH = h * GROUND_FRAC;
      const topPad = h * TOP_PAD;
      const skyH = h - groundH - topPad;

      // Mapping helpers
      const xToPixel = (xn) => xn * w;            // 0=equator(left), 1=pole(right)
      const yToPixel = (yn) => topPad + skyH * (1 - yn); // 0=ground, 1=top

      // --- Background: temperature gradient (warm left, cold right) ---
      const tempGrad = ctx.createLinearGradient(0, 0, w, 0);
      const heatAlpha = heating * 0.08;
      tempGrad.addColorStop(0, `rgba(210,90,40,${heatAlpha})`);
      tempGrad.addColorStop(0.5, `rgba(160,140,80,${heatAlpha * 0.3})`);
      tempGrad.addColorStop(1, `rgba(60,100,200,${heatAlpha * 0.6})`);
      ctx.fillStyle = tempGrad;
      ctx.fillRect(0, topPad, w, skyH);

      // --- Cell boundary lines ---
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4 * dpr, 5 * dpr]);
      for (const lat of [0.333, 0.667]) {
        const px = xToPixel(lat);
        ctx.beginPath();
        ctx.moveTo(px, topPad);
        ctx.lineTo(px, h - groundH);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // --- Cell shading ---
      for (const cell of CELLS) {
        const lx = xToPixel(cell.x0);
        const rx = xToPixel(cell.x1);
        const cg = ctx.createLinearGradient(lx, 0, rx, 0);
        const [cr, cg2, cb] = cell.color;
        cg.addColorStop(0, `rgba(${cr},${cg2},${cb},0.03)`);
        cg.addColorStop(0.5, `rgba(${cr},${cg2},${cb},0.06)`);
        cg.addColorStop(1, `rgba(${cr},${cg2},${cb},0.03)`);
        ctx.fillStyle = cg;
        ctx.fillRect(lx, topPad, rx - lx, skyH);
      }

      // --- Cell circulation arrows (large, faint) ---
      ctx.lineWidth = 1.5 * dpr;
      for (const cell of CELLS) {
        const [cr, cg2, cb] = cell.color;
        const arrowAlpha = 0.12 + heating * 0.08;
        ctx.strokeStyle = `rgba(${cr},${cg2},${cb},${arrowAlpha})`;
        ctx.fillStyle = `rgba(${cr},${cg2},${cb},${arrowAlpha})`;

        // Draw 4 guide arrows around the loop
        const steps = [0.125, 0.375, 0.625, 0.875];
        for (const s of steps) {
          const p1 = cellPos(cell, s - 0.03, rotation);
          const p2 = cellPos(cell, s + 0.03, rotation);
          const x1 = xToPixel(p1.x);
          const y1 = yToPixel(p1.y);
          const x2 = xToPixel(p2.x);
          const y2 = yToPixel(p2.y);
          drawArrow(ctx, x1, y1, x2, y2, dpr);
        }
      }

      // --- Particles ---
      const baseSpeed = (0.3 + heating * 0.7) * 0.06;
      ctx.globalAlpha = 0.65;
      for (const p of particles) {
        p.phase = (p.phase + baseSpeed * p.speed * 0.016) % 1;
        const pos = cellPos(p.cell, p.phase, rotation);
        const px = xToPixel(pos.x + p.xOff);
        const py = yToPixel(pos.y + p.yOff);

        if (px < 0 || px > w || py < topPad || py > h - groundH) continue;

        const [cr, cg2, cb] = p.cell.color;
        const radius = p.size * dpr;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg2},${cb},0.55)`;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // --- Jet stream ribbon at ~60° (cell boundary between Ferrel and Polar) ---
      const jetX = xToPixel(0.667);
      const jetY = yToPixel(0.92); // near tropopause
      const jetWidth = w * 0.06;
      const jetAlpha = rotation * 0.25;
      if (jetAlpha > 0.02) {
        // Wavy ribbon
        ctx.beginPath();
        const waveAmp = 6 * dpr;
        const waveLen = 30 * dpr;
        const jetLen = w * 0.12;
        const jetStart = jetX - jetLen / 2;
        ctx.moveTo(jetStart, jetY);
        for (let i = 0; i <= 20; i++) {
          const t = i / 20;
          const sx = jetStart + t * jetLen;
          const sy = jetY + Math.sin(t * Math.PI * 4 + time * 2) * waveAmp;
          ctx.lineTo(sx, sy);
        }
        // Return path slightly offset
        for (let i = 20; i >= 0; i--) {
          const t = i / 20;
          const sx = jetStart + t * jetLen;
          const sy = jetY + 3 * dpr + Math.sin(t * Math.PI * 4 + time * 2) * waveAmp;
          ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.fillStyle = `rgba(255,230,120,${jetAlpha})`;
        ctx.fill();

        // Jet label
        ctx.font = `${8 * dpr}px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif`;
        ctx.fillStyle = `rgba(255,230,120,${jetAlpha + 0.1})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('Jet stream', jetX, jetY - waveAmp - 4 * dpr);
      }

      // --- ITCZ marker at equator ---
      const itczAlpha = heating * 0.3;
      if (itczAlpha > 0.02) {
        const itczX = xToPixel(0);
        // Rising arrows
        ctx.strokeStyle = `rgba(220,100,50,${itczAlpha})`;
        ctx.fillStyle = `rgba(220,100,50,${itczAlpha})`;
        ctx.lineWidth = 1.5 * dpr;
        for (let i = 0; i < 3; i++) {
          const ax = itczX + (i - 1) * 8 * dpr;
          drawArrow(ctx, ax, yToPixel(0.05), ax, yToPixel(0.55), dpr);
        }
        ctx.font = `${8 * dpr}px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('ITCZ', itczX + 2 * dpr, yToPixel(0.60));
      }

      // --- Subtropical high at ~30° ---
      const sthX = xToPixel(0.333);
      const sthAlpha = heating * 0.2;
      if (sthAlpha > 0.02) {
        // Sinking arrows
        ctx.strokeStyle = `rgba(200,170,70,${sthAlpha})`;
        ctx.fillStyle = `rgba(200,170,70,${sthAlpha})`;
        ctx.lineWidth = 1.5 * dpr;
        for (let i = 0; i < 2; i++) {
          const ax = sthX + (i - 0.5) * 8 * dpr;
          drawArrow(ctx, ax, yToPixel(0.55), ax, yToPixel(0.08), dpr);
        }
        ctx.font = `${8 * dpr}px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillStyle = `rgba(200,170,70,${sthAlpha + 0.1})`;
        ctx.fillText('H', sthX, yToPixel(0.10) - 2 * dpr);
      }

      // --- Ground strip ---
      const groundGrad = ctx.createLinearGradient(0, 0, w, 0);
      groundGrad.addColorStop(0, '#5a3a20');
      groundGrad.addColorStop(0.5, '#3d2b18');
      groundGrad.addColorStop(1, 'rgba(180,200,230,0.3)');  // icy pole
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, h - groundH, w, groundH);
      ctx.fillStyle = '#5a4030';
      ctx.fillRect(0, h - groundH, w, 1);

      // --- Surface wind labels ---
      ctx.font = `${9 * dpr}px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif`;
      ctx.textBaseline = 'bottom';
      ctx.textAlign = 'center';
      const windY = h - groundH - 6 * dpr;
      const windAlpha = 0.35 + rotation * 0.15;

      // Trade winds (0–30°, blow westward = ← )
      ctx.fillStyle = `rgba(220,140,60,${windAlpha})`;
      ctx.fillText('← Trade winds', xToPixel(0.167), windY);

      // Westerlies (30–60°, blow eastward = → )
      ctx.fillStyle = `rgba(160,190,110,${windAlpha})`;
      ctx.fillText('Westerlies →', xToPixel(0.500), windY);

      // Polar easterlies (60–90°, blow westward = ← )
      ctx.fillStyle = `rgba(100,160,230,${windAlpha})`;
      ctx.fillText('← Easterlies', xToPixel(0.833), windY);

      // --- Latitude labels ---
      ctx.font = `${8 * dpr}px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const latY = h - groundH + 4 * dpr;
      ctx.fillText('Equator', xToPixel(0), latY);
      ctx.fillText('30°', xToPixel(0.333), latY);
      ctx.fillText('60°', xToPixel(0.667), latY);
      ctx.fillText('90° Pole', xToPixel(1), latY);

      // --- Cell name labels (top) ---
      ctx.font = `${9 * dpr}px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif`;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'center';
      for (const cell of CELLS) {
        const [cr, cg2, cb] = cell.color;
        ctx.fillStyle = `rgba(${cr},${cg2},${cb},0.40)`;
        ctx.fillText(cell.name, xToPixel((cell.x0 + cell.x1) / 2), topPad + 4 * dpr);
      }

      // --- Tropopause line ---
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3 * dpr, 4 * dpr]);
      const tropoY = yToPixel(0.92);
      ctx.beginPath();
      ctx.moveTo(0, tropoY);
      ctx.lineTo(w, tropoY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = `${7 * dpr}px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText('Tropopause', w - 4 * dpr, tropoY - 2 * dpr);
    }

    function drawArrow(ctx, x1, y1, x2, y2, dpr) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 1) return;
      const ux = dx / len;
      const uy = dy / len;
      const aSize = 3.5 * dpr;

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
