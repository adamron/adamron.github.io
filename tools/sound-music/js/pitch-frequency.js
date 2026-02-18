/**
 * pitch-frequency demo
 * Tone generator with drag-to-set-frequency. Horizontal position on the
 * canvas maps logarithmically to frequency (60–2000 Hz). Click toggles
 * audio on/off; drag while playing to sweep pitch. Volume via slider.
 */
registerDemo("pitch-frequency", {
  init(container) {
    const canvas = document.createElement("canvas");
    container.appendChild(canvas);

    const WAVE_COLOR = "#9070c0";
    const WAVE_ACTIVE = "rgba(160,130,210,0.6)";
    const DIM_COLOR = "rgba(255,255,255,0.10)";
    const TEXT_COLOR = "rgba(200,175,230,0.9)";
    const SUB_COLOR = "rgba(255,255,255,0.35)";
    const HINT_COLOR = "rgba(255,255,255,0.13)";

    const FREQ_MIN = 60;
    const FREQ_MAX = 2000;

    let frequency = 440;
    let volume = 0.5;
    let playing = false;
    let phase = 0;
    let cursorNormX = null; // null when pointer not over canvas

    const wrap = container.closest(".demo-container");
    const volSlider = wrap.querySelector('[data-control="volume"]');
    if (volSlider) {
      volume = parseInt(volSlider.value, 10) / 100;
      volSlider.addEventListener("input", () => {
        volume = parseInt(volSlider.value, 10) / 100;
        if (gain) {
          gain.gain.setTargetAtTime(
            playing ? volume * 0.2 : 0,
            audioCtx.currentTime,
            0.02,
          );
        }
      });
    }

    // --- Log mapping: normalized 0–1 <-> frequency ---
    function normToFreq(t) {
      return FREQ_MIN * Math.pow(FREQ_MAX / FREQ_MIN, t);
    }
    function freqToNorm(f) {
      return Math.log(f / FREQ_MIN) / Math.log(FREQ_MAX / FREQ_MIN);
    }

    // --- Note name lookup ---
    const NOTE_NAMES = [
      "C", "C\u266F", "D", "D\u266F", "E", "F",
      "F\u266F", "G", "G\u266F", "A", "A\u266F", "B",
    ];

    function freqToNote(f) {
      const semitones = 12 * Math.log2(f / 440);
      const rounded = Math.round(semitones);
      const cents = Math.round((semitones - rounded) * 100);
      const name = NOTE_NAMES[((((rounded % 12) + 12) % 12) + 9) % 12];
      const octave = 4 + Math.floor((rounded + 9) / 12);
      return { name, octave, cents };
    }

    // --- Web Audio ---
    let audioCtx = null;
    let osc = null;
    let gain = null;

    function ensureAudio() {
      if (!audioCtx)
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (!osc) {
        osc = audioCtx.createOscillator();
        gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.value = frequency;
        gain.gain.value = 0;
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
      }
    }

    function setPlaying(on) {
      playing = on;
      ensureAudio();
      gain.gain.setTargetAtTime(
        on ? volume * 0.2 : 0,
        audioCtx.currentTime,
        0.03,
      );
    }

    function updateFrequency(f) {
      frequency = Math.round(Math.max(FREQ_MIN, Math.min(FREQ_MAX, f)));
      if (osc) osc.frequency.setTargetAtTime(frequency, audioCtx.currentTime, 0.01);
    }

    // --- Pointer interaction ---
    let dragging = false;

    function pointerNormX(e) {
      const rect = canvas.getBoundingClientRect();
      return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    }

    canvas.addEventListener("pointerdown", (e) => {
      dragging = true;
      canvas.setPointerCapture(e.pointerId);
      const nx = pointerNormX(e);
      cursorNormX = nx;
      updateFrequency(normToFreq(nx));
      setPlaying(true);
    });

    canvas.addEventListener("pointermove", (e) => {
      const nx = pointerNormX(e);
      cursorNormX = nx;
      if (dragging) {
        updateFrequency(normToFreq(nx));
      }
    });

    canvas.addEventListener("pointerup", () => {
      dragging = false;
      setPlaying(false);
    });

    canvas.addEventListener("pointercancel", () => {
      dragging = false;
      setPlaying(false);
    });

    canvas.addEventListener("pointerleave", () => {
      cursorNormX = null;
      if (!dragging) return;
      dragging = false;
      setPlaying(false);
    });

    canvas.style.touchAction = "none";
    canvas.style.cursor = "crosshair";

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

      const padX = 20 * dpr;
      const padY = 12 * dpr;
      const centerY = h / 2;
      const drawW = w - padX * 2;
      const drawH = h - padY * 2;

      // --- Frequency position indicator (vertical line) ---
      const freqNorm = freqToNorm(frequency);
      const freqX = padX + freqNorm * drawW;

      if (playing || cursorNormX !== null) {
        ctx.strokeStyle = "rgba(160,130,210,0.2)";
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        ctx.moveTo(freqX, padY);
        ctx.lineTo(freqX, h - padY);
        ctx.stroke();
      }

      // --- Note tick marks along bottom ---
      ctx.font = `${9 * dpr}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      // Show octave markers (C2..C7) plus A4
      const markers = [
        { note: "C2", freq: 65.41 },
        { note: "C3", freq: 130.81 },
        { note: "A3", freq: 220 },
        { note: "C4", freq: 261.63 },
        { note: "A4", freq: 440 },
        { note: "C5", freq: 523.25 },
        { note: "C6", freq: 1046.5 },
        { note: "C7", freq: 2093 },
      ];
      const tickY = h - padY + 2 * dpr;
      for (const m of markers) {
        if (m.freq < FREQ_MIN || m.freq > FREQ_MAX) continue;
        const mx = padX + freqToNorm(m.freq) * drawW;
        ctx.fillStyle = DIM_COLOR;
        ctx.fillRect(mx - 0.5 * dpr, h - padY - 4 * dpr, 1 * dpr, 4 * dpr);
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.fillText(m.note, mx, tickY);
      }

      // --- Waveform ---
      const maxAmp = drawH / 2 - 4 * dpr;
      const amp = maxAmp * volume * (playing ? 1.0 : 0.5);
      const visibleCycles = 3 + frequency / 300;

      // Pressure axis tick marks (right edge)
      const axisX = padX + drawW + 4 * dpr;
      ctx.font = `${8 * dpr}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(255,255,255,0.18)";

      // +peak, 0, -peak
      const peakY = centerY - amp;
      const troughY = centerY + amp;

      if (amp > 10 * dpr) {
        // + marker
        ctx.fillRect(padX + drawW, peakY, 4 * dpr, 1 * dpr);
        ctx.fillText("+", axisX + 2 * dpr, peakY);
        // - marker
        ctx.fillRect(padX + drawW, troughY, 4 * dpr, 1 * dpr);
        ctx.fillText("\u2013", axisX + 2 * dpr, troughY);
      }
      // 0 marker
      ctx.fillRect(padX + drawW, centerY, 4 * dpr, 1 * dpr);
      ctx.fillText("0", axisX + 2 * dpr, centerY);

      // Equilibrium
      ctx.setLineDash([3 * dpr, 4 * dpr]);
      ctx.strokeStyle = DIM_COLOR;
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.moveTo(padX, centerY);
      ctx.lineTo(padX + drawW, centerY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Wave
      ctx.beginPath();
      for (let i = 0; i <= 400; i++) {
        const t = i / 400;
        const x = padX + t * drawW;
        const y = centerY - amp * Math.sin(t * visibleCycles * Math.PI * 2 + phase);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = playing ? WAVE_COLOR : WAVE_ACTIVE;
      ctx.lineWidth = 2 * dpr;
      ctx.stroke();

      if (playing) {
        phase += (frequency / 400) * 0.25;
      }

      // --- Info overlay ---
      const note = freqToNote(frequency);
      const centsStr =
        note.cents === 0
          ? ""
          : note.cents > 0
            ? "+" + note.cents + "\u00A2"
            : note.cents + "\u00A2";

      // Frequency + note (top-left)
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      ctx.font = `600 ${22 * dpr}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText(frequency + " Hz", padX + 8 * dpr, padY + 6 * dpr);

      ctx.font = `${13 * dpr}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      ctx.fillStyle = SUB_COLOR;
      ctx.fillText(
        note.name + note.octave + (centsStr ? "  " + centsStr : ""),
        padX + 8 * dpr,
        padY + 32 * dpr,
      );

      // Hint
      if (!playing && cursorNormX === null) {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${11 * dpr}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
        ctx.fillStyle = HINT_COLOR;
        ctx.fillText("click & drag to play", w / 2, centerY);
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
      if (playing) setPlaying(false);
      dragging = false;
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
