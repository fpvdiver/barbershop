const N8N_BASE = localStorage.getItem('n8n_base') || 'https://your-n8n.example.com/webhook/barber';
const $ = (q,root=document)=>root.querySelector(q);
const BRL = new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});

const payload = JSON.parse(localStorage.getItem('booking_payload')||'null');
const catalog  = JSON.parse(localStorage.getItem('services_catalog')||'null') || [
  { id:'cut_brow', price:45 },{ id:'cut_prog', price:100},{ id:'cut_botox', price:80},
  { id:'degrade', price:40},{ id:'cut_hidr', price:60},{ id:'cut_luzes', price:120},
];

const total = (payload?.services||[]).reduce((a,id)=> a + (catalog.find(s=>s.id===id)?.price||0), 0);
const sinal = Math.round(total*0.3*100)/100;

let timerIv, txid;

window.addEventListener('DOMContentLoaded', init);

async function init(){
  $('#sumTotal').textContent = BRL.format(total);
  $('#sumSinal').textContent = BRL.format(sinal);
  $('#btnVoltar').onclick = ()=> history.back();
  $('#btnCopy').onclick = copy;
  $('#btnJaPaguei').onclick = ()=> checkNow(true);

  // Cria intenção PIX no n8n
  try{
    const res = await fetch(`${N8N_BASE}/payment/pix-intent`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        amount: sinal,
        date: payload?.datetime?.date,
        time: payload?.datetime?.time,
        services: payload?.services||[],
        barberId: payload?.barberId || localStorage.getItem('booking_barber'),
        customer: { nome: payload?.profile?.nome, telefone: payload?.profile?.telefone }
      })
    });
    const data = await res.json(); // { txid, brcode, qrPngDataUrl, expiresAt }
    txid = data.txid;
    $('#brcode').value = data.brcode;
    $('#qr').src = data.qrPngDataUrl;
    startCountdown(new Date(data.expiresAt));
    localStorage.setItem('booking_pix', JSON.stringify({ txid, amount: sinal }));
    // polling de status
    timerIv = setInterval(checkNow, 5000);
  }catch(e){ alert('Falha ao gerar PIX'); }
}

function copy(){
  const ta = $('#brcode'); ta.select(); document.execCommand('copy');
  alert('Código PIX copiado.');
}

async function checkNow(force){
  if(!txid) return;
  try{
    const r = await fetch(`${N8N_BASE}/payment/status?txid=${encodeURIComponent(txid)}`);
    const s = await r.json(); // { status: 'pending'|'approved'|'expired' }
    if(s.status==='approved'){
      clearInterval(timerIv);
      await notifyWhatsapp();
      location.href = 'confirmado.html';
    }else if(force && s.status!=='approved'){
      alert('Ainda não aprovado. Assim que compensar, confirmaremos automaticamente.');
    }
  }catch(e){ /* silencioso */ }
}

async function notifyWhatsapp(){
  const phone = payload?.profile?.telefone || '';
  const msg = `Agendamento confirmado:\\n${payload?.datetime?.date} às ${payload?.datetime?.time}.\\nSinal recebido: ${BRL.format(sinal)}.\\nObrigado!`;
  try{
    await fetch(`${N8N_BASE}/notify/whatsapp`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ phone, message: msg })
    });
  }catch(e){ /* opcional: log */ }
}

function startCountdown(expires){
  const el = $('#expires');
  function tick(){
    const diff = Math.max(0, expires - new Date());
    const m = String(Math.floor(diff/60000)).padStart(2,'0');
    const s = String(Math.floor((diff%60000)/1000)).padStart(2,'0');
    el.textContent = `Expira em ${m}:${s}`;
    if(diff<=0){ clearInterval(timerIv); el.textContent = 'Expirado'; }
  }
  tick(); setInterval(tick, 1000);
}
