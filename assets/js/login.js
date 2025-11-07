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

//  Evita inicializar Firebase más de una vez
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
// =========================================================
// REGISTRO DE USUARIO (CORREGIDO)
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
// LOGIN CON GOOGLE
// =========================================================
if (googleLogin) {
  googleLogin.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider()
    auth.signInWithPopup(provider)
    .then(result => {
      const user = result.user
      
      return db.collection('usuarios').doc(user.uid).set({
        nombre: user.displayName, // Nombre de Google
        email: user.email,
        ultimaConexion: firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true }) // <--- IMPORTANTE
    })
    .then(() => {
      alert('Inicio de sesión con Google exitoso y datos sincronizados')
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
      welcomeMessage.textContent = `👋 Bienvenid@, ${user.displayName || user.email}`
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
      window.location.href = 'index.html'
    })
  })
}
