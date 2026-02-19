/**
 * spectrogram demo
 * Real-time spectrogram from microphone input. Click to start/stop.
 * Uses the shared createSpectrogram() utility for the scrolling display.
 * Top strip: live waveform. Main area: scrolling spectrogram.
 */
registerDemo("spectrogram", {
  init(container) {
    const canvas = document.createElement("canvas");
    container.appendChild(canvas);

    const MAX_FREQ = 8000; // Hz – covers speech and most musical content

    let active = false;
    let audioCtx = null;
    let micStream = null;
    let micSource = null;
    let analyser = null;
    let freqData = null;
    let timeData = null;

    const spect = createSpectrogram();

    async function startMic() {
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        return; // Permission denied or no mic
      }
      if (!audioCtx)
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      micSource = audioCtx.createMediaStreamSource(micStream);

      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.6;
      freqData = new Float32Array(analyser.frequencyBinCount);
      timeData = new Float32Array(analyser.fftSize);

      micSource.connect(analyser);
      // Don't connect to destination — we don't want to play the mic back
      active = true;
    }

    function stopMic() {
      active = false;
      if (micSource) { micSource.disconnect(); micSource = null; }
      if (micStream) {
        micStream.getTracks().forEach((t) => t.stop());
        micStream = null;
      }
      analyser = null;
      freqData = null;
      timeData = null;
    }

    // --- Interaction ---
    canvas.addEventListener("pointerdown", () => {
      if (active) stopMic();
      else startMic();
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
      const padY = 14 * dpr;
      const headerH = 24 * dpr;
      const waveH = 50 * dpr;
      const gap = 6 * dpr;
      const spectTop = padY + headerH + waveH + gap;
      const spectH = h - spectTop - padY;
      const drawW = w - padX * 2;
      const freqLabelW = 32 * dpr;
      const spectX = padX + freqLabelW;
      const spectW = drawW - freqLabelW;

      const font = (sz, weight) =>
        `${weight || ""} ${sz * dpr}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.trim();

      // --- Header ---
      ctx.font = font(12, "600");
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = active ? "rgba(200,175,230,0.9)" : "rgba(200,175,230,0.6)";
      ctx.fillText("spectrogram", padX, padY);

      ctx.textAlign = "right";
      ctx.font = font(9);
      ctx.fillStyle = active ? "rgba(200,175,230,0.5)" : "rgba(255,255,255,0.15)";
      ctx.fillText(
        active ? "\u25A0 click to stop mic" : "\u25B6 click to start mic",
        w - padX, padY + 2 * dpr,
      );

      // --- Waveform strip ---
      const waveTop = padY + headerH;
      const waveCenterY = waveTop + waveH / 2;

      // Equilibrium
      ctx.setLineDash([3 * dpr, 4 * dpr]);
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.moveTo(padX, waveCenterY);
      ctx.lineTo(padX + drawW, waveCenterY);
      ctx.stroke();
      ctx.setLineDash([]);

      if (analyser && timeData) {
        analyser.getFloatTimeDomainData(timeData);
        const amp = waveH / 2 - 2 * dpr;

        ctx.beginPath();
        const step = Math.max(1, Math.floor(timeData.length / drawW * dpr));
        const numPts = Math.floor(timeData.length / step);
        for (let i = 0; i < numPts; i++) {
          const x = padX + (i / numPts) * drawW;
          const y = waveCenterY - timeData[i * step] * amp;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "rgba(140,100,180,0.8)";
        ctx.lineWidth = 1.5 * dpr;
        ctx.stroke();
      }

      // --- Spectrogram ---
      spect.ensure(spectW, spectH);

      if (analyser && freqData) {
        analyser.getFloatFrequencyData(freqData);
        spect.pushColumn(freqData, audioCtx.sampleRate, analyser.fftSize, MAX_FREQ);
      } else {
        spect.pushSilent();
      }

      ctx.drawImage(spect.canvas, 0, 0, spect.width, spect.height, spectX, spectTop, spectW, spectH);

      // Border
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1 * dpr;
      ctx.strokeRect(spectX, spectTop, spectW, spectH);

      // Frequency labels
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.font = font(7);
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      const freqLabels = [100, 500, 1000, 2000, 4000, 8000];
      for (const f of freqLabels) {
        if (f > MAX_FREQ) continue;
        const ly = spectTop + spectH - (f / MAX_FREQ) * spectH;
        const label = f >= 1000 ? (f / 1000) + "k" : f + "";
        ctx.fillText(label, spectX - 4 * dpr, ly);
        // Tick
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.fillRect(spectX, ly, 4 * dpr, 1);
        ctx.fillStyle = "rgba(255,255,255,0.22)";
      }

      // Prompt when not active
      if (!active) {
        ctx.font = font(11);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.fillText(
          "click to enable microphone",
          padX + drawW / 2, spectTop + spectH / 2,
        );
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
      if (active) stopMic();
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
