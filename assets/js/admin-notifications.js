console.log("🔔 admin-notifications.js loaded");

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log("📄 DOM cargado, inicializando notificaciones...");
    inicializarSistemaNotificaciones();
});

// INICIALIZACIÓN PRINCIPAL
function inicializarSistemaNotificaciones() {
    console.log("🔄 Inicializando sistema de notificaciones...");
    
    // Verificar que Firebase esté disponible
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase no está disponible');
        mostrarErrorNotificaciones('Firebase no está disponible');
        return;
    }

    if (!firebase.apps.length) {
        console.error('❌ Firebase no está inicializado');
        mostrarErrorNotificaciones('Firebase no está inicializado');
        return;
    }

    const auth = firebase.auth();
    const db = firebase.firestore();

    // Referencias DOM
    const notificacionesArea = document.getElementById('notificaciones-area');
    const contadorNotificaciones = document.getElementById('contador-notificaciones');
    const listaNotificaciones = document.getElementById('lista-notificaciones-dropdown');

    if (!notificacionesArea) {
        console.error('❌ Elemento notificaciones-area no encontrado');
        return;
    }

    console.log("✅ Elementos DOM encontrados");

    // Escuchar cambios de autenticación
    auth.onAuthStateChanged(async (user) => {
        console.log("🔐 Estado de autenticación cambiado:", user ? "Usuario logueado" : "No logueado");
        
        if (user) {
            try {
                // Verificar si es admin
                const userDoc = await db.collection('usuarios').doc(user.uid).get();
                
                if (userDoc.exists && userDoc.data().rol === 'administrador') {
                    console.log("✅ Usuario es administrador, mostrando notificaciones");
                    
                    // Mostrar el área de notificaciones
                    notificacionesArea.classList.remove('d-none');
                    
                    // Crear notificación de bienvenida si es la primera vez
                    await crearNotificacionBienvenida();
                    
                    // Iniciar escucha de notificaciones
                    iniciarEscuchaNotificaciones();
                    
                } else {
                    console.log("❌ Usuario no es administrador, ocultando notificaciones");
                    notificacionesArea.classList.add('d-none');
                }
            } catch (error) {
                console.error('❌ Error verificando rol de usuario:', error);
                notificacionesArea.classList.add('d-none');
            }
        } else {
            console.log("🔒 Usuario no autenticado, ocultando notificaciones");
            notificacionesArea.classList.add('d-none');
        }
    });

    // FUNCIÓN PARA CREAR NOTIFICACIÓN DE BIENVENIDA
    async function crearNotificacionBienvenida() {
        try {
            console.log("🎉 Verificando si necesitamos crear notificación de bienvenida...");
            
            // Verificar si ya existe alguna notificación
            const snapshot = await db.collection('notificaciones')
                .limit(1)
                .get();
                
            if (snapshot.empty) {
                console.log("📝 No hay notificaciones, creando primera notificación...");
                
                const result = await crearNotificacion({
                    titulo: "¡Sistema de notificaciones activado!",
                    mensaje: "Bienvenido al panel de administración. El sistema de notificaciones está funcionando correctamente.",
                    tipo: "info"
                });
                
                if (result.ok) {
                    console.log("✅ Notificación de bienvenida creada con ID:", result.id);
                } else {
                    console.error("❌ Error creando notificación de bienvenida:", result.error);
                }
            } else {
                console.log("✅ Ya existen notificaciones en el sistema:", snapshot.size);
            }
        } catch (error) {
            console.error("❌ Error en crearNotificacionBienvenida:", error);
        }
    }

    // ESCUCHA DE NOTIFICACIONES EN TIEMPO REAL
    function iniciarEscuchaNotificaciones() {
        console.log('👂 Iniciando escucha de notificaciones en tiempo real...');

        try {
            db.collection("notificaciones")
                .orderBy("fecha", "desc")
                .limit(10)
                .onSnapshot((snapshot) => {
                    console.log('📬 Snapshot recibido, notificaciones:', snapshot.size);
                    actualizarInterfazNotificaciones(snapshot);
                }, (error) => {
                    console.error('❌ Error en escucha de notificaciones:', error);
                    mostrarErrorNotificaciones('Error cargando notificaciones');
                });
        } catch (error) {
            console.error('❌ Error iniciando escucha:', error);
        }
    }

    // ACTUALIZAR INTERFAZ DE NOTIFICACIONES
    function actualizarInterfazNotificaciones(snapshot) {
        if (!contadorNotificaciones || !listaNotificaciones) {
            console.error('❌ Elementos de interfaz no encontrados');
            return;
        }

        // Contador de no leídas
        let noLeidas = 0;
        snapshot.forEach(doc => {
            if (!doc.data().leida) {
                noLeidas++;
            }
        });
        
        console.log(`📊 Notificaciones no leídas: ${noLeidas}`);

        // Actualizar contador
        if (noLeidas > 0) {
            contadorNotificaciones.classList.remove('d-none');
            contadorNotificaciones.textContent = noLeidas;
        } else {
            contadorNotificaciones.classList.add('d-none');
        }

        // Actualizar lista
        if (snapshot.empty) {
            listaNotificaciones.innerHTML = '<li class="text-center text-muted p-3">No hay notificaciones</li>';
            return;
        }

        listaNotificaciones.innerHTML = '';
        
        snapshot.docs.forEach((doc) => {
            const notificacion = doc.data();
            const id = doc.id;
            
            const item = document.createElement('li');
            item.className = `notification-item p-3 border-bottom ${notificacion.leida ? '' : 'bg-light'}`;
            
            const tipoClase = notificacion.tipo === 'peligro' ? 'text-danger' : 
                             notificacion.tipo === 'producto' ? 'text-success' : 'text-primary';
            
            const fechaFormateada = notificacion.fecha ? 
                new Date(notificacion.fecha.toDate()).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                }) : 'Fecha no disponible';

            item.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center mb-1">
                            <i class="bi ${obtenerIconoTipo(notificacion.tipo)} ${tipoClase} me-2"></i>
                            <strong class="small">${notificacion.titulo || 'Sin título'}</strong>
                        </div>
                        <p class="small mb-1 text-dark">${notificacion.mensaje || 'Sin mensaje'}</p>
                        <small class="text-muted">${fechaFormateada}</small>
                    </div>
                    ${!notificacion.leida ? 
                        `<button class="btn btn-sm btn-outline-success ms-2" onclick="marcarNotificacionLeida('${id}')" title="Marcar como leída">
                            <i class="bi bi-check"></i>
                        </button>` : 
                        '<span class="badge bg-secondary ms-2">Leída</span>'
                    }
                </div>
            `;
            
            listaNotificaciones.appendChild(item);
        });
    }

    function obtenerIconoTipo(tipo) {
        const iconos = {
            'peligro': 'bi-exclamation-triangle',
            'producto': 'bi-box-seam',
            'info': 'bi-info-circle',
            'default': 'bi-bell'
        };
        return iconos[tipo] || iconos.default;
    }

    function mostrarErrorNotificaciones(mensaje) {
        const listaNotificaciones = document.getElementById('lista-notificaciones-dropdown');
        if (listaNotificaciones) {
            listaNotificaciones.innerHTML = `<li class="text-center text-danger p-2">${mensaje}</li>`;
        }
    }

    // Hacer funciones disponibles globalmente
    window.marcarNotificacionLeida = function(id) {
        console.log("📝 Marcando notificación como leída:", id);
        db.collection('notificaciones').doc(id).update({
            leida: true
        }).then(() => {
            console.log('✅ Notificación marcada como leída');
        }).catch((error) => {
            console.error('❌ Error al marcar como leída:', error);
        });
    };
}

// FUNCIÓN PRINCIPAL PARA CREAR NOTIFICACIONES
async function crearNotificacion({ titulo, mensaje, tipo = "info" }) {
    try {
        console.log("🔄 Creando notificación...", { titulo, mensaje, tipo });

        if (typeof firebase === 'undefined') {
            throw new Error('Firebase no está disponible');
        }

        if (!firebase.apps.length) {
            throw new Error('Firebase no está inicializado');
        }

        const db = firebase.firestore();
        
        const notificacionData = {
            titulo: titulo || 'Sin título',
            mensaje: mensaje || 'Sin mensaje',
            tipo: tipo || 'info',
            fecha: firebase.firestore.FieldValue.serverTimestamp(),
            leida: false
        };

        console.log("📤 Enviando datos a Firestore...");
        const result = await db.collection("notificaciones").add(notificacionData);
        
        console.log("✅ Notificación creada exitosamente. ID:", result.id);
        return { ok: true, id: result.id };

    } catch (err) {
        console.error("❌ ERROR al crear notificación:", err);
        console.error("Detalles:", err.message);
        return { ok: false, error: err };
    }
}

// FUNCIONES ESPECÍFICAS DE NOTIFICACIÓN
function notificarProductoNuevo(data) {
    console.log("📦 Creando notificación de producto nuevo:", data.nombre);
    return crearNotificacion({
        titulo: "Nuevo producto agregado",
        mensaje: `Se agregó el producto: ${data.nombre}`,
        tipo: "producto"
    });
}

function notificarInventarioBajo(producto) {
    console.log("⚠️ Creando notificación de inventario bajo:", producto.nombre);
    return crearNotificacion({
        titulo: "Inventario bajo",
        mensaje: `El producto ${producto.nombre} tiene pocas unidades (${producto.cantidad}).`,
        tipo: "peligro"
    });
}

function notificarRecordatorios(cita) {
    console.log("📅 Creando notificación de recordatorio:", cita.usuarioNombre);
    return crearNotificacion({
        titulo: "Recordatorio enviado",
        mensaje: `Se envió un recordatorio para la cita de ${cita.usuarioNombre} (${cita.fecha}).`,
        tipo: "info"
    });
}


// FUNCIÓN DE PRUEBA MANUAL
function probarNotificaciones() {
    console.log("🧪 EJECUTANDO PRUEBA MANUAL DE NOTIFICACIONES...");
    
    crearNotificacion({
        titulo: "PRUEBA MANUAL",
        mensaje: "Esta es una notificación de prueba creada manualmente",
        tipo: "info"
    }).then(result => {
        console.log("Resultado de prueba:", result);
        alert(result.ok ? "✅ Prueba exitosa" : "❌ Prueba fallida");
    });
}

// Hacer funciones disponibles globalmente
window.crearNotificacion = crearNotificacion;
window.notificarProductoNuevo = notificarProductoNuevo;
window.notificarInventarioBajo = notificarInventarioBajo;
window.notificarRecordatorios = notificarRecordatorios;
window.probarNotificaciones = probarNotificaciones;

console.log("🎯 Sistema de notificaciones cargado y listo");

// LIMPIEZA AUTOMÁTICA CADA 24 HORAS
async function limpiezaAutomaticaNotificaciones() {
    console.log("🧹 Ejecutando limpieza automática de notificaciones...");
    
    try {
        // Calcular fecha límite 
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - 1); 

        console.log("📅 Eliminando notificaciones anteriores a:", fechaLimite.toLocaleDateString());

        // Buscar notificaciones antiguas
        const snapshot = await firebase.firestore().collection('notificaciones')
            .where('fecha', '<', fechaLimite)
            .get();

        if (snapshot.empty) {
            console.log("✅ No hay notificaciones antiguas para eliminar");
            return;
        }

        // Eliminar en lote
        const batch = firebase.firestore().batch();
        let contador = 0;

        snapshot.forEach(doc => {
            batch.delete(doc.ref);
            contador++;
        });

        await batch.commit();
        
        console.log(`✅ Limpieza automática completada: ${contador} notificaciones eliminadas`);

    } catch (error) {
        console.error('❌ Error en limpieza automática:', error);
    }
}

// ===========================================
// PROGRAMAR LIMPIEZA AUTOMÁTICA
// ===========================================

// Ejecutar limpieza automática cada 24 horas
setInterval(limpiezaAutomaticaNotificaciones, 24 * 60 * 60 * 1000);

// Ejecutar una vez al cargar la página (después de 20 segundos)
setTimeout(limpiezaAutomaticaNotificaciones, 20000);

console.log("🕒 Limpieza automática programada: cada 24 horas");