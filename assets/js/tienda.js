// Referencias a elementos de control de la interfaz
const loader = document.getElementById('client-loader');
const errorMsg = document.getElementById('client-error');
const productoContainer = document.getElementById("producto-container");
const welcomeMessage = document.getElementById('welcomeMessage');
const logoutBtn = document.getElementById('logoutBtn');
const cartBtn = document.getElementById('cartBtn'); // Este es el elemento que cambia
let esAdmin = false;


function formatearPrecioMX(valor) {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN"
    }).format(Number(valor));
}

// ----------------------------------------------------
// Lógica de Autenticación y Carga de Productos
// ----------------------------------------------------

// Iniciar mostrando el loader principal
loader.style.display = 'block';
productoContainer.innerHTML = '';
errorMsg.style.display = 'none';

auth.onAuthStateChanged(async user => {
    // 1. Lógica de UI de Autenticación
    if (user) {
        // ✅ USUARIO CONECTADO
        welcomeMessage.textContent = `👋 Bienvenid@, ${user.displayName || user.email}`;
        logoutBtn.classList.remove('d-none');
        cartBtn.classList.remove('d-none');
        errorMsg.style.display = 'none';
        
        // Lógica para Identificar Admin y cambiar botón
        try {
            // 1. Obtener el documento del usuario desde Firestore usando el UID
            const userDoc = await db.collection('usuarios').doc(user.uid).get();
            
            if (userDoc.exists && userDoc.data().rol === 'administrador') { 
                // Si es ADMIN, cambiar el texto y el enlace del botón
                cartBtn.innerHTML = 'Panel Admin';
                cartBtn.href = 'admin-panel.html';
                esAdmin = true; 
            } else {
                // Si es CLIENTE, asegurar que diga "Mi carrito"
                cartBtn.innerHTML = '<i class="bi bi-cart-fill me-1"></i> Mi carrito';
                cartBtn.href = 'carrito.html';
                cartBtn.classList.add('btn-warning');
                cartBtn.classList.remove('btn-info');
                esAdmin = false;
            }
        } catch (error) {
            console.error("Error al verificar rol de usuario:", error);
            cartBtn.innerHTML = '<i class="bi bi-cart-fill me-1"></i> Mi carrito'; 
            cartBtn.href = 'carrito.html';
        }
        
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                window.location.href = 'index.html';
            });
        });

    } else {
        // ❌ USUARIO DESCONECTADO
        welcomeMessage.textContent = '';
        logoutBtn.classList.add('d-none');
        cartBtn.classList.add('d-none');
        
        // MOSTRAR EL MENSAJE DE AVISO
        errorMsg.style.display = 'block';
        errorMsg.innerHTML = `
            <p class="mb-2">No has iniciado sesión. Si deseas comprar o ver tu carrito, inicia sesión.</p>
            <button id="goLoginBtn" class="btn btn-primary btn-sm me-2">Iniciar sesión</button>
            <button id="continueBtn" class="btn btn-secondary btn-sm">Seguir explorando</button>
        `;

        // Botón para ir al login
        document.getElementById('goLoginBtn').addEventListener('click', () => {
            window.location.href = 'login.html';
        });

        // Botón para continuar sin login (solo oculta el aviso)
        document.getElementById('continueBtn').addEventListener('click', () => {
            errorMsg.style.display = 'none';
        });
    }

    // 2. Lógica de Carga de Productos (Se ejecuta independientemente del login)
    try {
        const snapshot = await db.collection("productos").get();

        if (snapshot.empty) {
            productoContainer.innerHTML = `
                <p class="text-center text-muted">No hay productos disponibles.</p>`;
            return;
        }

        productoContainer.innerHTML = ""; // limpiar contenedor

        snapshot.forEach(doc => {
            const producto = doc.data();
            
            if (esAdmin) {
                botonHTML = `
                    <a href="admin-panel.html?id=${doc.id}" class="btn btn-warning mt-2">
                        <i class="bi bi-pencil-square me-2"></i> Editar
                    </a>`;
            } else {
                botonHTML = `
                    <button class="btn btn-tienda mt-2">
                        <i class="bi bi-cart-plus me-2"></i> Añadir al carrito
                    </button>
                    `;
            }
            // Usando la estructura de tarjeta alineada
            const card = `
                <div class="col-12 col-sm-6 col-md-4 col-lg-3">
                    <div class="card h-100 shadow-sm border-0">
                        
                        <div class="card-img-top-container d-flex justify-content-center align-items-center p-3">
                            <img src="${producto.imagenURL}" 
                                class="card-img-top-custom" 
                                alt="${producto.nombre}">
                        </div>

                        <div class="card-body text-center d-flex flex-column">  
                            <p class="text-muted fst-italic">${producto.categoria}</p> 
                            <h5 class="fw-bold mt-2 mb-auto">${producto.nombre}</h5> 
                            <p class="text-muted mb-2">${producto.descripcion}</p>
                            <p class="fw-bold text-success fs-5">${formatearPrecioMX(producto.precio)}</p>
                            ${botonHTML}
                        </div>
                    </div>
                </div>
            `;
            productoContainer.innerHTML += card;
        });

    } catch (error) {
        console.error("Error al cargar productos:", error);
        errorMsg.style.display = "block";
        errorMsg.textContent = "Error al cargar los productos.";
    } finally {
        // 3. Ocultar el loader cuando la carga haya terminado.
        loader.style.display = "none";
    }
});