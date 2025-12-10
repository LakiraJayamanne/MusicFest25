// audioManager.js

const AudioManager = (() => {
  let audio = null;
  let isInitialized = false;
  let isMuffled = true;
  let introEnded = false;
  let currentIndex = 0;
  let audioCtx = null;
  let mediaSource = null;
  let filterNode = null;
  let gainNode = null;
  let currentSource = null;
  const trackListeners = [];
  const MAX_GAIN = 0.5; // hard cap for overall volume (50%)
  let baseGain = MAX_GAIN;
  let proximityFactor = 1;

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  const trackMeta = (src) => {
    if (!src || typeof src !== 'string') return { src: '', artistKey: '', title: '' };
    const parts = src.split('/');
    const file = parts[parts.length - 1] || '';
    return {
      src,
      artistKey: parts.length >= 2 ? parts[parts.length - 2] : '',
      title: file.replace('.mp3', '')
    };
  };

  const notifyTrackChange = (src) => {
    currentSource = src || currentSource;
    const meta = trackMeta(currentSource);
    trackListeners.forEach(fn => { try { fn(meta); } catch (e) {} });
  };

  const updateGain = () => {
    if (gainNode) {
      gainNode.gain.value = clamp(baseGain * proximityFactor, 0, MAX_GAIN);
    }
  };

  const setFilterFreq = (freq) => {
    if (filterNode && typeof freq === 'number') {
      filterNode.frequency.value = clamp(freq, 50, 20000);
    }
  };

  const shuffleArray = arr => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const songPaths = shuffleArray([
    'music/Carti/Beef.mp3',
    'music/Carti/RIP Fredo.mp3',
    'music/Carti/Stop Breathing.mp3',
    'music/Carti/Toxic.mp3',
    'music/Carti/wokeuplikethis.mp3',

    'music/Donny/Bandit.mp3',
    'music/Donny/Kryptonite.mp3',
    'music/Donny/New drop.mp3',
    'music/Donny/No pole.mp3',
    'music/Donny/Tiramisu.mp3',

    'music/Kanye/Burn.mp3',
    'music/Kanye/Everything i am.mp3',
    'music/Kanye/Fuk sumn.mp3',
    'music/Kanye/On sight.mp3',
    'music/Kanye/Touch the sky.mp3',

    'music/Ken/Fighting my demons.mp3',
    'music/Ken/Rock n Roll.mp3',
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
    'music/Travis/Till further notice.mp3',
    'music/Travis/I know.mp3',

    'music/Uzi/Aye.mp3',
    'music/Uzi/For fun.mp3',
    'music/Uzi/Homecoming.mp3',
    'music/Uzi/Space High.mp3',
    'music/Uzi/x2.mp3',

    'music/Yeat/1093.mp3',
    'music/Yeat/Come n Go.mp3',
    'music/Yeat/Money Twerk.mp3',
    'music/Yeat/Nun Id Change.mp3',
    'music/Yeat/Out the way.mp3',
    'music/Yeat/System.mp3'
  ]);

  const init = () => {
    if (isInitialized) return;


    if (typeof currentIndex !== 'number' || currentIndex < 0 || currentIndex >= songPaths.length) {
      currentIndex = 0;
    }

    const source = songPaths[currentIndex];
    currentSource = source;
    audio = new Audio(source);
    audio.loop = true;
    audio.volume = 1; // control volume via gainNode/baseGain instead

    // attempt to create an AudioContext for playback resume handling
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audio && audioCtx && !mediaSource) {
        try {
          mediaSource = audioCtx.createMediaElementSource(audio);
          filterNode = audioCtx.createBiquadFilter();
          filterNode.type = 'lowpass';
          filterNode.frequency.value = 18000;
          gainNode = audioCtx.createGain();
          updateGain();
          mediaSource.connect(filterNode);
          filterNode.connect(gainNode);
          gainNode.connect(audioCtx.destination); // ensure audio is routed to output
          
        } catch (e) {
          console.warn('AudioManager: media source setup failed', e);
        }
      }
    } catch (e) {}

    isInitialized = true;
    notifyTrackChange(currentSource);
  };

  const play = () => {
    if (!audio) return;
    try {
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
    } catch (e) {}
    audio.play().catch(err => console.error('Playback failed:', err));
  };

  const unmute = (fadeMs = 0) => {
    if (!audio) return;
    const currentGain = gainNode ? gainNode.gain.value : baseGain * proximityFactor;
    baseGain = MAX_GAIN;
    proximityFactor = 1;
    setFilterFreq(18000);
    isMuffled = false;
    if (fadeMs > 0 && gainNode && audioCtx) {
      const now = audioCtx.currentTime;
      try {
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(clamp(currentGain, 0, MAX_GAIN), now);
        gainNode.gain.linearRampToValueAtTime(clamp(baseGain, 0, MAX_GAIN), now + fadeMs / 1000);
      } catch (e) {
        rampTo(baseGain, fadeMs);
      }
    } else {
      updateGain();
    }
  };

  const rampTo = (target, durationMs = 600) => {
    if (!gainNode || !audioCtx) return;
    const now = audioCtx.currentTime;
    try {
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.linearRampToValueAtTime(clamp(target, 0, MAX_GAIN), now + durationMs / 1000);
    } catch (e) {
      gainNode.gain.value = clamp(target, 0, MAX_GAIN);
    }
  };

  const muffle = () => {
    if (!audio) return;
    baseGain = 0.3; // louder while muffled
    setFilterFreq(1200); // keep some highs
    updateGain();
    isMuffled = true;
  };

  const setSource = (src, autoplay = true, loop = true) => {
    if (!src) return;
    init();
    if (!audio) {
      audio = new Audio(src);
      audio.loop = loop;
      audio.volume = 1;
      isInitialized = true;
    } else {
      const wasPlaying = !audio.paused;
      audio.src = src;
      audio.loop = loop;
      audio.volume = 1;
      if (autoplay || wasPlaying) {
        audio.play().catch(() => {});
      }
    }
    notifyTrackChange(src);
    if (autoplay) play();
  };

  const _setTrack = idx => {
    if (!Array.isArray(songPaths) || songPaths.length === 0) return;
    currentIndex = ((idx % songPaths.length) + songPaths.length) % songPaths.length;
    const src = songPaths[currentIndex];
    currentSource = src;
    if (!audio) {
      audio = new Audio(src);
      audio.loop = true;
      audio.volume = 1; // rely on gain node for loudness
      isInitialized = true;
    } else {
      const wasPlaying = !audio.paused;
      audio.src = src;
      audio.volume = 1;
      if (wasPlaying) {
        audio.play().catch(() => {});
      }
    }
    notifyTrackChange(src);
  };

  const next = () => {
    _setTrack(currentIndex + 1);
  };

  const prev = () => {
    _setTrack(currentIndex - 1);
  };

  const pause = () => { if (audio) try { audio.pause(); } catch(e) {} };
  const isPlaying = () => { try { return !!(audio && !audio.paused); } catch(e){ return false } };
  const toggleMute = () => { if (audio) audio.muted = !audio.muted; };
  const isMuted = () => { try { return !!(audio && audio.muted); } catch(e){ return false } };
  const getAudioElement = () => audio;
  const resumeContext = async () => { try { if (audioCtx && audioCtx.state === 'suspended') await audioCtx.resume(); } catch(e){} };
  const setProximityBoost = (factor) => {
    proximityFactor = clamp(factor, 0.2, 1.2);
    updateGain();
  };

  const getTracksByArtist = (artistKey) => {
    if (!artistKey || !Array.isArray(songPaths)) return [];
    return songPaths.filter(p => p.startsWith(`music/${artistKey}/`));
  };

  return {
    init,
    play,
    unmute,
    muffle,
    next
    , prev
    , pause
    , isPlaying
    , toggleMute
    , isMuted
    , getAudioElement
    , resumeContext
    , rampTo
    , setProximityBoost
    , setSource
    , getTracksByArtist
    , onTrackChange: (fn) => { if (typeof fn === 'function') trackListeners.push(fn); }
    , getCurrentTrack: () => trackMeta(currentSource)
  };
})();

window.AudioManager = AudioManager;
