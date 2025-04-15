document.addEventListener('DOMContentLoaded', function() {
    // Estado global del carrito
    const cart = {
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

    // Cargar carrito guardado
    cart.loadFromLocalStorage();

    // Añadir botones de "Agregar al carrito" a cada item del menú
    document.querySelectorAll('.menu-item').forEach(item => {
        const name = item.querySelector('h3').textContent;
        const price = parseFloat(item.querySelector('.price').textContent.replace('S/. ', ''));
        const id = item.dataset.id || Math.random().toString(36).substr(2, 9);
        
        const addButton = document.createElement('button');
        addButton.className = 'add-to-cart';
        addButton.textContent = 'Agregar al Carrito';
        addButton.onclick = () => {
            cart.addItem({ id, name, price });
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
            if (cart.items.length > 0) {
                if (confirm('¿Estás seguro de que deseas cancelar tu pedido?')) {
                    cart.clear();
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
        
        cartItems.innerHTML = cart.items.map(item => `
            <div class="cart-item" data-id="${item.id}">
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
            </div>
        `).join('');

        const subtotalAmount = cart.total;
        const taxAmount = subtotalAmount * 0.18;
        const totalAmount = subtotalAmount + taxAmount;

        subtotal.textContent = `S/. ${subtotalAmount.toFixed(2)}`;
        tax.textContent = `S/. ${taxAmount.toFixed(2)}`;
        total.textContent = `S/. ${totalAmount.toFixed(2)}`;

        // Habilitar/deshabilitar botón de checkout basado en items del carrito
        checkoutButton.disabled = cart.items.length === 0;

        // Modificar esta parte para evitar el doble modal
        checkoutButton.onclick = () => {
            if (cart.items.length > 0) {
                const orderDetails = {
                    type: 'Normal',
                    items: cart.items,
                    subtotal: subtotalAmount,
                    tax: taxAmount,
                    total: totalAmount
                };
                document.getElementById('normalCartModal').style.display = 'none';
                showPaymentModal(orderDetails);
            }
        };

        // Remover cualquier otro event listener existente
        checkoutButton.removeEventListener('click', function() {});

        // Remover todos los event listeners existentes
        const newCheckoutButton = checkoutButton.cloneNode(true);
        checkoutButton.parentNode.replaceChild(newCheckoutButton, checkoutButton);
        
        // Agregar un único event listener
        newCheckoutButton.onclick = () => {
            if (cart.items.length > 0) {
                const orderDetails = {
                    type: 'Normal',
                    items: cart.items,
                    subtotal: subtotalAmount,
                    tax: taxAmount,
                    total: totalAmount
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
            const item = cart.items.find(i => i.id === itemId);
            let newQuantity = item.quantity;

            if (e.target.classList.contains('plus')) {
                newQuantity++;
            } else if (e.target.classList.contains('minus')) {
                newQuantity = Math.max(0, newQuantity - 1);
            }

            if (newQuantity === 0) {
                cart.removeItem(itemId);
            } else {
                cart.updateQuantity(itemId, newQuantity);
            }
            updateNormalCartDisplay();
        }

        if (e.target.classList.contains('remove-item')) {
            const itemId = e.target.closest('.cart-item').dataset.id;
            cart.removeItem(itemId);
            updateNormalCartDisplay();
        }
    });

    document.querySelector('.clear-cart').addEventListener('click', () => {
        if (confirm('¿Estás seguro de que deseas vaciar el carrito?')) {
            cart.clear();
            updateNormalCartDisplay();
        }
    });

    // Configuración inicial
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

        // Event listener para ordenar
        const checkoutButton = modal.querySelector('.checkout-button');
        checkoutButton.addEventListener('click', () => {
            const deliveryCost = cart.total >= 100 ? 0 : 10;
            const orderDetails = {
                type: 'Delivery',
                items: cart.items,
                subtotal: cart.total,
                delivery: deliveryCost,
                total: cart.total + deliveryCost,
                delivery_status: cart.total >= 100 ? 'Gratis' : 'S/. 10.00'
            };
            modal.style.display = 'none';
            showPaymentModal(orderDetails);
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
                        <div class="combo-buttons">
                            <button class="cancel-combo-button">Cancelar</button>
                            <button class="order-combo-button" disabled>
                                <span class="button-content">Ordenar Combo</span>
                                <span class="button-icon">→</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

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
                    document.querySelectorAll('.selection-count').forEach(counter => {
                        counter.textContent = '(0/4)';
                    });
                    updateComboButton();
                }
            } else {
                modal.style.display = 'none';
            }
        });

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
        // Remover cualquier modal de pago existente
        const existingModal = document.querySelector('.payment-modal');
        if (existingModal) {
            existingModal.remove();
        }

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
                        Total a pagar: S/. ${orderDetails.total.toFixed(2)}
                    </div>
                    <p class="delivery-status">${orderDetails.delivery_status || ''}</p>
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

        // Mejorar los event listeners de los botones
        const confirmButton = modal.querySelector('.confirm-payment');
        const cancelButton = modal.querySelector('.cancel-payment');
        const closeButton = modal.querySelector('.close-modal');

        confirmButton.addEventListener('click', () => {
            clearInterval(timer);
            modal.remove();
            showOrderSuccess(orderDetails);
            cart.clear(); // Limpiar carrito después de confirmar
        });

        const handleCancel = () => {
            if (confirm('¿Está seguro que desea cancelar el pago?')) {
                clearInterval(timer);
                modal.remove();
                // Mostrar nuevamente el modal del carrito
                document.getElementById('normalCartModal').style.display = 'block';
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
                items: cart.items,
                total: cart.total + (cart.total >= 100 ? 0 : 10),
                delivery: cart.total >= 100 ? 'Gratis' : 'S/. 10.00'
            };
            document.getElementById('deliveryModal').style.display = 'none';
            showPaymentModal(orderDetails);
        });
    }

    updateCheckoutButton();

    // Eliminar o comentar la línea duplicada que podría estar causando conflicto
    // document.querySelector('.checkout-button').addEventListener('click', function() {
    //     ...
    // });

    document.querySelector('.checkout-button').addEventListener('click', function() {
        if (cart.items.length > 0) {
            const orderDetails = {
                type: 'Normal',
                items: cart.items,
                total: cart.total,
                tax: cart.total * 0.18
            };
            document.getElementById('normalCartModal').style.display = 'none';
            showPaymentModal(orderDetails);
        }
    });
});
