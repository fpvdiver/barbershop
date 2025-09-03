const N8N_BASE = 'https://primary-odonto.up.railway.app/webhook';

async function login(email, password) {
  const res = await fetch(`${N8N_BASE}/barber/client/login`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.message || 'Falha no login');
  // Guarde os tokens se quiser
  localStorage.setItem('sb_access', data.access_token);
  localStorage.setItem('sb_refresh', data.refresh_token);
  localStorage.setItem('client_profile', JSON.stringify(data.profile));
  return data;
}
