/* js/calendario.js — versão consolidada */

// ================== CONFIG ==================
const AVAIL_URL = 'https://primary-odonto.up.railway.app/webhook/barber/availability';

// ================== HELPERS (globais) ==================
function toISODateOnly(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function formatDatePt(iso) {
  // "terça-feira, 2 de setembro"
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}
function hmToMinutes(hm) {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
}
function isoToMinutes(iso) {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

// Expor para outros módulos (calendário)
window.booking = window.booking || {};
window.booking.helpers = { toISODateOnly, formatDatePt };

// ================== SLOTS (horários) ==================
(function initSlots() {
  const slotsEl   = document.getElementById('slots');
  const labelDia  = document.getElementById('label-dia');
  const btnVoltar = document.getElementById('btn-voltar');

  if (!slotsEl) return; // página sem slots

  let selectedDate = sessionStorage.getItem('booking.date') || toISODateOnly(new Date());
  labelDia && (labelDia.textContent = formatDatePt(selectedDate));

  // API simples sem preflight pra evitar CORS
  async function loadSlots(isoDate) {
    try {
      renderLoading();
      const url = `${AVAIL_URL}?date=${encodeURIComponent(isoDate)}`;
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // n8n pode devolver já pronto como "horariosLivres", ou base + busy
      const allHours = data.horarios || data.horariosLivres || [];
      const free = data.horariosLivres ? data.horariosLivres : filterBusy(allHours, data.busy);
      renderSlots(free);
    } catch (err) {
      console.error(err);
      renderError(err.message);
    }
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

    slotsEl.querySelectorAll('.slot').forEach(btn => {
      btn.addEventListener('click', () => {
        slotsEl.querySelectorAll('.slot.selected').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');

        const time = btn.dataset.time;
        sessionStorage.setItem('booking.date', selectedDate);
        sessionStorage.setItem('booking.time', time);

        if (confirm(`Confirmar ${formatDatePt(selectedDate)} às ${time}?`)) {
          location.href = 'profissionais.html';
        }
      });
    });
  }

  function filterBusy(allHours, busy) {
    if (!busy || !busy.length) return allHours.slice();
    const blocks = busy.map(b => ({ start: isoToMinutes(b.start), end: isoToMinutes(b.end) }));
    return allHours.filter(h => {
      const m = hmToMinutes(h);
      return !blocks.some(b => m >= b.start && m < b.end);
    });
  }

  // Troca de data pelo calendário (integração)
  const calGrid = document.getElementById('calGrid');
  calGrid?.addEventListener('click', (e) => {
    const cell = e.target.closest('[data-date]');
    if (!cell || cell.classList.contains('disabled')) return;
    selectedDate = cell.dataset.date;
    sessionStorage.setItem('booking.date', selectedDate);
    labelDia && (labelDia.textContent = formatDatePt(selectedDate));
    loadSlots(selectedDate);
  });

  btnVoltar?.addEventListener('click', () => history.back());

  // carregar já ao abrir
  loadSlots(selectedDate);

  // Expor para o calendário chamar quando ele trocar o mês/dia
  window.booking.loadSlots = loadSlots;
})();

// ================== CALENDÁRIO (mês) ==================
(function initCalendar() {
  const calGrid  = document.getElementById('calGrid');
  if (!calGrid) return; // página sem calendário

  const calPrev  = document.getElementById('calPrev');
  const calNext  = document.getElementById('calNext');
  const calLabel = document.getElementById('calMonthLabel');

  const { toISODateOnly, formatDatePt } = window.booking.helpers;
  const loadSlots = window.booking.loadSlots;

  let selectedISO = sessionStorage.getItem('booking.date') || toISODateOnly(new Date());
  let view = isoToYM(selectedISO); // { y, m }

  renderCalendar(view.y, view.m, selectedISO);

  calPrev?.addEventListener('click', () => {
    view = stepMonth(view.y, view.m, -1);
    renderCalendar(view.y, view.m, selectedISO);
  });
  calNext?.addEventListener('click', () => {
    view = stepMonth(view.y, view.m, +1);
    renderCalendar(view.y, view.m, selectedISO);
  });

  function isoToYM(iso) {
    const [y, m] = iso.split('-').map(Number);
    return { y, m };
  }
  function stepMonth(y, m, delta) {
    const d = new Date(y, m - 1 + delta, 1);
    return { y: d.getFullYear(), m: d.getMonth() + 1 };
  }
  function daysInMonth(y, m) { return new Date(y, m, 0).getDate(); }
  function firstWeekdayIndex(y, m) { return new Date(y, m - 1, 1).getDay(); } // 0-dom ... 6-sáb
  function pad2(n) { return String(n).padStart(2, '0'); }
  function ymd(y, m, d) { return `${y}-${pad2(m)}-${pad2(d)}`; }

  function renderCalendar(y, m, selectedIso) {
    const label = new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    if (calLabel) calLabel.textContent = label.charAt(0).toUpperCase() + label.slice(1);

    calGrid.innerHTML = '';
    const todayIso = toISODateOnly(new Date());
    const total = daysInMonth(y, m);
    const startIdx = firstWeekdayIndex(y, m);

    // "blanks"
    for (let i = 0; i < startIdx; i++) {
      const b = document.createElement('div');
      b.className = 'cal-cell muted';
      b.setAttribute('aria-hidden', 'true');
      calGrid.appendChild(b);
    }

    for (let d = 1; d <= total; d++) {
      const iso = ymd(y, m, d);
      const btn = document.createElement('button');
      btn.className = 'cal-cell';
      btn.textContent = d;

      const weekday = new Date(y, m - 1, d).getDay();
      if (weekday === 0 || weekday === 6) btn.classList.add('weekend');
      if (iso === todayIso) btn.classList.add('today');
      if (iso === selectedIso) btn.classList.add('selected');
      if (iso < todayIso) btn.classList.add('disabled');

      btn.dataset.date = iso;
      btn.addEventListener('click', () => {
        if (btn.classList.contains('disabled')) return;
        calGrid.querySelectorAll('.cal-cell.selected').forEach(el => el.classList.remove('selected'));
        btn.classList.add('selected');

        selectedISO = iso;
        sessionStorage.setItem('booking.date', iso);
        const labelDia = document.getElementById('label-dia');
        labelDia && (labelDia.textContent = formatDatePt(iso));

        // recarrega horários
        loadSlots && loadSlots(iso);
      });

      calGrid.appendChild(btn);
    }
  }
})();
