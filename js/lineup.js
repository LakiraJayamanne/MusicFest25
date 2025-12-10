// Artist lineup interactions: overlay + hover preview using shared AudioManager

const overlayEl = document.getElementById('artistOverlay');
const overlayClose = overlayEl?.querySelector('.artist-overlay__close');
const overlayImg = document.getElementById('artistOverlayImg');
const overlayName = document.getElementById('artistOverlayName');
const overlayDesc = document.getElementById('artistOverlayDesc');
const overlayTrack = document.getElementById('artistTrackName');
const btnPrev = document.getElementById('artistPrev');
const btnPlay = document.getElementById('artistPlay');
const btnNext = document.getElementById('artistNext');
const getAudio = () => {
  if (window.parent && window.parent !== window && window.parent.AudioManager) {
    return window.parent.AudioManager;
  }
  return window.AudioManager;
};

let overlayActive = false;
let overlayPlaylist = [];
let overlayIndex = 0;
const FADE_MS = 400;
let hoverPauseTimeout = null;

// Artist metadata
const artistMeta = {
  Travis: { name: 'Travis Scott', desc: 'Jacques Bermon Webster II (born April 30, 1991), known professionally as Travis Scott, is an American rapper, singer, songwriter, and record producer. Known for his atmospheric blend of hip-hop and lo-fi influences, he has earned multiple number-one hits and industry awards.', img: 'images/Travis.jpeg' },

  Lone: { name: 'Destroy Lonely', desc: 'Bobby Wardell Sandimanie III (born July 30, 2001), known professionally as Destroy Lonely, is an American rapper, singer, and songwriter. His debut studio album If Looks Could Kill (2023) peaked at number 18 on the US Billboard 200 after his mixtape No Stylist (2022) entered at number 91.', img: 'images/Lone.jpeg' },

  Ken: { name: 'Ken Carson', desc: 'Kenyatta Lee Bettis Frazier Jr. (born April 11, 2000), known professionally as Ken Carson, is an American rapper and record producer from Atlanta. He gained attention on SoundCloud, collaborated with Destroy Lonely, and signed to Playboi Carti\'s Opium imprint in 2019 ahead of his debut album Project X (2021).', img: 'images/Ken.jpeg' },

  Carti: { name: 'Playboi Carti', desc: 'Jordan Terrell Carter (born 1995/1996), known professionally as Playboi Carti, is an American rapper noted for his eccentric vocals, fashion, and influence on modern hip-hop and the rage microgenre. His music leans atmospheric and avant-garde, emphasizing mood and persona over traditional lyricism.', img: 'images/Carti.jpeg' },

  Ye: { name: 'Ye', desc: 'Ye (born Kanye Omari West; June 8, 1977) is an American rapper, songwriter, and producer. Regarded as one of hip-hop\'s most influential figures, he is known for varied musical styles and polarizing cultural commentary.', img: 'images/Kanye.jpeg' },

  Uzi: { name: 'Lil Uzi Vert', desc: 'Symere Bysil Woods (born July 31, 1995), known professionally as Lil Uzi Vert, is an American rapper, singer, and songwriter. Celebrated for eclectic fashion and genre-blending hits, they rose after the 2015 mixtape Luv Is Rage and a deal with Atlantic Records under Generation Now.', img: 'images/Uzi.jpeg' },

  Donny: { name: 'Don Toliver', desc: 'Caleb Zackery “Don” Toliver (born June 12, 1994) is an American rapper, singer, and songwriter. His debut mixtape Donny Womack (2018) preceded his appearance on Travis Scott’s “Can’t Say,” leading to a signing with Cactus Jack Records.', img: 'images/Donny.jpeg' },

  Yeat: { name: 'Yeat', desc: 'Noah Olivier Smith (born February 26, 2000), known professionally as Yeat, is an American rapper, singer-songwriter, and producer. He is known for experimental rage-influenced sound, unique slang, and unconventional fashion featuring designer mixes and balaclavas.', img: 'images/Yeat.jpg' }
};

// Ordered per-artist tracks for overlay/hover
const artistTracks = {
  Travis: [
    'music/Travis/Beep beep.mp3',
    'music/Travis/4X4.mp3',
    'music/Travis/Till further notice.mp3',
    'music/Travis/Backyard.mp3',
    'music/Travis/I know.mp3'
  ],
  Lone: [
    'music/Lone/Blitz.mp3',
    'music/Lone/Leash.mp3',
    'music/Lone/If looks could kill.mp3',
    'music/Lone/Catch a kill.mp3',
    'music/Lone/n(n).mp3'
  ],
  Ken: [
    'music/Ken/Fighting my demons.mp3',
    'music/Ken/Shoot.mp3',
    'music/Ken/Rock n Roll.mp3',
    'music/Ken/Thx.mp3',
    'music/Ken/yes.mp3'
  ],
  Carti: [
    'music/Carti/Stop Breathing.mp3',
    'music/Carti/wokeuplikethis.mp3',
    'music/Carti/Toxic.mp3',
    'music/Carti/RIP Fredo.mp3',
    'music/Carti/Beef.mp3'
  ],
  Ye: [
    'music/Kanye/On sight.mp3',
    'music/Kanye/Touch the sky.mp3',
    'music/Kanye/Fuk sumn.mp3',
    'music/Kanye/Everything i am.mp3',
    'music/Kanye/Burn.mp3'
  ],
  Uzi: [
    'music/Uzi/x2.mp3',
    'music/Uzi/Homecoming.mp3',
    'music/Uzi/For fun.mp3',
    'music/Uzi/Aye.mp3',
    'music/Uzi/Space High.mp3'
  ],
  Donny: [
    'music/Donny/No pole.mp3',
    'music/Donny/Bandit.mp3',
    'music/Donny/Kryptonite.mp3',
    'music/Donny/New drop.mp3',
    'music/Donny/Tiramisu.mp3'
  ],
  Yeat: [
    'music/Yeat/Out the way.mp3',
    'music/Yeat/Money Twerk.mp3',
    'music/Yeat/System.mp3',
    'music/Yeat/Money so big.mp3',
    'music/Yeat/Come n Go.mp3',
    'music/Yeat/1093.mp3'
  ]
};

const clampIndex = (idx, arr) => {
  if (!arr || !arr.length) return 0;
  return ((idx % arr.length) + arr.length) % arr.length;
};

const getTracksForArtist = (artist) => {
  if (artistTracks[artist]) return artistTracks[artist];
  if (window.AudioManager?.getTracksByArtist) {
    const list = AudioManager.getTracksByArtist(artist);
    if (Array.isArray(list) && list.length) return list;
  }
  return [`music/${artist}/preview.mp3`];
};

const trackLabel = (path) => {
  if (!path) return '';
  const parts = path.split('/');
  return (parts[parts.length - 1] || '').replace('.mp3', '');
};

const clearHoverPause = () => {
  if (hoverPauseTimeout) {
    clearTimeout(hoverPauseTimeout);
    hoverPauseTimeout = null;
  }
};

const refreshOverlayControls = () => {
  if (!btnPlay) return;
  const audio = getAudio();
  const isPlaying = audio?.isPlaying?.();
  btnPlay.textContent = isPlaying ? '⏸' : '▶';
  if (overlayTrack && overlayPlaylist.length) {
    overlayTrack.textContent = trackLabel(overlayPlaylist[overlayIndex]);
  } else if (overlayTrack) {
    overlayTrack.textContent = '';
  }
};

const loadOverlayTrack = (idx, autoplay = true, muffled = false) => {
  const audio = getAudio();
  if (!overlayPlaylist.length || !audio) return;
  overlayIndex = clampIndex(idx, overlayPlaylist);
  const src = overlayPlaylist[overlayIndex];
  try {
    audio.init?.();
    if (muffled) {
      audio.muffle?.();
    } else {
      audio.unmute?.(0);
    }
    audio.setSource?.(src, autoplay, true);
    const el = audio.getAudioElement?.();
    if (el) {
      el.onended = () => loadOverlayTrack(overlayIndex + 1, true, false);
    }
    if (audio.rampTo) {
      const target = muffled ? 0.25 : 0.5;
      audio.rampTo(target, FADE_MS);
    }
  } catch (e) {}
  refreshOverlayControls();
};

const openOverlay = (artistKey) => {
  clearHoverPause();
  const meta = artistMeta[artistKey] || { name: artistKey, desc: '', img: '' };
  overlayPlaylist = getTracksForArtist(artistKey);
  overlayIndex = 0;
  if (overlayImg) {
    overlayImg.src = meta.img || '';
    overlayImg.alt = meta.name || artistKey;
  }
  if (overlayName) overlayName.textContent = meta.name || artistKey;
  if (overlayDesc) overlayDesc.textContent = meta.desc || 'No description available yet.';
  overlayActive = true;
  loadOverlayTrack(0, true, false);
  overlayEl?.classList.add('is-visible');
  overlayEl?.setAttribute('aria-hidden', 'false');
  refreshOverlayControls();
};

const closeOverlay = () => {
  overlayEl?.classList.remove('is-visible');
  overlayEl?.setAttribute('aria-hidden', 'true');
  overlayActive = false;
  try {
    const audio = getAudio();
    audio?.rampTo?.(0, FADE_MS);
    setTimeout(() => { try { audio?.pause?.(); } catch (e) {} }, FADE_MS);
  } catch (e) {}
};

// Wire overlay controls
if (btnPrev) btnPrev.addEventListener('click', () => loadOverlayTrack(overlayIndex - 1));
if (btnNext) btnNext.addEventListener('click', () => loadOverlayTrack(overlayIndex + 1));
if (btnPlay) btnPlay.addEventListener('click', () => {
  const audio = getAudio();
  if (!audio) return;
  audio.init?.();
  if (audio.isPlaying && audio.isPlaying()) {
    audio.rampTo?.(0, FADE_MS);
    setTimeout(() => { try { audio.pause(); } catch (e) {} }, FADE_MS);
  } else {
    loadOverlayTrack(overlayIndex, true, false);
  }
  refreshOverlayControls();
});
if (overlayClose) overlayClose.addEventListener('click', closeOverlay);
overlayEl?.addEventListener('click', (e) => {
  if (e.target === overlayEl || e.target === overlayEl.querySelector('.artist-overlay__backdrop')) {
    closeOverlay();
  }
});

// Artist card hover + tilt + click to open overlay
document.querySelectorAll('.artist-card').forEach(card => {
  const artist = card.dataset.artist;
  const tracks = getTracksForArtist(artist);

  card.addEventListener('mouseenter', () => {
    clearHoverPause();
    overlayPlaylist = tracks;
    overlayIndex = 0;
    loadOverlayTrack(0, true, true); // muffled preview on hover
  });

  card.addEventListener('mouseleave', () => {
    if (!overlayActive) {
      try {
        const audio = getAudio();
        audio?.rampTo?.(0, FADE_MS);
        clearHoverPause();
        hoverPauseTimeout = setTimeout(() => { try { audio?.pause?.(); } catch(e){} }, FADE_MS);
      } catch (e) {}
    }
    card.style.transform = `rotateY(0deg) rotateX(0deg)`;
  });

  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    card.style.transform = `rotateY(${x / 10}deg) rotateX(${-y / 10}deg)`;
  });

  card.addEventListener('click', () => {
    openOverlay(artist);
  });
});

// Pause global music on lineup load with fade
try {
  const audio = getAudio();
  audio?.rampTo?.(0, FADE_MS);
  setTimeout(() => { try { audio?.pause?.(); } catch (e) {} }, FADE_MS);
} catch (e) {}

// Automatically bring the main soundtrack back when leaving the lineup page
const resumeGlobalMusic = () => {
  try {
    const audio = getAudio();
    if (!audio) return;
    audio.init?.();
    audio.unmute?.(400);
    audio.play?.();
  } catch (e) {}
};

// Resume when navigating to another tab/page
document.querySelectorAll('.pill-nav__link').forEach(link => {
  if (link.classList.contains('active')) return;
  link.addEventListener('click', resumeGlobalMusic);
});

// Fallback: resume if the page is hidden or being unloaded
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') resumeGlobalMusic();
});
window.addEventListener('pagehide', resumeGlobalMusic);

// Soft spotlight that follows the cursor on the lineup page
const lineupSpotlight = document.querySelector('.lineup-spotlight');
if (lineupSpotlight) {
  const updateSpotlight = (e) => {
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    lineupSpotlight.style.setProperty('--spot-x', `${x}%`);
    lineupSpotlight.style.setProperty('--spot-y', `${y}%`);
  };
  window.addEventListener('pointermove', updateSpotlight);
}
