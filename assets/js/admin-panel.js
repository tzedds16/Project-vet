
const loader = document.getElementById('admin-loader');
const errorDiv = document.getElementById('admin-error');
const contenido = document.getElementById('admin-contenido');

const seccionCitas = document.getElementById('contenido-citas');
const seccionProductos = document.getElementById('contenido-productos');

const btnCitas = document.getElementById('btn-ver-citas');
const btnProductos = document.getElementById('btn-agregar-producto');

const formProducto = document.getElementById('form-agregar-producto');


const params = new URLSearchParams(window.location.search);
const idEditar = params.get("id");

if (idEditar) {
    cargarProductoParaEditar(idEditar);
}

auth.onAuthStateChanged(user => {
  if (user) {
    
    db.collection('usuarios').doc(user.uid).get().then(doc => {
      
      //admin??
      if (doc.exists && doc.data().rol === 'administrador') {
        loader.style.display = 'none';    //oculta el loader
        contenido.style.display = 'flex'; //muestra el panel
        
        cargarCitas(); 
        verificarRecordatorios(); 

      } else {
         //no es admin
        loader.style.display = 'none';
        errorDiv.style.display = 'block';
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
        console.error("Error al cargar citas: ", error);
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
    if (!confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
        return;
    }
    
    const boton = document.querySelector(`.btn-cancelar-cita[data-cita-id="${citaId}"]`);
    const textoOriginal = boton.innerHTML;
    boton.innerHTML = '<i class="bi bi-hourglass-split"></i>...';
    boton.disabled = true;
    
    db.collection('citas').doc(citaId).update({
        estado: 'cancelada',
        fechaCancelacion: firebase.firestore.FieldValue.serverTimestamp(),
        canceladoPor: auth.currentUser.uid,
        canceladoPorNombre: auth.currentUser.displayName || 'Administrador'
    })
    .then(() => {
        alert('✅ Cita cancelada exitosamente.');
    })
    .catch(error => {
        console.error("Error:", error);
        alert('❌ Error: ' + error.message);
        boton.innerHTML = textoOriginal;
        boton.disabled = false;
    });
}



async function cargarProductoParaEditar(id) {
    try {
        const docProd = await db.collection("productos").doc(id).get();

        if (docProd.exists) {
            const p = docProd.data();
            document.getElementById("prod-nombre").value = p.nombre;
            document.getElementById("prod-categoria").value = p.categoria;
            document.getElementById("prod-precio").value = p.precio;
            document.getElementById("prod-desc").value = p.descripcion;
            document.getElementById("prod-img").value = p.imagenURL;
            document.getElementById("prod-stock").value = p.cantidad;

            window.productoEditando = id;
            formProducto.querySelector("button[type=submit]").innerHTML =
                `<i class="bi bi-save me-2"></i> Actualizar Producto`;
            
            mostrarPestanaProductos(); 
        } else {
            alert("❌ No se encontró el producto.");
        }
    } catch (error) {
        console.error(error);
    }
}

formProducto.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('prod-nombre').value;
    const categoria = document.getElementById('prod-categoria').value;
    const precio = parseFloat(document.getElementById('prod-precio').value);
    const descripcion = document.getElementById('prod-desc').value;
    const imagenURL = document.getElementById('prod-img').value;
    const stock = parseInt(document.getElementById('prod-stock').value);

    const data = { nombre, categoria, precio, descripcion, imagenURL, cantidad: stock };

    if (window.productoEditando) {
        // EDITAR
        try {
            await db.collection("productos").doc(window.productoEditando).update(data);
            alert("✅ Producto actualizado correctamente.");
            window.productoEditando = null;
            formProducto.reset();
            formProducto.querySelector("button[type=submit]").innerHTML =
                `<i class="bi bi-plus-circle me-2"></i> Guardar Producto`;
        } catch (error) {
            console.error(error);
            alert("❌ Error al actualizar producto.");
        }
    } else {
        // CREAR
        db.collection("productos").add(data)
            .then(() => {
                alert(`✔ Producto agregado con éxito`);
                formProducto.reset();
            })
            .catch(error => {
                alert("❌ Error al agregar producto");
                console.error(error);
            });
    }
});


function verificarRecordatorios() {
  console.log("Sistema: Iniciando chequeo de recordatorios...");
  
  //fecha mañana
  const hoy = new Date();
  const manana = new Date(hoy);
  manana.setDate(hoy.getDate() + 1);
  
  //2025-11-21
  const anio = manana.getFullYear();
  const mes = String(manana.getMonth() + 1).padStart(2, '0');
  const dia = String(manana.getDate()).padStart(2, '0');
  const fechaManana = `${anio}-${mes}-${dia}`;

  console.log("Buscando citas para:", fechaManana);

  //citas mañana??
  db.collection('citas')
    .where('fecha', '==', fechaManana)
    .where('estado', '==', 'activa') //solo citas con status act
    .get()
    .then(querySnapshot => {
      
      if (querySnapshot.empty) {
        console.log("✅ No hay citas para mañana. Todo tranquilo.");
        return;
      }

      querySnapshot.forEach(doc => {
        const cita = doc.data();
        
        if (cita.recordatorioEnviado === true) {
          console.log(` Recordatorio para ${cita.hora} ya fue enviado antes.`);
          return;
        }

        // enviar correo
        enviarCorreoRecordatorio(doc.id, cita);
      });
    })
    .catch(error => {
      console.error("Error en sistema de recordatorios:", error);
    });
}

function enviarCorreoRecordatorio(citaId, cita) {
    
  //correo admin logueado
  const adminActualEmail = auth.currentUser.email;

  const templateParams = {
    //emailjs
    admin_email: adminActualEmail, 

    fecha: cita.fecha,
    hora: cita.hora,
    cliente: cita.usuarioNombre || "Cliente",
    mascota: cita.tipoMascota || "Mascota",
    motivo: cita.motivo || "Consulta"
  };

 const SERVICE_ID = "service_i598jeq";   
 const TEMPLATE_ID = "template_s55vzqs"; 

  emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams)
    .then(function(response) {
       console.log(' Correo enviado a', adminActualEmail, response.status, response.text);
       
       //marcar como enviado en la BD para no repetir
       db.collection('citas').doc(citaId).update({
         recordatorioEnviado: true
       });
       
    }, function(error) {
       console.error('FAILED...', error);
    });
}