window.addEventListener('DOMContentLoaded', () => {
  const spotlight = document.querySelector('.spotlight-overlay');
  const firstInput = document.getElementById('firstNameInput');
  const lastInput = document.getElementById('lastNameInput');
  const startBtn = document.getElementById('themeidaStartBtn');
  const miniPrev = document.getElementById('miniPrev');
  const miniPlay = document.getElementById('miniPlay');
  const miniNext = document.getElementById('miniNext');
  const miniMute = document.getElementById('miniMute');
  const INTRO_FADE_MS = 4200;
  let introFadeStarted = false;
  let proximityEnabled = true;

  const loadStoredName = () => {
    try {
      const first = localStorage.getItem('mf25FirstName') || '';
      const last = localStorage.getItem('mf25LastName') || '';
      if (firstInput) firstInput.value = first;
      if (lastInput) lastInput.value = last;
    } catch (e) {}
  };
  loadStoredName();

  const startMuffled = async () => {
    try {
      if (!window.AudioManager) return;
      AudioManager.init();
      AudioManager.muffle();
      await AudioManager.play();
      await AudioManager.resumeContext?.();
    } catch (e) {
      console.warn('Intro audio start failed', e);
    }
  };

  const fadeInToFullVolume = () => {
    try {
      if (!window.AudioManager) return;
      AudioManager.init();
      AudioManager.rampTo?.(0.01, 120); // dip to near-silence before rising
      AudioManager.unmute?.(INTRO_FADE_MS);
    } catch (e) {}
  };

  const prepareIntroFade = () => {
    try {
      if (!window.AudioManager) return;
      AudioManager.rampTo?.(0.02, 180);
    } catch (e) {}
  };

  const expandSpotlight = (e) => {
    return new Promise((resolve) => {
      try {
        if (!spotlight) return resolve();
        const x = e?.clientX ?? window.innerWidth / 2;
        const y = e?.clientY ?? window.innerHeight / 2;
        spotlight.style.setProperty('--mouse-x', `${x}px`);
        spotlight.style.setProperty('--mouse-y', `${y}px`);
        spotlight.classList.add('spotlight-expand');
        setTimeout(resolve, 600);
      } catch (err) {
        resolve();
      }
    });
  };

  const namesValid = () => {
    const first = (firstInput?.value || '').trim();
    const last = (lastInput?.value || '').trim();
    if (!first) { firstInput?.focus(); return false; }
    if (!last) { lastInput?.focus(); return false; }
    return true;
  };

  const refreshMini = () => {
    try {
      if (!window.AudioManager) {
        if (miniPlay) miniPlay.textContent = '▶';
        if (miniMute) miniMute.textContent = '🔊';
        return;
      }
      if (miniPlay) miniPlay.textContent = AudioManager.isPlaying() ? '⏸' : '▶';
      if (miniMute) miniMute.textContent = AudioManager.isMuted() ? '🔇' : '🔊';
    } catch (e) {}
  };

  const wireMiniControls = () => {
    if (miniPrev) miniPrev.addEventListener('click', () => { try { AudioManager.init(); AudioManager.prev(); refreshMini(); } catch(e){} });
    if (miniNext) miniNext.addEventListener('click', () => { try { AudioManager.init(); AudioManager.next(); refreshMini(); } catch(e){} });
    if (miniMute) miniMute.addEventListener('click', () => { try { AudioManager.init(); AudioManager.toggleMute(); refreshMini(); } catch(e){} });
    if (miniPlay) miniPlay.addEventListener('click', async () => {
      try {
        AudioManager.init();
        if (AudioManager.isPlaying && AudioManager.isPlaying()) {
          AudioManager.pause();
        } else {
          await startMuffled();
        }
        refreshMini();
      } catch (e) {}
    });
    refreshMini();
    setInterval(refreshMini, 800);
  };
  wireMiniControls();

  // Dedicated start button inside the name card
  if (startBtn) {
    startBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (!namesValid()) return;
      try {
        const first = (firstInput?.value || '').trim();
        const last = (lastInput?.value || '').trim();
        localStorage.setItem('mf25FirstName', first);
        localStorage.setItem('mf25LastName', last);
      } catch (err) {}
      await enterSite(e); // triggers start + transition + unmute
    });
  }

  const enterSite = async (e) => {
    e.preventDefault();

    // Make music muffled.
    await startMuffled();
    prepareIntroFade();

    // Run spotlight expansion transition .
    await expandSpotlight(e);

    // Replace intro content with a persistent content iframe (shell) so audio keeps playing.
    if (spotlight) {
      setTimeout(() => { spotlight.style.display = 'none'; }, 150);
    }
    const theme = document.getElementById('themeidaPlayer');
    if (theme) {
      theme.style.pointerEvents = 'none';
      theme.style.opacity = '0';
      setTimeout(() => { try { theme.remove(); } catch(e){} }, 350);
    }

    const content = document.createElement('iframe');
    content.id = 'contentFrame';
    content.name = 'contentFrame';
    content.src = 'index.html';
    content.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;border:0;';
    document.body.appendChild(content);
    // Inject a persistent floating player UI into the parent (this document)
    // so controls are available while the content iframe is visible.
    try {
      const existing = document.getElementById('persistentPlayer');
      if (!existing) {
        const playerWrap = document.createElement('div');
        playerWrap.id = 'persistentPlayer';
        playerWrap.className = 'player-ui';
        playerWrap.innerHTML = `
          <button id="playerPrev" class="ctrl">⏮</button>
          <button id="playerPlay" class="ctrl">▶</button>
          <button id="playerNext" class="ctrl">⏭</button>
          <button id="playerMute" class="ctrl">🔊</button>
          <span id="playerTrack" style="margin-left:8px; font-weight:600; display:none;"></span>
        `;
        document.body.appendChild(playerWrap);

        const prev = document.getElementById('playerPrev');
        const play = document.getElementById('playerPlay');
        const next = document.getElementById('playerNext');
        const mute = document.getElementById('playerMute');
        const track = document.getElementById('playerTrack');

        function refresh() {
          try {
            if (!window.AudioManager) {
              if (play) play.textContent = '▶';
              if (mute) mute.textContent = '🔊';
              if (track) track.textContent = '';
              return;
            }
            if (play) play.textContent = AudioManager.isPlaying() ? '⏸' : '▶';
            if (mute) mute.textContent = AudioManager.isMuted() ? '🔇' : '🔊';
            try { if (track) track.textContent = ''; } catch(e) { if (track) track.textContent = ''; }
          } catch (e) {}
        }

        prev && prev.addEventListener('click', () => { try { AudioManager.init(); AudioManager.prev(); refresh(); } catch(e){} });
        next && next.addEventListener('click', () => { try { AudioManager.init(); AudioManager.next(); refresh(); } catch(e){} });
        mute && mute.addEventListener('click', () => { try { if (!AudioManager) return; AudioManager.toggleMute(); refresh(); } catch(e){} });

        play && play.addEventListener('click', async () => {
          try {
            if (!window.AudioManager) return;
            AudioManager.init();
            if (AudioManager.isPlaying && AudioManager.isPlaying()) {
              AudioManager.pause();
            } else {
              await AudioManager.play().catch(err => console.warn('Play failed', err));
            }
            refresh();
          } catch (e) { console.warn(e); }
        });

        refresh();
        setInterval(refresh, 600);
      }
    } catch(e) { console.warn('Player injection failed', e); }

    // After the content is loaded/visible, clear the muffling so the main site plays normally.
    const unmuteNow = () => {
      if (introFadeStarted) return;
      introFadeStarted = true;
      fadeInToFullVolume();
    };
    content.addEventListener('load', unmuteNow);
    setTimeout(unmuteNow, 600);

    // Disable proximity once we leave intro
    proximityEnabled = false;
  };

  // Proximity volume
  const updateProximity = (e) => {
    try {
      if (!proximityEnabled || !startBtn || !window.AudioManager) return;
      const rect = startBtn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = 500;
      const factor = Math.max(0.1, 1.5 - dist / maxDist); // closer = stronger lift
      AudioManager.setProximityBoost?.(factor);
    } catch (err) {}
  };
  window.addEventListener('pointermove', updateProximity);
});

document.addEventListener('mousemove', (e) => {
  document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
  document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
});
