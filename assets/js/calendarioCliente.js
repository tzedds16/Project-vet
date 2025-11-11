const firebaseConfig = {
    apiKey: "AIzaSyCb7ka8ExRoYk6YykUpKKVMvoKk_JfP2ko",
    authDomain: "petcare-4a63f.firebaseapp.com",
    projectId: "petcare-4a63f",
    storageBucket: "petcare-4a63f.firebasestorage.app",
    messagingSenderId: "443204856539",
    appId: "1:443204856539:web:9f7362bd4a5a468ce27afe",
    measurementId: "G-GSYEF3PB7K"
};

// Inicializa Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const welcomeMessage = document.getElementById('welcomeMessage');

// ** FUNCIÓN DE PROTECCIÓN DE RUTA **
auth.onAuthStateChanged(user => {
    if (user) {
        welcomeMessage.textContent = `👋 Bienvenid@, ${user.displayName || user.email}`
        welcomeMessage.classList.remove('d-none');
    } else {
        console.log("Acceso denegado. Redirigiendo al login.");
        window.location.href = "index.html";
    }
});