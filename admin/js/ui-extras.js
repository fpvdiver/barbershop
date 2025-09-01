// admin/js/ui-extras.js
(function () {
  const $ = (q, root=document)=>root.querySelector(q);

  // ===== THEME MANAGER =====
  const THEME_KEY = 'theme'; // 'light' | 'dark' | 'system'
  const prefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

  function applyTheme(mode) {
    // mode: 'light'|'dark'|'system'
    let final = mode;
    if (mode === 'system') final = prefersDark() ? 'dark' : 'light';
    document.documentElement.dataset.theme = final; // opcional para CSS específicos
    // Dica: se quiser forçar variações por [data-theme="dark"] no futuro.
    document.documentElement.classList.toggle('dark', final === 'dark');
    // Nada mais é preciso porque seu CSS usa prefers-color-scheme. 
    // O data-theme serve para você criar exceções, se necessário.
  }

  function getTheme() {
    return localStorage.getItem(THEME_KEY) || 'system';
  }

  function setTheme(mode) {
    localStorage.setItem(THEME_KEY, mode);
    applyTheme(mode);
    updateToggleIcon(mode);
  }

  function cycleTheme() {
    const order = ['light', 'dark', 'system'];
    const cur = getTheme();
    const next = order[(order.indexOf(cur)+1) % order.length];
    setTheme(next);
    UIX.toast(`Tema: ${next === 'system' ? 'Sistema' : next === 'dark' ? 'Escuro' : 'Claro'}`, 'info', { duration: 1200 });
  }

  function themeIcon(mode) {
    if (mode === 'light')  return '☀️';
    if (mode === 'dark')   return '🌙';
    return '🖥️'; // system
  }

  function updateToggleIcon(mode) {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.textContent = themeIcon(mode);
    btn.setAttribute('aria-label', `Alternar tema (atual: ${mode})`);
    btn.title = `Tema: ${mode}`;
  }

  function injectThemeToggle() {
    // tenta colocar na .topbar, lado direito
    const topbar = document.querySelector('.topbar .user') || document.querySelector('.topbar');
    if (!topbar) return;
    if (document.getElementById('themeToggle')) return;

    const btn = document.createElement('button');
    btn.id = 'themeToggle';
    btn.className = 'theme-btn';
    btn.type = 'button';
    btn.addEventListener('click', cycleTheme);
    topbar.prepend(btn);
    updateToggleIcon(getTheme());
  }

  // re-aplica em mudanças do SO quando em 'system'
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getTheme() === 'system') applyTheme('system');
  });

  // ===== TOASTS =====
  const STACK_ID = 'toastStack';
  function ensureStack() {
    let s = document.getElementById(STACK_ID);
    if (!s) {
      s = document.createElement('div');
      s.id = STACK_ID;
      s.className = 'toast-stack';
      document.body.appendChild(s);
    }
    return s;
  }

  function toast(message, type='info', opts={}) {
    const { title, duration=2500, action, onAction } = opts;
    const stack = ensureStack();

    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.setAttribute('role','status');
    el.innerHTML = `
      <div class="t-icon">${typeIcon(type)}</div>
      <div class="t-body">
        ${title ? `<div class="t-title">${escapeHtml(title)}</div>` : ''}
        <div class="t-msg">${escapeHtml(message)}</div>
      </div>
      <div class="t-actions">
        ${action ? `<button class="t-close t-action">${escapeHtml(action)}</button>` : ''}
        <button class="t-close" aria-label="Fechar">×</button>
      </div>
    `;

    stack.appendChild(el);

    const closeBtn = el.querySelector('.t-close:last-child');
    closeBtn.addEventListener('click', () => dismiss());

    if (action) {
      el.querySelector('.t-action').addEventListener('click', () => {
        try { onAction && onAction(); } finally { dismiss(); }
      });
    }

    let to = null;
    if (duration > 0) to = setTimeout(() => dismiss(), duration);

    function dismiss() {
      if (to) clearTimeout(to);
      if (!el.parentNode) return;
      el.style.opacity = '0';
      el.style.transform = 'translateY(6px)';
      setTimeout(()=> el.remove(), 150);
    }

    // limita 5 toasts
    const items = Array.from(stack.children);
    while (items.length > 5) items.shift().remove();

    return { dismiss };
  }

  function typeIcon(t) {
    if (t==='success') return '✅';
    if (t==='warn')    return '⚠️';
    if (t==='error')   return '⛔';
    return 'ℹ️';
  }

  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

  // ===== Boot =====
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(getTheme());
    injectThemeToggle();
  });

  // ===== API Global =====
  window.UIX = window.UIX || {};
  window.UIX.toast = toast;
  window.Theme = { get: getTheme, set: setTheme, cycle: cycleTheme, apply: applyTheme };
})();
