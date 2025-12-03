// audioManager.js

const AudioManager = (() => {
  let audio = null;
  let isInitialized = false;
  let isMuffled = true;
  let introEnded = false;
  let currentIndex = 0;

  const shuffleArray = arr => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const songPaths = shuffleArray([
    'music/Carti/beef.mp3',
    'music/Carti/RIP Fredo.mp3',
    'music/Carti/Stop Breathing.mp3',
    'music/Carti/Toxic.mp3',
    'music/Carti/wokeuplikethis.mp3',
    'music/Donny/Bandit.mp3',
    'music/Donny/Donny Darko.mp3',
    'music/Donny/New drop.mp3',
    'music/Donny/No pole.mp3',
    'music/Donny/Tiramisu.mp3',
    'music/Kanye/Burn.mp3',
    'music/Kanye/Everything i am.mp3',
    'music/Kanye/Fuk sunn.mp3',
    'music/Kanye/On sight.mp3',
    'music/Kanye/Touch the sky.mp3',
    'music/Ken/Fighting my demons.mp3',
    'music/Ken/Rock n RoLL.mp3',
    'music/Ken/Shoot.mp3',
    'music/Ken/Thx.mp3',
    'music/Ken/yes.mp3',
    'music/Lone/Blitz.mp3',
    'music/Lone/Catch a kill.mp3',
    'music/Lone/If looks could kill.mp3',
    'music/Lone/Leash.mp3',
    'music/Lone/n(n).mp3',
    'music/Travis/4X4.mp3',
    'music/Travis/Backyard.mp3',
    'music/Travis/Beep beep.mp3',
    'music/Travis/Highest in the room.mp3',
    'music/Travis/wokeuplikethis.mp3'
  ]);

  const init = () => {
    if (isInitialized) return;

    // Ensure currentIndex is within bounds
    if (typeof currentIndex !== 'number' || currentIndex < 0 || currentIndex >= songPaths.length) {
      currentIndex = 0;
    }

    const source = songPaths[currentIndex];
    audio = new Audio(source);
    audio.loop = true;
    audio.volume = 0.2;

    isInitialized = true;
  };

  const play = () => {
    if (!audio) return;
    audio.play().catch(err => console.error('Playback failed:', err));
  };

  const unmute = () => {
    if (!audio) return;
    audio.volume = 0.6;
    isMuffled = false;
  };

  const muffle = () => {
    if (!audio) return;
    audio.volume = 0.2;
    isMuffled = true;
  };

  const unpause = () => {
    if (audio && audio.paused) audio.play();
  };

  const _setTrack = idx => {
    if (!Array.isArray(songPaths) || songPaths.length === 0) return;
    currentIndex = ((idx % songPaths.length) + songPaths.length) % songPaths.length;
    const src = songPaths[currentIndex];
    if (!audio) {
      audio = new Audio(src);
      audio.loop = true;
      audio.volume = isMuffled ? 0.2 : 0.6;
      isInitialized = true;
    } else {
      const wasPlaying = !audio.paused;
      audio.src = src;
      if (wasPlaying) {
        audio.play().catch(() => {});
      }
    }
  };

  const next = () => {
    _setTrack(currentIndex + 1);
  };

  const prev = () => {
    _setTrack(currentIndex - 1);
  };

  const getCurrentTitle = () => {
    try { return songPaths[currentIndex].split('/').pop(); } catch(e) { return '' }
  };

  const pause = () => { if (audio) try { audio.pause(); } catch(e) {} };
  const isPlaying = () => { try { return !!(audio && !audio.paused); } catch(e){ return false } };
  const toggleMute = () => { if (audio) audio.muted = !audio.muted; };
  const isMuted = () => { try { return !!(audio && audio.muted); } catch(e){ return false } };

  return {
    init,
    play,
    unmute,
    muffle,
    unpause
    , next
    , prev
    , getCurrentTitle
    , pause
    , isPlaying
    , toggleMute
    , isMuted
  };
})();

window.AudioManager = AudioManager;
