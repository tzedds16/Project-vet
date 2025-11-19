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
const confirmarCompraBtn = document.getElementById('confirmar-compra-btn');

// Carrito temporal (combinación de localStorage y BD)
let cart = JSON.parse(localStorage.getItem('tempCart')) || [];
let productosGlobal = [];

// Estilos CSS para controles de cantidad
const styles = `
    .quantity-controls {
        display: flex;
        align-items: center;
        margin: 10px 0;
    }
    
    .qty-btn {
        width: 35px;
        height: 35px;
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
    }
    
    .qty-btn:hover {
        background: #e9ecef;
    }
    
    .qty-btn:disabled {
        background: #f8f9fa;
        cursor: not-allowed;
        opacity: 0.6;
    }
    
    .qty-input {
        width: 60px;
        height: 35px;
        text-align: center;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        margin: 0 5px;
    }
    
    .item-total {
        font-weight: bold;
        color: #28a745;
        font-size: 1.1rem;
    }
    
    .stock-info {
        font-size: 0.85rem;
        color: #6c757d;
    }
    
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        transform: translateX(150%);
        transition: transform 0.3s ease;
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification.error {
        background: #dc3545;
    }
    
    .empty-cart-icon {
        font-size: 4rem;
        color: #6c757d;
        margin-bottom: 1rem;
    }
`;

// Añadir estilos al documento
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

// Crear elemento de notificación
const notification = document.createElement('div');
notification.className = 'notification';
document.body.appendChild(notification);

function mostrarNotificacion(mensaje, tipo = 'success') {
    notification.textContent = mensaje;
    notification.className = `notification ${tipo === 'error' ? 'error' : ''}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

auth.onAuthStateChanged(async user => {
    if (user) {
        await cargarProductosGlobales();
        cargarCarritoCombinado(user.uid);
        
        // Configurar evento para confirmar compra
        if (confirmarCompraBtn) {
            confirmarCompraBtn.addEventListener('click', () => confirmarCompra(user.uid));
        }
    } else {
        window.location.href = 'login.html';
    }
});

// Cargar productos globales para verificar stock
async function cargarProductosGlobales() {
    try {
        const snapshot = await db.collection("productos").get();
        productosGlobal = [];
        snapshot.forEach(doc => {
            productosGlobal.push({
                id: doc.id,
                ...doc.data()
            });
        });
        console.log('Productos cargados:', productosGlobal.length); // Para debugging
    } catch (error) {
        console.error("Error al cargar productos:", error);
        mostrarNotificacion('Error al cargar información de productos', 'error');
    }
}

function cargarCarritoCombinado(usuarioId) {
    // Primero cargar desde BD (carrito persistente)
    db.collection('carrito')
    .where('usuarioId', '==', usuarioId)
    .onSnapshot((snapshot) => {
        contenedorItems.innerHTML = '';
        let totalCalculado = 0;
        loader.style.display = 'none';

        // Combinar carrito de BD con carrito temporal del usuario actual
        const itemsCombinados = [];
        const userTempCart = cart.filter(item => item.usuarioId === usuarioId);
        
        // Agregar items de BD
        snapshot.forEach(doc => {
            itemsCombinados.push({
                ...doc.data(),
                idDocumento: doc.id,
                origen: 'bd'
            });
        });

        // Agregar items temporales del usuario actual
        userTempCart.forEach(item => {
            itemsCombinados.push({
                ...item,
                idDocumento: null,
                origen: 'temporal'
            });
        });

        if (itemsCombinados.length === 0) {
            contenedorItems.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-cart-x empty-cart-icon"></i>
                    <h3 class="mt-3 text-muted">Tu carrito está vacío</h3>
                    <p class="text-muted mb-4">Agrega algunos productos para continuar</p>
                    <a href="tienda.html" class="btn btn-primary mt-3 rounded-pill">
                        <i class="bi bi-bag me-2"></i>Ir a la tienda
                    </a>
                </div>
            `;
            actualizarTotales(0);
            return;
        }

        // Renderizar items combinados
        itemsCombinados.forEach(item => {
            const producto = productosGlobal.find(p => p.id === item.productoId);
            const stockDisponible = producto ? producto.cantidad : 0;
            const itemTotal = item.precio * item.cantidad;
            totalCalculado += itemTotal;

            const cardHTML = `
                <div class="card shadow-sm border-0 rounded-3 mb-3 card-hover">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-2">
                                <img src="${item.imagenURL}" alt="${item.nombre}" 
                                     class="img-fluid rounded" style="max-height: 100px; object-fit: cover;">
                            </div>
                            
                            <div class="col-md-4">
                                <h5 class="fw-bold mb-1">${item.nombre}</h5>
                                <p class="text-muted mb-1">${formatearPrecio(item.precio)}</p>
                                <small class="stock-info">
                                    <i class="bi bi-box-seam me-1"></i>Stock disponible: ${stockDisponible}
                                </small>
                            </div>

                            <div class="col-md-3">
                                <div class="quantity-controls justify-content-center">
                                    <button class="qty-btn minus" data-id="${item.productoId}" data-origen="${item.origen}" data-docid="${item.idDocumento}"
                                            ${item.cantidad <= 1 ? 'disabled' : ''}>
                                        <i class="bi bi-dash"></i>
                                    </button>
                                    <input type="number" class="qty-input" 
                                           value="${item.cantidad}" 
                                           min="1" 
                                           max="${stockDisponible}"
                                           data-id="${item.productoId}" 
                                           data-origen="${item.origen}" 
                                           data-docid="${item.idDocumento}">
                                    <button class="qty-btn plus" data-id="${item.productoId}" data-origen="${item.origen}" data-docid="${item.idDocumento}"
                                            ${item.cantidad >= stockDisponible ? 'disabled' : ''}>
                                        <i class="bi bi-plus"></i>
                                    </button>
                                </div>
                            </div>

                            <div class="col-md-2 text-center">
                                <div class="item-total">${formatearPrecio(itemTotal)}</div>
                            </div>

                            <div class="col-md-1 text-end">
                                <button class="btn btn-outline-danger btn-sm rounded-circle" 
                                        onclick="borrarItem('${item.productoId}', '${item.origen}', '${item.idDocumento}')">
                                    <i class="bi bi-trash-fill"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            contenedorItems.innerHTML += cardHTML;
        });

        actualizarTotales(totalCalculado);
        configurarControlesCarrito(usuarioId);
    });
}

function configurarControlesCarrito(usuarioId) {
    // Botones de decremento
    document.querySelectorAll('.qty-btn.minus').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.dataset.id;
            const origen = this.dataset.origen;
            const docId = this.dataset.docid;
            disminuirCantidad(productId, origen, docId, usuarioId);
        });
    });

    // Botones de incremento
    document.querySelectorAll('.qty-btn.plus').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.dataset.id;
            const origen = this.dataset.origen;
            const docId = this.dataset.docid;
            aumentarCantidad(productId, origen, docId, usuarioId);
        });
    });

    // Inputs manuales
    document.querySelectorAll('.qty-input').forEach(input => {
        input.addEventListener('change', function() {
            const productId = this.dataset.id;
            const origen = this.dataset.origen;
            const docId = this.dataset.docid;
            const nuevaCantidad = parseInt(this.value);
            cambiarCantidad(productId, origen, docId, nuevaCantidad, usuarioId);
        });
    });
}

async function disminuirCantidad(productId, origen, docId, usuarioId) {
    try {
        if (origen === 'bd') {
            // Actualizar en BD
            const doc = await db.collection('carrito').doc(docId).get();
            const data = doc.data();
            if (data.cantidad > 1) {
                await db.collection('carrito').doc(docId).update({
                    cantidad: data.cantidad - 1
                });
                mostrarNotificacion('Cantidad actualizada');
            }
        } else {
            // Actualizar en carrito temporal
            const itemIndex = cart.findIndex(item => 
                item.productoId === productId && item.usuarioId === usuarioId
            );
            if (itemIndex !== -1 && cart[itemIndex].cantidad > 1) {
                cart[itemIndex].cantidad -= 1;
                localStorage.setItem('tempCart', JSON.stringify(cart));
                cargarCarritoCombinado(usuarioId);
                mostrarNotificacion('Cantidad actualizada');
            }
        }
    } catch (error) {
        console.error("Error al disminuir cantidad:", error);
        mostrarNotificacion('Error al actualizar cantidad', 'error');
    }
}

async function aumentarCantidad(productId, origen, docId, usuarioId) {
    try {
        const producto = productosGlobal.find(p => p.id === productId);
        if (!producto) return;

        if (origen === 'bd') {
            // Actualizar en BD
            const doc = await db.collection('carrito').doc(docId).get();
            const data = doc.data();
            if (data.cantidad < producto.cantidad) {
                await db.collection('carrito').doc(docId).update({
                    cantidad: data.cantidad + 1
                });
                mostrarNotificacion('Cantidad actualizada');
            } else {
                mostrarNotificacion('No hay más stock disponible', 'error');
            }
        } else {
            // Actualizar en carrito temporal
            const itemIndex = cart.findIndex(item => 
                item.productoId === productId && item.usuarioId === usuarioId
            );
            if (itemIndex !== -1 && cart[itemIndex].cantidad < producto.cantidad) {
                cart[itemIndex].cantidad += 1;
                localStorage.setItem('tempCart', JSON.stringify(cart));
                cargarCarritoCombinado(usuarioId);
                mostrarNotificacion('Cantidad actualizada');
            } else {
                mostrarNotificacion('No hay más stock disponible', 'error');
            }
        }
    } catch (error) {
        console.error("Error al aumentar cantidad:", error);
        mostrarNotificacion('Error al actualizar cantidad', 'error');
    }
}

async function cambiarCantidad(productId, origen, docId, nuevaCantidad, usuarioId) {
    try {
        const producto = productosGlobal.find(p => p.id === productId);
        if (!producto) return;

        if (nuevaCantidad < 1) {
            mostrarNotificacion('La cantidad debe ser al menos 1', 'error');
            cargarCarritoCombinado(usuarioId);
            return;
        }

        if (nuevaCantidad > producto.cantidad) {
            mostrarNotificacion(`Solo hay ${producto.cantidad} unidades disponibles`, 'error');
            cargarCarritoCombinado(usuarioId);
            return;
        }

        if (origen === 'bd') {
            // Actualizar en BD
            await db.collection('carrito').doc(docId).update({
                cantidad: nuevaCantidad
            });
            mostrarNotificacion('Cantidad actualizada');
        } else {
            // Actualizar en carrito temporal
            const itemIndex = cart.findIndex(item => 
                item.productoId === productId && item.usuarioId === usuarioId
            );
            if (itemIndex !== -1) {
                cart[itemIndex].cantidad = nuevaCantidad;
                localStorage.setItem('tempCart', JSON.stringify(cart));
                cargarCarritoCombinado(usuarioId);
                mostrarNotificacion('Cantidad actualizada');
            }
        }
    } catch (error) {
        console.error("Error al cambiar cantidad:", error);
        mostrarNotificacion('Error al actualizar cantidad', 'error');
    }
}

async function borrarItem(productId, origen, docId) {
    const user = auth.currentUser;
    if (!user) return;

    if (confirm('¿Estás seguro de que quieres eliminar este producto del carrito?')) {
        try {
            if (origen === 'bd') {
                // Eliminar de BD
                await db.collection('carrito').doc(docId).delete();
                mostrarNotificacion('Producto eliminado del carrito');
            } else {
                // Eliminar de carrito temporal
                const initialLength = cart.length;
                cart = cart.filter(item => 
                    !(item.productoId === productId && item.usuarioId === user.uid)
                );
                
                if (cart.length < initialLength) {
                    localStorage.setItem('tempCart', JSON.stringify(cart));
                    cargarCarritoCombinado(user.uid);
                    mostrarNotificacion('Producto eliminado del carrito');
                }
            }
        } catch (error) {
            console.error("Error al eliminar item:", error);
            mostrarNotificacion('Error al eliminar producto', 'error');
        }
    }
}

async function confirmarCompra(usuarioId) {
    const user = auth.currentUser;
    if (!user) return;

    try {
        // Verificar stock antes de confirmar
        const itemsCombinados = [];
        
        // Obtener items de BD
        const snapshot = await db.collection('carrito')
            .where('usuarioId', '==', usuarioId)
            .get();
        
        snapshot.forEach(doc => {
            itemsCombinados.push({
                ...doc.data(),
                idDocumento: doc.id,
                origen: 'bd'
            });
        });

        // Obtener items temporales
        const userTempCart = cart.filter(item => item.usuarioId === usuarioId);
        userTempCart.forEach(item => {
            itemsCombinados.push({
                ...item,
                idDocumento: null,
                origen: 'temporal'
            });
        });

        if (itemsCombinados.length === 0) {
            mostrarNotificacion('Tu carrito está vacío', 'error');
            return;
        }

        // Verificar stock para todos los items
        let stockValido = true;
        let mensajeError = '';

        for (const item of itemsCombinados) {
            const producto = productosGlobal.find(p => p.id === item.productoId);
            if (!producto) {
                stockValido = false;
                mensajeError += `- Producto "${item.nombre}" no encontrado\n`;
                continue;
            }

            if (item.cantidad > producto.cantidad) {
                stockValido = false;
                mensajeError += `- "${item.nombre}": solicitaste ${item.cantidad} pero solo hay ${producto.cantidad} disponibles\n`;
            }
        }

        if (!stockValido) {
            alert(`Problemas de stock:\n${mensajeError}\nPor favor, ajusta las cantidades antes de continuar.`);
            return;
        }

        // Mostrar confirmación final
        if (confirm('¿Estás seguro de que quieres confirmar la compra? Esta acción no se puede deshacer.')) {
            mostrarNotificacion('¡Compra confirmada! Procesando tu pedido...');
            
            const batch = db.batch();
            
            // 1. Actualizar stock de cada producto
            for (const item of itemsCombinados) {
                const productoRef = db.collection('productos').doc(item.productoId);
                const producto = productosGlobal.find(p => p.id === item.productoId);
                
                if (producto) {
                    const nuevoStock = producto.cantidad - item.cantidad;
                    batch.update(productoRef, {
                        cantidad: nuevoStock
                    });
                }
            }
            
            // 2. Limpiar carrito de BD
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            // Ejecutar todas las operaciones en lote
            await batch.commit();
            
            // 3. Limpiar carrito temporal del usuario
            cart = cart.filter(item => item.usuarioId !== usuarioId);
            localStorage.setItem('tempCart', JSON.stringify(cart));
            
            mostrarNotificacion('¡Pedido procesado exitosamente! Stock actualizado.');
            
            // Recargar productos globales para reflejar cambios
            await cargarProductosGlobales();
            
            setTimeout(() => {
                window.location.href = 'tienda.html';
            }, 2000);
        }

    } catch (error) {
        console.error("Error al confirmar compra:", error);
        mostrarNotificacion('Error al procesar la compra', 'error');
    }
}

function formatearPrecio(valor) {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN"
    }).format(Number(valor));
}

function actualizarTotales(total) {
    if (textoTotal) textoTotal.textContent = formatearPrecio(total);
    if (textoSubtotal) textoSubtotal.textContent = formatearPrecio(total);
}

function limpiarCarritoTemporal() {
    const user = auth.currentUser;
    if (user && confirm('¿Limpiar todo el carrito temporal?')) {
        cart = cart.filter(item => item.usuarioId !== user.uid);
        localStorage.setItem('tempCart', JSON.stringify(cart));
        cargarCarritoCombinado(user.uid);
        mostrarNotificacion('Carrito temporal limpiado');
    }
}

