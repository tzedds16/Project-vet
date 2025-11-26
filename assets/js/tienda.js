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

// Función para mostrar el Toast
function mostrarNotificacion(mensaje) {
    const toastEl = document.getElementById('stockToast');
    const toastBody = document.getElementById('toastMensaje');
    if (toastEl && toastBody) {
        toastBody.textContent = mensaje;
        const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
        toast.show();
    } else {
        mostrarNotificacion("Producto agotado");
    }
}

// Lógica de Autenticación y Carga de Productos
// Iniciar mostrando el loader principal
loader.style.display = 'block';
productoContainer.innerHTML = '';
errorMsg.style.display = 'none';

let productosGlobal = []; // Aquí se guardan todos los productos
let carritoMap = {};
let listaActual = [];


// Esta función auxiliar nos devuelve el HTML de los botones según el estado del carrito
function generarBotonesHTML(producto) {
    const enCarrito = carritoMap[producto.id];

    if (esAdmin) {
        return `<a href="admin-panel.html?id=${producto.id}" class="btn btn-warning mt-2">
                   <i class="bi bi-pencil-square me-2"></i> Editar
               </a>`;
    } else if (enCarrito) {
        // Muestra controles + y -
        return `
            <div class="d-flex justify-content-center align-items-center gap-3 mt-2">
                <button class="btn btn-outline-danger rounded-circle" 
                        onclick="actualizarCantidad('${producto.id}', -1)">
                    <i class="bi bi-dash"></i>
                </button>
                
                <span class="fw-bold fs-5">${enCarrito.cantidad}</span>
                
                <button class="btn btn-outline-success rounded-circle" 
                        onclick="actualizarCantidad('${producto.id}', 1)">
                    <i class="bi bi-plus"></i>
                </button>
            </div>
        `;
    } else {
        // Muestra botón Añadir
        return `
           <button class="btn btn-tienda mt-2" onclick="agregarAlCarrito('${producto.id}')">
               <i class="bi bi-cart-plus me-2"></i> Añadir al carrito
           </button>`;
    }
}

function renderProductos(lista) {
    //listaActual = lista;
    if(esAdmin){
        listaActual = lista;
    }else{
        listaActual = lista.filter(p => p.cantidad > 0);
    }
    productoContainer.innerHTML = "";

    if (listaActual.length === 0) {
        productoContainer.innerHTML = `<p class="text-center text-muted">No hay productos.</p>`;
        return;
    }

    lista.forEach(producto => {
        // Verificamos si este producto ya está en el carrito del usuario
        // Rojo si quedan menos de 5, gris si hay más
        let stockClass = producto.cantidad < 5 ? "text-danger fw-bold" : "text-muted";
        let backgroundClass = "";

        if(esAdmin){
            if (producto.cantidad === 0) backgroundClass = "bg-danger-subtle";      // rojo
            else if (producto.cantidad <= 5) backgroundClass = "bg-warning-subtle";     // naranja
            else backgroundClass = "bg-white";              // normal
        }

        const botonesHTML = generarBotonesHTML(producto);

        const card = `
            <div class="col-12 col-sm-6 col-md-4 col-lg-3" id="card-${producto.id}">
                <div class="card h-100 shadow-sm border-0 ${backgroundClass}">
                    <div class="card-img-top-container d-flex justify-content-center align-items-center p-3">
                        <img src="${producto.imagenURL}" class="card-img-top-custom" alt="${producto.nombre}">
                    </div>
                    <div class="card-body text-center d-flex flex-column">  
                        <p class="text-muted fst-italic">${producto.categoria}</p> 
                        <h5 class="fw-bold mt-2 mb-auto">${producto.nombre}</h5> 
                        <p class="text-muted mb-2">${producto.descripcion}</p>
                        <p class="fw-bold text-success fs-5">${formatearPrecioMX(producto.precio)}</p>
                        <p class="${stockClass} mb-1" style="font-size: 0.9rem;"> <i class="bi bi-box-seam"></i> Disponibles: ${producto.cantidad}
</p>
                        
                        <div id="btn-container-${producto.id}">
                            ${botonesHTML}
                        </div>
                        
                    </div>
                </div>
            </div>
        `;
        productoContainer.innerHTML += card;
    });
}

function actualizarSoloBotones() {
    // Recorremos la lista que el usuario está viendo actualmente
    
    const listaARecorrer = listaActual.length > 0 ? listaActual : productosGlobal;

    listaARecorrer.forEach(producto => {
        // Buscamos el contenedor específico de ESE producto
        const contenedorBotones = document.getElementById(`btn-container-${producto.id}`);
        
        // Si el producto está en pantalla, actualizamos su HTML
        if (contenedorBotones) {
            contenedorBotones.innerHTML = generarBotonesHTML(producto);
        }
    });
}


auth.onAuthStateChanged(async user => {
    //Lógica de UI de Autenticación
    if (user) {
        // USUARIO CONECTADO
        welcomeMessage.textContent = `👋 Bienvenid@, ${user.displayName || user.email}`;
        logoutBtn.classList.remove('d-none');
        cartBtn.classList.remove('d-none');
        errorMsg.style.display = 'none';

        db.collection('carrito').where('usuarioId', '==', user.uid)
          .onSnapshot((snapshot) => {
              carritoMap = {}; // Reiniciamos el mapa para llenarlo de nuevo
              
              snapshot.forEach(doc => {
                  const data = doc.data();
                  // Guardamos: Clave = ID del Producto, Valor = Datos del carrito
                  carritoMap[data.productoId] = {
                      cantidad: data.cantidad,
                      idDoc: doc.id // Necesitamos el ID del documento del carrito para editar/borrar
                  };
              });
              
              actualizarSoloBotones();
          });
        
        // Lógica para Identificar Admin y cambiar botón
        try {
            // 1.Obtener el documento del usuario desde Firestore usando el UID
            const userDoc = await db.collection('usuarios').doc(user.uid).get();
            
            if (userDoc.exists && userDoc.data().rol === 'administrador') { 
                // Si es ADMIN, cambiar el texto y el enlace del botón
                cartBtn.innerHTML = 'Panel Admin';
                cartBtn.href = 'admin-panel.html';
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
            <p class="mb-2">No has iniciado sesión. Si deseas comprar o ver tu carrito, inicia sesión.</p>
            <button id="goLoginBtn" class="btn btn-primary btn-sm me-2">Iniciar sesión</button>
            <button id="continueBtn" class="btn btn-secondary btn-sm">Seguir explorando</button>
        `;

        //Botón para ir al login
        document.getElementById('goLoginBtn').addEventListener('click', () => {
            window.location.href = 'login.html';
        });

        //Botón para continuar sin login (solo oculta el aviso)
        document.getElementById('continueBtn').addEventListener('click', () => {
            errorMsg.style.display = 'none';
        });

        carritoMap = {}; // Si no hay usuario, el carrito está vacío en memoria
        renderProductos(productosGlobal);
    }

    //Lógica de Carga de Productos (Se ejecuta independientemente del login)
    try {
        const snapshot = await db.collection("productos").orderBy('cantidad', 'asc').get();

        if (snapshot.empty) {
            productoContainer.innerHTML = `
                <p class="text-center text-muted">No hay productos disponibles.</p>`;
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
        errorMsg.textContent = "Error al cargar los productos.";
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


async function agregarAlCarrito(idProducto) {
    const user = auth.currentUser; 
    if (!user) {
        alert("Debes iniciar sesión para comprar");
        return;
    }

    const producto = productosGlobal.find(p => p.id === idProducto);
    
    // Validación básica de stock
    if (producto.cantidad <= 0) {
        alert("Producto agotado");
        return;
    }

    try {
        
        await db.collection('carrito').add({// Se crea el documento en Firebase
            usuarioId: user.uid,
            productoId: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagenURL: producto.imagenURL,
            cantidad: 1, // Empieza con 1
            fecha: firebase.firestore.FieldValue.serverTimestamp()
        });
        // NOTA: No necesitamos hacer alert ni recargar la página. 
        // El onSnapshot  detectará esto y actualizará el botón automáticamente.
        
    } catch (error) {
        console.error("Error:", error);
    }
}


async function actualizarCantidad(idProducto, cambio) {
    // 'cambio' será 1 (sumar) o -1 (restar)
    
    const datosCarrito = carritoMap[idProducto]; // Recuperamos datos del mapa (idDoc, cantidad actual)
    const productoInfo = productosGlobal.find(p => p.id === idProducto); // Info del producto (stock)

    if (!datosCarrito) return; // Seguridad por si acaso

    const nuevaCantidad = datosCarrito.cantidad + cambio;

   
    if (nuevaCantidad === 0) {  //  Lógica para ELIMINAR si llega a 0
        try {
            // Borramos el documento del carrito usando el ID que guardamos en el mapa
            await db.collection('carrito').doc(datosCarrito.idDoc).delete();
            // Al borrarse, onSnapshot se dispara -> renderProductos se ejecuta -> el botón vuelve a ser "Añadir"
        } catch (e) { console.error(e); }
        return;
    }

    // 2. Lógica para STOCK MÁXIMO
    if (nuevaCantidad > productoInfo.cantidad) {
        mostrarNotificacion(`⚠️ Solo hay ${productoInfo.cantidad} unidades disponibles.`);
        return;
    }

    // 3. Actualizar base de datos
    try {
        await db.collection('carrito').doc(datosCarrito.idDoc).update({
            cantidad: nuevaCantidad
        });
        // Al actualizarse, onSnapshot se dispara -> actualiza el número en pantalla
    } catch (e) { console.error(e); }
}