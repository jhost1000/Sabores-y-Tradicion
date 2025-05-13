document.addEventListener('DOMContentLoaded', function() {
    // Estado global del carrito - hacerlo global para que sea accesible desde otros archivos
    window.cart = {
        items: [],
        total: 0,
        addItem(item) {
            const existingItem = this.items.find(i => i.id === item.id);
            if (existingItem) {
                existingItem.quantity++;
                existingItem.total = existingItem.quantity * existingItem.price;
            } else {
                this.items.push({
                    ...item,
                    quantity: 1,
                    total: item.price
                });
            }
            this.updateTotal();
            this.saveToLocalStorage();
            this.updateCartCount();
        },
        removeItem(itemId) {
            this.items = this.items.filter(item => item.id !== itemId);
            this.updateTotal();
            this.saveToLocalStorage();
            this.updateCartCount();
        },
        updateQuantity(itemId, quantity) {
            const item = this.items.find(i => i.id === itemId);
            if (item) {
                item.quantity = quantity;
                item.total = item.quantity * item.price;
                this.updateTotal();
                this.saveToLocalStorage();
                this.updateCartCount();
            }
        },
        updateTotal() {
            this.total = this.items.reduce((sum, item) => sum + item.total, 0);
        },
        clear() {
            this.items = [];
            this.total = 0;
            this.saveToLocalStorage();
            this.updateCartCount();
        },
        saveToLocalStorage() {
            localStorage.setItem('cart', JSON.stringify({
                items: this.items,
                total: this.total
            }));
        },
        loadFromLocalStorage() {
            const savedCart = JSON.parse(localStorage.getItem('cart'));
            if (savedCart) {
                this.items = savedCart.items;
                this.total = savedCart.total;
                this.updateCartCount();
            }
        },
        updateCartCount() {
            const count = this.items.reduce((sum, item) => sum + item.quantity, 0);
            document.querySelector('.cart-count').textContent = count;
        }
    };

    // Datos del menú
    // Cada plato tiene un tipo principal o entrada para poder filtrarlos en el combo
    const menuItems = [
        { id: 1, name: 'Ceviche Clásico', price: 35.00, type: 'main' },
        { id: 2, name: 'Lomo Saltado', price: 42.00, type: 'main' },
        { id: 3, name: 'Ají de Gallina', price: 38.00, type: 'main' },
        { id: 4, name: 'Chupe de Camarones', price: 45.00, type: 'main' },
        { id: 5, name: 'Arroz con Mariscos', price: 48.00, type: 'main' },
        { id: 6, name: 'Rocoto Relleno', price: 36.00, type: 'main' },
        { id: 7, name: 'Causa Rellena', price: 32.00, type: 'starter' },
        { id: 8, name: 'Anticuchos', price: 28.00, type: 'starter' },
        { id: 9, name: 'Tacu Tacu', price: 40.00, type: 'main' },
        { id: 10, name: 'Papa a la Huancaína', price: 22.00, type: 'starter' },
        { id: 11, name: 'Tiradito', price: 33.00, type: 'starter' },
        { id: 12, name: 'Leche de Tigre', price: 25.00, type: 'starter' }
    ];

    // Datos del menú express
    const expressMenu = [
        { id: 'e1', name: 'Pollo a la Brasa Express', price: 25.90, time: '15 min' },
        { id: 'e2', name: 'Lomo Saltado Express', price: 28.90, time: '12 min' },
        { id: 'e3', name: 'Arroz Chaufa Express', price: 22.90, time: '10 min' },
        { id: 'e4', name: 'Tallarines Verdes con Bisteck', price: 27.90, time: '14 min' },
        { id: 'e5', name: 'Seco de Res Express', price: 26.90, time: '15 min' }
    ];

    // Cargar carrito guardado
    window.cart.loadFromLocalStorage();

    // Añadir botones de "Agregar al carrito" a cada item del menú
    document.querySelectorAll('.menu-item').forEach(item => {
        const name = item.querySelector('h3').textContent;
        const price = parseFloat(item.querySelector('.price').textContent.replace('S/. ', ''));
        const id = item.dataset.id || Math.random().toString(36).substr(2, 9);
        
        const addButton = document.createElement('button');
        addButton.className = 'add-to-cart';
        addButton.textContent = 'Agregar al Carrito';
        addButton.onclick = () => {
            window.cart.addItem({ id, name, price });
            showAddedToCartAnimation(addButton);
        };
        
        item.appendChild(addButton);
    });

    // Event listener para botón del carrito
    document.getElementById('cartButton').addEventListener('click', () => {
        openNormalCartModal();
    });

    function showAddedToCartAnimation(button) {
        button.textContent = '¡Agregado!';
        button.style.background = '#28a745';
        setTimeout(() => {
            button.textContent = 'Agregar al Carrito';
            button.style.background = 'var(--primary-color)';
        }, 1000);
    }

    function openNormalCartModal() {
        const modal = document.getElementById('normalCartModal');
        updateNormalCartDisplay();
        
        // Agregar listener específico para el botón de cerrar
        const closeButton = modal.querySelector('.close-modal');
        closeButton.onclick = () => {
            if (window.cart.items.length > 0) {
                if (confirm('¿Estás seguro de que deseas cancelar tu pedido?')) {
                    window.cart.clear();
                    updateNormalCartDisplay();
                    modal.style.display = 'none';
                }
            } else {
                modal.style.display = 'none';
            }
        };
        
        modal.style.display = 'block';
    }

    function updateNormalCartDisplay() {
        const cartItems = document.getElementById('normal-cart-items');
        const subtotal = document.getElementById('normal-cart-subtotal');
        const tax = document.getElementById('normal-cart-tax');
        const total = document.getElementById('normal-cart-total');
        const checkoutButton = document.querySelector('#normalCartModal .checkout-button');
        
        // Limpiar completamente el contenido del carrito para evitar duplicaciones
        cartItems.innerHTML = '';
        
        if (window.cart.items.length === 0) {
            // Mostrar mensaje de carrito vacío
            cartItems.innerHTML = `
                <div class="empty-cart-message">
                    <div class="empty-cart-icon">🛒</div>
                    <p>Tu carrito está vacío</p>
                    <p class="empty-cart-subtext">Agrega platos desde nuestro menú</p>
                </div>
            `;
            
            // Reset de valores monetarios
            subtotal.textContent = `S/. 0.00`;
            tax.textContent = `S/. 0.00`;
            total.textContent = `S/. 0.00`;
            
            // Deshabilitar botón de checkout
            if (checkoutButton) {
                checkoutButton.disabled = true;
            }
            
            // Eliminar mensaje de delivery si existe
            const existingDeliveryMsg = document.querySelector('.delivery-status');
            if (existingDeliveryMsg) {
                existingDeliveryMsg.remove();
            }
            
            return;
        }
        
        // Si hay items, mostrarlos
        window.cart.items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.setAttribute('data-id', item.id);
            
            // Comprobar si es un combo para mostrar diferente
            if (item.isCombo) {
                itemElement.innerHTML = `
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <p class="combo-description">${item.description}</p>
                        <div class="combo-discount-tag">20% descuento aplicado</div>
                    </div>
                    <div class="cart-item-controls">
                        <button class="quantity-btn minus">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn plus">+</button>
                        <button class="remove-item">×</button>
                    </div>
                    <div class="item-total">
                        S/. ${item.total.toFixed(2)}
                    </div>
                `;
            } else if (item.isExpress) {
                itemElement.innerHTML = `
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <p>S/. ${item.price.toFixed(2)} c/u</p>
                        <div class="express-guarantee-tag">
                            <span class="express-icon">⏱️</span>
                            <span>Listo en ${item.time} - ${item.expressGuarantee}</span>
                        </div>
                    </div>
                    <div class="cart-item-controls">
                        <button class="quantity-btn minus">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn plus">+</button>
                        <button class="remove-item">×</button>
                    </div>
                    <div class="item-total">
                        S/. ${item.total.toFixed(2)}
                    </div>
                `;
            } else {
                itemElement.innerHTML = `
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <p>S/. ${item.price.toFixed(2)} c/u</p>
                    </div>
                    <div class="cart-item-controls">
                        <button class="quantity-btn minus">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn plus">+</button>
                        <button class="remove-item">×</button>
                    </div>
                    <div class="item-total">
                        S/. ${item.total.toFixed(2)}
                    </div>
                `;
            }
            
            cartItems.appendChild(itemElement);
        });

        const subtotalAmount = window.cart.total;
        const taxAmount = subtotalAmount * 0.18;
        const totalAmount = subtotalAmount + taxAmount;

        subtotal.textContent = `S/. ${subtotalAmount.toFixed(2)}`;
        tax.textContent = `S/. ${taxAmount.toFixed(2)}`;
        total.textContent = `S/. ${totalAmount.toFixed(2)}`;
        
        // Verificar si la promoción de delivery está activa
        const isDeliveryPromoActive = localStorage.getItem('deliveryPromoActive') === 'true';
        
        // Agregar o actualizar información de delivery
        let deliveryElement = document.querySelector('.delivery-info');
        
        if (!deliveryElement) {
            deliveryElement = document.createElement('div');
            deliveryElement.className = 'delivery-info';
            
            // Insertar después del total
            const cartSummary = document.querySelector('.cart-summary');
            cartSummary.appendChild(deliveryElement);
        }
        
        // Definir contenido según si la promoción está activa y el total es suficiente
        if (isDeliveryPromoActive) {
            if (subtotalAmount >= 100) {
                deliveryElement.innerHTML = `
                    <div class="delivery-status-success">
                        <span style="color: #28a745; font-weight: bold; font-size: 1.1em;">
                            🚚 ¡DELIVERY GRATIS APLICADO! 
                        </span>
                    </div>
                `;
                // Anunciar solo la primera vez que se alcanza el monto
                if (!deliveryElement.dataset.announced || deliveryElement.dataset.announced !== 'true') {
                    speakMessage("¡Felicidades! Has alcanzado el monto para delivery gratis.");
                    deliveryElement.dataset.announced = 'true';
                }
            } else {
                const remaining = 100 - subtotalAmount;
                deliveryElement.innerHTML = `
                    <div class="delivery-status-pending">
                        <span style="color: #dc3545;">
                            Agrega S/. ${remaining.toFixed(2)} más para obtener delivery gratis
                        </span>
                    </div>
                `;
                deliveryElement.dataset.announced = 'false';
            }
        } else {
            // Si la promoción no está activa, mostrar costo fijo de delivery
            deliveryElement.innerHTML = `
                <div class="delivery-info-standard">
                    <span>Costo de delivery: S/. 10.00</span>
                    <button id="activateDeliveryPromo" style="margin-left: 10px; padding: 2px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Activar promoción
                    </button>
                </div>
            `;
            
            // Agregar escuchador de eventos al botón de activar promoción
            setTimeout(() => {
                const activateButton = document.getElementById('activateDeliveryPromo');
                if (activateButton) {
                    activateButton.addEventListener('click', function() {
                        localStorage.setItem('deliveryPromoActive', 'true');
                        speakMessage("Promoción de delivery gratis activada. Llegue a 100 soles para obtener delivery gratis.");
                        updateNormalCartDisplay();
                    });
                }
            }, 0);
        }

        // Habilitar el botón de checkout
        if (checkoutButton) {
            checkoutButton.disabled = false;
        }

        // Remover cualquier otro event listener existente
        const newCheckoutButton = checkoutButton.cloneNode(true);
        checkoutButton.parentNode.replaceChild(newCheckoutButton, checkoutButton);
        
        // Agregar un único event listener
        newCheckoutButton.onclick = () => {
            if (window.cart.items.length > 0) {
                const isDeliveryFree = isDeliveryPromoActive && subtotalAmount >= 100;
                const deliveryCost = isDeliveryFree ? 0 : 10;
                const totalWithDelivery = totalAmount + deliveryCost;
                
                const orderDetails = {
                    type: 'Normal',
                    items: window.cart.items,
                    subtotal: subtotalAmount,
                    tax: taxAmount,
                    total: totalAmount,
                    delivery_cost: deliveryCost,
                    delivery_status: isDeliveryFree ? 'Gratis' : 'S/. 10.00',
                    total_with_delivery: totalWithDelivery
                };
                
                // Cerrar el modal del carrito antes de mostrar el de pago
                document.getElementById('normalCartModal').style.display = 'none';
                showPaymentModal(orderDetails);
            }
        };
    }

    // Event listeners para el carrito normal
    document.getElementById('normalCartModal').addEventListener('click', function(e) {
        if (e.target.classList.contains('quantity-btn')) {
            const itemId = e.target.closest('.cart-item').dataset.id;
            const item = window.cart.items.find(i => i.id === itemId);
            let newQuantity = item.quantity;

            if (e.target.classList.contains('plus')) {
                newQuantity++;
            } else if (e.target.classList.contains('minus')) {
                newQuantity = Math.max(0, newQuantity - 1);
            }

            if (newQuantity === 0) {
                window.cart.removeItem(itemId);
            } else {
                window.cart.updateQuantity(itemId, newQuantity);
            }
            updateNormalCartDisplay();
        }

        if (e.target.classList.contains('remove-item')) {
            const itemId = e.target.closest('.cart-item').dataset.id;
            window.cart.removeItem(itemId);
            updateNormalCartDisplay();
        }
    });

    document.querySelector('.clear-cart').addEventListener('click', () => {
        if (confirm('¿Estás seguro de que deseas vaciar el carrito?')) {
            window.cart.clear();
            updateNormalCartDisplay();
        }
    });

    // Event Listeners para los botones de promociones
    const deliveryPromoButton = document.querySelector('.delivery-promo .promo-button');
    
    // Añadir evento para hacer click en el botón
    deliveryPromoButton.addEventListener('click', function() {
        scrollToMenuAndHighlight();
    });
    
    // Añadir evento de teclado para la tecla espacio
    deliveryPromoButton.addEventListener('keydown', function(e) {
        if (e.key === ' ' || e.code === 'Space') {
            e.preventDefault(); // Prevenir comportamiento por defecto
            scrollToMenuAndHighlight();
        }
    });
    
    // Función para desplazarse a la sección de menú
    function scrollToMenuAndHighlight() {
        // Desplazarse a la sección de menú
        window.location.hash = '#menu';
        
        // Anunciar con voz que se ha activado la promoción
        speakMessage("Promoción de delivery gratis activada. Seleccione platos por un valor mayor a 100 soles para obtener delivery gratuito. Ya está en la sección de menú.");
        
        // Resaltar visualmente la promoción de delivery gratis
        const menuSection = document.getElementById('menu');
        if (menuSection) {
            // Añadir una nota visual sobre la promoción
            const promoNote = document.createElement('div');
            promoNote.className = 'delivery-promo-note';
            promoNote.style.backgroundColor = 'rgba(220, 53, 69, 0.1)';
            promoNote.style.color = '#c81e28';
            promoNote.style.padding = '10px 15px';
            promoNote.style.borderRadius = '8px';
            promoNote.style.margin = '10px 0';
            promoNote.style.fontWeight = 'bold';
            promoNote.style.textAlign = 'center';
            promoNote.style.border = '2px dashed #c81e28';
            promoNote.innerHTML = '🚚 Haz seleccionado la promoción de <strong>DELIVERY GRATIS</strong> en pedidos mayores a S/. 100';
            
            // Eliminar nota existente si hubiera
            const existingNote = menuSection.querySelector('.delivery-promo-note');
            if (existingNote) {
                existingNote.remove();
            }
            
            // Insertar nota al inicio de la sección
            menuSection.insertBefore(promoNote, menuSection.firstChild);
        }
    }

    document.querySelector('.combo-promo .promo-button').addEventListener('click', openComboModal);
    document.querySelector('.express-promo .promo-button').addEventListener('click', openExpressModal);

    // Cerrar modales
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal.id === 'deliveryModal' && window.cart.items.length > 0) {
                if (confirm('¿Estás seguro de que deseas cancelar tu pedido?')) {
                    resetCart();
                    modal.style.display = 'none';
                }
            } else {
                modal.style.display = 'none';
            }
        });
    });

    // Combo Modal
    function openComboModal() {
        const modal = document.getElementById('comboModal');
        const mainDishes = menuItems.filter(item => item.type === 'main');
        const starters = menuItems.filter(item => item.type === 'starter');

        // Verificar si estamos en modo de accesibilidad
        const isAccessibilityMode = document.body.classList.contains('accessibility-mode');

        // Limpiar el contenido existente y crear una estructura mejorada
        modal.querySelector('.modal-content').innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">Arma tu Combo Familiar</h3>
                <button class="close-modal" aria-label="Cerrar modal de combo">&times;</button>
            </div>
            <div class="combo-builder">
                <div class="combo-section">
                    <h4>Platos Principales <span class="selection-count">(0/4)</span></h4>
                    <div class="dish-selection main-dishes">
                        ${mainDishes.map((dish, index) => `
                            <div class="dish-option" data-index="${index}" data-id="${dish.id}" data-type="main">
                                <input type="checkbox" id="dish-${dish.id}" name="main-dish" value="${dish.id}">
                                <label for="dish-${dish.id}">
                                    <span class="dish-name">${dish.name}</span>
                                    <span class="dish-price">S/. ${dish.price.toFixed(2)}</span>
                                    <span class="checkmark"></span>
                                </label>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="combo-section">
                    <h4>Entradas <span class="selection-count">(0/2)</span> <span class="optional-tag">(Opcional)</span></h4>
                    <div class="dish-selection starters">
                        ${starters.map((dish, index) => `
                            <div class="dish-option" data-index="${index}" data-id="${dish.id}" data-type="starter">
                                <input type="checkbox" id="starter-${dish.id}" name="starter" value="${dish.id}">
                                <label for="starter-${dish.id}">
                                    <span class="dish-name">${dish.name}</span>
                                    <span class="dish-price">S/. ${dish.price.toFixed(2)}</span>
                                    <span class="checkmark"></span>
                                </label>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="combo-summary">
                    <div class="price-details">
                        <p>Precio regular: <span class="original-price">S/. 199.90</span></p>
                        <p>Descuento: <span class="discount">20%</span></p>
                        <p class="final-price">Precio final: <span>S/. 159.90</span></p>
                    </div>
                    <div class="combo-buttons">
                        <button class="cancel-combo-button">Cancelar</button>
                        <button class="order-combo-button" disabled>
                            <span class="button-content">Ordenar Combo</span>
                            <span class="button-icon">→</span>
                        </button>
                    </div>
                </div>
                <div class="combo-keyboard-shortcuts">
                    <p><strong>Instrucciones:</strong></p>
                    <ul>
                        <li>Use <strong>Alt</strong> para navegar entre platos</li>
                        <li>Presione <strong>Espacio</strong> para seleccionar un plato</li>
                        <li>Presione <strong>1</strong> para finalizar y proceder al pago</li>
                        <li>Presione <strong>Escape</strong> para cancelar</li>
                    </ul>
                </div>
            </div>
        `;

        // Variables para la navegación por teclado
        let currentDishIndex = -1;
        let currentSection = 'main'; // 'main' o 'starter'
        let allDishOptions = [];
        let mainDishesSelected = 0;
        let startersSelected = 0;
        
        // Obtener todos los platos para navegación
        const mainDishOptions = Array.from(modal.querySelectorAll('.dish-option[data-type="main"]'));
        const starterDishOptions = Array.from(modal.querySelectorAll('.dish-option[data-type="starter"]'));
        allDishOptions = [...mainDishOptions, ...starterDishOptions];
        
        // Función para actualizar el estado visual de navegación
        function updateNavigationHighlight() {
            // Quitar highlight de todos los platos
            allDishOptions.forEach(option => {
                option.classList.remove('keyboard-focus');
            });
            
            // Añadir highlight al plato actual
            if (currentDishIndex >= 0 && currentDishIndex < allDishOptions.length) {
                const currentDish = allDishOptions[currentDishIndex];
                currentDish.classList.add('keyboard-focus');
                
                // Anunciar el plato actual para accesibilidad
                const dishName = currentDish.querySelector('.dish-name').textContent;
                const dishPrice = currentDish.querySelector('.dish-price').textContent;
                const dishType = currentDish.getAttribute('data-type') === 'main' ? 'plato principal' : 'entrada';
                
                // Usar la función de accesibilidad si está disponible
                if (typeof speakMessage === 'function') {
                    speakMessage(`${dishName}, ${dishPrice}, ${dishType}. Presione espacio para seleccionar.`);
                }
            }
        }
        
        // Función para seleccionar un plato
        function selectCurrentDish() {
            if (currentDishIndex >= 0 && currentDishIndex < allDishOptions.length) {
                const currentDish = allDishOptions[currentDishIndex];
                const checkbox = currentDish.querySelector('input[type="checkbox"]');
                const dishType = currentDish.getAttribute('data-type');
                
                if (dishType === 'main') {
                    // Solo permitir seleccionar hasta 4 platos principales
                    if (!checkbox.checked && mainDishesSelected < 4) {
                        checkbox.checked = true;
                        mainDishesSelected++;
                        updateMainDishCount();
                        if (typeof speakMessage === 'function') {
                            speakMessage(`Plato principal seleccionado. Tienes ${mainDishesSelected} de 4 platos principales.`);
                        }
                    } else if (checkbox.checked) {
                        checkbox.checked = false;
                        mainDishesSelected--;
                        updateMainDishCount();
                        if (typeof speakMessage === 'function') {
                            speakMessage(`Plato principal deseleccionado. Tienes ${mainDishesSelected} de 4 platos principales.`);
                        }
                    } else if (mainDishesSelected >= 4) {
                        if (typeof speakMessage === 'function') {
                            speakMessage("Ya has seleccionado 4 platos principales. No puedes seleccionar más.");
                        }
                    }
                } else if (dishType === 'starter') {
                    // Las entradas son opcionales, pero limitamos a 2
                    if (!checkbox.checked && startersSelected < 2) {
                        checkbox.checked = true;
                        startersSelected++;
                        updateStarterCount();
                        if (typeof speakMessage === 'function') {
                            speakMessage(`Entrada seleccionada. Tienes ${startersSelected} de 2 entradas opcionales.`);
                        }
                    } else if (checkbox.checked) {
                        checkbox.checked = false;
                        startersSelected--;
                        updateStarterCount();
                        if (typeof speakMessage === 'function') {
                            speakMessage(`Entrada deseleccionada. Tienes ${startersSelected} de 2 entradas opcionales.`);
                        }
                    } else if (startersSelected >= 2) {
                        if (typeof speakMessage === 'function') {
                            speakMessage("Ya has seleccionado 2 entradas. No puedes seleccionar más.");
                        }
                    }
                }
                
                // Actualizar estado del botón de ordenar
                updateOrderButton();
            }
        }
        
        // Función para actualizar el contador de platos principales
        function updateMainDishCount() {
            const counter = modal.querySelector('.main-dishes').closest('.combo-section').querySelector('.selection-count');
            counter.textContent = `(${mainDishesSelected}/4)`;
        }
        
        // Función para actualizar el contador de entradas
        function updateStarterCount() {
            const counter = modal.querySelector('.starters').closest('.combo-section').querySelector('.selection-count');
            counter.textContent = `(${startersSelected}/2)`;
        }
        
        // Función para actualizar el estado del botón de ordenar
        function updateOrderButton() {
            const orderButton = modal.querySelector('.order-combo-button');
            // Solo necesitamos 4 platos principales, las entradas son opcionales
            orderButton.disabled = mainDishesSelected !== 4;
            
            if (!orderButton.disabled) {
                orderButton.classList.add('active');
            } else {
                orderButton.classList.remove('active');
            }
        }
        
        // Función para proceder al pago
        function proceedToPayment() {
            if (mainDishesSelected === 4) {
                // Recopilar platos seleccionados
                const selectedMainDishes = Array.from(modal.querySelectorAll('.main-dishes input:checked')).map(input => {
                    const dish = menuItems.find(item => item.id === parseInt(input.value));
                    return {
                        id: dish.id,
                        name: dish.name,
                        price: dish.price,
                        quantity: 1,
                        total: dish.price
                    };
                });
                
                const selectedStarters = Array.from(modal.querySelectorAll('.starters input:checked')).map(input => {
                    const dish = menuItems.find(item => item.id === parseInt(input.value));
                    return {
                        id: dish.id,
                        name: dish.name,
                        price: dish.price,
                        quantity: 1,
                        total: dish.price
                    };
                });
                
                // Añadir al carrito global como un único combo
                const comboItems = [...selectedMainDishes, ...selectedStarters];
                const comboPrice = 159.90; // Precio con descuento
                const comboId = 'combo-' + Date.now();
                
                window.cart.addItem({
                    id: comboId,
                    name: "Combo Familiar",
                    price: comboPrice,
                    description: `Incluye: ${comboItems.map(item => item.name).join(', ')}`,
                    isCombo: true,
                    comboItems: comboItems
                });
                
                // Cerrar el modal y mostrar mensaje
                modal.style.display = 'none';
                resetComboSelections();
                
                if (typeof speakMessage === 'function') {
                    speakMessage('Combo familiar añadido al carrito correctamente. Procediendo al pago.');
                }
                
                // Actualizar el carrito y mostrar modal de pago
                updateNormalCartDisplay();
                
                // Simular clic en el botón de checkout para proceder al pago
                setTimeout(() => {
                    const checkoutButton = document.querySelector('.checkout-button');
                    if (checkoutButton && !checkoutButton.disabled) {
                        checkoutButton.click();
                        
                        // Añadir mensaje para indicar que debe presionar Enter para confirmar el pago
                        setTimeout(() => {
                            if (typeof speakMessage === 'function') {
                                speakMessage('Presione Enter para confirmar el pago o Escape para cancelar.');
                            }
                        }, 1000);
                    }
                }, 500);
            }
        }
        
        // Event listener para navegación por teclado
        function handleComboKeyNavigation(e) {
            // Solo procesar si el modal está visible
            if (modal.style.display !== 'block') return;
            
            switch (e.key) {
                case 'Alt':
                case 'AltGraph':
                    // Navegar al siguiente plato
                    currentDishIndex = (currentDishIndex + 1) % allDishOptions.length;
                    updateNavigationHighlight();
                    e.preventDefault();
                    break;
                    
                case ' ':
                    // Seleccionar el plato actual
                    selectCurrentDish();
                    e.preventDefault();
                    break;
                    
                case '1':
                    // Proceder al pago si hay suficientes platos seleccionados
                    proceedToPayment();
                    e.preventDefault();
                    break;
                    
                case 'Escape':
                    // Cerrar el modal
                    if (confirm('¿Estás seguro de que deseas cancelar tu selección?')) {
                        modal.style.display = 'none';
                        resetComboSelections();
                        // Notificar al sistema de accesibilidad que el modal se cerró
                        if (typeof speakMessage === 'function') {
                            speakMessage('Modal de combo cerrado');
                        }
                        // Si existe el objeto accessibilityManager, actualizar su estado
                        if (typeof accessibilityManager !== 'undefined') {
                            accessibilityManager.isComboModalOpen = false;
                        }
                    }
                    e.preventDefault();
                    break;
            }
        }
        
        // Remover listeners anteriores para evitar duplicados
        document.removeEventListener('keydown', handleComboKeyNavigation);
        
        // Agregar event listener para navegación por teclado
        document.addEventListener('keydown', handleComboKeyNavigation);
        
        // Agregar event listener para el botón de cancelar
        modal.querySelector('.cancel-combo-button').addEventListener('click', () => {
            if (document.querySelectorAll('.main-dishes input:checked, .starters input:checked').length > 0) {
                if (confirm('¿Estás seguro de que deseas cancelar tu selección?')) {
                    modal.style.display = 'none';
                    // Desmarcar todos los checkboxes
                    modal.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                        checkbox.checked = false;
                    });
                    // Resetear contadores
                    resetComboSelections();
                    // Eliminar el event listener al cerrar
                    document.removeEventListener('keydown', handleComboKeyNavigation);
                    // Notificar al sistema de accesibilidad que el modal se cerró
                    if (typeof speakMessage === 'function') {
                        speakMessage('Modal de combo cerrado');
                    }
                    // Si existe el objeto accessibilityManager, actualizar su estado
                    if (typeof accessibilityManager !== 'undefined') {
                        accessibilityManager.isComboModalOpen = false;
                    }
                }
            } else {
                modal.style.display = 'none';
                // Eliminar el event listener al cerrar
                document.removeEventListener('keydown', handleComboKeyNavigation);
                // Notificar al sistema de accesibilidad que el modal se cerró
                if (typeof speakMessage === 'function') {
                    speakMessage('Modal de combo cerrado');
                }
                // Si existe el objeto accessibilityManager, actualizar su estado
                if (typeof accessibilityManager !== 'undefined') {
                    accessibilityManager.isComboModalOpen = false;
                }
            }
        });

        // Event listener para cerrar el modal
        modal.querySelector('.close-modal').addEventListener('click', () => {
            if (document.querySelectorAll('.main-dishes input:checked, .starters input:checked').length > 0) {
                if (confirm('¿Estás seguro de que deseas cancelar tu selección?')) {
                    modal.style.display = 'none';
                    resetComboSelections();
                    // Eliminar el event listener al cerrar
                    document.removeEventListener('keydown', handleComboKeyNavigation);
                    // Notificar al sistema de accesibilidad que el modal se cerró
                    if (typeof speakMessage === 'function') {
                        speakMessage('Modal de combo cerrado');
                    }
                    // Si existe el objeto accessibilityManager, actualizar su estado
                    if (typeof accessibilityManager !== 'undefined') {
                        accessibilityManager.isComboModalOpen = false;
                    }
                }
            } else {
                modal.style.display = 'none';
                // Eliminar el event listener al cerrar
                document.removeEventListener('keydown', handleComboKeyNavigation);
                // Notificar al sistema de accesibilidad que el modal se cerró
                if (typeof speakMessage === 'function') {
                    speakMessage('Modal de combo cerrado');
                }
                // Si existe el objeto accessibilityManager, actualizar su estado
                if (typeof accessibilityManager !== 'undefined') {
                    accessibilityManager.isComboModalOpen = false;
                }
            }
        });

        // Add click handler for combo order button
        modal.querySelector('.order-combo-button').addEventListener('click', function() {
            proceedToPayment();
        });

        // Mostrar el modal
        modal.style.display = 'block';
        
        // Iniciar con el primer plato principal
        setTimeout(() => {
            currentDishIndex = 0;
            updateNavigationHighlight();
            
            // Anunciar instrucciones para accesibilidad
            if (typeof speakMessage === 'function') {
                speakMessage("Modal de combo familiar abierto. Use Alt para navegar entre platos, Espacio para seleccionar, 1 para finalizar y proceder al pago, o Escape para cancelar.");
            }
            
            // Notificar al sistema de accesibilidad que el modal se abrió
            if (typeof accessibilityManager !== 'undefined') {
                accessibilityManager.isComboModalOpen = true;
            }
        }, 500);
    }

    function resetComboSelections() {
        const modal = document.getElementById('comboModal');
        // Desmarcar todos los checkboxes
        modal.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        // Resetear contadores
        document.querySelectorAll('.selection-count').forEach(counter => {
            if (counter.closest('.combo-section').querySelector('.main-dishes')) {
                counter.textContent = '(0/4)';
            } else {
                counter.textContent = '(0/2)';
            }
        });
        // Deshabilitar botón de orden
        modal.querySelector('.order-combo-button').disabled = true;
        modal.querySelector('.order-combo-button').classList.remove('active');
    }

    function setupComboSelections() {
        const mainDishesSection = document.querySelector('.main-dishes');
        const startersSection = document.querySelector('.starters');
        const mainSelectionCount = document.querySelector('.main-dishes').closest('.combo-section').querySelector('.selection-count');
        const starterSelectionCount = document.querySelector('.starters').closest('.combo-section').querySelector('.selection-count');

        mainDishesSection.addEventListener('change', function(e) {
            const checked = mainDishesSection.querySelectorAll('input:checked').length;
            mainSelectionCount.textContent = `(${checked}/4)`;
            if (checked > 4) {
                e.target.checked = false;
                mainSelectionCount.textContent = `(${checked - 1}/4)`;
            }
            updateComboButton();
        });

        startersSection.addEventListener('change', function(e) {
            const checked = startersSection.querySelectorAll('input:checked').length;
            starterSelectionCount.textContent = `(${checked}/2)`;
            if (checked > 2) {
                e.target.checked = false;
                starterSelectionCount.textContent = `(${checked - 1}/2)`;
            }
            updateComboButton();
        });
    }

    function updateComboButton() {
        const mainDishesSelected = document.querySelectorAll('.main-dishes input:checked').length;
        const startersSelected = document.querySelectorAll('.starters input:checked').length;
        const orderButton = document.querySelector('.order-combo-button');

        orderButton.disabled = !(mainDishesSelected === 4 && startersSelected === 2);
        
        if (!orderButton.disabled) {
            orderButton.classList.add('active');
        } else {
            orderButton.classList.remove('active');
        }
    }

    // Express Modal
    function openExpressModal() {
        const modal = document.getElementById('expressModal');
        const now = new Date();
        const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
        const hour = now.getHours();

        // Verificar si estamos en horario express (lunes a viernes, 12-15h)
        // Para fines de demo, permitir siempre acceso
        const isExpressHour = true; // Para demo, en producción usar: isWeekday && hour >= 12 && hour < 15

        if (isExpressHour) {
            // Limpiar contenido anterior y crear estructura mejorada
            modal.querySelector('.modal-content').innerHTML = `
                <div class="modal-header">
                    <h3 class="modal-title">Express Lunch - Listo en 15 min</h3>
                    <button class="close-modal" aria-label="Cerrar modal de express">&times;</button>
                </div>
                <div class="express-timer" aria-live="polite">
                    <p>Tiempo restante para pedidos express:</p>
                    <div class="timer">15:00</div>
                </div>
                <div class="express-menu">
                    <div class="menu-category">
                        <h4>Opciones express del día</h4>
                        <div class="express-items" role="group" aria-label="Menú express disponible">
                            ${expressMenu.map(item => `
                            <div class="express-item">
                                <h5>${item.name}</h5>
                                <div class="express-item-details">
                                    <p>Tiempo de preparación: ${item.time}</p>
                                    <p>S/. ${item.price.toFixed(2)}</p>
                                </div>
                                <button class="select-express" data-id="${item.id}">Seleccionar</button>
                            </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="express-guarantee">
                    <div class="guarantee-icon">⏱️</div>
                    <div class="guarantee-text">
                        <p><strong>Garantía de entrega en 15 minutos o es gratis</strong></p>
                        <p>Válido solo para consumo en el restaurante de lunes a viernes de 12:00 a 15:00</p>
                    </div>
                </div>
            `;

            setupExpressSelection();
            modal.style.display = 'block';
            startExpressTimer();

            // Añadir evento para cerrar
            modal.querySelector('.close-modal').addEventListener('click', () => {
                modal.style.display = 'none';
                clearExpressTimer();
            });
        } else {
            alert('El servicio Express está disponible de lunes a viernes de 12:00 a 15:00');
        }
    }

    // Variable para guardar el ID del temporizador
    let expressTimerId = null;

    function setupExpressSelection() {
        document.querySelectorAll('.select-express').forEach(button => {
            button.addEventListener('click', function() {
                const itemId = this.dataset.id;
                const item = expressMenu.find(i => i.id === itemId);
                
                // Añadir al carrito como ítem express
                const expressId = 'express-' + Date.now();
                window.cart.addItem({
                    id: expressId,
                    name: item.name + " (Express)",
                    price: item.price,
                    isExpress: true,
                    time: item.time,
                    expressGuarantee: "15 minutos o gratis"
                });
                
                // Cerrar modal y mostrar mensaje
                document.getElementById('expressModal').style.display = 'none';
                clearExpressTimer();
                
                speakMessage(`${item.name} express añadido al carrito. Estará listo en ${item.time}.`);
                
                // Actualizar el carrito
                updateNormalCartDisplay();
            });
        });
    }

    function startExpressTimer() {
        // Limpiar temporizador anterior si existe
        clearExpressTimer();
        
        let timeLeft = 15 * 60; // 15 minutos en segundos
        const timerDisplay = document.querySelector('.timer');
        
        expressTimerId = setInterval(() => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            
            timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            if (timeLeft === 0) {
                clearExpressTimer();
                timerDisplay.textContent = '¡Tiempo agotado!';
                timerDisplay.classList.add('time-expired');
                
                // Cerrar automáticamente después de 5 segundos
                setTimeout(() => {
                    const modal = document.getElementById('expressModal');
                    if (modal && modal.style.display === 'block') {
                        modal.style.display = 'none';
                    }
                }, 5000);
            }
            
            timeLeft--;
        }, 1000);
    }

    function clearExpressTimer() {
        if (expressTimerId) {
            clearInterval(expressTimerId);
            expressTimerId = null;
        }
    }

    // Success Modal
    function showOrderSuccess(orderDetails) {
        const modal = document.getElementById('orderSuccessModal');
        const details = modal.querySelector('.order-details');

        details.innerHTML = `
            <p>Tipo de pedido: <strong>${orderDetails.type}</strong></p>
            <p>Detalle: <strong>${orderDetails.item}</strong></p>
            <p>Total pagado: <strong>S/. ${orderDetails.price.toFixed(2)}</strong></p>
            ${orderDetails.delivery ? `<p>Delivery: <strong>${orderDetails.delivery}</strong></p>` : ''}
            ${orderDetails.time ? `<p>Tiempo estimado: <strong>${orderDetails.time}</strong></p>` : ''}
        `;

        // Cerrar cualquier modal abierto
        document.querySelectorAll('.modal').forEach(m => {
            if (m.style.display === 'block' && m.id !== 'orderSuccessModal') {
                m.style.display = 'none';
            }
        });
        
        modal.style.display = 'block';

        // Animación de éxito
        const successMark = modal.querySelector('.success-animation');
        successMark.classList.add('animate');
        
        // Configurar botón de seguimiento
        const trackButton = modal.querySelector('.track-order-button');
        if (trackButton) {
            // Eliminar listeners previos
            const newTrackButton = trackButton.cloneNode(true);
            trackButton.parentNode.replaceChild(newTrackButton, trackButton);
            
            // Añadir nuevo listener
            newTrackButton.addEventListener('click', () => {
                modal.style.display = 'none';
                speakMessage("Tu pedido está en preparación. Recibirás notificaciones sobre el estado de tu pedido.");
                alert("Tu pedido está en preparación. Recibirás notificaciones sobre el estado de tu pedido.");
            });
        }
    }

    // Event Delegation para cerrar modales
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    function showPaymentModal(orderDetails) {
        // Remover cualquier modal de pago existente
        const existingModal = document.querySelector('.payment-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Calcular el monto final considerando el delivery
        const finalAmount = orderDetails.total_with_delivery || orderDetails.total;

        const modal = document.createElement('div');
        modal.className = 'modal payment-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'payment-title');
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="payment-title" class="modal-title">Pago con Yape</h3>
                    <button class="close-modal" aria-label="Cerrar ventana de pago">&times;</button>
                </div>
                <div class="qr-container">
                    <div class="qr-code">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=yape://payment?phone=999888777&amount=${finalAmount}" alt="Código QR Yape" aria-label="Código QR para pago con Yape por un monto de ${finalAmount} soles">
                    </div>
                </div>
                <div class="payment-details">
                    <div class="order-summary">
                        <h4>Resumen del pedido:</h4>
                        <p>Subtotal: <strong>S/. ${orderDetails.subtotal.toFixed(2)}</strong></p>
                        <p>IGV (18%): <strong>S/. ${orderDetails.tax.toFixed(2)}</strong></p>
                        ${orderDetails.delivery_status ? 
                          `<p>Delivery: <strong>${orderDetails.delivery_status}</strong></p>` : ''}
                        <div class="payment-amount">
                            <p>Total a pagar: <strong>S/. ${finalAmount.toFixed(2)}</strong></p>
                        </div>
                    </div>
                    <div class="payment-steps">
                        <div class="payment-step">
                            <span class="step-number">1</span>
                            <span>Abre tu app de Yape</span>
                        </div>
                        <div class="payment-step">
                            <span class="step-number">2</span>
                            <span>Escanea el código QR</span>
                        </div>
                        <div class="payment-step">
                            <span class="step-number">3</span>
                            <span>Confirma el monto y envía</span>
                        </div>
                    </div>
                </div>
                <div class="timer-container">
                    <p>Tiempo restante para pagar:</p>
                    <div class="payment-timer" aria-live="polite">05:00</div>
                </div>
                <div class="payment-buttons">
                    <button class="confirm-payment">
                        <span class="button-icon">✓</span>
                        <span class="button-text">Confirmar Pago</span>
                    </button>
                    <button class="cancel-payment">
                        <span class="button-icon">✕</span>
                        <span class="button-text">Cancelar</span>
                    </button>
                </div>
                <div class="payment-keyboard-shortcuts">
                    <p><strong>Atajos de teclado:</strong></p>
                    <ul>
                        <li><span class="key">Enter</span> - Confirmar pago</li>
                        <li><span class="key">Escape</span> - Cancelar pago</li>
                    </ul>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'block';
        
        // Anunciar para usuarios con discapacidad visual
        const deliveryMsg = orderDetails.delivery_status === 'Gratis' ? 
              " Con delivery gratis incluido." : "";
        speakMessage("Ventana de pago abierta. Escanea el código QR con tu aplicación Yape y confirma cuando hayas completado el pago. Presiona Enter para confirmar el pago o Escape para cancelar." + deliveryMsg);

        // Timer functionality
        let timeLeft = 300; // 5 minutes in seconds
        const timerDisplay = modal.querySelector('.payment-timer');
        const timer = setInterval(() => {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                modal.remove();
                alert('Tiempo de pago expirado. Por favor, intente nuevamente.');
                speakMessage("Tiempo de pago expirado. Por favor, intente nuevamente.");
            }
        }, 1000);

        // Mejorar los event listeners de los botones
        const confirmButton = modal.querySelector('.confirm-payment');
        const cancelButton = modal.querySelector('.cancel-payment');
        const closeButton = modal.querySelector('.close-modal');

        confirmButton.addEventListener('click', () => {
            clearInterval(timer);
            modal.remove();
            
            // Construir detalles para la confirmación
            const deliveryInfo = orderDetails.delivery_status === 'Gratis' ? 
                  "Delivery: Gratis" : "";
            
            const orderSuccess = {
                type: 'Pedido a domicilio',
                item: orderDetails.items ? 
                      orderDetails.items.map(item => `${item.name} x${item.quantity}`).join(', ') : 
                      'Pedido completo',
                price: finalAmount,
                delivery: orderDetails.delivery_status
            };
            
            showOrderSuccess(orderSuccess);
            window.cart.clear(); // Limpiar carrito después de confirmar
            speakMessage("¡Pago confirmado! Tu pedido está en proceso. Recibirás una confirmación cuando esté listo para entrega.");
        });

        const handleCancel = () => {
            if (confirm('¿Está seguro que desea cancelar el pago?')) {
                clearInterval(timer);
                modal.remove();
                
                // Mostrar nuevamente el carrito
                document.getElementById('normalCartModal').style.display = 'block';
                speakMessage("Pago cancelado. Volviendo al carrito.");
            }
        };

        cancelButton.onclick = handleCancel;
        closeButton.onclick = handleCancel;

        // Cerrar al hacer clic fuera del modal
        modal.onclick = (e) => {
            if (e.target === modal) {
                handleCancel();
            }
        };
    }

    // Modificar las funciones existentes para incluir el pago
    function updateCheckoutButton() {
        const checkoutButton = document.querySelector('.checkout-button');
        checkoutButton.addEventListener('click', () => {
            const orderDetails = {
                type: 'Delivery',
                items: window.cart.items,
                total: window.cart.total + (window.cart.total >= 100 ? 0 : 10),
                delivery: window.cart.total >= 100 ? 'Gratis' : 'S/. 10.00'
            };
            document.getElementById('deliveryModal').style.display = 'none';
            showPaymentModal(orderDetails);
        });
    }

    updateCheckoutButton();

    // Eliminar las líneas duplicadas que podrían estar causando conflicto
    /* 
    document.querySelector('.checkout-button').addEventListener('click', function() {
        if (window.cart.items.length > 0) {
            const orderDetails = {
                type: 'Normal',
                items: window.cart.items,
                total: window.cart.total,
                tax: window.cart.total * 0.18
            };
            document.getElementById('normalCartModal').style.display = 'none';
            showPaymentModal(orderDetails);
        }
    });
    */
});
