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

  const $ = (q,root=document)=>root.querySelector(q);

  // ===== Estado do filtro =====
  const state = { period: 7 }; // padrão 7 dias
  const rangeLabel = $('#rangeLabel');

  // ===== Mock: geradores de dados com base no período =====
  function genDays(n) {
    const arr = Array.from({length:n}, (_,i)=>{
      const d = new Date(); d.setDate(d.getDate()-(n-1-i));
      return d;
    });
    return arr;
  }
  const fmtDay = (d)=> d.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' });

  function genFat(n) {
    // pequena tendência + ruído
    let base = 200 + Math.random()*100;
    return Array.from({length:n}, (_,i)=> Math.round(base + i*5 + (Math.random()*120)));
  }
  function genServ(n) {
    // serviços “mais vendidos” independe de dias: escala pelo período
    const scale = n / 14; // 14 como referência
    return {
      labels: ['Corte','Barba','Corte+Barba','Hidratação','Luzes'],
      data: [120,80,65,30,22].map(v => Math.max(1, Math.round(v*scale*(0.8+Math.random()*0.4))))
    };
  }
  function genPay(n) {
    // proporções estáveis com leve jitter; valores escalam pelo período
    const total = 100 * (n/7);
    const pix = 0.55 + (Math.random()-0.5)*0.04;
    const card= 0.35 + (Math.random()-0.5)*0.04;
    const cash= Math.max(0.05, 1 - pix - card);
    const norm = pix+card+cash;
    const dist = [pix/norm, card/norm, cash/norm];
    return {
      labels: ['PIX','Cartão','Dinheiro'],
      data: dist.map(p => Math.round(total*p))
    };
  }
  function genProd(n) {
    // produtividade em atendimentos por profissional (escala pelo período)
    const scale = n / 14;
    const base = [42,36,28,24]; // referência em 14 dias
    return {
      labels: ['Ana','Léo','João','Guilherme'],
      data: base.map(v => Math.max(1, Math.round(v*scale*(0.85+Math.random()*0.3))))
    };
  }

  // ===== Charts manager =====
  const charts = {};
  function mkChart(id, cfg) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    if (charts[id]) { charts[id].destroy(); charts[id] = null; }
    const box = canvas.parentElement;
    canvas.width  = box.clientWidth;
    canvas.height = box.clientHeight;
    charts[id] = new Chart(canvas.getContext('2d'), cfg);
  }

  const baseOpts = {
    responsive: true,
    maintainAspectRatio: false,
    resizeDelay: 100,
    animation: { duration: 250 },
    plugins: { legend: { display: true } },
    interaction: { intersect: false, mode: 'index' },
  };

  function renderAll() {
    const n = state.period;
    const dayObjs = genDays(n);
    const dayLabels = dayObjs.map(fmtDay);
    // label do intervalo
    const first = dayObjs[0].toLocaleDateString('pt-BR');
    const last  = dayObjs[dayObjs.length-1].toLocaleDateString('pt-BR');
    rangeLabel.textContent = `${first} — ${last}`;

    const fatData  = genFat(n);
    const servData = genServ(n);
    const payData  = genPay(n);
    const prodData = genProd(n);

    mkChart('chartFat', {
      type: 'line',
      data: { labels: dayLabels, datasets: [{ label:'Faturamento (R$)', data: fatData, tension: 0.3 }] },
      options: baseOpts
    });

    mkChart('chartServ', {
      type: 'bar',
      data: { labels: servData.labels, datasets: [{ label:'Qtd', data: servData.data }] },
      options: baseOpts
    });

    mkChart('chartPay', {
      type: 'pie',
      data: { labels: payData.labels, datasets: [{ data: payData.data }] },
      options: { ...baseOpts, plugins: { ...baseOpts.plugins, legend: { display: true, position: 'bottom' } } }
    });

    mkChart('chartProd', {
      type: 'bar',
      data: { labels: prodData.labels, datasets: [{ label:'Atendimentos', data: prodData.data }] },
      options: { ...baseOpts, indexAxis: 'y' }
    });

    // marca botão ativo
    document.querySelectorAll('.seg button').forEach(b=>{
      b.classList.toggle('active', Number(b.dataset.n) === n);
      b.setAttribute('aria-selected', String(Number(b.dataset.n) === n));
    });
  }

  // inicial
  renderAll();

  // resize (debounced)
  let t;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => renderAll(), 150);
  });

  // handlers dos botões de período
  document.querySelectorAll('.seg button').forEach(btn=>{
    btn.addEventListener('click', () => {
      const n = Number(btn.dataset.n);
      if (!n || n === state.period) return;
      state.period = n;
      renderAll();
    });
  });
});
