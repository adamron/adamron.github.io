/**
 * pressure-wave demo
 * 2D wave equation simulation. A draggable point source emits continuous
 * sinusoidal waves that propagate outward and reflect off the container walls.
 * Rendered as a color field: compression = bright purple, rarefaction = dark.
 */
registerDemo("pressure-wave", {
  init(container) {
    const canvas = document.createElement("canvas");
    container.appendChild(canvas);
    canvas.style.cursor = "grab";

    // --- Simulation grid ---
    const N = 200; // grid resolution
    let cur = new Float32Array(N * N);
    let prev = new Float32Array(N * N);
    let next = new Float32Array(N * N);

    const C = 0.25; // wave speed (must be < 0.5 for stability)
    const C2 = C * C;
    const DAMPING = 0.998; // slight energy loss each step
    const SOURCE_FREQ = 0.5; // oscillation frequency (Hz-like units)
    const SOURCE_AMP = 5.0;

    // Source position in grid coords
    let srcX = N / 2;
    let srcY = N / 2;
    let simTime = 0;

    function idx(x, y) {
      return y * N + x;
    }

    function stepSim() {
      // Wave equation: next = 2*cur - prev + c²*(laplacian), with damping
      for (let y = 1; y < N - 1; y++) {
        for (let x = 1; x < N - 1; x++) {
          const i = idx(x, y);
          const laplacian =
            cur[idx(x + 1, y)] +
            cur[idx(x - 1, y)] +
            cur[idx(x, y + 1)] +
            cur[idx(x, y - 1)] -
            4 * cur[i];
          next[i] = (2 * cur[i] - prev[i] + C2 * laplacian) * DAMPING;
        }
      }

      // Reflecting boundaries (Neumann: derivative = 0)
      for (let x = 0; x < N; x++) {
        next[idx(x, 0)] = next[idx(x, 1)];
        next[idx(x, N - 1)] = next[idx(x, N - 2)];
      }
      for (let y = 0; y < N; y++) {
        next[idx(0, y)] = next[idx(1, y)];
        next[idx(N - 1, y)] = next[idx(N - 2, y)];
      }

      // Inject source
      const si = idx(Math.round(srcX), Math.round(srcY));
      next[si] = SOURCE_AMP * Math.sin(simTime * SOURCE_FREQ * Math.PI * 2);
      simTime += 1 / 60;

      // Rotate buffers
      const tmp = prev;
      prev = cur;
      cur = next;
      next = tmp;
    }

    // --- Rendering ---
    let dpr = 1;
    let imgData = null;

    function resize() {
      const rect = container.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      imgData = null; // force re-create
    }

    function draw() {
      const ctx = canvas.getContext("2d");
      const w = canvas.width;
      const h = canvas.height;

      // We draw the NxN grid scaled to the canvas
      if (!imgData || imgData.width !== N || imgData.height !== N) {
        imgData = ctx.createImageData(N, N);
      }
      const data = imgData.data;

      for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
          const v = cur[idx(x, y)];
          const pi = (y * N + x) * 4;

          // Map pressure to color
          // Positive (compression): bright purple
          // Negative (rarefaction): dark indigo
          // Zero: dark background
          const t = Math.max(-1, Math.min(1, v));

          if (t > 0) {
            // Compression: background → bright purple
            data[pi] = Math.round(10 + 160 * t); // R
            data[pi + 1] = Math.round(10 + 100 * t); // G
            data[pi + 2] = Math.round(15 + 195 * t); // B
          } else {
            // Rarefaction: background → deep dark
            const s = -t;
            data[pi] = Math.round(10 - 8 * s); // R
            data[pi + 1] = Math.round(10 - 6 * s); // G
            data[pi + 2] = Math.round(15 + 25 * s); // B
          }
          data[pi + 3] = 255;
        }
      }

      // Draw at native grid size then scale up
      ctx.putImageData(imgData, 0, 0);

      // Scale the NxN image to fill the canvas
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "low";
      // Draw from the NxN region we just wrote, scale to full canvas
      ctx.drawImage(canvas, 0, 0, N, N, 0, 0, w, h);
      ctx.restore();

      // Draw source dot
      const dotX = (srcX / N) * w;
      const dotY = (srcY / N) * h;
      const dotR = 6 * dpr;

      // Outer glow
      const glow = ctx.createRadialGradient(
        dotX,
        dotY,
        0,
        dotX,
        dotY,
        dotR * 3,
      );
      glow.addColorStop(0, "rgba(200,170,240,0.3)");
      glow.addColorStop(1, "rgba(200,170,240,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(dotX, dotY, dotR * 3, 0, Math.PI * 2);
      ctx.fill();

      // Dot
      ctx.beginPath();
      ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
      ctx.fillStyle = "#d0c0e8";
      ctx.fill();
      ctx.lineWidth = 1.5 * dpr;
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.stroke();
    }

    // --- Dragging ---
    let dragging = false;

    function pointerToGrid(e) {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * N;
      const y = ((e.clientY - rect.top) / rect.height) * N;
      return {
        x: Math.max(3, Math.min(N - 4, x)),
        y: Math.max(3, Math.min(N - 4, y)),
      };
    }

    canvas.addEventListener("pointerdown", (e) => {
      const g = pointerToGrid(e);
      const dx = g.x - srcX;
      const dy = g.y - srcY;
      const hitR = N * 0.06; // generous hit target
      if (dx * dx + dy * dy < hitR * hitR) {
        dragging = true;
        canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor = "grabbing";
      }
    });

    canvas.addEventListener("pointermove", (e) => {
      if (dragging) {
        const g = pointerToGrid(e);
        srcX = g.x;
        srcY = g.y;
      } else {
        // Hover cursor
        const g = pointerToGrid(e);
        const dx = g.x - srcX;
        const dy = g.y - srcY;
        const hitR = N * 0.06;
        canvas.style.cursor =
          dx * dx + dy * dy < hitR * hitR ? "grab" : "default";
      }
    });

    canvas.addEventListener("pointerup", () => {
      dragging = false;
      canvas.style.cursor = "grab";
    });

    canvas.addEventListener("pointerleave", () => {
      if (!dragging) canvas.style.cursor = "grab";
    });

    canvas.style.touchAction = "none";

    // --- Animation loop ---
    let animId = 0;
    const STEPS_PER_FRAME = 3;

    function frame() {
      // Run multiple simulation steps per render for smoother waves
      for (let i = 0; i < STEPS_PER_FRAME; i++) {
        stepSim();
      }
      draw();
      animId = requestAnimationFrame(frame);
    }

    function start() {
      if (!animId) {
        animId = requestAnimationFrame(frame);
      }
    }

    function stop() {
      if (animId) {
        cancelAnimationFrame(animId);
        animId = 0;
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

    window.addEventListener("resize", () => {
      resize();
    });
    resize();
    start();
  },
});
