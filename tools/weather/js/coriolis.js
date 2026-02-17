/**
 * coriolis demo (split: left = inertial frame, right = rotating frame)
 * A ball travels in a straight line across a rotating disc. In the inertial
 * frame (left) the path is straight and the disc spins underneath. In the
 * rotating frame (right) the disc is stationary but the path curves to the
 * right — the Coriolis deflection.
 */
(function () {
  let leftCanvas = null, rightCanvas = null;
  let wrap = null;

  // --- Sliders ---
  let rotation = 0.5;   // 0-1
  let latitude = 45;    // degrees

  // --- Physics ---
  const START_Y = 0.82;
  const SPEED = 0.25;
  const BASE_OMEGA = 2.0;

  // --- Animation timing ---
  const TRANSIT = 2.8;
  const HOLD = 0.7;
  const FADE = 0.35;
  const FADE_IN = 0.25;
  const GAP = 0.2;
  const PERIOD = TRANSIT + HOLD + FADE + GAP;

  let time = 0;
  let animId = 0;
  let lastTime = 0;

  // --- Disc reference markers (golden-angle spiral) ---
  const MARKERS = [];
  for (let i = 0; i < 28; i++) {
    const a = i * 2.399963;
    const rad = 0.18 + 0.62 * Math.sqrt((i + 0.5) / 28);
    MARKERS.push({ x: Math.cos(a) * rad, y: Math.sin(a) * rad });
  }

  // --- Trail precomputation ---
  const TRAIL_N = 250;
  let inertialTrail = [];
  let rotatingTrail = [];

  function getOmega() {
    return rotation * BASE_OMEGA * Math.sin(latitude * Math.PI / 180);
  }

  function computeTrails() {
    inertialTrail = [];
    rotatingTrail = [];
    const omega = getOmega();
    for (let i = 0; i <= TRAIL_N; i++) {
      const t = (i / TRAIL_N) * TRANSIT;
      const ix = 0;
      const iy = START_Y - SPEED * t;
      inertialTrail.push({ x: ix, y: iy });

      const angle = omega * t;
      rotatingTrail.push({
        x: ix * Math.cos(angle) + iy * Math.sin(angle),
        y: -ix * Math.sin(angle) + iy * Math.cos(angle),
      });
    }
  }

  // --- Slider setup (called once) ---
  let slidersReady = false;
  function setupSliders() {
    if (slidersReady || !wrap) return;
    slidersReady = true;

    const rotSlider = wrap.querySelector('[data-control="rotation"]');
    const latSlider = wrap.querySelector('[data-control="latitude"]');

    const onChange = () => {
      if (rotSlider) rotation = parseInt(rotSlider.value, 10) / 100;
      if (latSlider) latitude = parseInt(latSlider.value, 10);
      computeTrails();
      time = 0; // restart cycle
    };

    if (rotSlider) { rotation = parseInt(rotSlider.value, 10) / 100; rotSlider.addEventListener('input', onChange); }
    if (latSlider) { latitude = parseInt(latSlider.value, 10); latSlider.addEventListener('input', onChange); }
  }

  // --- Drawing ---
  function drawPanel(canvas, trail, discAngle, alpha, label, showRef) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    if (w === 0 || h === 0) return;
    const dpr = window.devicePixelRatio || 1;

    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) * 0.40;

    const toP = (dx, dy) => ({ x: cx + dx * r, y: cy - dy * r });

    ctx.clearRect(0, 0, w, h);

    // --- Disc ---
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1.5 * dpr;
    ctx.stroke();

    // Concentric circles
    ctx.strokeStyle = 'rgba(255,255,255,0.045)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, r * i / 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Radial lines (rotate with disc)
    ctx.strokeStyle = 'rgba(255,255,255,0.045)';
    for (let i = 0; i < 8; i++) {
      const a = discAngle + i * Math.PI / 4;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * r, cy - Math.sin(a) * r);
      ctx.stroke();
    }

    // Reference dots (rotate with disc)
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    for (const m of MARKERS) {
      const rx = m.x * Math.cos(discAngle) - m.y * Math.sin(discAngle);
      const ry = m.x * Math.sin(discAngle) + m.y * Math.cos(discAngle);
      const p = toP(rx, ry);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.6 * dpr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Center dot (pole)
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5 * dpr, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fill();

    // --- Straight reference line (rotating frame only) ---
    if (showRef && alpha > 0) {
      ctx.globalAlpha = alpha * 0.25;
      const endY = START_Y - SPEED * TRANSIT;
      const sp = toP(0, START_Y);
      const ep = toP(0, endY);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1 * dpr;
      ctx.setLineDash([3 * dpr, 4 * dpr]);
      ctx.beginPath();
      ctx.moveTo(sp.x, sp.y);
      ctx.lineTo(ep.x, ep.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    // --- Trail ---
    const phase = time % PERIOD;
    const trailFrac = Math.min(1, phase / TRANSIT);
    const numPts = Math.floor(trailFrac * TRAIL_N);

    if (numPts > 1 && alpha > 0) {
      ctx.globalAlpha = alpha;

      // Trail line with gradient fade (older = dimmer)
      for (let i = 1; i <= numPts; i++) {
        const age = 1 - (i / numPts); // 0=newest, 1=oldest
        const segAlpha = 0.2 + 0.7 * (1 - age * age);
        const a = toP(trail[i - 1].x, trail[i - 1].y);
        const b = toP(trail[i].x, trail[i].y);

        ctx.strokeStyle = `rgba(255,190,70,${segAlpha * alpha})`;
        ctx.lineWidth = (1.5 + 1.5 * (1 - age)) * dpr;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // Head dot
      const hp = toP(trail[numPts].x, trail[numPts].y);
      // Glow
      ctx.beginPath();
      ctx.arc(hp.x, hp.y, 7 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,200,80,${0.2 * alpha})`;
      ctx.fill();
      // Dot
      ctx.beginPath();
      ctx.arc(hp.x, hp.y, 3.5 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,220,100,${0.9 * alpha})`;
      ctx.fill();

      ctx.globalAlpha = 1;
    }

    // --- Panel label ---
    ctx.globalAlpha = 0.35;
    ctx.font = `${10 * dpr}px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif`;
    ctx.fillStyle = '#bbb';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(label, cx, 8 * dpr);
    ctx.globalAlpha = 1;
  }

  // --- Animation loop ---
  function frame(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    time += dt;

    const phase = time % PERIOD;
    const omega = getOmega();
    const discAngle = omega * Math.min(phase, TRANSIT);

    // Content alpha
    let alpha = 1;
    if (phase < FADE_IN) alpha = phase / FADE_IN;
    else if (phase > TRANSIT + HOLD) alpha = Math.max(0, 1 - (phase - TRANSIT - HOLD) / FADE);

    drawPanel(leftCanvas, inertialTrail, discAngle, alpha, 'Inertial frame', false);
    drawPanel(rightCanvas, rotatingTrail, 0, alpha, 'Rotating frame', true);

    animId = requestAnimationFrame(frame);
  }

  function start() {
    if (!animId && leftCanvas && rightCanvas) {
      lastTime = performance.now();
      animId = requestAnimationFrame(frame);
    }
  }

  function stop() {
    if (animId) { cancelAnimationFrame(animId); animId = 0; }
  }

  // --- Init each panel ---
  function initPanel(container, side) {
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    if (side === 'left') leftCanvas = canvas; else rightCanvas = canvas;

    if (!wrap) {
      wrap = container.closest('.demo-container');
      setupSliders();
      computeTrails();
    }

    function resize() {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }
    window.addEventListener('resize', resize);
    resize();

    // Once both canvases exist, start
    if (leftCanvas && rightCanvas) {
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) start(); else stop();
      }, { threshold: 0 });
      observer.observe(wrap);
      start();
    }
  }

  registerDemo('coriolis-straight', {
    init(container) { initPanel(container, 'left'); }
  });
  registerDemo('coriolis-deflected', {
    init(container) { initPanel(container, 'right'); }
  });
})();
