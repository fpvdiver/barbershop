const BRL = new Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'});
const $ = (q,root=document)=>root.querySelector(q);


// 1) Ler dados salvos
const chosenIds = JSON.parse(localStorage.getItem('booking_services')||'[]');
const when = JSON.parse(localStorage.getItem('booking_datetime')||'{}');
const profile = JSON.parse(localStorage.getItem('booking_profile')||'{}');


// 2) Catálogo (fallback). Em produção, traga do n8n: `/services`.
const CATALOG = JSON.parse(localStorage.getItem('services_catalog')||'null') || [
{ id:'cut_brow', name:'Corte e sobrancelha', price:45.00 },
{ id:'cut_prog', name:'Corte e progressiva', price:100.00 },
{ id:'cut_botox', name:'Corte e botox', price:80.00 },
{ id:'degrade', name:'CORTE (degrade)', price:40.00 },
{ id:'cut_hidr', name:'Corte+hidratacao', price:60.00 },
{ id:'cut_luzes', name:'Corte+luzes platinadas', price:120.00 },
];


function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 2000); }


window.addEventListener('DOMContentLoaded', init);


function init(){
// Serviços
const map = new Map(CATALOG.map(s=>[s.id,s]));
const list = $('#servicesList'); list.innerHTML='';
let total = 0;
chosenIds.forEach(id=>{
const s = map.get(id) || {name:id, price:0};
total += s.price||0;
const li = document.createElement('li');
li.className = 'kv-row';
li.innerHTML = `<span>${s.name}</span><strong>${BRL.format(s.price||0)}</strong>`;
list.appendChild(li);
});
$('#totalPrice').textContent = BRL.format(total);


// Quando
$('#sumDate').textContent = when?.date ? formatDateBR(when.date) : '—';
$('#sumTime').textContent = when?.time || '—';


// Perfil
$('#sumName').textContent = (profile?.nome && profile?.sobrenome) ? `${profile.nome} ${profile.sobrenome}` : '—';
$('#sumPhone').textContent = profile?.telefone || '—';


// Ações
$('#btnBack').onclick = ()=> history.back();
$('#btnEditProfile').onclick = ()=> location.href = 'cadastro.html';
$('#btnConfirm').onclick = confirmBooking;
}


function formatDateBR(iso){
const [y,m,d] = iso.split('-').map(Number);
return new Date(y,m-1,d).toLocaleDateString('pt-BR', {day:'2-digit', month:'long', year:'numeric'});
}


async function confirmBooking(){
  const payload = {
    services: chosenIds,
    datetime: when, // { date:'YYYY-MM-DD', time:'HH:mm' }
    profile,
    barberId: localStorage.getItem('booking_barber') || null
  };

  // deixa pronto para a página de pagamento
  localStorage.setItem('booking_payload', JSON.stringify(payload));
  location.href = 'pagamento.html';




// TODO: enviar via n8n
// const res = await fetch('https://seu-n8n/webhook/barber/book', {
// method:'POST', headers:{'Content-Type':'application/json', Authorization: 'Bearer '+localStorage.getItem('bb_token')},
// body: JSON.stringify(payload)
// });
// const data = await res.json();


console.log('[BOOKING] payload', payload);
toast('Agendamento confirmado!');


// Limpeza opcional
// localStorage.removeItem('booking_services');
// localStorage.removeItem('booking_datetime');
};