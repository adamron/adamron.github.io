/**
 * cloud-formation demo
 * Shows a rising air parcel with converging temperature and dew-point lines.
 * Temperature falls at the dry adiabatic rate (10°C/km); dew point falls
 * slowly (~1.7°C/km). Where they meet is the cloud base — condensation
 * begins. Above it, temperature follows the moist adiabatic rate (~6°C/km)
 * and the two lines merge.
 */
registerDemo('cloud-formation', {
  init(container) {
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);

    const wrap = container.closest('.demo-container');
    const tempSlider = wrap.querySelector('[data-control="temperature"]');
    const dewSlider  = wrap.querySelector('[data-control="dew-point"]');

    // Slider → physical value
    let surfTemp = 29.5;  // °C
    let dewPoint = 13.5;  // °C

    function readSliders() {
      if (tempSlider) surfTemp = parseInt(tempSlider.value, 10) * 0.3 + 10;
      if (dewSlider)  dewPoint = parseInt(dewSlider.value, 10) * 0.3;
    }
    readSliders();

    const onInput = () => { readSliders(); };
    if (tempSlider) tempSlider.addEventListener('input', onInput);
    if (dewSlider)  dewSlider.addEventListener('input', onInput);

    // --- Physics constants ---
    const DRY_LAPSE  = 10;    // °C / km
    const DEW_LAPSE  = 1.7;   // °C / km
    const MOIST_LAPSE = 6;    // °C / km
    const MAX_ALT = 5;        // km

    function getCloudBase() {
      const eDew = Math.min(dewPoint, surfTemp);
      const gap = surfTemp - eDew;
      if (gap <= 0) return 0;
      return gap / (DRY_LAPSE - DEW_LAPSE);  // km
    }

    function tempAtAlt(alt) {
      const cb = getCloudBase();
      if (alt <= cb) return surfTemp - DRY_LAPSE * alt;
      const cbTemp = surfTemp - DRY_LAPSE * cb;
      return cbTemp - MOIST_LAPSE * (alt - cb);
    }

    function dewAtAlt(alt) {
      const cb = getCloudBase();
      if (alt <= cb) return Math.min(dewPoint, surfTemp) - DEW_LAPSE * alt;
      return tempAtAlt(alt); // saturated — dew point equals temperature
    }

    // --- Pre-generated cloud puffs ---
    const PUFFS = [];
    for (let i = 0; i < 55; i++) {
      PUFFS.push({
        xn: Math.random(),
        yn: Math.random(),
        rx: 0.03 + Math.random() * 0.07,
        ry: 0.015 + Math.random() * 0.035,
        a: 0.04 + Math.random() * 0.08,
      });
    }

    // --- Chart layout ---
    const T_MIN = -30, T_MAX = 45;

    function resize() {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }

    // --- Animation ---
    const CYCLE = 5.5;
    const FADE = 0.4;
    const GAP = 0.5;
    const PERIOD = CYCLE + FADE + GAP;
    let time = 0;
    let animId = 0;
    let lastTime = 0;

    function draw() {
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      const dpr = window.devicePixelRatio || 1;

      ctx.clearRect(0, 0, w, h);

      // Margins
      const ml = 50 * dpr, mr = 16 * dpr, mt = 12 * dpr, mb = 22 * dpr;
      const pL = ml, pR = w - mr, pT = mt, pB = h - mb;
      const pW = pR - pL, pH = pB - pT;

      const altToY  = alt => pB - (alt / MAX_ALT) * pH;
      const tempToX = t   => pL + ((t - T_MIN) / (T_MAX - T_MIN)) * pW;
      const cb = Math.min(getCloudBase(), MAX_ALT);

      // --- Cloud region fill ---
      if (cb < MAX_ALT) {
        const cbY = altToY(cb);
        const topY = pT;

        // Gradient haze
        const cg = ctx.createLinearGradient(0, cbY, 0, topY);
        cg.addColorStop(0, 'rgba(255,255,255,0)');
        cg.addColorStop(0.12, 'rgba(255,255,255,0.05)');
        cg.addColorStop(0.5, 'rgba(255,255,255,0.08)');
        cg.addColorStop(1, 'rgba(255,255,255,0.06)');
        ctx.fillStyle = cg;
        ctx.fillRect(pL, topY, pW, cbY - topY);

        // Cloud puffs
        const cloudDepth = MAX_ALT - cb;
        for (const p of PUFFS) {
          const pAlt = cb + p.yn * cloudDepth;
          if (pAlt > MAX_ALT) continue;
          const px = pL + p.xn * pW;
          const py = altToY(pAlt);
          const rx = p.rx * pW;
          const ry = p.ry * pH;
          ctx.beginPath();
          ctx.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${p.a})`;
          ctx.fill();
        }
      }

      // --- Fill between temp and dew-point lines (moisture gap) ---
      {
        const STEPS = 80;
        ctx.beginPath();
        for (let i = 0; i <= STEPS; i++) {
          const alt = (i / STEPS) * cb;
          ctx.lineTo(tempToX(tempAtAlt(alt)), altToY(alt));
        }
        for (let i = STEPS; i >= 0; i--) {
          const alt = (i / STEPS) * cb;
          ctx.lineTo(tempToX(dewAtAlt(alt)), altToY(alt));
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(100,170,220,0.06)';
        ctx.fill();
      }

      // --- Grid ---
      ctx.lineWidth = 1;

      // Altitude: every 1 km
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      for (let a = 0; a <= MAX_ALT; a += 1) {
        const y = altToY(a);
        ctx.beginPath(); ctx.moveTo(pL, y); ctx.lineTo(pR, y); ctx.stroke();
      }

      // Temperature: every 10°C
      for (let t = T_MIN; t <= T_MAX; t += 10) {
        ctx.strokeStyle = t === 0 ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.05)';
        const x = tempToX(t);
        ctx.beginPath(); ctx.moveTo(x, pT); ctx.lineTo(x, pB); ctx.stroke();
      }

      // --- Cloud base marker ---
      if (cb > 0 && cb < MAX_ALT) {
        const cbY = altToY(cb);
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4 * dpr, 4 * dpr]);
        ctx.beginPath(); ctx.moveTo(pL, cbY); ctx.lineTo(pR, cbY); ctx.stroke();
        ctx.setLineDash([]);

        // Label
        ctx.font = `${9 * dpr}px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`Cloud base ${cb.toFixed(1)} km`, pR - 4 * dpr, cbY - 3 * dpr);
      }

      // --- Ground strip ---
      const gH = 3 * dpr;
      ctx.fillStyle = '#3d2b18';
      ctx.fillRect(pL, pB - gH, pW, gH);
      ctx.fillStyle = '#5a4030';
      ctx.fillRect(pL, pB - gH, pW, 1);

      // --- Profile lines ---
      const STEPS = 120;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Temperature line
      ctx.beginPath();
      for (let i = 0; i <= STEPS; i++) {
        const alt = (i / STEPS) * MAX_ALT;
        const x = tempToX(tempAtAlt(alt));
        const y = altToY(alt);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      // Glow
      ctx.strokeStyle = 'rgba(230,130,60,0.20)';
      ctx.lineWidth = 5 * dpr;
      ctx.stroke();
      // Line
      ctx.strokeStyle = '#e8943a';
      ctx.lineWidth = 2.2 * dpr;
      ctx.stroke();

      // Dew-point line (below cloud base only — merges above)
      if (cb > 0) {
        const dewSteps = Math.ceil(STEPS * (cb / MAX_ALT));
        ctx.beginPath();
        for (let i = 0; i <= dewSteps; i++) {
          const alt = (i / dewSteps) * cb;
          const x = tempToX(dewAtAlt(alt));
          const y = altToY(alt);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(80,180,220,0.20)';
        ctx.lineWidth = 5 * dpr;
        ctx.stroke();
        ctx.strokeStyle = '#50b4dc';
        ctx.lineWidth = 2.2 * dpr;
        ctx.stroke();
      }

      // Convergence dot at cloud base
      if (cb > 0 && cb < MAX_ALT) {
        const cx = tempToX(tempAtAlt(cb));
        const cy = altToY(cb);
        ctx.beginPath();
        ctx.arc(cx, cy, 4.5 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
      }

      // --- Axis labels ---
      const font = `${10 * dpr}px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif`;
      ctx.font = font;
      ctx.fillStyle = '#555';

      // Altitude
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (let a = 0; a <= MAX_ALT; a += 1) {
        ctx.fillText(`${a} km`, pL - 8 * dpr, altToY(a));
      }

      // Temperature
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (let t = T_MIN; t <= T_MAX; t += 10) {
        ctx.fillText(`${t}°`, tempToX(t), pB + 4 * dpr);
      }

      // --- Surface annotations ---
      ctx.font = `${9 * dpr}px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif`;

      // Surface temp label
      const stx = tempToX(surfTemp);
      ctx.fillStyle = 'rgba(232,148,58,0.7)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`T ${surfTemp.toFixed(0)}°C`, stx, pB - gH - 3 * dpr);

      // Dew point label
      const eDew = Math.min(dewPoint, surfTemp);
      const dpx = tempToX(eDew);
      ctx.fillStyle = 'rgba(80,180,220,0.7)';
      if (Math.abs(stx - dpx) > 40 * dpr) {
        ctx.fillText(`Td ${eDew.toFixed(0)}°C`, dpx, pB - gH - 3 * dpr);
      } else {
        ctx.textAlign = 'right';
        ctx.fillText(`Td ${eDew.toFixed(0)}°C`, dpx - 6 * dpr, pB - gH - 3 * dpr);
      }

      // --- Animated parcel ---
      const phase = time % PERIOD;
      let parcelAlpha = 1;
      if (phase < 0.3) parcelAlpha = phase / 0.3;
      else if (phase > CYCLE) parcelAlpha = Math.max(0, 1 - (phase - CYCLE) / FADE);

      if (parcelAlpha > 0 && phase < CYCLE + FADE) {
        const parcelAlt = Math.min(MAX_ALT, (Math.min(phase, CYCLE) / CYCLE) * MAX_ALT);
        const parcelTemp = tempAtAlt(parcelAlt);
        const px = tempToX(parcelTemp);
        const py = altToY(parcelAlt);
        const inCloud = parcelAlt >= cb && cb < MAX_ALT;

        // Trail (last ~0.6km)
        const trailDepth = 0.6;
        const trailSteps = 15;
        for (let i = trailSteps; i >= 1; i--) {
          const ta = Math.max(0, parcelAlt - (i / trailSteps) * trailDepth);
          const ttx = tempToX(tempAtAlt(ta));
          const tty = altToY(ta);
          const tAlpha = (1 - i / trailSteps) * 0.3 * parcelAlpha;
          ctx.beginPath();
          ctx.arc(ttx, tty, 2.5 * dpr, 0, Math.PI * 2);
          ctx.fillStyle = inCloud
            ? `rgba(255,255,255,${tAlpha})`
            : `rgba(230,150,70,${tAlpha})`;
          ctx.fill();
        }

        // Parcel dot
        ctx.globalAlpha = parcelAlpha;
        // Glow
        ctx.beginPath();
        ctx.arc(px, py, 9 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = inCloud ? 'rgba(255,255,255,0.15)' : 'rgba(230,150,70,0.15)';
        ctx.fill();
        // Dot
        ctx.beginPath();
        ctx.arc(px, py, 4 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = inCloud ? 'rgba(255,255,255,0.9)' : 'rgba(240,170,80,0.9)';
        ctx.fill();
        ctx.globalAlpha = 1;
      }
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
