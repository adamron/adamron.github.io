/**
 * waveform-synth demo
 * Morph between sine → triangle → square → sawtooth using additive synthesis.
 * Left half: composite waveform. Right half: real FFT spectrogram fed from
 * the Web Audio AnalyserNode.
 * Click canvas to toggle audio.
 */
registerDemo("waveform-synth", {
  init(container) {
    const canvas = document.createElement("canvas");
    container.appendChild(canvas);

    const NUM_HARMONICS = 20;
    const BASE_FREQ = 220;
    const ACCENT = "rgba(140,100,180,";

    let mix = 0;
    let playing = false;
    let phase = 0;

    const wrap = container.closest(".demo-container");
    const mixSlider = wrap.querySelector('[data-control="waveform-mix"]');
    if (mixSlider) {
      mix = parseInt(mixSlider.value, 10) / 100;
      mixSlider.addEventListener("input", () => {
        mix = parseInt(mixSlider.value, 10) / 100;
        if (playing) updateOscGains();
      });
    }

    // --- Harmonic recipes ---
    function sineH(n) { return n === 1 ? 1 : 0; }
    function triangleH(n) {
      if (n % 2 === 0) return 0;
      return (1 / (n * n)) * (((n - 1) / 2) % 2 === 0 ? 1 : -1);
    }
    function squareH(n) { return n % 2 === 0 ? 0 : 1 / n; }
    function sawtoothH(n) { return (1 / n) * (n % 2 === 0 ? -1 : 1); }

    function getHarmonics() {
      const amps = new Float32Array(NUM_HARMONICS);
      let segT, aFn, bFn;
      if (mix < 1 / 3) {
        segT = mix * 3; aFn = sineH; bFn = triangleH;
      } else if (mix < 2 / 3) {
        segT = (mix - 1 / 3) * 3; aFn = triangleH; bFn = squareH;
      } else {
        segT = (mix - 2 / 3) * 3; aFn = squareH; bFn = sawtoothH;
      }
      for (let i = 0; i < NUM_HARMONICS; i++) {
        const n = i + 1;
        amps[i] = aFn(n) * (1 - segT) + bFn(n) * segT;
      }
      return amps;
    }

    function getLabel() {
      if (mix < 1 / 3) {
        const t = mix * 3;
        if (t < 0.05) return "Sine";
        if (t > 0.95) return "Triangle";
        return "Sine \u2192 Triangle";
      } else if (mix < 2 / 3) {
        const t = (mix - 1 / 3) * 3;
        if (t < 0.05) return "Triangle";
        if (t > 0.95) return "Square";
        return "Triangle \u2192 Square";
      } else {
        const t = (mix - 2 / 3) * 3;
        if (t < 0.05) return "Square";
        if (t > 0.95) return "Sawtooth";
        return "Square \u2192 Sawtooth";
      }
    }

    // --- Spectrogram buffer (offscreen canvas that scrolls left) ---
    let spectCanvas = null;
    let spectCtx = null;
    let spectW = 0;
    let spectH = 0;

    function ensureSpectBuffer(w, h) {
      if (spectCanvas && spectW === w && spectH === h) return;
      spectCanvas = document.createElement("canvas");
      spectCanvas.width = w;
      spectCanvas.height = h;
      spectCtx = spectCanvas.getContext("2d");
      spectCtx.fillStyle = "#0a0a0a";
      spectCtx.fillRect(0, 0, w, h);
      spectW = w;
      spectH = h;
    }

    // Paint one column of FFT data into the spectrogram
    // freqData: Float32Array of dB values from analyser
    // maxFreq: the frequency represented by the top pixel
    function pushSpectColumnFFT(freqData, sampleRate, fftSize, maxFreq) {
      spectCtx.drawImage(spectCanvas, -1, 0);
      spectCtx.fillStyle = "#0a0a0a";
      spectCtx.fillRect(spectW - 1, 0, 1, spectH);

      const binCount = freqData.length;
      const binFreqWidth = sampleRate / fftSize;
      const maxBin = Math.min(binCount, Math.ceil(maxFreq / binFreqWidth));

      for (let row = 0; row < spectH; row++) {
        // Map pixel row to frequency (bottom = 0, top = maxFreq)
        const freq = ((spectH - 1 - row) / (spectH - 1)) * maxFreq;
        const bin = freq / binFreqWidth;
        const binLow = Math.floor(bin);
        const binHigh = Math.min(binLow + 1, maxBin - 1);
        const frac = bin - binLow;

        if (binLow >= maxBin) continue;

        // Interpolate dB value
        const dbLow = freqData[binLow];
        const dbHigh = freqData[binHigh];
        const db = dbLow + (dbHigh - dbLow) * frac;

        // Map dB to intensity (analyser typically gives -100 to 0 dB)
        const intensity = Math.max(0, Math.min(1, (db + 90) / 70));
        if (intensity < 0.01) continue;

        // Warm colormap: dark purple → magenta → peach → white
        const i2 = Math.sqrt(intensity); // inverse gamma to brighten
        const r = Math.round(30 + 225 * i2);
        const g = Math.round(10 + 180 * i2 * i2);
        const b = Math.round(40 + 160 * i2);

        spectCtx.fillStyle = `rgb(${r},${g},${b})`;
        spectCtx.fillRect(spectW - 1, row, 1, 1);
      }
    }

    // --- Web Audio with AnalyserNode ---
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
      analyser.smoothingTimeConstant = 0.7;
      freqData = new Float32Array(analyser.frequencyBinCount);

      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0;
      masterGain.connect(analyser);
      analyser.connect(audioCtx.destination);

      const amps = getHarmonics();
      for (let i = 0; i < NUM_HARMONICS; i++) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.value = BASE_FREQ * (i + 1);
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

    function updateOscGains() {
      if (!gainNodes.length) return;
      const amps = getHarmonics();
      const t = audioCtx.currentTime;
      for (let i = 0; i < NUM_HARMONICS; i++) {
        gainNodes[i].gain.setTargetAtTime(Math.abs(amps[i]), t, 0.02);
      }
    }

    // --- Interaction ---
    canvas.addEventListener("pointerdown", (e) => {
      canvas.setPointerCapture(e.pointerId);
      if (playing) {
        playing = false;
        stopAudio();
      } else {
        playing = true;
        startAudio();
      }
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

    // Max frequency shown on spectrogram (just above highest harmonic)
    const SPECT_MAX_FREQ = BASE_FREQ * (NUM_HARMONICS + 1);

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

      const contentTop = padY + headerH;
      const contentBot = h - padY;
      const contentH = contentBot - contentTop;
      const leftW = Math.floor((w - padX * 2 - gap) * 0.45);
      const rightW = w - padX * 2 - gap - leftW;
      const leftX = padX;
      const rightX = padX + leftW + gap;

      const amps = getHarmonics();

      // --- Header ---
      ctx.font = `600 ${15 * dpr}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = playing ? "rgba(200,175,230,0.9)" : "rgba(200,175,230,0.6)";
      ctx.fillText(getLabel(), padX, padY);

      ctx.textAlign = "right";
      ctx.font = `${10 * dpr}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      ctx.fillStyle = playing ? "rgba(200,175,230,0.5)" : "rgba(255,255,255,0.15)";
      ctx.fillText(
        playing ? "\u25A0 click to stop" : "\u25B6 click to play",
        w - padX, padY + 2 * dpr,
      );

      // --- Left: Waveform ---
      const centerY = contentTop + contentH / 2;

      ctx.font = `${8 * dpr}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText("waveform", leftX, contentTop - 3 * dpr);

      // Equilibrium
      ctx.setLineDash([3 * dpr, 4 * dpr]);
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.moveTo(leftX, centerY);
      ctx.lineTo(leftX + leftW, centerY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Composite wave
      const samples = 300;
      const cycles = 3;
      let peak = 0;
      for (let s = 0; s <= samples; s++) {
        const t = s / samples;
        let v = 0;
        for (let i = 0; i < NUM_HARMONICS; i++)
          v += amps[i] * Math.sin((i + 1) * t * cycles * Math.PI * 2);
        if (Math.abs(v) > peak) peak = Math.abs(v);
      }
      if (peak < 0.001) peak = 1;
      const waveAmp = (contentH / 2 - 4 * dpr) / peak;

      ctx.beginPath();
      for (let s = 0; s <= samples; s++) {
        const t = s / samples;
        let v = 0;
        for (let i = 0; i < NUM_HARMONICS; i++)
          v += amps[i] * Math.sin(
            (i + 1) * t * cycles * Math.PI * 2 + (playing ? phase * (i + 1) : 0),
          );
        const x = leftX + t * leftW;
        const y = centerY - v * waveAmp;
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = ACCENT + (playing ? "0.9)" : "0.4)");
      ctx.lineWidth = 2 * dpr;
      ctx.stroke();

      // --- Right: Spectrogram ---
      ensureSpectBuffer(rightW, contentH);

      if (analyser && freqData) {
        analyser.getFloatFrequencyData(freqData);
        pushSpectColumnFFT(freqData, audioCtx.sampleRate, analyser.fftSize, SPECT_MAX_FREQ);
      } else {
        // When not playing, push a silent column
        spectCtx.drawImage(spectCanvas, -1, 0);
        spectCtx.fillStyle = "#0a0a0a";
        spectCtx.fillRect(spectW - 1, 0, 1, spectH);
      }

      ctx.drawImage(spectCanvas, 0, 0, spectW, spectH, rightX, contentTop, rightW, contentH);

      // Border
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1 * dpr;
      ctx.strokeRect(rightX, contentTop, rightW, contentH);

      // Section label
      ctx.font = `${8 * dpr}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText("spectrogram", rightX, contentTop - 3 * dpr);

      // Frequency labels
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.font = `${7.5 * dpr}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      const freqLabels = [220, 440, 880, 1760, 3520];
      for (const f of freqLabels) {
        if (f > SPECT_MAX_FREQ) continue;
        const ly = contentTop + contentH - (f / SPECT_MAX_FREQ) * contentH;
        const label = f >= 1000 ? (f / 1000).toFixed(1) + "k" : f + "";
        ctx.fillText(label, rightX - 4 * dpr, ly);
        // Tick
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
