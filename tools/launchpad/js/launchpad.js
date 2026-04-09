/**
 * Launchpad MK2 engine — pure logic, no DOM dependencies.
 *
 * Usage (browser):
 *   var lp = Launchpad.create();
 *   lp.pressPad(3, 4, performance.now());
 *   var frame = lp.update(performance.now());
 *   // frame[row][col] → [r, g, b]  (0-255 each)
 *
 * Usage (Node):
 *   var Launchpad = require('./launchpad');
 *   var lp = Launchpad.create({ mode: 0, palette: 5 });
 */
var Launchpad = (function () {
  'use strict';

  /* ── constants ──────────────────────────────────────────────── */

  var SIZE = 8;

  var PALETTES = [
    { name: 'Fire',    colors: [[80,0,0],[255,30,0],[255,160,0],[255,255,60]] },
    { name: 'Ocean',   colors: [[0,20,80],[0,80,220],[0,190,255],[60,255,220]] },
    { name: 'Forest',  colors: [[0,50,0],[0,160,20],[60,220,0],[160,255,60]] },
    { name: 'Violet',  colors: [[50,0,90],[140,0,220],[200,40,255],[255,120,255]] },
    { name: 'Gold',    colors: [[80,40,0],[200,140,0],[255,200,0],[255,240,120]] },
    { name: 'Rainbow', colors: [[255,0,0],[255,255,0],[0,255,60],[0,120,255],[180,0,255]] },
    { name: 'Pastel',  colors: [[255,170,170],[255,255,170],[170,255,170],[170,170,255]] },
    { name: 'Mono',    colors: [[60,60,60],[140,140,140],[220,220,220],[255,255,255]] }
  ];

  var MODE_NAMES = ['Ripple','Paint','Pulse','Life','Rain','Faders','Wave','Spectrum'];

  var MODE_DESCS = [
    'Tap pads to send expanding color rings',
    'Click or drag to paint pads, click again to erase',
    'Tap to radiate concentric wave pulses',
    'Tap to seed cells \u2014 Conway\u2019s Game of Life auto-steps',
    'Tap columns to spawn falling rain trails',
    'Tap to set column levels like a mixer',
    'Tap to change wave amplitude and frequency',
    'Tap to cycle through spectrum patterns'
  ];

  var MODE_COLORS = [
    '#ff4444','#44ff44','#4488ff','#ff8833',
    '#44ffff','#ff44ff','#ffff44','#ffffff'
  ];

  var PALETTE_PREVIEW = [
    '#ff3300','#0077ff','#00cc00','#aa00ff',
    '#ffbb00','#ff00aa','#ffaaaa','#cccccc'
  ];

  /* ── pure helpers ───────────────────────────────────────────── */

  function makeGrid(val) {
    return Array.from({ length: SIZE }, function () {
      return new Array(SIZE).fill(val);
    });
  }

  function freshFrame() {
    return Array.from({ length: SIZE }, function () {
      return Array.from({ length: SIZE }, function () { return [0, 0, 0]; });
    });
  }

  function lerpColor(a, b, t) {
    return [
      Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t)
    ];
  }

  function scaleColor(c, s) {
    return [Math.round(c[0] * s), Math.round(c[1] * s), Math.round(c[2] * s)];
  }

  function addColor(f, r, c, color) {
    f[r][c] = [
      Math.min(255, f[r][c][0] + color[0]),
      Math.min(255, f[r][c][1] + color[1]),
      Math.min(255, f[r][c][2] + color[2])
    ];
  }

  function stepLife(grid) {
    var next = makeGrid(false);
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        var n = 0;
        for (var dr = -1; dr <= 1; dr++) {
          for (var dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            if (grid[(r + dr + SIZE) % SIZE][(c + dc + SIZE) % SIZE]) n++;
          }
        }
        next[r][c] = n === 3 || (grid[r][c] && n === 2);
      }
    }
    return next;
  }

  function hasLife(grid) {
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        if (grid[r][c]) return true;
      }
    }
    return false;
  }

  /* ── factory ────────────────────────────────────────────────── */

  function create(options) {
    var currentMode    = (options && options.mode != null)    ? options.mode    : 0;
    var currentPalette = (options && options.palette != null) ? options.palette : 5;

    var modeData = [
      { ripples: [] },
      { grid: makeGrid(false) },
      { pulses: [] },
      { grid: makeGrid(false), lastTick: 0 },
      { drops: [], lastT: null },
      { levels: new Array(SIZE).fill(-1) },
      { amp: 0.6, freq: 1.0 },
      { pattern: 0, speed: 1 }
    ];

    /* ── palette sampler (closes over currentPalette) ─────────── */

    function samplePalette(t) {
      var colors = PALETTES[currentPalette].colors;
      t = ((t % 1) + 1) % 1;
      var st = t * (colors.length - 1);
      var i  = Math.min(Math.floor(st), colors.length - 2);
      return lerpColor(colors[i], colors[i + 1], st - i);
    }

    /* ── mode updaters ────────────────────────────────────────── */

    function updateRipple(now, f) {
      var d = modeData[0];
      d.ripples = d.ripples.filter(function (rp) { return now - rp.t < 2500; });
      for (var ri = 0; ri < d.ripples.length; ri++) {
        var rp      = d.ripples[ri];
        var elapsed = (now - rp.t) / 1000;
        var radius  = elapsed * 4.5;
        var fade    = Math.max(0, 1 - elapsed / 2.5);
        for (var r = 0; r < SIZE; r++) {
          for (var c = 0; c < SIZE; c++) {
            var dist = Math.sqrt((r - rp.r) * (r - rp.r) + (c - rp.c) * (c - rp.c));
            var diff = Math.abs(dist - radius);
            if (diff < 1.3) {
              var intensity = (1 - diff / 1.3) * fade;
              addColor(f, r, c, scaleColor(samplePalette(dist / 10), intensity));
            }
          }
        }
      }
    }

    function updatePaint(now, f) {
      var d = modeData[1];
      for (var r = 0; r < SIZE; r++) {
        for (var c = 0; c < SIZE; c++) {
          if (d.grid[r][c]) {
            f[r][c] = samplePalette((r + c) / 14);
          }
        }
      }
    }

    function updatePulse(now, f) {
      var d = modeData[2];
      d.pulses = d.pulses.filter(function (p) { return now - p.t < 3000; });
      for (var r = 0; r < SIZE; r++) {
        for (var c = 0; c < SIZE; c++) {
          var total = 0;
          for (var pi = 0; pi < d.pulses.length; pi++) {
            var p       = d.pulses[pi];
            var elapsed = (now - p.t) / 1000;
            var dist    = Math.sqrt((r - p.r) * (r - p.r) + (c - p.c) * (c - p.c));
            var wave    = Math.cos(dist * 2.5 - elapsed * 8);
            var fade    = Math.max(0, 1 - elapsed / 3);
            total = Math.min(1, total + Math.max(0, wave) * fade);
          }
          if (total > 0.02) {
            addColor(f, r, c, scaleColor(samplePalette((r * SIZE + c) / 64), total));
          }
        }
      }
    }

    function updateLife(now, f) {
      var d = modeData[3];
      if (hasLife(d.grid) && now - d.lastTick > 320) {
        d.grid = stepLife(d.grid);
        d.lastTick = now;
      }
      for (var r = 0; r < SIZE; r++) {
        for (var c = 0; c < SIZE; c++) {
          if (d.grid[r][c]) {
            f[r][c] = samplePalette((r + c) / 14);
          }
        }
      }
    }

    function updateRain(now, f) {
      var d  = modeData[4];
      var dt = d.lastT != null ? (now - d.lastT) / 1000 : 0;
      d.lastT = now;

      for (var i = d.drops.length - 1; i >= 0; i--) {
        var dr = d.drops[i];
        dr.y += dr.speed * dt;
        for (var j = 0; j < dr.len; j++) {
          var ry = Math.floor(dr.y - j);
          if (ry >= 0 && ry < SIZE) {
            var intensity = 1 - j / dr.len;
            addColor(f, ry, dr.col, scaleColor(samplePalette(j / dr.len), intensity * intensity));
          }
        }
        if (dr.y - dr.len >= SIZE) d.drops.splice(i, 1);
      }
    }

    function updateFaders(now, f) {
      var d = modeData[5];
      for (var c = 0; c < SIZE; c++) {
        var level = d.levels[c];
        if (level < 0) continue;
        var barH = SIZE - level;
        for (var r = level; r < SIZE; r++) {
          var pos       = (r - level) / barH;
          var intensity = 1 - pos * 0.5;
          f[r][c] = scaleColor(samplePalette(c / 7), intensity);
        }
      }
    }

    function updateWave(now, f) {
      var d    = modeData[6];
      var time = now / 1000;
      for (var c = 0; c < SIZE; c++) {
        var val    = Math.sin(c * d.freq + time * 3) * d.amp;
        var center = 3.5 + val * 3.5;
        for (var r = 0; r < SIZE; r++) {
          var dist = Math.abs(r - center);
          if (dist < 1.8) {
            var intensity = 1 - dist / 1.8;
            f[r][c] = scaleColor(samplePalette(c / 7), intensity * intensity);
          }
        }
      }
    }

    function updateSpectrum(now, f) {
      var d    = modeData[7];
      var time = now / 1000 * d.speed;
      for (var r = 0; r < SIZE; r++) {
        for (var c = 0; c < SIZE; c++) {
          var t;
          switch (d.pattern) {
            case 0:  t = c / SIZE + time; break;
            case 1:  t = (r + c) / (SIZE * 2) + time; break;
            case 2:  t = Math.sqrt((r - 3.5) * (r - 3.5) + (c - 3.5) * (c - 3.5)) / 5.5 - time; break;
            default: t = Math.atan2(r - 3.5, c - 3.5) / (Math.PI * 2) + time; break;
          }
          f[r][c] = samplePalette(t);
        }
      }
    }

    var updaters = [
      updateRipple, updatePaint, updatePulse, updateLife,
      updateRain, updateFaders, updateWave, updateSpectrum
    ];

    /* ── public API ───────────────────────────────────────────── */

    function pressPad(r, c, now) {
      var d = modeData[currentMode];
      switch (currentMode) {
        case 0: d.ripples.push({ r: r, c: c, t: now }); break;
        case 1: d.grid[r][c] = !d.grid[r][c]; break;
        case 2: d.pulses.push({ r: r, c: c, t: now }); break;
        case 3: d.grid[r][c] = !d.grid[r][c]; break;
        case 4: d.drops.push({ col: c, y: r - 0.5, speed: 3 + Math.random() * 4, len: 3 + Math.random() * 3 }); break;
        case 5: d.levels[c] = d.levels[c] === r ? -1 : r; break;
        case 6: d.amp = (7 - r) / 7 * 0.85 + 0.15; d.freq = (c + 1) / 3; break;
        case 7: d.pattern = (d.pattern + 1) % 4; d.speed = 0.4 + c / 5; break;
      }
    }

    function update(now) {
      var frame = freshFrame();
      updaters[currentMode](now, frame);
      return frame;
    }

    return {
      SIZE:            SIZE,
      PALETTES:        PALETTES,
      MODE_NAMES:      MODE_NAMES,
      MODE_DESCS:      MODE_DESCS,
      MODE_COLORS:     MODE_COLORS,
      PALETTE_PREVIEW: PALETTE_PREVIEW,

      getMode:    function () { return currentMode; },
      getPalette: function () { return currentPalette; },
      setMode:    function (i) { currentMode = i; },
      setPalette: function (i) { currentPalette = i; },

      pressPad: pressPad,
      update:   update
    };
  }

  /* ── module export ──────────────────────────────────────────── */

  return { create: create };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Launchpad;
}
