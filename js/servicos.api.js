// js/servicos.api.js
(function () {
  // Descobre o endpoint
  const META = document.querySelector('meta[name="barber-services-endpoint"]')?.content;
  const ENDPOINT = META || 'https://primary-odonto.up.railway.app/webhook/barber/procedures';

  // Seletores
  const $ = (s, r = document) => r.querySelector(s);
  const listEl     = $('#servicos-list');
  const qEl        = $('#q');
  const orderEl    = $('#order');
  const retryBtn   = $('#btn-retry');
  const errorBox   = $('#srv-error');
  const skeletonEl = $('#srv-skeleton');
  const btnGo      = $('#btn-continua');

  // Estado in-memory
  let RAW = [];        // recebido do n8n
  let VIEW = [];       // filtrado/ordenado
  let SELECTED = new Set(
    JSON.parse(localStorage.getItem('selected_services') || '[]') // ids
  );

  // Helpers
  const money = (cents) => (Number(cents||0)/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

  function showLoading(flag) {
    if (skeletonEl) skeletonEl.hidden = !flag;
    if (listEl) listEl.hidden = flag;
  }

  function showError(msg) {
    console.error('[servicos]', msg);
    if (!errorBox) return;
    errorBox.hidden = false;
    errorBox.querySelector('.srv-msg')?.replaceChildren(document.createTextNode(msg));
  }

  function hideError() {
    if (errorBox) errorBox.hidden = true;
  }

  // Busca GET simples (sem headers que disparam preflight)
  async function fetchServices() {
    const url = new URL(ENDPOINT);
    // Se quiser delegar ordenação no front, não precisa mandar `order` aqui.
    // Se preferir que o Supabase já devolva ordenado, você pode usar query no n8n e repassar aqui.
    const res = await fetch(url.toString(), { method: 'GET', cache: 'no-cache', mode: 'cors' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  function render(list) {
    if (!listEl) return;
    if (!Array.isArray(list) || list.length === 0) {
      listEl.innerHTML = `<div class="muted">Nenhum serviço disponível.</div>`;
      return;
    }
    listEl.innerHTML = list.map(s => {
      const checked = SELECTED.has(String(s.id)) ? 'checked' : '';
      return `
        <label class="service-item" style="display:flex;gap:10px;align-items:center;border:1px solid var(--border);border-radius:12px;padding:10px;background:var(--card)">
          <input type="checkbox" class="srv-check" value="${s.id}" ${checked} style="transform:scale(1.2)">
          <div style="flex:1;min-width:0">
            <div class="service-title" style="font-weight:800">${s.name||''}</div>
            ${s.description ? `<div class="service-sub muted" style="font-size:.9rem">${s.description}</div>` : ``}
          </div>
          <div style="text-align:right">
            <div class="service-price" style="font-weight:800">${money(s.base_price_cents)}</div>
            <div class="service-time muted" style="font-size:.9rem">${s.duration_min} min</div>
          </div>
        </label>
      `;
    }).join('');
  }

  // Aplicar busca + ordenação
  function applyView() {
    const q = (qEl?.value || '').trim().toLowerCase();
    const order = orderEl?.value || 'duration_min.asc';

    VIEW = RAW
      .filter(s => {
        if (!q) return true;
        return (
          String(s.name||'').toLowerCase().includes(q) ||
          String(s.description||'').toLowerCase().includes(q)
        );
      })
      .sort((a,b) => {
        const [key, dir] = order.split('.');
        const va = a[key], vb = b[key];
        if (va == null && vb == null) return 0;
        if (va == null) return 1;
        if (vb == null) return -1;
        const cmp = (va < vb) ? -1 : (va > vb) ? 1 : 0;
        return dir === 'desc' ? -cmp : cmp;
      });

    render(VIEW);
  }

  // Persiste seleção e segue
  function goNext() {
    localStorage.setItem('selected_services', JSON.stringify([...SELECTED]));
    // se quiser já levar o total/duração somados:
    const chosen = RAW.filter(s => SELECTED.has(String(s.id)));
    const totalCents = chosen.reduce((acc,s)=> acc + (Number(s.base_price_cents)||0), 0);
    const totalMin   = chosen.reduce((acc,s)=> acc + (Number(s.duration_min)||0), 0);
    localStorage.setItem('selected_services_summary', JSON.stringify({ totalCents, totalMin }));
    // próximo passo
    location.href = 'calendario.html';
  }

  // Eventos UI
  listEl?.addEventListener('change', (e) => {
    const el = e.target;
    if (!(el instanceof HTMLInputElement)) return;
    if (el.classList.contains('srv-check')) {
      const id = String(el.value);
      if (el.checked) SELECTED.add(id); else SELECTED.delete(id);
      localStorage.setItem('selected_services', JSON.stringify([...SELECTED]));
    }
  });
  qEl?.addEventListener('input', applyView);
  orderEl?.addEventListener('change', applyView);
  retryBtn?.addEventListener('click', init);
  btnGo?.addEventListener('click', goNext);

  // Init
  async function init() {
    hideError();
    showLoading(true);
    try {
      RAW = await fetchServices();
      applyView();
    } catch (err) {
      showError(err?.message || 'Falha ao carregar serviços');
    } finally {
      showLoading(false);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
  console.log('[servicos] endpoint:', ENDPOINT);
})();
