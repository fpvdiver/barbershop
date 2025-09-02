// /js/profissionais.js
(() => {
  const GRID = document.getElementById('profGrid');
  const BTN_CONTINUAR = document.getElementById('btn-continuar');
  const BTN_VOLTAR = document.getElementById('btn-voltar');

  const N8N_BASE =
    localStorage.getItem('n8n_base') ||
    'https://primary-odonto.up.railway.app/webhook/barber';
  const API = `${N8N_BASE}/professionals`;

  // legenda (opcional)
  const iso  = sessionStorage.getItem('booking.date') || '';
  const time = sessionStorage.getItem('booking.time') || '';
  if (iso && time) {
    const d = new Date(iso);
    const legenda = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    const header = document.querySelector('.top .title');
    if (header) {
      const note = document.createElement('div');
      note.style.fontSize = '12px';
      note.style.color = '#6b7280';
      note.textContent = `Disponíveis para ${legenda} às ${time}`;
      header.insertAdjacentElement('afterend', note);
    }
  }

  let selectedId = null;

  // --- helper: extrai lista independente do formato vindo do n8n ---
  function extractList(data) {
    // Já é array direto?
    if (Array.isArray(data)) return data.slice();

    // Campo professionals como array?
    if (Array.isArray(data?.professionals)) return data.professionals.slice();

    // Campo professionals como objeto { "0": {...}, "1": {...} } ?
    if (data?.professionals && typeof data.professionals === 'object') {
      try { return Object.values(data.professionals); } catch {}
    }

    // Campo items como array?
    if (Array.isArray(data?.items)) return data.items.slice();

    return [];
  }

  async function loadProfessionals() {
    // skeleton
    GRID.innerHTML = `
      <div class="card skeleton"></div>
      <div class="card skeleton"></div>
      <div class="card skeleton"></div>
      <div class="card skeleton"></div>
    `;

    try {
      const params = { date: iso, time, duration: 30 };
      if (!params.date || !params.time) params.includeUnavailable = 1;

      const url = `${API}?${new URLSearchParams(params).toString()}`;
      console.log('[professionals] endpoint =', url);

      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = text; }
      console.log('[professionals] payload =', data);

      let list = extractList(data);
      console.log('[professionals] list (after extract) =', list, 'len=', list.length);

      if (!list.length) {
        GRID.innerHTML = `<p style="color:#6b7280">Nenhum profissional encontrado.</p>`;
        BTN_CONTINUAR.disabled = true;
        return;
      }

      // Render de TODOS de uma vez (nunca sobrescrever dentro do loop!)
      GRID.innerHTML = list.map(p => `
        <button class="card" data-id="${p.id}" aria-label="Selecionar ${p.name || 'profissional'}">
          <img src="${p.avatar || `https://i.pravatar.cc/160?u=${encodeURIComponent(p.id || p.name || '')}`}" class="avatar" alt="${p.name || 'Profissional'}">
          <div class="name">${p.name || 'Profissional'}</div>
          ${p.skills?.length ? `<div class="skills">${p.skills.join(', ')}</div>` : ''}
          <div class="badge ${p.available ? 'ok' : 'off'}">${p.available ? 'Disponível' : 'Indisponível'}</div>
        </button>
      `).join('');

      // listeners
      GRID.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => {
          GRID.querySelectorAll('.card.selected').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          selectedId = card.dataset.id;
          BTN_CONTINUAR.disabled = false;
          sessionStorage.setItem('booking.professional_id', selectedId);
        });
      });

      // pré-seleção
      const saved = sessionStorage.getItem('booking.professional_id');
      if (saved) GRID.querySelector(`.card[data-id="${CSS.escape(saved)}"]`)?.click();

    } catch (err) {
      console.error(err);
      GRID.innerHTML = `
        <div class="alert error">
          <strong>Erro ao carregar profissionais</strong><br>
          <small>${err.message}</small>
        </div>
        <button class="btn" id="btnTry">Tentar novamente</button>
      `;
      document.getElementById('btnTry')?.addEventListener('click', loadProfessionals);
      BTN_CONTINUAR.disabled = true;
    }
  }

  BTN_VOLTAR?.addEventListener('click', () => history.back());
  BTN_CONTINUAR?.addEventListener('click', () => {
    if (!selectedId) return;
    location.href = 'login.html';
  });

  loadProfessionals();
})();
