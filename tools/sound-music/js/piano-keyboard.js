/**
 * piano-keyboard demo
 * Interactive two-octave keyboard (C4–B5). Click/touch keys to hear notes.
 * Scale slider highlights notes belonging to: chromatic, major, natural minor,
 * or pentatonic scale. Shows note names and frequencies.
 */
registerDemo("piano-keyboard", {
  init(container) {
    const canvas = document.createElement("canvas");
    container.appendChild(canvas);

    // 24 semitones = 2 octaves starting from C4
    const START_NOTE = 60; // MIDI C4
    const NUM_KEYS = 25;   // C4 through C6 inclusive
    const A4_FREQ = 440;

    const NOTE_NAMES = ["C","C\u266F","D","D\u266F","E","F","F\u266F","G","G\u266F","A","A\u266F","B"];

    function isBlack(midi) {
      const n = midi % 12;
      return [1,3,6,8,10].includes(n);
    }

    function midiToFreq(midi) {
      return A4_FREQ * Math.pow(2, (midi - 69) / 12);
    }

    function midiToName(midi) {
      return NOTE_NAMES[midi % 12] + Math.floor(midi / 12 - 1);
    }

    // Scale patterns (semitone offsets from root)
    const SCALES = [
      { name: "chromatic", notes: [0,1,2,3,4,5,6,7,8,9,10,11] },
      { name: "major", notes: [0,2,4,5,7,9,11] },
      { name: "natural minor", notes: [0,2,3,5,7,8,10] },
      { name: "pentatonic", notes: [0,2,4,7,9] },
    ];

    let scaleIdx = 0;

    const wrap = container.closest(".demo-container");
    const slider = wrap.querySelector('[data-control="scale-type"]');
    if (slider) {
      scaleIdx = parseInt(slider.value, 10);
      slider.addEventListener("input", () => {
        scaleIdx = parseInt(slider.value, 10);
      });
    }

    function inScale(midi) {
      const degree = midi % 12;
      // Scale rooted at C
      return SCALES[scaleIdx].notes.includes(degree);
    }

    // --- Layout: compute key rects ---
    // White keys are evenly spaced; black keys overlay between them
    function getKeyRects() {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width;
      const h = canvas.height;
      const padX = 12 * dpr;
      const topPad = 32 * dpr;
      const botPad = 8 * dpr;
      const keyAreaW = w - padX * 2;
      const keyAreaH = h - topPad - botPad;

      // Count white keys
      const whites = [];
      for (let i = 0; i < NUM_KEYS; i++) {
        if (!isBlack(START_NOTE + i)) whites.push(i);
      }
      const whiteW = keyAreaW / whites.length;
      const blackW = whiteW * 0.6;
      const blackH = keyAreaH * 0.6;

      const rects = [];
      let wIdx = 0;
      const whiteXMap = {};

      // First pass: white keys
      for (let i = 0; i < NUM_KEYS; i++) {
        const midi = START_NOTE + i;
        if (!isBlack(midi)) {
          const x = padX + wIdx * whiteW;
          rects.push({
            midi, i, x, y: topPad, w: whiteW, h: keyAreaH, black: false,
          });
          whiteXMap[i] = x;
          wIdx++;
        }
      }

      // Second pass: black keys (positioned between their neighboring white keys)
      for (let i = 0; i < NUM_KEYS; i++) {
        const midi = START_NOTE + i;
        if (isBlack(midi)) {
          // Find the white key just before this black key
          const prevWhiteX = whiteXMap[i - 1];
          const x = prevWhiteX + whiteW - blackW / 2;
          rects.push({
            midi, i, x, y: topPad, w: blackW, h: blackH, black: true,
          });
        }
      }

      return { rects, topPad, keyAreaH, padX, whiteW };
    }

    // --- Audio ---
    let audioCtx = null;
    let activeNotes = new Map(); // midi → {osc, gain}

    function noteOn(midi) {
      if (activeNotes.has(midi)) return;
      if (!audioCtx)
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = midiToFreq(midi);
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      gain.gain.setTargetAtTime(0.15, audioCtx.currentTime, 0.01);
      activeNotes.set(midi, { osc, gain });
    }

    function noteOff(midi) {
      const n = activeNotes.get(midi);
      if (!n) return;
      activeNotes.delete(midi);
      n.gain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
      setTimeout(() => { n.osc.stop(); n.osc.disconnect(); n.gain.disconnect(); }, 200);
    }

    // --- Interaction ---
    let pressedKey = -1; // midi of currently pressed key

    function hitKey(e) {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const px = (e.clientX - rect.left) * dpr;
      const py = (e.clientY - rect.top) * dpr;
      const { rects } = getKeyRects();

      // Check black keys first (they're on top)
      for (const k of rects) {
        if (!k.black) continue;
        if (px >= k.x && px <= k.x + k.w && py >= k.y && py <= k.y + k.h) {
          return k.midi;
        }
      }
      // Then white keys
      for (const k of rects) {
        if (k.black) continue;
        if (px >= k.x && px <= k.x + k.w && py >= k.y && py <= k.y + k.h) {
          return k.midi;
        }
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
        if (midi >= 0) {
          pressedKey = midi;
          noteOn(midi);
        } else {
          pressedKey = -1;
        }
      }
    });

    canvas.addEventListener("pointerup", () => {
      if (pressedKey >= 0) {
        noteOff(pressedKey);
        pressedKey = -1;
      }
    });

    canvas.addEventListener("pointercancel", () => {
      if (pressedKey >= 0) {
        noteOff(pressedKey);
        pressedKey = -1;
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

      const { rects, topPad, padX } = getKeyRects();
      const scale = SCALES[scaleIdx];

      const font = (sz, weight) =>
        `${weight || ""} ${sz * dpr}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.trim();

      // Header
      ctx.font = font(12, "600");
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(200,175,230,0.8)";
      ctx.fillText(scale.name + " scale", padX, 8 * dpr);

      ctx.font = font(9);
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillText("click to play", w - padX, 10 * dpr);

      // Draw white keys first, then black on top
      for (const pass of [false, true]) {
        for (const k of rects) {
          if (k.black !== pass) continue;

          const active = inScale(k.midi);
          const pressed = k.midi === pressedKey;
          const playing = activeNotes.has(k.midi);

          if (k.black) {
            // Black key
            if (pressed || playing) {
              ctx.fillStyle = "rgba(140,100,180,0.7)";
            } else if (!active) {
              ctx.fillStyle = "rgba(30,28,35,0.95)";
            } else {
              ctx.fillStyle = "rgba(40,36,50,0.95)";
            }
            ctx.beginPath();
            ctx.roundRect(k.x, k.y, k.w, k.h, [0, 0, 3 * dpr, 3 * dpr]);
            ctx.fill();

            // Border
            ctx.strokeStyle = "rgba(255,255,255,0.08)";
            ctx.lineWidth = 1 * dpr;
            ctx.beginPath();
            ctx.roundRect(k.x, k.y, k.w, k.h, [0, 0, 3 * dpr, 3 * dpr]);
            ctx.stroke();

            // Scale highlight dot
            if (active && scaleIdx > 0) {
              ctx.beginPath();
              ctx.arc(k.x + k.w / 2, k.y + k.h - 10 * dpr, 3 * dpr, 0, Math.PI * 2);
              ctx.fillStyle = pressed ? "rgba(200,175,230,0.9)" : "rgba(140,100,180,0.6)";
              ctx.fill();
            }
          } else {
            // White key
            if (pressed || playing) {
              ctx.fillStyle = "rgba(160,130,200,0.3)";
            } else if (!active) {
              ctx.fillStyle = "rgba(255,255,255,0.04)";
            } else {
              ctx.fillStyle = "rgba(255,255,255,0.08)";
            }
            ctx.beginPath();
            ctx.roundRect(k.x + 1, k.y, k.w - 2, k.h, [0, 0, 3 * dpr, 3 * dpr]);
            ctx.fill();

            // Border
            ctx.strokeStyle = "rgba(255,255,255,0.06)";
            ctx.lineWidth = 1 * dpr;
            ctx.beginPath();
            ctx.roundRect(k.x + 1, k.y, k.w - 2, k.h, [0, 0, 3 * dpr, 3 * dpr]);
            ctx.stroke();

            // Note name at bottom
            ctx.font = font(7);
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";

            const isC = k.midi % 12 === 0;
            if (active || isC) {
              ctx.fillStyle = (pressed || playing)
                ? "rgba(200,175,230,0.9)"
                : active
                  ? "rgba(255,255,255,0.35)"
                  : "rgba(255,255,255,0.12)";
              ctx.fillText(
                midiToName(k.midi),
                k.x + k.w / 2, k.y + k.h - 4 * dpr,
              );
            }

            // Scale highlight dot
            if (active && scaleIdx > 0) {
              ctx.beginPath();
              ctx.arc(k.x + k.w / 2, k.y + k.h - 18 * dpr, 3 * dpr, 0, Math.PI * 2);
              ctx.fillStyle = pressed ? "rgba(200,175,230,0.9)" : "rgba(140,100,180,0.5)";
              ctx.fill();
            }
          }
        }
      }

      // Frequency label for pressed key
      if (pressedKey >= 0) {
        ctx.font = font(9);
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillStyle = "rgba(200,175,230,0.7)";
        ctx.fillText(
          midiToName(pressedKey) + "  " + midiToFreq(pressedKey).toFixed(1) + " Hz",
          padX, 20 * dpr,
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
