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
  const $  = (q,root=document)=>root.querySelector(q);
  const $$ = (q,root=document)=>Array.from(root.querySelectorAll(q));
  const todayStr = () => new Date().toISOString().slice(0,10);
  const pad2 = (n)=> String(n).padStart(2,'0');

  // ===== Storage (fallback quando não houver API) =====
  const STORE = {
    key: 'admin_campaigns',
    load()  { return JSON.parse(localStorage.getItem(this.key) || '[]'); },
    save(v) { localStorage.setItem(this.key, JSON.stringify(v)); }
  };

  // Mock de clientes (para calcular segmentação local)
  const CLIENTS = [
    {id:'c1', nome:'Allan Bigatto', primeiro_nome:'Allan', phone:'5511999990001', lastVisit: daysAgo(10), lastService:'Corte'},
    {id:'c2', nome:'Lucas Almeida', primeiro_nome:'Lucas', phone:'5511999990002', lastVisit: daysAgo(32), lastService:'Degradê'},
    {id:'c3', nome:'Mariana Silva', primeiro_nome:'Mariana', phone:'5511999990003', lastVisit: daysAgo(45), lastService:'Barba'},
    {id:'c4', nome:'João Pedro',    primeiro_nome:'João',  phone:'5511999990004', lastVisit: daysAgo(18), lastService:'Corte'},
    {id:'c5', nome:'Bruna Costa',   primeiro_nome:'Bruna', phone:'5511999990005', lastVisit: daysAgo(65), lastService:'Hidratação'},
  ];
  function daysAgo(n){ const d=new Date(); d.setDate(d.getDate()-n); return d.toISOString().slice(0,10); }

  // Templates prontos
  const TEMPLATES = [
    {
      id:'renew_corte',
      nome:'Renovação de Corte (15–30 dias)',
      serv:'Corte',
      msg:'Oi {{primeiro_nome}}! Notamos que seu último corte já faz um tempinho. Que tal renovar o estilo? 💈 Reserve aqui: {{link}}'
    },
    {
      id:'renew_degrade',
      nome:'Renovação de Degradê (15–30 dias)',
      serv:'Degradê',
      msg:'Fala {{primeiro_nome}}! Seu degradê merece aquele retoque 🔥 Bora agendar? {{link}}'
    },
    {
      id:'renew_barba',
      nome:'Barba alinhada (15–30 dias)',
      serv:'Barba',
      msg:'E aí {{primeiro_nome}}! Partiu alinhar a barba? Temos horários hoje e amanhã. Agenda em 1 clique: {{link}}'
    },
    {
      id:'renew_hidrat',
      nome:'Hidratação – cabelo ou barba',
      serv:'Hidratação',
      msg:'{{primeiro_nome}}, já experimentou nossa hidratação? Ideal p/ dar vida ao cabelo/barba. Agenda: {{link}}'
    },
    {
      id:'renew_color',
      nome:'Colorimetria / tonalização',
      serv:'Colorimetria',
      msg:'{{primeiro_nome}}, pensando em realçar a cor? Nosso tratamento de colorimetria te espera. Reserve: {{link}}'
    }
  ];

  // ===== Estado do Drawer (edição/criação) =====
  let campaigns = STORE.load();
  let editing = null; // id da campanha em edição (string) ou null
  const drawer = $('#drawer');
  const overlay2 = $('#overlay2');

  // refs form
  const fTitle   = $('#fTitle');
  const fTemplate= $('#fTemplate');
  const fMessage = $('#fMessage');
  const fLink    = $('#fLink');
  const fTest    = $('#fTestPhone');
  const fServ    = $('#fServ');
  const fFiltroDias = $('#fFiltroDias');
  const fDias    = $('#fDias');
  const fWhenNow = $('input[name="when"][value="agora"]');
  const fWhenSch = $('input[name="when"][value="agendar"]');
  const fDate    = $('#fDate');
  const fTime    = $('#fTime');
  const preview  = $('#preview');
  const countChars = $('#countChars');
  const audCount = $('#audCount');

  // preencher select de template
  TEMPLATES.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id; opt.textContent = t.nome;
    fTemplate.appendChild(opt);
  });

  // popular painel de templates
  const templatesList = $('#templatesList');
  TEMPLATES.forEach(t=>{
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <strong>${t.nome}</strong>
      <div class="muted" style="margin:6px 0">Serviço alvo: ${t.serv}</div>
      <div class="whats-preview" style="background:#f7f7f7">${escapeHtml(t.msg)}</div>
      <div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap">
        <button class="ghost-btn" data-act="use" data-id="${t.id}">Usar template</button>
      </div>`;
    templatesList.appendChild(card);
  });
  templatesList.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-act="use"]');
    if(!btn) return;
    const t = TEMPLATES.find(x=>x.id===btn.dataset.id);
    openDrawer(); // nova campanha
    // aplica base do template
    fTemplate.value = t.id;
    fTitle.value = t.nome;
    fServ.disabled = false;
    fServ.value = t.serv;
    fMessage.value = t.msg;
    updatePreview();
  });

  // tabs
  const tabBtns = $$('.seg button');
  tabBtns.forEach(b=> b.addEventListener('click', ()=>{
    tabBtns.forEach(x=>{ x.classList.toggle('active', x===b); x.setAttribute('aria-selected', x===b?'true':'false'); });
    const which = b.dataset.tab;
    $('#panel-minhas').style.display    = which==='minhas' ? 'block' : 'none';
    $('#panel-templates').style.display = which==='templates' ? 'block' : 'none';
  }));

  // render lista
  function renderList(){
    const grid = $('#gridCampanhas');
    grid.innerHTML = campaigns.map(c => `
      <tr data-id="${c.id}">
        <td data-label="Título">${escapeHtml(c.title)}</td>
        <td data-label="Status">
          ${badge(c.status)} ${c.lastResult? `<span class="badge">${c.lastResult.sent||0} enviados</span>`:''}
        </td>
        <td data-label="Segmento">${humanSeg(c)}</td>
        <td data-label="Programação">${humanSchedule(c)}</td>
        <td data-label="Métrica">${c.metrics? `${c.metrics.sent||0} env.` : '—'}</td>
        <td data-label="Ações">
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button class="ghost-btn small" data-act="edit">Editar</button>
            <button class="ghost-btn small" data-act="duplicate">Duplicar</button>
            ${c.status==='scheduled' ? '<button class="ghost-btn small" data-act="cancel">Cancelar</button>' : ''}
            ${c.status==='draft' ? '<button class="ghost-btn small" data-act="sendnow">Disparar</button>' : ''}
          </div>
        </td>
      </tr>
    `).join('');
  }

  function badge(s){
    if(s==='sent') return '<span class="badge confirm">Enviada</span>';
    if(s==='scheduled') return '<span class="badge pending">Agendada</span>';
    return '<span class="badge">Rascunho</span>';
  }
  function humanSeg(c){
    const parts = [];
    if(c.segment?.type==='servico') parts.push(`Serviço: ${c.segment.serv}`);
    if(c.segment?.days) parts.push(`Não vem há ${c.segment.days}d`);
    if(parts.length===0) return 'Todos';
    return parts.join(' • ');
  }
  function humanSchedule(c){
    if(c.schedule?.when==='agora') return 'Imediato';
    if(c.schedule?.when==='agendar') return `${c.schedule.date} ${c.schedule.time||''}`;
    return '—';
  }

  // abrir/fechar drawer
  function openDrawer(id=null){
    editing = id;
    $('#drawerTitle').textContent = id ? 'Editar campanha' : 'Nova campanha';
    resetForm();
    if(id){
      const c = campaigns.find(x=>x.id===id);
      if(c) fillForm(c);
    }
    drawer.classList.add('open');
    overlay2.classList.add('show');
  }
  function closeDrawer(){
    drawer.classList.remove('open');
    overlay2.classList.remove('show');
    editing = null;
  }
  $('#btnClose').addEventListener('click', closeDrawer);
  overlay2.addEventListener('click', closeDrawer);

  // nova
  $('#btnNova').addEventListener('click', ()=> openDrawer());

  // preencher form
  function resetForm(){
    fTitle.value = ''; fTemplate.value=''; fMessage.value=''; fLink.value='';
    fServ.value=''; fServ.disabled=true; fFiltroDias.checked=false; fDias.disabled=true;
    fTest.value=''; fWhenNow.checked=true; fWhenSch.checked=false; fDate.value=''; fTime.value='';
    updatePreview(); countChars.textContent='0'; audCount.textContent='0 destinatários';
    $$('input[name="seg"]').forEach(r=> r.checked = r.value==='todos');
  }
  function fillForm(c){
    fTitle.value = c.title || '';
    fTemplate.value = c.templateId || '';
    fMessage.value = c.message || '';
    fLink.value    = c.link || '';

    if(c.segment?.type==='servico'){ $('input[name="seg"][value="servico"]').checked = true; fServ.disabled=false; fServ.value=c.segment.serv||''; }
    else { $('input[name="seg"][value="todos"]').checked = true; fServ.disabled=true; fServ.value=''; }

    if(c.segment?.days){ fFiltroDias.checked=true; fDias.disabled=false; fDias.value=String(c.segment.days); }
    else { fFiltroDias.checked=false; fDias.disabled=true; }

    if(c.schedule?.when==='agendar'){ fWhenSch.checked=true; fWhenNow.checked=false; fDate.disabled=false; fTime.disabled=false; fDate.value = c.schedule.date||todayStr(); fTime.value=c.schedule.time||'09:00'; }
    else { fWhenNow.checked=true; fWhenSch.checked=false; fDate.disabled=true; fTime.disabled=true; fDate.value=''; fTime.value=''; }

    updatePreview();
    calcAudience();
  }

  // listeners segmentação/when
  $$('input[name="seg"]').forEach(r=>{
    r.addEventListener('change', ()=>{
      const serv = $('input[name="seg"][value="servico"]').checked;
      fServ.disabled = !serv;
      calcAudience();
    });
  });
  fServ.addEventListener('change', calcAudience);
  fFiltroDias.addEventListener('change', ()=>{
    fDias.disabled = !fFiltroDias.checked;
    calcAudience();
  });
  fDias.addEventListener('change', calcAudience);
  fWhenNow.addEventListener('change', toggleSchedule);
  fWhenSch.addEventListener('change', toggleSchedule);
  function toggleSchedule(){
    const sch = fWhenSch.checked;
    fDate.disabled = !sch; fTime.disabled = !sch;
    if(sch && !fDate.value) fDate.value = todayStr();
    if(sch && !fTime.value) fTime.value = '09:00';
  }

  // preview / contador
  fMessage.addEventListener('input', updatePreview);
  fLink.addEventListener('input', updatePreview);
  function updatePreview(){
    const sample = {
      nome: 'Cliente Exemplo',
      primeiro_nome: 'Cliente',
      link: fLink.value || 'https://seusite.com/agendar'
    };
    const msg = interpolate(fMessage.value || '', sample);
    preview.textContent = msg;
    countChars.textContent = (fMessage.value||'').length;
  }

  // calcular audiência estimada (mock com CLIENTS)
  function calcAudience(){
    const seg = $('input[name="seg"]:checked').value;
    let base = CLIENTS.slice();

    if(seg==='servico' && fServ.value){
      base = base.filter(c => c.lastService === fServ.value);
    }
    if(fFiltroDias.checked){
      const dd = Number(fDias.value||0);
      base = base.filter(c => daysBetween(c.lastVisit, todayStr()) >= dd);
    }

    audCount.textContent = `${base.length} destinatários`;
    return base;
  }
  function daysBetween(d1, d2){
    return Math.round((new Date(d2) - new Date(d1)) / (1000*60*60*24));
  }

  // ações
  $('#btnSave').addEventListener('click', ()=>{
    const doc = collectForm('draft');
    if(!doc) return;
    if(editing){
      const i = campaigns.findIndex(c=>c.id===editing);
      if(i>=0) campaigns[i] = { ...campaigns[i], ...doc, id: editing };
    } else {
      campaigns.push({ ...doc, id: `cmp_${Date.now()}` });
    }
    STORE.save(campaigns);
    renderList();
    alert('Rascunho salvo.');
    closeDrawer();
  });

  $('#btnSchedule').addEventListener('click', async ()=>{
    const doc = collectForm('scheduled', true);
    if(!doc) return;
    // API n8n opcional
    try {
      if (window.API && API.base) {
        await API._fetch('/campaigns', { method:'POST', body: JSON.stringify({ ...doc, action:'schedule' }) });
      }
      upsertLocal(doc, editing);
      alert('Campanha agendada.');
      closeDrawer();
      renderList();
    } catch (e) {
      console.error(e);
      alert('Falha ao agendar: ' + e.message);
    }
  });

  $('#btnSendNow').addEventListener('click', async ()=>{
    const doc = collectForm('sent', false, true);
    if(!doc) return;
    const aud = calcAudience();
    if(aud.length === 0){ alert('Segmento vazio. Ajuste os filtros.'); return; }

    try {
      if (window.API && API.base) {
        await API._fetch('/campaigns', { method:'POST', body: JSON.stringify({ ...doc, action:'send_now', audience: aud }) });
      } else {
        // simula envio local
        await fakeSend(aud);
      }
      upsertLocal({ ...doc, lastResult:{ sent: aud.length } }, editing);
      alert(`Disparo realizado para ${aud.length} contatos.`);
      closeDrawer();
      renderList();
    } catch (e) {
      console.error(e);
      alert('Falha no envio: ' + e.message);
    }
  });

  $('#btnTest').addEventListener('click', async ()=>{
    const phone = (fTest.value||'').trim();
    if(!/^55\d{10,13}$/.test(phone)){ alert('Informe o número no formato 55DDDNUMERO.'); return; }
    const msg = preview.textContent || '';
    try {
      if (window.API && API.base) {
        await API.whatsapp(phone, msg);
      } else {
        console.log('TEST ONLY →', phone, msg);
      }
      alert('Mensagem de teste enviada.');
    } catch (e) {
      alert('Falha ao enviar teste: ' + e.message);
    }
  });

  $('#btnDelete').addEventListener('click', ()=>{
    if(!editing) { alert('Abra uma campanha para excluir.'); return; }
    if(!confirm('Excluir esta campanha?')) return;
    campaigns = campaigns.filter(c => c.id !== editing);
    STORE.save(campaigns);
    renderList();
    closeDrawer();
  });

  // grid actions (editar/duplicar/cancelar/disparar)
  $('#gridCampanhas').addEventListener('click', async (e)=>{
    const btn = e.target.closest('button[data-act]');
    if(!btn) return;
    const tr = btn.closest('tr');
    const id = tr?.dataset?.id;
    const c = campaigns.find(x=>x.id===id);
    const act = btn.dataset.act;

    if(act==='edit'){ openDrawer(id); return; }
    if(act==='duplicate'){
      const copy = { ...c, id:`cmp_${Date.now()}`, status:'draft', metrics:null, lastResult:null, schedule:null, title: c.title+' (cópia)' };
      campaigns.push(copy); STORE.save(campaigns); renderList(); return;
    }
    if(act==='cancel'){
      if(!confirm('Cancelar agendamento?')) return;
      try {
        if (window.API && API.base) {
          await API._fetch(`/campaigns/${encodeURIComponent(id)}/cancel`, { method:'POST' });
        }
        c.status='draft'; c.schedule=null; STORE.save(campaigns); renderList();
      } catch (e) { alert('Falha ao cancelar: '+e.message); }
      return;
    }
    if(act==='sendnow'){
      openDrawer(id);
      fWhenNow.checked = true; fWhenSch.checked = false; toggleSchedule();
      return;
    }
  });

  // coleta form -> valida
  function collectForm(status, requireSchedule=false, forceNow=false){
    const title = fTitle.value.trim();
    if(!title){ alert('Informe o título.'); return null; }
    const message = (fMessage.value||'').trim();
    if(!message){ alert('Escreva a mensagem.'); return null; }

    const segType = $('input[name="seg"]:checked').value;
    const segment = {
      type: segType === 'servico' ? 'servico' : 'todos',
      serv: segType === 'servico' ? (fServ.value||'') : '',
      days: fFiltroDias.checked ? Number(fDias.value||0) : 0
    };

    const schedule = (() => {
      const when = forceNow ? 'agora' : (fWhenSch.checked ? 'agendar' : 'agora');
      if(when==='agendar'){
        if(!fDate.value){ alert('Escolha a data do agendamento.'); return null; }
        return { when, date: fDate.value, time: fTime.value || '09:00' };
      }
      return { when: 'agora' };
    })();
    if(requireSchedule && (!schedule || schedule.when!=='agendar')) return null;

    const out = {
      id: editing || `cmp_${Date.now()}`,
      title, templateId: fTemplate.value||'',
      message, link: fLink.value.trim(),
      segment, schedule, status,
      metrics: null, lastResult: null
    };
    return out;
  }

  function upsertLocal(doc, id){
    if(id){
      const i = campaigns.findIndex(x=>x.id===id);
      if(i>=0) campaigns[i] = { ...campaigns[i], ...doc };
    } else {
      const j = campaigns.findIndex(x=>x.id===doc.id);
      if(j>=0) campaigns[j] = { ...campaigns[j], ...doc };
      else campaigns.push(doc);
    }
    STORE.save(campaigns);
  }

  function fakeSend(audience){
    // simulação de latência/envio
    return new Promise(res=> setTimeout(res, 800));
  }

  // util
  function interpolate(tpl, data){
    return tpl
      .replace(/\{\{\s*primeiro_nome\s*\}\}/g, data.primeiro_nome||'')
      .replace(/\{\{\s*nome\s*\}\}/g, data.nome||'')
      .replace(/\{\{\s*link\s*\}\}/g, data.link||'');
  }
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

  // listeners dinâmicos
  fTemplate.addEventListener('change', ()=>{
    const t = TEMPLATES.find(x=>x.id===fTemplate.value);
    if(!t) return;
    fServ.disabled = false;
    fServ.value = t.serv || '';
    fMessage.value = t.msg || '';
    updatePreview();
    calcAudience();
  });
  fMessage.addEventListener('input', ()=> countChars.textContent = fMessage.value.length);

  // inicial
  renderList();
});
