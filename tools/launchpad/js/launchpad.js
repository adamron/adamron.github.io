/**
 * Launchpad MK2 engine — pure logic, no DOM dependencies.
 *
 * 16 modes: 0-7 primary (single tap), 8-15 secondary (double tap).
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

  var MODE_NAMES = [
    'Ripple','Paint','Pulse','Life','Rain','Faders','Wave','Spectrum',
    'Fireworks','Mirror','Spiral','Gravity','Meteors','Bounce','Radar','Plasma'
  ];

  var MODE_DESCS = [
    'Tap pads to send expanding color rings',
    'Click or drag to paint pads, click again to erase',
    'Tap to radiate concentric wave pulses',
    'Tap to seed cells \u2014 Conway\u2019s Game of Life auto-steps',
    'Tap columns to spawn falling rain trails',
    'Tap to set column levels like a mixer',
    'Tap to change wave amplitude and frequency',
    'Tap to cycle through spectrum patterns',
    'Tap to launch particle fireworks',
    'Paint with 4-way symmetry, tap to erase',
    'Tap to spawn rotating spiral arms',
    'Tap to drop cells that stack \u2014 tap a stack to clear it',
    'Tap to launch diagonal meteor streaks',
    'Tap to bounce balls \u2014 higher tap = more energy',
    'Tap to move the radar sweep centre',
    'Tap to shift plasma parameters'
  ];

  /* button colours — 8 entries, secondary modes share via index % 8 */
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

  function getDt(d, now) {
    var dt = d.lastT != null ? Math.min((now - d.lastT) / 1000, 0.1) : 0;
    d.lastT = now;
    return dt;
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
    for (var r = 0; r < SIZE; r++)
      for (var c = 0; c < SIZE; c++)
        if (grid[r][c]) return true;
    return false;
  }

  function makeBalls() {
    var b = [];
    for (var i = 0; i < SIZE; i++) b.push({ y: 7, vy: 0, energy: 0 });
    return b;
  }

  /* ── factory ────────────────────────────────────────────────── */

  function create(options) {
    var currentMode    = (options && options.mode != null)    ? options.mode    : 0;
    var currentPalette = (options && options.palette != null) ? options.palette : 5;

    var modeData = [
      /* 0-7: primary */
      { ripples: [] },
      { grid: makeGrid(false) },
      { pulses: [] },
      { grid: makeGrid(false), lastTick: 0 },
      { drops: [], lastT: null },
      { levels: new Array(SIZE).fill(-1) },
      { amp: 0.6, freq: 1.0 },
      { pattern: 0, speed: 1 },
      /* 8-15: secondary */
      { bursts: [], lastT: null },
      { grid: makeGrid(false) },
      { spirals: [] },
      { particles: [], stacked: makeGrid(false), lastT: null },
      { meteors: [], lastT: null },
      { balls: makeBalls(), lastT: null },
      { cx: 3.5, cy: 3.5 },
      { p1: 1, p2: 1.5, p3: 1.2, speed: 1 }
    ];

    /* ── palette sampler ──────────────────────────────────────── */

    function samplePalette(t) {
      var colors = PALETTES[currentPalette].colors;
      t = ((t % 1) + 1) % 1;
      var st = t * (colors.length - 1);
      var i  = Math.min(Math.floor(st), colors.length - 2);
      return lerpColor(colors[i], colors[i + 1], st - i);
    }

    /* ── primary mode updaters (0-7) ──────────────────────────── */

    function updateRipple(now, f) {
      var d = modeData[0];
      d.ripples = d.ripples.filter(function (rp) { return now - rp.t < 2500; });
      for (var ri = 0; ri < d.ripples.length; ri++) {
        var rp = d.ripples[ri];
        var elapsed = (now - rp.t) / 1000;
        var radius = elapsed * 4.5;
        var fade = Math.max(0, 1 - elapsed / 2.5);
        for (var r = 0; r < SIZE; r++) {
          for (var c = 0; c < SIZE; c++) {
            var dist = Math.sqrt((r - rp.r) * (r - rp.r) + (c - rp.c) * (c - rp.c));
            var diff = Math.abs(dist - radius);
            if (diff < 1.3) {
              addColor(f, r, c, scaleColor(samplePalette(dist / 10), (1 - diff / 1.3) * fade));
            }
          }
        }
      }
    }

    function updatePaint(now, f) {
      var d = modeData[1];
      for (var r = 0; r < SIZE; r++)
        for (var c = 0; c < SIZE; c++)
          if (d.grid[r][c]) f[r][c] = samplePalette((r + c) / 14);
    }

    function updatePulse(now, f) {
      var d = modeData[2];
      d.pulses = d.pulses.filter(function (p) { return now - p.t < 3000; });
      for (var r = 0; r < SIZE; r++) {
        for (var c = 0; c < SIZE; c++) {
          var total = 0;
          for (var pi = 0; pi < d.pulses.length; pi++) {
            var p = d.pulses[pi];
            var elapsed = (now - p.t) / 1000;
            var dist = Math.sqrt((r - p.r) * (r - p.r) + (c - p.c) * (c - p.c));
            total = Math.min(1, total + Math.max(0, Math.cos(dist * 2.5 - elapsed * 8)) * Math.max(0, 1 - elapsed / 3));
          }
          if (total > 0.02) addColor(f, r, c, scaleColor(samplePalette((r * SIZE + c) / 64), total));
        }
      }
    }

    function updateLife(now, f) {
      var d = modeData[3];
      if (hasLife(d.grid) && now - d.lastTick > 320) { d.grid = stepLife(d.grid); d.lastTick = now; }
      for (var r = 0; r < SIZE; r++)
        for (var c = 0; c < SIZE; c++)
          if (d.grid[r][c]) f[r][c] = samplePalette((r + c) / 14);
    }

    function updateRain(now, f) {
      var d = modeData[4], dt = getDt(d, now);
      for (var i = d.drops.length - 1; i >= 0; i--) {
        var dr = d.drops[i];
        dr.y += dr.speed * dt;
        for (var j = 0; j < dr.len; j++) {
          var ry = Math.floor(dr.y - j);
          if (ry >= 0 && ry < SIZE) {
            var t = 1 - j / dr.len;
            addColor(f, ry, dr.col, scaleColor(samplePalette(j / dr.len), t * t));
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
        for (var r = level; r < SIZE; r++)
          f[r][c] = scaleColor(samplePalette(c / 7), 1 - (r - level) / barH * 0.5);
      }
    }

    function updateWave(now, f) {
      var d = modeData[6], time = now / 1000;
      for (var c = 0; c < SIZE; c++) {
        var center = 3.5 + Math.sin(c * d.freq + time * 3) * d.amp * 3.5;
        for (var r = 0; r < SIZE; r++) {
          var dist = Math.abs(r - center);
          if (dist < 1.8) { var t = 1 - dist / 1.8; f[r][c] = scaleColor(samplePalette(c / 7), t * t); }
        }
      }
    }

    function updateSpectrum(now, f) {
      var d = modeData[7], time = now / 1000 * d.speed;
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

    /* ── secondary mode updaters (8-15) ───────────────────────── */

    function updateFireworks(now, f) {
      var d = modeData[8], dt = getDt(d, now);
      for (var bi = d.bursts.length - 1; bi >= 0; bi--) {
        var burst = d.bursts[bi];
        for (var pi = burst.length - 1; pi >= 0; pi--) {
          var p = burst[pi];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += 4 * dt;
          p.life -= dt * 0.55;
          if (p.life <= 0) { burst.splice(pi, 1); continue; }
          var gr = Math.round(p.y), gc = Math.round(p.x);
          if (gr >= 0 && gr < SIZE && gc >= 0 && gc < SIZE)
            addColor(f, gr, gc, scaleColor(samplePalette(p.ct), p.life));
        }
        if (burst.length === 0) d.bursts.splice(bi, 1);
      }
    }

    function updateMirror(now, f) {
      var d = modeData[9];
      for (var r = 0; r < SIZE; r++)
        for (var c = 0; c < SIZE; c++)
          if (d.grid[r][c]) f[r][c] = samplePalette((r + c) / 14);
    }

    function updateSpiral(now, f) {
      var d = modeData[10];
      d.spirals = d.spirals.filter(function (s) { return now - s.t < 4000; });
      for (var si = 0; si < d.spirals.length; si++) {
        var s = d.spirals[si];
        var elapsed = (now - s.t) / 1000;
        var fade = Math.max(0, 1 - elapsed / 4);
        for (var r = 0; r < SIZE; r++) {
          for (var c = 0; c < SIZE; c++) {
            var dx = c - s.c, dy = r - s.r;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 0.3) continue;
            var angle = Math.atan2(dy, dx);
            var v = Math.sin(angle * 3 + dist * 1.5 - elapsed * 6);
            var intensity = Math.max(0, v) * fade * Math.min(1, dist);
            if (intensity > 0.02)
              addColor(f, r, c, scaleColor(samplePalette(((angle / (Math.PI * 2)) + 1) % 1), intensity));
          }
        }
      }
    }

    function updateGravity(now, f) {
      var d = modeData[11], dt = getDt(d, now);
      for (var i = d.particles.length - 1; i >= 0; i--) {
        var p = d.particles[i];
        p.vy += 18 * dt;
        p.y += p.vy * dt;
        var landRow = SIZE - 1;
        for (var rr = Math.max(0, Math.ceil(p.y)); rr < SIZE; rr++) {
          if (d.stacked[rr][p.col]) { landRow = rr - 1; break; }
        }
        if (p.y >= landRow) {
          if (landRow >= 0) d.stacked[landRow][p.col] = true;
          d.particles.splice(i, 1);
        }
      }
      for (var r = 0; r < SIZE; r++)
        for (var c = 0; c < SIZE; c++)
          if (d.stacked[r][c]) f[r][c] = samplePalette((r + c) / 14);
      for (var j = 0; j < d.particles.length; j++) {
        var pp = d.particles[j], ry = Math.round(pp.y);
        if (ry >= 0 && ry < SIZE) f[ry][pp.col] = samplePalette(pp.col / 7);
      }
    }

    function updateMeteors(now, f) {
      var d = modeData[12], dt = getDt(d, now);
      for (var i = d.meteors.length - 1; i >= 0; i--) {
        var m = d.meteors[i];
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        var speed = Math.sqrt(m.vx * m.vx + m.vy * m.vy);
        var ndx = m.vx / speed, ndy = m.vy / speed;
        for (var j = 0; j < m.len; j++) {
          var rx = Math.round(m.x - ndx * j), ry = Math.round(m.y - ndy * j);
          if (rx >= 0 && rx < SIZE && ry >= 0 && ry < SIZE) {
            var t = 1 - j / m.len;
            addColor(f, ry, rx, scaleColor(samplePalette(j / m.len), t * t));
          }
        }
        if (m.y > SIZE + m.len + 2 || m.x < -m.len - 2 || m.x > SIZE + m.len + 2)
          d.meteors.splice(i, 1);
      }
    }

    function updateBounce(now, f) {
      var d = modeData[13], dt = getDt(d, now);
      for (var c = 0; c < SIZE; c++) {
        var b = d.balls[c];
        if (b.energy < 0.01) continue;
        b.vy += 25 * dt;
        b.y += b.vy * dt;
        if (b.y > 7) { b.y = 7; b.vy *= -0.72; b.energy *= 0.72; }
        if (b.y < 0) { b.y = 0; b.vy = Math.abs(b.vy) * 0.5; }
        if (b.y >= 6.8 && Math.abs(b.vy) < 0.8) { b.energy = 0; b.y = 7; b.vy = 0; continue; }
        var ry = Math.round(b.y);
        if (ry >= 0 && ry < SIZE) f[ry][c] = samplePalette(c / 7);
        for (var r = ry + 1; r < SIZE; r++) {
          var trail = (1 - (r - ry) / (SIZE - ry)) * 0.3 * b.energy;
          if (trail > 0.01) addColor(f, r, c, scaleColor(samplePalette(c / 7), trail));
        }
      }
    }

    function updateRadar(now, f) {
      var d = modeData[14];
      var angle = (now / 1000) * 2.5;
      for (var r = 0; r < SIZE; r++) {
        for (var c = 0; c < SIZE; c++) {
          var dx = c - d.cx, dy = r - d.cy;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 0.01) continue;
          var cellAngle = Math.atan2(dy, dx);
          var diff = ((angle - cellAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
          var sweep = 1 - diff / (Math.PI * 2);
          var intensity = Math.pow(sweep, 4) * Math.min(1, dist / 0.5);
          if (intensity > 0.02) f[r][c] = scaleColor(samplePalette(sweep), intensity);
        }
      }
    }

    function updatePlasma(now, f) {
      var d = modeData[15], t = now / 1000 * d.speed;
      for (var r = 0; r < SIZE; r++) {
        for (var c = 0; c < SIZE; c++) {
          var cx = (c - 3.5) * d.p3, cy = (r - 3.5) * d.p3;
          var v = (Math.sin(c * d.p1 + t) + Math.sin(r * d.p2 + t * 1.3) +
                   Math.sin((c + r) * 0.5 + t * 0.7) + Math.sin(Math.sqrt(cx * cx + cy * cy) + t)) / 4;
          f[r][c] = samplePalette((v + 1) / 2);
        }
      }
    }

    var updaters = [
      updateRipple, updatePaint, updatePulse, updateLife,
      updateRain, updateFaders, updateWave, updateSpectrum,
      updateFireworks, updateMirror, updateSpiral, updateGravity,
      updateMeteors, updateBounce, updateRadar, updatePlasma
    ];

    /* ── press helpers for complex spawns ──────────────────────── */

    function spawnFirework(d, r, c) {
      var parts = [];
      var count = 10 + Math.floor(Math.random() * 6);
      for (var i = 0; i < count; i++) {
        var angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
        var speed = 3 + Math.random() * 5;
        parts.push({ x: c, y: r, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, ct: i / count });
      }
      d.bursts.push(parts);
    }

    function toggleMirror(d, r, c) {
      var on = !d.grid[r][c];
      d.grid[r][c] = on;
      d.grid[r][7 - c] = on;
      d.grid[7 - r][c] = on;
      d.grid[7 - r][7 - c] = on;
    }

    /* ── public API ───────────────────────────────────────────── */

    function pressPad(r, c, now) {
      var d = modeData[currentMode];
      switch (currentMode) {
        case 0:  d.ripples.push({ r: r, c: c, t: now }); break;
        case 1:  d.grid[r][c] = !d.grid[r][c]; break;
        case 2:  d.pulses.push({ r: r, c: c, t: now }); break;
        case 3:  d.grid[r][c] = !d.grid[r][c]; break;
        case 4:  d.drops.push({ col: c, y: r - 0.5, speed: 3 + Math.random() * 4, len: 3 + Math.random() * 3 }); break;
        case 5:  d.levels[c] = d.levels[c] === r ? -1 : r; break;
        case 6:  d.amp = (7 - r) / 7 * 0.85 + 0.15; d.freq = (c + 1) / 3; break;
        case 7:  d.pattern = (d.pattern + 1) % 4; d.speed = 0.4 + c / 5; break;
        case 8:  spawnFirework(d, r, c); break;
        case 9:  toggleMirror(d, r, c); break;
        case 10: d.spirals.push({ r: r, c: c, t: now }); break;
        case 11:
          if (d.stacked[r][c]) { for (var gr = 0; gr < SIZE; gr++) d.stacked[gr][c] = false; }
          else d.particles.push({ col: c, y: r, vy: 0 });
          break;
        case 12:
          var dir = Math.random() > 0.5 ? 1 : -1;
          d.meteors.push({ x: c, y: r - 0.5, vx: dir * (1.5 + Math.random() * 2), vy: 3 + Math.random() * 4, len: 4 + Math.random() * 3 });
          break;
        case 13: d.balls[c].vy = -(6 + (7 - r) * 2); d.balls[c].energy = 1; break;
        case 14: d.cx = c; d.cy = r; break;
        case 15: d.p1 = 0.5 + c / 4; d.p2 = 0.5 + r / 4; d.p3 = 0.8 + (r + c) / 10; break;
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
