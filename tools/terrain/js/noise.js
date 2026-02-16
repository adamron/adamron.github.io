/**
 * Shared noise primitives used by multiple demos.
 * Exposed as window.TerrainNoise.
 */
var TerrainNoise = (function () {
  const SIZE = 256;

  // --- Permutation table ---
  function buildPerm() {
    const p = new Uint8Array(SIZE);
    for (let i = 0; i < SIZE; i++) p[i] = i;
    for (let i = SIZE - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = p[i]; p[i] = p[j]; p[j] = tmp;
    }
    const out = new Uint8Array(SIZE * 2);
    for (let i = 0; i < SIZE * 2; i++) out[i] = p[i % SIZE];
    return out;
  }

  // --- Value table ---
  function buildValueTable() {
    const t = new Float32Array(SIZE);
    for (let i = 0; i < SIZE; i++) t[i] = Math.random();
    return t;
  }

  // Perlin improved smoothstep: 6t^5 - 15t^4 + 10t^3
  function smoothstep(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  // --- Value noise 2D ---
  function valueNoise2D(x, y, perm, valueTable) {
    const xi = Math.floor(x) & (SIZE - 1);
    const yi = Math.floor(y) & (SIZE - 1);
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = smoothstep(xf);
    const v = smoothstep(yf);

    const v00 = valueTable[perm[perm[xi] + yi] % SIZE];
    const v10 = valueTable[perm[perm[xi + 1] + yi] % SIZE];
    const v01 = valueTable[perm[perm[xi] + yi + 1] % SIZE];
    const v11 = valueTable[perm[perm[xi + 1] + yi + 1] % SIZE];

    const a = v00 + u * (v10 - v00);
    const b = v01 + u * (v11 - v01);
    return a + v * (b - a);
  }

  // --- Gradient (Perlin) noise 2D ---
  var GRADS = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [-1, 1], [1, -1], [-1, -1]
  ];

  function grad2D(hash, x, y) {
    var g = GRADS[hash & 7];
    return g[0] * x + g[1] * y;
  }

  function perlinNoise2D(x, y, perm) {
    const xi = Math.floor(x) & (SIZE - 1);
    const yi = Math.floor(y) & (SIZE - 1);
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = smoothstep(xf);
    const v = smoothstep(yf);

    const aa = perm[perm[xi] + yi];
    const ab = perm[perm[xi] + yi + 1];
    const ba = perm[perm[xi + 1] + yi];
    const bb = perm[perm[xi + 1] + yi + 1];

    const g00 = grad2D(aa, xf, yf);
    const g10 = grad2D(ba, xf - 1, yf);
    const g01 = grad2D(ab, xf, yf - 1);
    const g11 = grad2D(bb, xf - 1, yf - 1);

    const a = g00 + u * (g10 - g00);
    const b = g01 + u * (g11 - g01);
    return a + v * (b - a);
  }

  // --- fBm ---
  function perlinFbm(x, y, perm, freq, octaves, persistence, lacunarity) {
    let sum = 0, amp = 1, f = freq, maxAmp = 0;
    for (let o = 0; o < octaves; o++) {
      sum += amp * perlinNoise2D(x * f, y * f, perm);
      maxAmp += amp;
      amp *= persistence;
      f *= lacunarity;
    }
    return sum / maxAmp * 0.5 + 0.5;
  }

  function valueFbm(x, y, perm, valueTable, freq, octaves, persistence, lacunarity) {
    let sum = 0, amp = 1, f = freq, maxAmp = 0;
    for (let o = 0; o < octaves; o++) {
      sum += amp * valueNoise2D(x * f, y * f, perm, valueTable);
      maxAmp += amp;
      amp *= persistence;
      f *= lacunarity;
    }
    return sum / maxAmp;
  }

  // --- Seeded PRNG (mulberry32) ---
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function buildPermSeeded(seed) {
    var rng = mulberry32(seed);
    const p = new Uint8Array(SIZE);
    for (let i = 0; i < SIZE; i++) p[i] = i;
    for (let i = SIZE - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = p[i]; p[i] = p[j]; p[j] = tmp;
    }
    const out = new Uint8Array(SIZE * 2);
    for (let i = 0; i < SIZE * 2; i++) out[i] = p[i % SIZE];
    return out;
  }

  // --- Heightmap rendering helper ---
  function renderHeightmap(canvas, res, noiseFn) {
    canvas.width = res;
    canvas.height = res;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(res, res);
    const data = imgData.data;
    for (let py = 0; py < res; py++) {
      for (let px = 0; px < res; px++) {
        const v = Math.max(0, Math.min(1, noiseFn(px / res, py / res)));
        const c = Math.round(v * 255);
        const idx = (py * res + px) * 4;
        data[idx] = c;
        data[idx + 1] = c;
        data[idx + 2] = c;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  return {
    SIZE: SIZE,
    buildPerm: buildPerm,
    buildValueTable: buildValueTable,
    smoothstep: smoothstep,
    valueNoise2D: valueNoise2D,
    perlinNoise2D: perlinNoise2D,
    perlinFbm: perlinFbm,
    valueFbm: valueFbm,
    renderHeightmap: renderHeightmap,
    mulberry32: mulberry32,
    buildPermSeeded: buildPermSeeded
  };
})();
