(function () {
  'use strict';

  var lp   = Launchpad.create();
  var SIZE = lp.SIZE;

  /* ── DOM references ─────────────────────────────────────────── */

  var gridEl     = document.getElementById('grid');
  var statusEl   = document.getElementById('status');
  var padEls     = [];
  var topBtnEls  = [];
  var sideBtnEls = [];
  var pointerDown = false;

  /* ── build grid ─────────────────────────────────────────────── */

  function buildGrid() {
    /* row 0: 8 top buttons + corner */
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

    /* rows 1-8: pads + side buttons */
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

  /* ── event helpers ──────────────────────────────────────────── */

  function preventDefault(e) { e.preventDefault(); }

  function modeHandler(i) {
    return function (e) { e.preventDefault(); selectMode(i); };
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

  document.addEventListener('pointerup',     function () { pointerDown = false; });
  document.addEventListener('pointercancel',  function () { pointerDown = false; });

  /* ── mode / palette selection ───────────────────────────────── */

  function selectMode(i) {
    lp.setMode(i);
    updateButtons();
    updateStatus();
  }

  function selectPalette(i) {
    lp.setPalette(i);
    updateButtons();
    updateStatus();
  }

  function updateButtons() {
    var mode    = lp.getMode();
    var palette = lp.getPalette();

    for (var i = 0; i < SIZE; i++) {
      var tb = topBtnEls[i];
      if (i === mode) {
        tb.style.backgroundColor = lp.MODE_COLORS[i];
        tb.style.boxShadow       = '0 0 8px ' + lp.MODE_COLORS[i];
        tb.style.borderColor     = 'transparent';
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
    statusEl.innerHTML =
      '<span>' + lp.MODE_NAMES[lp.getMode()] + '</span> | ' +
      lp.PALETTES[lp.getPalette()].name +
      '<br>' + lp.MODE_DESCS[lp.getMode()];
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
    render(lp.update(now));
    requestAnimationFrame(animate);
  }

  /* ── init ───────────────────────────────────────────────────── */

  buildGrid();
  updateButtons();
  updateStatus();
  requestAnimationFrame(animate);
})();
