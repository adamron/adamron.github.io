/**
 * full-synth demo
 * Combined keyboard + waveform selector + waveform display + spectrum +
 * spectrogram. The capstone demo tying everything together.
 * Bottom: two-octave keyboard (C4–C6). Top-left: live waveform.
 * Top-right: scrolling spectrogram. Waveform slider selects type.
 */
registerDemo("full-synth", {
  init(container) {
    const canvas = document.createElement("canvas");
    container.appendChild(canvas);

    const A4_FREQ = 440;
    const START_NOTE = 60; // C4
    const NUM_KEYS = 25;   // C4–C6
    const WAVE_TYPES = ["sine", "triangle", "square", "sawtooth"];
    const WAVE_LABELS = ["sine", "triangle", "square", "sawtooth"];
    const NOTE_NAMES = ["C","C\u266F","D","D\u266F","E","F","F\u266F","G","G\u266F","A","A\u266F","B"];

    let waveType = 0;

    const wrap = container.closest(".demo-container");
    const waveSlider = wrap.querySelector('[data-control="waveform"]');
    if (waveSlider) {
      waveType = parseInt(waveSlider.value, 10);
      waveSlider.addEventListener("input", () => {
        waveType = parseInt(waveSlider.value, 10);
        // Update any playing oscillators
        for (const n of activeNotes.values()) {
          n.osc.type = WAVE_TYPES[waveType];
        }
      });
    }

    function isBlack(midi) {
      return [1,3,6,8,10].includes(midi % 12);
    }

    function midiToFreq(midi) {
      return A4_FREQ * Math.pow(2, (midi - 69) / 12);
    }

    function midiToName(midi) {
      return NOTE_NAMES[midi % 12] + Math.floor(midi / 12 - 1);
    }

    // --- Web Audio ---
    let audioCtx = null;
    let analyser = null;
    let freqData = null;
    let timeData = null;
    let masterGain = null;
    const activeNotes = new Map();

    function ensureAudio() {
      if (audioCtx) return;
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.7;
      freqData = new Float32Array(analyser.frequencyBinCount);
      timeData = new Float32Array(analyser.fftSize);

      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.2;
      masterGain.connect(analyser);
      analyser.connect(audioCtx.destination);
    }

    function noteOn(midi) {
      if (activeNotes.has(midi)) return;
      ensureAudio();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = WAVE_TYPES[waveType];
      osc.frequency.value = midiToFreq(midi);
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      gain.gain.setTargetAtTime(0.3, audioCtx.currentTime, 0.01);
      activeNotes.set(midi, { osc, gain });
    }

    function noteOff(midi) {
      const n = activeNotes.get(midi);
      if (!n) return;
      activeNotes.delete(midi);
      n.gain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.04);
      setTimeout(() => { n.osc.stop(); n.osc.disconnect(); n.gain.disconnect(); }, 200);
    }

    // --- Spectrogram ---
    const spect = createSpectrogram();
    const SPECT_MAX_FREQ = 6000;

    // --- Layout ---
    function getLayout() {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width;
      const h = canvas.height;
      const padX = 16 * dpr;
      const padY = 12 * dpr;
      const headerH = 22 * dpr;
      const gap = 8 * dpr;

      // Keyboard at the bottom
      const keyH = Math.floor(h * 0.30);
      const keyTop = h - padY - keyH;

      // Top area: waveform left, spectrogram right
      const topH = keyTop - padY - headerH - gap * 2;
      const topTop = padY + headerH + gap;
      const drawW = w - padX * 2;
      const leftW = Math.floor(drawW * 0.45);
      const rightW = drawW - leftW - gap;
      const rightX = padX + leftW + gap;

      // Keyboard key sizing
      const whites = [];
      for (let i = 0; i < NUM_KEYS; i++) {
        if (!isBlack(START_NOTE + i)) whites.push(i);
      }
      const whiteW = drawW / whites.length;
      const blackW = whiteW * 0.6;
      const blackH = keyH * 0.58;

      return {
        dpr, w, h, padX, padY, headerH, gap, drawW,
        topTop, topH, leftW, rightW, rightX,
        keyTop, keyH, whiteW, blackW, blackH, whites,
      };
    }

    // Compute key rects
    function getKeyRects(L) {
      const rects = [];
      let wIdx = 0;
      const whiteXMap = {};

      for (let i = 0; i < NUM_KEYS; i++) {
        const midi = START_NOTE + i;
        if (!isBlack(midi)) {
          const x = L.padX + wIdx * L.whiteW;
          rects.push({ midi, x, y: L.keyTop, w: L.whiteW, h: L.keyH, black: false });
          whiteXMap[i] = x;
          wIdx++;
        }
      }
      for (let i = 0; i < NUM_KEYS; i++) {
        const midi = START_NOTE + i;
        if (isBlack(midi)) {
          const prevX = whiteXMap[i - 1];
          const x = prevX + L.whiteW - L.blackW / 2;
          rects.push({ midi, x, y: L.keyTop, w: L.blackW, h: L.blackH, black: true });
        }
      }
      return rects;
    }

    // --- Interaction ---
    let pressedKey = -1;
    let layoutCache = null;
    let keyRectsCache = null;

    function hitKey(e) {
      const L = layoutCache || getLayout();
      const rects = keyRectsCache || getKeyRects(L);
      const rect = canvas.getBoundingClientRect();
      const px = (e.clientX - rect.left) * L.dpr;
      const py = (e.clientY - rect.top) * L.dpr;

      // Only in keyboard area
      if (py < L.keyTop) return -1;

      // Black keys first
      for (const k of rects) {
        if (!k.black) continue;
        if (px >= k.x && px <= k.x + k.w && py >= k.y && py <= k.y + k.h) return k.midi;
      }
      for (const k of rects) {
        if (k.black) continue;
        if (px >= k.x && px <= k.x + k.w && py >= k.y && py <= k.y + k.h) return k.midi;
      }
      return -1;
    }

    canvas.addEventListener("pointerdown", (e) => {
      canvas.setPointerCapture(e.pointerId);
      const midi = hitKey(e);
      if (midi >= 0) {
        pressedKey = midi;
        noteOn(midi);
      }
    });

    canvas.addEventListener("pointermove", (e) => {
      if (pressedKey < 0) return;
      const midi = hitKey(e);
      if (midi !== pressedKey) {
        noteOff(pressedKey);
        if (midi >= 0) { pressedKey = midi; noteOn(midi); }
        else pressedKey = -1;
      }
    });

    canvas.addEventListener("pointerup", () => {
      if (pressedKey >= 0) { noteOff(pressedKey); pressedKey = -1; }
    });
    canvas.addEventListener("pointercancel", () => {
      if (pressedKey >= 0) { noteOff(pressedKey); pressedKey = -1; }
    });
    canvas.style.touchAction = "none";
    canvas.style.cursor = "pointer";

    // --- Rendering ---
    function resize() {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      layoutCache = null;
      keyRectsCache = null;
    }

    function draw() {
      const ctx = canvas.getContext("2d");
      const L = getLayout();
      layoutCache = L;
      const { dpr, w, h, padX, padY, drawW, gap,
        topTop, topH, leftW, rightW, rightX,
        keyTop, keyH } = L;
      const rects = getKeyRects(L);
      keyRectsCache = rects;

      ctx.clearRect(0, 0, w, h);

      const playing = activeNotes.size > 0;

      const font = (sz, weight) =>
        `${weight || ""} ${sz * dpr}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.trim();

      // --- Header ---
      ctx.font = font(12, "600");
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = playing ? "rgba(200,175,230,0.9)" : "rgba(200,175,230,0.6)";
      ctx.fillText(WAVE_LABELS[waveType] + " synth", padX, padY);

      if (pressedKey >= 0) {
        ctx.font = font(10);
        ctx.fillStyle = "rgba(200,175,230,0.7)";
        ctx.fillText(
          "  " + midiToName(pressedKey) + "  " + midiToFreq(pressedKey).toFixed(1) + " Hz",
          padX + ctx.measureText(WAVE_LABELS[waveType] + " synth").width + 4 * dpr,
          padY + 1 * dpr,
        );
      }

      // --- Left: Waveform ---
      ctx.font = font(7.5);
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText("waveform", padX, topTop - 2 * dpr);

      const waveCenterY = topTop + topH / 2;

      ctx.setLineDash([3 * dpr, 4 * dpr]);
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.moveTo(padX, waveCenterY);
      ctx.lineTo(padX + leftW, waveCenterY);
      ctx.stroke();
      ctx.setLineDash([]);

      if (analyser && timeData) {
        analyser.getFloatTimeDomainData(timeData);
        const amp = topH / 2 - 3 * dpr;
        ctx.beginPath();
        const step = Math.max(1, Math.floor(timeData.length / (leftW / dpr)));
        const numPts = Math.floor(timeData.length / step);
        for (let i = 0; i < numPts; i++) {
          const x = padX + (i / numPts) * leftW;
          const y = waveCenterY - timeData[i * step] * amp;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = playing ? "rgba(140,100,180,0.85)" : "rgba(140,100,180,0.3)";
        ctx.lineWidth = 2 * dpr;
        ctx.stroke();
      }

      // --- Right: Spectrogram ---
      ctx.font = font(7.5);
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText("spectrogram", rightX, topTop - 2 * dpr);

      spect.ensure(rightW, topH);

      if (analyser && freqData && playing) {
        analyser.getFloatFrequencyData(freqData);
        spect.pushColumn(freqData, audioCtx.sampleRate, analyser.fftSize, SPECT_MAX_FREQ);
      } else {
        spect.pushSilent();
      }

      ctx.drawImage(spect.canvas, 0, 0, spect.width, spect.height, rightX, topTop, rightW, topH);

      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1 * dpr;
      ctx.strokeRect(rightX, topTop, rightW, topH);

      // Freq labels
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.font = font(6.5);
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      const freqLabels = [500, 1000, 2000, 4000];
      for (const f of freqLabels) {
        if (f > SPECT_MAX_FREQ) continue;
        const ly = topTop + topH - (f / SPECT_MAX_FREQ) * topH;
        const label = f >= 1000 ? (f / 1000) + "k" : f + "";
        ctx.fillText(label, rightX - 3 * dpr, ly);
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.fillRect(rightX, ly, 3 * dpr, 1);
        ctx.fillStyle = "rgba(255,255,255,0.2)";
      }

      // --- Keyboard ---
      // Separator line
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.moveTo(padX, keyTop - gap / 2);
      ctx.lineTo(padX + drawW, keyTop - gap / 2);
      ctx.stroke();

      for (const pass of [false, true]) {
        for (const k of rects) {
          if (k.black !== pass) continue;

          const pressed = k.midi === pressedKey;
          const isPlaying = activeNotes.has(k.midi);

          if (k.black) {
            ctx.fillStyle = (pressed || isPlaying)
              ? "rgba(140,100,180,0.7)"
              : "rgba(35,32,42,0.95)";
            ctx.beginPath();
            ctx.roundRect(k.x, k.y, k.w, k.h, [0, 0, 3 * dpr, 3 * dpr]);
            ctx.fill();

            ctx.strokeStyle = "rgba(255,255,255,0.08)";
            ctx.lineWidth = 1 * dpr;
            ctx.beginPath();
            ctx.roundRect(k.x, k.y, k.w, k.h, [0, 0, 3 * dpr, 3 * dpr]);
            ctx.stroke();
          } else {
            ctx.fillStyle = (pressed || isPlaying)
              ? "rgba(160,130,200,0.3)"
              : "rgba(255,255,255,0.07)";
            ctx.beginPath();
            ctx.roundRect(k.x + 1, k.y, k.w - 2, k.h, [0, 0, 3 * dpr, 3 * dpr]);
            ctx.fill();

            ctx.strokeStyle = "rgba(255,255,255,0.06)";
            ctx.lineWidth = 1 * dpr;
            ctx.beginPath();
            ctx.roundRect(k.x + 1, k.y, k.w - 2, k.h, [0, 0, 3 * dpr, 3 * dpr]);
            ctx.stroke();

            // Note name on C keys
            if (k.midi % 12 === 0) {
              ctx.font = font(7);
              ctx.textAlign = "center";
              ctx.textBaseline = "bottom";
              ctx.fillStyle = (pressed || isPlaying)
                ? "rgba(200,175,230,0.9)"
                : "rgba(255,255,255,0.25)";
              ctx.fillText(midiToName(k.midi), k.x + k.w / 2, k.y + k.h - 4 * dpr);
            }
          }
        }
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
      for (const midi of activeNotes.keys()) noteOff(midi);
      pressedKey = -1;
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
