/* 
  Calendário + horários (idêntico ao print)
  - Lê serviços escolhidos: localStorage.booking_services
  - Carrega disponibilidade via n8n (provider = 'n8n')
    • GET  /availability?date=YYYY-MM-DD&services=id1,id2
    → { daysAvailable: [1,2,3,...], slots: ["10:00","11:00",...] }  // slots depende do dia consultado
  - Fallback: gera disponibilidade mock se a API não responder.

  Para Google Calendar, use o n8n como proxy (recomendado), mantendo o mesmo contrato.
*/

const CONFIG = {
  provider: 'n8n', // 'n8n' | 'mock'
  N8N_BASE: 'https://your-n8n.example.com/webhook/barber'
};

const BR_MONTHS = [
  'janeiro','fevereiro','março','abril','maio','junho',
  'julho','agosto','setembro','outubro','novembro','dezembro'
];

const $ = (q,root=document)=>root.querySelector(q);
const $$ = (q,root=document)=>Array.from(root.querySelectorAll(q));

const state = {
  month: new Date(),         // mês atual
  selectedDate: null,        // Date
  daysAvailable: new Set(),  // dias do mês com underline verde
  services: JSON.parse(localStorage.getItem('booking_services')||'[]'),
  slots: []
};

const grid = $('#calGrid');
const slotsWrap = $('#slots');
const labelDia = $('#label-dia');

document.addEventListener('DOMContentLoaded', async () => {
  $('#btn-fechar').addEventListener('click', () => history.back());
  $('#btn-voltar').addEventListener('click', () => history.back());

  // Disponibilidade por mês (sublinha dias)
  await loadMonthAvailability(state.month);
  renderCalendar();

  // Pré-seleciona hoje se disponível
  const today = new Date();
  if (isSameYM(today, state.month) && state.daysAvailable.has(today.getDate())) {
    pickDate(today);
  }
});

/* ============ RENDER CALENDAR ============ */
function renderCalendar(){
  grid.innerHTML = '';

  const cur = state.month;
  const year = cur.getFullYear();
  const month = cur.getMonth();

  const first = new Date(year, month, 1);
  const last  = new Date(year, month+1, 0);

  // preenchimento até domingo (0) no início
  const pad = first.getDay(); // 0..6 (dom..sáb)
  for (let i=0; i<pad; i++) grid.appendChild(placeholderDay());

  for (let d=1; d<=last.getDate(); d++){
    const date = new Date(year, month, d);
    const isPast = +stripTime(date) < +stripTime(new Date());
    const isWeekend = [0,6].includes(date.getDay());

    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'day' + (isWeekend?' weekend':'') + (isPast?' past':' enabled');
    el.innerHTML = `<span class="num">${d}</span>` + (state.daysAvailable.has(d)?'<span class="underline"></span>':'');

    if (!isPast){
      el.addEventListener('click', () => pickDate(date, el));
    }

    if (state.selectedDate && sameDate(state.selectedDate, date)){
      el.classList.add('selected');
    }

    grid.appendChild(el);
  }
}

function placeholderDay(){
  const ph = document.createElement('div');
  ph.className = 'day';
  ph.style.visibility = 'hidden';
  return ph;
}

/* ============ PICK DATE & LOAD SLOTS ============ */
async function pickDate(date, el){
  state.selectedDate = date;
  $$('.day.enabled').forEach(d => d.classList.remove('selected'));
  el?.classList.add('selected');

  // Label: "2 Setembro"
  labelDia.textContent = `${date.getDate()} ${BR_MONTHS[date.getMonth()].charAt(0).toUpperCase()}${BR_MONTHS[date.getMonth()].slice(1)}`;

  await loadDaySlots(date);
  renderSlots();
}

function renderSlots(){
  slotsWrap.innerHTML = '';
  const frag = document.createDocumentFragment();
  (state.slots||[]).forEach(hhmm => {
    const el = document.createElement('button');
    el.className = 'slot';
    el.textContent = hhmm;
    el.addEventListener('click', () => {
      $$('.slot').forEach(s=>s.classList.remove('selected'));
      el.classList.add('selected');
      // Persistimos e vamos para a próxima etapa (login/criar conta)
      localStorage.setItem('booking_date', ymd(state.selectedDate));
      localStorage.setItem('booking_time', hhmm);
      // Ex.: location.href = '/login.html';
      alert(`Selecionado: ${ymd(state.selectedDate)} ${hhmm}`);
    });
    frag.appendChild(el);
  });
  slotsWrap.appendChild(frag);
}

/* ============ DATA PROVIDERS ============ */
async function loadMonthAvailability(date){
  try{
    if (CONFIG.provider === 'n8n'){
      const start = firstOfMonth(date);
      const query = new URLSearchParams({
        month: String(start.getMonth()+1).padStart(2,'0'),
        year: String(start.getFullYear()),
        services: state.services.join(',')
      });
      const r = await fetch(`${CONFIG.N8N_BASE}/availability/month?${query}`);
      if (!r.ok) throw new Error('HTTP '+r.status);
      const data = await r.json(); // { daysAvailable:[1,2,3...] }
      state.daysAvailable = new Set(data.daysAvailable || []);
    } else {
      // mock
      state.daysAvailable = mockMonthAvailability(date);
    }
  } catch(e){
    console.warn('[availability/month] fallback mock:', e.message);
    state.daysAvailable = mockMonthAvailability(date);
  }
}

async function loadDaySlots(date){
  try{
    if (CONFIG.provider === 'n8n'){
      const query = new URLSearchParams({
        date: ymd(date),
        services: state.services.join(',')
      });
      const r = await fetch(`${CONFIG.N8N_BASE}/availability?${query}`);
      if (!r.ok) throw new Error('HTTP '+r.status);
      const data = await r.json(); // { slots:["10:00","11:00",...] }
      state.slots = data.slots || [];
    } else {
      state.slots = mockSlots(date);
    }
  } catch(e){
    console.warn('[availability/day] fallback mock:', e.message);
    state.slots = mockSlots(date);
  }
}

/* ============ UTILS ============ */
function ymd(d){ return d.toISOString().slice(0,10); }
function stripTime(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function sameDate(a,b){ return a && b && a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
function isSameYM(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth(); }
function firstOfMonth(d){ return new Date(d.getFullYear(), d.getMonth(), 1); }

/* ============ MOCKS (fallback visual) ============ */
function mockMonthAvailability(date){
  const last = new Date(date.getFullYear(), date.getMonth()+1, 0).getDate();
  const set = new Set();
  for (let d=1; d<=last; d++){
    // sublinha quase todos os dias, exceto alguns
    if (![6,12,18,24].includes(d)) set.add(d);
  }
  return set;
}
function mockSlots(date){
  // slots fixos como no print
  const base = ['10:00','11:00','12:00','13:00','14:00','15:00','16:00','19:00'];
  // bloqueia domingo e segunda à tarde como exemplo
  const day = date.getDay();
  if (day === 0) return []; // domingo sem horários
  if (day === 1) return base.filter(h=>!['15:00','16:00','19:00'].includes(h));
  return base;
}