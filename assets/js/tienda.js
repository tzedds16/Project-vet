// Referencias a elementos de control de la interfaz
const loader = document.getElementById('client-loader');
const errorMsg = document.getElementById('client-error');
const productoContainer = document.getElementById("producto-container");
const welcomeMessage = document.getElementById('welcomeMessage');
const logoutBtn = document.getElementById('logoutBtn');
const cartBtn = document.getElementById('cartBtn');
const cartCount = document.getElementById('cartCount');
const notification = document.getElementById('notification');

let esAdmin = false;

// Carrito temporal (no afecta BD hasta confirmar)
let cart = JSON.parse(localStorage.getItem('tempCart')) || [];

function formatearPrecioMX(valor) {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN"
    }).format(Number(valor));
}

// Función para mostrar notificación
function mostrarNotificacion(mensaje, tipo = 'success') {
    notification.textContent = mensaje;
    notification.style.background = tipo === 'error' ? '#dc3545' : '#28a745';
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Función para actualizar contador del carrito
function actualizarContadorCarrito() {
    const user = auth.currentUser;
    if (!user) {
        if (cartCount) cartCount.textContent = '0';
        return;
    }
    
    // Solo contar items del usuario actual
    const carritoUsuario = cart.filter(item => item.usuarioId === user.uid);
    const totalItems = carritoUsuario.reduce((total, item) => total + item.cantidad, 0);
    
    if (cartCount) {
        cartCount.textContent = totalItems;
    }
}

// Función para obtener clase de stock según cantidad
function obtenerClaseStock(cantidad) {
    if (cantidad === 0) return 'stock-low';
    if (cantidad < 5) return 'stock-medium';
    return 'stock-high';
}

// Sincronizar carrito temporal al cargar la tienda
function sincronizarCarritoTemporal(usuarioId) {
    // Filtrar solo los items del usuario actual
    const carritoUsuario = cart.filter(item => item.usuarioId === usuarioId);
    
    // Actualizar el carrito temporal con solo los items del usuario
    cart = carritoUsuario;
    localStorage.setItem('tempCart', JSON.stringify(cart));
    actualizarContadorCarrito();
}

// Lógica de Autenticación y Carga de Productos
// Iniciar mostrando el loader principal
loader.style.display = 'block';
productoContainer.innerHTML = '';
errorMsg.style.display = 'none';

let productosGlobal = []; // Aquí se guardan todos los productos

function renderProductos(lista) {
    productoContainer.innerHTML = "";

    if (lista.length === 0) {
        productoContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-search display-1 text-muted"></i>
                <h4 class="mt-3 text-muted">No hay productos en esta categoría</h4>
                <p class="text-muted">Intenta con otra categoría o vuelve más tarde</p>
            </div>
        `;
        return;
    }

    lista.forEach(producto => {
        const stockClass = obtenerClaseStock(producto.cantidad);
        const user = auth.currentUser;
        const carritoUsuario = user ? cart.filter(item => item.usuarioId === user.uid) : [];
        const itemEnCarrito = carritoUsuario.find(item => item.productoId === producto.id);
        const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.cantidad : 0;
        
        const botonHTML = esAdmin
            ? `<a href="admin-panel.html?id=${producto.id}" class="btn btn-warning mt-2">
                   <i class="bi bi-pencil-square me-2"></i> Editar
               </a>`
            : `
            <div class="producto-controls">
                <div class="stock-info">
                    <span class="stock-label">Disponibles:</span>
                    <span class="stock-count ${stockClass}" data-product-id="${producto.id}">
                        ${producto.cantidad}
                    </span>
                    ${cantidadEnCarrito > 0 ? 
                        `<small class="text-info d-block mt-1">
                            <i class="bi bi-cart-check me-1"></i>En tu carrito: ${cantidadEnCarrito}
                        </small>` : ''
                    }
                </div>
                <div class="quantity-selector">
                    <button class="qty-btn minus" data-id="${producto.id}">-</button>
                    <input type="number" class="qty-input" value="1" min="1" max="${producto.cantidad}" 
                           data-id="${producto.id}">
                    <button class="qty-btn plus" data-id="${producto.id}">+</button>
                </div>
                <button class="btn btn-tienda add-to-cart-btn" 
                        data-id="${producto.id}"
                        data-nombre="${producto.nombre}"
                        data-precio="${producto.precio}"
                        data-imagen="${producto.imagenURL}"
                        ${producto.cantidad === 0 ? 'disabled' : ''}>
                    <i class="bi bi-cart-plus me-2"></i> 
                    ${producto.cantidad === 0 ? 'Sin Stock' : 'Añadir al Carrito'}
                </button>
            </div>
            `;

        const card = `
            <div class="col-12 col-sm-6 col-md-4 col-lg-3">
                <div class="card h-100 shadow-sm border-0 producto-card">
                    <div class="card-img-top-container d-flex justify-content-center align-items-center p-3">
                        <img src="${producto.imagenURL}" class="card-img-top-custom" alt="${producto.nombre}"
                             style="max-height: 180px; object-fit: cover;">
                    </div>

                    <div class="card-body text-center d-flex flex-column">  
                        <span class="badge bg-light text-dark mb-2">${producto.categoria}</span>
                        <h5 class="fw-bold mt-2 mb-auto">${producto.nombre}</h5> 
                        <p class="text-muted mb-2 small">${producto.descripcion}</p>
                        <p class="fw-bold text-success fs-5 mb-3">${formatearPrecioMX(producto.precio)}</p>
                        ${botonHTML}
                    </div>
                </div>
            </div>
        `;

        productoContainer.innerHTML += card;
    });

    // Configurar event listeners para los controles de cantidad
    if (!esAdmin) {
        configurarControlesCantidad();
    }
}

// Configurar event listeners para controles de cantidad
function configurarControlesCantidad() {
    // Botones de incremento
    document.querySelectorAll('.qty-btn.plus').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.dataset.id;
            const input = document.querySelector(`.qty-input[data-id="${productId}"]`);
            const max = parseInt(input.max);
            const currentValue = parseInt(input.value);
            
            if (currentValue < max) {
                input.value = currentValue + 1;
            } else {
                mostrarNotificacion('No hay más stock disponible', 'error');
            }
        });
    });

    // Botones de decremento
    document.querySelectorAll('.qty-btn.minus').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.dataset.id;
            const input = document.querySelector(`.qty-input[data-id="${productId}"]`);
            const currentValue = parseInt(input.value);
            
            if (currentValue > 1) {
                input.value = currentValue - 1;
            }
        });
    });

    // Input manual
    document.querySelectorAll('.qty-input').forEach(input => {
        input.addEventListener('change', function() {
            const productId = this.dataset.id;
            const max = parseInt(this.max);
            const value = parseInt(this.value);
            
            if (value < 1) {
                this.value = 1;
            } else if (value > max) {
                this.value = max;
                mostrarNotificacion('No hay suficiente stock disponible', 'error');
            }
        });
    });

    // Botones de añadir al carrito
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.disabled) return;
            
            const productId = this.dataset.id;
            const nombre = this.dataset.nombre;
            const precio = parseFloat(this.dataset.precio);
            const imagen = this.dataset.imagen;
            const cantidad = parseInt(document.querySelector(`.qty-input[data-id="${productId}"]`).value);
            
            agregarAlCarrito(productId, nombre, precio, imagen, cantidad);
        });
    });
}

// Función modificada para usar carrito temporal
async function agregarAlCarrito(idProducto, nombre, precio, imagen, cantidad = 1) {
    const user = auth.currentUser; 
    if (!user) {
        mostrarNotificacion('Debes iniciar sesión para comprar', 'error');
        return;
    }

    const productoEncontrado = productosGlobal.find(p => p.id === idProducto);
    
    if (!productoEncontrado) {
        mostrarNotificacion('Producto no encontrado', 'error');
        return;
    }

    // Validación para el stock
    if (productoEncontrado.cantidad <= 0) {
        mostrarNotificacion('Lo sentimos, este producto está agotado', 'error');
        return;
    }

    // Solo considerar items del usuario actual en el carrito temporal
    const carritoUsuario = cart.filter(item => item.usuarioId === user.uid);
    const itemExistente = carritoUsuario.find(item => item.productoId === idProducto);
    
    const cantidadEnCarrito = itemExistente ? itemExistente.cantidad : 0;
    const cantidadTotalSolicitada = cantidadEnCarrito + cantidad;

    if (cantidadTotalSolicitada > productoEncontrado.cantidad) {
        mostrarNotificacion(`No puedes agregar ${cantidad} unidades. ${cantidadEnCarrito > 0 ? `Ya tienes ${cantidadEnCarrito} en el carrito. ` : ''}Stock total disponible: ${productoEncontrado.cantidad}`, 'error');
        return;
    }

    try {
        if (itemExistente) {
            // Actualizar cantidad existente en el carrito temporal
            const itemIndex = cart.findIndex(item => 
                item.productoId === idProducto && item.usuarioId === user.uid
            );
            if (itemIndex !== -1) {
                cart[itemIndex].cantidad = cantidadTotalSolicitada;
                cart[itemIndex].fecha = new Date().toISOString();
            }
        } else {
            // Agregar nuevo item al carrito temporal
            cart.push({
                usuarioId: user.uid,
                productoId: idProducto,
                nombre: nombre,
                precio: precio,
                imagenURL: imagen,
                cantidad: cantidad,
                fecha: new Date().toISOString()
            });
        }
        
        // Guardar en localStorage
        localStorage.setItem('tempCart', JSON.stringify(cart));
        actualizarContadorCarrito();
        mostrarNotificacion(`✅ ${nombre} (${cantidad}) agregado al carrito`);
        
        // Resetear cantidad a 1 y actualizar la vista
        const input = document.querySelector(`.qty-input[data-id="${idProducto}"]`);
        if (input) input.value = 1;
        
        // Recargar productos para actualizar el indicador "En tu carrito"
        renderProductos(productosGlobal);
        
    } catch (error) {
        console.error("Error en el carrito:", error);
        mostrarNotificacion("Error al procesar la solicitud.", 'error');
    }
}

// Función para limpiar carrito temporal (útil para debugging)
function limpiarCarritoTemporal() {
    const user = auth.currentUser;
    if (user && confirm('¿Limpiar todo el carrito temporal?')) {
        cart = cart.filter(item => item.usuarioId !== user.uid);
        localStorage.setItem('tempCart', JSON.stringify(cart));
        actualizarContadorCarrito();
        renderProductos(productosGlobal);
        mostrarNotificacion('Carrito temporal limpiado');
    }
}

auth.onAuthStateChanged(async user => {
    // Lógica de UI de Autenticación
    if (user) {
        // USUARIO CONECTADO
        welcomeMessage.textContent = `👋 Bienvenid@, ${user.displayName || user.email}`;
        logoutBtn.classList.remove('d-none');
        cartBtn.classList.remove('d-none');
        errorMsg.style.display = 'none';
        
        // Sincronizar y actualizar contador del carrito
        sincronizarCarritoTemporal(user.uid);
        actualizarContadorCarrito();
        
        // Lógica para Identificar Admin y cambiar botón
        try {
            // 1.Obtener el documento del usuario desde Firestore usando el UID
            const userDoc = await db.collection('usuarios').doc(user.uid).get();
            
            if (userDoc.exists && userDoc.data().rol === 'administrador') { 
                // Si es ADMIN, cambiar el texto y el enlace del botón
                cartBtn.innerHTML = '<i class="bi bi-gear-fill me-1"></i> Panel Admin';
                cartBtn.href = 'admin-panel.html';
                cartBtn.classList.remove('btn-warning');
                cartBtn.classList.add('btn-info');
                esAdmin = true; 
            } else {
                //Si es CLIENTE, asegurar que diga "Mi carrito"
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
        //USUARIO DESCONECTADO
        welcomeMessage.textContent = '';
        logoutBtn.classList.add('d-none');
        cartBtn.classList.add('d-none');
        
        //MOSTRAR EL MENSAJE DE AVISO
        errorMsg.style.display = 'block';
        errorMsg.innerHTML = `
            <div class="text-center">
                <i class="bi bi-exclamation-triangle display-4 text-warning mb-3"></i>
                <p class="mb-2 fs-5">No has iniciado sesión</p>
                <p class="text-muted mb-4">Si deseas comprar o ver tu carrito, inicia sesión</p>
                <button id="goLoginBtn" class="btn btn-primary btn-lg me-2">Iniciar sesión</button>
                <button id="continueBtn" class="btn btn-outline-secondary btn-lg">Seguir explorando</button>
            </div>
        `;

        //Botón para ir al login
        document.getElementById('goLoginBtn').addEventListener('click', () => {
            window.location.href = 'login.html';
        });

        //Botón para continuar sin login (solo oculta el aviso)
        document.getElementById('continueBtn').addEventListener('click', () => {
            errorMsg.style.display = 'none';
        });
    }

    //Lógica de Carga de Productos (Se ejecuta independientemente del login)
    try {
        const snapshot = await db.collection("productos").get();

        if (snapshot.empty) {
            productoContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-inbox display-1 text-muted"></i>
                    <h4 class="mt-3 text-muted">No hay productos disponibles</h4>
                    <p class="text-muted">Vuelve más tarde para ver nuestro catálogo</p>
                </div>`;
            return;
        }

        productoContainer.innerHTML = ""; // limpiar contenedor

        productosGlobal = []; // limpiar por si acaso
        snapshot.forEach(doc => {
            productosGlobal.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Mostrar todos los productos inicialmente
        renderProductos(productosGlobal);

    } catch (error) {
        console.error("Error al cargar productos:", error);
        errorMsg.style.display = "block";
        errorMsg.innerHTML = `
            <div class="text-center">
                <i class="bi bi-x-circle display-4 text-danger mb-3"></i>
                <h4 class="text-danger">Error al cargar los productos</h4>
                <p class="text-muted">Intenta recargar la página o vuelve más tarde</p>
                <button onclick="window.location.reload()" class="btn btn-outline-primary">
                    <i class="bi bi-arrow-clockwise me-2"></i>Recargar página
                </button>
            </div>
        `;
    } finally {
        //Ocultar el loader cuando la carga haya terminado.
        loader.style.display = "none";
    }

    //Filtros por categoría
    document.getElementById("pills-todos-tab").addEventListener("click", () => {
        renderProductos(productosGlobal);
    });

    document.getElementById("pills-alimento-tab").addEventListener("click", () => {
        const filtrados = productosGlobal.filter(p => p.categoria === "Alimento");
        renderProductos(filtrados);
    });

    document.getElementById("pills-juguetes-tab").addEventListener("click", () => {
        const filtrados = productosGlobal.filter(p => p.categoria === "Juguetes");
        renderProductos(filtrados);
    });

    document.getElementById("pills-higiene-tab").addEventListener("click", () => {
        const filtrados = productosGlobal.filter(p => p.categoria === "Higiene");
        renderProductos(filtrados);
    });

    document.getElementById("pills-accesorios-tab").addEventListener("click", () => {
        const filtrados = productosGlobal.filter(p => p.categoria === "Accesorios");
        renderProductos(filtrados);
    });
});

// Inicializar contador del carrito al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    actualizarContadorCarrito();
});

// Para debugging: agregar esta función al console si es necesario
// limpiarCarritoTemporal();