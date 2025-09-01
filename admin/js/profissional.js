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

  // ===== Helpers =====
  const $ = (q,root=document)=>root.querySelector(q);
  const BRL = new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
  const url = new URL(location.href);
  const barberId = url.searchParams.get('id');

  // Upload helpers
  async function fileToDataURL(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }
  // Compressão simples via canvas (limita a 256px / qualidade ~0.85)
  async function compressImage(dataUrl, maxSize = 256, quality = 0.85) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = dataUrl;
    });
  }

  // ===== Storage (mock + fallback) =====
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
  const loadList = ()=> JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || seed.slice();
  const saveList = (list)=> localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

  let list = loadList();
  let barber = list.find(b => b.id === barberId) || seed[0];

  // ===== Header/Profile fill =====
  $('#title').textContent   = `Profissional – ${barber.nome}`;
  $('#name').textContent    = barber.nome;
  $('#specs').textContent   = (barber.specs || []).join(', ');
  $('#rate').textContent    = `${barber.rate}%`;
  $('#status').textContent  = barber.active ? 'Ativo' : 'Inativo';
  $('#avatar').src          = barber.avatarDataUri || barber.avatar || 'https://i.pravatar.cc/160?img=1';

  // KPIs mock
  $('#kAtend').textContent  = 28;
  $('#kTicket').textContent = BRL.format(58);

  // ===== Form Perfil (hidratar) =====
  $('#fNome').value         = barber.nome || '';
  $('#fSpecs').value        = (barber.specs || []).join(', ');
  $('#fAvatar').value       = barber.avatar || '';
  $('#fRate').value         = barber.rate ?? 40;
  $('#fActive').checked     = !!barber.active;

  $('#fTelefone').value     = barber.telefone   || '';
  $('#fEmail').value        = barber.email      || '';
  $('#fEndereco').value     = barber.endereco   || '';
  $('#fCpf').value          = barber.cpf        || '';
  $('#fRg').value           = barber.rg         || '';
  $('#fNasc').value         = barber.nasc       || '';
  $('#fContratacao').value  = barber.contratacao|| '';
  $('#fVinculo').value      = barber.vinculo    || '';
  $('#fObs').value          = barber.obs        || '';

  // Hint se veio via arquivo
  if (barber.avatarDataUri) {
    const hint = document.createElement('small');
    hint.className = 'muted';
    hint.textContent = 'Avatar atual carregado via arquivo.';
    $('#fAvatar').insertAdjacentElement('afterend', hint);
  }

  // Preview ao vivo do avatar por URL
  $('#fAvatar').addEventListener('input', () => {
    const u = $('#fAvatar').value.trim();
    if (u) { $('#avatar').src = u; barber.avatar = u; barber.avatarDataUri = ''; }
  });

  // Upload de arquivo → base64 comprimido + preview
  $('#fAvatarUpload').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('Arquivo maior que 2MB.'); return; }
    const raw = await fileToDataURL(file);
    const compressed = await compressImage(raw, 256, 0.85);
    barber.avatarDataUri = compressed;
    $('#avatar').src = compressed; // preview
  });

  // Remover avatar
  $('#btnAvatarClear').addEventListener('click', () => {
    if (!confirm('Remover avatar do profissional?')) return;
    barber.avatarDataUri = '';
    barber.avatar = '';
    $('#fAvatar').value = '';
    $('#fAvatarUpload').value = '';
    $('#avatar').src = 'https://i.pravatar.cc/160?img=1';
  });

  // ===== Ações topo =====
  $('#btnEdit').addEventListener('click', () => {
    window.scrollTo({ top: $('#tab-perfil').offsetTop - 60, behavior: 'smooth' });
  });
  $('#btnMessage').addEventListener('click', () => {
    alert('Integração de mensagens via n8n/WhatsApp — definir canal em Configurações.');
  });

  // ===== Salvar Perfil =====
  $('#btnSave').addEventListener('click', () => {
    const doc = {
      ...barber,
      nome: $('#fNome').value.trim(),
      specs: $('#fSpecs').value.split(',').map(s=>s.trim()).filter(Boolean),
      rate: Math.max(0, Math.min(100, Number($('#fRate').value)||0)),
      active: $('#fActive').checked,
      // avatar: priorizamos o base64; se vazio, cai para URL
      avatarDataUri: barber.avatarDataUri || '',
      avatar: ($('#fAvatar').value.trim() || barber.avatar || ''),
      telefone:    $('#fTelefone').value.trim(),
      email:       $('#fEmail').value.trim(),
      endereco:    $('#fEndereco').value.trim(),
      cpf:         $('#fCpf').value.trim(),
      rg:          $('#fRg').value.trim(),
      nasc:        $('#fNasc').value,
      contratacao: $('#fContratacao').value,
      vinculo:     $('#fVinculo').value,
      obs:         $('#fObs').value.trim()
    };

    // validações mínimas
    if(!doc.nome){ alert('Informe o nome.'); return; }
    if(doc.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(doc.email)){ alert('E-mail inválido.'); return; }

    const idx = list.findIndex(x=>x.id===barber.id);
    if (idx>=0) list[idx] = doc; else list.push(doc);
    saveList(list);

    alert('Perfil salvo.');
    location.replace(`profissional.html?id=${encodeURIComponent(doc.id)}`);
  });

  // ===== Excluir =====
  $('#btnDelete').addEventListener('click', () => {
    if (!confirm(`Excluir ${barber.nome}?`)) return;
    list = list.filter(x=>x.id!==barber.id);
    saveList(list);
    alert('Excluído.');
    location.href = 'profissionais.html';
  });

  // ===== Tabs =====
  const tabs = document.querySelectorAll('.tab');
  const views = {
    perfil:     $('#tab-perfil'),
    agenda:     $('#tab-agenda'),
    comissoes:  $('#tab-comissoes')
  };
  const showTab = (name)=>{
    tabs.forEach(t=>t.classList.toggle('active', t.dataset.tab===name));
    Object.entries(views).forEach(([k,v])=> v.style.display = (k===name ? 'block':'none'));
    history.replaceState(null, '', '#' + name);
  };
  tabs.forEach(t => t.addEventListener('click', ()=> showTab(t.dataset.tab)));
  const initialTab = (location.hash || '#perfil').slice(1);
  showTab(views[initialTab] ? initialTab : 'perfil');

  // ===== Agenda (mock) =====
  const agRows = [
    {h:'09:00', cliente:'Lucas',   serv:'Corte',        status:'confirm'},
    {h:'10:00', cliente:'Mariana', serv:'Barba',        status:'pending'},
    {h:'11:00', cliente:'Pedro',   serv:'Corte+Barba',  status:'paid'},
    {h:'14:00', cliente:'Bruno',   serv:'Degradê',      status:'confirm'},
  ];
  $('#agDate').value = new Date().toISOString().slice(0,10);

  function badge(s){
    if (s==='paid'   ) return '<span class="badge confirm">Pago</span>';
    if (s==='confirm') return '<span class="badge confirm">Confirmado</span>';
    if (s==='pending') return '<span class="badge pending">Aguardando</span>';
    return '<span class="badge cancel">Cancelado</span>';
  }
  function renderAgenda(rows){
    $('#agList').innerHTML = rows.map(r=>`
      <tr>
        <td data-label="Hora">${r.h}</td>
        <td data-label="Cliente">${r.cliente}</td>
        <td data-label="Serviço">${r.serv}</td>
        <td data-label="Status">${badge(r.status)}</td>
        <td data-label="Ações">
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="ghost-btn small" data-act="confirm" data-id="${r.h}">Confirmar</button>
            <button class="ghost-btn small" data-act="pay"     data-id="${r.h}">Marcar pago</button>
            <button class="ghost-btn small" data-act="cancel"  data-id="${r.h}">Cancelar</button>
          </div>
        </td>
      </tr>
    `).join('');
  }
  renderAgenda(agRows);

  $('#btnReloadAgenda').addEventListener('click', async ()=>{
    // integração futura: GET /admin/barbers/:id/agenda?date=YYYY-MM-DD (via n8n)
    renderAgenda(agRows);
  });

  $('#agList').addEventListener('click', (e)=>{
    const act = e.target?.dataset?.act; if(!act) return;
    const id  = e.target.dataset.id;
    const idx = agRows.findIndex(x=>x.h===id); if(idx<0) return;

    if (act==='confirm') agRows[idx].status='confirm';
    if (act==='pay')     agRows[idx].status='paid';
    if (act==='cancel')  { if(confirm('Cancelar este horário?')) agRows[idx].status='cancel'; }

    renderAgenda(agRows);
  });

  // ===== Comissões (Chart.js) — mock últimos 6 meses =====
  const months = (() => {
    const arr=[]; const d=new Date();
    for(let i=5;i>=0;i--){ const x=new Date(d.getFullYear(), d.getMonth()-i, 1);
      arr.push(x.toLocaleDateString('pt-BR',{month:'short'}));
    }
    return arr;
  })();
  const base = 1200 + Math.random()*400;
  const data = months.map((_,i)=> Math.round(base + Math.sin(i/2)*200 + (Math.random()*120-60)));
  const avg  = Math.round(data.reduce((a,b)=>a+b,0) / data.length);
  const max  = Math.max(...data), min = Math.min(...data);

  $('#kAvg').textContent = BRL.format(avg);
  $('#kMax').textContent = BRL.format(max);
  $('#kMin').textContent = BRL.format(min);

  const ctx = document.getElementById('chartCom');
  new Chart(ctx, {
    type: 'bar',
    data: { labels: months, datasets: [{ label: 'Comissões (R$)', data }] },
    options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:true } } }
  });
});
