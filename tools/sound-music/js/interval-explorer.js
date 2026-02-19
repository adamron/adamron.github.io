/**
 * interval-explorer demo
 * Two-tone player showing waveform interference and frequency ratio.
 * Slider sweeps ratio from 1:1 (unison) to 2:1 (octave).
 * Consonant intervals (5:4, 4:3, 3:2, etc.) are labelled.
 * Click canvas to toggle audio. Left: waveforms. Right: real FFT spectrogram.
 */
registerDemo("interval-explorer", {
  init(container) {
    const canvas = document.createElement("canvas");
    container.appendChild(canvas);

    const BASE_FREQ = 220;
    const SPECT_MAX_FREQ = BASE_FREQ * 6; // show up to ~6th harmonic region
    let ratio = 1.5;
    let playing = false;
    let phase = 0;

    const wrap = container.closest(".demo-container");
    const ratioSlider = wrap.querySelector('[data-control="ratio"]');
    if (ratioSlider) {
      ratio = parseInt(ratioSlider.value, 10) / 100;
      ratioSlider.addEventListener("input", () => {
        ratio = parseInt(ratioSlider.value, 10) / 100;
        if (oscB) oscB.frequency.setTargetAtTime(BASE_FREQ * ratio, audioCtx.currentTime, 0.01);
      });
    }

    // --- Named intervals (ratio → label) ---
    const INTERVALS = [
      { r: 1.0,    name: "Unison", short: "1:1" },
      { r: 16/15,  name: "Minor 2nd", short: "16:15" },
      { r: 9/8,    name: "Major 2nd", short: "9:8" },
      { r: 6/5,    name: "Minor 3rd", short: "6:5" },
      { r: 5/4,    name: "Major 3rd", short: "5:4" },
      { r: 4/3,    name: "Perfect 4th", short: "4:3" },
      { r: 7/5,    name: "Tritone", short: "7:5" },
      { r: 3/2,    name: "Perfect 5th", short: "3:2" },
      { r: 8/5,    name: "Minor 6th", short: "8:5" },
      { r: 5/3,    name: "Major 6th", short: "5:3" },
      { r: 9/5,    name: "Minor 7th", short: "9:5" },
      { r: 15/8,   name: "Major 7th", short: "15:8" },
      { r: 2.0,    name: "Octave", short: "2:1" },
    ];

    function closestInterval(r) {
      let best = null;
      let bestDist = Infinity;
      for (const iv of INTERVALS) {
        const d = Math.abs(r - iv.r);
        if (d < bestDist) { bestDist = d; best = iv; }
      }
      return bestDist < 0.012 ? best : null;
    }

    // --- Web Audio with AnalyserNode ---
    let audioCtx = null;
    let oscA = null, gainA = null;
    let oscB = null, gainB = null;
    let masterGain = null;
    let analyser = null;
    let freqData = null;

    function startAudio() {
      if (oscA) return;
      if (!audioCtx)
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.7;
      freqData = new Float32Array(analyser.frequencyBinCount);

      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0;
      masterGain.connect(analyser);
      analyser.connect(audioCtx.destination);

      oscA = audioCtx.createOscillator();
      gainA = audioCtx.createGain();
      oscA.type = "sine";
      oscA.frequency.value = BASE_FREQ;
      gainA.gain.value = 0.5;
      oscA.connect(gainA);
      gainA.connect(masterGain);
      oscA.start();

      oscB = audioCtx.createOscillator();
      gainB = audioCtx.createGain();
      oscB.type = "sine";
      oscB.frequency.value = BASE_FREQ * ratio;
      gainB.gain.value = 0.5;
      oscB.connect(gainB);
      gainB.connect(masterGain);
      oscB.start();

      masterGain.gain.setTargetAtTime(0.18, audioCtx.currentTime, 0.03);
    }

    function stopAudio() {
      if (!oscA) return;
      masterGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.04);
      const nodes = [oscA, oscB];
      const gains = [gainA, gainB, masterGain];
      const an = analyser;
      setTimeout(() => {
        nodes.forEach((o) => { o.stop(); o.disconnect(); });
        gains.forEach((g) => g.disconnect());
        an.disconnect();
      }, 200);
      oscA = null; gainA = null;
      oscB = null; gainB = null;
      masterGain = null;
      analyser = null;
      freqData = null;
    }

    // --- Spectrogram (shared utility) ---
    const spect = createSpectrogram();

    // --- Interaction ---
    canvas.addEventListener("pointerdown", () => {
      if (playing) { playing = false; stopAudio(); }
      else { playing = true; startAudio(); }
    });
    canvas.style.touchAction = "none";
    canvas.style.cursor = "pointer";

    // --- Rendering ---
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

      const padX = 24 * dpr;
      const padY = 16 * dpr;
      const headerH = 32 * dpr;
      const gap = 16 * dpr;

      const contentTop = padY + headerH + 8 * dpr;
      const contentBot = h - padY;
      const contentH = contentBot - contentTop;
      const leftW = Math.floor((w - padX * 2 - gap) * 0.55);
      const rightW = w - padX * 2 - gap - leftW;
      const leftX = padX;
      const rightX = padX + leftW + gap;

      const font = (sz, weight) =>
        `${weight || ""} ${sz * dpr}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.trim();

      // --- Header: interval name & ratio ---
      const iv = closestInterval(ratio);

      ctx.font = font(15, "600");
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = playing ? "rgba(200,175,230,0.9)" : "rgba(200,175,230,0.6)";
      ctx.fillText(
        (iv ? iv.name + "  " : "") + (iv ? iv.short : ratio.toFixed(2)),
        padX, padY,
      );

      // Frequencies
      ctx.font = font(10);
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.fillText(
        BASE_FREQ + " Hz + " + Math.round(BASE_FREQ * ratio) + " Hz",
        padX, padY + 18 * dpr,
      );

      // Play state
      ctx.textAlign = "right";
      ctx.font = font(10);
      ctx.fillStyle = playing ? "rgba(200,175,230,0.5)" : "rgba(255,255,255,0.15)";
      ctx.fillText(
        playing ? "\u25A0 click to stop" : "\u25B6 click to play",
        w - padX, padY + 2 * dpr,
      );

      // --- Left: Three waveform rows ---
      ctx.font = font(8);
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText("waveforms", leftX, contentTop - 3 * dpr);

      const rowGap = 6 * dpr;
      const rowH = (contentH - rowGap * 2) / 3;

      const rows = [
        { label: "lower  " + BASE_FREQ + " Hz", freqMul: 1, color: "100,140,220" },
        { label: "upper  " + Math.round(BASE_FREQ * ratio) + " Hz", freqMul: ratio, color: "180,100,200" },
        { label: "combined", freqMul: null, color: "140,100,180" },
      ];

      const visibleTime = 3 / BASE_FREQ;
      const samples = 400;

      for (let ri = 0; ri < rows.length; ri++) {
        const row = rows[ri];
        const ry = contentTop + ri * (rowH + rowGap);
        const centerY = ry + rowH / 2;
        const amp = rowH / 2 - 3 * dpr;

        // Equilibrium line
        ctx.setLineDash([3 * dpr, 4 * dpr]);
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        ctx.moveTo(leftX, centerY);
        ctx.lineTo(leftX + leftW, centerY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Wave
        let peak = 0;
        const vals = [];
        for (let s = 0; s <= samples; s++) {
          const t = s / samples;
          const time = t * visibleTime;
          let v;
          if (row.freqMul !== null) {
            const freq = BASE_FREQ * row.freqMul;
            v = Math.sin(2 * Math.PI * freq * time + (playing ? phase * row.freqMul : 0));
          } else {
            const v1 = Math.sin(2 * Math.PI * BASE_FREQ * time + (playing ? phase : 0));
            const v2 = Math.sin(2 * Math.PI * BASE_FREQ * ratio * time + (playing ? phase * ratio : 0));
            v = (v1 + v2) / 2;
          }
          vals.push(v);
          if (Math.abs(v) > peak) peak = Math.abs(v);
        }
        if (peak < 0.001) peak = 1;
        const scale = amp / peak;

        ctx.beginPath();
        for (let s = 0; s <= samples; s++) {
          const x = leftX + (s / samples) * leftW;
          const y = centerY - vals[s] * scale;
          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        const alpha = playing ? 0.85 : 0.35;
        ctx.strokeStyle = `rgba(${row.color},${alpha})`;
        ctx.lineWidth = 2 * dpr;
        ctx.stroke();

        // Row label
        ctx.font = font(8);
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillStyle = playing
          ? `rgba(${row.color},0.7)`
          : `rgba(${row.color},0.3)`;
        ctx.fillText(row.label, leftX + 4 * dpr, ry + 3 * dpr);
      }

      // --- Right: Spectrogram ---
      spect.ensure(rightW, contentH);

      if (analyser && freqData) {
        analyser.getFloatFrequencyData(freqData);
        spect.pushColumn(freqData, audioCtx.sampleRate, analyser.fftSize, SPECT_MAX_FREQ);
      } else {
        spect.pushSilent();
      }

      ctx.drawImage(spect.canvas, 0, 0, spect.width, spect.height, rightX, contentTop, rightW, contentH);

      // Border
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1 * dpr;
      ctx.strokeRect(rightX, contentTop, rightW, contentH);

      // Section label
      ctx.font = font(8);
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText("spectrogram", rightX, contentTop - 3 * dpr);

      // Frequency labels
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.font = font(7.5);
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      const freqLabels = [220, 440, 660, 880, 1100];
      for (const f of freqLabels) {
        if (f > SPECT_MAX_FREQ) continue;
        const ly = contentTop + contentH - (f / SPECT_MAX_FREQ) * contentH;
        const label = f >= 1000 ? (f / 1000).toFixed(1) + "k" : f + "";
        ctx.fillText(label, rightX - 4 * dpr, ly);
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(rightX, ly, 4 * dpr, 1);
        ctx.fillStyle = "rgba(255,255,255,0.22)";
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
