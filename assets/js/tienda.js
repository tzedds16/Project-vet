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
            <p class="text-center text-muted">No hay productos en esta sección.</p>
        `;
        return;
    }

    lista.forEach(producto => {
        const botonHTML = esAdmin
            ? `<a href="admin-panel.html?id=${producto.id}" class="btn btn-warning mt-2">
                   <i class="bi bi-pencil-square me-2"></i> Editar
               </a>`
            : `<button class="btn btn-tienda mt-2" onclick="agregarAlCarrito('${producto.id}')">
                   <i class="bi bi-cart-plus me-2"></i> Añadir al carrito
               </button>`;

        const card = `
            <div class="col-12 col-sm-6 col-md-4 col-lg-3">
                <div class="card h-100 shadow-sm border-0">
                    <div class="card-img-top-container d-flex justify-content-center align-items-center p-3">
                        <img src="${producto.imagenURL}" class="card-img-top-custom" alt="${producto.nombre}">
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
}


auth.onAuthStateChanged(async user => {
    //Lógica de UI de Autenticación
    if (user) {
        // USUARIO CONECTADO
        welcomeMessage.textContent = `👋 Bienvenid@, ${user.displayName || user.email}`;
        logoutBtn.classList.remove('d-none');
        cartBtn.classList.remove('d-none');
        errorMsg.style.display = 'none';
        
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
    }

    //Lógica de Carga de Productos (Se ejecuta independientemente del login)
    try {
        const snapshot = await db.collection("productos").get();

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
        alert("Debes inicar sesion para comprar")
        return;
    }

    const productoEncontrado = productosGlobal.find(p => p.id === idProducto);
    
    if (!productoEncontrado) return;

    //validacion para el stock
    if (productoEncontrado.cantidad <= 0) {
        alert("Lo sentimos, este producto esta agotado")
        return;
    }

    try {
        const querySnapshot = await db.collection('carrito') //pregunta si el producto ya existe en el carrito del usuario
        .where('usuarioId', '==', user.uid)
        .where('productoId', '==', idProducto)
        .get()
         
        if (!querySnapshot.empty) { //si no esta vacio, se actualiza el contador en la base de datos
            const docCarrito = querySnapshot.docs[0];
            const dataActual = docCarrito.data();
            const nuevaCantidad = dataActual.cantidad + 1;

            if (nuevaCantidad > productoEncontrado.cantidad) {
                alert(`⚠️ Solo hay ${productoEncontrado.cantidad} unidades disponibles.`);
                return;
            }

            await db.collection('carrito').doc(docCarrito.id).update({
                cantidad: nuevaCantidad
            })
        } else {
           
            await db.collection('carrito').add({
                usuarioId: user.uid,
                productoId: productoEncontrado.id,
                nombre: productoEncontrado.nombre,
                precio: productoEncontrado.precio,
                imagenURL: productoEncontrado.imagenURL,
                cantidad: 1, // Empieza con 1
                fecha: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert(`✅ ${productoEncontrado.nombre} agregado al carrito.`);
        }
    } catch (error) {
        console.error("Error en el carrito:", error);
        alert("Error al procesar la solicitud.");
    }
 
}