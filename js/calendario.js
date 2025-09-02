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

  // ==== Helpers de data ====
function toISODateOnly(date) {
  // Retorna YYYY-MM-DD em UTC local
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDatePt(iso) {
  // Retorna: terça-feira, 2 de setembro
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
}


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

// ====== CALENDÁRIO (mês) ======
(function initCalendar() {
  const calGrid  = document.getElementById('calGrid');
  const calPrev  = document.getElementById('calPrev');
  const calNext  = document.getElementById('calNext');
  const calLabel = document.getElementById('calMonthLabel');

  if (!calGrid) return;

  // Estado de visualização (mês/ano sendo exibidos)
  let selectedISO = sessionStorage.getItem('booking.date') || toISODateOnly(new Date());
  let view = isoToYM(selectedISO); // {y,m}

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
    const [y,m] = iso.split('-').map(Number);
    return { y, m };
  }
  function stepMonth(y, m, delta) {
    const d = new Date(y, m-1 + delta, 1);
    return { y: d.getFullYear(), m: d.getMonth()+1 };
  }
  function daysInMonth(y, m) {
    return new Date(y, m, 0).getDate();
  }
  function firstWeekdayIndex(y, m) {
    // domingo=0 … sábado=6
    return new Date(y, m-1, 1).getDay();
  }
  function pad2(n){ return String(n).padStart(2,'0'); }
  function ymd(y,m,d){ return `${y}-${pad2(m)}-${pad2(d)}`; }

  function renderCalendar(y, m, selectedIso) {
    // Label do mês
    const label = new Date(y, m-1, 1).toLocaleDateString('pt-BR', { month:'long', year:'numeric' });
    calLabel.textContent = label.charAt(0).toUpperCase() + label.slice(1);

    calGrid.innerHTML = '';
    const todayIso = toISODateOnly(new Date());
    const total = daysInMonth(y, m);
    const startIdx = firstWeekdayIndex(y, m); // 0..6 domingo..sábado

    // Blanks antes do dia 1
    for (let i=0; i<startIdx; i++) {
      const b = document.createElement('div');
      b.className = 'cal-cell muted';
      b.setAttribute('aria-hidden', 'true');
      calGrid.appendChild(b);
    }

    // Dias do mês
    for (let d=1; d<=total; d++) {
      const iso = ymd(y, m, d);
      const cell = document.createElement('button');
      cell.className = 'cal-cell';
      cell.textContent = d;

      // Finais de semana (domingo=0, sábado=6)
      const weekday = new Date(y, m-1, d).getDay();
      if (weekday===0 || weekday===6) cell.classList.add('weekend');

      if (iso === todayIso) cell.classList.add('today');
      if (iso === selectedIso) cell.classList.add('selected');

      // Desabilita datas passadas
      if (iso < todayIso) cell.classList.add('disabled');

      cell.dataset.date = iso;
      cell.addEventListener('click', () => {
        // Atualiza seleção visual
        calGrid.querySelectorAll('.cal-cell.selected').forEach(el=>el.classList.remove('selected'));
        cell.classList.add('selected');

        // Persiste, atualiza label e recarrega slots
        selectedISO = iso;
        sessionStorage.setItem('booking.date', iso);
        const labelDia = document.getElementById('label-dia');
        if (labelDia) labelDia.textContent = formatDatePt(iso);
        loadSlots(iso);
      });

      calGrid.appendChild(cell);
    }
  }
})();

