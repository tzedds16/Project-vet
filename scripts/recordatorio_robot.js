// Archivo: scripts/recordatorio_robot.js
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

// 1. Conectar a Firebase usando credenciales secretas (Inyectadas por GitHub)
const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 2. Configurar el "Cartero" (Usando Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Tu correo Gmail
    pass: process.env.EMAIL_PASS  // Tu Contraseña de Aplicación (App Password)
  }
});

async function correrRobot() {
  console.log(" Robot de Recordatorios iniciando...");

  // A. Calcular fecha de MAÑANA
  const hoy = new Date();
  const manana = new Date(hoy);
  manana.setDate(hoy.getDate() + 1);
  
  // Formato YYYY-MM-DD (Igual que en tu base de datos)
  const anio = manana.getFullYear();
  const mes = String(manana.getMonth() + 1).padStart(2, '0');
  const dia = String(manana.getDate()).padStart(2, '0');
  const fechaBusqueda = `${anio}-${mes}-${dia}`;

  console.log(` Buscando citas para la fecha: ${fechaBusqueda}`);

  // B. Consultar Firebase
  const snapshot = await db.collection("citas")
    .where("fecha", "==", fechaBusqueda)
    .where("estado", "==", "activa") // Solo citas activas
    // Nota: Si tienes el campo recordatorio_enviado, agrégalo al filtro para no repetir
    // .where("recordatorio_enviado", "==", false) 
    .get();

  if (snapshot.empty) {
    console.log(" No hay citas para mañana. Robot yendo a dormir.");
    return;
  }

  // C. Enviar Correos
  const promesas = [];
  
  snapshot.forEach(doc => {
    const cita = doc.data();
    const emailDestino = cita.usuarioEmail; // O como se llame tu campo en Firebase
    const nombreCliente = cita.usuarioNombre || "Cliente";

    console.log(` Preparando correo para: ${emailDestino}`);

    const mailOptions = {
      from: `"PetCare Veterinaria" <${process.env.EMAIL_USER}>`,
      to: emailDestino,
      subject: ` Recordatorio de Cita Mañana - PetCare`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Hola ${nombreCliente},</h2>
          <p>Te recordamos que tienes una cita agendada para mañana.</p>
          <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #bbf7d0;">
            <p><strong> Fecha:</strong> ${cita.fecha}</p>
            <p><strong> Hora:</strong> ${cita.hora}</p>
            <p><strong> Mascota:</strong> ${cita.tipoMascota}</p>
            <p><strong> Motivo:</strong> ${cita.motivo}</p>
          </div>
          <p>¡Te esperamos!</p>
          <small>Si necesitas cancelar, por favor entra a tu perfil en la web.</small>
        </div>
      `
    };

    // Enviar y luego actualizar Firebase
    const tarea = transporter.sendMail(mailOptions)
      .then(() => {
        console.log(` Enviado a ${nombreCliente}`);
        // Opcional: Marcar como enviado en BD
        return db.collection("citas").doc(doc.id).update({ recordatorio_enviado: true });
      })
      .catch(err => console.error(` Error enviando a ${nombreCliente}:`, err));

    promesas.push(tarea);
  });

  await Promise.all(promesas);
  console.log(" Robot finalizó su trabajo.");
}

correrRobot();