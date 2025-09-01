// js/app.js
document.addEventListener('DOMContentLoaded', () => {
  const agendar = document.getElementById('btn-agendar');
  const area    = document.getElementById('btn-area');

  agendar?.addEventListener('click', () => {
    // vai direto para o calendário
    location.href = 'servicos.html';
  });

  area?.addEventListener('click', () => {
    // vai para a tela de login
    location.href = 'login.html';
  });

  // (opcional) handlers do dock
  ['dock-whatsapp','dock-phone','dock-map'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', e => {
      e.preventDefault();
      console.log(`[Dock] ${id} clicado`);
    });
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const track = document.querySelector('.hero-carousel .carousel-track');
  const slides = Array.from(track.children);
  const dotsContainer = document.querySelector('.hero-carousel .dots');

  // criar dots
  slides.forEach((_, i) => {
    const btn = document.createElement('button');
    if (i === 0) btn.classList.add('is-active');
    btn.addEventListener('click', () => goToSlide(i));
    dotsContainer.appendChild(btn);
  });

  const dots = Array.from(dotsContainer.children);
  let index = 0;

  function goToSlide(i) {
    index = i;
    track.style.transform = `translateX(-${100 * i}%)`;
    dots.forEach((d, j) => d.classList.toggle('is-active', j === i));
  }

  // autoplay
  setInterval(() => {
    index = (index + 1) % slides.length;
    goToSlide(index);
  }, 4000); // 4s
});
