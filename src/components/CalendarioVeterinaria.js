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

  // Esto comprueba el estado de la sesión EN CUANTO carga la página
  auth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.replace ("../../login.html");
  }
  });

  
  const form = document.getElementById("form-calendario");
  const fechacita = document.getElementById("fecha");
  const horacita = document.getElementById("hora");

  const tipoMascota = document.getElementById('tipoMascota');
  const labelTallaPerro = document.getElementById('labelTallaPerro');
  const tallaPerro = document.getElementById('tallaPerro');

  if (tipoMascota && tallaPerro && labelTallaPerro) {
      tipoMascota.addEventListener('change', () => {
        console.log('Perro o gato', tipoMascota.value)
        if (tipoMascota.value === 'perro') {
          labelTallaPerro.style.display = 'flex'; // <-- 'flex' para que se vea igual que los otros labels
          tallaPerro.style.display = 'block';    // <-- 'block' para el select
          tallaPerro.required = true;
        }
          else{
            labelTallaPerro.style.display = 'none'; // <-- Oculta el label
            tallaPerro.style.display = 'none';    // <-- Oculta el select
            tallaPerro.required = false
            tallaPerro.value = ""
          }
      })
    }

  function CargarHoras() {
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Seleccione una hora";
    placeholder.selected = true; // Aparece por defecto
    placeholder.hidden = true;
    horacita.appendChild(placeholder)
    
    const horas = [];
    for (let h = 8; h <=20; h++) {
      horas.push(`${String(h).padStart(2, "0")}:00`);//Añade la hora :00
      if (h<20) {
        horas.push(`${String(h).padStart(2, "0")}:30`);//Añade la hora :30
      }
    }

    horas.forEach((hora) => {
      const opcion = document.createElement("option");
      opcion.value = hora;
      opcion.textContent = hora;
      horacita.appendChild(opcion);
    });
  }


  const inputFecha = document.getElementById('fecha');
  const hoyObjeto = new Date(); // Obtiene la fecha/hora local
  const anio = hoyObjeto.getFullYear();
  const mes = String(hoyObjeto.getMonth() + 1).padStart(2, '0'); // +1 porque Enero es 0
  const dia = String(hoyObjeto.getDate()).padStart(2, '0');
  const hoy = `${anio}-${mes}-${dia}`; // Crea el string "YYYY-MM-DD" local
  inputFecha.setAttribute('min', hoy);
  inputFecha.value = hoy 


  fechacita.addEventListener("change", function () {
    const fecha = new Date(this.value);
    if (fecha.getDay() === 6) {
      alert("Los domingos no están disponibles para citas.");
      this.value = "";
    } else {
      actualizarHorasOcupadas();
    }
  });


  async function actualizarHorasOcupadas() {
    const fechaSeleccionada = fechacita.value;
    if (!fechaSeleccionada)return; // detiene la funcion si no hay fecha seleccionada

    const ahora = new Date(); // Obtenemos la fecha y hora del momento de la consulta
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    const hoy = `${anio}-${mes}-${dia}`; // Crea el string "YYYY-MM-DD" local
    const horaActual = ahora.getHours();
    const minutoActual = ahora.getMinutes();


    const dbResponse = await db.collection("citas")
    .where("fecha", "==", fechaSeleccionada)
    .where("estado", "in", ["activa", null]) // Incluye activas y citas antiguas sin estado
    .get();
    /*const dbResponse = await db.collection("citas").where("fecha" , "==", fechaSeleccionada).get()*/

    const bookedHours = dbResponse.docs.map((appointmentDoc) => {  //ayuda a limpiar todo el arreglo de citas de dbresponse para solo obtner la hora
      return appointmentDoc.data().hora;
    });

    //--Esta parte actualiza las opciones del select disponibles--
    [...horacita.options].forEach((option) => {
    
    const hour = option.value; //devuelve por ejemplo: "09:00"
    if(!hour) return;
    const isBooked = bookedHours.includes(hour);//variable true o false que dice si la hora esta ocupada

    const horaOpcion = parseInt(hour.split(":")[0]);
    const minutoOpcion = parseInt(hour.split(":")[1]); // Ej: 00

    let isPast = false; 
    if (fechaSeleccionada === hoy) {
      if (horaOpcion < horaActual) {
        isPast = true;
      }else if (horaOpcion === horaActual) {
        if (minutoOpcion < minutoActual) {
          isPast = true;
        }
      }
    }
    
    
    option.disabled = isBooked || isPast; //desabilida la opcion en caso de que ya este la hora ocupada o sea una antigua
    
    if (isBooked) {
      option.style.backgroundColor = "#f8d7da"; // Rojo (Ocupado)
    } else if (isPast) {
      option.style.backgroundColor = "#e9ecef"; // Gris (Ya pasó)
    } else {
      option.style.backgroundColor = ""; // Disponible
    }
  });
   
  }



  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const fecha = fechacita.value;
    const hora = horacita.value;

    //campos del formulario actualiazdo
    const motivo = document.getElementById("motivo").value;
    const edad = document.getElementById("edad").value;
    const tipoMascota = document.getElementById("tipoMascota").value;
    const tallaPerro = document.getElementById("tallaPerro").value; // Estará vacío si es 'gato'

    

    const user = auth.currentUser; //obtiene el usuario actual

    if (!user) {
      alert("Debes iniciar sesion para agendar una cita")
      return;
    }
    if (!fecha || !hora || !motivo || !tipoMascota ) {
      alert("Por favor selecciona una fecha y una hora para tu cita");
      return;
    }

    if (tipoMascota === 'perro' && !tallaPerro) {
    alert("Por favor, selecciona la talla.");
    return;
  }

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
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (tipoMascota === 'perro') {
      nuevaCita.tallaPerro = tallaPerro;
    }
    
    const docRef = await db.collection('citas').add(nuevaCita);

      alert(`Cita agendada para el ${fecha} a las ${hora}. Gracias por confiar en vetcare`)
      console.log("Cita guardada con id:", docRef.id)
      horacita.value=""; //reseta el selects
      actualizarHorasOcupadas();

    } catch (error) {
      alert("Error al agendar la cita. Intenta de nuevo");
      console.log("Error al agendar la cita", error)
    }

  });
  CargarHoras();
  actualizarHorasOcupadas(); 

  