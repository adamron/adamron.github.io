/**
 * waveform-synth demo
 * Morph between sine → triangle → square → sawtooth using additive synthesis.
 * The slider crossfades harmonic amplitudes between the four waveform recipes.
 * Click/hold on the canvas to play; drag the slider while playing to hear
 * the timbre change in real time.
 */
registerDemo("waveform-synth", {
  init(container) {
    const canvas = document.createElement("canvas");
    container.appendChild(canvas);

    const NUM_HARMONICS = 20;
    const BASE_FREQ = 220;
    const ACCENT = "rgba(140,100,180,";

    let mix = 0; // 0..1 mapped from slider 0..100
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

    // --- Harmonic recipes for each waveform ---
    // Returns amplitude of harmonic n (1-based) for each waveform type
    function sineHarmonics(n) {
      return n === 1 ? 1 : 0;
    }
    function triangleHarmonics(n) {
      if (n % 2 === 0) return 0;
      return (1 / (n * n)) * (((n - 1) / 2) % 2 === 0 ? 1 : -1);
    }
    function squareHarmonics(n) {
      if (n % 2 === 0) return 0;
      return 1 / n;
    }
    function sawtoothHarmonics(n) {
      return (1 / n) * (n % 2 === 0 ? -1 : 1);
    }

    // Compute blended harmonic amplitudes for current mix position
    // mix 0..0.33 = sine→triangle, 0.33..0.66 = triangle→square, 0.66..1 = square→sawtooth
    function getHarmonics() {
      const amps = new Float32Array(NUM_HARMONICS);
      let segT, aFn, bFn;

      if (mix < 1 / 3) {
        segT = mix * 3;
        aFn = sineHarmonics;
        bFn = triangleHarmonics;
      } else if (mix < 2 / 3) {
        segT = (mix - 1 / 3) * 3;
        aFn = triangleHarmonics;
        bFn = squareHarmonics;
      } else {
        segT = (mix - 2 / 3) * 3;
        aFn = squareHarmonics;
        bFn = sawtoothHarmonics;
      }

      for (let i = 0; i < NUM_HARMONICS; i++) {
        const n = i + 1;
        amps[i] = aFn(n) * (1 - segT) + bFn(n) * segT;
      }
      return amps;
    }

    // Current waveform label
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

    // --- Web Audio (additive synthesis) ---
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
      setTimeout(() => {
        nodes.forEach((o) => { o.stop(); o.disconnect(); });
        gNodes.forEach((g) => g.disconnect());
        mg.disconnect();
      }, 200);
      oscNodes = [];
      gainNodes = [];
      masterGain = null;
    }

    function updateOscGains() {
      if (!gainNodes.length) return;
      const amps = getHarmonics();
      const t = audioCtx.currentTime;
      for (let i = 0; i < NUM_HARMONICS; i++) {
        gainNodes[i].gain.setTargetAtTime(Math.abs(amps[i]), t, 0.02);
      }
    }

    // --- Interaction: click to toggle ---
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

    function draw() {
      const ctx = canvas.getContext("2d");
      const w = canvas.width;
      const h = canvas.height;
      const dpr = window.devicePixelRatio || 1;

      ctx.clearRect(0, 0, w, h);

      const padX = 28 * dpr;
      const padY = 20 * dpr;
      const headerH = 36 * dpr;
      const barAreaH = 50 * dpr;
      const waveTop = padY + headerH;
      const waveBot = h - padY - barAreaH;
      const waveH = waveBot - waveTop;
      const centerY = waveTop + waveH / 2;
      const drawW = w - padX * 2;

      const amps = getHarmonics();

      // --- Label ---
      ctx.font = `600 ${16 * dpr}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = playing ? "rgba(200,175,230,0.9)" : "rgba(200,175,230,0.6)";
      ctx.fillText(getLabel(), padX, padY);

      // Play hint
      ctx.textAlign = "right";
      ctx.font = `${10 * dpr}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      ctx.fillStyle = playing ? "rgba(200,175,230,0.5)" : "rgba(255,255,255,0.15)";
      ctx.fillText(
        playing ? "\u25A0 click to stop" : "\u25B6 click to play",
        w - padX,
        padY + 3 * dpr,
      );

      // --- Waveform ---
      // Equilibrium
      ctx.setLineDash([3 * dpr, 4 * dpr]);
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.moveTo(padX, centerY);
      ctx.lineTo(padX + drawW, centerY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Compute composite wave from harmonics
      const samples = 400;
      const cycles = 3;

      // Find peak for normalization
      let peak = 0;
      for (let s = 0; s <= samples; s++) {
        const t = s / samples;
        let v = 0;
        for (let i = 0; i < NUM_HARMONICS; i++) {
          v += amps[i] * Math.sin((i + 1) * t * cycles * Math.PI * 2);
        }
        if (Math.abs(v) > peak) peak = Math.abs(v);
      }
      if (peak < 0.001) peak = 1;

      const amp = (waveH / 2 - 4 * dpr) / peak;

      ctx.beginPath();
      for (let s = 0; s <= samples; s++) {
        const t = s / samples;
        let v = 0;
        for (let i = 0; i < NUM_HARMONICS; i++) {
          v +=
            amps[i] *
            Math.sin((i + 1) * t * cycles * Math.PI * 2 + (playing ? phase * (i + 1) : 0));
        }
        const x = padX + t * drawW;
        const y = centerY - v * amp;
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = ACCENT + (playing ? "0.9)" : "0.45)");
      ctx.lineWidth = 2.5 * dpr;
      ctx.stroke();

      // --- Harmonic bars at bottom ---
      const barTop = h - padY - barAreaH + 10 * dpr;
      const barMaxH = barAreaH - 16 * dpr;
      const barGap = 3 * dpr;
      const totalBarW = drawW - barGap * (NUM_HARMONICS - 1);
      const barW = totalBarW / NUM_HARMONICS;

      // Find max harmonic amp for bar scaling
      let maxAmp = 0;
      for (let i = 0; i < NUM_HARMONICS; i++) {
        if (Math.abs(amps[i]) > maxAmp) maxAmp = Math.abs(amps[i]);
      }
      if (maxAmp < 0.001) maxAmp = 1;

      for (let i = 0; i < NUM_HARMONICS; i++) {
        const bx = padX + i * (barW + barGap);
        const bh = (Math.abs(amps[i]) / maxAmp) * barMaxH;
        const by = barTop + barMaxH - bh;

        const alpha = playing ? 0.6 + 0.4 * (Math.abs(amps[i]) / maxAmp) : 0.2 + 0.2 * (Math.abs(amps[i]) / maxAmp);
        ctx.fillStyle = ACCENT + alpha.toFixed(2) + ")";
        ctx.beginPath();
        ctx.roundRect(bx, by, barW, bh, 1.5 * dpr);
        ctx.fill();
      }

      // Bar label
      ctx.font = `${8 * dpr}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText("harmonics", padX, barTop - 2 * dpr);

      if (playing) {
        phase += 0.04;
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
