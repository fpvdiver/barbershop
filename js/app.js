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
