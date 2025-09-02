// js/calendario.js
(function(){
  const $ = (s,r=document)=>r.querySelector(s);
  const calGrid = $('#calGrid');
  const slotsEl = $('#slots');
  const lblDia  = $('#label-dia');
  const btnVoltar = $('#btn-voltar');

  // Config
  const ENDPOINT = 'https://primary-odonto.up.railway.app/webhook/barber/availability';
  const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
  // duração: use a soma dos serviços escolhidos se quiser maior precisão
  const selSummary = JSON.parse(localStorage.getItem('selected_services_summary') || '{}');
  const DURATION = selSummary?.totalMin || 30; // fallback 30min
  const CALENDAR_ID = 'primary'; // ou id da agenda do barbeiro

  // estado calendário
  let current = new Date(); // hoje
  let selectedDate = toYMD(current);
  let selectedTime = null;

  function toYMD(d){
    return d.toISOString().slice(0,10);
  }
  function monthLabel(d){
    return d.toLocaleDateString('pt-BR',{ month:'long', year:'numeric' });
  }
  function startOfMonth(d){ return new Date(d.getFullYear(), d.getMonth(), 1); }
  function endOfMonth(d){ return new Date(d.getFullYear(), d.getMonth()+1, 0); }

  async function loadSlots(dateStr){
    slotsEl.innerHTML = '<div class="muted">Carregando horários…</div>';
    lblDia.textContent = new Date(dateStr).toLocaleDateString('pt-BR',{ day:'numeric', month:'long' });

    const url = new URL(ENDPOINT);
    url.searchParams.set('date', dateStr);
    url.searchParams.set('duration', String(DURATION));
    url.searchParams.set('tz', TZ);
    url.searchParams.set('calendarId', CALENDAR_ID);

    try{
      const res = await fetch(url.toString(), { method:'GET', mode:'cors', cache:'no-cache' });
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      renderSlots(data.slots || []);
    }catch(err){
      console.error('[availability]', err);
      slotsEl.innerHTML = `
        <div class="card">
          <strong>Erro ao carregar horários</strong>
          <div class="muted">${err.message || 'Tente novamente.'}</div>
          <button class="ghost-btn" id="retry">Tentar novamente</button>
        </div>`;
      $('#retry')?.addEventListener('click', ()=> loadSlots(dateStr));
    }
  }

  function renderSlots(slots){
    if(!slots.length){
      slotsEl.innerHTML = `<div class="muted">Sem horários para este dia.</div>`;
      return;
    }
    slotsEl.innerHTML = slots.map(h =>
      `<button class="slot" data-h="${h}" style="padding:10px 12px;border-radius:999px;border:1px solid var(--border);background:#d1fae5">${h}</button>`
    ).join(' ');
  }

  function renderCalendar(d){
    calGrid.innerHTML = '';
    const first = startOfMonth(d);
    const last  = endOfMonth(d);

    // início da grade no domingo anterior
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    // fim da grade no sábado posterior
    const end = new Date(last);
    end.setDate(last.getDate() + (6 - last.getDay()));

    const today = new Date();
    for(let cur = new Date(start); cur <= end; cur.setDate(cur.getDate()+1)){
      const ymd = toYMD(cur);
      const inMonth = (cur.getMonth() === d.getMonth());
      const isPast = cur < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const btn = document.createElement('button');
      btn.className = 'cal-cell';
      btn.style.cssText = `
        width:44px;height:44px;border-radius:999px;border:0;background:${ymd===selectedDate?'#111':'transparent'};
        color:${ymd===selectedDate?'#fff': (inMonth ? 'inherit' : 'var(--muted)')};
        opacity:${isPast? '.4' : '1'};
        font-weight:800;`;
      btn.textContent = String(cur.getDate());
      btn.disabled = isPast;

      btn.addEventListener('click', ()=>{
        selectedDate = ymd; selectedTime = null;
        renderCalendar(d);
        loadSlots(ymd);
      });
      calGrid.appendChild(btn);
    }
  }

  // selecionar horário
  slotsEl.addEventListener('click', (e)=>{
    const t = e.target;
    if(!(t instanceof HTMLElement)) return;
    if(t.classList.contains('slot')){
      selectedTime = t.dataset.h;
      // estiliza seleção
      [...slotsEl.querySelectorAll('.slot')].forEach(b => b.style.background = '#d1fae5');
      t.style.background = '#34d399';
      // abre modal/confirm?
      confirmSelection();
    }
  });

  function confirmSelection(){
    if(!selectedDate || !selectedTime) return;
    // salva e segue para profissionais
    localStorage.setItem('booking_date', selectedDate);
    localStorage.setItem('booking_time', selectedTime);
    // se quiser mostrar um modal, substitua pelas suas UI
    if(confirm(`Confirmar ${selectedDate} às ${selectedTime}?`)){
      location.href = 'profissionais.html';
    }
  }

  // nav meses (se tiver botões, chame estas)
  // nextMonth() / prevMonth()
  function nextMonth(){ current = new Date(current.getFullYear(), current.getMonth()+1, 1); renderCalendar(current); }
  function prevMonth(){ current = new Date(current.getFullYear(), current.getMonth()-1, 1); renderCalendar(current); }

  // init
  document.addEventListener('DOMContentLoaded', ()=>{
    renderCalendar(current);
    loadSlots(selectedDate);
  });

  btnVoltar?.addEventListener('click', ()=> history.back());
})();

// exemplo de função para normalizar a data selecionada
function formatDateToISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`; // sempre YYYY-MM-DD
}

// quando o usuário clicar no dia:
calendar.on('select', (date) => {
  const isoDate = formatDateToISO(date);
  loadHorarios(isoDate); // chama teu fetch com isoDate
});

