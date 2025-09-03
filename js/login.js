document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formLogin");   // <--- ESSA LINHA É OBRIGATÓRIA
  const goSignUp = document.getElementById("goSignUp");
  const btnVoltar = document.getElementById("btnVoltar");

  const API = "https://primary-odonto.up.railway.app/webhook/barber/client/login";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (data.ok) {
        localStorage.setItem("auth", JSON.stringify({
          client_id: data.client_id,
          email,
          token: data.token,
          time: Date.now()
        }));
        window.location.href = "resumo.html";
      } else {
        alert("E-mail ou senha inválidos.");
      }
    } catch (err) {
      alert("Erro no login. Tente novamente.");
      console.error(err);
    }
  });

  goSignUp.addEventListener("click", () => {
    alert("Funcionalidade de cadastro ainda não implementada (mock).");
  });

  btnVoltar.addEventListener("click", () => {
    history.back();
  });
});
