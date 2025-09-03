document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formLogin");
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

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.ok) {
        // guarda token e infos no localStorage
        localStorage.setItem("auth", JSON.stringify({
          client_id: data.client_id,
          email,
          token: data.token,
          time: Date.now()
        }));

        alert("Login realizado com sucesso!");
        window.location.href = "resumo.html";
      } else {
        alert(data.error || "E-mail ou senha inválidos.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro no login. Tente novamente.");
    }
  });

  goSignUp.addEventListener("click", () => {
    window.location.href = "cadastro.html"; // tela de cadastro
  });

  btnVoltar.addEventListener("click", () => {
    history.back();
  });
});
