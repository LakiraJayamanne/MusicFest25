// No automatic autoplay/resume. Music is controlled only by `player-ui.js`.
window.addEventListener('DOMContentLoaded', () => {
	try { localStorage.removeItem('autoplay'); } catch (e) {}
});
