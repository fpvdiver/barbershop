// js/login.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formLogin");
  const goSignUp = document.getElementById("goSignUp");
  const btnVoltar = document.getElementById("btnVoltar");

  // Usuário fictício
  const mockUser = {
    email: "teste@teste.com",
    password: "123456"
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (email === mockUser.email && password === mockUser.password) {
      // Guardar sessão fictícia
      localStorage.setItem("auth", JSON.stringify({ email, time: Date.now() }));

      alert("Login realizado com sucesso!");
      window.location.href = "resumo.html"; // redireciona para relatórios
    } else {
      alert("E-mail ou senha inválidos.");
    }
  });

  goSignUp.addEventListener("click", () => {
    alert("Funcionalidade de cadastro ainda não implementada (mock).");
  });

  btnVoltar.addEventListener("click", () => {
    history.back();
  });
});

