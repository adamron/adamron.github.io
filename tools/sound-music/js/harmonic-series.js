/**
 * harmonic-series demo
 * Interactive harmonic spectrum: drag bars to set the amplitude of each
 * harmonic (1–16). The composite waveform updates in real time above.
 * Click canvas to toggle audio (additive synthesis).
 */
registerDemo("harmonic-series", {
  init(container) {
    const canvas = document.createElement("canvas");
    container.appendChild(canvas);

    const NUM_H = 16;
    const amps = new Float32Array(NUM_H);
    amps[0] = 1.0; // start with just the fundamental

    let fundamental = 220;
    let playing = false;
    let phase = 0;

    const wrap = container.closest(".demo-container");
    const fundSlider = wrap.querySelector('[data-control="fundamental"]');
    if (fundSlider) {
      fundamental = parseInt(fundSlider.value, 10);
      fundSlider.addEventListener("input", () => {
        fundamental = parseInt(fundSlider.value, 10);
        if (playing) updateOscFreqs();
      });
    }

    // --- Web Audio ---
    let audioCtx = null;
    let oscNodes = [];
    let gainNodes = [];
    let masterGain = null;

    function startAudio() {
      if (oscNodes.length) return;
      if (!audioCtx)
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0;
      masterGain.connect(audioCtx.destination);
      for (let i = 0; i < NUM_H; i++) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.value = fundamental * (i + 1);
        gain.gain.value = Math.abs(amps[i]);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start();
        oscNodes.push(osc);
        gainNodes.push(gain);
      }
      masterGain.gain.setTargetAtTime(0.15, audioCtx.currentTime, 0.03);
    }

    function stopAudio() {
      if (!oscNodes.length) return;
      masterGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.04);
      const nodes = oscNodes.slice();
      const gNodes = gainNodes.slice();
      const mg = masterGain;
      setTimeout(() => {
        nodes.forEach((o) => { o.stop(); o.disconnect(); });
        gNodes.forEach((g) => g.disconnect());
        mg.disconnect();
      }, 200);
      oscNodes = [];
      gainNodes = [];
      masterGain = null;
    }

    function syncGain(i) {
      if (gainNodes[i]) {
        gainNodes[i].gain.setTargetAtTime(Math.abs(amps[i]), audioCtx.currentTime, 0.015);
      }
    }

    function updateOscFreqs() {
      for (let i = 0; i < oscNodes.length; i++) {
        oscNodes[i].frequency.setTargetAtTime(
          fundamental * (i + 1), audioCtx.currentTime, 0.01,
        );
      }
    }

    // --- Layout helpers (recomputed on draw) ---
    let layoutCache = null;

    function getLayout() {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width;
      const h = canvas.height;

      const padX = 24 * dpr;
      const padY = 16 * dpr;
      const headerH = 28 * dpr;
      const gapH = 12 * dpr;
      const waveH = Math.floor((h - padY * 2 - headerH - gapH) * 0.35);
      const barAreaTop = padY + headerH + waveH + gapH;
      const barAreaH = h - padY - barAreaTop;
      const drawW = w - padX * 2;
      const barGap = 4 * dpr;
      const barW = (drawW - barGap * (NUM_H - 1)) / NUM_H;

      layoutCache = {
        dpr, w, h, padX, padY, headerH, waveH, barAreaTop, barAreaH,
        drawW, barGap, barW, gapH,
        waveTop: padY + headerH,
      };
      return layoutCache;
    }

    // --- Pointer interaction: drag bars to set amplitude ---
    let dragIndex = -1;

    function hitBar(e) {
      const L = layoutCache || getLayout();
      const rect = canvas.getBoundingClientRect();
      const dpr = L.dpr;
      const px = (e.clientX - rect.left) * dpr;
      const py = (e.clientY - rect.top) * dpr;

      // Check if in bar area
      if (py < L.barAreaTop || py > L.barAreaTop + L.barAreaH) return -1;

      for (let i = 0; i < NUM_H; i++) {
        const bx = L.padX + i * (L.barW + L.barGap);
        if (px >= bx && px <= bx + L.barW) return i;
      }
      return -1;
    }

    function setAmpFromPointer(e, idx) {
      const L = layoutCache || getLayout();
      const rect = canvas.getBoundingClientRect();
      const dpr = L.dpr;
      const py = (e.clientY - rect.top) * dpr;

      // Map vertical position within bar area to amplitude 0..1
      // Top of bar area = 1, bottom = 0
      const labelPad = 14 * dpr;
      const usableTop = L.barAreaTop;
      const usableBot = L.barAreaTop + L.barAreaH - labelPad;
      const t = 1 - Math.max(0, Math.min(1, (py - usableTop) / (usableBot - usableTop)));
      amps[idx] = t;
      if (playing) syncGain(idx);
    }

    canvas.addEventListener("pointerdown", (e) => {
      canvas.setPointerCapture(e.pointerId);
      const idx = hitBar(e);
      if (idx >= 0) {
        dragIndex = idx;
        setAmpFromPointer(e, idx);
      } else {
        // Click in waveform area toggles audio
        const L = layoutCache || getLayout();
        const rect = canvas.getBoundingClientRect();
        const py = (e.clientY - rect.top) * L.dpr;
        if (py < L.barAreaTop) {
          if (playing) { playing = false; stopAudio(); }
          else { playing = true; startAudio(); }
        }
      }
    });

    canvas.addEventListener("pointermove", (e) => {
      if (dragIndex >= 0) {
        setAmpFromPointer(e, dragIndex);
      } else {
        // Cursor hint
        const idx = hitBar(e);
        const L = layoutCache || getLayout();
        const rect = canvas.getBoundingClientRect();
        const py = (e.clientY - rect.top) * L.dpr;
        if (idx >= 0) {
          canvas.style.cursor = "ns-resize";
        } else if (py < L.barAreaTop) {
          canvas.style.cursor = "pointer";
        } else {
          canvas.style.cursor = "default";
        }
      }
    });

    canvas.addEventListener("pointerup", () => { dragIndex = -1; });
    canvas.addEventListener("pointercancel", () => { dragIndex = -1; });
    canvas.style.touchAction = "none";

    // --- Preset buttons via double-click to cycle presets ---
    // (keeping it simple — no extra HTML)

    // --- Rendering ---
    function resize() {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      layoutCache = null;
    }

    function draw() {
      const ctx = canvas.getContext("2d");
      const L = getLayout();
      const { dpr, w, h, padX, padY, drawW, waveTop, waveH,
        barAreaTop, barAreaH, barGap, barW } = L;

      ctx.clearRect(0, 0, w, h);

      const font = (size) =>
        `${size * dpr}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;

      // --- Header ---
      ctx.font = `600 ${15 * dpr}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = playing ? "rgba(200,175,230,0.9)" : "rgba(200,175,230,0.6)";
      ctx.fillText(fundamental + " Hz fundamental", padX, padY);

      ctx.textAlign = "right";
      ctx.font = font(10);
      ctx.fillStyle = playing ? "rgba(200,175,230,0.5)" : "rgba(255,255,255,0.15)";
      ctx.fillText(
        playing ? "\u25A0 click wave to stop" : "\u25B6 click wave to play",
        w - padX, padY + 2 * dpr,
      );

      // --- Waveform ---
      const waveCenterY = waveTop + waveH / 2;

      // Equilibrium
      ctx.setLineDash([3 * dpr, 4 * dpr]);
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.moveTo(padX, waveCenterY);
      ctx.lineTo(padX + drawW, waveCenterY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Composite wave
      const samples = 400;
      const cycles = 3;
      let peak = 0;
      for (let s = 0; s <= samples; s++) {
        const t = s / samples;
        let v = 0;
        for (let i = 0; i < NUM_H; i++)
          v += amps[i] * Math.sin((i + 1) * t * cycles * Math.PI * 2);
        if (Math.abs(v) > peak) peak = Math.abs(v);
      }
      if (peak < 0.001) peak = 1;
      const waveAmp = (waveH / 2 - 4 * dpr) / peak;

      ctx.beginPath();
      for (let s = 0; s <= samples; s++) {
        const t = s / samples;
        let v = 0;
        for (let i = 0; i < NUM_H; i++)
          v += amps[i] * Math.sin(
            (i + 1) * t * cycles * Math.PI * 2 + (playing ? phase * (i + 1) : 0),
          );
        const x = padX + t * drawW;
        const y = waveCenterY - v * waveAmp;
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = playing ? "rgba(140,100,180,0.9)" : "rgba(140,100,180,0.4)";
      ctx.lineWidth = 2 * dpr;
      ctx.stroke();

      // --- Harmonic bars ---
      const labelPad = 14 * dpr;
      const maxBarH = barAreaH - labelPad;

      for (let i = 0; i < NUM_H; i++) {
        const bx = padX + i * (barW + barGap);
        const bh = amps[i] * maxBarH;
        const by = barAreaTop + maxBarH - bh;

        // Bar
        const active = amps[i] > 0.01;
        const alpha = active ? 0.4 + 0.5 * amps[i] : 0.08;
        ctx.fillStyle = `rgba(140,100,180,${alpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.roundRect(bx, by, barW, bh, 2 * dpr);
        ctx.fill();

        // Ghost outline for full bar height (drag target hint)
        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        ctx.roundRect(bx, barAreaTop, barW, maxBarH, 2 * dpr);
        ctx.stroke();

        // Harmonic number label
        ctx.font = font(8);
        ctx.fillStyle = active ? "rgba(200,175,230,0.6)" : "rgba(255,255,255,0.15)";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(
          (i + 1).toString(),
          bx + barW / 2,
          barAreaTop + maxBarH + 3 * dpr,
        );
      }

      // Section label
      ctx.font = font(8);
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText("harmonics — drag to adjust", padX, barAreaTop - 3 * dpr);

      if (playing) phase += 0.04;
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
      if (playing) {
        playing = false;
        stopAudio();
      }
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
