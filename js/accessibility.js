class AccessibilityManager {
    constructor() {
        this.isAccessibilityMode = false;
        this.currentSection = 0;
        this.sections = [];
        this.cart = [];
        this.focusableElements = [
            '#inicio',
            '#menu',
            '#nosotros',
            '#reservar',
            '#contacto',
            '.menu-item',
            '.contact-form',
            '.promo-card'  // Añadido para los combos
        ];
        this.comboSelections = {
            mainDishes: [],
            starters: []
        };
        this.isComboModalOpen = false;
        this.isDeliveryModalOpen = false;
        this.currentIndex = -1;
        this.init();
    }

    init() {
        // Initialize accessibility modal
        const modal = document.getElementById('accessibilityModal');
        
        // Show modal on page load
        window.addEventListener('load', () => {
            modal.style.display = 'flex';
            this.speak('Bienvenido a Sabores y Tradiciones. ¿Necesita funciones de accesibilidad? Presione la barra espaciadora para activar el modo accesible.');
        });

        // Handle keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && modal.style.display === 'flex') {
                this.enableAccessibilityMode();
                modal.style.display = 'none';
                e.preventDefault();
            }

            if (this.isAccessibilityMode) {
                this.handleAccessibilityKeys(e);
            }
        });

        // Initialize buttons
        document.getElementById('enableAccessibility').addEventListener('click', () => this.enableAccessibilityMode());
        document.getElementById('standardMode').addEventListener('click', () => this.disableAccessibilityMode());

        // Add section initialization
        this.sections = Array.from(document.querySelectorAll(this.focusableElements.join(',')));
        this.initializeSectionDescriptions();
    }

    initializeSectionDescriptions() {
        this.sectionDescriptions = new Map();
        this.sections.forEach(section => {
            if (section.classList.contains('promo-card')) {
                const title = section.querySelector('h3').textContent;
                const desc = section.querySelector('p').textContent;
                const price = section.querySelector('.price')?.textContent || '';
                const promoTag = section.querySelector('.promo-tag')?.textContent || '';
                
                let description = '';
                if (section.classList.contains('combo-promo')) {
                    description = `Combo especial: ${title}. ${desc}. ${promoTag}. ${price}. 
                        Presione espacio para seleccionar este combo y elegir sus platos.`;
                } else {
                    description = `Promoción: ${title}. ${desc}. ${price}`;
                }
                this.sectionDescriptions.set(section, description);
            } else if (section.id === 'nosotros') {
                const description = `Sección Sobre Nosotros. 
                    Desde 2010, somos el hogar de la auténtica cocina peruana en Lima. 
                    Nuestro chef ejecutivo Carlos Ramírez y su equipo combinan técnicas ancestrales 
                    con presentaciones modernas. Nos destacamos por nuestra autenticidad, 
                    calidad en ingredientes locales, innovación en la cocina tradicional, 
                    y excelencia en el servicio al cliente. 
                    Presione Alt para continuar navegando.`;
                this.sectionDescriptions.set(section, description);
            } else if (section.id === 'reservar') {
                const description = `Sección para agendar mesa. 
                    Aquí puedes reservar una mesa en nuestro restaurante.
                    Presiona espacio para abrir el formulario de reserva.`;
                this.sectionDescriptions.set(section, description);
            } else if (section.id === 'contacto') {
                const description = `Sección Contacto. 
                    Aquí encontrará nuestra información de contacto.
                    Estamos ubicados en Avenida Arequipa 1234, Lima, Perú.
                    Nuestros teléfonos son: +51 987 654 321 y 01 234 5678.
                    Nuestro correo electrónico es: info@saboresytradiciones.com.
                    Horario de atención: Lunes a Domingo de 12:00 a 23:00 horas.
                    Presione espacio para escuchar esta información.`;
                this.sectionDescriptions.set(section, description);
            } else if (section.classList.contains('menu-item')) {
                const title = section.querySelector('h3').textContent;
                const price = section.querySelector('.price').textContent;
                const desc = section.querySelector('p').textContent;
                this.sectionDescriptions.set(section, `Platillo: ${title}. ${desc}. Precio: ${price}`);
            } else if (section.classList.contains('info-card')) {
                const title = section.querySelector('h3').textContent;
                const paragraphs = Array.from(section.querySelectorAll('p')).map(p => p.textContent).join(', ');
                this.sectionDescriptions.set(section, `${title}: ${paragraphs}`);
            } else {
                const heading = section.querySelector('h2, h3')?.textContent || section.id;
                this.sectionDescriptions.set(section, `Sección: ${heading}`);
            }
        });
    }

    speak(text) {
        if (this.isAccessibilityMode) {
            responsiveVoice.speak(text, 'Spanish Latin American Female', {rate: 1});
        }
    }

    handleSpaceAction() {
        const currentSection = this.sections[this.currentIndex];
        if (currentSection?.classList.contains('menu-item')) {
            const menuContent = currentSection.querySelector('.menu-content');
            const title = menuContent.querySelector('h3').textContent;
            const price = menuContent.querySelector('.price').textContent;
            this.addToCart(title, price);
            this.speak(`Platillo ${title} agregado exitosamente`);
        } else if (currentSection?.classList.contains('combo-promo')) {
            if (typeof openComboModal === 'function') {
                openComboModal();
                this.speak('Modal de combo familiar abierto. Use Alt para navegar entre los platillos, Espacio para seleccionar, y 1 para finalizar su pedido.');
            } else {
                const comboButton = currentSection.querySelector('.promo-button');
                if (comboButton) {
                    comboButton.click();
                    this.speak('Abriendo modal de combo familiar');
                } else {
                    this.speak('No se pudo abrir el modal de combo familiar');
                }
            }
            this.isComboModalOpen = true;
        } else if (currentSection?.classList.contains('delivery-promo')) {
            this.openDeliveryModal();
            this.isDeliveryModalOpen = true;
            this.speak('Modal de delivery abierto. Seleccione sus platillos. Recuerde que el delivery es gratis en pedidos mayores a 100 soles. Presione 0 para proceder al pago.');
        } else if (currentSection?.id === 'contacto' || currentSection?.closest('#contacto')) {
            if (typeof readContactInfo === 'function') {
                readContactInfo();
            } else {
                const infoCards = document.querySelectorAll('.contact-info .info-card');
                let contactText = "Información de contacto de Sabores y Tradiciones: ";
                
                infoCards.forEach(card => {
                    const title = card.querySelector('h3').textContent;
                    const paragraphs = card.querySelectorAll('p');
                    
                    contactText += `${title}: `;
                    paragraphs.forEach(p => {
                        contactText += `${p.textContent}, `;
                    });
                });
                
                this.speak(contactText);
            }
        } else if (currentSection?.classList.contains('info-card')) {
            const title = currentSection.querySelector('h3').textContent;
            const paragraphs = currentSection.querySelectorAll('p');
            let infoText = `${title}: `;
            
            paragraphs.forEach(p => {
                infoText += `${p.textContent}, `;
            });
            
            this.speak(infoText);
        }
    }

    addToCart(item, price) {
        this.cart.push({ item, price });
        
        // Integración con el carrito global en modals.js
        if (typeof window.cart !== 'undefined') {
            // Integrar con el carrito global
            const priceValue = parseFloat(price.replace('S/. ', ''));
            const id = Math.random().toString(36).substr(2, 9); // Generar ID único
            window.cart.addItem({ 
                id: id, 
                name: item, 
                price: priceValue 
            });
        } else {
            // Actualizar solo el contador si no hay carrito global
            document.querySelector('.cart-count').textContent = this.cart.length;
        }
    }

    openCart() {
        if (this.cart.length === 0) {
            this.speak('El carrito está vacío');
            return;
        }

        let cartContent = 'En su carrito tiene: ';
        let subtotal = 0;

        this.cart.forEach((item, index) => {
            cartContent += `${index + 1}. ${item.item} con precio ${item.price}. `;
            subtotal += parseFloat(item.price.replace('S/. ', '').trim());
        });

        const igv = subtotal * 0.18;
        const total = subtotal + igv;
        
        cartContent += `Total a pagar: ${total} soles`;
        this.speak(cartContent);

        // En lugar de actualizar el carrito directamente, simplemente mostrar el modal
        // y dejar que el código en modals.js actualice su contenido
        const cartModal = document.getElementById('normalCartModal');
        if (cartModal) {
            cartModal.style.display = 'block';
            
            // Si existe la función en modals.js, la llamamos para actualizar el carrito
            if (typeof updateCartDisplay === 'function') {
                updateCartDisplay();
            } else if (typeof updateNormalCartDisplay === 'function') {
                updateNormalCartDisplay();
            }
        }
    }

    handleDeliveryNavigation(e) {
        if (!this.isDeliveryModalOpen) return;

        switch(e.code) {
            case 'AltLeft':
            case 'AltRight':
                this.navigateDeliveryItems();
                break;
            case 'Space':
                const now = Date.now();
                if (now - this.lastSpacePress < 500) { // Doble espacio en 500ms
                    this.closeDeliveryModal();
                } else {
                    this.selectDeliveryItem();
                }
                this.lastSpacePress = now;
                break;
        }
        e.preventDefault();
    }

    navigateDeliveryItems() {
        if (this.deliveryCurrentIndex >= this.deliveryItems.length - 1) {
            this.deliveryCurrentIndex = -1;
        }
        
        this.deliveryItems.forEach(item => item.classList.remove('highlight'));
        
        this.deliveryCurrentIndex++;
        const currentItem = this.deliveryItems[this.deliveryCurrentIndex];
        currentItem.classList.add('highlight');
        
        const title = currentItem.querySelector('h4').textContent;
        const desc = currentItem.querySelector('p').textContent;
        const price = currentItem.querySelector('.price').textContent;
        this.speak(`${title}. ${desc}. ${price}. Presione espacio para agregar al carrito.`);
    }

    selectDeliveryItem() {
        const currentItem = this.deliveryItems[this.deliveryCurrentIndex];
        const title = currentItem.querySelector('h4').textContent;
        const price = currentItem.querySelector('.price').textContent;
        this.addToCart(title, price);
        this.speak(`${title} agregado al carrito`);
    }

    closeDeliveryModal() {
        document.getElementById('deliveryModal').style.display = 'none';
        this.isDeliveryModalOpen = false;
        this.speak('Pedido cancelado');
    }

    handleAccessibilityKeys(e) {
        // Primero verificar si el modal de combo está abierto
        const comboModal = document.getElementById('comboModal');
        if (comboModal && comboModal.style.display === 'block') {
            // Si el modal de combo está abierto, dejar que el código en modals.js maneje las teclas
            return;
        }

        if (this.isComboModalOpen) {
            // Si estamos en modo combo pero el modal no está visible, resetear el estado
            if (!comboModal || comboModal.style.display !== 'block') {
                this.isComboModalOpen = false;
            } else {
                // Dejar que el código en modals.js maneje las teclas
                return;
            }
        }
        
        if (this.isDeliveryModalOpen) {
            this.handleDeliveryNavigation(e);
        } else {
            switch(e.code) {
                case 'AltLeft':
                case 'AltRight':
                    this.navigateSections();
                    e.preventDefault();
                    break;
                case 'Space':
                    this.handleSpaceAction();
                    e.preventDefault();
                    break;
                case 'Digit0':
                    this.openCart();
                    e.preventDefault();
                    break;
                case 'Digit1':
                    // Si estamos en el carrito, proceder al pago
                    const cartModal = document.getElementById('normalCartModal');
                    if (cartModal && cartModal.style.display === 'block') {
                        const checkoutButton = cartModal.querySelector('.checkout-button');
                        if (checkoutButton && !checkoutButton.disabled) {
                            checkoutButton.click();
                            this.speak('Procediendo al pago');
                        } else {
                            this.speak('El carrito está vacío o no se puede proceder al pago en este momento');
                        }
                        e.preventDefault();
                    }
                    break;
                case 'Escape':
                    // Cerrar cualquier modal abierto
                    const openModals = document.querySelectorAll('.modal');
                    let modalClosed = false;
                    openModals.forEach(modal => {
                        if (modal.style.display === 'block' || modal.style.display === 'flex') {
                            modal.style.display = 'none';
                            modalClosed = true;
                            this.speak('Modal cerrado');
                        }
                    });
                    if (modalClosed) {
                        e.preventDefault();
                    }
                    break;
            }
        }
    }

    navigateSections() {
        if (this.currentIndex >= this.sections.length - 1) {
            this.currentIndex = -1;
        }
        
        this.sections.forEach(section => {
            section.classList.remove('section-highlight');
        });

        this.currentIndex++;
        const currentSection = this.sections[this.currentIndex];
        
        currentSection.classList.add('section-highlight');
        currentSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Verificar si es el botón de reserva
        if (currentSection.id === 'reservar' || currentSection.querySelector('#reservationButton')) {
            const reservationButton = document.getElementById('reservationButton');
            if (reservationButton) {
                reservationButton.focus();
                const description = this.sectionDescriptions.get(currentSection) || 
                    "Botón para agendar mesa. Presione espacio para abrir el formulario de reserva.";
                this.speak(description);
            }
        } else if (currentSection.classList.contains('menu-item')) {
            const menuContent = currentSection.querySelector('.menu-content');
            const title = menuContent.querySelector('h3').textContent;
            const desc = menuContent.querySelector('p').textContent;
            const price = menuContent.querySelector('.price').textContent;
            this.speak(`${title}. ${desc}. ${price}. Presione espacio para agregar al carrito.`);
        } else {
            const description = this.sectionDescriptions.get(currentSection);
            this.speak(description);
        }
    }

    enableAccessibilityMode() {
        this.isAccessibilityMode = true;
        document.body.classList.add('accessibility-mode');
        this.speak('Modo accesible activado. Use Alt para navegar entre secciones, Espacio para seleccionar, y 0 para abrir el carrito.');
    }

    disableAccessibilityMode() {
        this.isAccessibilityMode = false;
        document.body.classList.remove('accessibility-mode');
    }

    processDeliveryOrder() {
        const subtotal = this.calculateCartTotal();
        
        if (subtotal < 100) {
            this.speak('No cumple con el monto mínimo de 100 soles para delivery gratis. Su total actual es de ' + subtotal + ' soles.');
            return;
        }

        // Abrir modal de pago
        document.getElementById('deliveryModal').style.display = 'none';
        document.getElementById('orderSuccessModal').style.display = 'block';
        this.isDeliveryModalOpen = false;
        this.speak('Pedido válido para delivery gratis. Procesando su pago.');
    }

    calculateCartTotal() {
        return this.cart.reduce((total, item) => {
            return total + parseFloat(item.price.replace('S/. ', '').trim());
        }, 0);
    }

    openDeliveryModal() {
        const deliveryModal = document.getElementById('deliveryModal');
        const menuGrid = deliveryModal.querySelector('.menu-grid');
        
        // Cargar los platillos del menú principal en el modal
        const menuItems = Array.from(document.querySelectorAll('.menu-item'));
        menuGrid.innerHTML = menuItems.map(item => {
            const title = item.querySelector('.menu-content h3').textContent;
            const price = item.querySelector('.menu-content .price').textContent;
            const desc = item.querySelector('.menu-content p').textContent;
            return `
                <div class="delivery-menu-item" tabindex="0">
                    <h4>${title}</h4>
                    <p>${desc}</p>
                    <span class="price">${price}</span>
                </div>
            `;
        }).join('');

        this.deliveryItems = Array.from(menuGrid.querySelectorAll('.delivery-menu-item'));
        this.deliveryCurrentIndex = -1;
        this.lastSpacePress = 0;
        deliveryModal.style.display = 'block';
    }
}

const accessibilityManager = new AccessibilityManager();
