document.addEventListener('DOMContentLoaded', () => {
  // Off-canvas básico (já vem do ui-enhancements para teclado/esc)
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const btnMenu = document.getElementById('btnMenu');
  const openMenu = ()=>{ sidebar.classList.add('open'); overlay.hidden=false; btnMenu.setAttribute('aria-expanded','true'); };
  const closeMenu = ()=>{ sidebar.classList.remove('open'); overlay.hidden=true; btnMenu.setAttribute('aria-expanded','false'); };
  btnMenu?.addEventListener('click', ()=> sidebar.classList.contains('open') ? closeMenu() : openMenu());
  overlay?.addEventListener('click', closeMenu);
  document.getElementById('logout')?.addEventListener('click', ()=>{ localStorage.clear(); location.href='../index.html'; });

  const $ = (q, r=document)=>r.querySelector(q);
  const $$ = (q, r=document)=>Array.from(r.querySelectorAll(q));
  const STORE_KEY = 'site_config';

  const defaults = {
    empresa: { nome:'bigatto\'s barber', whats:'11 90000-0000', maps:'', hSem:'09:00–20:00', hSab:'09:00–18:00', hDom:'Fechado' },
    integracoes: { n8nBase:'', sbUrl:'', sbAnon:'', gcalId:'' },
    home: {
      logo:'', status:'online',
      banners: [
        { type:'image', url:'', caption:'', link:'' },
        { type:'image', url:'', caption:'', link:'' },
        { type:'image', url:'', caption:'', link:'' },
      ]
    },
    pay: { pixKey:'', pixName:'', pixEndpoint:'' },
    whats: { provider:'gupshup', token:'', template:'Olá {{nome}}, seu agendamento foi confirmado para {{data}} às {{hora}}.' }
  };

  const state = load();

  // ===== ACCORDION toggle
  $$('.acc-head').forEach(h => {
    h.addEventListener('click', () => {
      const id = h.dataset.acc;
      const item = document.getElementById(id);
      item.classList.toggle('open');
      // scroll suave ao abrir
      if (item.classList.contains('open')) item.scrollIntoView({ behavior:'smooth', block:'start' });
    });
  });

  // ===== HOME – gerar 3 blocos de banner
  const bannersWrap = document.getElementById('banners');
  bannersWrap.innerHTML = state.home.banners.map((b,i)=> bannerHTML(i,b)).join('');
  function bannerHTML(i,b){
    return `
      <div class="card" style="padding:12px; margin-bottom:10px">
        <div class="inline"><strong>Banner ${i+1}</strong><span class="info">Imagem (URL) ou Vídeo (URL)</span></div>
        <div class="row row-2" data-idx="${i}">
          <label>Tipo
            <select class="ghost-btn b-type">
              <option value="image" ${b.type==='image'?'selected':''}>Imagem</option>
              <option value="video" ${b.type==='video'?'selected':''}>Vídeo</option>
            </select>
          </label>
          <label>URL
            <input class="ghost-btn b-url" placeholder="https://…/banner.jpg ou https://…/video.mp4" value="${escape(b.url)}">
          </label>
          <label>Legenda
            <input class="ghost-btn b-cap" placeholder="Corte degradê" value="${escape(b.caption)}">
          </label>
          <label>Link (opcional)
            <input class="ghost-btn b-link" placeholder="https://seusite.com/..." value="${escape(b.link)}">
          </label>
          <div class="inline" style="grid-column:1/-1">
            ${previewTag(b)}
          </div>
        </div>
      </div>`;
  }
  function previewTag(b){
    if (b.type==='video' && b.url) {
      return `<video class="thumb" controls src="${escape(b.url)}"></video>`;
    }
    return `<img class="thumb" src="${b.url ? escape(b.url) : ''}" alt="">`;
  }

  // ===== Preencher campos com state
  // Empresa
  $('#empNome').value  = state.empresa.nome;
  $('#empWhats').value = state.empresa.whats;
  $('#empMaps').value  = state.empresa.maps;
  $('#hSem').value     = state.empresa.hSem;
  $('#hSab').value     = state.empresa.hSab;
  $('#hDom').value     = state.empresa.hDom;

  // Integrações
  $('#n8nBase').value  = state.integracoes.n8nBase;
  $('#sbUrl').value    = state.integracoes.sbUrl;
  $('#sbAnon').value   = state.integracoes.sbAnon;
  $('#gcalId').value   = state.integracoes.gcalId;

  // Home
  $('#homeLogo').value = state.home.logo;
  $('#prevLogo').src   = state.home.logo || '';
  $('#homeStatus').value = state.home.status;
  updateStickerPreview();

  // Pagamentos
  $('#pixKey').value = state.pay.pixKey;
  $('#pixName').value = state.pay.pixName;
  $('#pixEndpoint').value = state.pay.pixEndpoint;

  // Whats
  $('#waProvider').value = state.whats.provider;
  $('#waToken').value = state.whats.token;
  $('#waTemplate').value = state.whats.template;

  // ===== Listeners – Home
  $('#homeLogo').addEventListener('input', e => $('#prevLogo').src = e.target.value.trim());
  $('#homeStatus').addEventListener('change', updateStickerPreview);
  function updateStickerPreview(){
    const s = $('#homeStatus').value;
    const el = $('#stPreview');
    el.textContent = s;
    el.className = `badge ${s==='online'?'st-online':'st-fechado'}`;
  }

  // banners: delegação para atualizar preview ao digitar
  bannersWrap.addEventListener('input', (e) => {
    const row = e.target.closest('[data-idx]'); if (!row) return;
    const idx = Number(row.dataset.idx);
    const type = $('.b-type',row).value;
    const url  = $('.b-url', row).value.trim();
    const cap  = $('.b-cap', row).value.trim();
    const link = $('.b-link', row).value.trim();
    state.home.banners[idx] = { type, url, caption:cap, link };

    // atualiza preview
    const preview = row.querySelector('img.thumb, video.thumb');
    if (preview?.tagName === 'IMG') {
      if (type==='video') {
        preview.replaceWith(el('video', {class:'thumb', controls:true, src:url}));
      } else {
        preview.src = url;
      }
    } else if (preview?.tagName === 'VIDEO') {
      if (type==='image') {
        preview.replaceWith(el('img', {class:'thumb', src:url}));
      } else {
        preview.src = url;
      }
    }
  });

  // ===== SAVE buttons
  $('#saveEmpresa').addEventListener('click', () => {
    state.empresa = {
      nome: val('#empNome'), whats: val('#empWhats'), maps: val('#empMaps'),
      hSem: val('#hSem'), hSab: val('#hSab'), hDom: val('#hDom')
    };
    save(); UIX.toast('Dados da empresa salvos.', 'success');
  });

  $('#saveIntegr').addEventListener('click', () => {
    state.integracoes = {
      n8nBase: val('#n8nBase'), sbUrl: val('#sbUrl'), sbAnon: val('#sbAnon'), gcalId: val('#gcalId')
    };
    save(); UIX.toast('Integrações salvas.', 'success');
  });

  $('#saveHome').addEventListener('click', () => {
    state.home.logo = val('#homeLogo');
    state.home.status = $('#homeStatus').value;
    // banners já são atualizados oninput
    save(); UIX.toast('Página inicial salva.', 'success');
  });

  $('#savePay').addEventListener('click', () => {
    state.pay = { pixKey: val('#pixKey'), pixName: val('#pixName'), pixEndpoint: val('#pixEndpoint') };
    save(); UIX.toast('Pagamentos salvos.', 'success');
  });

  $('#saveWhats').addEventListener('click', () => {
    state.whats = { provider: val('#waProvider'), token: val('#waToken'), template: val('#waTemplate') };
    save(); UIX.toast('WhatsApp salvo.', 'success');
  });

  // ===== Helpers
  function val(sel){ return $(sel).value.trim(); }
  function load(){
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return structuredClone(defaults);
    try { return deepMerge(structuredClone(defaults), JSON.parse(raw)); }
    catch { return structuredClone(defaults); }
  }
  function save(){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }

  function deepMerge(base, ext){
    for (const k in ext){
      if (ext[k] && typeof ext[k]==='object' && !Array.isArray(ext[k])) base[k] = deepMerge(base[k]||{}, ext[k]);
      else base[k] = ext[k];
    }
    return base;
  }
  function el(tag, attrs){
    const e = document.createElement(tag);
    Object.entries(attrs||{}).forEach(([k,v]) => {
      if (k==='class') e.className = v;
      else e.setAttribute(k, v);
    });
    return e;
  }
  function escape(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'); }
});
