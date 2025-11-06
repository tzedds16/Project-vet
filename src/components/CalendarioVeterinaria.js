const form = document.getElementById("form-calendario");
  const fechaInput = document.getElementById("fecha");
  const horaSelect = document.getElementById("hora");

  function cargarHoras() {
    const horas = [];
    for (let h = 8; h <= 19.5; h++) {
      horas.push(`${String(h).padStart(2, "0")}:00`);
      horas.push(`${String(h).padStart(2, "0")}:30`);
    }
    horas.forEach((hora) => {
      const option = document.createElement("option");
      option.value = hora;
      option.textContent = hora;
      horaSelect.appendChild(option);
    });
  }

  
    const inputFecha = document.getElementById('fecha');
    const hoy = new Date().toISOString().split('T')[0];
    inputFecha.setAttribute('min', hoy);


  fechaInput.addEventListener("change", function () {
    const fecha = new Date(this.value);
    if (fecha.getDay() === 6) {
      alert("Los domingos no están disponibles para citas.");
      this.value = "";
    } else {
      actualizarHorasOcupadas();
    }
  });

  function actualizarHorasOcupadas() {
    const citas = JSON.parse(localStorage.getItem("citas") || "[]");
    const fechaSeleccionada = fechaInput.value;
    [...horaSelect.options].forEach((option) => {
      const hora = option.value;
      const reservada = citas.some(
        (cita) => cita.fecha === fechaSeleccionada && cita.hora === hora
      );
      option.disabled = reservada;
      option.style.backgroundColor = reservada ? "#f8d7da" : "";
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const fecha = fechaInput.value;
    const hora = horaSelect.value;

    if (!fecha || !hora) {
      alert("Por favor selecciona una fecha y hora para tu cita.");
      return;
    }

    const citas = JSON.parse(localStorage.getItem("citas") || "[]");
    const yaOcupada = citas.some(
      (cita) => cita.fecha === fecha && cita.hora === hora
    );

    if (yaOcupada) {
      alert("Esta fecha y hora ya están ocupadas. Por favor elige otra.");
      return;
    }

    citas.push({ fecha, hora });
    localStorage.setItem("citas", JSON.stringify(citas));

    alert(`Cita agendada para el ${fecha} a las ${hora}. ¡Gracias por confiar en VetCare!`);

    actualizarHorasOcupadas();
  });

  cargarHoras();