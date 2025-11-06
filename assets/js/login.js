/*
// =========================================================
// CONFIGURACIÓN DE FIREBASE
// =========================================================
const firebaseConfig = {
  apiKey: "AIzaSyDtMue0tHhYAnMX2gxZeNHyovYZI1NQgws",
  authDomain: "edds-aplicaciones-ad2025.firebaseapp.com",
  projectId: "edds-aplicaciones-ad2025",
  storageBucket: "edds-aplicaciones-ad2025.firebasestorage.app",
  messagingSenderId: "891364040951",
  appId: "1:891364040951:web:4fb519d171863c30f533f2",
  measurementId: "G-SSB0V7BKKG"
}

//  Evita inicializar Firebase más de una vez
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig)
}

const auth = firebase.auth()

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
// LOGIN NORMAL
// =========================================================
if (loginForm) {
  loginForm.addEventListener('submit', e => {
    e.preventDefault()
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value

    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        alert('Inicio de sesión exitoso ✅')
        window.location.href = 'index.html'
      })
      .catch(error => alert('Error: ' + error.message))
  })
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
      })
      .then(() => {
        alert('Cuenta creada correctamente 🎉')
        window.location.href = 'index.html'
      })
      .catch(error => alert('Error: ' + error.message))
  })
}

// =========================================================
// LOGIN CON GOOGLE
// =========================================================
if (googleLogin) {
  googleLogin.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider()
    auth.signInWithPopup(provider)
      .then(() => {
        alert('Inicio de sesión con Google exitoso')
        window.location.href = 'index.html'
      })
      .catch(error => alert('Error: ' + error.message))
  })
}

// =========================================================
// DETECTAR USUARIO ACTUAL (para index.html)
// =========================================================
auth.onAuthStateChanged(user => {
  if (welcomeMessage && loginButton && logoutBtn) {
    if (user) {
      // Mostrar bienvenida y botón de cerrar sesión
      welcomeMessage.textContent = `👋 Bienvenido, ${user.displayName || user.email}`
      loginButton.classList.add('d-none')
      logoutBtn.classList.remove('d-none')
    } else {
      // Mostrar botón de login
      welcomeMessage.textContent = ''
      loginButton.classList.remove('d-none')
      logoutBtn.classList.add('d-none')
    }
  }
})

// =========================================================
// CERRAR SESIÓN
// =========================================================
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    auth.signOut().then(() => {
      alert('Sesión cerrada 👋')
      window.location.href = 'login.html'
    })
  })
}
*/
