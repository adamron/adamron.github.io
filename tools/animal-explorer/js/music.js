// Animal Explorer - Background Music Module
(function(AE) {
  // "About That Oldie" by Vibe Tracks (see music/CREDITS.md)
  var TRACK = 'music/about-that-oldie.mp3';
  var VOLUME = 0.25;
  // Quieter while the animal's name is being spoken
  var DUCKED_VOLUME = 0.06;

  var audio = null;
  var ducked = false;

  function getAudio() {
    if (!audio) {
      audio = new Audio(TRACK);
      audio.preload = 'none';
      audio.loop = true;
    }
    return audio;
  }

  AE.startMusic = function() {
    if (!AE.settings.music || document.hidden) return;
    var a = getAudio();
    a.volume = ducked ? DUCKED_VOLUME : VOLUME;
    // Browsers block playback until the user interacts with the page
    a.play().catch(function() {});
  };

  AE.stopMusic = function() {
    if (audio) audio.pause();
  };

  AE.duckMusic = function(isDucked) {
    ducked = isDucked;
    if (audio) audio.volume = ducked ? DUCKED_VOLUME : VOLUME;
  };

  AE.initMusic = function() {
    // Playback needs a user gesture, so start on the first interaction
    function onFirstInteraction() {
      document.removeEventListener('pointerdown', onFirstInteraction);
      document.removeEventListener('keydown', onFirstInteraction);
      AE.startMusic();
    }
    document.addEventListener('pointerdown', onFirstInteraction);
    document.addEventListener('keydown', onFirstInteraction);

    // Pause when the app is in the background
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) {
        AE.stopMusic();
      } else if (audio && audio.currentTime > 0) {
        AE.startMusic();
      }
    });
  };
})(AnimalExplorer);
