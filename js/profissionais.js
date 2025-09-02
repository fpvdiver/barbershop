/* js/profissionais.js */
document.addEventListener('DOMContentLoaded', () => {
  const GRID = document.getElementById('profGrid');
  const BTN_CONTINUAR = document.getElementById('btn-continuar');
  const BTN_VOLTAR = document.getElementById('btn-voltar');

  // Base do webhook (permite trocar em runtime via localStorage.n8n_base)
  const N8N_BASE = localStorage.getItem('n8n_base') || 'https://primary-odonto.up.railway.app/webhook/barber';
  // Endpoint único desta tela:
  const API = `${N8N_BASE}/professionals`;

  // Mostra a frase “Disponíveis para …”
  const iso  = sessionStorage.getItem('booking.date');
  const time = sessionStorage.getItem('booking.time');
  if (iso && time) {
    const d = new Date(iso);
    const legenda = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    const header = document.querySelector('.top .title');
    if (header) {
      const note = document.createElement('div');
      note.style.fontSize = '12px';
      note.style.color = '#6b7280';
      note.style.marginTop = '6px';
      note.textContent = `Disponíveis para ${legenda} às ${time}`;
      header.insertAdjacentElement('afterend', note);
    }
  }

  let selectedId = null;

  async function loadProfessionals() {
    GRID.setAttribute('aria-busy', 'true');
    GRID.innerHTML = `
      <div class="card skeleton"></div>
      <div class="card skeleton"></div>
      <div class="card skeleton"></div>
      <div class="card skeleton"></div>
    `;

    try {
      // Se quiser que o backend filtre por data, passe via querystring
      const url = new URL(API);
      if (iso) url.searchParams.set('date', iso);

      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      // Garanta no n8n: { professionals: [...] }
      const list = Array.isArray(data.professionals) ? data.professionals : [];

      if (!list.length) {
        GRID.innerHTML = `<p style="color:#6b7280;padding:12px">Nenhum profissional encontrado.</p>`;
        BTN_CONTINUAR.disabled = true;
        GRID.setAttribute('aria-busy', 'false');
        return;
      }

      // Renderiza todos de uma vez
      GRID.innerHTML = list.map(p => `
        <button class="card" data-id="${p.id}" aria-label="Selecionar ${escapeHtml(p.name || 'Profissional')}">
          <img
            src="${p.avatar || `https://i.pravatar.cc/160?u=${encodeURIComponent(p.id)}`}"
            class="avatar"
            alt="${escapeHtml(p.name || 'Profissional')}"
            loading="lazy"
          >
          <div class="name">${escapeHtml(p.name || 'Profissional')}</div>
          ${Array.isArray(p.skills) && p.skills.length
            ? `<div class="skills">${p.skills.map(escapeHtml).join(', ')}</div>` : ''}
          <div class="badge ${p.available ? 'ok' : 'off'}">
            ${p.available ? 'Disponível' : 'Indisponível'}
          </div>
        </button>
      `).join('');

      // Listeners de seleção
      GRID.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => {
          GRID.querySelectorAll('.card.selected').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          selectedId = card.dataset.id;
          BTN_CONTINUAR.disabled = false;
          sessionStorage.setItem('booking.professional_id', selectedId);
        });
      });

      // Pré-seleciona se já havia um salvo
      const saved = sessionStorage.getItem('booking.professional_id');
      if (saved) {
        const el = GRID.querySelector(`.card[data-id="${CSS.escape(saved)}"]`);
        if (el) el.click();
      }
    } catch (err) {
      console.error(err);
      GRID.innerHTML = `
        <div class="alert error">
          <strong>Erro ao carregar profissionais</strong><br>
          <small>${escapeHtml(err.message)}</small>
        </div>
        <button class="btn" id="btnTry">Tentar novamente</button>
      `;
      document.getElementById('btnTry')?.addEventListener('click', loadProfessionals);
      BTN_CONTINUAR.disabled = true;
    } finally {
      GRID.setAttribute('aria-busy', 'false');
    }
  }

  BTN_VOLTAR?.addEventListener('click', () => history.back());
  BTN_CONTINUAR?.addEventListener('click', () => {
    if (!selectedId) return;
    // Próxima etapa do funil (login/cadastro → resumo)
    location.href = 'login.html';
  });

  loadProfessionals();
});

/* Utils */
function escapeHtml(str = '') {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
