const N8N_BASE = localStorage.getItem('n8n_base') || 'https://your-n8n.example.com/webhook/barber';


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