const N8N_BASE = localStorage.getItem('n8n_base') || 'https://primary-odonto.up.railway.app/webhook/barber';


// carrega do n8n
try{
const url = `${N8N_BASE}/barbers?` + new URLSearchParams({ date: when.date||'' });
const res = await fetch(url);
const data = await res.json();
state.list = (data.barbers||[]);
if(!state.list.length) state.list = fallbackBarbers();
}catch(e){ state.list = fallbackBarbers(); }


renderGrid();



function fallbackBarbers(){
return [
{ id:'ana', name:'Ana', img:'https://i.pravatar.cc/160?img=47', bio:'Especialista em cortes clássicos e design de sobrancelha.' },
{ id:'leo', name:'Léo', img:'https://i.pravatar.cc/160?img=12', bio:'Degradê e navalhado. 6 anos de experiência.' },
{ id:'maria', name:'Maria', img:'https://i.pravatar.cc/160?img=32', bio:'Colorimetria e finalização.' },
{ id:'davi', name:'Davi', img:'https://i.pravatar.cc/160?img=15', bio:'Luzes e platinado.' },
{ id:'gui', name:'Guilherme', img:'https://i.pravatar.cc/160?img=22', bio:'Barba e tesoura, experiência premium.' },
{ id:'andre', name:'André', img:'https://i.pravatar.cc/160?img=36', bio:'Infantil e corte social rápido.' },
{ id:'joao', name:'João', img:'https://i.pravatar.cc/160?img=5', bio:'Clássicos atemporais.' },
{ id:'paulo', name:'Paulo', img:'https://i.pravatar.cc/160?img=8', bio:'Taper fade e freestyle.' },
];
}


function renderGrid(){
const wrap = $('#grid'); wrap.innerHTML='';
state.list.forEach(p=>{
const card = document.createElement('div'); card.className='card'; card.dataset.id=p.id;
card.innerHTML = `
<img class="avatar" src="${p.img||'https://i.pravatar.cc/160'}" alt="${p.name}">
<div class="name">${p.name||'Profissional'}</div>
<div class="actions">
<button class="btn btn-ghost small" data-action="view">ver</button>
<button class="btn btn-primary small" data-action="book">agendar</button>
</div>`;


card.addEventListener('click', (ev)=>{
const action = ev.target?.dataset?.action;
if(action==='view'){ openView(p); }
if(action==='book'){ select(p, card); goNext(); }
});


wrap.appendChild(card);
});
}


function select(p, card){
state.selected = p; $('#selName').textContent = p.name;
document.querySelectorAll('.card').forEach(x=>x.classList.remove('selected'));
card.classList.add('selected');
$('#btnContinuar').disabled = false;
localStorage.setItem('booking_barber', p.id);
}


function openView(p){
$('#vName').textContent = p.name;
$('#vImg').src = p.img || 'https://i.pravatar.cc/160';
$('#vBio').textContent = p.bio || '—';
$('#vSelect').onclick = ()=>{ select(p, document.querySelector(`.card[data-id="${p.id}"]`)); toggleSheet(false); };
$('#vClose').onclick = ()=> toggleSheet(false);
toggleSheet(true);
}


function toggleSheet(show){ document.getElementById('viewSheet').classList.toggle('show', !!show); }


function goNext(){
  if(!state.selected) return;
  // já salvamos o profissional ao selecionar
  const hasToken   = !!localStorage.getItem('bb_token');
  const hasProfile = !!localStorage.getItem('booking_profile');

  if(!hasToken) {
    // precisa logar
    location.href = 'login.html';
    return;
  }
  if(!hasProfile) {
    // logado mas sem perfil
    location.href = 'cadastro.html';
    return;
  }
  // ok, segue para o resumo
  location.href = 'resumo.html';
}




function formatDateBR(iso){ if(!iso) return '—'; const [y,m,d]=iso.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'}); }


document.addEventListener('DOMContentLoaded', () => {
  const GRID = document.getElementById('profGrid');
  const BTN_CONTINUAR = document.getElementById('btn-continuar');
  const BTN_VOLTAR = document.getElementById('btn-voltar');

  const API = 'https://SEU_N8N/webhook/barber/professionals'; // troque pela sua URL

  // só para deixar a frase “Disponíveis para ...”
  const iso = sessionStorage.getItem('booking.date');
  const time = sessionStorage.getItem('booking.time');
  if (iso && time) {
    const d = new Date(iso);
    const legenda = d.toLocaleDateString('pt-BR', {weekday:'long', day:'numeric', month:'long'});
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

  async function loadProfessionals() {
    GRID.innerHTML = `
      <div class="card skeleton"></div>
      <div class="card skeleton"></div>
      <div class="card skeleton"></div>
      <div class="card skeleton"></div>
    `;
    try {
      const res = await fetch(API, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data.professionals) ? data.professionals : [];

      if (!list.length) {
        GRID.innerHTML = `<p style="color:#6b7280">Nenhum profissional encontrado.</p>`;
        BTN_CONTINUAR.disabled = true;
        return;
      }

      // 🔧 Renderiza TODOS de uma vez (sem sobrescrever dentro do loop)
      GRID.innerHTML = list.map(p => `
        <button class="card" data-id="${p.id}" aria-label="Selecionar ${p.name}">
          <img src="${p.avatar || `https://i.pravatar.cc/160?u=${encodeURIComponent(p.id)}`}" class="avatar" alt="${p.name}">
          <div class="name">${p.name}</div>
          ${p.skills?.length ? `<div class="skills">${p.skills.join(', ')}</div>` : ''}
          <div class="badge ${p.available ? 'ok' : 'off'}">
            ${p.available ? 'Disponível' : 'Indisponível'}
          </div>
        </button>
      `).join('');

      // listeners de seleção
      GRID.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => {
          GRID.querySelectorAll('.card.selected').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          selectedId = card.dataset.id;
          BTN_CONTINUAR.disabled = false;
          // guarda no funil
          sessionStorage.setItem('booking.professional_id', selectedId);
        });
      });

      // pré-seleção se já tiver salvo
      const saved = sessionStorage.getItem('booking.professional_id');
      if (saved) {
        const el = GRID.querySelector(`.card[data-id="${CSS.escape(saved)}"]`);
        if (el) { el.click(); }
      }
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
    // segue o funil → login/cadastro
    location.href = 'login.html';
  });

  loadProfessionals();
});


