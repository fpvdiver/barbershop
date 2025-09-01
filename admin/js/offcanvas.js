// js/offcanvas.js
(function () {
  function init() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const btnMenu  = document.getElementById('btnMenu');
    if (!sidebar || !overlay || !btnMenu) return;

    const open  = () => { sidebar.classList.add('open'); overlay.hidden = false; btnMenu.setAttribute('aria-expanded','true'); };
    const close = () => { sidebar.classList.remove('open'); overlay.hidden = true;  btnMenu.setAttribute('aria-expanded','false'); };

    // evita múltiplos handlers se o script for incluído mais de uma vez
    btnMenu.__ocBound && btnMenu.removeEventListener('click', btnMenu.__ocBound);
    overlay.__ocBound && overlay.removeEventListener('click', overlay.__ocBound);

    btnMenu.__ocBound = () => (sidebar.classList.contains('open') ? close() : open());
    overlay.__ocBound = close;

    btnMenu.addEventListener('click', btnMenu.__ocBound);
    overlay.addEventListener('click', overlay.__ocBound);

    // se redimensionar para desktop, garante fechado (estado consistente)
    window.addEventListener('resize', () => { if (window.innerWidth >= 900) close(); }, { passive:true });
  }

  // tenta ligar quando o DOM fica pronto e também após erros de outros scripts
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // se algum script dinâmico alterar o DOM, tenta religar
  const mo = new MutationObserver(() => init());
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();
