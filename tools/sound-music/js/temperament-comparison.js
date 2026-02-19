/**
 * temperament-comparison demo
 * Play the same interval in just intonation vs equal temperament.
 * Left half: just intonation waveform + audio.
 * Right half: equal temperament waveform + audio.
 * Click either side to hear. Slider selects the interval (1-11 semitones).
 */
registerDemo("temperament-comparison", {
  init(container) {
    const canvas = document.createElement("canvas");
    container.appendChild(canvas);

    const BASE_FREQ = 261.63; // C4

    // Just intonation ratios for each semitone interval
    const JUST_RATIOS = [
      null,    // 0 = unison (not used, slider starts at 1)
      16/15,   // 1 = minor 2nd
      9/8,     // 2 = major 2nd
      6/5,     // 3 = minor 3rd
      5/4,     // 4 = major 3rd
      4/3,     // 5 = perfect 4th
      7/5,     // 6 = tritone
      3/2,     // 7 = perfect 5th
      8/5,     // 8 = minor 6th
      5/3,     // 9 = major 6th
      9/5,     // 10 = minor 7th
      15/8,    // 11 = major 7th
    ];

    const INTERVAL_NAMES = [
      "unison", "minor 2nd", "major 2nd", "minor 3rd", "major 3rd",
      "perfect 4th", "tritone", "perfect 5th", "minor 6th",
      "major 6th", "minor 7th", "major 7th",
    ];

    function ratioLabel(r) {
      // Find a clean fraction label
      const fracs = [
        [16,15],[9,8],[6,5],[5,4],[4,3],[7,5],
        [3,2],[8,5],[5,3],[9,5],[15,8],
      ];
      for (const [n, d] of fracs) {
        if (Math.abs(r - n/d) < 0.0001) return n + ":" + d;
      }
      return r.toFixed(4);
    }

    let interval = 7;
    let playingJust = false;
    let playingET = false;
    let phase = 0;

    const wrap = container.closest(".demo-container");
    const slider = wrap.querySelector('[data-control="interval"]');
    if (slider) {
      interval = parseInt(slider.value, 10);
      slider.addEventListener("input", () => {
        interval = parseInt(slider.value, 10);
        // Update playing oscillators
        if (playingJust && oscJustB) {
          oscJustB.frequency.setTargetAtTime(
            BASE_FREQ * JUST_RATIOS[interval], audioCtx.currentTime, 0.01,
          );
        }
        if (playingET && oscETB) {
          oscETB.frequency.setTargetAtTime(
            BASE_FREQ * Math.pow(2, interval / 12), audioCtx.currentTime, 0.01,
          );
        }
      });
    }

    // --- Web Audio ---
    let audioCtx = null;
    let oscJustA = null, oscJustB = null, gainJust = null;
    let oscETA = null, oscETB = null, gainET = null;

    function ensureCtx() {
      if (!audioCtx)
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    function startJust() {
      if (oscJustA) return;
      ensureCtx();
      gainJust = audioCtx.createGain();
      gainJust.gain.value = 0;
      gainJust.connect(audioCtx.destination);

      oscJustA = audioCtx.createOscillator();
      oscJustA.type = "sine";
      oscJustA.frequency.value = BASE_FREQ;
      oscJustA.connect(gainJust);
      oscJustA.start();

      oscJustB = audioCtx.createOscillator();
      oscJustB.type = "sine";
      oscJustB.frequency.value = BASE_FREQ * JUST_RATIOS[interval];
      oscJustB.connect(gainJust);
      oscJustB.start();

      gainJust.gain.setTargetAtTime(0.12, audioCtx.currentTime, 0.03);
    }

    function stopJust() {
      if (!oscJustA) return;
      gainJust.gain.setTargetAtTime(0, audioCtx.currentTime, 0.04);
      const nodes = [oscJustA, oscJustB, gainJust];
      setTimeout(() => nodes.forEach((n) => { n.stop?.(); n.disconnect(); }), 200);
      oscJustA = null; oscJustB = null; gainJust = null;
    }

    function startET() {
      if (oscETA) return;
      ensureCtx();
      gainET = audioCtx.createGain();
      gainET.gain.value = 0;
      gainET.connect(audioCtx.destination);

      oscETA = audioCtx.createOscillator();
      oscETA.type = "sine";
      oscETA.frequency.value = BASE_FREQ;
      oscETA.connect(gainET);
      oscETA.start();

      oscETB = audioCtx.createOscillator();
      oscETB.type = "sine";
      oscETB.frequency.value = BASE_FREQ * Math.pow(2, interval / 12);
      oscETB.connect(gainET);
      oscETB.start();

      gainET.gain.setTargetAtTime(0.12, audioCtx.currentTime, 0.03);
    }

    function stopET() {
      if (!oscETA) return;
      gainET.gain.setTargetAtTime(0, audioCtx.currentTime, 0.04);
      const nodes = [oscETA, oscETB, gainET];
      setTimeout(() => nodes.forEach((n) => { n.stop?.(); n.disconnect(); }), 200);
      oscETA = null; oscETB = null; gainET = null;
    }

    // --- Interaction ---
    canvas.addEventListener("pointerdown", (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      if (x < 0.5) {
        if (playingJust) { playingJust = false; stopJust(); }
        else { playingJust = true; startJust(); }
      } else {
        if (playingET) { playingET = false; stopET(); }
        else { playingET = true; startET(); }
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

      const padX = 24 * dpr;
      const padY = 16 * dpr;
      const gap = 16 * dpr;
      const halfW = Math.floor((w - padX * 2 - gap) / 2);
      const leftX = padX;
      const rightX = padX + halfW + gap;
      const headerH = 38 * dpr;
      const contentTop = padY + headerH;
      const contentH = h - contentTop - padY;

      const font = (sz, weight) =>
        `${weight || ""} ${sz * dpr}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.trim();

      const justRatio = JUST_RATIOS[interval];
      const etRatio = Math.pow(2, interval / 12);
      const centsDiff = Math.abs(1200 * Math.log2(justRatio / etRatio));
      const name = INTERVAL_NAMES[interval];

      // --- Draw each side ---
      const sides = [
        {
          x: leftX, w: halfW,
          title: "just intonation",
          subtitle: ratioLabel(justRatio) + "  (" + (BASE_FREQ * justRatio).toFixed(1) + " Hz)",
          ratio: justRatio, playing: playingJust,
          color: "100,180,140",
        },
        {
          x: rightX, w: halfW,
          title: "equal temperament",
          subtitle: "2^(" + interval + "/12)  (" + (BASE_FREQ * etRatio).toFixed(1) + " Hz)",
          ratio: etRatio, playing: playingET,
          color: "140,100,180",
        },
      ];

      // Shared header
      ctx.font = font(13, "600");
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(200,175,230,0.8)";
      ctx.fillText(name, padX, padY);

      ctx.font = font(9);
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.fillText(
        "difference: " + centsDiff.toFixed(1) + " cents",
        padX, padY + 16 * dpr,
      );

      const visibleTime = 3 / BASE_FREQ;
      const samples = 300;

      for (const side of sides) {
        const centerY = contentTop + contentH / 2;

        // Title
        ctx.font = font(9);
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.fillText(side.title, side.x, contentTop - 3 * dpr);

        // Play state
        ctx.textAlign = "right";
        ctx.font = font(8);
        ctx.fillStyle = side.playing
          ? `rgba(${side.color},0.6)`
          : "rgba(255,255,255,0.12)";
        ctx.fillText(
          side.playing ? "\u25A0 stop" : "\u25B6 play",
          side.x + side.w, contentTop - 3 * dpr,
        );

        // Equilibrium
        ctx.setLineDash([3 * dpr, 4 * dpr]);
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        ctx.moveTo(side.x, centerY);
        ctx.lineTo(side.x + side.w, centerY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Combined waveform (base + interval)
        const amp = contentH / 2 - 4 * dpr;
        const vals = [];
        let peak = 0;
        for (let s = 0; s <= samples; s++) {
          const t = s / samples;
          const time = t * visibleTime;
          const v1 = Math.sin(2 * Math.PI * BASE_FREQ * time + (side.playing ? phase : 0));
          const v2 = Math.sin(2 * Math.PI * BASE_FREQ * side.ratio * time + (side.playing ? phase * side.ratio : 0));
          const v = (v1 + v2) / 2;
          vals.push(v);
          if (Math.abs(v) > peak) peak = Math.abs(v);
        }
        if (peak < 0.001) peak = 1;
        const scale = amp / peak;

        ctx.beginPath();
        for (let s = 0; s <= samples; s++) {
          const x = side.x + (s / samples) * side.w;
          const y = centerY - vals[s] * scale;
          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const alpha = side.playing ? 0.85 : 0.35;
        ctx.strokeStyle = `rgba(${side.color},${alpha})`;
        ctx.lineWidth = 2 * dpr;
        ctx.stroke();

        // Subtitle (ratio info)
        ctx.font = font(7.5);
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.fillText(side.subtitle, side.x, contentTop + contentH + 4 * dpr);
      }

      // Divider
      const divX = padX + halfW + gap / 2;
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.moveTo(divX, contentTop);
      ctx.lineTo(divX, contentTop + contentH);
      ctx.stroke();

      if (playingJust || playingET) phase += 0.04;
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
      if (playingJust) { playingJust = false; stopJust(); }
      if (playingET) { playingET = false; stopET(); }
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
