document.addEventListener('DOMContentLoaded', () => {
  // ====== Off-canvas sidebar ======
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const btnMenu = document.getElementById('btnMenu');

  const openMenu = () => {
    sidebar.classList.add('open');
    overlay.hidden = false;
    btnMenu.setAttribute('aria-expanded', 'true');
    sidebar.setAttribute('aria-hidden', 'false');
  };
  const closeMenu = () => {
    sidebar.classList.remove('open');
    overlay.hidden = true;
    btnMenu.setAttribute('aria-expanded', 'false');
    sidebar.setAttribute('aria-hidden', 'true');
  };

  btnMenu?.addEventListener('click', () => {
    const isOpen = sidebar.classList.contains('open');
    (isOpen ? closeMenu : openMenu)();
  });
  overlay?.addEventListener('click', closeMenu);
  document.addEventListener('keydown', (e) => { if(e.key === 'Escape') closeMenu(); });

  // ====== KPIs (mock) ======
  const metrics = { agHoje: 12, fatMes: 13500.55, clientes: 182, cancel: 1 };
  document.getElementById('ag-hoje').textContent = metrics.agHoje;
  document.getElementById('fat-mes').textContent = metrics.fatMes
    .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  document.getElementById('clientes').textContent = metrics.clientes;
  document.getElementById('cancel').textContent = metrics.cancel;

  // ====== Agenda (mock) ======
  const agenda = [
    {hora:'09:00', cliente:'Lucas',  servico:'Corte',         prof:'Ana',  status:'confirm'},
    {hora:'10:00', cliente:'Mariana',servico:'Barba',         prof:'João', status:'pending'},
    {hora:'11:00', cliente:'Pedro',  servico:'Corte+Barba',   prof:'Léo',  status:'confirm'},
    {hora:'13:00', cliente:'Bruno',  servico:'Degradê',       prof:'Ana',  status:'cancel'},
  ];
  const tbody = document.getElementById('agenda-list');
  const badge = (s)=> s==='confirm' ? 'confirm' : s==='pending' ? 'pending' : 'cancel';
  const label = (s)=> s==='confirm' ? 'Confirmado' : s==='pending' ? 'Aguardando' : 'Cancelado';
  tbody.innerHTML = agenda.map(a=>`
    <tr>
      <td data-label="Hora">${a.hora}</td>
      <td data-label="Cliente">${a.cliente}</td>
      <td data-label="Serviço">${a.servico}</td>
      <td data-label="Profissional">${a.prof}</td>
      <td data-label="Status"><span class="badge ${badge(a.status)}">${label(a.status)}</span></td>
    </tr>
  `).join('');

  // ====== Export CSV rápido ======
  document.getElementById('exportCsv')?.addEventListener('click', () => {
    const rows = [['Hora','Cliente','Serviço','Profissional','Status'], ...agenda.map(a=>[
      a.hora, a.cliente, a.servico, a.prof, label(a.status)
    ])];
    const csv = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'agenda.csv'; a.click();
    URL.revokeObjectURL(url);
  });

  // ====== Logout ======
  document.getElementById('logout')?.addEventListener('click', () => {
    localStorage.clear();
    location.href = '../index.html';
  });
  
});



