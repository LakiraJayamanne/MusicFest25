window.addEventListener('DOMContentLoaded', () => {
  // Bind controls in the intro modal (if present). We removed the floating
  // player; the modal now contains the playback controls.
  const modal = document.getElementById('introPlayerModal');
  if (modal) {
    const prev = document.getElementById('introModalPrev');
    const play = document.getElementById('introModalPlay');
    const next = document.getElementById('introModalNext');
    const mute = document.getElementById('introModalMute');
    const track = document.getElementById('introModalTrack');

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
        try { if (track && AudioManager.getCurrentTitle) track.textContent = AudioManager.getCurrentTitle(); } catch(e) { if (track) track.textContent = ''; }
      } catch (e) {}
    }

    prev && prev.addEventListener('click', () => { try { AudioManager.init(); AudioManager.prev(); refresh(); } catch(e){} });
    next && next.addEventListener('click', () => { try { AudioManager.init(); AudioManager.next(); refresh(); } catch(e){} });
    mute && mute.addEventListener('click', () => { try { if (!AudioManager) return; AudioManager.toggleMute(); refresh(); } catch(e){} });

    play && play.addEventListener('click', async () => {
      try {
        if (!window.AudioManager) return;
        // Initialize with muffled behavior on intro
        AudioManager.init();
        try { AudioManager.muffle(); } catch(e){}
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
});
