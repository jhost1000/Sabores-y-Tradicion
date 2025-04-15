let recognition;
let isProcessingCommand = false;
const commandThreshold = 0.8; // Umbral de confianza para los comandos

// Lista de comandos permitidos con sus variantes
const commandList = {
    greetings: ['hola', 'que tal', 'buenos días', 'buenas tardes', 'buenas noches'],
    activation: ['comando de voz', 'activar comandos', 'activar voz', 'iniciar comandos', 
                'escúchame', 'asistente', 'ayúdame', 'control por voz', 'activa asistente', 
                'necesito ayuda'],
    addToCart: ['agregar', 'añadir', 'quiero', 'poner', 'incluir'],
    checkout: ['completar pedido', 'finalizar pedido', 'terminar pedido', 'pagar', 
              'ir a pagar', 'proceder al pago']
};

function initializeSpeechRecognition() {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3; // Obtener múltiples interpretaciones

    recognition.onstart = () => {
        console.log('Voice recognition activated');
        document.getElementById('voiceStatus').textContent = 'Escuchando...';
        document.getElementById('voiceControlBtn').classList.add('listening');
    };

    recognition.onresult = (event) => {
        if (isProcessingCommand) return;

        const results = Array.from(event.results).slice(event.resultIndex);
        
        for (const result of results) {
            if (result.isFinal) {
                isProcessingCommand = true;
                const alternatives = Array.from(result).map(alt => ({
                    transcript: alt.transcript.toLowerCase().trim(),
                    confidence: alt.confidence
                }));

                // Procesar la mejor alternativa que coincida con nuestros comandos
                const bestMatch = findBestMatch(alternatives);
                if (bestMatch) {
                    console.log('Command received:', bestMatch.transcript, 'Confidence:', bestMatch.confidence);
                    processCommand(bestMatch.transcript);
                }
                
                setTimeout(() => {
                    isProcessingCommand = false;
                }, 1000); // Prevenir procesamiento múltiple
            }
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        document.getElementById('voiceStatus').textContent = 'Error: ' + event.error;
    };

    recognition.onend = () => {
        recognition.start();
        document.getElementById('voiceStatus').textContent = 'Reconectando...';
    };
}

function findBestMatch(alternatives) {
    for (const alt of alternatives) {
        // Verificar si el comando coincide con alguno de nuestros comandos conocidos
        if (matchesKnownCommand(alt.transcript) && alt.confidence >= commandThreshold) {
            return alt;
        }
    }
    return null;
}

function matchesKnownCommand(transcript) {
    // Verificar si el texto coincide con algún comando conocido
    return Object.values(commandList).some(commandGroup =>
        commandGroup.some(command => transcript.includes(command))
    );
}

const responses = {
    greetings: [
        '¡Hola! ¿En qué puedo ayudarte?',
        '¡Bienvenido! ¿Qué te gustaría ordenar?',
        '¡Hola! Estoy listo para ayudarte',
        '¡Qué tal! ¿Qué se te antoja hoy?'
    ],
    activation: [
        'Comandos de voz activados. Puedes pedir agregar platillos diciendo "agregar" seguido del nombre del platillo',
        'Estoy listo para recibir tus comandos. Dime qué platillo deseas agregar',
        'Control por voz activado. ¿Qué te gustaría ordenar?',
        'A tus órdenes. Puedo ayudarte a agregar platillos al carrito'
    ],
    itemAdded: [
        'se ha agregado al carrito',
        'añadido correctamente',
        'listo, agregado a tu pedido',
        'ya está en tu carrito'
    ],
    notFound: [
        'Lo siento, no pude encontrar ese platillo',
        'No encontré ese platillo en el menú',
        'Ese platillo no está disponible',
        'No reconozco ese platillo, ¿podrías repetirlo?'
    ],
    checkout: [
        'Procediendo al pago. El total es',
        'Completando tu pedido. Total a pagar:',
        'Llevándote al pago. Tu cuenta es de',
        'Finalizando tu orden. El monto total es'
    ]
};

function getRandomResponse(type) {
    const responseArray = responses[type];
    return responseArray[Math.floor(Math.random() * responseArray.length)];
}

function processCommand(command) {
    // Greetings
    if (commandList.greetings.some(greeting => command.includes(greeting))) {
        speak(getRandomResponse('greetings'));
        return;
    }

    // Activation
    if (commandList.activation.some(activation => command.includes(activation))) {
        speak(getRandomResponse('activation'));
        return;
    }

    // Checkout
    if (commandList.checkout.some(checkout => command.includes(checkout))) {
        const cartTotal = document.querySelector('#normal-cart-total');
        if (cartTotal) {
            const total = cartTotal.textContent;
            speak(`${getRandomResponse('checkout')} ${total}`);
            const checkoutButton = document.querySelector('.checkout-button');
            if (checkoutButton) {
                checkoutButton.click();
            }
        }
        return;
    }

    // Add items to cart
    if (commandList.addToCart.some(addCommand => command.includes(addCommand))) {
        const items = {
            'ceviche': ['.add-to-cart'],
            'lomo saltado': ['.add-to-cart'],
            'ají de gallina': ['.add-to-cart'],
            'tacu tacu': ['.add-to-cart'],
            'causa': ['.add-to-cart'],
            'rocoto relleno': ['.add-to-cart'],
            'chupe de camarones': ['.add-to-cart'],
            'anticuchos': ['.add-to-cart'],
        };

        for (const [item, details] of Object.entries(items)) {
            if (command.includes(item)) {
                // Find the menu item and its add to cart button
                const menuItems = document.querySelectorAll('.menu-item');
                let targetItem = null;
                
                for (const menuItem of menuItems) {
                    if (menuItem.textContent.toLowerCase().includes(details[0].toLowerCase())) {
                        targetItem = menuItem;
                        break;
                    }
                }

                if (targetItem) {
                    // Find and click the add to cart button
                    const addButton = targetItem.querySelector('.add-to-cart') || targetItem.querySelector('button');
                    if (addButton) {
                        addButton.click();
                        speak(`${details[0]} ${getRandomResponse('itemAdded')}`);
                    }
                    return;
                } else {
                    speak(getRandomResponse('notFound'));
                    return;
                }
            }
        }
        speak(getRandomResponse('notFound'));
    }
}

function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    window.speechSynthesis.speak(utterance);
}

// Add this CSS to handle the pulse animation
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeSpeechRecognition();
    recognition.start();
});
