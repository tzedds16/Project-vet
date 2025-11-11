


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