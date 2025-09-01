const BRL = new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});


document.addEventListener('DOMContentLoaded', () => {
// off-canvas
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const btnMenu = document.getElementById('btnMenu');
const openMenu = ()=>{ sidebar.classList.add('open'); overlay.hidden=false; btnMenu.setAttribute('aria-expanded','true'); };
const closeMenu = ()=>{ sidebar.classList.remove('open'); overlay.hidden=true; btnMenu.setAttribute('aria-expanded','false'); };
btnMenu?.addEventListener('click', ()=> sidebar.classList.contains('open')?closeMenu():openMenu());
overlay?.addEventListener('click', closeMenu);


// Mock de transações
const tx = [
{d:'2025-09-01', desc:'Corte + Barba (Lucas)', kind:'Receita', method:'PIX', val: 80},
{d:'2025-09-01', desc:'Compra Pomadas', kind:'Despesa', method:'Cartão', val:-120},
{d:'2025-09-02', desc:'Corte (Mariana)', kind:'Receita', method:'Cartão', val: 45},
{d:'2025-09-02', desc:'Corte (Bruno)', kind:'Receita', method:'Dinheiro',val: 40},
{d:'2025-09-03', desc:'Luz + Corte (Pedro)', kind:'Receita', method:'PIX', val:120},
];


const $ = (q,root=document)=>root.querySelector(q);
const list = $('#txList');


const render = (rows)=>{
list.innerHTML = rows.map(r=>`
<tr>
<td data-label="Data">${r.d}</td>
<td data-label="Descrição">${r.desc}</td>
<td data-label="Tipo">${r.kind}</td>
<td data-label="Método">${r.method}</td>
<td data-label="Valor">${BRL.format(r.val)}</td>
</tr>
`).join('');
};
render(tx);


// KPIs
function refreshKpis(rows){
const receita = rows.filter(x=>x.val>0).reduce((a,b)=>a+b.val,0);
const despesa = rows.filter(x=>x.val<0).reduce((a,b)=>a+b.val,0);
const lucro = receita + despesa;
const comissao = receita * 0.4 * 0.1; // ex: 40% repasse ao barbeiro, 10% do mês já provisionado
$('#kpiReceita').textContent = BRL.format(receita);
$('#kpiDespesa').textContent = BRL.format(Math.abs(despesa));
$('#kpiLucro').textContent = BRL.format(lucro);
$('#kpiComissao').textContent= BRL.format(comissao);
}
refreshKpis(tx);


// Filtros simples
const df=$('#dateFrom'), dt=$('#dateTo'), pm=$('#payMethod');
[df,dt,pm].forEach(el=> el.addEventListener('change', applyFilters));
function applyFilters(){
let out = tx.slice();
if(df.value) out = out.filter(x=> x.d >= df.value);
if(dt.value) out = out.filter(x=> x.d <= dt.value);
if(pm.value) out = out.filter(x=> x.method===pm.value);
render(out); refreshKpis(out);
}


// Export CSV
$('#btnExportTx').addEventListener('click', ()=>{
const rows = [["Data","Descrição","Tipo","Método","Valor"], ...Array.from(list.querySelectorAll('tr')).map(tr=>
Array.from(tr.children).map(td=>td.textContent)
)];
const csv = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a'); a.href=url; a.download='financeiro.csv'; a.click(); URL.revokeObjectURL(url);
});


// Logout
$('#logout')?.addEventListener('click', ()=>{ localStorage.clear(); location.href = '../index.html'; });
});