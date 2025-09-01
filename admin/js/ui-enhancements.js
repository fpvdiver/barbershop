// admin/js/ui-enhancements.js
(function () {
  // ==== Helper $$$ ====
  const $ = (q, root=document)=>root.querySelector(q);
  const $$ = (q, root=document)=>Array.from(root.querySelectorAll(q));

  // ==== 1) Responsive Tables: auto data-label ====
  function applyTableDataLabels() {
    $$('.table').forEach(table => {
      const headCells = $$('thead th', table).map(th => th.textContent.trim());
      // para cada linha do tbody, grave data-label no td correspondente
      $$('tbody tr', table).forEach(tr => {
        $$('td', tr).forEach((td, i) => {
          const label = headCells[i] || td.getAttribute('data-label') || '';
          td.setAttribute('data-label', label);
        });
      });
    });
  }

  // ==== 2) Off-canvas & Drawers: teclado e foco ====
  function setupOffCanvas() {
    const sidebar = $('#sidebar');
    const overlay = $('#overlay');
    const btnMenu = $('#btnMenu');
    if (!sidebar || !btnMenu) return;

    const openMenu = ()=>{ sidebar.classList.add('open'); if (overlay) overlay.hidden=false; btnMenu.setAttribute('aria-expanded','true'); };
    const closeMenu = ()=>{ sidebar.classList.remove('open'); if (overlay) overlay.hidden=true; btnMenu.setAttribute('aria-expanded','false'); };
    btnMenu.addEventListener('click', ()=> sidebar.classList.contains('open')?closeMenu():openMenu());
    overlay?.addEventListener('click', closeMenu);

    // atalhos globais p/ menu
    document.addEventListener('keydown', (e)=>{
      if (e.altKey && (e.key==='m' || e.key==='M')) { e.preventDefault(); sidebar.classList.contains('open')?closeMenu():openMenu(); }
      if (e.key === 'Escape') { closeMenu(); closeAnyDrawer(); }
    });
  }

  function trapFocus(container) {
    const focusable = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const nodes = $$(focusable, container);
    if (!nodes.length) return ()=>{};
    const first = nodes[0], last = nodes[nodes.length-1];
    function handler(e){
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    container.addEventListener('keydown', handler);
    return ()=> container.removeEventListener('keydown', handler);
  }

  let activeDrawer = null;
  let releaseTrap = null;

  function openDrawer(el) {
    if (!el) return;
    el.classList.add('open');
    activeDrawer = el;
    if ($('#overlay2')) $('#overlay2').classList.add('show');
    // foco inicial
    const target = $('input,select,textarea,button', el);
    (target || el).focus();
    releaseTrap = trapFocus(el);
  }
  function closeDrawer(el=null) {
    const d = el || activeDrawer;
    if (!d) return;
    d.classList.remove('open');
    if ($('#overlay2')) $('#overlay2').classList.remove('show');
    if (releaseTrap) { releaseTrap(); releaseTrap=null; }
    activeDrawer = null;
  }
  function closeAnyDrawer() { if (activeDrawer) closeDrawer(activeDrawer); }

  function setupDrawersAuto() {
    // Se a página já tiver drawer com id #drawer e botões padrão, adiciona handlers
    const d = $('#drawer');
    if (!d) return;
    $('#btnClose')?.addEventListener('click', ()=> closeDrawer(d));
    $('#overlay2')?.addEventListener('click', ()=> closeDrawer(d));
    // Exporte handlers globais (opcional)
    window.Drawer = { open: ()=>openDrawer(d), close: ()=>closeDrawer(d) };
  }

  // ==== 3) Atalhos contextuais ====
  function setupShortcuts() {
    document.addEventListener('keydown', (e)=>{
      // Save
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==='s') {
        const btn = $('#btnSave');
        if (btn) { e.preventDefault(); btn.click(); }
      }
      // New
      if (e.altKey && (e.key==='n' || e.key==='N')) {
        const btn = $('#btnNova') || $('#btnNew');
        if (btn) { e.preventDefault(); btn.click(); }
      }
      // Close drawer
      if (e.altKey && (e.key==='w' || e.key==='W')) {
        if (activeDrawer) { e.preventDefault(); closeDrawer(); }
      }
    });
  }

  // ==== 4) Boot ====
  document.addEventListener('DOMContentLoaded', () => {
    // aplica data-labels nas tabelas (para empilhamento mobile)
    applyTableDataLabels();
    // off-canvas e keyboard
    setupOffCanvas();
    // drawers padrões (se existirem)
    setupDrawersAuto();
    // atalhos
    setupShortcuts();
  });

  // re-aplicar labels se o DOM mudar (ex.: render dinâmico)
  const mo = new MutationObserver((mut)=> {
    if (mut.some(m => m.addedNodes && m.addedNodes.length)) applyTableDataLabels();
  });
  mo.observe(document.body, { childList: true, subtree: true });

  // APIs globais úteis
  window.UIX = {
    applyTableDataLabels,
    openDrawer,
    closeDrawer,
  };
})();
