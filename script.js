/**
 * SISTEMA DE CAJAS MISTERIOSAS - SNACKFLY
 * 
 * Este script maneja toda la lógica del sistema de cajas misteriosas:
 * - Control de sesión (una caja por sesión usando localStorage)
 * - Sistema de premios aleatorios
 * - Animaciones y efectos visuales
 * - Modal de premios
 * - Efectos de sonido
 */

// ===== CONFIGURACIÓN DE PREMIOS =====
const PRIZES = [
    {
        id: 'gomibolsa',
        title: '🍬 Gomaloca Gratis',
        description: '¡Disfruta de una deliciosa Gomaloca completamente gratis en tu próxima compra!',
        icon: '🍬',
        type: 'prize'
    },
    {
        id: 'discount15',
        title: '💰 15% de Descuento',
        description: '¡Obtén un 15% de descuento en toda tu compra! Código: MYSTERY15',
        icon: '💰',
        type: 'prize'
    },
    {
        id: 'free_shipping',
        title: '🚚 Envío Gratis',
        description: '¡Tu próximo pedido llega sin costo de envío! Válido por 7 días.',
        icon: '🚚',
        type: 'prize'
    },
    {
        id: 'manzanabox_2x1',
        title: '🍎 ManzanaBox 2x1',
        description: '¡Lleva dos ManzanaBox y paga solo una! Oferta especial para ti.',
        icon: '🍎',
        type: 'prize'
    },
    {
        id: 'pepinos_extra',
        title: '🥒 PepinSnack Extra',
        description: '¡Recibe una porción extra de Pepinos Locos en tu próximo pedido!',
        icon: '🥒',
        type: 'prize'
    },
    {
        id: 'no_prize',
        title: '😅 ¡Suerte para la próxima!',
        description: 'Esta vez no hubo premio, ¡pero no te desanimes! Vuelve mañana para otra oportunidad.',
        icon: '😅',
        type: 'no_prize'
    }
];

// ===== VARIABLES GLOBALES =====
let hasOpenedBox = false;
let audioContext = null;

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 Sistema de Cajas Misteriosas iniciado');
    
    // Verificar si ya se abrió una caja en esta sesión
     //checkSessionStatus();
    
    // Inicializar contexto de audio para efectos de sonido
    initAudioContext();
    
    // Agregar eventos de teclado para accesibilidad
    document.addEventListener('keydown', handleKeyboardEvents);
});

/**
 * Verifica el estado de la sesión actual
 */
function checkSessionStatus() {
    const sessionData = localStorage.getItem('snackfly_mystery_box_session');
    
    if (sessionData) {
        const data = JSON.parse(sessionData);
        const today = new Date().toDateString();
        
        // Si ya se abrió una caja hoy, deshabilitar todas las cajas
        if (data.date === today && data.opened) {
            hasOpenedBox = true;
            disableAllBoxes();
            showStatusMessage('Ya abriste tu caja misteriosa hoy. ¡Vuelve mañana para otra oportunidad! 🌟');
        }
    }
}

/**
 * Función principal para abrir una caja
 * @param {number} boxId - ID de la caja a abrir
 */
function openBox(boxId) {
    console.log(`🎁 Intentando abrir caja ${boxId}`);
    
    // Verificar si ya se abrió una caja
    if (hasOpenedBox) {
        showDisabledOverlay();
        return;
    }
    
    // Marcar que se abrió una caja
    hasOpenedBox = true;
    
    // Guardar en localStorage
    saveSessionData();
    
    // Obtener elemento de la caja
    const boxElement = document.querySelector(`[data-box-id="${boxId}"]`);
    
    // Reproducir sonido de apertura
    playOpenSound();
    
    // Iniciar animación de apertura
    startBoxOpeningAnimation(boxElement, boxId);
    
    // Deshabilitar todas las cajas
    disableAllBoxes();
    
    // Generar premio aleatorio después de la animación
    setTimeout(() => {
        const prize = getRandomPrize();
        showPrizeModal(prize);
        markBoxAsOpened(boxElement);
    }, 1000);
}

/**
 * Inicia la animación de apertura de la caja
 * @param {Element} boxElement - Elemento de la caja
 * @param {number} boxId - ID de la caja
 */
function startBoxOpeningAnimation(boxElement, boxId) {
    // Agregar clase de animación
    boxElement.classList.add('opening');
    
    // Cambiar el icono durante la animación
    const boxIcon = boxElement.querySelector('.box-icon');
    const originalIcon = boxIcon.textContent;
    
    // Secuencia de iconos para simular apertura
    const openingSequence = ['📦', '📭', '📬', '✨', '🎉'];
    let sequenceIndex = 0;
    
    const iconInterval = setInterval(() => {
        if (sequenceIndex < openingSequence.length) {
            boxIcon.textContent = openingSequence[sequenceIndex];
            sequenceIndex++;
        } else {
            clearInterval(iconInterval);
            boxIcon.textContent = '🎁'; // Icono final
        }
    }, 200);
    
    // Remover clase de animación después de completarse
    setTimeout(() => {
        boxElement.classList.remove('opening');
    }, 1000);
}

/**
 * Marca una caja como abierta visualmente
 * @param {Element} boxElement - Elemento de la caja
 */
function markBoxAsOpened(boxElement) {
    boxElement.classList.add('opened');
    const button = boxElement.querySelector('.open-btn');
    button.innerHTML = '<span>ABIERTA</span>';
    button.disabled = true;
}

/**
 * Deshabilita todas las cajas
 */
function disableAllBoxes() {
    const boxes = document.querySelectorAll('.mystery-box');
    boxes.forEach(box => {
        const button = box.querySelector('.open-btn');
        button.style.pointerEvents = 'none';
        button.style.opacity = '0.6';
        box.style.cursor = 'not-allowed';
    });
}

/**
 * Genera un premio aleatorio
 * @returns {Object} Premio seleccionado
 */
function getRandomPrize() {
    // Pesos para los premios (mayor número = mayor probabilidad)
    const prizeWeights = {
        'gomibolsa': 15,
        'discount15': 10,
        'free_shipping': 12,
        'manzanabox_2x1': 8,
        'pepinos_extra': 15,
        'no_prize': 40  // Mayor probabilidad de no ganar
    };
    
    // Crear array con premios repetidos según su peso
    const weightedPrizes = [];
    PRIZES.forEach(prize => {
        const weight = prizeWeights[prize.id] || 1;
        for (let i = 0; i < weight; i++) {
            weightedPrizes.push(prize);
        }
    });
    
    // Seleccionar premio aleatorio
    const randomIndex = Math.floor(Math.random() * weightedPrizes.length);
    const selectedPrize = weightedPrizes[randomIndex];
    
    console.log(`🎯 Premio seleccionado: ${selectedPrize.title}`);
    return selectedPrize;
}

/**
 * Muestra el modal con el premio
 * @param {Object} prize - Premio a mostrar
 */
function showPrizeModal(prize) {
    const modal = document.getElementById('modalOverlay');
    const prizeIcon = document.getElementById('prizeIcon');
    const prizeTitle = document.getElementById('prizeTitle');
    const prizeDescription = document.getElementById('prizeDescription');
    
    // Configurar contenido del modal
    prizeIcon.textContent = prize.icon;
    prizeTitle.textContent = prize.title;
    prizeDescription.textContent = prize.description;
    
    // Cambiar estilo según el tipo de premio
    const modalElement = modal.querySelector('.modal');
    if (prize.type === 'no_prize') {
        modalElement.style.borderColor = '#e74c3c';
        prizeTitle.style.color = '#e74c3c';
    } else {
        modalElement.style.borderColor = '#4ecdc4';
        prizeTitle.style.color = '#2c3e50';
    }
    
    // Mostrar modal
    modal.classList.add('show');
    
    // Reproducir sonido de premio
    if (prize.type === 'prize') {
        playPrizeSound();
    } else {
        playNoprizeSound();
    }
    
    // Enfocar el botón de cerrar para accesibilidad
    setTimeout(() => {
        document.querySelector('.close-btn').focus();
    }, 300);
}

/**
 * Cierra el modal de premio
 */
function closeModal() {
    const modal = document.getElementById('modalOverlay');
    modal.classList.remove('show');
    
    // Mostrar mensaje de estado
    showStatusMessage('¡Gracias por jugar! Vuelve mañana para otra oportunidad. 🌟');
}

/**
 * Muestra el overlay de caja ya abierta
 */
function showDisabledOverlay() {
    const overlay = document.getElementById('disabledOverlay');
    overlay.classList.add('show');
    
    // Auto-cerrar después de 3 segundos
    setTimeout(() => {
        overlay.classList.remove('show');
    }, 3000);
}

/**
 * Muestra un mensaje de estado
 * @param {string} message - Mensaje a mostrar
 */
function showStatusMessage(message) {
    const statusElement = document.getElementById('statusMessage');
    statusElement.textContent = message;
    statusElement.style.animation = 'bounceIn 0.5s ease-out';
}

/**
 * Guarda los datos de la sesión en localStorage
 */
function saveSessionData() {
    const sessionData = {
        date: new Date().toDateString(),
        opened: true,
        timestamp: Date.now()
    };
    
    localStorage.setItem('snackfly_mystery_box_session', JSON.stringify(sessionData));
    console.log('💾 Datos de sesión guardados');
}

// ===== SISTEMA DE AUDIO =====

/**
 * Inicializa el contexto de audio
 */
function initAudioContext() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('🔊 Contexto de audio inicializado');
    } catch (error) {
        console.log('❌ Audio no disponible:', error);
    }
}

/**
 * Reproduce un sonido sintético
 * @param {number} frequency - Frecuencia del sonido
 * @param {number} duration - Duración en milisegundos
 * @param {string} type - Tipo de onda
 */
function playTone(frequency, duration, type = 'sine') {
    if (!audioContext) return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
        console.log('❌ Error reproduciendo sonido:', error);
    }
}

/**
 * Reproduce sonido de apertura de caja
 */
function playOpenSound() {
    // Secuencia de tonos para simular apertura
    setTimeout(() => playTone(400, 100), 0);
    setTimeout(() => playTone(600, 100), 150);
    setTimeout(() => playTone(800, 200), 300);
}

/**
 * Reproduce sonido de premio
 */
function playPrizeSound() {
    // Melodía de victoria
    setTimeout(() => playTone(523, 150), 0);    // Do
    setTimeout(() => playTone(659, 150), 200);  // Mi
    setTimeout(() => playTone(784, 150), 400);  // Sol
    setTimeout(() => playTone(1047, 300), 600); // Do alto
}

/**
 * Reproduce sonido de no premio
 */
function playNoprizeSound() {
    // Sonido descendente
    setTimeout(() => playTone(400, 200), 0);
    setTimeout(() => playTone(300, 200), 250);
    setTimeout(() => playTone(200, 300), 500);
}

// ===== EVENTOS DE TECLADO PARA ACCESIBILIDAD =====

/**
 * Maneja eventos de teclado
 * @param {KeyboardEvent} event - Evento de teclado
 */
function handleKeyboardEvents(event) {
    // Cerrar modal con Escape
    if (event.key === 'Escape') {
        const modal = document.getElementById('modalOverlay');
        const overlay = document.getElementById('disabledOverlay');
        
        if (modal.classList.contains('show')) {
            closeModal();
        }
        
        if (overlay.classList.contains('show')) {
            overlay.classList.remove('show');
        }
    }
    
    // Abrir cajas con números 1-5
    if (event.key >= '1' && event.key <= '5') {
        const boxNumber = parseInt(event.key);
        if (!hasOpenedBox) {
            openBox(boxNumber);
        }
    }
}

// ===== FUNCIONES DE UTILIDAD =====

/**
 * Resetea el estado del juego (solo para desarrollo/testing)
 * Esta función no se expone en la interfaz de usuario
 */
function resetGame() {
    localStorage.removeItem('snackfly_mystery_box_session');
    location.reload();
}

/**
 * Obtiene estadísticas del juego desde localStorage
 * @returns {Object} Estadísticas del juego
 */
function getGameStats() {
    const sessionData = localStorage.getItem('snackfly_mystery_box_session');
    if (sessionData) {
        return JSON.parse(sessionData);
    }
    return null;
}

// ===== EVENTOS ADICIONALES =====

// Prevenir clic derecho en las cajas para evitar inspección
document.addEventListener('contextmenu', function(event) {
    if (event.target.closest('.mystery-box')) {
        event.preventDefault();
    }
});

// Agregar efectos de partículas al abrir modal (opcional)
function createConfetti() {
    // Esta función podría expandirse para crear efectos de confeti
    console.log('🎊 ¡Confeti virtual!');
}

console.log('✅ Sistema de Cajas Misteriosas cargado completamente');

