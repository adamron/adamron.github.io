/**
 * full-weather demo — Synoptic Weather Map
 * Top-down weather map with analytically prescribed pressure systems,
 * wind particles spiraling around them, and fronts extending from the
 * low-pressure centre. Ties together heating, pressure, wind, Coriolis,
 * fronts, clouds, terrain, and rain.
 *
 * Rendering layers (bottom to top):
 *  1. Temperature gradient background (N-S)
 *  2. Pressure colour field (80x80 offscreen canvas)
 *  2b. Terrain field (80x80 offscreen canvas, hillshaded)
 *  3. Isobars (marching-squares contours)
 *  4. Fronts (cold: blue + triangle barbs, warm: red + semicircle bumps)
 *  5. Cloud puffs (~40 ellipses along fronts and near Low)
 *  5b. Orographic clouds (windward slope puffs)
 *  6. Wind particles (550 streaks, speed -> brightness)
 *  7. Rain streaks (near Low when moisture > 0.5)
 *  7b. Orographic rain (windward slope streaks)
 *  8. H/L labels at pressure centres
 *
 * Sliders: heating, moisture, rotation (Coriolis), speed (drift).
 * Select: terrain type (none, coast, divide, island).
 */
registerDemo('full-weather', {
  init(container) {
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);

    const wrap = container.closest('.demo-container');
    const heatSlider  = wrap.querySelector('[data-control="heating"]');
    const moistSlider = wrap.querySelector('[data-control="moisture"]');
    const rotSlider   = wrap.querySelector('[data-control="rotation"]');
    const speedSlider = wrap.querySelector('[data-control="speed"]');

    let heating     = 0.6;
    let moistureVal = 0.5;
    let rotation    = 0.5;
    let speed       = 0.5;
    let fieldDirty  = true;

    function bindSlider(slider, setter) {
      if (!slider) return;
      setter(parseInt(slider.value, 10) / 100);
      slider.addEventListener('input', () => setter(parseInt(slider.value, 10) / 100));
    }
    bindSlider(heatSlider,  v => { heating = v; fieldDirty = true; });
    bindSlider(moistSlider, v => { moistureVal = v; });
    bindSlider(rotSlider,   v => { rotation = v; });
    bindSlider(speedSlider, v => { speed = v; });

    // Terrain
    let terrainType  = 'none';
    let terrainDirty = true;
    const terrainSelect = wrap.querySelector('[data-control="terrain-type"]');
    if (terrainSelect) {
      terrainSelect.addEventListener('change', () => {
        terrainType  = terrainSelect.value;
        terrainDirty = true;
      });
    }

    // --- Seeded RNG (stable cloud / rain positions) ---
    function seededRNG(seed) {
      let s = seed;
      return function() {
        s = (s * 16807 + 0) % 2147483647;
        return s / 2147483647;
      };
    }
    const rng = seededRNG(314159);

    // --- Terrain height functions ---
    function smoothstep(edge0, edge1, x) {
      const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
      return t * t * (3 - 2 * t);
    }

    const terrainFns = {
      none() { return 0; },
      coast(x, y) {
        // N-S ridge at x≈0.14
        const ridge = Math.exp(-((x - 0.14) * (x - 0.14)) / (2 * 0.018 * 0.018));
        // Taper at north/south edges
        const taper = smoothstep(0.02, 0.15, y) * smoothstep(0.02, 0.15, 1 - y);
        return ridge * taper;
      },
      divide(x, y) {
        // N-S ridge at x≈0.50 with slight waviness
        const wave = 0.50 + 0.03 * Math.sin(y * Math.PI * 4);
        const ridge = Math.exp(-((x - wave) * (x - wave)) / (2 * 0.022 * 0.022));
        const taper = smoothstep(0.02, 0.12, y) * smoothstep(0.02, 0.12, 1 - y);
        return ridge * taper;
      },
      island(x, y) {
        // Circular peak at (0.55, 0.55)
        const dx = x - 0.55;
        const dy = y - 0.55;
        return Math.exp(-(dx * dx + dy * dy) / (2 * 0.045 * 0.045));
      },
    };

    function terrainAt(x, y) {
      return terrainFns[terrainType](x, y);
    }

    const T_EPS = 0.003;
    function terrainGrad(x, y) {
      return {
        x: (terrainAt(x + T_EPS, y) - terrainAt(x - T_EPS, y)) / (2 * T_EPS),
        y: (terrainAt(x, y + T_EPS) - terrainAt(x, y - T_EPS)) / (2 * T_EPS),
      };
    }

    // --- Pressure centres ---
    // Normalised coords [0,1]x[0,1]. y=0 is north (top), y=1 is south (bottom).
    // All drift eastward at rate controlled by speed slider.
    const centres = [
      { type: 'L', baseX: 0.40, baseY: 0.40, sigma: 0.20, baseStr: -0.45 }, // Primary Low (mid-lat)
      { type: 'H', baseX: 0.75, baseY: 0.70, sigma: 0.22, baseStr:  0.30 }, // Subtropical High (SE)
      { type: 'H', baseX: 0.20, baseY: 0.18, sigma: 0.18, baseStr:  0.15 }, // Polar High (NW)
    ];

    let time  = 0;
    let drift = 0;

    function getCentreX(c) {
      return ((c.baseX + drift) % 1.0 + 1.0) % 1.0;
    }

    function getCentreStr(c) {
      // heating=0 → nearly flat; heating=1 → full strength
      return c.baseStr * (0.05 + heating * 0.95);
    }

    // Analytical pressure at (x, y) ∈ [0,1]²
    function pressureAt(x, y) {
      let p = 0.5;
      for (const c of centres) {
        const cx = getCentreX(c);
        let dx = x - cx;
        if (dx >  0.5) dx -= 1;
        if (dx < -0.5) dx += 1;
        const dy = y - c.baseY;
        p += getCentreStr(c) * Math.exp(-(dx * dx + dy * dy) / (2 * c.sigma * c.sigma));
      }
      return p;
    }

    // Pressure gradient via central finite differences
    const EPS = 0.003;
    function pressureGrad(x, y) {
      return {
        x: (pressureAt(x + EPS, y) - pressureAt(x - EPS, y)) / (2 * EPS),
        y: (pressureAt(x, y + EPS) - pressureAt(x, y - EPS)) / (2 * EPS),
      };
    }

    // Raw (pressure-driven) wind — no terrain effects
    //   rotation=0 → wind straight H→L (pure PGF)
    //   rotation=1 → wind parallel to isobars (pure geostrophic)
    function rawWindAt(x, y) {
      const grad = pressureGrad(x, y);
      // Pressure gradient force
      const pgfX = -grad.x;
      const pgfY = -grad.y;
      // Geostrophic: PGF rotated 90° CW in screen coords
      // (= counterclockwise around Low in NH geographic convention)
      const geoX =  pgfY;
      const geoY = -pgfX;
      const r = rotation;
      const s = 2.5; // overall wind strength
      return {
        x: (r * geoX + (1 - r) * pgfX) * s,
        y: (r * geoY + (1 - r) * pgfY) * s,
      };
    }

    // Wind with terrain effects: slowdown + deflection
    function windAt(x, y) {
      const w = rawWindAt(x, y);
      if (terrainType === 'none') return w;
      const h = terrainAt(x, y);
      const tg = terrainGrad(x, y);
      // Slowdown: speed × (1 − h × 0.85)
      const slow = 1 - h * 0.85;
      // Deflection: subtract gradient scaled by height
      const deflect = h * 2.5;
      return {
        x: w.x * slow - tg.x * deflect,
        y: w.y * slow - tg.y * deflect,
      };
    }

    // --- Offscreen pressure colour field (80x80) ---
    const FIELD_RES = 80;
    const fieldCanvas = document.createElement('canvas');
    fieldCanvas.width  = FIELD_RES;
    fieldCanvas.height = FIELD_RES;
    const pressureGrid = new Float32Array(FIELD_RES * FIELD_RES);

    function renderField() {
      // Build grid
      for (let iy = 0; iy < FIELD_RES; iy++) {
        for (let ix = 0; ix < FIELD_RES; ix++) {
          pressureGrid[iy * FIELD_RES + ix] =
            pressureAt((ix + 0.5) / FIELD_RES, (iy + 0.5) / FIELD_RES);
        }
      }
      // Colour: muted dark — low pressure = slightly warm, high = slightly cool
      const fctx = fieldCanvas.getContext('2d');
      const img = fctx.createImageData(FIELD_RES, FIELD_RES);
      const d = img.data;
      for (let i = 0; i < pressureGrid.length; i++) {
        const t = Math.max(0, Math.min(1, pressureGrid[i]));
        let r, g, b;
        if (t < 0.5) {
          const f = t / 0.5;
          r = Math.round(35 + 30 * (1 - f));
          g = Math.round(25 + 12 * (1 - f));
          b = Math.round(38 + 22 * f);
        } else {
          const f = (t - 0.5) / 0.5;
          r = Math.round(35 - 15 * f);
          g = Math.round(25 + 12 * f);
          b = Math.round(60 + 25 * f);
        }
        const pi = i * 4;
        d[pi]     = r;
        d[pi + 1] = g;
        d[pi + 2] = b;
        d[pi + 3] = 255;
      }
      fctx.putImageData(img, 0, 0);
      fieldDirty = false;
    }

    // --- Offscreen terrain field (same resolution) ---
    const terrainCanvas = document.createElement('canvas');
    terrainCanvas.width  = FIELD_RES;
    terrainCanvas.height = FIELD_RES;

    function renderTerrainField() {
      const tctx = terrainCanvas.getContext('2d');
      const img = tctx.createImageData(FIELD_RES, FIELD_RES);
      const d = img.data;
      for (let iy = 0; iy < FIELD_RES; iy++) {
        for (let ix = 0; ix < FIELD_RES; ix++) {
          const nx = (ix + 0.5) / FIELD_RES;
          const ny = (iy + 0.5) / FIELD_RES;
          const h = terrainAt(nx, ny);
          if (h < 0.02) {
            const pi = (iy * FIELD_RES + ix) * 4;
            d[pi] = d[pi + 1] = d[pi + 2] = d[pi + 3] = 0;
            continue;
          }
          // Hillshade from NW (light direction = (-1, -1) normalised)
          const gx = (terrainAt(Math.min(1, nx + 0.01), ny) - terrainAt(Math.max(0, nx - 0.01), ny)) / 0.02;
          const gy = (terrainAt(nx, Math.min(1, ny + 0.01)) - terrainAt(nx, Math.max(0, ny - 0.01))) / 0.02;
          const shade = 0.5 + 0.5 * Math.max(-1, Math.min(1, (-gx - gy) * 0.7));
          const base = 0.35 + 0.65 * shade;
          // Brown tones
          const r = Math.round(140 * base * h);
          const g = Math.round(105 * base * h);
          const b = Math.round(55 * base * h);
          const a = Math.round(Math.min(1, h * 2.5) * 255);
          const pi = (iy * FIELD_RES + ix) * 4;
          d[pi]     = r;
          d[pi + 1] = g;
          d[pi + 2] = b;
          d[pi + 3] = a;
        }
      }
      tctx.putImageData(img, 0, 0);
      terrainDirty = false;
    }

    // --- Orographic cloud / rain candidates (pre-generated) ---
    const OROG_N = 200;
    const orogCandidates = [];
    for (let i = 0; i < OROG_N; i++) {
      orogCandidates.push({
        x: rng(),
        y: rng(),
        rx: 0.010 + rng() * 0.018,
        ry: 0.006 + rng() * 0.012,
        alpha: 0.04 + rng() * 0.06,
        phase: rng(),
        speed: 0.5 + rng() * 0.5,
      });
    }

    // --- Marching squares isobars ---
    // Edge indices: 0=top, 1=right, 2=bottom, 3=left
    const CONTOUR_SEGS = {
      1: [2, 3],    2: [1, 2],    3: [1, 3],    4: [0, 1],
      5: [0, 3, 1, 2], 6: [0, 2], 7: [0, 3],   8: [0, 3],
      9: [0, 2],    10: [0, 1, 2, 3], 11: [0, 1], 12: [1, 3],
      13: [1, 2],   14: [2, 3],
    };

    function drawIsobars(ctx, w, h) {
      let pMin = Infinity, pMax = -Infinity;
      for (let i = 0; i < pressureGrid.length; i++) {
        if (pressureGrid[i] < pMin) pMin = pressureGrid[i];
        if (pressureGrid[i] > pMax) pMax = pressureGrid[i];
      }
      const pRange = pMax - pMin || 1;
      const nContours = 8;
      const cellW = w / FIELD_RES;
      const cellH = h / FIELD_RES;
      const dpr = window.devicePixelRatio || 1;

      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1 * dpr;

      for (let c = 1; c < nContours; c++) {
        const level = pMin + (c / nContours) * pRange;
        ctx.beginPath();
        for (let iy = 0; iy < FIELD_RES - 1; iy++) {
          for (let ix = 0; ix < FIELD_RES - 1; ix++) {
            const tl = pressureGrid[iy * FIELD_RES + ix];
            const tr = pressureGrid[iy * FIELD_RES + ix + 1];
            const bl = pressureGrid[(iy + 1) * FIELD_RES + ix];
            const br = pressureGrid[(iy + 1) * FIELD_RES + ix + 1];

            const config = (tl >= level ? 8 : 0)
                         | (tr >= level ? 4 : 0)
                         | (br >= level ? 2 : 0)
                         | (bl >= level ? 1 : 0);
            if (config === 0 || config === 15) continue;

            const lerp = (a, b) => (a === b) ? 0.5 : (level - a) / (b - a);
            const top    = { x: (ix + lerp(tl, tr)) * cellW, y: iy * cellH };
            const right  = { x: (ix + 1) * cellW, y: (iy + lerp(tr, br)) * cellH };
            const bottom = { x: (ix + lerp(bl, br)) * cellW, y: (iy + 1) * cellH };
            const left   = { x: ix * cellW, y: (iy + lerp(tl, bl)) * cellH };

            const segs = CONTOUR_SEGS[config];
            if (segs) {
              const pts = [top, right, bottom, left];
              for (let s = 0; s < segs.length; s += 2) {
                const a = pts[segs[s]];
                const b = pts[segs[s + 1]];
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
              }
            }
          }
        }
        ctx.stroke();
      }
    }

    // --- Bezier helpers ---
    function bezPt(p0, p1, p2, p3, t) {
      const mt = 1 - t;
      return mt * mt * mt * p0 + 3 * mt * mt * t * p1
           + 3 * mt * t * t * p2 + t * t * t * p3;
    }
    function bezTan(p0, p1, p2, p3, t) {
      const mt = 1 - t;
      return 3 * mt * mt * (p1 - p0) + 6 * mt * t * (p2 - p1) + 3 * t * t * (p3 - p2);
    }

    // --- Fronts ---
    function drawFronts(ctx, w, h, dpr) {
      const frontLen = heating * 0.35 * Math.max(w, h);
      if (frontLen < 5) return;

      const low = centres[0];
      const lx = getCentreX(low) * w;
      const ly = low.baseY * h;

      // Cold front: south-southwest from Low
      const ca = Math.PI * 0.60;
      const cex  = lx + Math.cos(ca) * frontLen;
      const cey  = ly + Math.sin(ca) * frontLen;
      const cc1x = lx + Math.cos(ca + 0.15) * frontLen * 0.4;
      const cc1y = ly + Math.sin(ca + 0.15) * frontLen * 0.4;
      const cc2x = lx + Math.cos(ca - 0.10) * frontLen * 0.75;
      const cc2y = ly + Math.sin(ca - 0.10) * frontLen * 0.75;

      ctx.strokeStyle = 'rgba(80,130,220,0.55)';
      ctx.lineWidth = 2.5 * dpr;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.bezierCurveTo(cc1x, cc1y, cc2x, cc2y, cex, cey);
      ctx.stroke();

      // Triangle barbs on cold front
      const triSize = 4.5 * dpr;
      ctx.fillStyle = 'rgba(80,130,220,0.55)';
      for (let i = 1; i <= 5; i++) {
        const t = i / 6;
        const bx = bezPt(lx, cc1x, cc2x, cex, t);
        const by = bezPt(ly, cc1y, cc2y, cey, t);
        const tx = bezTan(lx, cc1x, cc2x, cex, t);
        const ty = bezTan(ly, cc1y, cc2y, cey, t);
        const tl = Math.sqrt(tx * tx + ty * ty) || 1;
        const nx = -ty / tl;
        const ny =  tx / tl;
        ctx.beginPath();
        ctx.moveTo(bx + nx * triSize, by + ny * triSize);
        ctx.lineTo(bx - (tx / tl) * triSize * 0.5, by - (ty / tl) * triSize * 0.5);
        ctx.lineTo(bx + (tx / tl) * triSize * 0.5, by + (ty / tl) * triSize * 0.5);
        ctx.closePath();
        ctx.fill();
      }

      // Warm front: east-southeast from Low
      const wa = Math.PI * 0.15;
      const wex  = lx + Math.cos(wa) * frontLen;
      const wey  = ly + Math.sin(wa) * frontLen;
      const wc1x = lx + Math.cos(wa - 0.12) * frontLen * 0.4;
      const wc1y = ly + Math.sin(wa - 0.12) * frontLen * 0.4;
      const wc2x = lx + Math.cos(wa + 0.08) * frontLen * 0.75;
      const wc2y = ly + Math.sin(wa + 0.08) * frontLen * 0.75;

      ctx.strokeStyle = 'rgba(200,90,60,0.55)';
      ctx.lineWidth = 2.5 * dpr;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.bezierCurveTo(wc1x, wc1y, wc2x, wc2y, wex, wey);
      ctx.stroke();

      // Semicircle bumps on warm front
      const bumpR = 3.5 * dpr;
      ctx.fillStyle = 'rgba(200,90,60,0.50)';
      for (let i = 1; i <= 5; i++) {
        const t = i / 6;
        const bx = bezPt(lx, wc1x, wc2x, wex, t);
        const by = bezPt(ly, wc1y, wc2y, wey, t);
        const tx = bezTan(lx, wc1x, wc2x, wex, t);
        const ty = bezTan(ly, wc1y, wc2y, wey, t);
        const tl = Math.sqrt(tx * tx + ty * ty) || 1;
        const nx = -ty / tl;
        const ny =  tx / tl;
        const angle = Math.atan2(ny, nx);
        ctx.beginPath();
        ctx.arc(bx, by, bumpR, angle - Math.PI / 2, angle + Math.PI / 2);
        ctx.fill();
      }
    }

    // --- Cloud puffs (pre-generated offsets from Low) ---
    const CLOUD_N = 40;
    const cloudPuffs = [];
    // ~15 near the Low centre
    for (let i = 0; i < 15; i++) {
      cloudPuffs.push({
        offX: (rng() - 0.5) * 0.12,
        offY: (rng() - 0.5) * 0.10,
        rx: 0.015 + rng() * 0.025,
        ry: 0.010 + rng() * 0.018,
        alpha: 0.05 + rng() * 0.07,
      });
    }
    // ~12 along cold front direction (angle ~pi*0.6)
    for (let i = 0; i < 12; i++) {
      const dist  = 0.03 + rng() * 0.22;
      const angle = Math.PI * 0.6 + (rng() - 0.5) * 0.4;
      cloudPuffs.push({
        offX: Math.cos(angle) * dist + (rng() - 0.5) * 0.03,
        offY: Math.sin(angle) * dist + (rng() - 0.5) * 0.03,
        rx: 0.012 + rng() * 0.022,
        ry: 0.008 + rng() * 0.015,
        alpha: 0.04 + rng() * 0.06,
      });
    }
    // ~13 along warm front direction (angle ~pi*0.15)
    for (let i = 0; i < 13; i++) {
      const dist  = 0.03 + rng() * 0.22;
      const angle = Math.PI * 0.15 + (rng() - 0.5) * 0.4;
      cloudPuffs.push({
        offX: Math.cos(angle) * dist + (rng() - 0.5) * 0.03,
        offY: Math.sin(angle) * dist + (rng() - 0.5) * 0.03,
        rx: 0.012 + rng() * 0.025,
        ry: 0.006 + rng() * 0.012,
        alpha: 0.04 + rng() * 0.06,
      });
    }

    // --- Rain drops (pre-generated offsets from Low) ---
    const RAIN_N = 30;
    const rainDrops = [];
    for (let i = 0; i < RAIN_N; i++) {
      rainDrops.push({
        offX: (rng() - 0.5) * 0.15,
        offY: (rng() - 0.5) * 0.15,
        phase: rng(),
        speed: 0.5 + rng() * 0.5,
      });
    }

    // --- Wind particles (550 streaks) ---
    const WIND_N = 550;
    const particles = [];
    for (let i = 0; i < WIND_N; i++) {
      particles.push({
        x: Math.random(), y: Math.random(),
        wx: 0, wy: 0,
        age: Math.random() * 2.0,
        maxAge: 2.0 + Math.random() * 3.0,
      });
    }

    function resetParticle(p) {
      p.x = Math.random();
      p.y = Math.random();
      p.wx = 0;
      p.wy = 0;
      p.age = 0;
      p.maxAge = 2.0 + Math.random() * 3.0;
    }

    function stepParticles(dt) {
      for (let i = 0; i < WIND_N; i++) {
        const p = particles[i];
        p.age += dt;
        if (p.age > p.maxAge || p.x < -0.03 || p.x > 1.03 || p.y < -0.03 || p.y > 1.03) {
          resetParticle(p);
          continue;
        }
        const w = windAt(p.x, p.y);
        p.wx = w.x;
        p.wy = w.y;
        p.x += w.x * dt * 0.15;
        p.y += w.y * dt * 0.15;
        // Push particles out of terrain peaks
        if (terrainType !== 'none') {
          const th = terrainAt(p.x, p.y);
          if (th > 0.6) {
            const tg = terrainGrad(p.x, p.y);
            const pushStr = (th - 0.6) * 0.02;
            p.x -= tg.x * pushStr;
            p.y -= tg.y * pushStr;
          }
        }
      }
    }

    // Warm up particles so spirals are established on first visible frame
    for (let i = 0; i < 100; i++) stepParticles(0.03);

    // --- Rendering ---
    function resize() {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = rect.width  * dpr;
      canvas.height = rect.height * dpr;
      fieldDirty = true;
    }

    function draw() {
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      const dpr = window.devicePixelRatio || 1;

      ctx.clearRect(0, 0, w, h);

      // --- Layer 1: Temperature gradient background ---
      const tempGrad = ctx.createLinearGradient(0, 0, 0, h);
      const ha = 0.06 + heating * 0.14;
      tempGrad.addColorStop(0, `rgba(70,100,180,${ha})`);   // cool blue (north)
      tempGrad.addColorStop(1, `rgba(200,140,60,${ha})`);   // warm amber (south)
      ctx.fillStyle = tempGrad;
      ctx.fillRect(0, 0, w, h);

      // --- Layer 2: Pressure colour field ---
      if (fieldDirty) renderField();
      ctx.globalAlpha = 0.75;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(fieldCanvas, 0, 0, w, h);
      ctx.globalAlpha = 1;

      // --- Layer 2b: Terrain ---
      if (terrainType !== 'none') {
        if (terrainDirty) renderTerrainField();
        ctx.globalAlpha = 0.85;
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(terrainCanvas, 0, 0, w, h);
        ctx.globalAlpha = 1;
      }

      // --- Layer 3: Isobars ---
      drawIsobars(ctx, w, h);

      // --- Layer 4: Fronts ---
      drawFronts(ctx, w, h, dpr);

      // --- Layer 5: Cloud puffs ---
      if (moistureVal > 0.05) {
        const low = centres[0];
        const lowPx = getCentreX(low) * w;
        const lowPy = low.baseY * h;
        const cloudAlpha = moistureVal * (0.3 + 0.7 * heating);
        const visibleN = Math.floor(CLOUD_N * Math.min(1, moistureVal * 1.6));
        for (let i = 0; i < visibleN; i++) {
          const c = cloudPuffs[i];
          const cx = lowPx + c.offX * w;
          const cy = lowPy + c.offY * h;
          if (cx < -20 || cx > w + 20 || cy < -20 || cy > h + 20) continue;
          ctx.beginPath();
          ctx.ellipse(cx, cy, c.rx * w, c.ry * h, 0, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(220,220,235,${(c.alpha * cloudAlpha).toFixed(3)})`;
          ctx.fill();
        }
      }

      // --- Layer 5b: Orographic clouds ---
      if (terrainType !== 'none' && moistureVal > 0.05) {
        for (const oc of orogCandidates) {
          const th = terrainAt(oc.x, oc.y);
          if (th < 0.08 || th > 0.65) continue;
          const rw = rawWindAt(oc.x, oc.y);
          const tg = terrainGrad(oc.x, oc.y);
          // Dot product: positive = windward
          const dot = rw.x * tg.x + rw.y * tg.y;
          if (dot <= 0) continue;
          const dotMag = Math.min(1, dot * 2);
          const a = oc.alpha * moistureVal * th * dotMag;
          if (a < 0.005) continue;
          const cx = oc.x * w;
          const cy = oc.y * h;
          ctx.beginPath();
          ctx.ellipse(cx, cy, oc.rx * w, oc.ry * h, 0, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(220,220,235,${a.toFixed(3)})`;
          ctx.fill();
        }
      }

      // --- Layer 6: Wind particles ---
      ctx.lineCap = 'round';
      const TRAIL = 0.025;
      for (const p of particles) {
        const lifeFrac = p.age / p.maxAge;
        let alpha = 1;
        if (lifeFrac < 0.1) alpha = lifeFrac / 0.1;
        else if (lifeFrac > 0.8) alpha = (1 - lifeFrac) / 0.2;
        alpha = Math.max(0, Math.min(1, alpha));
        if (alpha < 0.01) continue;

        const mag = Math.sqrt(p.wx * p.wx + p.wy * p.wy);
        const spd = Math.min(1, mag * 0.8);

        // Streak tail: backward along wind direction
        const tailLen = TRAIL * Math.min(1, mag * 2);
        const nx = mag > 0.001 ? p.wx / mag : 0;
        const ny = mag > 0.001 ? p.wy / mag : 0;

        const px = p.x * w;
        const py = p.y * h;
        const tx = (p.x - nx * tailLen) * w;
        const ty = (p.y - ny * tailLen) * h;

        const bright = 140 + Math.round(115 * spd);
        ctx.strokeStyle = `rgba(${bright},${bright},${Math.min(255, bright + 30)},${((0.25 + 0.45 * spd) * alpha).toFixed(3)})`;
        ctx.lineWidth = (0.8 + 1.5 * spd) * dpr;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(tx, ty);
        ctx.stroke();
      }

      // --- Layer 7: Rain streaks ---
      if (moistureVal > 0.5) {
        const low = centres[0];
        const lowNx = getCentreX(low);
        const lowNy = low.baseY;
        const rainAlpha = (moistureVal - 0.5) * 2;
        ctx.lineWidth = 1 * dpr;
        ctx.strokeStyle = `rgba(180,200,240,${(rainAlpha * 0.35).toFixed(2)})`;
        for (const r of rainDrops) {
          const rx = (lowNx + r.offX) * w;
          const baseY = (lowNy + r.offY) * h;
          const yOff = ((time * r.speed + r.phase) % 1) * 12 * dpr;
          ctx.beginPath();
          ctx.moveTo(rx, baseY + yOff);
          ctx.lineTo(rx + 0.3 * dpr, baseY + yOff + 6 * dpr);
          ctx.stroke();
        }
      }

      // --- Layer 7b: Orographic rain ---
      if (terrainType !== 'none' && moistureVal > 0.3) {
        const oRainAlpha = (moistureVal - 0.3) * 1.4;
        ctx.lineWidth = 1 * dpr;
        for (const oc of orogCandidates) {
          const th = terrainAt(oc.x, oc.y);
          if (th < 0.08 || th > 0.65) continue;
          const rw = rawWindAt(oc.x, oc.y);
          const tg = terrainGrad(oc.x, oc.y);
          const dot = rw.x * tg.x + rw.y * tg.y;
          if (dot <= 0) continue;
          const dotMag = Math.min(1, dot * 2);
          const a = oRainAlpha * th * dotMag * 0.35;
          if (a < 0.01) continue;
          ctx.strokeStyle = `rgba(180,200,240,${a.toFixed(3)})`;
          const rx = oc.x * w;
          const baseY = oc.y * h;
          const yOff = ((time * oc.speed + oc.phase) % 1) * 12 * dpr;
          ctx.beginPath();
          ctx.moveTo(rx, baseY + yOff);
          ctx.lineTo(rx + 0.3 * dpr, baseY + yOff + 6 * dpr);
          ctx.stroke();
        }
      }

      // --- Layer 8: H/L labels ---
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const c of centres) {
        const cx = getCentreX(c) * w;
        const cy = c.baseY * h;
        ctx.font = `bold ${16 * dpr}px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif`;
        if (c.type === 'L') {
          ctx.fillStyle = 'rgba(220,60,60,0.7)';
          ctx.fillText('L', cx, cy);
        } else {
          ctx.fillStyle = 'rgba(60,120,220,0.7)';
          ctx.fillText('H', cx, cy);
        }
      }
    }

    // --- Animation loop ---
    let animId = 0;
    let lastTime = 0;

    function frame(now) {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      time  += dt;
      drift += dt * speed * 0.04;
      if (speed > 0.01) fieldDirty = true;

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
