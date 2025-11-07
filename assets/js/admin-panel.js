


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
     tbody.innerHTML = '<tr><td colspan="3">Buscando citas...</td></tr>';
  
        //PENDIENTE
}