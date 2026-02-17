/**
 * temperature-profile demo
 * Vertical atmospheric temperature profile showing how temperature
 * decreases with altitude at the lapse rate. The filled region is
 * color-coded from warm (surface) to cold (altitude). Hover to
 * read temperature at any altitude.
 */
registerDemo('temperature-profile', {
  init(container) {
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);

    const wrap = container.closest('.demo-container');
    const lapseSlider = wrap.querySelector('[data-control="lapse-rate"]');
    const surfSlider = wrap.querySelector('[data-control="surface-temp"]');

    const MAX_ALT = 15; // km
    let lapseRate = 6.5; // °C per km
    let surfaceTemp = 20; // °C
    let pointerY = -1;

    function readSliders() {
      if (lapseSlider) lapseRate = parseInt(lapseSlider.value, 10) / 10;
      if (surfSlider) surfaceTemp = parseInt(surfSlider.value, 10) * 0.5 - 10;
    }
    readSliders();

    const onInput = () => { readSliders(); scheduleDraw(); };
    if (lapseSlider) lapseSlider.addEventListener('input', onInput);
    if (surfSlider) surfSlider.addEventListener('input', onInput);

    // Mouse hover for readout (mouse only — don't block touch scrolling)
    canvas.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const rect = canvas.getBoundingClientRect();
      pointerY = (e.clientY - rect.top) * (window.devicePixelRatio || 1);
      scheduleDraw();
    });
    canvas.addEventListener('pointerleave', () => {
      pointerY = -1;
      scheduleDraw();
    });
    canvas.style.cursor = 'crosshair';

    function tempAtAlt(alt) {
      return surfaceTemp - lapseRate * alt;
    }

    // Color ramp: cold blues → warm oranges/reds
    const RAMP = [
      { t: -80, r: 15,  g: 8,   b: 45  },
      { t: -50, r: 30,  g: 50,  b: 140 },
      { t: -20, r: 50,  g: 110, b: 190 },
      { t:   0, r: 80,  g: 170, b: 220 },
      { t:  15, r: 175, g: 190, b: 100 },
      { t:  30, r: 220, g: 140, b: 50  },
      { t:  45, r: 200, g: 60,  b: 30  },
    ];

    function tempRGB(temp) {
      if (temp <= RAMP[0].t) return RAMP[0];
      if (temp >= RAMP[RAMP.length - 1].t) return RAMP[RAMP.length - 1];
      for (let i = 0; i < RAMP.length - 1; i++) {
        if (temp <= RAMP[i + 1].t) {
          const f = (temp - RAMP[i].t) / (RAMP[i + 1].t - RAMP[i].t);
          return {
            r: Math.round(RAMP[i].r + (RAMP[i + 1].r - RAMP[i].r) * f),
            g: Math.round(RAMP[i].g + (RAMP[i + 1].g - RAMP[i].g) * f),
            b: Math.round(RAMP[i].b + (RAMP[i + 1].b - RAMP[i].b) * f),
          };
        }
      }
      return RAMP[RAMP.length - 1];
    }

    function tempRGBA(temp, a) {
      const c = tempRGB(temp);
      return `rgba(${c.r},${c.g},${c.b},${a})`;
    }

    let pending = false;
    function scheduleDraw() {
      if (!pending) {
        pending = true;
        requestAnimationFrame(() => { pending = false; draw(); });
      }
    }

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

      // Layout
      const ml = 50 * dpr;
      const mr = 16 * dpr;
      const mt = 12 * dpr;
      const mb = 22 * dpr;

      const pL = ml, pR = w - mr, pT = mt, pB = h - mb;
      const pW = pR - pL, pH = pB - pT;

      // Fixed temperature axis: covers all slider combos
      // Surface: -10 to 40°C, lapse: 0–10°C/km, alt: 15km
      // Coldest possible: -10 - 10*15 = -160 (clamp to -160)
      // Warmest possible: 40°C
      const topTemp = tempAtAlt(MAX_ALT);
      const tMin = -160;
      const tMax = 40;

      const altToY = alt => pB - (alt / MAX_ALT) * pH;
      const tempToX = t => pL + ((t - tMin) / (tMax - tMin)) * pW;
      const clampX = x => Math.max(pL, Math.min(pR, x));

      // --- Filled region under profile ---
      ctx.save();
      ctx.beginPath();
      ctx.rect(pL, pT, pW, pH);
      ctx.clip();

      const STEPS = 150;
      ctx.beginPath();
      ctx.moveTo(pL, pB);
      for (let i = 0; i <= STEPS; i++) {
        const alt = (i / STEPS) * MAX_ALT;
        ctx.lineTo(clampX(tempToX(tempAtAlt(alt))), altToY(alt));
      }
      ctx.lineTo(pL, pT);
      ctx.closePath();

      // Gradient colored by temperature at each altitude
      const grad = ctx.createLinearGradient(0, pT, 0, pB);
      const GS = 16;
      for (let i = 0; i <= GS; i++) {
        const f = i / GS;
        grad.addColorStop(f, tempRGBA(tempAtAlt(MAX_ALT * (1 - f)), 0.4));
      }
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();

      // --- Grid lines ---
      ctx.lineWidth = 1;

      // Altitude grid: every 5 km
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      for (let alt = 0; alt <= MAX_ALT; alt += 5) {
        const y = altToY(alt);
        ctx.beginPath();
        ctx.moveTo(pL, y);
        ctx.lineTo(pR, y);
        ctx.stroke();
      }

      // Temperature grid: every 40°C, 0°C slightly brighter
      for (let t = tMin; t <= tMax; t += 40) {
        const x = tempToX(t);
        ctx.strokeStyle = t === 0
          ? 'rgba(255,255,255,0.12)'
          : 'rgba(255,255,255,0.06)';
        ctx.beginPath();
        ctx.moveTo(x, pT);
        ctx.lineTo(x, pB);
        ctx.stroke();
      }

      // --- Ground strip ---
      const gH = 3 * dpr;
      ctx.fillStyle = '#3d2b18';
      ctx.fillRect(pL, pB - gH, pW, gH);
      ctx.fillStyle = '#5a4030';
      ctx.fillRect(pL, pB - gH, pW, 1);

      // --- Profile line ---
      ctx.save();
      ctx.beginPath();
      ctx.rect(pL, pT, pW, pH);
      ctx.clip();

      ctx.beginPath();
      for (let i = 0; i <= STEPS; i++) {
        const alt = (i / STEPS) * MAX_ALT;
        const x = tempToX(tempAtAlt(alt));
        const y = altToY(alt);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      // Glow
      ctx.strokeStyle = 'rgba(200,220,255,0.25)';
      ctx.lineWidth = 6 * dpr;
      ctx.stroke();
      // Line
      ctx.strokeStyle = '#dde8ff';
      ctx.lineWidth = 2.5 * dpr;
      ctx.stroke();
      ctx.restore();

      // --- Axis labels ---
      const font = `${10 * dpr}px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif`;
      ctx.font = font;
      ctx.fillStyle = '#555';

      // Altitude
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (let alt = 0; alt <= MAX_ALT; alt += 5) {
        ctx.fillText(`${alt} km`, pL - 8 * dpr, altToY(alt));
      }

      // Temperature
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (let t = tMin; t <= tMax; t += 40) {
        const x = tempToX(t);
        if (x >= pL - 5 * dpr && x <= pR + 5 * dpr) {
          ctx.fillText(`${t}°C`, x, pB + 4 * dpr);
        }
      }

      // --- Endpoint annotations ---
      ctx.font = font;
      ctx.fillStyle = '#888';

      // Surface temp
      const sx = clampX(tempToX(surfaceTemp));
      ctx.textAlign = sx > pL + pW * 0.5 ? 'right' : 'left';
      ctx.textBaseline = 'bottom';
      const sOff = ctx.textAlign === 'right' ? -8 * dpr : 8 * dpr;
      ctx.fillText(`${surfaceTemp.toFixed(0)}°C`, sx + sOff, pB - gH - 3 * dpr);

      // Top temp
      const tx = clampX(tempToX(topTemp));
      ctx.textAlign = tx > pL + pW * 0.5 ? 'right' : 'left';
      ctx.textBaseline = 'top';
      const tOff = ctx.textAlign === 'right' ? -8 * dpr : 8 * dpr;
      ctx.fillText(`${topTemp.toFixed(0)}°C`, tx + tOff, pT + 3 * dpr);

      // --- Hover indicator ---
      if (pointerY >= pT && pointerY <= pB) {
        const hAlt = ((pB - pointerY) / pH) * MAX_ALT;
        const hTemp = tempAtAlt(hAlt);
        const hx = clampX(tempToX(hTemp));

        // Dashed horizontal line
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3 * dpr, 3 * dpr]);
        ctx.beginPath();
        ctx.moveTo(pL, pointerY);
        ctx.lineTo(pR, pointerY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Dot on profile line
        ctx.beginPath();
        ctx.arc(hx, pointerY, 4 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();

        // Readout label
        ctx.font = `${10 * dpr}px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif`;
        ctx.fillStyle = '#eee';
        const label = `${hAlt.toFixed(1)} km  ${hTemp.toFixed(1)}°C`;
        const lm = ctx.measureText(label).width;
        let lx = hx + 10 * dpr;
        ctx.textAlign = 'left';
        if (lx + lm > pR - 4 * dpr) {
          lx = hx - 10 * dpr;
          ctx.textAlign = 'right';
        }
        ctx.textBaseline = 'bottom';
        ctx.fillText(label, lx, pointerY - 6 * dpr);
      }
    }

    window.addEventListener('resize', () => { resize(); scheduleDraw(); });
    resize();
    scheduleDraw();
  }
});
