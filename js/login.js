// ===== Config =====
// Use o seu endpoint n8n (pode trocar via localStorage.setItem('n8n_base', '...') se quiser)
const N8N_BASE_DEFAULT = 'https://primary-odonto.up.railway.app/webhook';
const N8N_BASE = localStorage.getItem('n8n_base') || N8N_BASE_DEFAULT;
const LOGIN_ENDPOINT = `${N8N_BASE}/barber/client/login`; // POST

// Página de destino após login
function getRedirectTarget() {
  const url = new URL(window.location.href);
  return url.searchParams.get('redirect') || 'resumo.html';
}

function $(sel) { return document.querySelector(sel); }

function setLoading(loading) {
  $('#btnEntrar').disabled = !!loading;
  $('#btnEntrar').textContent = loading ? 'Entrando…' : 'Entrar';
}

function showError(msg) {
  const el = $('#alert');
  el.textContent = msg || 'Falha ao autenticar. Tente novamente.';
  el.style.display = 'block';
}

function hideError() {
  const el = $('#alert');
  el.style.display = 'none';
  el.textContent = '';
}

async function login(email, password) {
  const res = await fetch(LOGIN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  // Se o n8n retornar um 4xx/5xx, tente ler json mesmo assim
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    const msg = data?.message || `Erro de autenticação (HTTP ${res.status})`;
    throw new Error(msg);
  }
  return data;
}

document.addEventListener('DOMContentLoaded', () => {
  // Nota de ambiente (útil para debug)
  const note = $('#envNote');
  if (note) note.textContent = new URL(LOGIN_ENDPOINT).host;

  const form = $('#formLogin');
  const btnBack = $('#btnVoltar');
  const btnSignUp = $('#goSignUp');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const email = $('#email').value.trim();
    const password = $('#password').value.trim();

    if (!email || !password) {
      showError('Informe e-mail e senha.');
      return;
    }

    try {
      setLoading(true);
      const data = await login(email, password);

      // Guarde o que for útil para o front:
      // tokens (se precisar chamar Supabase direto), e perfil do cliente para exibir nome, etc.
      localStorage.setItem('bb_token', data.access_token || '');
      localStorage.setItem('bb_refresh', data.refresh_token || '');
      if (data.user)      localStorage.setItem('bb_user', JSON.stringify(data.user));
      if (data.profile)   localStorage.setItem('booking_profile', JSON.stringify(data.profile));

      // Redireciona
      window.location.href = getRedirectTarget();
    } catch (err) {
      showError(err.message || 'Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  });

  btnBack?.addEventListener('click', () => history.back());

  btnSignUp?.addEventListener('click', () => {
    // Aqui você pode abrir uma tela de cadastro ou mandar para um link
    // Se quiser, dá para usar o mesmo modelo do login em outro webhook /barber/client/signup
    alert('Cadastro via Supabase Auth ainda não implementado nesta tela.');
  });
});
