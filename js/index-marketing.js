document.addEventListener('DOMContentLoaded', () => {
  // rotas existentes
  document.getElementById('btn-agendar')?.addEventListener('click', () => location.href='calendario.html');
  document.getElementById('btn-area')?.addEventListener('click', () => location.href='login.html');

  // inicializa todos os carrosseis da página
  document.querySelectorAll('.carousel').forEach(initCarousel);
});

function initCarousel(root){
  const track = root.querySelector('.carousel-track');
  const slides = Array.from(track.children);
  const dotsWrap = root.querySelector('.dots');
  let i = slides.findIndex(s => s.classList.contains('is-active'));
  if(i < 0) i = 0;

  // cria dots
  slides.forEach((_, idx) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `slide ${idx+1}`);
    if(idx === i) b.classList.add('is-active');
    b.addEventListener('click', () => go(idx));
    dotsWrap.appendChild(b);
  });

  let timer, startX=0, dx=0;

  function go(n){
    i = (n + slides.length) % slides.length;
    track.style.transform = `translateX(-${i*100}%)`;
    dotsWrap.querySelectorAll('button').forEach((d,idx) => d.classList.toggle('is-active', idx===i));
    // pausa/reinicia vídeos
    slides.forEach(s => s.querySelector('video')?.pause());
    slides[i].querySelector('video')?.play().catch(()=>{});
  }
  function next(){ go(i+1); }
  function start(){ stop(); timer = setInterval(next, 4500); }
  function stop(){ if(timer) clearInterval(timer); }

  // swipe
  track.addEventListener('touchstart', e => { stop(); startX = e.touches[0].clientX; dx = 0; }, {passive:true});
  track.addEventListener('touchmove',  e => { dx = e.touches[0].clientX - startX; }, {passive:true});
  track.addEventListener('touchend',   () => { if(Math.abs(dx)>40) go(i + (dx<0?1:-1)); start(); });

  // autoplay
  go(i); start();
  document.addEventListener('visibilitychange', ()=> document.hidden ? stop() : start());
}
