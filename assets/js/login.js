// =========================================================
// CONFIGURACIÓN DE FIREBASE
// =========================================================
const firebaseConfig = {
  apiKey: "AIzaSyCb7ka8ExRoYk6YykUpKKVMvoKk_JfP2ko",
  authDomain: "petcare-4a63f.firebaseapp.com",
  projectId: "petcare-4a63f",
  storageBucket: "petcare-4a63f.firebasestorage.app",
  messagingSenderId: "443204856539",
  appId: "1:443204856539:web:9f7362bd4a5a468ce27afe",
  measurementId: "G-GSYEF3PB7K"
};


if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig)
}

const auth = firebase.auth()
const db = firebase.firestore()

// =========================================================
// DETECTAR ELEMENTOS DEL DOM (si existen en la página)
// =========================================================
const loginForm = document.getElementById('loginForm')
const registerForm = document.getElementById('registerForm')
const toggleForm = document.getElementById('toggleForm')
const googleLogin = document.getElementById('googleLogin')
const formTitle = document.getElementById('formTitle')
const welcomeMessage = document.getElementById('welcomeMessage')
const logoutBtn = document.getElementById('logoutBtn')
const loginButton = document.getElementById('loginBtn')
const calendarioLink = document.getElementById('calendarioLink')
const adminPanelBtn = document.getElementById('adminPanelBtn')

// =========================================================
// CAMBIAR ENTRE LOGIN Y REGISTRO
// =========================================================
if (toggleForm) {
  toggleForm.addEventListener('click', () => {
    if (loginForm.classList.contains('d-none')) {
      loginForm.classList.remove('d-none')
      registerForm.classList.add('d-none')
      formTitle.textContent = 'Iniciar sesión'
      toggleForm.textContent = '¿No tienes cuenta? Regístrate'
    } else {
      loginForm.classList.add('d-none')
      registerForm.classList.remove('d-none')
      formTitle.textContent = 'Crear cuenta'
      toggleForm.textContent = '¿Ya tienes cuenta? Inicia sesión'
    }
  })
}


// =========================================================
// LOGIN NORMAL (MODIFICADO CON REDIRECCIÓN POR ROL)
// =========================================================
if (loginForm) {
  loginForm.addEventListener('submit', e => {
    e.preventDefault()
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value

    auth.signInWithEmailAndPassword(email, password)
      .then(userCredential => {

        const user = userCredential.user;
        return db.collection('usuarios').doc(user.uid).get();
      })
      .then(doc => {

        if (doc.exists && doc.data().rol === 'administrador') {
          alert('Inicio de sesión como Administrador ✅');
          window.location.href = 'admin-panel.html'; // <-- Redirige al panel de admin
        } else {
          alert('Inicio de sesión exitoso ✅');
          window.location.href = 'index.html'; // <-- Redirige al inicio (clientes)
        }
      })
      .catch(error => alert('Error: ' + error.message));
  });
}

// =========================================================
// REGISTRO DE USUARIO
// =========================================================

if (registerForm) {
  registerForm.addEventListener('submit', e => {
    e.preventDefault()
    const name = document.getElementById('name').value
    const username = document.getElementById('username').value
    const email = document.getElementById('regEmail').value
    const password = document.getElementById('regPassword').value
    
    auth.createUserWithEmailAndPassword(email, password)
      .then(userCredential => {
        const user = userCredential.user
        return user.updateProfile({
          displayName: `${name} (${username})`
        })
        .then(() => user)
      })
      .then(user => {
        return db.collection('usuarios').doc(user.uid).set({
          nombre: name,
          nombreUsuario: username,
          mail: email,
          fechaRegistro: firebase.firestore.FieldValue.serverTimestamp(),
          rol: 'cliente'
        })
      })
       .then(() => {
          alert('Cuenta creada y datos guardados correctamente 🎉')
          window.location.href = 'index.html'
        })
        .catch(error => alert('Error: ' + error.message))
    })
}

// =========================================================
// LOGIN CON GOOGLE (MODIFICADO CON REDIRECCIÓN POR ROL)
// =========================================================
if (googleLogin) {
  googleLogin.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    let user; 

    auth.signInWithPopup(provider)
    .then(result => {
      user = result.user; 
      

      return db.collection('usuarios').doc(user.uid).set({
        nombre: user.displayName,
        email: user.email,
        ultimaConexion: firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

    })
    .then(() => {
     
      return db.collection('usuarios').doc(user.uid).get();
    })
    .then(doc => {

        if (doc.exists && doc.data().rol === 'administrador') {
          alert('Inicio de sesión como Administrador ✅');
          window.location.href = 'admin-panel.html'; // <-- Redirige al panel de admin
        } else {
          alert('Inicio de sesión con Google exitoso ✅');
          window.location.href = 'index.html'; // <-- Redirige al inicio (clientes)
        }
    })
    .catch(error => alert('Error: ' + error.message));
  });
}

// =========================================================
// DETECTAR USUARIO ACTUAL (MODIFICADO PARA ROLES Y REDIRECCIÓN DE BOTÓN)
// =========================================================
auth.onAuthStateChanged(user => {
    // Definiciones de elementos
    const welcomeMessage = document.getElementById('welcomeMessage');
    const loginButton = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Elementos adicionales
    const calendarioLink = document.getElementById('calendarioLink');
    // Asegúrate de que adminPanelBtn en tu HTML sea un <a> o <button>
    // y que tenga un atributo href para la redirección.
    const adminPanelBtn = document.getElementById('adminPanelBtn'); 

    if (welcomeMessage && loginButton && logoutBtn) {

        if (user) { // ¿Está logueado?
            // 1. Mostrar bienvenida y botones básicos
            welcomeMessage.textContent = `👋 Bienvenid@, ${user.displayName || user.email}`;
            loginButton.classList.add('d-none');
            logoutBtn.classList.remove('d-none');
            
            // 2. Ejecutar lógica de base de datos para roles y links específicos
            db.collection('usuarios').doc(user.uid).get().then(doc => {

                // Lógica de Calendario (mostrar link del calendario)
                if (calendarioLink) {
                    calendarioLink.classList.remove('d-none');
                }
                
                // Lógica del Botón de Administración/Calendario
                if (adminPanelBtn) { 
                    // Aseguramos que el botón esté visible por defecto para usuarios logueados
                    adminPanelBtn.classList.remove('d-none'); 

                    if (doc.exists && doc.data().rol === 'administrador') {
                        // ROL ADMINISTRADOR: Cambiar texto y enlace al Panel Admin
                        adminPanelBtn.textContent = 'Panel Admin'; 
                        adminPanelBtn.setAttribute('href', 'admin-panel.html');
                        // OPCIONAL: Añadir una clase para diferenciar (ej: bg-danger)
                        adminPanelBtn.classList.remove('btn-calendario');
                        adminPanelBtn.classList.add('btn-admin');
                        
                    } else {
                        // ROL CLIENTE: Cambiar texto y enlace a Mi Calendario
                        adminPanelBtn.textContent = 'Mi Calendario';
                        adminPanelBtn.setAttribute('href', 'calendarioCliente.html');
                        // OPCIONAL: Añadir una clase para diferenciar (ej: bg-success)
                        adminPanelBtn.classList.remove('btn-admin');
                        adminPanelBtn.classList.add('btn-calendario');
                    }
                }
                
            }).catch(error => {
                console.error("Error al obtener rol o datos del usuario: ", error);
                welcomeMessage.textContent = 'Error al cargar datos.';
            });

        } else { // No está logueado
            welcomeMessage.textContent = '';
            welcomeMessage.classList.add('d-none');
            loginButton.classList.remove('d-none');
            logoutBtn.classList.add('d-none');
            
            // Ocultar links de usuario (Calendario y Admin Panel)
            if (calendarioLink) {
                calendarioLink.classList.add('d-none');
            }
            if (adminPanelBtn) {
                adminPanelBtn.classList.add('d-none'); // Ocultar si no está logueado
            }
        }
    }
});

// =========================================================
// CERRAR SESIÓN
// =========================================================
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    auth.signOut().then(() => {
      alert('Sesión cerrada 👋')
      window.location.href = 'index.html'
    })
  })
}