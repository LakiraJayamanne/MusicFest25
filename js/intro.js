window.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.play-btn');

  btn.addEventListener('click', async (e) => {
    e.preventDefault();

    // Do NOT initialize or start audio here. The music must be controlled only
    // by the visible player UI. This click only transitions to the main content.

    // Replace intro content with a persistent content iframe (shell) so audio keeps playing.
    const introContent = document.querySelector('.intro-content');
    if (introContent) introContent.style.display = 'none';
    const spotlight = document.querySelector('.spotlight-overlay');
    if (spotlight) spotlight.style.display = 'none';

    const content = document.createElement('iframe');
    content.id = 'contentFrame';
    content.name = 'contentFrame';
    content.src = 'index.html';
    content.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;border:0;';
    document.body.appendChild(content);
    // After the content is loaded/visible, clear the muffling so the main site plays normally.
    setTimeout(() => {
      try { if (window.AudioManager) AudioManager.unmute(); } catch (e) {}
    }, 400);
  });
});

document.addEventListener('mousemove', (e) => {
  document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
  document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
});
