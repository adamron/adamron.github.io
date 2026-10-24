// Animal Explorer - Settings Module
(function(AE) {
  var STORAGE_KEY = 'animalExplorerSettings';

  var defaults = {
    speakNames: true,
    navLock: false,
    navLockSeconds: 0.5
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

  AE.markCardChange = function() {
    lastCardChange = Date.now();
  };

  AE.isNavLocked = function() {
    if (!AE.settings.navLock) return false;
    return Date.now() - lastCardChange < AE.settings.navLockSeconds * 1000;
  };

  // Speak the animal name and bounce the title while speaking
  var currentUtterance = null;
  var speakingTimeout = null;

  function stopBounce() {
    clearTimeout(speakingTimeout);
    AE.els.detailTitle.classList.remove('speaking');
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

    speakInput.checked = AE.settings.speakNames;
    lockInput.checked = AE.settings.navLock;
    lockSecondsInput.value = AE.settings.navLockSeconds;
    lockSecondsInput.disabled = !AE.settings.navLock;

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
