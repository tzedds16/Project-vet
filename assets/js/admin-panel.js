


const loader = document.getElementById('admin-loader');
const errorDiv = document.getElementById('admin-error');
const contenido = document.getElementById('admin-contenido');



auth.onAuthStateChanged(user => {
  if (user) {
    
    db.collection('usuarios').doc(user.uid).get().then(doc => {
      
      //admin??
      if (doc.exists && doc.data().rol === 'administrador') {
        loader.style.display = 'none';    //oculta el loader
        contenido.style.display = 'flex'; //muestra el panel
        
    
        cargarCitas();

      } else {
            //no admin
        loader.style.display = 'none';
        errorDiv.style.display = 'block';
        //redirigir
        setTimeout(() => { window.location.href = 'index.html' }, 3000);
      }
    });

  } else {
    //usuario no logueado
    loader.style.display = 'none';
    errorDiv.innerHTML = 'Debes iniciar sesión. Redirigiendo a login...';
    errorDiv.style.display = 'block';
    setTimeout(() => { window.location.href = 'login.html' }, 3000);
  }
});


// Función cargar citas - VERSIÓN MEJORADA CON CANCELACIÓN
function cargarCitas() {
    const tbody = document.getElementById('citas-body');
    
    db.collection('citas').orderBy('fechaCreacion', 'desc').get().then(querySnapshot => {
        
        if (querySnapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No hay citas agendadas.</td></tr>';
            return;
        }
        
        tbody.innerHTML = ''; 
        
        querySnapshot.forEach(doc => {
            const cita = doc.data();       
            const citaId = doc.id;
            const mascotaInfo = `${cita.tipoMascota || ''} (${cita.edad || ''})`;
            
            // Determinar el estado de la cita
            const estado = cita.estado || 'activa';
            const badgeClass = estado === 'cancelada' ? 'badge bg-danger' : 'badge bg-success';
            
            tbody.innerHTML += `
                <tr id="cita-${citaId}" class="${estado === 'cancelada' ? 'table-secondary' : ''}">
                    <td><strong>${cita.fecha}</strong></td>
                    <td>${cita.hora}</td>
                    <td>${cita.usuarioNombre || 'No registrado'}</td>
                    <td>${cita.motivo || 'No especificado'}</td>
                    <td>${mascotaInfo}</td>
                    <td>${cita.usuarioEmail || 'No registrado'}</td>
                    <td>
                        <span class="${badgeClass}">${estado}</span>
                    </td>
                    <td>
                        ${estado === 'activa' ? 
                            `<button class="btn btn-danger btn-sm btn-cancelar-cita" data-cita-id="${citaId}">
                                <i class="bi bi-x-circle"></i> Cancelar
                            </button>` : 
                            '<span class="text-muted"><i class="bi bi-ban"></i> Cancelada</span>'
                        }
                    </td>
                </tr>
            `;
        });

        // Agregar event listeners a los botones de cancelar
        agregarEventListenersCancelar();

    }).catch(error => {
        console.error("Error al cargar citas: ", error);
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Error al cargar las citas.</td></tr>';
    });
}

// Función para agregar event listeners a los botones de cancelar
function agregarEventListenersCancelar() {
    const botonesCancelar = document.querySelectorAll('.btn-cancelar-cita');
    
    botonesCancelar.forEach(boton => {
        boton.addEventListener('click', function() {
            const citaId = this.getAttribute('data-cita-id');
            cancelarCita(citaId);
        });
    });
}

// Función para cancelar una cita
function cancelarCita(citaId) {
    if (!confirm('¿Estás seguro de que deseas cancelar esta cita?\n\nEsta acción liberará el espacio para otros clientes.')) {
        return;
    }
    
    // Mostrar loading en el botón
    const boton = document.querySelector(`.btn-cancelar-cita[data-cita-id="${citaId}"]`);
    const textoOriginal = boton.innerHTML;
    boton.innerHTML = '<i class="bi bi-hourglass-split"></i> Cancelando...';
    boton.disabled = true;
    
    db.collection('citas').doc(citaId).update({
        estado: 'cancelada',
        fechaCancelacion: firebase.firestore.FieldValue.serverTimestamp(),
        canceladoPor: auth.currentUser.uid,
        canceladoPorNombre: auth.currentUser.displayName || 'Administrador'
    })
    .then(() => {
        // Actualizar la fila visualmente
        const fila = document.getElementById(`cita-${citaId}`);
        fila.classList.add('table-secondary');
        
        // Actualizar el estado
        const estadoBadge = fila.querySelector('.badge');
        estadoBadge.className = 'badge bg-danger';
        estadoBadge.textContent = 'cancelada';
        
        // Actualizar el botón
        const tdAcciones = fila.querySelector('td:last-child');
        tdAcciones.innerHTML = '<span class="text-muted"><i class="bi bi-ban"></i> Cancelada</span>';
        
        alert(' Cita cancelada exitosamente. El espacio ha sido liberado.');
    })
    .catch(error => {
        console.error("Error cancelando cita:", error);
        alert(' Error al cancelar la cita: ' + error.message);
        
        // Restaurar el botón
        boton.innerHTML = textoOriginal;
        boton.disabled = false;
    });
//func cargar citas
function cargarCitas() {
    const tbody = document.getElementById('citas-body');
  
     db.collection('citas').orderBy('fechaCreacion', 'desc').get().then(querySnapshot=> {
    
    
    if (querySnapshot.empty) {
      tbody.innerHTML='<tr><td colspan="6" class="text-center">No hay citas agendadas.</td></tr>'; //vacio??
      return;
    }
    
    tbody.innerHTML = ''; 
    
    querySnapshot.forEach(doc=> {
      const cita =doc.data();       
      const mascotaInfo=`${cita.tipoMascota || ''} (${cita.edad || ''})`;
      tbody.innerHTML += `
        <tr>
          <td><strong>${cita.fecha}</strong></td>
          <td>${cita.hora}</td>
          <td>${cita.usuarioNombre || 'No registrado'}</td>
          <td>${cita.motivo || 'No especificado'}</td>
          <td>${mascotaInfo}</td>
          <td>${cita.usuarioEmail || 'No registrado'}</td>
        </tr>
      `;
    });

  }).catch(error=>{
      console.error("Error al cargar citas: ", error);
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar las citas.</td></tr>';
  });
}