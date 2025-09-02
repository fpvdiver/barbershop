(() => {
  // --- Endpoint (ajuste se quiser trocar sem recompilar) ---
  const N8N_BASE = localStorage.getItem('n8n_base')
    || 'https://primary-odonto.up.railway.app/webhook/barber';
  const ENDPOINT = `${N8N_BASE}/professionals`;

  const GRID = document.getElementById('profGrid');
  const BTN_NEXT = document.getElementById('btn-next');
  const BTN_BACK = document.getElementById('btn-back');
  const LEGEND = document.getElementById('legend');

  // Monta a frase "Disponíveis para terça, 2 de setembro às 15:00"
  (function setLegend(){
    const iso = sessionStorage.getItem('booking.date');
    const time = sessionStorage.getItem('booking.time');
    if (!iso || !time) return;
    const d = new Date(iso);
    LEGEND.textContent = `Disponíveis para ${d.toLocaleDateString('pt-BR',{weekday:'long', day:'numeric', month:'long'})} às ${time}`;
  })();

  // Estado local
  let selectedId = sessionStorage.getItem('booking.professional_id') || null;

  // UI helpers
  function showSkeleton(){
    GRID.innerHTML = `
      <div class="card skeleton"></div>
      <div class="card skeleton"></div>
      <div class="card skeleton"></div>
      <div class="card skeleton"></div>
    `;
  }
  function showEmpty(){
    GRID.innerHTML = `<p style="color:#6b7280">Nenhum profissional encontrado.</p>`;
  }
  function showError(msg){
    GRID.innerHTML = `
      <div style="border:1px solid #fee2e2;background:#fef2f2;color:#991b1b;padding:12px;border-radius:12px">
        <strong>Erro ao carregar profissionais</strong><br>
        <small>${msg}</small>
      </div>
      <button class="btn" id="btn-try">Tentar novamente</button>
    `;
    document.getElementById('btn-try')?.addEventListener('click', load);
  }
  function render(list){
    GRID.innerHTML = list.map(p => `
      <button class="card ${selectedId && selectedId===String(p.id) ? 'selected':''}" data-id="${p.id}">
        <img class="avatar" src="${p.avatar || `https://i.pravatar.cc/160?u=${encodeURIComponent(p.id)}`}" alt="${p.name}">
        <div class="name">${p.name}</div>
        ${p.skills?.length ? `<div class="skills">${p.skills.join(', ')}</div>` : `<div class="skills">—</div>`}
        <div class="badge ${p.available ? 'ok':'off'}">${p.available ? 'Disponível' : 'Indisponível'}</div>
      </button>
    `).join('');

    GRID.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => {
        // marca visual
        GRID.querySelectorAll('.card.selected').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');

        selectedId = card.dataset.id;
        sessionStorage.setItem('booking.professional_id', selectedId);
        BTN_NEXT.disabled = false;
      });
    });

    // habilita continuar se já havia pré-seleção
    BTN_NEXT.disabled = !selectedId;
  }

  async function load(){
    try{
      showSkeleton();

      // monta query com date/time para o filtro de disponibilidade (se você quiser)
      const iso = sessionStorage.getItem('booking.date') || '';
      const time = sessionStorage.getItem('booking.time') || '';
      const qs = new URLSearchParams({ date: iso, time, duration: '30' }); // ajuste se precisar
      const url = `${ENDPOINT}?${qs}`;

      console.log('[professionals] endpoint =', url);

      const res = await fetch(url, { method:'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // o n8n devolve { professionals: [...] }
      const list = Array.isArray(data.professionals) ? data.professionals : [];

      console.log('[professionals] payload =', data);
      console.log('[professionals] list (after extract) =', list);

      if (!list.length) { showEmpty(); return; }
      render(list);
    }catch(err){
      console.error(err);
      showError(err.message || 'Falha ao buscar profissionais.');
    }
  }

  BTN_BACK.addEventListener('click', () => history.back());
  BTN_NEXT.addEventListener('click', () => {
    if (!selectedId) return;
    // segue no funil: se quiser forçar login/cadastro, redirecione
    // Exemplo simples: mandar pra login.html
    location.href = 'login.html';
  });

  load();
})();
