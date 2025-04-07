document.addEventListener('DOMContentLoaded', function() {
    // Configuración inicial
    const cart = {
        items: [],
        total: 0
    };

    // Menú disponible
    const menuItems = [
        { id: 1, name: 'Ceviche Clásico', price: 35.00, type: 'main', 
          description: 'Pescado fresco marinado en limón con ají y cilantro. Servido con camote y choclo' },
        { id: 2, name: 'Lomo Saltado', price: 42.00, type: 'main',
          description: 'Tradicional salteado de res con verduras y papas fritas' },
        { id: 3, name: 'Ají de Gallina', price: 38.00, type: 'main',
          description: 'Cremosa preparación de pollo en salsa de ají amarillo' },
        { id: 4, name: 'Chupe de Camarones', price: 45.00, type: 'main',
          description: 'Sopa cremosa con camarones, maíz, queso y huevo' },
        { id: 5, name: 'Arroz con Mariscos', price: 48.00, type: 'main',
          description: 'Arroz al ají panca con variedad de mariscos frescos' },
        { id: 6, name: 'Rocoto Relleno', price: 36.00, type: 'main',
          description: 'Rocoto relleno de carne, pasas y queso gratinado' },
        { id: 7, name: 'Causa Rellena', price: 32.00, type: 'starter',
          description: 'Papa amarilla prensada rellena de pollo o atún' },
        { id: 8, name: 'Anticuchos', price: 28.00, type: 'starter',
          description: 'Brochetas de corazón marinadas en ají panca' },
        { id: 9, name: 'Tacu Tacu', price: 40.00, type: 'main',
          description: 'Tortilla de arroz y frejoles con bistec a lo pobre' }
    ];

    // Express menú
    const expressMenu = [
        { id: 'E1', name: 'Lomo Saltado Express', price: 35.00, time: '12 min' },
        { id: 'E2', name: 'Ají de Gallina Express', price: 32.00, time: '10 min' },
        { id: 'E3', name: 'Arroz Chaufa Express', price: 30.00, time: '15 min' }
    ];

    // Event Listeners para los botones de promociones
    document.querySelector('.delivery-promo .promo-button').addEventListener('click', openDeliveryModal);
    document.querySelector('.combo-promo .promo-button').addEventListener('click', openComboModal);
    document.querySelector('.express-promo .promo-button').addEventListener('click', openExpressModal);

    // Cerrar modales
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal.id === 'deliveryModal' && cart.items.length > 0) {
                if (confirm('¿Estás seguro de que deseas cancelar tu pedido?')) {
                    resetCart();
                    modal.style.display = 'none';
                }
            } else {
                modal.style.display = 'none';
            }
        });
    });

    // Delivery Modal
    function openDeliveryModal() {
        const modal = document.getElementById('deliveryModal');
        resetCart(); // Reset cart when opening modal
        
        const menuGrid = modal.querySelector('.menu-grid');
        menuGrid.innerHTML = menuItems.map(item => `
            <div class="menu-item-select">
                <h5>${item.name}</h5>
                <p class="item-price">S/. ${item.price.toFixed(2)}</p>
                <div class="item-controls">
                    <button class="decrease" aria-label="Disminuir cantidad">
                        <span class="button-icon">−</span>
                    </button>
                    <span class="quantity">0</span>
                    <button class="increase" aria-label="Aumentar cantidad">
                        <span class="button-icon">+</span>
                    </button>
                </div>
            </div>
        `).join('');

        const actionButtons = document.createElement('div');
        actionButtons.className = 'modal-actions';
        actionButtons.innerHTML = `
            <button class="cancel-order">Cancelar</button>
            <button class="checkout-button" disabled>
                <span class="button-content">Ordenar Ahora</span>
                <span class="button-icon">→</span>
            </button>
        `;

        const existingButtons = modal.querySelector('.modal-actions');
        if (existingButtons) {
            existingButtons.remove();
        }
        modal.querySelector('.modal-content').appendChild(actionButtons);

        // Event listener para cancelar
        modal.querySelector('.cancel-order').addEventListener('click', () => {
            if (cart.items.length > 0) {
                if (confirm('¿Estás seguro de que deseas cancelar tu pedido?')) {
                    resetCart();
                    modal.style.display = 'none';
                }
            } else {
                modal.style.display = 'none';
            }
        });

        setupQuantityControls(menuGrid);
        modal.style.display = 'block';
        updateDeliveryCost();
    }

    function setupQuantityControls(container) {
        container.addEventListener('click', function(e) {
            // Prevenir la propagación del evento
            e.stopPropagation();
            
            if (e.target.matches('.increase, .decrease')) {
                const item = e.target.closest('.menu-item-select');
                const quantitySpan = item.querySelector('.quantity');
                let quantity = parseInt(quantitySpan.textContent);

                // Bloquear múltiples clics rápidos
                if (e.target.disabled) return;
                e.target.disabled = true;
                setTimeout(() => e.target.disabled = false, 50);

                if (e.target.classList.contains('increase')) {
                    quantity = Math.min(quantity + 1, 10); // Máximo 10 unidades
                } else {
                    quantity = Math.max(quantity - 1, 0);
                }

                quantitySpan.textContent = quantity;
                updateCart();
            }
        });
    }

    function updateCart() {
        const items = document.querySelectorAll('.menu-item-select');
        cart.items = [];
        cart.total = 0;

        items.forEach((item, index) => {
            const quantity = parseInt(item.querySelector('.quantity').textContent);
            if (quantity > 0) {
                cart.items.push({
                    name: menuItems[index].name,
                    quantity: quantity,
                    price: menuItems[index].price,
                    total: quantity * menuItems[index].price
                });
                cart.total += quantity * menuItems[index].price;
            }
        });

        updateDeliveryCost();
        updateCartDisplay();
    }

    function updateDeliveryCost() {
        const deliveryCost = document.getElementById('delivery-cost');
        const deliveryMessage = document.querySelector('.delivery-message');
        const checkoutButton = document.querySelector('.checkout-button');

        if (cart.total >= 100) {
            deliveryCost.textContent = 'GRATIS';
            deliveryMessage.textContent = '¡Delivery gratis aplicado!';
            deliveryMessage.style.color = '#28a745';
        } else {
            deliveryCost.textContent = 'S/. 10.00';
            const remaining = 100 - cart.total;
            deliveryMessage.textContent = `Agrega S/. ${remaining.toFixed(2)} más para delivery gratis`;
            deliveryMessage.style.color = '#dc3545';
        }

        checkoutButton.disabled = cart.total === 0;
    }

    function updateCartDisplay() {
        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');

        cartItems.innerHTML = cart.items.map(item => `
            <div class="cart-item">
                <span>${item.name} x${item.quantity}</span>
                <span>S/. ${item.total.toFixed(2)}</span>
            </div>
        `).join('');

        cartTotal.textContent = `S/. ${cart.total.toFixed(2)}`;
    }

    function resetCart() {
        cart.items = [];
        cart.total = 0;
        document.querySelectorAll('.quantity').forEach(span => span.textContent = '0');
        updateCartDisplay();
        updateDeliveryCost();
    }

    // Combo Modal
    function openComboModal() {
        const modal = document.getElementById('comboModal');
        const mainDishes = menuItems.filter(item => item.type === 'main');
        const starters = menuItems.filter(item => item.type === 'starter');

        modal.innerHTML = `
            <div class="modal-content combo-modal">
                <div class="modal-header">
                    <h3 class="modal-title">Arma tu Combo Familiar</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="combo-builder">
                    <div class="combo-section">
                        <h4>Platos Principales <span class="selection-count">(0/4)</span></h4>
                        <div class="dish-selection main-dishes">
                            ${mainDishes.map(dish => `
                                <div class="dish-option">
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
                        <h4>Entradas <span class="selection-count">(0/2)</span></h4>
                        <div class="dish-selection starters">
                            ${starters.map(dish => `
                                <div class="dish-option">
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
                        <button class="order-combo-button" disabled>
                            <span class="button-content">Ordenar Combo</span>
                            <span class="button-icon">→</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        modal.style.display = 'block';
        setupComboSelections();

        // Add click handler for combo order button
        modal.querySelector('.order-combo-button').addEventListener('click', function() {
            const selectedDishes = {
                main: Array.from(modal.querySelectorAll('.main-dishes input:checked')).map(input => {
                    const dish = menuItems.find(item => item.id === parseInt(input.value));
                    return dish.name;
                }),
                starters: Array.from(modal.querySelectorAll('.starters input:checked')).map(input => {
                    const dish = menuItems.find(item => item.id === parseInt(input.value));
                    return dish.name;
                })
            };

            showPaymentModal({
                type: 'Combo Familiar',
                items: [...selectedDishes.main, ...selectedDishes.starters],
                total: 159.90,
                discount: '20%'
            });
        });
    }

    function createDishSelectionHTML(dishes, limit) {
        return dishes.map(dish => `
            <div class="dish-option" data-limit="${limit}">
                <label>
                    <input type="checkbox" name="dish" value="${dish.id}">
                    ${dish.name}
                </label>
            </div>
        `).join('');
    }

    function setupComboSelections() {
        document.querySelectorAll('.dish-selection').forEach(section => {
            section.addEventListener('change', function(e) {
                const checked = section.querySelectorAll('input:checked').length;
                const limit = e.target.closest('.dish-option').dataset.limit;

                if (checked > limit) {
                    e.target.checked = false;
                }

                updateComboButton();
            });
        });
    }

    function updateComboButton() {
        const mainDishesSelected = document.querySelectorAll('.main-dishes input:checked').length === 4;
        const startersSelected = document.querySelectorAll('.starters input:checked').length === 2;
        const orderButton = document.querySelector('.order-combo-button');

        orderButton.disabled = !(mainDishesSelected && startersSelected);
    }

    // Express Modal
    function openExpressModal() {
        const modal = document.getElementById('expressModal');
        const now = new Date();
        const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
        const hour = now.getHours();

        if (isWeekday && hour >= 12 && hour < 15) {
            modal.querySelector('.express-items').innerHTML = expressMenu.map(item => `
                <div class="express-item">
                    <h5>${item.name}</h5>
                    <p>Tiempo: ${item.time}</p>
                    <p>S/. ${item.price.toFixed(2)}</p>
                    <button class="select-express" data-id="${item.id}">Seleccionar</button>
                </div>
            `).join('');

            setupExpressSelection();
            modal.style.display = 'block';
            startExpressTimer();
        } else {
            alert('El servicio Express está disponible de lunes a viernes de 12:00 a 15:00');
        }
    }

    function setupExpressSelection() {
        document.querySelectorAll('.select-express').forEach(button => {
            button.addEventListener('click', function() {
                const itemId = this.dataset.id;
                const item = expressMenu.find(i => i.id === itemId);
                
                showPaymentModal({
                    type: 'Express',
                    items: [{
                        name: item.name,
                        quantity: 1,
                        price: item.price,
                        total: item.price
                    }],
                    total: item.price,
                    time: item.time
                });
            });
        });
    }

    function startExpressTimer() {
        let timeLeft = 15 * 60; // 15 minutos en segundos
        const timerDisplay = document.querySelector('.timer');
        
        const timer = setInterval(() => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            
            timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            if (timeLeft === 0) {
                clearInterval(timer);
                timerDisplay.textContent = '¡Tiempo agotado!';
            }
            
            timeLeft--;
        }, 1000);
    }

    // Success Modal
    function showOrderSuccess(orderDetails) {
        const modal = document.getElementById('orderSuccessModal');
        const details = modal.querySelector('.order-details');

        details.innerHTML = `
            <p>Tipo: ${orderDetails.type}</p>
            <p>Pedido: ${orderDetails.item}</p>
            <p>Total: S/. ${orderDetails.price.toFixed(2)}</p>
            ${orderDetails.time ? `<p>Tiempo estimado: ${orderDetails.time}</p>` : ''}
        `;

        // Cerrar modal actual
        document.querySelector('.modal[style="display: block"]').style.display = 'none';
        modal.style.display = 'block';

        // Animación de éxito
        const successMark = modal.querySelector('.success-animation');
        successMark.classList.add('animate');
    }

    // Event Delegation para cerrar modales
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    function showPaymentModal(orderDetails) {
        const modal = document.createElement('div');
        modal.className = 'modal payment-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Pago con Yape</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="qr-container">
                    <div class="qr-code">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=yape://payment?phone=999888777&amount=${orderDetails.total}" alt="Código QR Yape">
                    </div>
                </div>
                <div class="payment-details">
                    <div class="payment-amount">
                        S/. ${orderDetails.total.toFixed(2)}
                    </div>
                    <p>Enviar a: Sabores y Tradiciones</p>
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
                    <div class="payment-timer">05:00</div>
                </div>
                <div class="confirmation-buttons">
                    <button class="confirm-button">Confirmar Pago</button>
                    <button class="cancel-button">Cancelar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.style.display = 'block';

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
            }
        }, 1000);

        // Event listeners
        modal.querySelector('.close-modal').addEventListener('click', () => {
            clearInterval(timer);
            modal.remove();
        });

        modal.querySelector('.confirm-button').addEventListener('click', () => {
            clearInterval(timer);
            modal.remove();
            showOrderSuccess({
                ...orderDetails,
                paymentStatus: 'completed'
            });
        });

        modal.querySelector('.cancel-button').addEventListener('click', () => {
            clearInterval(timer);
            modal.remove();
        });

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                clearInterval(timer);
                modal.remove();
            }
        });
    }

    // Modificar las funciones existentes para incluir el pago
    function updateCheckoutButton() {
        const checkoutButton = document.querySelector('.checkout-button');
        checkoutButton.addEventListener('click', () => {
            const orderDetails = {
                type: 'Delivery',
                items: cart.items,
                total: cart.total + (cart.total >= 100 ? 0 : 10),
                delivery: cart.total >= 100 ? 'Gratis' : 'S/. 10.00'
            };
            document.getElementById('deliveryModal').style.display = 'none';
            showPaymentModal(orderDetails);
        });
    }

    updateCheckoutButton();
});
