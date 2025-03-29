document.addEventListener('DOMContentLoaded', function() {
    const mesas = document.querySelectorAll('.mesa:not(.ocupada)');
    const formularioReserva = document.getElementById('formularioReserva');
    const formReserva = document.getElementById('formReserva');
    let mesaSeleccionada = null;

    // Evento click para las mesas
    mesas.forEach(mesa => {
        mesa.addEventListener('click', function() {
            // Deseleccionar mesa anterior
            if (mesaSeleccionada) {
                mesaSeleccionada.classList.remove('seleccionada');
            }

            // Seleccionar nueva mesa
            mesa.classList.add('seleccionada');
            mesaSeleccionada = mesa;

            // Mostrar formulario
            formularioReserva.style.display = 'block';
            
            // Actualizar número máximo de personas
            const capacidad = mesa.dataset.capacidad;
            document.getElementById('personas').max = capacidad;
            document.getElementById('personas').placeholder = `Máximo ${capacidad} personas`;
        });
    });

    // Manejar envío del formulario
    formReserva.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Recoger datos del formulario
        const datosReserva = {
            mesa: mesaSeleccionada.dataset.mesa,
            nombre: document.getElementById('nombre').value,
            email: document.getElementById('email').value,
            telefono: document.getElementById('telefono').value,
            fecha: document.getElementById('fecha').value,
            hora: document.getElementById('hora').value,
            personas: document.getElementById('personas').value
        };

        // Aquí podrías enviar los datos a un servidor
        console.log('Datos de la reserva:', datosReserva);
        
        // Simular éxito
        alert('¡Reserva realizada con éxito!');
        
        // Actualizar UI
        mesaSeleccionada.classList.remove('seleccionada');
        mesaSeleccionada.classList.add('ocupada');
        formularioReserva.style.display = 'none';
        formReserva.reset();
    });
});

// Función para cancelar la reserva
function cancelarReserva() {
    if (mesaSeleccionada) {
        mesaSeleccionada.classList.remove('seleccionada');
        mesaSeleccionada = null;
    }
    document.getElementById('formularioReserva').style.display = 'none';
    document.getElementById('formReserva').reset();
}

// Validación de fecha
document.getElementById('fecha').addEventListener('change', function(e) {
    const hoy = new Date();
    const fechaSeleccionada = new Date(e.target.value);
    
    if (fechaSeleccionada < hoy) {
        alert('Por favor, seleccione una fecha futura');
        e.target.value = '';
    }
});
