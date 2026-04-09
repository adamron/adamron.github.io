(function () {
  'use strict';

  var lp   = Launchpad.create();
  var SIZE = lp.SIZE;

  /* ── DOM references ─────────────────────────────────────────── */

  var gridEl      = document.getElementById('grid');
  var statusEl    = document.getElementById('status');
  var padEls      = [];
  var topBtnEls   = [];
  var sideBtnEls  = [];
  var pointerDown  = false;
  var lastMidiSend = 0;
  var MIDI_FPS     = 33;

  /* ── double-tap state ───────────────────────────────────────── */

  var lastTapBtn   = -1;
  var lastTapTime  = 0;
  var DOUBLE_TAP   = 350;

  /* ── helpers ────────────────────────────────────────────────── */

  function hexToRgb(hex) {
    return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  }

  /* ── build grid ─────────────────────────────────────────────── */

  function buildGrid() {
    for (var i = 0; i < SIZE; i++) {
      var btn = document.createElement('button');
      btn.className = 'ctrl-btn';
      btn.title = lp.MODE_NAMES[i];
      btn.dataset.mode = i;
      btn.addEventListener('pointerdown', modeHandler(i));
      gridEl.appendChild(btn);
      topBtnEls.push(btn);
    }
    var corner = document.createElement('div');
    corner.className = 'corner';
    gridEl.appendChild(corner);

    for (var r = 0; r < SIZE; r++) {
      var row = [];
      for (var c = 0; c < SIZE; c++) {
        var pad = document.createElement('div');
        pad.className = 'pad';
        pad.dataset.row = r;
        pad.dataset.col = c;
        pad.addEventListener('pointerdown', padDownHandler(r, c));
        pad.addEventListener('pointerenter', padEnterHandler(r, c));
        pad.addEventListener('contextmenu', preventDefault);
        gridEl.appendChild(pad);
        row.push(pad);
      }
      padEls.push(row);

      var sideBtn = document.createElement('button');
      sideBtn.className = 'ctrl-btn';
      sideBtn.title = lp.PALETTES[r].name;
      sideBtn.dataset.palette = r;
      sideBtn.addEventListener('pointerdown', paletteHandler(r));
      gridEl.appendChild(sideBtn);
      sideBtnEls.push(sideBtn);
    }
  }

  /* ── pointer event helpers ──────────────────────────────────── */

  function preventDefault(e) { e.preventDefault(); }

  function modeHandler(i) {
    return function (e) { e.preventDefault(); onModeButton(i); };
  }
  function paletteHandler(i) {
    return function (e) { e.preventDefault(); selectPalette(i); };
  }
  function padDownHandler(r, c) {
    return function (e) {
      e.preventDefault();
      pointerDown = true;
      lp.pressPad(r, c, performance.now());
    };
  }
  function padEnterHandler(r, c) {
    return function () {
      if (pointerDown) lp.pressPad(r, c, performance.now());
    };
  }

  document.addEventListener('pointerup',    function () { pointerDown = false; });
  document.addEventListener('pointercancel', function () { pointerDown = false; });

  /* ── double-tap mode selection ──────────────────────────────── */

  function onModeButton(i) {
    var now = performance.now();
    if (i === lastTapBtn && now - lastTapTime < DOUBLE_TAP) {
      selectMode(i + SIZE);
      lastTapBtn = -1;
    } else {
      selectMode(i);
      lastTapBtn = i;
      lastTapTime = now;
    }
  }

  function selectMode(i) {
    lp.setMode(i);
    updateButtons();
    updateStatus();
    sendMidiButtons();
  }

  function selectPalette(i) {
    lp.setPalette(i);
    updateButtons();
    updateStatus();
    sendMidiButtons();
  }

  /* ── button visuals ─────────────────────────────────────────── */

  function updateButtons() {
    var mode       = lp.getMode();
    var modeBtn    = mode % SIZE;
    var secondary  = mode >= SIZE;
    var palette    = lp.getPalette();

    for (var i = 0; i < SIZE; i++) {
      var tb = topBtnEls[i];
      tb.classList.remove('secondary');
      if (i === modeBtn) {
        tb.style.backgroundColor = lp.MODE_COLORS[i];
        tb.style.boxShadow       = '0 0 8px ' + lp.MODE_COLORS[i];
        tb.style.borderColor     = 'transparent';
        if (secondary) tb.classList.add('secondary');
      } else {
        tb.style.backgroundColor = '';
        tb.style.boxShadow       = '';
        tb.style.borderColor     = '';
      }

      var sb = sideBtnEls[i];
      if (i === palette) {
        sb.style.backgroundColor = lp.PALETTE_PREVIEW[i];
        sb.style.boxShadow       = '0 0 8px ' + lp.PALETTE_PREVIEW[i];
        sb.style.borderColor     = 'transparent';
      } else {
        sb.style.backgroundColor = '';
        sb.style.boxShadow       = '';
        sb.style.borderColor     = '';
      }
    }
  }

  function updateStatus() {
    var mode      = lp.getMode();
    var secondary = mode >= SIZE;

    var midi = '';
    if (LaunchpadMidi.isConnected()) {
      var sysex = LaunchpadMidi.hasSysex() ? '' : ' (no SysEx)';
      midi = ' | <span style="color:#4c4">' + LaunchpadMidi.deviceName() + sysex + '</span>';
    }

    var label = secondary
      ? '<span>' + lp.MODE_NAMES[mode] + '</span> <span style="color:#888;font-size:0.75em">2&times;</span>'
      : '<span>' + lp.MODE_NAMES[mode] + '</span>';

    statusEl.innerHTML = label + ' | ' + lp.PALETTES[lp.getPalette()].name + midi +
      '<br>' + lp.MODE_DESCS[mode];
  }

  /* ── MIDI button sync ───────────────────────────────────────── */

  function sendMidiButtons() {
    if (!LaunchpadMidi.isConnected()) return;
    var modeBtn = lp.getMode() % SIZE;
    var palette = lp.getPalette();
    for (var i = 0; i < SIZE; i++) {
      LaunchpadMidi.sendTopButton(i,  i === modeBtn ? hexToRgb(lp.MODE_COLORS[i]) : [0, 0, 0]);
      LaunchpadMidi.sendSideButton(i, i === palette ? hexToRgb(lp.PALETTE_PREVIEW[i]) : [0, 0, 0]);
    }
  }

  /* ── render frame → DOM ─────────────────────────────────────── */

  function render(frame) {
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        var rgb = frame[r][c];
        var pad = padEls[r][c];
        var mx  = Math.max(rgb[0], rgb[1], rgb[2]);
        if (mx < 4) {
          pad.style.backgroundColor = '';
          pad.style.boxShadow       = '';
        } else {
          pad.style.backgroundColor = 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
          var g = Math.round(mx / 20);
          pad.style.boxShadow = '0 0 ' + g + 'px rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',0.55)';
        }
      }
    }
  }

  /* ── animation loop ─────────────────────────────────────────── */

  function animate(now) {
    var frame = lp.update(now);
    render(frame);
    if (LaunchpadMidi.isConnected() && now - lastMidiSend > MIDI_FPS) {
      LaunchpadMidi.sendFrame(frame);
      lastMidiSend = now;
    }
    requestAnimationFrame(animate);
  }

  /* ── MIDI wiring ────────────────────────────────────────────── */

  function initMidi() {
    LaunchpadMidi.onPad(function (r, c) {
      lp.pressPad(r, c, performance.now());
    });

    LaunchpadMidi.onTopButton(function (i) {
      onModeButton(i);
    });

    LaunchpadMidi.onSideButton(function (i) {
      selectPalette(i);
    });

    LaunchpadMidi.onConnect(function () {
      sendMidiButtons();
      updateStatus();
    });

    LaunchpadMidi.onDisconnect(function () {
      updateStatus();
    });

    LaunchpadMidi.connect().then(function (ok) {
      if (ok) sendMidiButtons();
      updateStatus();
    });
  }

  /* ── init ───────────────────────────────────────────────────── */

  buildGrid();
  updateButtons();
  updateStatus();
  initMidi();
  requestAnimationFrame(animate);
})();
