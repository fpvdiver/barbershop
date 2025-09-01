// Mock simples de autenticação.
// Depois você pode trocar por OTP / n8n (POST /auth/start e /auth/verify)
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formLogin');
  const back = document.getElementById('btnVoltar');
  const sign = document.getElementById('goSignUp');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const pwd   = document.getElementById('password').value.trim();
    if(!email || !pwd){ return; }

    // “Token” fake só para destravar o fluxo
    localStorage.setItem('bb_token', 'dev_token_'+Date.now());
    localStorage.setItem('bb_email', email);

    // Se ainda não tem cadastro, manda para cadastro; senão, volta para o fluxo
    const hasProfile = !!localStorage.getItem('booking_profile');
    location.href = hasProfile ? 'resumo.html' : 'cadastro.html';
  });

  back.addEventListener('click', () => history.back());
  sign.addEventListener('click', () => location.href = 'cadastro.html');
});
