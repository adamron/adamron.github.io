/**
 * wave-anatomy demo
 * Draws a sine wave with labeled measurements: wavelength, amplitude,
 * and equilibrium line. Frequency and amplitude are adjustable via sliders.
 */
registerDemo("wave-anatomy", {
  init(container) {
    const canvas = document.createElement("canvas");
    container.appendChild(canvas);

    const WAVE_COLOR = "#9070c0";
    const FILL_COLOR = "rgba(140,100,180,0.08)";
    const MARKER_COLOR = "rgba(200,175,230,0.7)";
    const DIM_COLOR = "rgba(255,255,255,0.15)";
    const LABEL_COLOR = "rgba(200,175,230,0.85)";
    const SAMPLES = 500;

    let frequency = 4;
    let amplitude = 0.7;

    const wrap = container.closest(".demo-container");
    const freqSlider = wrap.querySelector('[data-control="frequency"]');
    const ampSlider = wrap.querySelector('[data-control="amplitude"]');

    if (freqSlider) {
      frequency = parseInt(freqSlider.value, 10);
      freqSlider.addEventListener("input", () => {
        frequency = parseInt(freqSlider.value, 10);
      });
    }
    if (ampSlider) {
      amplitude = parseInt(ampSlider.value, 10) / 100;
      ampSlider.addEventListener("input", () => {
        amplitude = parseInt(ampSlider.value, 10) / 100;
      });
    }

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

      const padX = 40 * dpr;
      const padY = 36 * dpr;
      const drawW = w - padX * 2;
      const drawH = h - padY * 2;
      const centerY = padY + drawH / 2;
      const maxAmp = drawH / 2;
      const amp = amplitude * maxAmp;

      const font = (size) =>
        `${size * dpr}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;

      // --- Equilibrium line ---
      ctx.setLineDash([4 * dpr, 4 * dpr]);
      ctx.strokeStyle = DIM_COLOR;
      ctx.lineWidth = 1 * dpr;
      ctx.beginPath();
      ctx.moveTo(padX, centerY);
      ctx.lineTo(padX + drawW, centerY);
      ctx.stroke();
      ctx.setLineDash([]);

      // --- Draw sine wave ---
      ctx.beginPath();
      for (let i = 0; i <= SAMPLES; i++) {
        const t = i / SAMPLES;
        const x = padX + t * drawW;
        const y = centerY - amp * Math.sin(t * frequency * Math.PI * 2);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = WAVE_COLOR;
      ctx.lineWidth = 2.5 * dpr;
      ctx.stroke();

      // --- Fill under curve ---
      ctx.lineTo(padX + drawW, centerY);
      ctx.lineTo(padX, centerY);
      ctx.closePath();
      ctx.fillStyle = FILL_COLOR;
      ctx.fill();

      // --- Wavelength marker ---
      // Show between the first two peaks
      if (frequency >= 1) {
        const wl = drawW / frequency; // one wavelength in pixels
        const peakX1 = padX + wl * 0.25; // first peak at 1/4 wavelength
        const peakX2 = peakX1 + wl;

        if (peakX2 <= padX + drawW + 1) {
          const markerY = centerY - amp - 16 * dpr;

          // Horizontal line with end caps
          ctx.strokeStyle = MARKER_COLOR;
          ctx.lineWidth = 1.5 * dpr;
          ctx.beginPath();
          ctx.moveTo(peakX1, markerY);
          ctx.lineTo(peakX2, markerY);
          ctx.stroke();

          // End caps
          const capH = 5 * dpr;
          ctx.beginPath();
          ctx.moveTo(peakX1, markerY - capH);
          ctx.lineTo(peakX1, markerY + capH);
          ctx.moveTo(peakX2, markerY - capH);
          ctx.lineTo(peakX2, markerY + capH);
          ctx.stroke();

          // Dashed lines down to peaks
          ctx.setLineDash([3 * dpr, 3 * dpr]);
          ctx.strokeStyle = DIM_COLOR;
          ctx.lineWidth = 1 * dpr;
          ctx.beginPath();
          ctx.moveTo(peakX1, markerY + capH);
          ctx.lineTo(peakX1, centerY - amp);
          ctx.moveTo(peakX2, markerY + capH);
          ctx.lineTo(peakX2, centerY - amp);
          ctx.stroke();
          ctx.setLineDash([]);

          // Label
          ctx.font = font(11);
          ctx.fillStyle = LABEL_COLOR;
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText("wavelength \u03BB", (peakX1 + peakX2) / 2, markerY - 4 * dpr);
        }
      }

      // --- Amplitude marker ---
      // Show at the first peak
      if (frequency >= 1 && amp > 8 * dpr) {
        const wl = drawW / frequency;
        const peakX = padX + wl * 0.25;
        const markerX = peakX + 14 * dpr;

        ctx.strokeStyle = MARKER_COLOR;
        ctx.lineWidth = 1.5 * dpr;
        ctx.beginPath();
        ctx.moveTo(markerX, centerY);
        ctx.lineTo(markerX, centerY - amp);
        ctx.stroke();

        // End caps
        const capW = 5 * dpr;
        ctx.beginPath();
        ctx.moveTo(markerX - capW, centerY);
        ctx.lineTo(markerX + capW, centerY);
        ctx.moveTo(markerX - capW, centerY - amp);
        ctx.lineTo(markerX + capW, centerY - amp);
        ctx.stroke();

        // Label
        ctx.font = font(11);
        ctx.fillStyle = LABEL_COLOR;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText("amplitude", markerX + 8 * dpr, centerY - amp / 2);
      }

      // --- Axis labels ---
      ctx.font = font(10);
      ctx.fillStyle = DIM_COLOR;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("time \u2192", padX + drawW / 2, padY + drawH + 8 * dpr);

      ctx.save();
      ctx.translate(padX - 12 * dpr, centerY);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText("pressure", 0, 0);
      ctx.restore();
    }

    window.addEventListener("resize", () => {
      resize();
      draw();
    });
    if (freqSlider) freqSlider.addEventListener("input", draw);
    if (ampSlider) ampSlider.addEventListener("input", draw);

    resize();
    draw();
  },
});
