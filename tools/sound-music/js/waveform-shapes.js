/**
 * waveform-shapes demo
 * Shows sine, square, triangle, and sawtooth waveforms in a 2x2 grid.
 * Click any quadrant to toggle its audio on/off. Multiple can play
 * simultaneously for comparison.
 */
registerDemo("waveform-shapes", {
  init(container) {
    const canvas = document.createElement("canvas");
    container.appendChild(canvas);

    const TYPES = ["sine", "square", "triangle", "sawtooth"];
    const LABELS = ["Sine", "Square", "Triangle", "Sawtooth"];
    const BASE_FREQ = 220;
    const ACCENT = [140, 100, 180];

    // Which waveforms are currently playing
    const active = [false, false, false, false];

    // --- Web Audio ---
    let audioCtx = null;
    const oscs = [null, null, null, null];
    const gains = [null, null, null, null];

    function toggleWaveform(index) {
      if (!audioCtx)
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      if (active[index]) {
        // Stop
        active[index] = false;
        if (gains[index]) {
          const g = gains[index];
          const o = oscs[index];
          g.gain.setTargetAtTime(0, audioCtx.currentTime, 0.04);
          setTimeout(() => {
            o.stop();
            o.disconnect();
            g.disconnect();
          }, 200);
          oscs[index] = null;
          gains[index] = null;
        }
      } else {
        // Start
        active[index] = true;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = TYPES[index];
        osc.frequency.value = BASE_FREQ;
        gain.gain.value = 0;
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        gain.gain.setTargetAtTime(0.12, audioCtx.currentTime, 0.03);
        oscs[index] = osc;
        gains[index] = gain;
      }
    }

    function stopAll() {
      for (let i = 0; i < 4; i++) {
        if (active[i]) toggleWaveform(i);
      }
    }

    // --- Waveform math (generate one cycle, 0..1 -> -1..1) ---
    function waveValue(type, t) {
      const p = t % 1;
      switch (type) {
        case "sine":
          return Math.sin(p * Math.PI * 2);
        case "square":
          return p < 0.5 ? 1 : -1;
        case "triangle":
          return p < 0.25
            ? p * 4
            : p < 0.75
              ? 2 - p * 4
              : p * 4 - 4;
        case "sawtooth":
          return 2 * p - 1;
        default:
          return 0;
      }
    }

    // --- Hit detection ---
    function quadrantAt(e) {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const col = x < 0.5 ? 0 : 1;
      const row = y < 0.5 ? 0 : 1;
      return row * 2 + col;
    }

    canvas.addEventListener("pointerdown", (e) => {
      const idx = quadrantAt(e);
      toggleWaveform(idx);
    });

    canvas.addEventListener("pointermove", (e) => {
      canvas.style.cursor = "pointer";
    });

    canvas.style.touchAction = "none";
    canvas.style.cursor = "pointer";

    // --- Rendering ---
    let phase = 0;

    function resize() {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }

    function draw() {
      const ctx = canvas.getContext("2d");
      const w = canvas.width;
      const h = canvas.height;
      const dpr = window.devicePixelRatio || 1;

      ctx.clearRect(0, 0, w, h);

      const cellW = w / 2;
      const cellH = h / 2;
      const padX = 20 * dpr;
      const padY = 24 * dpr;
      const wavePadTop = 32 * dpr;

      // Grid lines
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.moveTo(cellW, 0);
      ctx.lineTo(cellW, h);
      ctx.moveTo(0, cellH);
      ctx.lineTo(w, cellH);
      ctx.stroke();

      for (let i = 0; i < 4; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const ox = col * cellW;
        const oy = row * cellH;
        const isActive = active[i];

        const waveL = ox + padX;
        const waveR = ox + cellW - padX;
        const waveW = waveR - waveL;
        const waveT = oy + wavePadTop;
        const waveB = oy + cellH - padY;
        const waveH = waveB - waveT;
        const centerY = waveT + waveH / 2;
        const amp = waveH / 2 - 2 * dpr;

        // Background highlight when active
        if (isActive) {
          ctx.fillStyle = "rgba(140,100,180,0.06)";
          ctx.fillRect(ox, oy, cellW, cellH);
        }

        // Label
        ctx.font = `${12 * dpr}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillStyle = isActive
          ? "rgba(200,175,230,0.9)"
          : "rgba(255,255,255,0.4)";
        ctx.fillText(LABELS[i], ox + padX, oy + 10 * dpr);

        // Play indicator
        ctx.textAlign = "right";
        ctx.fillStyle = isActive
          ? "rgba(200,175,230,0.7)"
          : "rgba(255,255,255,0.15)";
        ctx.font = `${10 * dpr}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        ctx.fillText(
          isActive ? "\u25A0 stop" : "\u25B6 play",
          ox + cellW - padX,
          oy + 11 * dpr,
        );

        // Equilibrium line
        ctx.setLineDash([2 * dpr, 3 * dpr]);
        ctx.strokeStyle = "rgba(255,255,255,0.07)";
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        ctx.moveTo(waveL, centerY);
        ctx.lineTo(waveR, centerY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw waveform (2 cycles)
        const cycles = 2;
        const samples = 200;
        ctx.beginPath();
        for (let s = 0; s <= samples; s++) {
          const t = s / samples;
          const v = waveValue(TYPES[i], t * cycles + (isActive ? phase : 0));
          const x = waveL + t * waveW;
          const y = centerY - v * amp;
          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        const alpha = isActive ? 1.0 : 0.35;
        ctx.strokeStyle = `rgba(${ACCENT[0]},${ACCENT[1]},${ACCENT[2]},${alpha})`;
        ctx.lineWidth = 2 * dpr;
        ctx.stroke();
      }

      // Advance phase for active waveforms
      const anyActive = active.some(Boolean);
      if (anyActive) {
        phase += 0.012;
      }
    }

    // --- Animation loop ---
    let animId = 0;

    function frame() {
      draw();
      animId = requestAnimationFrame(frame);
    }

    function start() {
      if (!animId) animId = requestAnimationFrame(frame);
    }

    function stop() {
      if (animId) {
        cancelAnimationFrame(animId);
        animId = 0;
      }
      stopAll();
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) start();
        else stop();
      },
      { threshold: 0 },
    );
    observer.observe(container);

    window.addEventListener("resize", resize);
    resize();
    start();
  },
});
