const BRL = new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
function render(rows){
grid.innerHTML = rows.map(r=>`
<tr>
<td data-label="Data">${r.d}</td>
<td data-label="Hora">${r.h}</td>
<td data-label="Cliente">${r.cliente}</td>
<td data-label="Serviço">${r.serv}</td>
<td data-label="Profissional">${r.prof}</td>
<td data-label="Status">${badge(r.status)}</td>
<td data-label="Ações">
<div style="display:flex;gap:6px;flex-wrap:wrap">
<button class="ghost-btn small" data-act="confirm" data-id="${r.d+'_'+r.h}">Confirmar</button>
<button class="ghost-btn small" data-act="pay" data-id="${r.d+'_'+r.h}">Marcar pago</button>
<button class="ghost-btn small" data-act="resched" data-id="${r.d+'_'+r.h}">Reagendar</button>
<button class="ghost-btn small" data-act="cancel" data-id="${r.d+'_'+r.h}">Cancelar</button>
</div>
</td>
</tr>
`).join('');
}
render(data);


// ====== Filtros ======
[df,dt,selProf,selStatus].forEach(el=> el.addEventListener('change', applyFilters));
function applyFilters(){
let out = data.slice();
if(df.value) out = out.filter(x=> x.d >= df.value);
if(dt.value) out = out.filter(x=> x.d <= dt.value);
if(selProf.value) out = out.filter(x=> x.prof===selProf.value);
if(selStatus.value) out = out.filter(x=> x.status===selStatus.value);
render(out);
}


// ====== Ações rápidas ======
grid.addEventListener('click', (e)=>{
const act = e.target?.dataset?.act; if(!act) return;
const id = e.target.dataset.id; // chave simples d_h
const idx = data.findIndex(x=> (x.d+'_'+x.h)===id);
if(idx<0) return;


if(act==='confirm'){
data[idx].status = 'confirm';
}else if(act==='pay'){
data[idx].status = 'paid';
}else if(act==='cancel'){
if(confirm('Cancelar este agendamento?')) data[idx].status = 'cancel';
}else if(act==='resched'){
const novaData = prompt('Nova data (YYYY-MM-DD):', data[idx].d) || data[idx].d;
const novaHora = prompt('Nova hora (HH:mm):', data[idx].h) || data[idx].h;
data[idx].d = novaData; data[idx].h = novaHora; // validações podem ser adicionadas
}
applyFilters();
});


// ====== Export CSV ======
$('#btnExport').addEventListener('click', ()=>{
const rows = [["Data","Hora","Cliente","Serviço","Profissional","Status"], ...$$('#grid tr').map(tr=>
Array.from(tr.children).slice(0,6).map(td=>td.textContent.replace(/\n/g,' ').trim())
)];
const csv = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a'); a.href=url; a.download='agendamentos.csv'; a.click(); URL.revokeObjectURL(url);
});


// ====== Novo agendamento (mock) ======
$('#btnNew').addEventListener('click', ()=>{
const d = prompt('Data (YYYY-MM-DD):', new Date().toISOString().slice(0,10)); if(!d) return;
const h = prompt('Hora (HH:mm):', '15:00'); if(!h) return;
const cliente = prompt('Cliente:', 'Novo Cliente') || 'Cliente';
const serv = prompt('Serviço:', servicos[0]) || servicos[0];
const prof = prompt('Profissional:', profissionais[0]) || profissionais[0];
data.push({ d, h, cliente, serv, prof, status:'pending', amount: 50 });
applyFilters();
});
