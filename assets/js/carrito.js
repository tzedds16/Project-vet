const firebaseConfig = {
    apiKey: "AIzaSyCb7ka8ExRoYk6YykUpKKVMvoKk_JfP2ko",
    authDomain: "petcare-4a63f.firebaseapp.com",
    projectId: "petcare-4a63f",
    storageBucket: "petcare-4a63f.firebasestorage.app",
    messagingSenderId: "443204856539",
    appId: "1:443204856539:web:9f7362bd4a5a468ce27afe",
    measurementId: "G-GSYEF3PB7K"
};

// Inicializar (si no está inicializado ya)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

const loader = document.getElementById('carrito-loader');
const contenedorItems = document.getElementById('carrito-items-container');
const textoTotal = document.getElementById('total-precio');
const textoSubtotal = document.getElementById('subtotal-precio');

let unsubscribe = null; //Para controlar la escucha de la base de datos

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

auth.onAuthStateChanged(user => {
    if (user) {
        cargarCarrito(user.uid);
    } else {
        window.location.href = 'login.html';
    }
});

function cargarCarrito(usuarioId) {
    // Escuchamos cambios en tiempo real en la colección 'carrito'
   unsubscribe = db.collection('carrito')
        .where('usuarioId', '==', usuarioId)
        .onSnapshot((snapshot) => {
            contenedorItems.innerHTML = '';
            let totalCalculado = 0;

            loader.style.display = 'none';

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
                const item = doc.data();
                const idDocumento = doc.id;
                totalCalculado += (item.precio * item.cantidad);

                // Renderizamos la tarjeta con los botones de + y -
                const cardHTML = `
                    <div class="card shadow-sm border-0 rounded-3 mb-3">
                        <div class="card-body d-flex align-items-center gap-3">
                            
                            <img src="${item.imagenURL}" alt="${item.nombre}" 
                                 style="width: 80px; height: 80px; object-fit: cover; border-radius: 10px;">
                            
                            <div class="flex-grow-1">
                                <h5 class="mb-0 fw-bold">${item.nombre}</h5>
                                <p class="text-muted mb-0">$${item.precio} MXN c/u</p>
                            </div>

                            <div class="d-flex align-items-center gap-2">
                                
                                <button class="btn btn-outline-danger btn-sm rounded-circle" 
                                        onclick="actualizarItemCarrito('${idDocumento}', '${item.productoId}', -1, ${item.cantidad})">
                                    <i class="bi bi-dash"></i>
                                </button>

                                <span class="fw-bold px-2 fs-5">${item.cantidad}</span>

                                <button class="btn btn-outline-success btn-sm rounded-circle" 
                                        onclick="actualizarItemCarrito('${idDocumento}', '${item.productoId}', 1, ${item.cantidad})">
                                    <i class="bi bi-plus"></i>
                                </button>
                            </div>

                            <button class="btn btn-light text-danger btn-sm rounded-circle ms-2" 
                                    onclick="borrarItem('${idDocumento}')" title="Eliminar">
                                <i class="bi bi-trash-fill"></i>
                            </button>
                        </div>
                    </div>
                `;

                contenedorItems.innerHTML += cardHTML;
            })
            actualizarTotales(totalCalculado);
        });
}

function actualizarTotales(total) {
    const formatoMoneda = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });
    textoTotal.textContent = formatoMoneda.format(total);
    textoSubtotal.textContent = formatoMoneda.format(total);
}

// --- NUEVA FUNCIÓN LÓGICA PARA EL CARRITO ---
async function actualizarItemCarrito(idDocCarrito, idProductoOriginal, cambio, cantidadActual) {
    const nuevaCantidad = cantidadActual + cambio;

    // 1. Si la cantidad llega a 0, preguntamos si quiere borrar o lo borramos directo
    if (nuevaCantidad === 0) {
        borrarItem(idDocCarrito);
        return;
    }

    //Si estamos sumando (+1), necesitamos verificar el stock en la colección 'productos'
    if (cambio > 0) {
        try {
            const docProd = await db.collection('productos').doc(idProductoOriginal).get();
            if (docProd.exists) {
                const stockMaximo = docProd.data().cantidad;
                
                if (nuevaCantidad > stockMaximo) {
                    mostrarNotificacion(`⚠️ Solo hay ${stockMaximo} unidades disponibles de este producto.`);
                    return; // Detenemos la función, no actualizamos
                }
            }
        } catch (error) {
            console.error("Error al verificar stock:", error);
            return;
        }
    }

    // 3. Si todo está bien, actualizamos la cantidad en el carrito
    db.collection('carrito').doc(idDocCarrito).update({
        cantidad: nuevaCantidad
    }).catch(error => {
        console.error("Error al actualizar cantidad:", error);
    });
}

function borrarItem(id) {
    // Podrías agregar un confirm aquí si quieres seguridad extra
    db.collection('carrito').doc(id).delete();
}

async function procesarCompra() {
    const user = auth.currentUser;
    if (!user) return;

    // Validar que el carrito no esté vacío antes de intentar cobrar
    const carritoQuery = await db.collection('carrito').where('usuarioId', '==', user.uid).get();
    if (carritoQuery.empty) {
        mostrarNotificacion("Tu carrito está vacío.");
        return;
    }

    // Deshabilitar botón para evitar doble clic
    const botonPago = document.querySelector("button[onclick='procesarCompra()']");
    const textoOriginal = botonPago.innerHTML;
    botonPago.disabled = true;
    botonPago.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div> Procesando...';

                            // --- NUEVO: INTERACCIÓN CON STRIPE ---
    // Se intenta crear un método de pago con los datos del formulario
    const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardNumber,
        billing_details: {
            name: user.displayName || user.email,
            email: user.email
        }
    });

    if (error) {
        // SI HUBO ERROR EN LA TARJETA (Ej: Fondos insuficientes, número mal)
        console.error(error);
        const displayError = document.getElementById('card-errors');
        displayError.textContent = error.message; // Mostramos el error al usuario
        
        // Reactivamos el botón para que intente de nuevo
        botonPago.disabled = false;
        botonPago.innerHTML = textoOriginal;
        return; 
    }

    // SI LLEGAMOS AQUÍ, LA TARJETA ES VÁLIDA (PaymentMethod creado)        <<<<-----------------
    console.log("Tarjeta válida. ID de pago:", paymentMethod.id);

 

    if (unsubscribe) unsubscribe();
    const numeroOrden = Math.floor(Math.random() * 1000000) + 5000; 
    const batch = db.batch();

    carritoQuery.docs.forEach(doc => {
        const item = doc.data();
        batch.delete(doc.ref);
        const productoRef = db.collection('productos').doc(item.productoId);
        batch.update(productoRef, {
            cantidad: firebase.firestore.FieldValue.increment(-item.cantidad)
        });
    });

    try {
        await batch.commit(); 

       
        const contenedorCentral = document.querySelector('.col-lg-8');
        const contenedorResumen = document.querySelector('.col-lg-4');

        if (contenedorResumen) contenedorResumen.style.display = 'none';
        
        contenedorCentral.className = 'col-12';
        contenedorCentral.innerHTML = `
            <div class="text-center py-5">
                <div class="mb-4">
                    <i class="bi bi-check-circle-fill text-success" style="font-size: 5rem;"></i>
                </div>
                <h2 class="fw-bold text-success display-4">¡Pago Exitoso!</h2>
                <p class="lead mt-3 text-muted">
                    Pago realizado con tarjeta terminada en **** ${paymentMethod.card.last4}.<br>
                    Gracias por tu compra, <strong>${user.displayName || 'Cliente'}</strong>.
                </p>
                
                <div class="card bg-light border-0 p-5 mt-5 mx-auto shadow-sm" style="max-width: 500px; border-radius: 20px;">
                    <h5 class="fw-bold text-muted text-uppercase mb-3">Orden de Compra</h5>
                    <h1 class="display-3 fw-bolder text-dark mb-0">#${numeroOrden}</h1>
                    <hr class="my-4">
                    <p class="text-muted mb-0">
                        <i class="bi bi-shop me-1"></i> 
                        Presenta este código en mostrador para recoger tus productos.
                    </p>
                </div>

                <a href="tienda.html" class="btn btn-outline-success rounded-pill px-5 py-3 mt-5 fw-bold">
                    <i class="bi bi-arrow-left me-2"></i> Volver a la Tienda
                </a>
            </div>
        `;

    } catch (error) {
        console.error("Error al procesar DB:", error);
        mostrarNotificacion("Hubo un error al guardar la orden.");
        botonPago.disabled = false;
        botonPago.innerHTML = textoOriginal;
    }
}

//IMPLEMENTACION PARA PAGOS DE A DEBIS


// 1. Inicializa Stripe con tu clave pública

const stripe = Stripe('pk_test_51SXeTPI6kbTFdMEGIz9BW9snUYKDGEI0RmMV4aPhQCKMFAQi2kiJhRRW7GUbyCMeBfZOlFegtTX0u7Utgm32CLXJ00u8lsSnQn'); 


const elements = stripe.elements();// Crea una instancia de elementos (el formulario)

// NOTA para el equipo salu2
/*
en el 99% de los casos no se debe de poner css asi dentro de js...Este es el 1% donde si se debe usar jaja

esto porque los inputs son iframes que cargan de los servidores de la pagina de pagos
los navegadores prohiben que los .css afecten a un iframe de otro dominio entones estamos obligados a ahcerlo asi
*/
const style = { 
  base: {
    color: "#32325d",
    fontFamily: '"Nunito", sans-serif',
    fontSmoothing: "antialiased",
    fontSize: "16px",
    "::placeholder": {
      color: "#aab7c4"
    }
  },
  invalid: {
    color: "#fa755a",
    iconColor: "#fa755a"
  }
};//fin de groseria


const cardNumber = elements.create('cardNumber', { style: style, showIcon: true, disableLink:true});
const cardExpiry = elements.create('cardExpiry', { style: style });
const cardCvc = elements.create('cardCvc', { style: style });

cardNumber.mount('#card-number-element');
cardExpiry.mount('#card-expiry-element');
cardCvc.mount('#card-cvc-element');


//MANEJO DE ERRORES (Escuchamos cambios en los 3)
const displayError = document.getElementById('card-errors');

[cardNumber, cardExpiry, cardCvc].forEach(element => {
    element.on('change', ({error}) => {
        if (error) {
            displayError.textContent = error.message;
        } else {
            displayError.textContent = '';
        }
    });
});

 