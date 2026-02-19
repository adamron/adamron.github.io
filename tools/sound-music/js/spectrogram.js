/**
 * Shared spectrogram buffer utility.
 * Creates a scrolling spectrogram from real FFT data (AnalyserNode).
 *
 * Usage:
 *   const spect = createSpectrogram();
 *   spect.ensure(width, height);          // resize buffer
 *   spect.pushColumn(freqData, sampleRate, fftSize, maxFreq);  // paint FFT
 *   spect.pushSilent();                   // scroll with no data
 *   ctx.drawImage(spect.canvas, ...);     // blit to main canvas
 */
// eslint-disable-next-line no-unused-vars
function createSpectrogram() {
  let canvas = null;
  let sCtx = null;
  let w = 0;
  let h = 0;

  function ensure(newW, newH) {
    if (canvas && w === newW && h === newH) return;
    canvas = document.createElement("canvas");
    canvas.width = newW;
    canvas.height = newH;
    sCtx = canvas.getContext("2d");
    sCtx.fillStyle = "#0a0a0a";
    sCtx.fillRect(0, 0, newW, newH);
    w = newW;
    h = newH;
  }

  function pushSilent() {
    sCtx.drawImage(canvas, -1, 0);
    sCtx.fillStyle = "#0a0a0a";
    sCtx.fillRect(w - 1, 0, 1, h);
  }

  function pushColumn(freqData, sampleRate, fftSize, maxFreq) {
    sCtx.drawImage(canvas, -1, 0);
    sCtx.fillStyle = "#0a0a0a";
    sCtx.fillRect(w - 1, 0, 1, h);

    const binCount = freqData.length;
    const binFreqWidth = sampleRate / fftSize;
    const maxBin = Math.min(binCount, Math.ceil(maxFreq / binFreqWidth));

    for (let row = 0; row < h; row++) {
      const freq = ((h - 1 - row) / (h - 1)) * maxFreq;
      const bin = freq / binFreqWidth;
      const binLow = Math.floor(bin);
      const binHigh = Math.min(binLow + 1, maxBin - 1);
      const frac = bin - binLow;

      if (binLow >= maxBin) continue;

      const db = freqData[binLow] + (freqData[binHigh] - freqData[binLow]) * frac;
      const intensity = Math.max(0, Math.min(1, (db + 90) / 70));
      if (intensity < 0.01) continue;

      // Warm colormap: dark purple → magenta → peach → white
      const i2 = Math.sqrt(intensity);
      const r = Math.round(30 + 225 * i2);
      const g = Math.round(10 + 180 * i2 * i2);
      const b = Math.round(40 + 160 * i2);

      sCtx.fillStyle = `rgb(${r},${g},${b})`;
      sCtx.fillRect(w - 1, row, 1, 1);
    }
  }

  return {
    get canvas() { return canvas; },
    get width() { return w; },
    get height() { return h; },
    ensure,
    pushColumn,
    pushSilent,
  };
}
