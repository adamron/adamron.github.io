/**
 * octave-doubling demo
 * Two vertically stacked sine waves — the lower note and its octave (2:1).
 * Waveforms are time-aligned so you can see the 2:1 cycle relationship.
 * Click top half to toggle the lower note, bottom half for the octave,
 * or both to hear them together.
 */
registerDemo("octave-doubling", {
  init(container) {
    const canvas = document.createElement("canvas");
    container.appendChild(canvas);

    let baseFreq = 220;
    let playLow = false;
    let playHigh = false;
    let phase = 0;

    const wrap = container.closest(".demo-container");
    const freqSlider = wrap.querySelector('[data-control="base-freq"]');
    if (freqSlider) {
      baseFreq = parseInt(freqSlider.value, 10);
      freqSlider.addEventListener("input", () => {
        baseFreq = parseInt(freqSlider.value, 10);
        if (oscLow) oscLow.frequency.setTargetAtTime(baseFreq, audioCtx.currentTime, 0.01);
        if (oscHigh) oscHigh.frequency.setTargetAtTime(baseFreq * 2, audioCtx.currentTime, 0.01);
      });
    }

    // --- Web Audio ---
    let audioCtx = null;
    let oscLow = null, gainLow = null;
    let oscHigh = null, gainHigh = null;

    function ensureCtx() {
      if (!audioCtx)
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    function startOsc(freq) {
      ensureCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      gain.gain.setTargetAtTime(0.15, audioCtx.currentTime, 0.03);
      return { osc, gain };
    }

    function stopOsc(osc, gain) {
      if (!osc) return;
      gain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.04);
      setTimeout(() => { osc.stop(); osc.disconnect(); gain.disconnect(); }, 200);
    }

    function toggleLow() {
      if (playLow) {
        playLow = false;
        stopOsc(oscLow, gainLow);
        oscLow = null; gainLow = null;
      } else {
        playLow = true;
        const n = startOsc(baseFreq);
        oscLow = n.osc; gainLow = n.gain;
      }
    }

    function toggleHigh() {
      if (playHigh) {
        playHigh = false;
        stopOsc(oscHigh, gainHigh);
        oscHigh = null; gainHigh = null;
      } else {
        playHigh = true;
        const n = startOsc(baseFreq * 2);
        oscHigh = n.osc; gainHigh = n.gain;
      }
    }

    // --- Interaction ---
    canvas.addEventListener("pointerdown", (e) => {
      const rect = canvas.getBoundingClientRect();
      const y = (e.clientY - rect.top) / rect.height;
      if (y < 0.5) toggleLow();
      else toggleHigh();
    });
    canvas.style.touchAction = "none";
    canvas.style.cursor = "pointer";

    // --- Note name helper ---
    const NOTE_NAMES = [
      "C", "C\u266F", "D", "D\u266F", "E", "F",
      "F\u266F", "G", "G\u266F", "A", "A\u266F", "B",
    ];
    function freqToNote(f) {
      const semitones = 12 * Math.log2(f / 440);
      const rounded = Math.round(semitones);
      const name = NOTE_NAMES[((((rounded % 12) + 12) % 12) + 9) % 12];
      const octave = 4 + Math.floor((rounded + 9) / 12);
      return name + octave;
    }

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

      const padX = 28 * dpr;
      const padY = 16 * dpr;
      const drawW = w - padX * 2;
      const halfH = h / 2;
      const gap = 1 * dpr;

      // Divider
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(padX, halfH - gap, drawW, gap * 2);

      const anyPlaying = playLow || playHigh;

      // Draw each waveform
      const waves = [
        { y0: padY, h: halfH - padY - gap, freq: baseFreq, on: playLow, label: "lower" },
        { y0: halfH + gap, h: halfH - padY - gap, freq: baseFreq * 2, on: playHigh, label: "upper (octave)" },
      ];

      // Show a fixed time window so higher baseFreq = more visible cycles
      // At 220 Hz we see ~3 cycles; at 440 Hz we see ~6, etc.
      const visibleTime = 3 / 220; // seconds of waveform shown

      for (const wv of waves) {
        const centerY = wv.y0 + wv.h / 2;
        const amp = (wv.h / 2 - 4 * dpr) * (wv.on ? 0.85 : 0.4);
        const cycles = wv.freq * visibleTime;

        // Equilibrium
        ctx.setLineDash([3 * dpr, 4 * dpr]);
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        ctx.moveTo(padX, centerY);
        ctx.lineTo(padX + drawW, centerY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Wave
        ctx.beginPath();
        const samples = 400;
        for (let s = 0; s <= samples; s++) {
          const t = s / samples;
          const x = padX + t * drawW;
          const y = centerY - amp * Math.sin(
            t * cycles * Math.PI * 2 + (anyPlaying ? phase * (wv.freq / baseFreq) : 0),
          );
          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = wv.on
          ? "rgba(140,100,180,0.9)"
          : "rgba(140,100,180,0.3)";
        ctx.lineWidth = 2 * dpr;
        ctx.stroke();

        // Label
        const font = (sz) =>
          `${sz * dpr}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;

        ctx.font = font(12);
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillStyle = wv.on ? "rgba(200,175,230,0.85)" : "rgba(255,255,255,0.3)";
        ctx.fillText(
          freqToNote(wv.freq) + "  " + Math.round(wv.freq) + " Hz",
          padX + 4 * dpr,
          wv.y0 + 4 * dpr,
        );

        // Play state
        ctx.textAlign = "right";
        ctx.font = font(9);
        ctx.fillStyle = wv.on ? "rgba(200,175,230,0.5)" : "rgba(255,255,255,0.12)";
        ctx.fillText(
          wv.on ? "\u25A0 stop" : "\u25B6 play",
          w - padX - 4 * dpr,
          wv.y0 + 6 * dpr,
        );
      }

      // Ratio label in center
      ctx.font = `600 ${11 * dpr}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillText("ratio 2 : 1", w - padX - 4 * dpr, halfH);

      if (anyPlaying) phase += 0.05;
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
      if (playLow) toggleLow();
      if (playHigh) toggleHigh();
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
