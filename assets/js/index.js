/*****************************************************
 * CONEXIÓN A FIREBASE (DESACTIVADA / SOLO REFERENCIA)
 *****************************************************/

// const firebaseConfig = {
//   apiKey: "AIzaSyDtMue0tHhYAnMX2gxZeNHyovYZI1NQgws",
//   authDomain: "edds-aplicaciones-ad2025.firebaseapp.com",
//   projectId: "edds-aplicaciones-ad2025",
//   storageBucket: "edds-aplicaciones-ad2025.firebasestorage.app",
//   messagingSenderId: "891364040951",
//   appId: "1:891364040951:web:4fb519d171863c30f533f2"
// };

// // Inicializar Firebase
// firebase.initializeApp(firebaseConfig);
// const auth = firebase.auth();

/*****************************************************
 * LOGICA VISUAL DEL LOGIN (FUNCIONAL SIN FIREBASE)
 *****************************************************/

// Elementos del DOM
const loginBtn = document.getElementById('btn-google-login');
const userInfo = document.createElement('span');
userInfo.classList.add('ms-3', 'fw-bold', 'text-success');

// Insertar el texto del usuario al lado del botón
loginBtn.parentNode.insertBefore(userInfo, loginBtn.nextSibling);

// --- Simulación de inicio de sesión (sin Firebase) ---
loginBtn.addEventListener('click', async () => {
  // Simular el flujo de inicio de sesión
  console.log("🧩 Simulación: Usuario inicia sesión con Google");

  // Aquí normalmente se ejecutaría:
  // const provider = new firebase.auth.GoogleAuthProvider();
  // await auth.signInWithPopup(provider);

  mostrarModalNombre(); // Mostrar modal para nombre
});

// --- Simulación de logout ---
function logout() {
  console.log("🚪 Simulación: Usuario cerró sesión");
  localStorage.removeItem('username');
  userInfo.textContent = '';

  // Restaurar botón de login
  loginBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" class="me-2">
      <path fill="#4285F4" d="M17.64 9.20455c0-.63864-.05727-1.25182-.16818-1.84091H9.18182v3.48182h4.79091c-.20727.99636-.83864 1.94636-1.82045 2.61818v2.25818h2.90818c1.70182-1.56636 2.68636-3.87364 2.68636-6.49727z"/>
      <path fill="#34A853" d="M9.18182 18c2.43 0 4.47-.80545 5.96182-2.18182l-2.90818-2.25818c-.80545.54273-1.84091.86818-2.99091.86818-2.32182 0-4.28364-1.56636-4.98-3.675H1.20364v2.33364C2.70545 16.14909 5.69818 18 9.18182 18z"/>
      <path fill="#FBBC05" d="M4.20182 10.71c-.20727-.60409-.32364-1.25182-.32364-1.92818s.11636-1.32409.32364-1.92818V4.51909H1.20364C.43636 5.89909 0 7.55091 0 9.28364s.43636 3.38455 1.20364 4.76455l2.99818-2.33818z"/>
      <path fill="#EA4335" d="M9.18182 3.57909c1.32409 0 2.50727.45818 3.44273 1.35455l2.58364-2.58364C13.65182.97364 11.61182 0 9.18182 0 5.69818 0 2.70545 1.85091 1.20364 4.51909l2.99818 2.33818c.69636-2.10864 2.65818-3.67727 4.98-3.67727z"/>
    </svg>
    Iniciar sesión
  `;
  loginBtn.onclick = loginHandler;
}

// --- Simulación del flujo visual cuando se "inicia sesión" ---
function mostrarModalNombre() {
  let username = localStorage.getItem('username');

  if (!username) {
    const modal = new bootstrap.Modal(document.getElementById('usernameModal'));
    modal.show();

    const saveBtn = document.getElementById('saveUsername');
    const input = document.getElementById('usernameInput');

    saveBtn.onclick = () => {
      const name = input.value.trim();
      if (name !== "") {
        localStorage.setItem('username', name);
        userInfo.textContent = `👤 ${name}`;
        modal.hide();
        mostrarBotonLogout();
      } else {
        input.classList.add('is-invalid');
      }
    };
  } else {
    userInfo.textContent = `👤 ${username}`;
    mostrarBotonLogout();
  }
}

// --- Cambiar botón visualmente a "Logout" ---
function mostrarBotonLogout() {
  loginBtn.innerHTML = '<i class="bi bi-box-arrow-right me-2"></i> Cerrar sesión';
  loginBtn.onclick = logout;
}
