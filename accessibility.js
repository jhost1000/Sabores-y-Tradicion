document.addEventListener('DOMContentLoaded', function() {
    // Audio descripción del menú
    const audioButton = document.querySelector('.audio-button');
    const menuDescriptions = {
        ceviche: "Ceviche Clásico, plato bandera del Perú. Pescado fresco marinado en limón con ají y cilantro. Servido con camote y choclo. Precio: 35 soles.",
        lomo: "Lomo Saltado, tradicional salteado de res con verduras y papas fritas. Precio: 42 soles.",
        aji: "Ají de Gallina, cremosa preparación de pollo en salsa de ají amarillo. Precio: 38 soles."
    };

    if ('speechSynthesis' in window) {
        audioButton.addEventListener('click', function() {
            const menuText = Object.values(menuDescriptions).join(' ');
            const utterance = new SpeechSynthesisUtterance(menuText);
            utterance.lang = 'es-ES';
            speechSynthesis.speak(utterance);
        });
    } else {
        audioButton.style.display = 'none';
    }

    // Navegación por teclado
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            speechSynthesis.cancel();
        }
    });

    // Anunciar cambios dinámicos
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length) {
                const node = mutation.addedNodes[0];
                if (node.nodeType === 1 && node.getAttribute('aria-live')) {
                    const utterance = new SpeechSynthesisUtterance(node.textContent);
                    utterance.lang = 'es-ES';
                    speechSynthesis.speak(utterance);
                }
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Inicializar el control por voz
    voiceControl.init();

    // Funcionalidad del glosario
    const guideToggle = document.querySelector('.voice-guide-toggle');
    const voiceGuide = document.querySelector('.voice-guide');

    guideToggle.addEventListener('click', () => {
        voiceGuide.classList.toggle('expanded');
        const isExpanded = voiceGuide.classList.contains('expanded');
        guideToggle.setAttribute('aria-expanded', isExpanded);
        guideToggle.innerHTML = isExpanded ? '×' : '?';
    });

    // Iniciar colapsado
    voiceGuide.classList.add('collapsed');
});

// Reconocimiento de voz
const voiceControl = {
    recognition: null,
    isListening: false,
    isSpeaking: false,
    lastErrorTime: 0, // Para controlar frecuencia de mensajes de error
    errorCooldown: 5000, // 5 segundos entre mensajes de error
    consecutiveErrors: 0, // Contador de errores consecutivos
    activationPhrase: 'comando de voz',
    activationRecognition: null,
    descriptions: {
        inicio: "Bienvenido a Sabores y Tradiciones, un restaurante peruano de alta cocina.",
        menu: "Nuestro menú incluye platos tradicionales como Ceviche, Lomo Saltado y Ají de Gallina.",
        nosotros: "Somos un restaurante fundado en 2010, especializado en comida peruana tradicional.",
        contacto: "Puede contactarnos por teléfono al +51 123 456 789 o visitarnos en Av. Principal 123, Lima."
    },

    // Función para normalizar texto (quitar acentos y caracteres especiales)
    normalizeText(text) {
        return text.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .trim();
    },

    // Función para calcular la similitud entre dos strings
    similarity(s1, s2) {
        let longer = s1;
        let shorter = s2;
        if (s1.length < s2.length) {
            longer = s2;
            shorter = s1;
        }
        const longerLength = longer.length;
        if (longerLength === 0) {
            return 1.0;
        }
        return (longerLength - this.editDistance(longer, shorter)) / parseFloat(longerLength);
    },

    // Distancia de Levenshtein para comparar strings
    editDistance(s1, s2) {
        s1 = s1.toLowerCase();
        s2 = s2.toLowerCase();
        const costs = [];
        for (let i = 0; i <= s1.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= s2.length; j++) {
                if (i === 0) {
                    costs[j] = j;
                } else if (j > 0) {
                    let newValue = costs[j - 1];
                    if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    }
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
            if (i > 0) {
                costs[s2.length] = lastValue;
            }
        }
        return costs[s2.length];
    },

    init() {
        // Usar específicamente webkitSpeechRecognition para mejor compatibilidad
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.activationRecognition = new webkitSpeechRecognition();
            this.setupRecognition();
            this.setupActivationRecognition();
            this.setupButton();
            console.log('Reconocimiento de voz inicializado');
            // Iniciar escucha de comando de activación
            this.startListeningForActivation();
        } else {
            console.error('Reconocimiento de voz no soportado');
            document.getElementById('voiceControlBtn').style.display = 'none';
        }
    },

    activationPhrases: [
        'hola',
        'comando de voz',
        'asistente',
        'ayuda',
        'por favor',
        'oye',
        'disculpa',
        'atender',
        'necesito ayuda',
        'buenos días',
        'buenas tardes',
        'buenas noches'
    ],

    setupActivationRecognition() {
        this.activationRecognition.lang = 'es-ES';
        this.activationRecognition.continuous = true;
        this.activationRecognition.interimResults = false;

        this.activationRecognition.onresult = (event) => {
            const transcript = this.normalizeText(event.results[event.results.length - 1][0].transcript);
            console.log('Escuchando activación:', transcript);

            // Verificar si alguna de las frases de activación está en la transcripción
            const activated = this.activationPhrases.some(phrase => 
                transcript.includes(this.normalizeText(phrase)));

            if (activated) {
                console.log('¡Comando de activación detectado!');
                this.activationRecognition.stop();
                this.startVoiceControl();
                // Responder con saludo aleatorio
                const responses = [
                    "¡Hola! ¿En qué puedo ayudarte?",
                    "¡Bienvenido! ¿Qué necesitas?",
                    "¡A tus órdenes! ¿Cómo puedo ayudarte?",
                    "Estoy aquí para ayudarte. ¿Qué necesitas?",
                    "¡Saludos! ¿En qué puedo asistirte?"
                ];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                this.speak(randomResponse);
            }
        };

        this.activationRecognition.onend = () => {
            if (!this.isListening) {
                this.startListeningForActivation();
            }
        };

        this.activationRecognition.onerror = (event) => {
            console.error('Error en reconocimiento de activación:', event.error);
            if (!this.isListening) {
                setTimeout(() => this.startListeningForActivation(), 1000);
            }
        };
    },

    startListeningForActivation() {
        if (!this.isListening) {
            try {
                this.activationRecognition.start();
                console.log('Escuchando comando de activación...');
            } catch (error) {
                console.error('Error al iniciar escucha de activación:', error);
            }
        }
    },

    startVoiceControl() {
        const button = document.getElementById('voiceControlBtn');
        if (!this.isListening) {
            if (this.isSpeaking) {
                window.speechSynthesis.cancel();
            }
            this.recognition.start();
            this.isListening = true;
            button.classList.add('listening');
            this.speak("Control por voz activado. ¿En qué puedo ayudarte?");
            document.getElementById('voiceStatus').textContent = "Escuchando...";
        }
    },

    setupRecognition() {
        this.recognition.lang = 'es-ES';
        this.recognition.continuous = false; // Cambiar a false para mejor manejo
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 5;

        this.recognition.onstart = () => {
            console.log('Comenzó el reconocimiento');
            document.getElementById('voiceStatus').textContent = "Escuchando...";
        };

        this.recognition.onresult = (event) => {
            if (this.isSpeaking) return;

            const result = event.results[0];
            let bestMatch = {
                command: '',
                confidence: 0,
                action: ''
            };

            // Verificar todas las alternativas del reconocimiento
            for (let i = 0; i < result.length; i++) {
                const transcript = this.normalizeText(result[i].transcript);
                console.log('Alternativa:', transcript, 'Confianza:', result[i].confidence);

                // Si encontramos una coincidencia exacta, la usamos inmediatamente
                const exactMatch = this.findExactMatch(transcript);
                if (exactMatch) {
                    bestMatch = {
                        command: transcript,
                        confidence: 1,
                        action: exactMatch
                    };
                    break;
                }

                // Si no hay coincidencia exacta, buscamos la mejor aproximación
                const approximateMatch = this.findBestMatch(transcript);
                if (approximateMatch.confidence > bestMatch.confidence) {
                    bestMatch = approximateMatch;
                }
            }

            if (bestMatch.confidence > 0.6) {
                this.consecutiveErrors = 0; // Resetear contador de errores
                this.executeCommand(bestMatch.action, bestMatch.command);
            } else {
                this.handleUnrecognizedCommand();
            }

            // Solo reiniciar el reconocimiento si seguimos escuchando
            if (this.isListening && !this.isSpeaking) {
                setTimeout(() => this.recognition.start(), 1000);
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Error en reconocimiento:', event.error);
            document.getElementById('voiceStatus').textContent = `Error: ${event.error}`;
            
            if (event.error === 'no-speech') {
                document.getElementById('voiceStatus').textContent = "No se detectó ningún comando. Intente de nuevo.";
            }
            
            // Reintentar después de un error
            setTimeout(() => {
                if (this.isListening) {
                    this.recognition.start();
                }
            }, 1000);
        };

        this.recognition.onend = () => {
            console.log('Reconocimiento terminado');
            if (this.isListening) {
                this.recognition.start();
                console.log('Reiniciando reconocimiento...');
            }
        };
    },

    // Nuevo método para encontrar coincidencias exactas
    findExactMatch(transcript) {
        for (const [action, phrases] of Object.entries(this.commandList)) {
            if (phrases.includes(transcript)) {
                return action;
            }
        }
        return null;
    },

    // Nuevo método para encontrar la mejor coincidencia aproximada
    findBestMatch(transcript) {
        let bestMatch = {
            command: transcript,
            confidence: 0,
            action: ''
        };

        for (const [action, phrases] of Object.entries(this.commandList)) {
            for (const phrase of phrases) {
                const similarity = this.similarity(transcript, this.normalizeText(phrase));
                if (similarity > bestMatch.confidence) {
                    bestMatch = {
                        command: transcript,
                        confidence: similarity,
                        action: action
                    };
                }
            }
        }

        return bestMatch;
    },

    // Nuevo método para manejar comandos no reconocidos
    handleUnrecognizedCommand() {
        const now = Date.now();
        this.consecutiveErrors++;

        // Solo mostrar mensaje de error si ha pasado suficiente tiempo
        if (now - this.lastErrorTime > this.errorCooldown) {
            let message;
            
            if (this.consecutiveErrors > 3) {
                message = "Parece que hay problemas para entender. Intente hablar más claro o más cerca del micrófono.";
                this.stopListening(); // Detener después de muchos errores consecutivos
            } else {
                // Rotar entre diferentes mensajes para no ser repetitivo
                const messages = [
                    "No entendí bien.",
                    "¿Puede repetirlo?",
                    "No reconocí ese comando."
                ];
                message = messages[this.consecutiveErrors % messages.length];
            }

            this.speak(message);
            this.lastErrorTime = now;
            document.getElementById('voiceStatus').textContent = "Comando no reconocido";
        }
    },

    setupButton() {
        const button = document.getElementById('voiceControlBtn');
        const statusDiv = document.getElementById('voiceStatus');

        button.addEventListener('click', () => {
            try {
                if (!this.isListening) {
                    if (this.isSpeaking) {
                        window.speechSynthesis.cancel();
                    }
                    this.recognition.start();
                    this.isListening = true;
                    button.classList.add('listening');
                    this.speak("Control por voz activado. Diga un comando.");
                    statusDiv.textContent = "Escuchando...";
                    console.log('Reconocimiento iniciado');
                } else {
                    this.stopListening();
                }
            } catch (error) {
                console.error('Error al iniciar el reconocimiento:', error);
                statusDiv.textContent = "Error al iniciar el reconocimiento de voz";
            }
        });
    },

    processCommand(command) {
        const commandList = {
            'menu': ['leer menu', 'lee el menu', 'que hay de comer', 'ver menu'],
            'inicio': ['describir pagina', 'pagina inicial', 'que hay'],
            'nosotros': ['sobre ustedes', 'quienes son', 'historia'],
            'contacto': ['informacion', 'contacto', 'como contactar', 'ubicacion'],
            'reserva': ['hacer reserva', 'reservar mesa', 'quiero reservar'],
            'detener': ['detener', 'parar', 'silencio', 'stop']
        };

        let commandExecuted = false;

        for (const [action, phrases] of Object.entries(commandList)) {
            if (phrases.some(phrase => command.includes(phrase))) {
                console.log('Ejecutando acción:', action);
                switch (action) {
                    case 'menu':
                        this.speak(this.descriptions.menu);
                        break;
                    case 'inicio':
                        this.speak(this.descriptions.inicio);
                        break;
                    case 'nosotros':
                        this.speak(this.descriptions.nosotros);
                        break;
                    case 'contacto':
                        this.speak(this.descriptions.contacto);
                        break;
                    case 'reserva':
                        window.location.href = 'paginas/reservar-mesa.html';
                        break;
                    case 'detener':
                        this.stopListening();
                        break;
                }
                commandExecuted = true;
                document.getElementById('voiceStatus').textContent = `Ejecutando: ${command}`;
                break;
            }
        }

        if (!commandExecuted) {
            this.speak("Comando no reconocido. Por favor, intente de nuevo.");
            document.getElementById('voiceStatus').textContent = "Comando no reconocido";
        }
    },

    commandList: {
        menu: [
            'leer menu', 'lee el menu', 'que hay de comer', 'ver menu',
            'quiero ver el menu', 'muestrame el menu', 'que tienen para comer',
            'carta', 'ver la carta', 'que platos tienen', 'que ofrecen',
            'menu del dia', 'platos', 'comida'
        ],
        inicio: [
            'describir pagina', 'pagina inicial', 'que hay',
            'inicio', 'pagina principal', 'empezar', 'comenzar',
            'que es este sitio', 'que restaurant es', 'donde estoy'
        ],
        nosotros: [
            'sobre ustedes', 'quienes son', 'historia',
            'informacion del restaurant', 'cuando abrieron',
            'hace cuanto existen', 'cuentame del restaurant'
        ],
        reserva: [
            'hacer reserva', 'reservar mesa', 'quiero reservar',
            'reservacion', 'nueva reserva', 'agendar mesa',
            'separar mesa', 'hacer una reservacion',
            'quisiera reservar', 'necesito una mesa'
        ],
        detener: [
            'detener', 'parar', 'silencio', 'stop', 'terminar',
            'finalizar', 'acabar', 'hasta luego', 'adios',
            'chau', 'termina', 'finaliza', 'ya no más'
        ],
        seleccionarMesa: [
            'mesa uno', 'mesa dos', 'mesa tres', 'mesa cuatro',
            'seleccionar mesa', 'quiero la mesa', 'elegir mesa',
            'reservar mesa numero', 'mesa número'
        ],
        leerMesas: [
            'que mesas hay', 'mesas disponibles', 'mostrar mesas',
            'ver mesas', 'opciones de mesas', 'disponibilidad'
        ],
        rellenarFormulario: [
            'mi nombre es', 'me llamo', 
            'mi correo es', 'mi email es',
            'mi telefono es', 'mi número es',
            'la fecha es', 'quiero reservar el dia',
            'la hora es', 'quiero reservar a las'
        ],
        confirmarReserva: [
            'hazme la reserva', 'confirmar reserva', 'hacer reserva',
            'reservar ahora', 'completar reserva', 'finalizar reserva'
        ]
    },

    executeCommand(action, command) {
        console.log(`Ejecutando acción: ${action} (Comando: ${command})`);
        document.getElementById('voiceStatus').textContent = `Ejecutando: ${command}`;

        switch (action) {
            case 'menu':
                this.speak(this.descriptions.menu);
                break;
            case 'inicio':
                this.speak(this.descriptions.inicio);
                break;
            case 'nosotros':
                this.speak(this.descriptions.nosotros);
                break;
            case 'contacto':
                this.speak(this.descriptions.contacto);
                break;
            case 'reserva':
                window.location.href = 'paginas/reservar-mesa.html';
                break;
            case 'detener':
                this.stopListening();
                break;
            case 'leerMesas':
                this.leerMesasDisponibles();
                break;
            case 'seleccionarMesa':
                this.seleccionarMesaPorVoz(command);
                break;
            case 'rellenarFormulario':
                this.rellenarCampoFormulario(command);
                break;
            case 'confirmarReserva':
                this.confirmarReservaVoz();
                break;
        }
    },

    // Nuevos métodos para manejo de reservas
    leerMesasDisponibles() {
        const mesas = document.querySelectorAll('.mesa');
        let mesasText = "Las mesas disponibles son: ";
        
        mesas.forEach(mesa => {
            const numero = mesa.dataset.mesa;
            const capacidad = mesa.dataset.capacidad;
            const disponible = !mesa.classList.contains('ocupada');
            
            mesasText += `Mesa número ${numero} para ${capacidad} personas, `;
            mesasText += disponible ? "disponible. " : "ocupada. ";
        });

        mesasText += "Puede seleccionar una mesa diciendo: mesa número seguido del número de mesa.";
        this.speak(mesasText);
    },

    seleccionarMesaPorVoz(command) {
        const numeroMesa = command.match(/\d+/);
        if (numeroMesa) {
            const mesa = document.querySelector(`.mesa[data-mesa="${numeroMesa[0]}"]`);
            if (mesa && !mesa.classList.contains('ocupada')) {
                mesa.click();
                this.speak(`Mesa ${numeroMesa[0]} seleccionada. Puede rellenar el formulario diciendo: mi nombre es, seguido de su nombre, mi correo es, seguido de su correo, etc.`);
            } else {
                this.speak("Lo siento, esa mesa no está disponible.");
            }
        }
    },

    rellenarCampoFormulario(command) {
        const normalizedCommand = command.toLowerCase();
        let campo = null;
        let valor = '';

        if (normalizedCommand.includes('me llamo') || normalizedCommand.includes('mi nombre es')) {
            campo = document.getElementById('nombre');
            valor = command.replace(/(me llamo|mi nombre es)/i, '').trim();
        } else if (normalizedCommand.includes('correo') || normalizedCommand.includes('email')) {
            campo = document.getElementById('email');
            valor = command.replace(/(mi correo es|mi email es)/i, '').trim()
                         .replace(' arroba ', '@').replace(' punto ', '.');
        } else if (normalizedCommand.includes('telefono') || normalizedCommand.includes('número')) {
            campo = document.getElementById('telefono');
            valor = command.replace(/(mi telefono es|mi número es)/i, '').trim()
                         .replace(/\s+/g, '');
        } else if (normalizedCommand.includes('fecha')) {
            campo = document.getElementById('fecha');
            // Convertir fecha hablada a formato YYYY-MM-DD
            valor = this.procesarFechaHablada(command);
        } else if (normalizedCommand.includes('hora')) {
            campo = document.getElementById('hora');
            // Convertir hora hablada a formato HH:MM
            valor = this.procesarHoraHablada(command);
        }

        if (campo && valor) {
            campo.value = valor;
            this.speak(`${campo.getAttribute('name')} registrado como ${valor}`);
        }
    },

    procesarFechaHablada(command) {
        // Implementar lógica para convertir fecha hablada a formato YYYY-MM-DD
        // Ejemplo: "quiero reservar el 15 de diciembre" -> "2023-12-15"
        // ...
    },

    procesarHoraHablada(command) {
        // Implementar lógica para convertir hora hablada a formato HH:MM
        // Ejemplo: "quiero reservar a las ocho y media de la noche" -> "20:30"
        // ...
    },

    confirmarReservaVoz() {
        const form = document.querySelector('.reservas-form');
        const camposRequeridos = form.querySelectorAll('[required]');
        let camposFaltantes = [];

        camposRequeridos.forEach(campo => {
            if (!campo.value) {
                camposFaltantes.push(campo.getAttribute('name'));
            }
        });

        if (camposFaltantes.length === 0) {
            this.speak("¿Está seguro que desea confirmar la reserva? Diga 'sí, confirmar' para proceder.");
            // Agregar listener temporal para confirmación
            this.esperarConfirmacion(() => form.submit());
        } else {
            this.speak(`Faltan los siguientes campos por rellenar: ${camposFaltantes.join(', ')}`);
        }
    },

    esperarConfirmacion(callback) {
        const confirmarListener = (event) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            if (transcript.includes('sí, confirmar')) {
                callback();
                this.recognition.removeEventListener('result', confirmarListener);
            }
        };
        this.recognition.addEventListener('result', confirmarListener);
    },

    stopListening() {
        const despedida = "Gracias por usar comando de voz, vuelva pronto";
        
        // Primero reproducir el mensaje de despedida
        const utterance = new SpeechSynthesisUtterance(despedida);
        utterance.lang = 'es-ES';
        
        utterance.onend = () => {
            // Una vez terminado el mensaje, detener todo
            if (this.isSpeaking) {
                window.speechSynthesis.cancel();
            }
            this.isSpeaking = false;
            this.recognition.stop();
            this.isListening = false;
            const button = document.getElementById('voiceControlBtn');
            button.classList.remove('listening');
            document.getElementById('voiceStatus').textContent = "Reconocimiento detenido";
            // Reiniciar escucha de comando de activación después de un momento
            setTimeout(() => this.startListeningForActivation(), 2000);
        };

        window.speechSynthesis.speak(utterance);
    },

    speak(text) {
        if (this.isSpeaking) {
            window.speechSynthesis.cancel();
        }

        this.isSpeaking = true;
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Obtener todas las voces disponibles
        const voices = speechSynthesis.getVoices();
        
        // Lista de voces preferidas en orden
        const preferredVoices = [
        
            'Microsoft Dalia Online (Natural) - Spanish (Mexico)',
            'Google español'
        ];

        // Buscar la mejor voz disponible
        let selectedVoice = null;
        for (const preferredVoice of preferredVoices) {
            const voice = voices.find(v => v.name === preferredVoice);
            if (voice) {
                selectedVoice = voice;
                break;
            }
        }

        // Si no se encuentra ninguna voz preferida, usar cualquier voz en español
        if (!selectedVoice) {
            selectedVoice = voices.find(voice => voice.lang.includes('es'));
        }

        // Configurar la voz y parámetros
        utterance.voice = selectedVoice;
        utterance.lang = 'es-ES';
        utterance.rate = 0.9;  // Velocidad un poco más lenta para mayor claridad
        utterance.pitch = 1.0; // Tono normal
        utterance.volume = 1.0; // Volumen máximo

        utterance.onend = () => {
            this.isSpeaking = false;
            if (this.isListening) {
                setTimeout(() => {
                    this.recognition.start();
                }, 500);
            }
        };

        // Log para debugging
        console.log('Usando voz:', selectedVoice ? selectedVoice.name : 'Default');
        
        this.recognition.stop();
        window.speechSynthesis.speak(utterance);
    },
};
