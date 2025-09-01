document.addEventListener('DOMContentLoaded', () => {
const $$ = (q,root=document)=>Array.from(root.querySelectorAll(q));
const list = $('#list');


const render = (rows)=>{
list.innerHTML = rows.map(r=>`
<tr>
<td data-label="Nome">${r.nome}</td>
<td data-label="Telefone">${r.tel}</td>
<td data-label="Último serviço">${r.ultimo}</td>
<td data-label="Ticket médio">R$ ${r.ticket.toFixed(2)}</td>
<td data-label="Tags">${r.tags.join(', ')}</td>
<td data-label="Ações"><button class="ghost-btn small" data-id="${r.id}">Ver</button></td>
</tr>
`).join('');
};
render(clientes);


// Busca e filtro por tag
const inputQ = $('#q');
const selTag = $('#tag');
function applyFilters(){
const q = (inputQ.value||'').toLowerCase();
const t = selTag.value;
const res = clientes.filter(c=>
(!q || c.nome.toLowerCase().includes(q) || c.tel.replace(/\s/g,'').includes(q.replace(/\s/g,''))) &&
(!t || c.tags.includes(t))
);
render(res);
}
inputQ.addEventListener('input', applyFilters);
selTag.addEventListener('change', applyFilters);


// Drawer de perfil
const drawer = $('#drawer');
const dClose = $('#dClose');
list.addEventListener('click', (e)=>{
const id = e.target?.dataset?.id; if(!id) return;
const c = clientes.find(x=>x.id===id); if(!c) return;
$('#dName').textContent = c.nome;
$('#dPhone').textContent = c.tel;
$('#dTags').textContent = c.tags.join(', ');
const hist = $('#dHist'); hist.innerHTML=''; c.hist.forEach(h=>{ const li=document.createElement('li'); li.textContent=h; hist.appendChild(li); });
drawer.hidden = false;
});
dClose.addEventListener('click', ()=> drawer.hidden = true);
drawer.addEventListener('click', (e)=>{ if(e.target===drawer) drawer.hidden=true; });


// Export CSV
$('#btnExport').addEventListener('click', ()=>{
const rows = [["Nome","Telefone","Último serviço","Ticket médio","Tags"], ...$$('#list tr').map(tr=>
Array.from(tr.children).slice(0,5).map(td=>td.textContent)
)];
const csv = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a'); a.href=url; a.download='clientes.csv'; a.click(); URL.revokeObjectURL(url);
});


// WhatsApp rápido
$('#dMsg').addEventListener('click', ()=>{
const phone = $('#dPhone').textContent.replace(/\D/g,'');
window.open(`https://wa.me/55${phone}`,'_blank');
});


// Logout
$('#logout')?.addEventListener('click', ()=>{ localStorage.clear(); location.href = '../index.html'; });
});