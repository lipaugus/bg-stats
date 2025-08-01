// client/js/auth.js

// grab the Auth service from the global firebase
const auth = firebase.auth();

const emailEl = document.getElementById("email");
const passEl = document.getElementById("pass");
const rememberEl = document.getElementById("remember");
const btnLogin = document.getElementById("btn-login");
const errorMsg = document.getElementById("error-msg");

btnLogin.addEventListener("click", async () => {
  errorMsg.textContent = "";

  try {
    // choose session persistence
    const persistence = rememberEl.checked
      ? firebase.auth.Auth.Persistence.LOCAL
      : firebase.auth.Auth.Persistence.SESSION;

    await auth.setPersistence(persistence);
    await auth.signInWithEmailAndPassword(
      emailEl.value,
      passEl.value
    );

    // redirect on success
    window.location.href = "dashboard.html";
  } catch {
    errorMsg.textContent = "Usuario o contraseña incorrectos";
  }
});

// protect dashboard.html if not signed in
auth.onAuthStateChanged(user => {
  const onDashboard = location.pathname.endsWith("dashboard.html");
  if (onDashboard && !user) {
    location.href = "index.html";
  }
});
