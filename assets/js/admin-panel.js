// CONFIGURACIÓN E INICIALIZACIÓN DE FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyCb7ka8ExRoYk6YykUpKKVMvoKk_JfP2ko",
    authDomain: "petcare-4a63f.firebaseapp.com",
    projectId: "petcare-4a63f",
    storageBucket: "petcare-4a63f.firebasestorage.app",
    messagingSenderId: "443204856539",
    appId: "1:443204856539:web:9f7362bd4a5a468ce27afe",
    measurementId: "G-GSYEF3PB7K"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// REFERENCIAS AL DOM
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

let barridoYaEjecutado = false;

// AUTENTICACIÓN Y GATILLO
auth.onAuthStateChanged(user => {
  if (user) {
    db.collection('usuarios').doc(user.uid).get().then(doc => {
      
      // ¿Es admin?
      if (doc.exists && doc.data().rol === 'administrador') {
        loader.style.display = 'none';    //oculta el loader
        contenido.style.display = 'flex'; //muestra el panel
        //
        
        //
    
        cargarCitas(); 
        mostrarPestanaProductos(); 
        //verificarRecordatorios();
        verificarExistencias();

        // EJECUTAR EL BARRIDO 
        if (!barridoYaEjecutado) {
            console.log("🔒 Ejecutando barrido de recordatorios (Única vez)...");
            ejecutarBarridoRecordatorios(); 
            barridoYaEjecutado = true; 
        }

      } else {
        loader.style.display = 'none';
        errorDiv.style.display = 'block';
        setTimeout(() => { window.location.href = 'index.html' }, 3000);
      }
    });
  } else {
    loader.style.display = 'none';
    errorDiv.innerHTML = 'Debes iniciar sesión. Redirigiendo a login...';
    errorDiv.style.display = 'block';
    setTimeout(() => { window.location.href = 'login.html' }, 3000);
  }
});

// INTERFAZ Y PESTAÑAS
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

// GESTIÓN DE CITAS
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
                            `<button class="btn btn-danger btn-sm btn-cancelar-cita" data-cita-id="${citaId}"><i class="bi bi-x-circle"></i> Cancelar</button>` : 
                            '<span class="text-muted"><i class="bi bi-ban"></i> Cancelada</span>'
                        }
                    </td>
                </tr>
            `;
        });
        agregarEventListenersCancelar();
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
    if (!confirm('¿Deseas cancelar esta cita?')) return;
    
    db.collection('citas').doc(citaId).update({
        estado: 'cancelada',
        fechaCancelacion: firebase.firestore.FieldValue.serverTimestamp(),
        canceladoPor: auth.currentUser.uid
    }).then(() => {
        alert('✅ Cita cancelada exitosamente.');
    }).catch(error => {
        console.error("Error:", error);
        alert('❌ Error al cancelar.');
    });
}

// GESTIÓN DE PRODUCTOS
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
            formProducto.querySelector("button[type=submit]").innerHTML = `<i class="bi bi-save me-2"></i> Actualizar Producto`;
        }
    } catch (error) { console.error(error); }
}

formProducto.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
        aviso: false,
        nombre: document.getElementById('prod-nombre').value,
        categoria: document.getElementById('prod-categoria').value,
        precio: parseFloat(document.getElementById('prod-precio').value),
        descripcion: document.getElementById('prod-desc').value,
        imagenURL: document.getElementById('prod-img').value,
        cantidad: parseInt(document.getElementById('prod-stock').value)
    };

    if (window.productoEditando) {
        await db.collection("productos").doc(window.productoEditando).update(data);
        alert("✅ Actualizado");
        window.productoEditando = null;
    } else {
        await db.collection("productos").add(data);
        alert("✅ Agregado");
        notificarNovedadProducto(data);
    }
    formProducto.reset();
    formProducto.querySelector("button[type=submit]").innerHTML = `<i class="bi bi-plus-circle me-2"></i> Guardar Producto`;
});

// SISTEMA DE CORREOS DE NOVEDADES
async function notificarNovedadProducto(productData) {
    const SERVICE_ID = "service_cbtqa08";
    const TEMPLATE_ID_PRODUCTO_NUEVO = "template_g8pkxxw"
    const USER_ID = 'IFZH0LMLxDTxtyHYl';

    console.log(`📢 Iniciando proceso de notificación de novedad para: ${productData.nombre}`);

    try {
        // Consultar Firebase para obtener los emails de los clientes
        console.log("Buscando correos de clientes...");
        const snapshot = await db.collection('usuarios')
            .where('rol', '==', 'cliente')
            .get();

        const emails = [];
        snapshot.forEach(doc => {
            const userData = doc.data();
            if (userData.mail) { 
                emails.push(userData.mail);
            }
        });

        if (emails.length === 0) {
            console.log("✅ No se encontraron clientes con rol 'cliente' y campo 'mail'. Proceso terminado.");
            return;
        }

        console.log(`   -> Clientes encontrados: ${emails.length}. Iniciando envío individual.`);

        // Iterar y enviar correos con EmailJS
        emails.forEach(email => {
            const templateParams = {
                to_email: email,
                product_name: productData.nombre,
                product_desc: productData.descripcion,
                product_price: productData.precio ? productData.precio.toFixed(2) : 'N/A',
                product_image: productData.imagenURL,
            };

            emailjs.send(SERVICE_ID, TEMPLATE_ID_PRODUCTO_NUEVO, templateParams, USER_ID)
                .then(function() {
                    console.log(`   📧 Correo enviado a: ${email}`);
                }, function(error) {
                    console.error(`   ❌ Falló el envío a ${email}:`, error);
                });
        });

        console.log("✅ Proceso de notificación disparado para todos los clientes.");

    } catch (error) {
        console.error("❌ Error en el proceso de notificación de novedad.", error);
    }
}

// SISTEMA DE RECORDATORIOS 
function ejecutarBarridoRecordatorios() {
    console.log("🧹 Iniciando barrido de recordatorios...");

    const hoy = new Date();
    const manana = new Date(hoy);
    manana.setDate(hoy.getDate() + 1);

    const anio = manana.getFullYear();
    const mes = String(manana.getMonth() + 1).padStart(2, '0');
    const dia = String(manana.getDate()).padStart(2, '0');
    const fechaMañana = `${anio}-${mes}-${dia}`;

    console.log(`📅 Buscando citas para mañana: ${fechaMañana}`);

    db.collection('citas')
      .where('fecha', '==', fechaMañana)
      .where('estado', '==', 'activa')
      .get()
      .then(snapshot => {
          if (snapshot.empty) {
              console.log("✅ No hay citas mañana.");
              return;
          }

          snapshot.forEach(doc => {
              const cita = doc.data();

              // Verificar duplicados
              if (cita.recordatorio_enviado === true) return;

              console.log(`📧 Notificando cita de: ${cita.usuarioNombre}`);

              // A. Datos CLIENTE
              const paramsCliente = {
                  nombre_cliente: cita.usuarioNombre || "Cliente",
                  email_cliente: cita.usuarioEmail,
                  fecha: cita.fecha,
                  hora: cita.hora,
                  motivo: cita.motivo,
                  detalles_mascota: cita.tipoMascota
              };

              // B. Datos ADMIN
              const paramsAdmin = {
                  admin_email: auth.currentUser.email,
                  cliente: cita.usuarioNombre || "Cliente",
                  mascota: cita.tipoMascota,
                  fecha: cita.fecha,
                  hora: cita.hora,
                  motivo: cita.motivo
              };

              // C. Envío Doble
              
              // 1. Enviar al Cliente 
              emailjs.send('service_ealzhrg', 'template_t3urm5m', paramsCliente)
                  .then(() => {
                      console.log("   -> Enviado al Cliente (Recordatorio).");
                      
                      // 2. Enviar al Admin
                      return emailjs.send(
                          'service_i598jeq',      
                          'template_s55vzqs',     
                          paramsAdmin, 
                          '6_MAkWwrqO8cGi32h'     
                      );
                  })
                  .then(() => {
                      console.log("   -> Enviado al Admin.");
                      
                      // 3. Marcar en BD
                      db.collection('citas').doc(doc.id).update({
                          recordatorio_enviado: true
                      });
                  })
                  .catch(err => console.error("❌ Error en envío:", err));
          });
      })
      .catch(error => console.error("Error en barrido:", error));
}

//////
function verificarExistencias() {
  console.log("existencias...");
  db.collection('productos')
            .where('cantidad', '>=', 3)
            .where('aviso', '==', true)
            .get()
            .then(querySnapshot => {
            
            querySnapshot.forEach(doc => {
                // Reiniciar aviso en Firestore
                doc.ref.update({ aviso: false });
            });
        })

  // buscar los productos que casi se acaban
  db.collection('productos')
    .where('cantidad', '<=', 3)
    .where('aviso', '==', false)
    .get()
    .then(querySnapshot => {
      
      if (querySnapshot.empty) {
        console.log("no hay productos con pocas existencias");
        return;
      }

      querySnapshot.forEach(doc => {
        const producto = doc.data();
        
        //recordatorio enviado??
        if (producto.aviso === true) {
          console.log(`aviso del producto: ${producto.nombre} ya fue enviado.`);
          return;
        }

        //enviar correo
        enviarCorreoExistencias(doc.id, producto);
        
      });
    })
    .catch(error => {
      console.error("Error en sistema de recordatorios:", error);
    });
}


function enviarCorreoExistencias(productoId, producto) {
  db.collection('productos').doc(productoId).update({
         aviso: true
  });
  const adminActualEmail = auth.currentUser.email;

  const templateParams = {
    admin_email: adminActualEmail, 
    nombre: producto.nombre,
    categoria: producto.categoria,
    descripcion: producto.descripcion
  };

  //ids del emailjs
  const SERVICE_ID = "service_5bnwel9"; 
  const TEMPLATE_ID = "template_0cm1vtl";
  emailjs.init("1qL01MblVxUVPNyxY");

  emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams)
    .then(function(response) {
       console.log('correo de productos enviado a ', adminActualEmail);
       
       //enviado
       
       
    }, function(error) {
       console.error('FAILED...', error);
    });
}