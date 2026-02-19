/**
 * circle-of-fifths demo
 * Shows the spiral of stacked perfect fifths vs the closed circle of
 * equal temperament. Animates building step-by-step. Click/tap a note
 * to hear it. The Pythagorean comma gap is highlighted at the end.
 */
registerDemo("circle-of-fifths", {
  init(container) {
    const canvas = document.createElement("canvas");
    container.appendChild(canvas);

    const NOTE_NAMES = [
      "C", "G", "D", "A", "E", "B",
      "F\u266F", "C\u266F", "G\u266F", "D\u266F", "A\u266F", "F",
    ];

    // Pythagorean: each fifth = 3/2, placed around the circle in fifth-order
    // Equal temperament: each fifth = 2^(7/12), exactly 30° apart
    const PURE_FIFTH = 3 / 2;
    const ET_FIFTH = Math.pow(2, 7 / 12);

    // Build Pythagorean ratios (stacking fifths, folding into one octave)
    const pythRatios = [1];
    for (let i = 1; i < 12; i++) {
      let r = Math.pow(PURE_FIFTH, i);
      while (r >= 2) r /= 2;
      pythRatios.push(r);
    }
    // The 13th fifth (back to "C") — this is where the comma shows
    const pythReturn = Math.pow(PURE_FIFTH, 12) / Math.pow(2, 7); // ≈1.01364

    // Equal temperament angles: each note exactly 30° = π/6
    // Pythagorean angles: proportional to cents above root
    function ratioToCents(r) { return 1200 * Math.log2(r); }

    const etAngles = [];
    const pythAngles = [];
    for (let i = 0; i < 12; i++) {
      // In circle-of-fifths order, note i is i steps of 7 semitones
      etAngles.push((i * 30) * Math.PI / 180 - Math.PI / 2);
      const cents = ratioToCents(pythRatios[i]);
      // Map cents of the chromatic position to angle
      // The note's chromatic position: i fifths = (i*7) % 12 semitones
      const chromatic = (i * 7) % 12;
      // Use the Pythagorean cents for this chromatic position
      pythAngles.push((chromatic * 30 + (cents - chromatic * 100) * 30 / 100) * Math.PI / 180 - Math.PI / 2);
    }

    // Interval names by chromatic semitone distance from C
    const INTERVAL_NAMES = [
      "unison", "minor 2nd", "major 2nd", "minor 3rd", "major 3rd",
      "perfect 4th", "tritone", "perfect 5th", "minor 6th",
      "major 6th", "minor 7th", "major 7th",
    ];

    // Chromatic position of each note in fifths-order
    function chromaticOf(i) { return (i * 7) % 12; }

    // Animation state
    let revealCount = 12;
    let showPyth = true;
    let hoverIdx = -1;

    // Audio
    let audioCtx = null;
    let activeOsc = null;
    let activeGain = null;

    function playNote(freqRatio) {
      if (!audioCtx)
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (activeOsc) {
        activeGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.02);
        const o = activeOsc, g = activeGain;
        setTimeout(() => { o.stop(); o.disconnect(); g.disconnect(); }, 100);
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = 261.63 * freqRatio; // C4 base
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      gain.gain.setTargetAtTime(0.15, audioCtx.currentTime, 0.02);
      gain.gain.setTargetAtTime(0, audioCtx.currentTime + 0.6, 0.15);
      activeOsc = osc;
      activeGain = gain;
      setTimeout(() => {
        if (activeOsc === osc) {
          osc.stop(); osc.disconnect(); gain.disconnect();
          activeOsc = null; activeGain = null;
        }
      }, 1500);
    }

    // Hit detection — uses current mode's positions
    function getNotePosn(i) {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const size = Math.min(canvas.width, canvas.height);
      const mainR = size * 0.34;
      const angle = showPyth ? pythAngles[i] : etAngles[i];
      const r = showPyth ? mainR * (1 - 0.008 * i) : mainR;
      return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
    }

    function pointerXY(e) {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      return { x: (e.clientX - rect.left) * dpr, y: (e.clientY - rect.top) * dpr };
    }

    // Toggle button layout (computed in draw, cached for hit testing)
    let toggleBtnRect = { x: 0, y: 0, w: 0, h: 0 };

    function hitNote(e) {
      const { x: px, y: py } = pointerXY(e);
      const size = Math.min(canvas.width, canvas.height);
      const dotR = size * 0.028;
      const dpr = window.devicePixelRatio || 1;

      for (let i = 0; i < revealCount; i++) {
        const { x: nx, y: ny } = getNotePosn(i);
        const dx = px - nx;
        const dy = py - ny;
        if (dx * dx + dy * dy < (dotR + 8 * dpr) * (dotR + 8 * dpr)) return i;
      }
      return -1;
    }

    function hitToggle(e) {
      const { x: px, y: py } = pointerXY(e);
      const b = toggleBtnRect;
      return px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h;
    }

    canvas.addEventListener("pointerdown", (e) => {
      if (hitToggle(e)) {
        showPyth = !showPyth;
        return;
      }
      const idx = hitNote(e);
      if (idx >= 0) {
        playNote(pythRatios[idx]);
      }
    });

    canvas.addEventListener("pointermove", (e) => {
      const idx = hitNote(e);
      hoverIdx = idx;
      canvas.style.cursor = (idx >= 0 || hitToggle(e)) ? "pointer" : "default";
    });

    canvas.addEventListener("pointerleave", () => {
      hoverIdx = -1;
      canvas.style.cursor = "default";
    });

    canvas.style.touchAction = "none";

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

      const cx = w / 2;
      const cy = h / 2;
      const size = Math.min(w, h);
      const mainR = size * 0.34;
      const dotR = size * 0.028;
      const labelR = mainR + dotR + 14 * dpr;

      const font = (sz, weight) =>
        `${weight || ""} ${sz * dpr}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.trim();

      revealCount = 12;

      // Draw connecting lines (the spiral of fifths)
      const hovering = hoverIdx >= 0;

      for (let i = 0; i < 12; i++) {
        const from = i;
        const to = (i + 1) % 12;

        // Pythagorean spiral: slight radius offset per step
        const rFrom = mainR * (1 - 0.008 * from);
        const rTo = mainR * (1 - 0.008 * to);
        const aFrom = showPyth ? pythAngles[from] : etAngles[from];
        const aTo = showPyth ? pythAngles[to] : etAngles[to];

        const x1 = cx + Math.cos(aFrom) * rFrom;
        const y1 = cy + Math.sin(aFrom) * rFrom;
        const x2 = cx + Math.cos(aTo) * rTo;
        const y2 = cy + Math.sin(aTo) * rTo;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);

        ctx.strokeStyle = hovering
          ? "rgba(140,100,180,0.1)"
          : "rgba(140,100,180,0.35)";
        ctx.lineWidth = 1.5 * dpr;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw ET reference circle (faint)
      ctx.beginPath();
      ctx.arc(cx, cy, mainR, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1 * dpr;
      ctx.stroke();

      // Draw note dots and labels
      // In fifths order: next = perfect 5th, prev = perfect 4th
      const fifthIdx = hovering ? (hoverIdx + 1) % 12 : -1;
      const fourthIdx = hovering ? (hoverIdx - 1 + 12) % 12 : -1;

      // Draw interval lines from hovered note to its 5th and 4th
      if (hovering) {
        const hPos = getNotePosn(hoverIdx);
        // Perfect 5th line (red dotted)
        const fPos = getNotePosn(fifthIdx);
        ctx.beginPath();
        ctx.moveTo(hPos.x, hPos.y);
        ctx.lineTo(fPos.x, fPos.y);
        ctx.strokeStyle = "rgba(255,100,100,0.55)";
        ctx.lineWidth = 2 * dpr;
        ctx.setLineDash([4 * dpr, 3 * dpr]);
        ctx.stroke();
        ctx.setLineDash([]);
        // Perfect 4th line (dimmer)
        const pPos = getNotePosn(fourthIdx);
        ctx.beginPath();
        ctx.moveTo(hPos.x, hPos.y);
        ctx.lineTo(pPos.x, pPos.y);
        ctx.strokeStyle = "rgba(200,175,230,0.3)";
        ctx.lineWidth = 1.5 * dpr;
        ctx.setLineDash([4 * dpr, 3 * dpr]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      for (let i = 0; i < 12; i++) {
        const angle = showPyth ? pythAngles[i] : etAngles[i];
        const r = showPyth ? mainR * (1 - 0.008 * i) : mainR;
        const nx = cx + Math.cos(angle) * r;
        const ny = cy + Math.sin(angle) * r;

        const isHover = hoverIdx === i;
        const isFifth = i === fifthIdx;
        const isFourth = i === fourthIdx;

        // Dot
        ctx.beginPath();
        ctx.arc(nx, ny, dotR * (isHover ? 1.3 : (isFifth || isFourth) ? 1.15 : 1), 0, Math.PI * 2);
        if (isHover) {
          ctx.fillStyle = "rgba(200,175,230,0.9)";
        } else if (isFifth) {
          ctx.fillStyle = "rgba(255,100,100,0.7)";
        } else if (isFourth) {
          ctx.fillStyle = "rgba(170,140,210,0.7)";
        } else {
          ctx.fillStyle = "rgba(140,100,180,0.5)";
        }
        ctx.fill();

        // Note name label
        const lx = cx + Math.cos(angle) * (labelR + (isHover ? 4 * dpr : 0));
        const ly = cy + Math.sin(angle) * (labelR + (isHover ? 4 * dpr : 0));
        ctx.font = font(isHover ? 12 : 10, isHover ? "600" : "");
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = isHover
          ? "rgba(200,175,230,0.9)"
          : (isFifth || isFourth)
            ? "rgba(255,255,255,0.5)"
            : hovering
              ? "rgba(255,255,255,0.25)"
              : "rgba(255,255,255,0.4)";

        // Note name — always shown; interval relative to hovered note below
        if (hovering) {
          const semitones = (chromaticOf(i) - chromaticOf(hoverIdx) + 12) % 12;
          ctx.fillText(NOTE_NAMES[i], lx, ly - 6 * dpr);
          // Interval label below
          ctx.font = font(7.5);
          if (isHover) {
            ctx.fillStyle = "rgba(200,175,230,0.5)";
          } else if (isFifth) {
            ctx.fillStyle = "rgba(255,100,100,0.6)";
          } else if (isFourth) {
            ctx.fillStyle = "rgba(170,140,210,0.5)";
          } else {
            ctx.fillStyle = "rgba(255,255,255,0.18)";
          }
          ctx.fillText(INTERVAL_NAMES[semitones], lx, ly + 6 * dpr);
        } else {
          ctx.fillText(NOTE_NAMES[i], lx, ly);
        }

        // Cents offset from ET (only in Pythagorean mode, only when not hovering)
        if (showPyth && i > 0 && !hovering) {
          const etCents = chromaticOf(i) * 100;
          const pythCents = ratioToCents(pythRatios[i]);
          const diff = pythCents - etCents;
          if (Math.abs(diff) > 0.5) {
            ctx.font = font(6.5);
            ctx.fillStyle = "rgba(255,255,255,0.2)";
            const offsetR = labelR + 12 * dpr;
            const ox = cx + Math.cos(angle) * offsetR;
            const oy = cy + Math.sin(angle) * offsetR;
            ctx.fillText(
              (diff > 0 ? "+" : "") + diff.toFixed(0) + "¢",
              ox, oy,
            );
          }
        }
      }

      // Pythagorean comma annotation
      if (showPyth) {
        const commaAngle = etAngles[0]; // near C at top
        const commaCents = ratioToCents(pythReturn);
        ctx.font = font(9);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "rgba(255,130,130,0.7)";
        ctx.fillText(
          "comma: " + commaCents.toFixed(1) + "¢",
          cx, cy + mainR + dotR + 36 * dpr,
        );
      }

      // Toggle button (top-left)
      const btnPad = 10 * dpr;
      const btnH = 22 * dpr;
      ctx.font = font(9);
      const pythLabel = "pythagorean";
      const etLabel = "equal temperament";
      const pythW = ctx.measureText(pythLabel).width + 12 * dpr;
      const etW = ctx.measureText(etLabel).width + 12 * dpr;
      const btnTotalW = pythW + etW;
      const btnX = btnPad;
      const btnY = btnPad;

      // Inactive tab
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.beginPath();
      ctx.roundRect(btnX, btnY, btnTotalW, btnH, 4 * dpr);
      ctx.fill();

      // Active tab highlight
      ctx.fillStyle = "rgba(140,100,180,0.25)";
      ctx.beginPath();
      if (showPyth) {
        ctx.roundRect(btnX, btnY, pythW, btnH, 4 * dpr);
      } else {
        ctx.roundRect(btnX + pythW, btnY, etW, btnH, 4 * dpr);
      }
      ctx.fill();

      // Labels
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillStyle = showPyth ? "rgba(200,175,230,0.9)" : "rgba(255,255,255,0.35)";
      ctx.fillText(pythLabel, btnX + pythW / 2, btnY + btnH / 2);
      ctx.fillStyle = !showPyth ? "rgba(200,175,230,0.9)" : "rgba(255,255,255,0.35)";
      ctx.fillText(etLabel, btnX + pythW + etW / 2, btnY + btnH / 2);

      // Cache rect for hit testing
      toggleBtnRect = { x: btnX, y: btnY, w: btnTotalW, h: btnH };
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
      if (activeOsc) {
        activeOsc.stop(); activeOsc.disconnect();
        activeGain.disconnect();
        activeOsc = null; activeGain = null;
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
