// ========= CONFIG API =========
// Endpoint do Railway (n8n / backend) que orquestra a leitura de serviços
const API_URL = 'https://primary-odonto.up.railway.app/webhook/baber/procedures';

// Caso o endpoint exija um token, inclua aqui (ou deixe vazio)
const API_TOKEN = ''; // ex.: 'Bearer xxxxx' (se houver)

// ========= UI & Estado =========
const elList = document.getElementById('servicesList');
const elBtn = document.getElementById('btnContinuar');
const elQ = document.getElementById('q');
const elDur = document.getElementById('duration');
const BRL = new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});

let allServices = [];
let selected = new Map(); // id -> normalized service

// restaura seleção prévia
try {
  const raw = localStorage.getItem('cart_services');
  if(raw){ JSON.parse(raw).forEach(s => selected.set(s.id, s)); }
} catch(e){ /* ignore */ }
updateContinueState();

document.addEventListener('DOMContentLoaded', async () => {
  await loadServices();
  wireEvents();
});

function wireEvents(){
  elQ.addEventListener('input', debounce(applyFilters, 150));
  elDur.addEventListener('change', applyFilters);
  elBtn.addEventListener('click', goNext);
}

async function loadServices(){
  try {
    const items = await fetchServicesFromRailway();
    allServices = items;
    render(allServices);
  } catch (err) {
    console.error(err);
    elList.innerHTML = `
      <article class="svc" style="grid-column:1/-1">
        <div class="row" style="justify-content:flex-start; gap:10px">
          <strong class="error">Erro ao carregar serviços</strong>
          <span class="muted">(${escapeHtml(err.message)})</span>
        </div>
        <p class="muted">Tente novamente mais tarde. Se persistir, verifique CORS e formato do payload do webhook.</p>
        <button class="btn-ghost" onclick="location.reload()">Tentar novamente</button>
      </article>
    `;
  }
}

/**
 * Busca serviços do seu endpoint.
 * Este método é resiliente ao formato do payload.
 * Aceita as seguintes respostas e mapeia automaticamente:
 *  - { data: [ { id, name, description, base_price_cents, duration_min, active } ] }
 *  - { services: [ ... ] }
 *  - [ ... ] (array direto)
 */
async function fetchServicesFromRailway(){
  const body = {
    procedure: 'list_services', // convencionado; ajuste se seu backend esperar outro nome
    // filtros opcionais poderiam ser passados aqui
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    mode: 'cors',
    credentials: 'omit',
    headers: {
      'Content-Type': 'application/json',
      ...(API_TOKEN ? { 'Authorization': API_TOKEN } : {})
    },
    body: JSON.stringify(body)
  });

  if(!res.ok){
    let txt = '';
    try { txt = await res.text(); } catch(e){}
    throw new Error(`HTTP ${res.status} ${res.statusText} ${txt}`);
  }

  let payload;
  try { payload = await res.json(); }
  catch(e){ throw new Error('Falha ao decodificar JSON do webhook'); }

  // Tenta resolver os itens independente do “envelope”
  let items = [];
  if (Array.isArray(payload)) items = payload;
  else if (Array.isArray(payload?.data)) items = payload.data;
  else if (Array.isArray(payload?.services)) items = payload.services;
  else if (payload?.result && Array.isArray(payload.result)) items = payload.result;

  if (!Array.isArray(items)) {
    throw new Error('Formato inesperado do payload de serviços');
  }

  // Normaliza campos esperados pela UI
  const normalized = items
    .map(raw => normalizeService(raw))
    .filter(s => s && (s.active === undefined || s.active === true)); // mostra só ativos, se vier o campo

  return normalized;
}

function normalizeService(raw){
  // Tenta mapear diferentes convenções de nome de campo
  const id  = raw.id || raw.service_id || raw.uuid || raw._id;
  const name = raw.name || raw.titulo || raw.nome || '';
  const description = raw.description || raw.descricao || raw.desc || '';
  // preço pode vir como cents, centavos, ou valor float BRL
  let price_cents = 0;
  if (Number.isFinite(raw.base_price_cents)) price_cents = raw.base_price_cents;
  else if (Number.isFinite(raw.price_cents)) price_cents = raw.price_cents;
  else if (Number.isFinite(raw.preco_centavos)) price_cents = raw.preco_centavos;
  else if (Number.isFinite(raw.price)) price_cents = Math.round(raw.price * 100);
  else if (Number.isFinite(raw.preco)) price_cents = Math.round(raw.preco * 100);

  // duração em minutos
  let duration_min = 0;
  if (Number.isFinite(raw.duration_min)) duration_min = raw.duration_min;
  else if (Number.isFinite(raw.duration)) duration_min = raw.duration;
  else if (Number.isFinite(raw.duracao_minutos)) duration_min = raw.duracao_minutos;

  // ativo
  const active = (raw.active === undefined) ? true : !!raw.active;

  if(!id || !name) return null;

  return { id, name, description, base_price_cents: price_cents, duration_min, active };
}

function render(list){
  if(!list.length){
    elList.innerHTML = `<div class="svc" style="grid-column:1/-1"><strong>Nenhum serviço disponível.</strong></div>`;
    return;
  }
  elList.innerHTML = list.map(s => cardService(s)).join('');
  elList.querySelectorAll('input[type="checkbox"][data-id]')
    .forEach(cb => cb.addEventListener('change', onToggle));
}

function cardService(s){
  const checked = selected.has(s.id) ? 'checked' : '';
  const price = BRL.format((s.base_price_cents ?? 0)/100);
  const dur = s.duration_min ? `${s.duration_min} min` : '—';
  return `
    <article class="svc">
      <div class="row">
        <h3>${escapeHtml(s.name)}</h3>
        <label class="badge">
          <input type="checkbox" data-id="${s.id}" ${checked} style="accent-color: var(--primary); margin-right:6px"> Selecionar
        </label>
      </div>
      ${s.description ? `<p>${escapeHtml(s.description)}</p>` : `<p class="muted">—</p>`}
      <div class="row">
        <span class="price">${price}</span>
        <span class="badge" title="Duração">${dur}</span>
      </div>
    </article>
  `;
}

function onToggle(e){
  const id = e.target.dataset.id;
  const svc = allServices.find(x => x.id === id);
  if(!svc) return;
  if(e.target.checked){
    selected.set(id, toCartSvc(svc));
  } else {
    selected.delete(id);
  }
  updateContinueState();
  persistSelection();
}

function toCartSvc(s){
  return {
    id: s.id,
    name: s.name,
    description: s.description || '',
    price_cents: s.base_price_cents || 0,
    duration_min: s.duration_min || 0,
    qty: 1
  };
}

function updateContinueState(){
  elBtn.disabled = selected.size === 0;
  elBtn.textContent = selected.size > 0
    ? `Continuar (${selected.size} selecionado${selected.size>1?'s':''})`
    : 'Continuar';
}

function persistSelection(){
  const arr = Array.from(selected.values());
  localStorage.setItem('cart_services', JSON.stringify(arr));
}

function goNext(){
  if(selected.size === 0) return;
  persistSelection();
  window.location.href = 'calendario.html';
}

function applyFilters(){
  const q = (elQ.value || '').toLowerCase().trim();
  const dur = elDur.value;
  let list = [...allServices];

  if(q){
    list = list.filter(s =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q)
    );
  }

  if(dur){
    if(dur === '<=30') list = list.filter(s => (s.duration_min || 0) <= 30);
    if(dur === '<=45') list = list.filter(s => (s.duration_min || 0) <= 45);
    if(dur === '>45')  list = list.filter(s => (s.duration_min || 0) > 45);
  }

  render(list);
}

function debounce(fn, ms){
  let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), ms); };
}
function escapeHtml(str=''){
  return String(str)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}
