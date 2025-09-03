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
  }
});
