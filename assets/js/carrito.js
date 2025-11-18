 const firebaseConfig = {
            apiKey: "AIzaSyCb7ka8ExRoYk6YykUpKKVMvoKk_JfP2ko",
            authDomain: "petcare-4a63f.firebaseapp.com",
            projectId: "petcare-4a63f",
            storageBucket: "petcare-4a63f.firebasestorage.app",
            messagingSenderId: "443204856539",
            appId: "1:443204856539:web:9f7362bd4a5a468ce27afe",
            measurementId: "G-GSYEF3PB7K"
        };
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const loader = document.getElementById('carrito-loader');
const contenedorItems = document.getElementById('carrito-items-container');
const textoTotal = document.getElementById('total-precio');
const textoSubtotal = document.getElementById('subtotal-precio');

auth.onAuthStateChanged(user => {
    if (user) {
        cargarCarrito(user.uid);
    } else {
        window.location.href = 'login.html';
    }
});

function cargarCarrito(usuarioId) {
    db.collection('carrito')
    .where('usuarioId', '==', usuarioId)
    .onSnapshot((snapshot)=> {
        contenedorItems.innerHTML = '';
        let totalCalculado = 0;

        loader.style.display = 'none';   // Oculta el spinner

        if (snapshot.empty) {
                contenedorItems.innerHTML = `
                    <div class="text-center py-5">
                        <i class="bi bi-cart-x display-1 text-muted"></i>
                        <h3 class="mt-3 text-muted">Tu carrito está vacío</h3>
                        <a href="tienda.html" class="btn btn-primary mt-3 rounded-pill">Ir a la tienda</a>
                    </div>
                `;
                actualizarTotales(0);
                return;
            }
        
        snapshot.forEach(doc => {
            const item = doc.data()// Datos: nombre, precio, imagen etc
            const idDocumento = doc.id;
            totalCalculado += (item.precio * item.cantidad);

            const cardHTML = `
                    <div class="card shadow-sm border-0 rounded-3">
                        <div class="card-body d-flex align-items-center gap-3">
                            
                            <img src="${item.imagenURL}" alt="${item.nombre}" 
                                 style="width: 80px; height: 80px; object-fit: cover; border-radius: 10px;">
                            
                            <div class="flex-grow-1">
                                <h5 class="mb-0 fw-bold">${item.nombre}</h5>
                                <p class="text-muted mb-0">$${item.precio} MXN</p>
                            </div>

                            <div class="d-flex align-items-center bg-light rounded-pill px-2 border">
                                <span class="fw-bold px-2">${item.cantidad}</span>
                            </div>

                            <button class="btn btn-outline-danger btn-sm rounded-circle" 
                                    onclick="borrarItem('${idDocumento}')">
                                <i class="bi bi-trash-fill"></i>
                            </button>
                        </div>
                    </div>
                `;

                contenedorItems.innerHTML += cardHTML;
        })
        actualizarTotales(totalCalculado);
    })
}

function actualizarTotales(total) {
    const formatoMoneda = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
    textoTotal.textContent = formatoMoneda.format(total);
    textoSubtotal.textContent = formatoMoneda.format(total);
}



function borrarItem(id) {
        db.collection('carrito').doc(id).delete();
}

