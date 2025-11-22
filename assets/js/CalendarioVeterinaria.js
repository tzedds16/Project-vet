// ==================================================
// 1. CONFIGURACIÓN E INICIALIZACIÓN DE FIREBASE
// ==================================================
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
    firebase.initializeApp(firebaseConfig)
}

const auth = firebase.auth();
const db = firebase.firestore();

// ==================================================
// 2. REFERENCIAS A ELEMENTOS DOM DE CONTROL Y FORMULARIO
// ==================================================

// Elementos de control de interfaz (necesarios para el nuevo listener)
const loader = document.getElementById('client-loader');
const errorDiv = document.getElementById('client-error');
const citasContainer = document.getElementById('citas-container'); // Contenedor del formulario
const welcomeMessage = document.getElementById('welcomeMessage');
const logoutBtn = document.getElementById('logoutBtn');

// Elementos del formulario (existentes)
const form = document.getElementById("form-calendario");
const fechacita = document.getElementById("fecha");
const horacita = document.getElementById("hora");
const tipoMascota = document.getElementById('tipoMascota');
const labelTallaPerro = document.getElementById('labelTallaPerro');
const tallaPerro = document.getElementById('tallaPerro');

// ==================================================
// 3. LÓGICA DEL FORMULARIO 
// ==================================================

//Inicializa los listeners de cambio y el evento submit del formulario.
 
function inicializarFormularioListeners() {
    // Lógica para mostrar/ocultar Talla del Perro
    if (tipoMascota && tallaPerro && labelTallaPerro) {
        tipoMascota.addEventListener('change', () => {
            if (tipoMascota.value === 'perro') {
                labelTallaPerro.style.display = 'flex';
                tallaPerro.style.display = 'block';
                tallaPerro.required = true;
            } else {
                labelTallaPerro.style.display = 'none';
                tallaPerro.style.display = 'none';
                tallaPerro.required = false
                tallaPerro.value = ""
            }
        })
    }

    // Lógica de cambio de fecha (Verifica Domingos)
    fechacita.addEventListener("change", function () {
        const fecha = new Date(this.value.replace(/-/g, '/')); // Corregir formato de fecha para new Date
        if (fecha.getDay() === 0) { // getDay() devuelve 0 para Domingo
            alert("Los domingos no están disponibles para citas.");
            this.value = "";
        } else {
            actualizarHorasOcupadas();
        }
    });

    // Lógica de Envío de Formulario
    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        const fecha = fechacita.value;
        const hora = horacita.value;

        // Campos del formulario actualizados
        const motivo = document.getElementById("motivo").value;
        const edad = document.getElementById("edad").value;
        const tipoMascota = document.getElementById("tipoMascota").value;
        const tallaPerro = document.getElementById("tallaPerro").value;

        const user = auth.currentUser;

        if (!user) {
            alert("Debes iniciar sesión para agendar una cita");
            return;
        }
        if (!fecha || !hora || !motivo || !tipoMascota) {
            alert("Por favor completa todos los campos obligatorios");
            return;
        }

        if (tipoMascota === 'perro' && !tallaPerro) {
            alert("Por favor, selecciona la talla.");
            return;
        }

        try {
            // Verifica disponibilidad final
            const consulta = await db.collection('citas')
                .where('fecha', '==', fecha)
                .where('hora', '==', hora)
                .where("estado", "in", ["activa", null])
                .get();

            if (!consulta.empty) {
                alert("La fecha y hora de la cita ya no están disponibles. Por favor, selecciona otra hora.");
                actualizarHorasOcupadas();
                return;
            }

            const nuevaCita = {
                fecha: fecha,
                hora: hora,
                usuarioId: user.uid,
                usuarioNombre: user.displayName || 'N/A',
                usuarioEmail: user.email,
                motivo: motivo,
                tipoMascota: tipoMascota,
                edad: edad,
                estado: 'activa',
                fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (tipoMascota === 'perro') {
                nuevaCita.tallaPerro = tallaPerro;
            }

            await db.collection('citas').add(nuevaCita);

            // Redirige al cliente a su panel de citas después de agendar
            window.location.href = 'calendarioCliente.html';
        } catch (error) {
            alert("Error al agendar la cita. Intenta de nuevo.");
            console.error("Error al agendar la cita", error);
        }
    });
}

//Llena el select de horas (Horas enteras y medias de 8:00 a 20:30).

function CargarHoras() {
    horacita.innerHTML = ''; // Limpiar opciones anteriores
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Seleccione una hora";
    placeholder.selected = true;
    placeholder.hidden = true;
    horacita.appendChild(placeholder)

    const horas = [];
    for (let h = 8; h <= 20; h++) {
        horas.push(`${String(h).padStart(2, "0")}:00`);
        if (h < 20) {
            horas.push(`${String(h).padStart(2, "0")}:30`);
        }
    }

    horas.forEach((hora) => {
        const opcion = document.createElement("option");
        opcion.value = hora;
        opcion.textContent = hora;
        horacita.appendChild(opcion);
    });
}

// Consulta las horas ocupadas en Firestore y las deshabilita en el selector.

async function actualizarHorasOcupadas() {
    const fechaSeleccionada = fechacita.value;
    if (!fechaSeleccionada) return;

    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    const hoy = `${anio}-${mes}-${dia}`;
    const horaActual = ahora.getHours();
    const minutoActual = ahora.getMinutes();

    try {
      const consulta = await db.collection('citas')
      .where('fecha', '==', fecha)
      .where('hora', '==', hora)
      .where("estado", "in", ["activa", null]) // Solo verificar citas activas
      .get();

      if (!consulta.empty) {
        alert("La fecha de la cita no esta disponible")
        actualizarHorasOcupadas();
        return;
      }

      const nuevaCita = {
      fecha: fecha,
      hora: hora,
      // Datos del usuario
      usuarioId: user.uid,
      usuarioNombre: user.displayName,
      usuarioEmail: user.email,
      // Datos de la mascota 
      motivo: motivo,
      tipoMascota: tipoMascota,
      edad: edad,
      estado: 'activa',
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (tipoMascota === 'perro') {
      nuevaCita.tallaPerro = tallaPerro;
    }
    
    const docRef = await db.collection('citas').add(nuevaCita);

      window.location.href = 'calendarioCliente.html'
      console.log("Cita guardada con id:", docRef.id)

      // Correo
      let infoMascota = `${tipoMascota.toUpperCase()} (${edad})`;
      if (tipoMascota === 'perro' && tallaPerro) {
        infoMascota += ` - Talla ${tallaPerro}`;
      }

      const templateParams = {
        nombre_cliente: user.displayName || "Cliente",
        email_cliente: user.email, 
        fecha: fecha,
        hora: hora,
        motivo: motivo,
        detalles_mascota: infoMascota
      };

      // Cambiar texto del botón visualmente
      const btnSubmit = form.querySelector('button[type="submit"]');
      if (btnSubmit) {
        btnSubmit.textContent = "Enviando confirmación...";
        btnSubmit.disabled = true;
      }

      // Enviar el correo
      emailjs.send('service_w3cv2zd', 'template_uq5qsmu', templateParams)
        .then(() => {
          alert("✅ Cita agendada y correo de confirmación enviado.");
          window.location.href = 'calendarioCliente.html';
        })
        .catch((err) => {
          console.error("Error enviando correo (pero la cita se guardó):", err);
          // Redirigimos igual porque en Firebase YA ESTÁ guardada
          alert("✅ Cita agendada correctamente.");
          window.location.href = 'calendarioCliente.html';
        });

    } catch (error) {
        console.error("Error al actualizar horas ocupadas:", error);
    }
}

// Establecer la fecha mínima y valor por defecto (se mantiene aquí)
const inputFecha = document.getElementById('fecha');
const hoyObjeto = new Date();
const anio = hoyObjeto.getFullYear();
const mes = String(hoyObjeto.getMonth() + 1).padStart(2, '0');
const dia = String(hoyObjeto.getDate()).padStart(2, '0');
const hoy = `${anio}-${mes}-${dia}`;
inputFecha.setAttribute('min', hoy);
inputFecha.value = hoy;


// ==================================================
// 4. LISTENER PRINCIPAL DE AUTENTICACIÓN (INTEGRADO)
// ==================================================
auth.onAuthStateChanged(user => {
    // 1. Mostrar el loader al inicio de la verificación
    loader.style.display = 'block';
    citasContainer.style.display = 'none';
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
    welcomeMessage.classList.add('d-none');
    logoutBtn.classList.add('d-none');

    if (user) {
        // 2. USUARIO LOGUEADO
        
        // Muestra mensaje de bienvenida
        welcomeMessage.textContent = `👋 Bienvenid@, ${user.displayName || user.email}`;
        welcomeMessage.classList.remove('d-none');
        logoutBtn.classList.remove('d-none');
        
        // Inicializa el contenido y listeners del formulario
        CargarHoras(); // Rellena el select de horas
        inicializarFormularioListeners(); // Configura el comportamiento del form
        actualizarHorasOcupadas(); // Deshabilita horas no disponibles inicialmente

        // Oculta el loader y muestra el formulario
        loader.style.display = 'none';
        citasContainer.style.display = 'block';

        // 3. Manejar el clic en "Cerrar sesión"
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                // Redirigir después de cerrar sesión
                window.location.href = 'index.html';
            });
        });

    } else {
        // 4. USUARIO NO LOGUEADO
        
        // Oculta el loader
        loader.style.display = 'none';

        // Muestra error y redirige
        errorDiv.textContent = 'Debes iniciar sesión para agendar una cita. Redirigiendo a login...';
        errorDiv.style.display = 'block';
        
        // Redirigir después de 3 segundos
        setTimeout(() => { window.location.href = 'login.html' }, 3000);
    }
});

  