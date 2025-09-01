// Fonte de dados
// Se quiser puxar do n8n, basta trocar a função loadServices() por um fetch.
const SERVICES = [
{ id:'cut_brow', name:'Corte e sobrancelha', price:45.00 },
{ id:'cut_prog', name:'Corte e progressiva', price:100.00, note:'Partir de 80,00 pelo tamanho' },
{ id:'cut_botox', name:'Corte e botox', price:80.00 },
{ id:'degrade', name:'CORTE (degrade)', price:40.00, note:'Navalhado e penteado ou finalizado' },
{ id:'cut_hidr', name:'Corte+hidratacao', price:60.00, img:'https://picsum.photos/seed/hidr/80' },
{ id:'cut_luzes', name:'Corte+luzes platinadas', price:120.00, img:'https://picsum.photos/seed/luz/80' },
];


const BRL = new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
const $ = (q,root=document)=>root.querySelector(q);
const $$ = (q,root=document)=>Array.from(root.querySelectorAll(q));


const state = { selected: new Set() };


window.addEventListener('DOMContentLoaded', () => {
renderList(SERVICES);
$('#btn-fechar').addEventListener('click', () => history.back());
$('#btn-continuar').addEventListener('click', goNext);
});


function renderList(items){
const wrap = $('#lista');
wrap.innerHTML = '';
items.forEach(s => {
const el = document.createElement('button');
el.type = 'button';
el.className = 'item';
el.dataset.id = s.id;
el.innerHTML = `
${s.img?`<img class="thumb" src="${s.img}" alt=""/>`:`<div class="thumb" aria-hidden="true"></div>`}
<div class="meta">
<div class="name">${s.name}</div>
${s.note?`<div class="note">${s.note}</div>`:''}
</div>
<div class="price">${BRL.format(s.price)}</div>
`;
el.addEventListener('click', ()=> toggle(s.id, el));
wrap.appendChild(el);
});
updateFooter();
}


function toggle(id, el){
if(state.selected.has(id)) state.selected.delete(id); else state.selected.add(id);
el.classList.toggle('selected', state.selected.has(id));
updateFooter();
}


function updateFooter(){
const n = state.selected.size;
$('#count').textContent = n;
$('#btn-continuar').disabled = n===0;
}


function goNext(){
// Persiste seleção e navega — ajuste a rota como preferir
const chosen = Array.from(state.selected);
localStorage.setItem('booking_services', JSON.stringify(chosen));
console.log('Selecionados:', chosen);
location.href = 'calendario.html';
}