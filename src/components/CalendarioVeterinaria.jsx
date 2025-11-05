import React, { useState } from "react";
import "./CalendarioVeterinaria.css";

function CalendarioVeterinaria() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");
  const [horaSeleccionada, setHoraSeleccionada] = useState("");

  const manejarCita = (e) => {
    e.preventDefault();
    if (!fechaSeleccionada || !horaSeleccionada) {
      alert("Por favor selecciona una fecha y hora para tu cita ");
      return;
    }
    alert(` Cita agendada para el ${fechaSeleccionada} a las ${horaSeleccionada}. ¡Gracias por confiar en VetCare!`);
  };

  return (
    <section className="calendario-section">
      <div className="calendario-card">
        <h2 className="titulo-calendario">Agenda tu Cita Veterinaria</h2>
        <div className="linea-verde"></div>

        <p className="texto-calendario">
          Selecciona el día y la hora que mejor se ajusten para cuidar a tu compañero.
        </p>

        <form onSubmit={manejarCita} className="form-calendario">
          <label htmlFor="fecha"> Fecha</label>
          <input
            id="fecha"
            type="date"
            className="input-calendario"
            value={fechaSeleccionada}
            onChange={(e) => setFechaSeleccionada(e.target.value)}
          />

          <label htmlFor="hora"> Hora</label>
          <input
            id="hora"
            type="time"
            className="input-calendario"
            value={horaSeleccionada}
            onChange={(e) => setHoraSeleccionada(e.target.value)}
          />

          <button type="submit" className="btn-agendar">
            Confirmar Cita
          </button>
        </form>
      </div>
    </section>
  );
}

export default CalendarioVeterinaria;

