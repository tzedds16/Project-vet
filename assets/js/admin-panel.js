
const loader = document.getElementById('admin-loader');
const errorDiv = document.getElementById('admin-error');
const contenido = document.getElementById('admin-contenido');

const seccionCitas = document.getElementById('contenido-citas');
const seccionProductos = document.getElementById('contenido-productos');

const btnCitas = document.getElementById('btn-ver-citas');
const btnProductos = document.getElementById('btn-agregar-producto');

const formProducto = document.getElementById('form-agregar-producto');



auth.onAuthStateChanged(user => {
  if (user) {
    
    db.collection('usuarios').doc(user.uid).get().then(doc => {
      
      //admin??
      if (doc.exists && doc.data().rol === 'administrador') {
        loader.style.display = 'none';    //oculta el loader
        contenido.style.display = 'flex'; //muestra el panel
        
    
        cargarCitas(); 
        mostrarPestanaProductos(); 

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

btnCitas.addEventListener('click', (e) => {
  e.preventDefault(); 
  seccionCitas.style.display = 'block';
  seccionProductos.style.display = 'none';
  
  btnCitas.classList.add('active');
  btnProductos.classList.remove('active');
});


btnProductos.addEventListener('click', (e) => {
  e.preventDefault(); 
  mostrarPestanaProductos(); 
});


function mostrarPestanaProductos() {
  seccionCitas.style.display = 'none';
  seccionProductos.style.display = 'block';
  
  btnCitas.classList.remove('active');
  btnProductos.classList.add('active');
}



function cargarCitas() {
    const tbody = document.getElementById('citas-body');
    
    db.collection('citas').orderBy('fechaCreacion', 'desc').onSnapshot(querySnapshot => {
        
        if (querySnapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No hay citas agendadas.</td></tr>';
            return;
        }
        tbody.innerHTML = ''; 
        
        querySnapshot.forEach(doc => {
            const cita = doc.data();       
            const citaId = doc.id;
            const mascotaInfo = `${cita.tipoMascota || ''} (${cita.edad || ''})`;
            
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
                    <td><span class="${badgeClass}">${estado}</span></td>
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

        agregarEventListenersCancelar();

    }, error => { 
        console.error("Error al cargar citas en tiempo real: ", error);
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Error al cargar las citas.</td></tr>';
    });
}

function agregarEventListenersCancelar() {
    const botonesCancelar = document.querySelectorAll('.btn-cancelar-cita');
    
    botonesCancelar.forEach(boton => {
        boton.addEventListener('click', function() {
            const citaId = this.getAttribute('data-cita-id');
            cancelarCita(citaId);
        });
    });
}

function cancelarCita(citaId) {
    if (!confirm('¿Estás seguro de que deseas cancelar esta cita?\n\nEsta acción liberará el espacio para otros clientes.')) {
        return;
    }
    
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
        alert('✅ Cita cancelada exitosamente. El espacio ha sido liberado.');
    })
    .catch(error => {
        console.error("Error cancelando cita:", error);
        alert('❌ Error al cancelar la cita: ' + error.message);
        
        // Si falla, sí restauramos el botón
        boton.innerHTML = textoOriginal;
        boton.disabled = false;
    });
}



//agg producto
formProducto.addEventListener('submit', (e) => {
  e.preventDefault(); 
  const nombre = document.getElementById('prod-nombre').value;
  const categoria = document.getElementById('prod-categoria').value;
  const precio = parseFloat(document.getElementById('prod-precio').value);
  const descripcion = document.getElementById('prod-desc').value;
  const imagenURL = document.getElementById('prod-img').value;
  const stock = parseInt(document.getElementById('prod-stock').value);


  db.collection('productos').add({
    nombre: nombre,
    categoria: categoria,
    precio: precio,
    descripcion: descripcion,
    imagenURL: imagenURL ,
    cantidad: stock
  })
  .then((docRef) => {
   
    alert(`✅ ¡Producto "${nombre}" agregado con éxito!`);
    formProducto.reset(); 
  })
  .catch((error) => {
  
    console.error("Error al agregar producto: ", error);
    alert('❌ Error al agregar producto: ' + error.message);
  });
});