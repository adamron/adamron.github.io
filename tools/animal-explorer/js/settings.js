// Animal Explorer - Settings Module
(function(AE) {
  var STORAGE_KEY = 'animalExplorerSettings';

  var defaults = {
    speakNames: true,
    navLock: false,
    navLockSeconds: 0.5,
    music: false,
    colourful: false
  };

  // Card colours for the colourful theme, cycled by animal
  var CARD_COLOURS = ['#e6007e', '#00a8e0', '#ff7a00', '#e31e24', '#8e2fa8', '#2fa84f'];

  AE.cardColour = function(index) {
    return CARD_COLOURS[index % CARD_COLOURS.length];
  };

  AE.applyTheme = function() {
    document.body.classList.toggle('theme-colourful', AE.settings.colourful);
  };

  AE.settings = Object.assign({}, defaults);

  function load() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved) Object.assign(AE.settings, saved);
    } catch (e) {}
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(AE.settings));
    } catch (e) {}
  }

  // Navigation lock: ignore card changes until the lock period has passed
  var lastCardChange = 0;
  var lockTimeout = null;

  AE.markCardChange = function() {
    lastCardChange = Date.now();

    // Dim the nav controls for the duration of the lock
    clearTimeout(lockTimeout);
    AE.els.detail.classList.remove('nav-locked');
    if (AE.settings.navLock && AE.settings.navLockSeconds > 0) {
      AE.els.detail.classList.add('nav-locked');
      lockTimeout = setTimeout(function() {
        AE.els.detail.classList.remove('nav-locked');
      }, AE.settings.navLockSeconds * 1000);
    }
  };

  AE.isNavLocked = function() {
    if (!AE.settings.navLock) return false;
    return Date.now() - lastCardChange < AE.settings.navLockSeconds * 1000;
  };

  // Feedback when a card change is blocked: shake the picture and play a soft bonk
  var audioCtx = null;
  var lastBlockedSignal = 0;

  function playBonk() {
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    var now = audioCtx.currentTime;
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  AE.signalNavBlocked = function() {
    // Held keys and trackpad scrolls fire repeatedly, so only signal occasionally
    var now = Date.now();
    if (now - lastBlockedSignal < 400) return;
    lastBlockedSignal = now;

    var img = AE.els.detailImg;
    img.classList.remove('blocked');
    void img.offsetWidth;
    img.classList.add('blocked');
    playBonk();
  };

  // Speak the animal name and bounce the title while speaking
  var currentUtterance = null;
  var speakingTimeout = null;

  function stopBounce() {
    clearTimeout(speakingTimeout);
    AE.els.detailTitle.classList.remove('speaking');
    AE.duckMusic(false);
  }

  AE.speakName = function(name) {
    if (!AE.settings.speakNames || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    stopBounce();

    var utterance = new SpeechSynthesisUtterance(name);
    utterance.rate = 0.9;
    currentUtterance = utterance;

    function finish() {
      if (currentUtterance === utterance) stopBounce();
    }
    utterance.onend = finish;
    utterance.onerror = finish;

    // Restart the animation even if the class was just removed
    void AE.els.detailTitle.offsetWidth;
    AE.els.detailTitle.classList.add('speaking');
    AE.duckMusic(true);
    // Some browsers never fire onend, so cap the animation
    speakingTimeout = setTimeout(finish, 4000);

    window.speechSynthesis.speak(utterance);
  };

  AE.stopSpeaking = function() {
    currentUtterance = null;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    stopBounce();
  };

  // Settings panel UI
  AE.initSettings = function() {
    load();

    var panel = document.getElementById('settings');
    var toggle = document.getElementById('settings-toggle');
    var speakInput = document.getElementById('setting-speak');
    var lockInput = document.getElementById('setting-lock');
    var lockSecondsInput = document.getElementById('setting-lock-seconds');
    var musicInput = document.getElementById('setting-music');
    var colourfulInput = document.getElementById('setting-colourful');

    speakInput.checked = AE.settings.speakNames;
    lockInput.checked = AE.settings.navLock;
    lockSecondsInput.value = AE.settings.navLockSeconds;
    lockSecondsInput.disabled = !AE.settings.navLock;
    musicInput.checked = AE.settings.music;
    colourfulInput.checked = AE.settings.colourful;
    AE.applyTheme();

    toggle.addEventListener('click', function() {
      panel.classList.toggle('open');
    });

    speakInput.addEventListener('change', function() {
      AE.settings.speakNames = speakInput.checked;
      if (!speakInput.checked) AE.stopSpeaking();
      save();
    });

    lockInput.addEventListener('change', function() {
      AE.settings.navLock = lockInput.checked;
      lockSecondsInput.disabled = !lockInput.checked;
      save();
    });

    musicInput.addEventListener('change', function() {
      AE.settings.music = musicInput.checked;
      if (musicInput.checked) {
        AE.startMusic();
      } else {
        AE.stopMusic();
      }
      save();
    });

    colourfulInput.addEventListener('change', function() {
      AE.settings.colourful = colourfulInput.checked;
      AE.applyTheme();
      save();
    });

    lockSecondsInput.addEventListener('change', function() {
      var value = parseFloat(lockSecondsInput.value);
      if (isNaN(value) || value < 0) value = defaults.navLockSeconds;
      value = Math.min(value, 10);
      lockSecondsInput.value = value;
      AE.settings.navLockSeconds = value;
      save();
    });
  };
})(AnimalExplorer);
