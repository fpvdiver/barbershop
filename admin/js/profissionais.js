document.addEventListener('DOMContentLoaded', () => {
  // ===== Off-canvas =====
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const btnMenu = document.getElementById('btnMenu');
  const openMenu = ()=>{ sidebar.classList.add('open'); overlay.hidden=false; btnMenu.setAttribute('aria-expanded','true'); };
  const closeMenu = ()=>{ sidebar.classList.remove('open'); overlay.hidden=true; btnMenu.setAttribute('aria-expanded','false'); };
  btnMenu?.addEventListener('click', ()=> sidebar.classList.contains('open')?closeMenu():openMenu());
  overlay?.addEventListener('click', closeMenu);
  document.getElementById('logout')?.addEventListener('click', ()=>{ localStorage.clear(); location.href = '../index.html'; });

  const $  = (q,root=document)=>root.querySelector(q);
  const $$ = (q,root=document)=>Array.from(root.querySelectorAll(q));

  // ===== Storage (compatível com profissional.js) =====
  const STORAGE_KEY = 'admin_barbers';
  const seed = [
    {
      id:'ana', nome:'Ana Santos', specs:['Corte','Sobrancelha'], rate:40, active:true,
      avatar:'https://i.pravatar.cc/160?img=47', avatarDataUri:'',
      endereco:'Rua das Flores, 123 - SP', telefone:'11999990000', email:'ana@example.com',
      cpf:'123.456.789-00', rg:'12.345.678-9', nasc:'1995-04-20',
      contratacao:'2023-01-10', vinculo:'comissao', obs:'Chegou por indicação do João.'
    },
    {
      id:'leo', nome:'Léo Martins', specs:['Degradê','Navalhado'], rate:40, active:true,
      avatar:'https://i.pravatar.cc/160?img=12', avatarDataUri:'',
      endereco:'Av. Central, 55 - SP', telefone:'11911112222', email:'leo@example.com',
      cpf:'987.654.321-00', rg:'98.765.432-1', nasc:'1992-09-12',
      contratacao:'2022-07-01', vinculo:'comissao', obs:'Especialista em degradê.'
    },
    {
      id:'joao', nome:'João Pedro', specs:['Clássico'], rate:35, active:true,
      avatar:'https://i.pravatar.cc/160?img=5', avatarDataUri:'',
      endereco:'Rua B, 10 - SP', telefone:'11933334444', email:'joao@example.com',
      cpf:'111.222.333-44', rg:'11.222.333-4', nasc:'1990-01-05',
      contratacao:'2021-03-02', vinculo:'autonomo', obs:''
    },
    {
      id:'maria', nome:'Maria Souza', specs:['Colorimetria'], rate:45, active:false,
      avatar:'https://i.pravatar.cc/160?img=32', avatarDataUri:'',
      endereco:'Rua C, 999 - SP', telefone:'11955556666', email:'maria@example.com',
      cpf:'222.333.444-55', rg:'22.333.444-5', nasc:'1998-06-22',
      contratacao:'2024-02-20', vinculo:'clt', obs:'Em licença.'
    },
  ];
  const load = ()=> JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || seed.slice();
  const save = (list)=> localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

  let list = load();

  // ===== Referências da UI =====
  const grid = $('#grid');            // <tbody>
  const inputQ = $('#q');             // busca por nome/especialidade
  const selActive = $('#filterActive'); // filtro Ativos/Inativos
  const btnAdd = $('#btnAdd');
  const btnExport = $('#btnExport');

  // ===== Render =====
  function render(rows){
    if (!grid) return;
    grid.innerHTML = rows.map(r=>`
      <tr data-id="${r.id}">
        <td data-label="Nome" style="display:flex;align-items:center;gap:8px">
          <img src="${r.avatarDataUri || r.avatar || 'https://i.pravatar.cc/80?u='+encodeURIComponent(r.id)}" alt="" style="width:28px;height:28px;border-radius:999px;object-fit:cover;border:1px solid var(--border)">
          ${r.nome}
        </td>
        <td data-label="Especialidades">${(r.specs||[]).join(', ')}</td>
        <td data-label="Comissão (%)">${r.rate ?? 0}</td>
        <td data-label="Status">${r.active? '<span class="badge confirm">Ativo</span>':'<span class="badge cancel">Inativo</span>'}</td>
        <td data-label="Ações">
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="ghost-btn small" data-act="view" data-id="${r.id}">Agenda</button>
            <button class="ghost-btn small" data-act="edit" data-id="${r.id}">Editar</button>
          </div>
        </td>
      </tr>
    `).join('');
  }
  render(list);

  // ===== Filtros =====
  [inputQ, selActive].forEach(el => el?.addEventListener('input', applyFilters));
  function applyFilters(){
    const q  = (inputQ?.value||'').toLowerCase();
    const fa = selActive?.value || '';
    const out = list.filter(x =>
      (!q  || (x.nome||'').toLowerCase().includes(q) || (x.specs||[]).join(',').toLowerCase().includes(q)) &&
      (!fa || String(!!x.active)===fa)
    );
    render(out);
  }

  // ===== Clique nas ações (robusto) =====
  grid?.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-act]');
    if(!btn) return;

    const act = btn.dataset.act;
    const tr  = btn.closest('tr');
    const id  = btn.dataset.id || tr?.dataset.id;
    const p   = list.find(x=>x.id===id);

    if(!p){ alert('Profissional não encontrado.'); return; }

    if(act==='edit'){
      // 👉 abre a página de edição com os dados
      location.href = `profissional.html?id=${encodeURIComponent(id)}`;
      return;
    }

    if(act==='view'){
      // 👉 abre direto a aba Agenda
      location.href = `profissional.html?id=${encodeURIComponent(id)}#agenda`;
      return;
    }
  });

  // ===== Novo profissional rápido =====
  btnAdd?.addEventListener('click', ()=>{
    const nome = prompt('Nome do profissional:');
    if(!nome) return;
    const id = nome.toLowerCase().replace(/\s+/g,'_') + '_' + Date.now();
    const doc = {
      id, nome, specs:[], rate:40, active:true,
      avatar:'', avatarDataUri:'',
      endereco:'', telefone:'', email:'',
      cpf:'', rg:'', nasc:'', contratacao:'', vinculo:'', obs:''
    };
    list.push(doc); save(list); applyFilters();
    // já abre a tela de edição para completar o cadastro
    location.href = `profissional.html?id=${encodeURIComponent(id)}`;
  });

  // ===== Export CSV =====
  btnExport?.addEventListener('click', ()=>{
    const headers = ["Nome","Especialidades","Comissão (%)","Status","Telefone","E-mail","Vínculo"];
    const rows = list.map(r => [
      r.nome || '',
      (r.specs||[]).join(' | '),
      r.rate ?? 0,
      r.active ? 'Ativo' : 'Inativo',
      r.telefone || '',
      r.email || '',
      r.vinculo || ''
    ]);
    const csv = [headers, ...rows]
      .map(r=> r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a'); 
    a.href=url; 
    a.download='profissionais.csv'; 
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  // ===== (Opcional) Placeholder de agenda inline se existir no HTML =====
  // Se sua página de lista tem um bloco de agenda inline, mantemos compatibilidade.
  const agendaSeed = [
    {h:'09:00', cliente:'Lucas',  serv:'Corte',        status:'confirm'},
    {h:'10:00', cliente:'Mariana',serv:'Barba',        status:'pending'},
    {h:'11:00', cliente:'Pedro',  serv:'Corte+Barba',  status:'paid'},
  ];
  const agTitle = document.getElementById('agTitle');
  const agList  = document.getElementById('agList');
  if (agTitle && agList) {
    agTitle.textContent = 'Agenda (hoje)';
    agList.innerHTML = agendaSeed.map(r=>`
      <tr>
        <td data-label="Hora">${r.h}</td>
        <td data-label="Cliente">${r.cliente}</td>
        <td data-label="Serviço">${r.serv}</td>
        <td data-label="Status">${r.status}</td>
      </tr>
    `).join('');
  }
});
