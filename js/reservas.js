class ReservasManager {
    constructor() {
        this.mesasData = [
            { id: 1, capacidad: 4, estado: 'libre', hora_reserva: null, fecha_reserva: null, cliente: null },
            { id: 2, capacidad: 2, estado: 'libre', hora_reserva: null, fecha_reserva: null, cliente: null },
            { id: 3, capacidad: 6, estado: 'libre', hora_reserva: null, fecha_reserva: null, cliente: null },
            { id: 4, capacidad: 8, estado: 'libre', hora_reserva: null, fecha_reserva: null, cliente: null },
            { id: 5, capacidad: 4, estado: 'libre', hora_reserva: null, fecha_reserva: null, cliente: null },
            { id: 6, capacidad: 2, estado: 'libre', hora_reserva: null, fecha_reserva: null, cliente: null },
            { id: 7, capacidad: 6, estado: 'libre', hora_reserva: null, fecha_reserva: null, cliente: null },
            { id: 8, capacidad: 4, estado: 'libre', hora_reserva: null, fecha_reserva: null, cliente: null }
        ];
        this.init();
        this.cargarReservasGuardadas();
    }

    init() {
        this.renderizarMesas();
        this.inicializarEventos();
    }

    cargarReservasGuardadas() {
        const reservasGuardadas = localStorage.getItem('reservasMesas');
        if (reservasGuardadas) {
            const reservas = JSON.parse(reservasGuardadas);
            this.mesasData = this.mesasData.map(mesa => {
                const reserva = reservas.find(r => r.id === mesa.id);
                return reserva || mesa;
            });
            this.renderizarMesas();
        }
    }

    guardarReservas() {
        localStorage.setItem('reservasMesas', JSON.stringify(this.mesasData));
        this.exportarAExcel();
    }

    exportarAExcel() {
        const ws = XLSX.utils.json_to_sheet(this.mesasData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Mesas");
        XLSX.writeFile(wb, "reservas_mesas.xlsx");
    }

    renderizarMesas() {
        const mesasGrid = document.querySelector('.mesas-grid');
        if (!mesasGrid) return;

        mesasGrid.innerHTML = this.mesasData.map(mesa => `
            <div class="mesa ${mesa.estado === 'ocupada' ? 'ocupada' : ''}" 
                 data-mesa="${mesa.id}" 
                 data-capacidad="${mesa.capacidad}">
                <div class="mesa-icon">
                    <span class="mesa-numero">${mesa.id}</span>
                    <svg viewBox="0 0 24 24" width="40" height="40">
                        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
                        <rect x="7" y="8" width="10" height="8" rx="1" fill="currentColor"/>
                    </svg>
                </div>
                <div class="mesa-info">
                    <p>Mesa para ${mesa.capacidad} personas</p>
                    <span class="mesa-status ${mesa.estado === 'libre' ? 'disponible' : ''}">${
                        mesa.estado === 'libre' ? 'Disponible' : 'Ocupada'
                    }</span>
                    ${mesa.estado === 'ocupada' ? `
                        <div class="reserva-info">
                            <p>Reservada: ${mesa.hora_reserva}</p>
                            <p>Fecha: ${mesa.fecha_reserva}</p>
                            <p>Cliente: ${mesa.cliente}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    actualizarMesa(mesaId, datos) {
        const index = this.mesasData.findIndex(mesa => mesa.id === parseInt(mesaId));
        if (index !== -1) {
            this.mesasData[index] = {
                ...this.mesasData[index],
                ...datos
            };
            this.guardarReservas();
            this.renderizarMesas();
            return true;
        }
        return false;
    }

    inicializarEventos() {
        document.querySelector('.mesas-grid').addEventListener('click', e => {
            const mesa = e.target.closest('.mesa');
            if (!mesa || mesa.classList.contains('ocupada')) return;

            this.seleccionarMesa(mesa);
        });

        document.querySelector('.reservas-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.procesarReserva(e.target);
        });
    }

    seleccionarMesa(mesa) {
        document.querySelector('.mesa.selected')?.classList.remove('selected');
        mesa.classList.add('selected');

        const formContainer = document.querySelector('.reservas-form-container');
        const capacidadDisplay = document.getElementById('capacidad-display');
        
        capacidadDisplay.textContent = `${mesa.dataset.capacidad} personas`;
        formContainer.classList.add('visible');
        formContainer.scrollIntoView({ behavior: 'smooth' });
    }

    async procesarReserva(form) {
        const mesaSeleccionada = document.querySelector('.mesa.selected');
        if (!mesaSeleccionada) return;

        const formData = new FormData(form);
        const datos = {
            estado: 'ocupada',
            hora_reserva: formData.get('hora'),
            fecha_reserva: formData.get('fecha'),
            cliente: formData.get('nombre'),
            telefono: formData.get('telefono'),
            email: formData.get('email')
        };

        try {
            const actualizado = this.actualizarMesa(mesaSeleccionada.dataset.mesa, datos);
            if (actualizado) {
                alert('Reserva realizada con éxito');
                form.reset();
                document.querySelector('.reservas-form-container').classList.remove('visible');
            } else {
                throw new Error('No se pudo actualizar la mesa');
            }
        } catch (error) {
            alert('Error al procesar la reserva');
            console.error(error);
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new ReservasManager();
});
