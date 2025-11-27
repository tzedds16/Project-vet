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
    firebase.initializeApp(firebaseConfig)
}

const auth = firebase.auth();
const db = firebase.firestore();

// REFERENCIAS A ELEMENTOS DOM

const loader = document.getElementById('client-loader');
const errorDiv = document.getElementById('client-error');
const citasContainer = document.getElementById('citas-container');
const welcomeMessage = document.getElementById('welcomeMessage');
const logoutBtn = document.getElementById('logoutBtn');

const form = document.getElementById("form-calendario");
const fechacita = document.getElementById("fecha");
const horacita = document.getElementById("hora");
const tipoMascota = document.getElementById('tipoMascota');
const labelTallaPerro = document.getElementById('labelTallaPerro');
const tallaPerro = document.getElementById('tallaPerro');

// LÓGICA DEL FORMULARIO

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

    // Lógica de cambio de fecha (Evita domingos y actualiza horas)
    fechacita.addEventListener("change", function () {
        // Fix para zonas horarias al crear fecha desde string
        const fechaPartes = this.value.split('-');
        const fecha = new Date(fechaPartes[0], fechaPartes[1] - 1, fechaPartes[2]);
        
        if (fecha.getDay() === 0) { 
            alert("Los domingos no están disponibles para citas.");
            this.value = "";
        } else {
            actualizarHorasOcupadas();
        }
    });

    // EVENTO SUBMIT: GUARDAR CITA Y ENVIAR CORREO

    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        const fecha = fechacita.value;
        const hora = horacita.value;
        const motivo = document.getElementById("motivo").value;
        const edad = document.getElementById("edad").value;
        const tipoMascota = document.getElementById("tipoMascota").value;
        const tallaPerro = document.getElementById("tallaPerro").value;

        const user = auth.currentUser;

        // Validaciones
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
            // Verificar disponibilidad en BD
            const consulta = await db.collection('citas')
                .where('fecha', '==', fecha)
                .where('hora', '==', hora)
                .where("estado", "in", ["activa", null])
                .get();

            if (!consulta.empty) {
                alert("La fecha y hora de la cita ya no están disponibles.");
                actualizarHorasOcupadas();
                return;
            }

            // Crear objeto cita
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

            // GUARDAR EN FIREBASE
            const docRef = await db.collection('citas').add(nuevaCita);
            console.log("Cita guardada con ID:", docRef.id);

            //  ENVIAR CORREO DE CONFIRMACIÓN (EMAILJS)
        
            // Feedback visual en el botón
            const btnSubmit = form.querySelector('button[type="submit"]');
            if (btnSubmit) {
                btnSubmit.textContent = "Enviando confirmación...";
                btnSubmit.disabled = true;
            }

            // Preparar detalles de mascota
            let infoMascota = `${tipoMascota.toUpperCase()} (${edad})`;
            if (tipoMascota === 'perro' && tallaPerro) {
                infoMascota += ` - Talla ${tallaPerro}`;
            }

            // Datos para la plantilla
            const templateParams = {
                nombre_cliente: user.displayName || "Cliente",
                email_cliente: user.email, 
                fecha: fecha,
                hora: hora,
                motivo: motivo,
                detalles_mascota: infoMascota
            };

            // Enviar usando tus credenciales
            emailjs.send('service_ealzhrg', 'template_uq5qsmu', templateParams)
                .then(() => {
                    alert("✅ ¡Cita agendada! Te hemos enviado un correo de confirmación.");
                    window.location.href = 'calendarioCliente.html';
                })
                .catch((err) => {
                    console.error("Error enviando correo:", err);
                    // Redirigimos igual porque la cita YA se guardó en Firebase
                    alert("✅ Cita agendada correctamente.");
                    window.location.href = 'calendarioCliente.html';
                });

        } catch (error) {
            alert("Error al agendar la cita. Intenta de nuevo.");
            console.error("Error:", error);
            const btnSubmit = form.querySelector('button[type="submit"]');
            if (btnSubmit) {
                btnSubmit.textContent = "Confirmar Cita";
                btnSubmit.disabled = false;
            }
        }
    });
}

// 4. FUNCIONES AUXILIARES 

function CargarHoras() {
    horacita.innerHTML = ''; 
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
        const dbResponse = await db.collection("citas")
            .where("fecha", "==", fechaSeleccionada)
            .where("estado", "in", ["activa", null])
            .get();

        const bookedHours = dbResponse.docs.map((appointmentDoc) => {
            return appointmentDoc.data().hora;
        });

        [...horacita.options].forEach((option) => {
            const hour = option.value;
            if (!hour) return;
            const isBooked = bookedHours.includes(hour);
            
            const horaOpcion = parseInt(hour.split(":")[0]);
            const minutoOpcion = parseInt(hour.split(":")[1]);

            let isPast = false;
            if (fechaSeleccionada === hoy) {
                if (horaOpcion < horaActual) {
                    isPast = true;
                } else if (horaOpcion === horaActual) {
                    if (minutoOpcion < minutoActual) {
                        isPast = true;
                    }
                }
            }

            option.disabled = isBooked || isPast;
            if (isBooked) {
                option.style.backgroundColor = "#f8d7da";
            } else if (isPast) {
                option.style.backgroundColor = "#e9ecef";
            } else {
                option.style.backgroundColor = "";
            }
        });
    } catch (error) {
        console.error("Error al actualizar horas ocupadas:", error);
    }
}

// Establecer fecha mínima (Hoy)
const inputFecha = document.getElementById('fecha');
const hoyObjeto = new Date();
const anio = hoyObjeto.getFullYear();
const mes = String(hoyObjeto.getMonth() + 1).padStart(2, '0');
const dia = String(hoyObjeto.getDate()).padStart(2, '0');
const hoy = `${anio}-${mes}-${dia}`;
inputFecha.setAttribute('min', hoy);
inputFecha.value = hoy;


// LISTENER PRINCIPAL DE AUTENTICACIÓN
auth.onAuthStateChanged(user => {
    // Reset UI
    loader.style.display = 'block';
    citasContainer.style.display = 'none';
    errorDiv.style.display = 'none';
    welcomeMessage.classList.add('d-none');
    logoutBtn.classList.add('d-none');

    if (user) {
        // Usuario Logueado
        welcomeMessage.textContent = `👋 Bienvenid@, ${user.displayName || user.email}`;
        welcomeMessage.classList.remove('d-none');
        logoutBtn.classList.remove('d-none');
        
        // Inicializar Formulario
        CargarHoras(); 
        inicializarFormularioListeners(); 
        actualizarHorasOcupadas();

        // Mostrar Formulario
        loader.style.display = 'none';
        citasContainer.style.display = 'block';

        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                window.location.href = 'index.html';
            });
        });

    } else {
        // Usuario No Logueado
        loader.style.display = 'none';
        errorDiv.textContent = 'Debes iniciar sesión para agendar una cita. Redirigiendo...';
        errorDiv.style.display = 'block';
        setTimeout(() => { window.location.href = 'login.html' }, 3000);
    }
});