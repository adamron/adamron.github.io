/**
 * Web MIDI bridge for Novation Launchpad MK2.
 *
 * MK2 note layout:
 *   Top buttons : CC 104-111
 *   Grid row 0  : notes 81-88      Side button 0 : note 89
 *   Grid row 1  : notes 71-78      Side button 1 : note 79
 *   …                               …
 *   Grid row 7  : notes 11-18      Side button 7 : note 19
 */
var LaunchpadMidi = (function () {
  'use strict';

  var SYSEX_HEADER = [0xF0, 0x00, 0x20, 0x29, 0x02, 0x18];
  var RGB_CMD      = 0x0B;

  var midiAccess     = null;
  var input          = null;
  var output         = null;
  var handlers       = {};
  var _deviceName    = '';
  var _hasSysex      = false;

  var scanGen        = 0;
  var debounceTimer  = null;
  var retryTimer     = null;
  var heartbeatTimer = null;
  var retryCount     = 0;
  var MAX_RETRIES    = 30;
  var DEBOUNCE_MS    = 250;
  var RETRY_MS       = 1000;
  var HEARTBEAT_MS   = 2000;

  /* ── address helpers ────────────────────────────────────────── */

  function gridToNote(row, col) { return (8 - row) * 10 + col + 1; }
  function topBtnCC(index)      { return 104 + index; }
  function sideBtnNote(index)   { return (8 - index) * 10 + 9; }
  function q(v) { return Math.min(63, Math.round(v / 4)); }

  /* ── incoming MIDI ──────────────────────────────────────────── */

  function handleMessage(e) {
    var data = e.data;
    if (!data || data.length < 3) return;
    var status = data[0] & 0xF0;

    if (status === 0x90 && data[2] > 0) {
      var note = data[1];
      var col  = (note % 10) - 1;
      var row  = 8 - Math.floor(note / 10);
      if (col === 8 && handlers.sideBtn && row >= 0 && row < 8) {
        handlers.sideBtn(row);
      } else if (col >= 0 && col < 8 && handlers.pad && row >= 0 && row < 8) {
        handlers.pad(row, col);
      }
    } else if (status === 0xB0 && data[2] > 0) {
      var cc = data[1];
      if (cc >= 104 && cc <= 111 && handlers.topBtn) {
        handlers.topBtn(cc - 104);
      }
    }
  }

  /* ── ensure a port is open and listening ────────────────────── */

  function ensureInputOpen() {
    if (!input || input.state !== 'connected') return Promise.resolve(false);
    return input.open().then(function () {
      input.onmidimessage = handleMessage;
      return true;
    }).catch(function () { return false; });
  }

  function ensureOutputOpen() {
    if (!output || output.state !== 'connected') return Promise.resolve(false);
    return output.open().then(function () { return true; }).catch(function () { return false; });
  }

  /* ── attach / detach ────────────────────────────────────────── */

  function attach(newIn, newOut) {
    if (input && input !== newIn) {
      input.onmidimessage  = null;
      input.onstatechange  = null;
    }
    if (output && output !== newOut) {
      output.onstatechange = null;
    }

    input  = newIn;
    output = newOut;

    input.onmidimessage = handleMessage;
    input.onstatechange = onPortStateChange;
    if (output) output.onstatechange = onPortStateChange;

    _deviceName = input.name || '';
  }

  function detach() {
    if (input) {
      input.onmidimessage = null;
      input.onstatechange = null;
    }
    if (output) {
      output.onstatechange = null;
    }
    input  = null;
    output = null;
    _deviceName = '';
  }

  /* ── per-port state change (catches reconnects events miss) ── */

  function onPortStateChange(e) {
    var port = e.port;
    if (port.state === 'connected') {
      /* port came back — re-open and re-wire immediately */
      port.open().then(function () {
        if (port === input) {
          input.onmidimessage = handleMessage;
        }
        if (handlers.connect) handlers.connect();
      });
    } else {
      if (handlers.disconnect) handlers.disconnect();
      scheduleScan();
    }
  }

  /* ── full device scan ───────────────────────────────────────── */

  function scan() {
    if (!midiAccess) return Promise.resolve(false);

    var gen          = ++scanGen;
    var wasConnected = isConnected();

    var foundIn  = null;
    var foundOut = null;

    midiAccess.inputs.forEach(function (p) {
      if (!foundIn && p.state === 'connected' && p.name && /launchpad/i.test(p.name)) {
        foundIn = p;
      }
    });
    midiAccess.outputs.forEach(function (p) {
      if (!foundOut && p.state === 'connected' && p.name && /launchpad/i.test(p.name)) {
        foundOut = p;
      }
    });

    if (!foundIn) {
      detach();
      if (wasConnected && handlers.disconnect) handlers.disconnect();
      scheduleRetry();
      return Promise.resolve(false);
    }

    var opens = [foundIn.open()];
    if (foundOut) opens.push(foundOut.open());

    return Promise.all(opens).then(function () {
      if (gen !== scanGen) return false;

      attach(foundIn, foundOut);
      retryCount = 0;
      clearTimeout(retryTimer);

      if (!wasConnected && handlers.connect) handlers.connect();
      return true;
    }).catch(function () {
      if (gen !== scanGen) return false;
      detach();
      scheduleRetry();
      return false;
    });
  }

  function scheduleScan() {
    clearTimeout(debounceTimer);
    clearTimeout(retryTimer);
    retryCount = 0;
    debounceTimer = setTimeout(function () { scan(); }, DEBOUNCE_MS);
  }

  function scheduleRetry() {
    clearTimeout(retryTimer);
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      retryTimer = setTimeout(function () { scan(); }, RETRY_MS);
    }
  }

  /* ── heartbeat: periodic check that input is actually alive ── */

  function startHeartbeat() {
    clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(function () {
      if (!midiAccess) return;

      if (input && input.state === 'connected') {
        /* port exists and device is physically present —
           re-open + re-attach in case logical connection dropped */
        if (input.connection !== 'open') {
          ensureInputOpen().then(function (ok) {
            if (ok && handlers.connect) handlers.connect();
          });
        }
        if (output && output.connection !== 'open') {
          ensureOutputOpen();
        }
      } else {
        /* no live input — full rescan */
        scan();
      }
    }, HEARTBEAT_MS);
  }

  /* ── connect ────────────────────────────────────────────────── */

  function connect() {
    if (typeof navigator === 'undefined' || !navigator.requestMIDIAccess) {
      return Promise.resolve(false);
    }

    return navigator.requestMIDIAccess({ sysex: true })
      .then(function (a) { _hasSysex = true; return a; })
      .catch(function () {
        return navigator.requestMIDIAccess({ sysex: false });
      })
      .then(function (access) {
        midiAccess = access;
        access.onstatechange = function () { scheduleScan(); };
        startHeartbeat();
        return scan();
      })
      .catch(function () { return false; });
  }

  function isConnected() {
    return !!(input && input.state === 'connected');
  }

  /* ── outgoing MIDI (LED colours) ────────────────────────────── */

  function sendFrame(frame) {
    if (!output || !_hasSysex) return;
    var msg = SYSEX_HEADER.concat([RGB_CMD]);
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        var rgb = frame[r][c];
        msg.push(gridToNote(r, c), q(rgb[0]), q(rgb[1]), q(rgb[2]));
      }
    }
    msg.push(0xF7);
    try { output.send(new Uint8Array(msg)); } catch (_) {}
  }

  function sendTopButton(index, rgb) {
    if (!output || !_hasSysex) return;
    try {
      output.send(new Uint8Array(
        SYSEX_HEADER.concat([RGB_CMD, topBtnCC(index), q(rgb[0]), q(rgb[1]), q(rgb[2]), 0xF7])
      ));
    } catch (_) {}
  }

  function sendSideButton(index, rgb) {
    if (!output || !_hasSysex) return;
    try {
      output.send(new Uint8Array(
        SYSEX_HEADER.concat([RGB_CMD, sideBtnNote(index), q(rgb[0]), q(rgb[1]), q(rgb[2]), 0xF7])
      ));
    } catch (_) {}
  }

  /* ── public API ─────────────────────────────────────────────── */

  return {
    connect:        connect,
    isConnected:    isConnected,
    deviceName:     function () { return _deviceName; },
    hasSysex:       function () { return _hasSysex; },
    sendFrame:      sendFrame,
    sendTopButton:  sendTopButton,
    sendSideButton: sendSideButton,

    onPad:          function (fn) { handlers.pad        = fn; },
    onTopButton:    function (fn) { handlers.topBtn     = fn; },
    onSideButton:   function (fn) { handlers.sideBtn    = fn; },
    onConnect:      function (fn) { handlers.connect    = fn; },
    onDisconnect:   function (fn) { handlers.disconnect = fn; }
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LaunchpadMidi;
}
