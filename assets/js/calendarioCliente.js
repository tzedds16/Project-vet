// Referencias a elementos de control de la interfaz
const loader = document.getElementById('client-loader');
const errorDiv = document.getElementById('client-error');
const citasContainer = document.getElementById('citas-container');
const welcomeMessage = document.getElementById('welcomeMessage');
const logoutBtn = document.getElementById('logoutBtn');

// Listener de autenticación
auth.onAuthStateChanged(user => {
    // Mostrar el loader
    loader.style.display = 'block';
    citasContainer.innerHTML = '';
    errorDiv.style.display = 'none';

    if (user) {
        // Usuario logueado: Muestra mensaje y botón de cerrar sesión
        welcomeMessage.textContent = `👋 Bienvenid@, ${user.displayName || user.email}`;
        logoutBtn.classList.remove('d-none');
        
        // Llama a la función de carga. El loader seguirá visible hasta que 
        // cargarCitasCliente lo apague en el .then() de la consulta.
        cargarCitasCliente(user.uid);
        
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                window.location.href = 'index.html';
            });
        });

    } else {
        // Usuario no logueado: Oculta el loader y muestra error 
        loader.style.display = 'none';
        errorDiv.textContent = 'Debes iniciar sesión para ver tus citas. Redirigiendo a login...';
        errorDiv.style.display = 'block';
        setTimeout(() => { window.location.href = 'login.html' }, 3000);
    }
});

// Función para cargar SOLO las citas del usuario actual
function cargarCitasCliente(usuarioId) {
    citasContainer.innerHTML = ''; // Limpiar el contenedor
    
    // Consulta: Filtrar por 'usuarioId' y ordenar por fecha de la cita
    db.collection('citas')
      .where('usuarioId', '==', usuarioId) 
      .orderBy('fecha', 'asc') 
      .get()
      .then(querySnapshot => {
        loader.style.display = 'none';

        if (querySnapshot.empty) {
            citasContainer.innerHTML = `
                <div class="col-12 text-center my-5">
                    <p class="lead text-muted"><i class="far fa-calendar-times me-2"></i> No tienes citas agendadas.</p>
                    <a href="agendar.html" class="btn btn-tienda mt-3">¡Agenda tu primera cita aquí!</a>
                </div>`;
            return;
        }
        
        querySnapshot.forEach(doc => {
            const cita = doc.data();
            const citaId = doc.id;
            
            const estado = cita.estado || 'activa';
            const mascotaInfo = cita.tipoMascota ? `${cita.tipoMascota} (${cita.edad || 'Edad no reg.'})` : 'No especificada';
            const motivoServicio = cita.motivo || 'No especificado';
            
            let cardClass = 'card-servicio p-4 shadow border-0 h-100 card-citas';
            let titleIcon = 'far fa-calendar-alt me-2 text-primario';
            let titleText = 'Próxima Cita';
            let buttonHtml = '';
            let isPast = false;
            
            if (estado === 'cancelada') {
                cardClass += ' opacity-75';
                titleIcon = 'far fa-calendar-times me-2 text-danger';
                titleText = 'Cita Cancelada';
                buttonHtml = `<button class="btn btn-danger" disabled><i class="fas fa-times-circle"></i> Cancelada</button>`;
            } else {
                 const hoy = new Date();
                 const fechaCita = new Date(`${cita.fecha} ${cita.hora}`);

                 if (fechaCita < hoy) {
                    cardClass += ' opacity-75';
                    titleIcon = 'far fa-calendar-check me-2 text-muted';
                    titleText = 'Cita Finalizada';
                    buttonHtml = `<button class="btn btn-secondary" disabled> Cita Finalizada</button>`;
                    isPast = true;
                 } else {
                    cardClass += ' card-color-3';
                    buttonHtml = `
                        <button class="btn btn-agendar btn-cancelar-cita" data-cita-id="${citaId}"> 
                            <i class="fas fa-times me-1"></i> Cancelar Cita
                        </button>`;
                 }
            }

            const citaCard = `
                <div class="col-12 col-md-6 col-lg-4">
                    <div class="${cardClass}" id="cita-${citaId}">
                        <div class="card-body d-flex flex-column">
                            <h2 class="h4 fw-bolder text-center ${isPast ? 'text-muted' : ''}">
                                <i class="${titleIcon}"></i> ${titleText}
                            </h2>
                            <table class="table tabla-citas mb-4">
                                <tbody>
                                    <tr>
                                        <th scope="row" class="rounded-start">Fecha</th>
                                        <td class="bg-white rounded-end shadow-sm ${isPast ? 'text-muted' : ''}">${cita.fecha}</td> 
                                    </tr>
                                    <tr>
                                        <th scope="row" class="rounded-start">Hora</th>
                                        <td class="bg-white rounded-end shadow-sm ${isPast ? 'text-muted' : ''}">${cita.hora}</td> 
                                    </tr>
                                    <tr>
                                        <th scope="row" class="rounded-start">Servicio</th>
                                        <td class="bg-white rounded-end shadow-sm ${isPast ? 'text-muted' : ''}">${motivoServicio}</td> 
                                    </tr>
                                    <tr>
                                        <th scope="row" class="rounded-start">Mascota</th>
                                        <td class="bg-white rounded-end shadow-sm ${isPast ? 'text-muted' : ''}">${mascotaInfo}</td> 
                                    </tr>
                                </tbody>
                            </table>
                            <div class="d-grid mt-auto"> 
                                ${buttonHtml}
                            </div>
                        </div>
                    </div>
                </div>`;
                
            citasContainer.innerHTML += citaCard;
        });

        agregarEventListenersCancelarCliente();


    }).catch(error => {
        loader.style.display = 'none';
        console.error("Error al cargar citas del cliente: ", error);
        errorDiv.textContent = 'Error al cargar tus citas. Intenta de nuevo más tarde.';
        errorDiv.style.display = 'block';
    });
}

// Cancelar la cita del cliente
function agregarEventListenersCancelarCliente() {
    const botonesCancelar = document.querySelectorAll('.btn-cancelar-cita');

    botonesCancelar.forEach(boton => {
        boton.addEventListener('click', function() {
            const citaId = this.getAttribute('data-cita-id');
            cancelarCitaCliente(citaId);
        });
    });
}

// Función para cancelar una cita (cliente)
function cancelarCitaCliente(citaId) {
    if (!confirm('¿Seguro que deseas cancelar esta cita?')) {
        return;
    }

    const boton = document.querySelector(`.btn-cancelar-cita[data-cita-id="${citaId}"]`);
    const textoOriginal = boton.innerHTML;
    boton.innerHTML = '<i class="fas fa-hourglass-half"></i> Cancelando...';
    boton.disabled = true;

    db.collection('citas').doc(citaId).update({
        estado: 'cancelada',
        fechaCancelacion: firebase.firestore.FieldValue.serverTimestamp(),
        canceladoPor: auth.currentUser.uid,
        canceladoPorNombre: auth.currentUser.email
    })
    .then(() => {
        alert('✅ Tu cita ha sido cancelada exitosamente.');

        // Recargar las citas para reflejar el cambio
        cargarCitasCliente(auth.currentUser.uid);
    })
    .catch(error => {
        console.error("Error al cancelar cita:", error);
        alert('❌ Error al cancelar la cita. Inténtalo de nuevo.');

        boton.innerHTML = textoOriginal;
        boton.disabled = false;
    });
}

