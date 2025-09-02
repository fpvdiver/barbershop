// js/servicos.api.js
(function () {
  // 1) Descobre a URL do webhook
  const META = document.querySelector('meta[name="barber-services-endpoint"]')?.content;
  const FALLBACK = 'https://primary-odonto.up.railway.app/webhook/barber/procedures';
  const ENDPOINT =
    (window.BARBER_API && window.BARBER_API.servicesUrl) ||
    META ||
    FALLBACK;

  // 2) Seletores
  const $ = (s, r = document) => r.querySelector(s);
  const listEl   = $('#servicos-list');     // <div id="servicos-list"> onde renderiza os cards/itens
  const retryBtn = $('#btn-retry');         // botão "Tentar novamente"
  const errorBox = $('#srv-error');         // container da mensagem de erro (opcional)

  // 3) Fetch sem headers que causam preflight
  async function fetchServicesFromRailway() {
    const url = new URL(ENDPOINT);
    // GET puro, sem Content-Type custom, sem Authorization no front, sem credentials:
    const res = await fetch(url.toString(), {
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache' // evita cache agressivo do browser
    });
    if (!res.ok) {
      const msg = `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return res.json();
  }

  function toBRL(cents) {
    const v = Number(cents || 0) / 100;
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function renderServices(list) {
    if (!listEl) return;
    if (!Array.isArray(list) || list.length === 0) {
      listEl.innerHTML = `<div class="muted">Nenhum serviço disponível.</div>`;
      return;
    }
    listEl.innerHTML = list.map(s => `
      <label class="service-item">
        <input type="checkbox" name="service" value="${s.id}" data-min="${s.duration_min}" data-price="${s.base_price_cents}">
        <div class="service-body">
          <div class="service-title">${s.name}</div>
          ${s.description ? `<div class="service-sub">${s.description}</div>` : ``}
        </div>
        <div class="service-right">
          <div class="service-price">${toBRL(s.base_price_cents)}</div>
          <div class="service-time">${s.duration_min} min</div>
        </div>
      </label>
    `).join('');
  }

  function showError(msg) {
    console.error('[servicos]', msg);
    if (errorBox) {
      errorBox.hidden = false;
      errorBox.querySelector('.srv-msg')?.replaceChildren(document.createTextNode(msg));
    }
  }

  async function loadServices() {
    try {
      if (errorBox) errorBox.hidden = true;
      const data = await fetchServicesFromRailway();
      renderServices(data);
    } catch (err) {
      // Erro de CORS fica como TypeError: Failed to fetch
      showError(err?.message || 'Falha ao buscar serviços');
    }
  }

  // 4) Eventos
  retryBtn?.addEventListener('click', loadServices);

  // 5) Auto-load
  document.addEventListener('DOMContentLoaded', loadServices);

  // 6) Debug opcional
  console.log('[servicos] endpoint:', ENDPOINT);
})();
