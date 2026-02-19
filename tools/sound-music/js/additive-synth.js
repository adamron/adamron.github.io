/**
 * additive-synth demo
 * Harmonic sliders building a complex tone. Top: composite waveform.
 * Middle: draggable harmonic amplitude bars. Bottom: real FFT spectrum.
 * Click waveform to toggle audio. Uses AnalyserNode for live spectrum.
 */
registerDemo("additive-synth", {
  init(container) {
    const canvas = document.createElement("canvas");
    container.appendChild(canvas);

    const NUM_H = 16;
    const amps = new Float32Array(NUM_H);
    amps[0] = 1.0;

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
    let analyser = null;
    let freqData = null;

    function startAudio() {
      if (oscNodes.length) return;
      if (!audioCtx)
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.8;
      freqData = new Float32Array(analyser.frequencyBinCount);

      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0;
      masterGain.connect(analyser);
      analyser.connect(audioCtx.destination);

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
      const an = analyser;
      setTimeout(() => {
        nodes.forEach((o) => { o.stop(); o.disconnect(); });
        gNodes.forEach((g) => g.disconnect());
        mg.disconnect();
        an.disconnect();
      }, 200);
      oscNodes = [];
      gainNodes = [];
      masterGain = null;
      analyser = null;
      freqData = null;
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

    // --- Layout ---
    function getLayout() {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width;
      const h = canvas.height;

      const padX = 24 * dpr;
      const padY = 14 * dpr;
      const headerH = 26 * dpr;
      const gapH = 8 * dpr;

      const innerH = h - padY * 2 - headerH - gapH * 2;
      const waveH = Math.floor(innerH * 0.30);
      const barH = Math.floor(innerH * 0.40);
      const specH = innerH - waveH - barH;

      const waveTop = padY + headerH;
      const barTop = waveTop + waveH + gapH;
      const specTop = barTop + barH + gapH;
      const drawW = w - padX * 2;
      const barGap = 4 * dpr;
      const barW = (drawW - barGap * (NUM_H - 1)) / NUM_H;

      return {
        dpr, w, h, padX, padY, headerH, drawW,
        waveTop, waveH, barTop, barH, specTop, specH,
        barGap, barW,
      };
    }

    // --- Bar interaction ---
    let dragIndex = -1;
    let layoutCache = null;

    function hitBar(e) {
      const L = layoutCache || getLayout();
      const rect = canvas.getBoundingClientRect();
      const px = (e.clientX - rect.left) * L.dpr;
      const py = (e.clientY - rect.top) * L.dpr;

      if (py < L.barTop || py > L.barTop + L.barH) return -1;
      for (let i = 0; i < NUM_H; i++) {
        const bx = L.padX + i * (L.barW + L.barGap);
        if (px >= bx && px <= bx + L.barW) return i;
      }
      return -1;
    }

    function setAmpFromPointer(e, idx) {
      const L = layoutCache || getLayout();
      const rect = canvas.getBoundingClientRect();
      const py = (e.clientY - rect.top) * L.dpr;

      const labelPad = 14 * L.dpr;
      const usableTop = L.barTop;
      const usableBot = L.barTop + L.barH - labelPad;
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
        // Click in waveform/spectrum area toggles audio
        const L = layoutCache || getLayout();
        const rect = canvas.getBoundingClientRect();
        const py = (e.clientY - rect.top) * L.dpr;
        if (py < L.barTop || py >= L.barTop + L.barH) {
          if (playing) { playing = false; stopAudio(); }
          else { playing = true; startAudio(); }
        }
      }
    });

    canvas.addEventListener("pointermove", (e) => {
      if (dragIndex >= 0) {
        setAmpFromPointer(e, dragIndex);
      } else {
        const idx = hitBar(e);
        const L = layoutCache || getLayout();
        const rect = canvas.getBoundingClientRect();
        const py = (e.clientY - rect.top) * L.dpr;
        if (idx >= 0) {
          canvas.style.cursor = "ns-resize";
        } else if (py < L.barTop || py >= L.barTop + L.barH) {
          canvas.style.cursor = "pointer";
        } else {
          canvas.style.cursor = "default";
        }
      }
    });

    canvas.addEventListener("pointerup", () => { dragIndex = -1; });
    canvas.addEventListener("pointercancel", () => { dragIndex = -1; });
    canvas.style.touchAction = "none";

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
      layoutCache = L;
      const { dpr, w, h, padX, padY, drawW,
        waveTop, waveH, barTop, barH, specTop, specH,
        barGap, barW } = L;

      ctx.clearRect(0, 0, w, h);

      const font = (sz, weight) =>
        `${weight || ""} ${sz * dpr}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.trim();

      // --- Header ---
      ctx.font = font(13, "600");
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = playing ? "rgba(200,175,230,0.9)" : "rgba(200,175,230,0.6)";
      ctx.fillText(fundamental + " Hz fundamental", padX, padY);

      ctx.textAlign = "right";
      ctx.font = font(9);
      ctx.fillStyle = playing ? "rgba(200,175,230,0.5)" : "rgba(255,255,255,0.15)";
      ctx.fillText(
        playing ? "\u25A0 click wave to stop" : "\u25B6 click wave to play",
        w - padX, padY + 2 * dpr,
      );

      // --- Waveform ---
      const waveCenterY = waveTop + waveH / 2;

      ctx.font = font(7.5);
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText("waveform", padX, waveTop - 2 * dpr);

      // Equilibrium
      ctx.setLineDash([3 * dpr, 4 * dpr]);
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
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
      const waveAmp = (waveH / 2 - 3 * dpr) / peak;

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
      ctx.font = font(7.5);
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText("harmonics \u2014 drag to adjust", padX, barTop - 2 * dpr);

      const labelPad = 14 * dpr;
      const maxBarH = barH - labelPad;

      for (let i = 0; i < NUM_H; i++) {
        const bx = padX + i * (barW + barGap);
        const bh = amps[i] * maxBarH;
        const by = barTop + maxBarH - bh;

        const active = amps[i] > 0.01;
        const alpha = active ? 0.4 + 0.5 * amps[i] : 0.08;
        ctx.fillStyle = `rgba(140,100,180,${alpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.roundRect(bx, by, barW, bh, 2 * dpr);
        ctx.fill();

        // Ghost outline
        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        ctx.roundRect(bx, barTop, barW, maxBarH, 2 * dpr);
        ctx.stroke();

        // Harmonic number
        ctx.font = font(7);
        ctx.fillStyle = active ? "rgba(200,175,230,0.6)" : "rgba(255,255,255,0.12)";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(
          (i + 1).toString(),
          bx + barW / 2,
          barTop + maxBarH + 2 * dpr,
        );
      }

      // --- Spectrum (from FFT when playing, from amps when not) ---
      ctx.font = font(7.5);
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText("spectrum", padX, specTop - 2 * dpr);

      const specMaxFreq = fundamental * (NUM_H + 2);
      const specBot = specTop + specH;

      // Equilibrium
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.moveTo(padX, specBot);
      ctx.lineTo(padX + drawW, specBot);
      ctx.stroke();

      if (analyser && freqData) {
        // Live FFT spectrum
        analyser.getFloatFrequencyData(freqData);
        const binFreqW = audioCtx.sampleRate / analyser.fftSize;
        const maxBin = Math.min(freqData.length, Math.ceil(specMaxFreq / binFreqW));

        ctx.beginPath();
        ctx.moveTo(padX, specBot);
        for (let b = 0; b < maxBin; b++) {
          const freq = b * binFreqW;
          const x = padX + (freq / specMaxFreq) * drawW;
          const db = freqData[b];
          const intensity = Math.max(0, Math.min(1, (db + 80) / 60));
          const y = specBot - intensity * specH;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(padX + drawW, specBot);
        ctx.closePath();
        ctx.fillStyle = "rgba(140,100,180,0.25)";
        ctx.fill();

        ctx.beginPath();
        for (let b = 0; b < maxBin; b++) {
          const freq = b * binFreqW;
          const x = padX + (freq / specMaxFreq) * drawW;
          const db = freqData[b];
          const intensity = Math.max(0, Math.min(1, (db + 80) / 60));
          const y = specBot - intensity * specH;
          if (b === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "rgba(140,100,180,0.7)";
        ctx.lineWidth = 1.5 * dpr;
        ctx.stroke();
      } else {
        // Static spectrum from amps
        for (let i = 0; i < NUM_H; i++) {
          if (amps[i] < 0.01) continue;
          const freq = fundamental * (i + 1);
          const x = padX + (freq / specMaxFreq) * drawW;
          const barH2 = amps[i] * specH * 0.85;
          ctx.fillStyle = `rgba(140,100,180,${(0.3 + 0.5 * amps[i]).toFixed(2)})`;
          ctx.fillRect(x - 2 * dpr, specBot - barH2, 4 * dpr, barH2);
        }
      }

      // Frequency axis labels
      ctx.font = font(6.5);
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      const freqTicks = [fundamental, fundamental * 4, fundamental * 8, fundamental * 12, fundamental * 16];
      for (const f of freqTicks) {
        if (f > specMaxFreq) continue;
        const x = padX + (f / specMaxFreq) * drawW;
        const label = f >= 1000 ? (f / 1000).toFixed(1) + "k" : Math.round(f) + "";
        ctx.fillText(label, x, specBot + 2 * dpr);
      }

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
