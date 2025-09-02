/* js/calendario.js */
(() => {
  // ================== CONFIG ==================
  const AVAIL_URL = 'https://primary-odonto.up.railway.app/webhook/barber/availability'; // <-- ajuste aqui
  const slotsEl   = document.getElementById('slots');
  const labelDia  = document.getElementById('label-dia');
  const btnVoltar = document.getElementById('btn-voltar');

  // Data atual/selecionada (assuma que seu grid já define isso; se não, começa com hoje)
  let selectedDate = toISODateOnly(new Date());

  // Se o seu grid já grava a data na sessionStorage, respeite:
  const stored = sessionStorage.getItem('booking.date');
  if (stored) selectedDate = stored;

  // Mostra label inicial e carrega slots
  labelDia.textContent = formatDatePt(selectedDate);
  loadSlots(selectedDate);

  // Se seu grid de calendário dispara eventos, conecte aqui:
  // Exemplo: clique no dia do calendário (cada célula tem data-date="YYYY-MM-DD")
  const calGrid = document.getElementById('calGrid');
  if (calGrid) {
    calGrid.addEventListener('click', (e) => {
      const cell = e.target.closest('[data-date]');
      if (!cell) return;
      selectedDate = cell.dataset.date;          // "YYYY-MM-DD"
      labelDia.textContent = formatDatePt(selectedDate);
      sessionStorage.setItem('booking.date', selectedDate);
      loadSlots(selectedDate);
    });
  }

  // Voltar
  btnVoltar?.addEventListener('click', () => history.back());

  // ================== FUNÇÕES ==================

  function toISODateOnly(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function formatDatePt(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
      weekday: 'long', day: 'numeric', month: 'long'
    });
  }

  function hmToMinutes(hm) {
    const [h, m] = hm.split(':').map(Number);
    return h * 60 + m;
  }
  function isoToMinutes(iso) {
    const d = new Date(iso);
    return d.getHours() * 60 + d.getMinutes();
  }

  function renderLoading() {
    slotsEl.innerHTML = `
      <div class="slot-skeleton"></div>
      <div class="slot-skeleton"></div>
      <div class="slot-skeleton"></div>
      <div class="slot-skeleton"></div>
    `;
  }

  function renderError(msg) {
    slotsEl.innerHTML = `
      <div class="alert error">
        <strong>Erro ao carregar horários</strong><br>
        <small>${msg || 'Tente novamente mais tarde.'}</small>
      </div>
      <button class="btn" id="btnTry">Tentar novamente</button>
    `;
    document.getElementById('btnTry')?.addEventListener('click', () => loadSlots(selectedDate));
  }

  function renderEmpty() {
    slotsEl.innerHTML = `
      <div class="alert">
        <strong>Sem horários</strong><br>
        <small>Não há horários disponíveis para este dia.</small>
      </div>
    `;
  }

  function renderSlots(hours) {
    if (!hours.length) return renderEmpty();

    slotsEl.innerHTML = hours.map(h => `
      <button class="slot" data-time="${h}" aria-label="Agendar às ${h}">${h}</button>
    `).join('');

    // clique para selecionar
    slotsEl.querySelectorAll('.slot').forEach(btn => {
      btn.addEventListener('click', () => {
        // marca visualmente
        slotsEl.querySelectorAll('.slot.selected').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');

        const time = btn.dataset.time;
        // guarda e redireciona (ou abre modal de confirmação, se preferir)
        sessionStorage.setItem('booking.date', selectedDate);
        sessionStorage.setItem('booking.time', time);

        // Se quiser pedir um OK antes:
        if (confirm(`Confirmar ${formatDatePt(selectedDate)} às ${time}?`)) {
          location.href = 'profissionais.html'; // próximo passo do funil
        }
      });
    });
  }

  // Remove horários que caem nas janelas busy (retornadas pelo Google Calendar)
  function filterBusy(allHours, busy) {
    if (!busy || !busy.length) return allHours.slice();

    const blocks = busy.map(b => ({
      start: isoToMinutes(b.start),
      end:   isoToMinutes(b.end)
    }));

    return allHours.filter(h => {
      const m = hmToMinutes(h);
      // remove se este horário cair dentro de qualquer janela [start, end)
      return !blocks.some(b => m >= b.start && m < b.end);
    });
  }

  async function loadSlots(isoDate) {
    try {
      renderLoading();

      // GET sem headers para não gerar preflight/CORS
      const url = `${AVAIL_URL}?date=${encodeURIComponent(isoDate)}`;
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      // O n8n pode te devolver já "livres"; se não, filtramos com o busy
      const allHours = data.horarios || data.horariosLivres || [];
      const freeHours = data.horariosLivres ? data.horariosLivres : filterBusy(allHours, data.busy);

      renderSlots(freeHours);
    } catch (err) {
      console.error(err);
      renderError(err.message);
    }
  }
})();
