// overlay follows the user's pointer or touch.
(function(){
  function update(e){
    const ev = e.touches ? e.touches[0] : e;
    const x = ev ? ev.clientX : (window.innerWidth/2);
    const y = ev ? ev.clientY : (window.innerHeight/2);
    try {
      document.documentElement.style.setProperty('--mouse-x', x + 'px');
      document.documentElement.style.setProperty('--mouse-y', y + 'px');
    } catch(e){}
  }

  window.addEventListener('mousemove', update);
  window.addEventListener('touchmove', update, { passive: true });

  // initialize center
  document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.style.setProperty('--mouse-x', (window.innerWidth/2) + 'px');
    document.documentElement.style.setProperty('--mouse-y', (window.innerHeight/2) + 'px');
  });
})();
