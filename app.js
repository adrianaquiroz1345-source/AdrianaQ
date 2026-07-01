/* ==========================================================================
   EL BOSQUE MÁGICO DE LAS FIGURAS - LÓGICA PRINCIPAL (app.js)
   ========================================================================== */

// --- CONFIGURACIÓN Y CONSTANTES ---
const SHAPES = ['circulo', 'cuadrado', 'triangulo', 'rectangulo', 'estrella'];
const COLORS = ['rojo', 'azul', 'verde', 'amarillo', 'naranja', 'morado'];

const SHAPE_NAMES = {
    'circulo': 'círculo',
    'cuadrado': 'cuadrado',
    'triangulo': 'triángulo',
    'rectangulo': 'rectángulo',
    'estrella': 'estrella'
};

const COLOR_NAMES = {
    'rojo': 'rojo',
    'azul': 'azul',
    'verde': 'verde',
    'amarillo': 'amarillo',
    'naranja': 'naranja',
    'morado': 'morado'
};

const COLOR_CODES = {
    'rojo': 'var(--color-shape-red)',
    'azul': 'var(--color-shape-blue)',
    'verde': 'var(--color-shape-green)',
    'amarillo': 'var(--color-shape-yellow)',
    'naranja': 'var(--color-shape-orange)',
    'morado': 'var(--color-shape-purple)'
};

// --- ESTADO DEL JUEGO ---
const state = {
    score: 0,
    currentLevel: 1,
    levelRound: 0,       // Ronda actual dentro de un nivel (se necesitan 3 aciertos por nivel)
    maxRounds: 3,        // Cantidad de aciertos para superar nivel 1 y 2
    isSoundEnabled: true,
    isVoiceEnabled: true,
    lastInstruction: '',
    voices: [],
    selectedVoice: null,
    // Estado específico de construcción (Nivel 3)
    level3PlacedCount: 0,
    level3TotalCount: 5
};

// --- ELEMENTOS DEL DOM ---
const DOM = {
    btnSound: document.getElementById('btn-sound'),
    btnVoice: document.getElementById('btn-voice'),
    voiceSelect: document.getElementById('voice-select'),
    scoreVal: document.getElementById('score-val'),
    starSlots: document.querySelectorAll('.star-slot'),
    claraSpeech: document.getElementById('clara-speech'),
    btnRepeat: document.getElementById('btn-repeat'),
    
    // Pantallas
    screenWelcome: document.getElementById('screen-welcome'),
    screenPlay: document.getElementById('screen-play'),
    screenCongrats: document.getElementById('screen-congrats'),
    
    // Botones de acción
    btnStart: document.getElementById('btn-start'),
    btnReplay: document.getElementById('btn-replay'),
    
    // Contenedores de niveles
    level1: document.getElementById('game-level-1'),
    level2: document.getElementById('game-level-2'),
    level3: document.getElementById('game-level-3'),
    
    // Elementos Nivel 1
    shapesGrid: document.getElementById('shapes-grid'),
    
    // Elementos Nivel 2
    monsterPalette: document.getElementById('monster-shapes-palette'),
    monsterDropzone: document.getElementById('monster-dropzone'),
    monsterTargetShadow: document.getElementById('monster-target-shadow'),
    monsterRequestLabel: document.getElementById('monster-request-label'),
    monsterMouth: document.getElementById('monster-mouth'),
    pupils: document.querySelectorAll('.pupil'),
    
    // Elementos Nivel 3
    builderPalette: document.getElementById('builder-shapes-palette'),
    silhouetteWrapper: document.getElementById('silhouette-wrapper'),
    
    // Lienzo de partículas
    particleCanvas: document.getElementById('particle-canvas')
};

// --- SINTETIZADOR DE EFECTOS DE SONIDO (WEB AUDIO API) ---
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playSound(type) {
    if (!state.isSoundEnabled) return;
    try {
        initAudio();
        const now = audioCtx.currentTime;

        switch (type) {
            case 'magic': {
                // Sonido de varita mágica / destello al dar una indicación
                const notes = [587.33, 659.25, 783.99, 880.00, 1046.50]; // D5, E5, G5, A5, C6
                notes.forEach((freq, i) => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + i * 0.05);
                    
                    gain.gain.setValueAtTime(0.08, now + i * 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.25);
                    
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.start(now + i * 0.05);
                    osc.stop(now + i * 0.05 + 0.3);
                });
                break;
            }
            case 'success': {
                // Campanitas mágicas alegres (arpegio rápido)
                const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
                notes.forEach((freq, i) => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + i * 0.08);
                    
                    gain.gain.setValueAtTime(0.12, now + i * 0.08);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25);
                    
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.start(now + i * 0.08);
                    osc.stop(now + i * 0.08 + 0.3);
                });
                break;
            }
            case 'error': {
                // Zumbido grave y descendente de error
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(140, now);
                osc.frequency.linearRampToValueAtTime(70, now + 0.35);
                
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.linearRampToValueAtTime(0.001, now + 0.35);
                
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.35);
                break;
            }
            case 'pop': {
                // Sonido de burbuja al encajar o presionar
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(350, now);
                osc.frequency.exponentialRampToValueAtTime(1000, now + 0.07);
                
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.08);
                break;
            }
            case 'chomp': {
                // Efecto de crujido/comer
                const bufferSize = audioCtx.sampleRate * 0.12;
                const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1; // Ruido blanco
                }
                
                const noise = audioCtx.createBufferSource();
                noise.buffer = buffer;
                
                const filter = audioCtx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(300, now);
                filter.Q.setValueAtTime(3, now);
                
                const gain = audioCtx.createGain();
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                
                noise.connect(filter);
                filter.connect(gain);
                gain.connect(audioCtx.destination);
                
                noise.start(now);
                noise.stop(now + 0.12);
                
                // Un segundo crujido rápido
                setTimeout(() => {
                    const now2 = audioCtx.currentTime;
                    const noise2 = audioCtx.createBufferSource();
                    noise2.buffer = buffer;
                    const gain2 = audioCtx.createGain();
                    gain2.gain.setValueAtTime(0.2, now2);
                    gain2.gain.exponentialRampToValueAtTime(0.001, now2 + 0.1);
                    noise2.connect(filter);
                    filter.connect(gain2);
                    gain2.connect(audioCtx.destination);
                    noise2.start(now2);
                    noise2.stop(now2 + 0.1);
                }, 70);
                break;
            }
            case 'levelup': {
                // Fanfarria triunfal por nivel completado
                const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51]; // Do Mayor ascendente
                notes.forEach((freq, i) => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.type = i === notes.length - 1 ? 'sine' : 'triangle';
                    osc.frequency.setValueAtTime(freq, now + i * 0.09);
                    
                    gain.gain.setValueAtTime(0.12, now + i * 0.09);
                    gain.gain.setValueAtTime(0.12, now + i * 0.09 + 0.08);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.25);
                    
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.start(now + i * 0.09);
                    osc.stop(now + i * 0.09 + 0.25);
                });
                break;
            }
        }
    } catch (e) {
        console.warn('Error al reproducir audio sintetizado:', e);
    }
}

// --- SINTETIZADOR DE VOZ DE CLARA (TEXT TO SPEECH) ---
function loadVoices() {
    if (!window.speechSynthesis) return;
    state.voices = window.speechSynthesis.getVoices();
    DOM.voiceSelect.innerHTML = '';
    
    // Filtrar voces en español
    const esVoices = state.voices.filter(v => v.lang.startsWith('es'));
    
    if (esVoices.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'Voz predeterminada';
        DOM.voiceSelect.appendChild(opt);
        state.selectedVoice = null;
        return;
    }
    
    // Opción por defecto recomendada: Voz nativa del sistema (más estable)
    const defaultOpt = document.createElement('option');
    defaultOpt.value = 'default';
    defaultOpt.textContent = 'Voz de Clara (Por Defecto)';
    DOM.voiceSelect.appendChild(defaultOpt);
    
    esVoices.forEach((voice, index) => {
        const opt = document.createElement('option');
        opt.value = index;
        opt.textContent = voice.name.replace(/Microsoft|Google/gi, '').trim();
        DOM.voiceSelect.appendChild(opt);
    });
    
    DOM.voiceSelect.value = 'default';
    state.selectedVoice = null;
}

// Detectar cambio de voces en navegadores (Chrome carga voces asíncronamente)
if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
}

DOM.voiceSelect.addEventListener('change', () => {
    const esVoices = state.voices.filter(v => v.lang.startsWith('es'));
    const val = DOM.voiceSelect.value;
    if (val === 'default') {
        state.selectedVoice = null;
    } else {
        const index = parseInt(val, 10);
        state.selectedVoice = esVoices[index] || null;
    }
    speak(state.lastInstruction, true);
});

function speak(text, playIntroSound = false) {
    state.lastInstruction = text;
    DOM.claraSpeech.textContent = text;
    
    // Reproducir destello de sonido mágico de atención al dar la indicación si corresponde
    if (playIntroSound) {
        playSound('magic');
    }
    
    if (!window.speechSynthesis) return;
    
    // Solución para desatorar y reanudar la síntesis en Chrome/Edge/Safari
    try {
        window.speechSynthesis.resume();
    } catch (e) {}
    window.speechSynthesis.cancel();
    
    // Un pequeño retraso de 80ms garantiza que el navegador limpie la cola
    // y no ignore la nueva instrucción de voz (bug muy común de Chrome)
    setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Si la voz está silenciada, emitimos en silencio (volumen 0) para evitar colapsar la cola
        utterance.volume = state.isVoiceEnabled ? 1.0 : 0.0;
        
        if (state.selectedVoice) {
            utterance.voice = state.selectedVoice;
        } else {
            // Usar el idioma español genérico 'es' para máxima compatibilidad y estabilidad
            utterance.lang = 'es';
        }
        
        // Configuración amigable para preescolar
        utterance.rate = 0.85;
        utterance.pitch = 1.15;
        
        window.speechSynthesis.speak(utterance);
    }, 80);
}

// --- CANVAS DE PARTÍCULAS / EFECTOS ---
let particles = [];
let particleAnimId = null;
let canvasElement = null;
let canvasCtx = null;

function setupParticleCanvas() {
    DOM.particleCanvas.innerHTML = '';
    canvasElement = document.createElement('canvas');
    canvasElement.style.width = '100%';
    canvasElement.style.height = '100%';
    canvasElement.style.display = 'block';
    DOM.particleCanvas.appendChild(canvasElement);
    
    canvasCtx = canvasElement.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    if (canvasElement) {
        canvasElement.width = DOM.particleCanvas.clientWidth;
        canvasElement.height = DOM.particleCanvas.clientHeight;
    }
}

class Particle {
    constructor(x, y, color = null, isConfetti = false) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 8 + 4;
        this.speedX = Math.random() * 6 - 3;
        this.speedY = isConfetti ? (Math.random() * 4 + 2) : (Math.random() * -5 - 2);
        this.color = color || `hsl(${Math.random() * 360}, 100%, 70%)`;
        this.opacity = 1;
        this.decay = Math.random() * 0.015 + 0.01;
        this.angle = Math.random() * 360;
        this.rotationSpeed = Math.random() * 10 - 5;
        this.isConfetti = isConfetti;
        this.shapeType = Math.random() > 0.5 ? 'circle' : 'square';
    }
    
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.angle += this.rotationSpeed;
        
        if (this.isConfetti) {
            this.speedX += Math.sin(this.y / 20) * 0.05; // Movimiento ondeante
            this.opacity -= 0.005;
        } else {
            this.opacity -= this.decay;
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.angle * Math.PI) / 180);
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        
        if (this.shapeType === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        }
        ctx.restore();
    }
}

function createBurst(x, y, color = null, count = 25) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color, false));
    }
    startParticleAnimation();
}

function triggerConfetti() {
    const width = canvasElement ? canvasElement.width : window.innerWidth;
    // Lanzar confeti continuo desde los laterales superiores
    let timer = setInterval(() => {
        if (state.currentScreen !== 'congrats') {
            clearInterval(timer);
            return;
        }
        for (let i = 0; i < 5; i++) {
            particles.push(new Particle(Math.random() * width, -10, null, true));
        }
    }, 100);
    startParticleAnimation();
}

function animateParticles() {
    if (!canvasCtx || !canvasElement) return;
    
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Filtrar partículas visibles
    particles = particles.filter(p => p.opacity > 0 && p.y < canvasElement.height + 20);
    
    particles.forEach(p => {
        p.update();
        p.draw(canvasCtx);
    });
    
    if (particles.length > 0 || state.currentScreen === 'congrats') {
        particleAnimId = requestAnimationFrame(animateParticles);
    } else {
        cancelAnimationFrame(particleAnimId);
        particleAnimId = null;
    }
}

function startParticleAnimation() {
    if (!particleAnimId) {
        animateParticles();
    }
}

// --- CONSTRUCCIÓN DE CÓDIGO SVG PARA FIGURAS ---
function getShapeSVG(shape, colorCode, className = '') {
    const classAttr = className ? `class="${className}"` : '';
    switch (shape) {
        case 'circulo':
            return `<svg viewBox="0 0 100 100" ${classAttr}><circle cx="50" cy="50" r="40" fill="${colorCode}"/></svg>`;
        case 'cuadrado':
            return `<svg viewBox="0 0 100 100" ${classAttr}><rect x="15" y="15" width="70" height="70" rx="8" fill="${colorCode}"/></svg>`;
        case 'triangulo':
            return `<svg viewBox="0 0 100 100" ${classAttr}><polygon points="50,15 15,80 85,80" fill="${colorCode}"/></svg>`;
        case 'rectangulo':
            return `<svg viewBox="0 0 100 100" ${classAttr}><rect x="10" y="25" width="80" height="50" rx="8" fill="${colorCode}"/></svg>`;
        case 'estrella':
            return `<svg viewBox="0 0 100 100" ${classAttr}><polygon points="50,10 63,38 93,38 70,57 78,87 50,70 22,87 30,57 7,38 37,38" fill="${colorCode}"/></svg>`;
        default:
            return '';
    }
}

// --- GESTIÓN DE PANTALLAS ---
function showScreen(screenId) {
    state.currentScreen = screenId.replace('screen-', '');
    
    DOM.screenWelcome.classList.remove('active');
    DOM.screenPlay.classList.remove('active');
    DOM.screenCongrats.classList.remove('active');
    
    // Detener sonidos/voces activos al cambiar de pantalla
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    particles = [];
    
    setTimeout(() => {
        const targetScreen = document.getElementById(screenId);
        targetScreen.classList.add('active');
        
        if (screenId === 'screen-play') {
            startLevel(state.currentLevel);
        } else if (screenId === 'screen-congrats') {
            triggerCongratsFlow();
        }
    }, 200);
}

// --- ACTUALIZAR UI GENERAL ---
function updateHUD() {
    DOM.scoreVal.textContent = state.score;
    
    // Dibujar estrellas activas según la ronda actual
    DOM.starSlots.forEach((slot, index) => {
        if (index < state.levelRound) {
            slot.classList.add('active');
        } else {
            slot.classList.remove('active');
        }
    });
}

// --- LÓGICA DE NIVELES ---

function startLevel(levelNum) {
    state.currentLevel = levelNum;
    state.levelRound = 0;
    updateHUD();
    
    DOM.level1.classList.remove('active');
    DOM.level2.classList.remove('active');
    DOM.level3.classList.remove('active');
    
    if (levelNum === 1) {
        DOM.level1.classList.add('active');
        setupLevel1Round();
    } else if (levelNum === 2) {
        DOM.level2.classList.add('active');
        setupLevel2Round();
    } else if (levelNum === 3) {
        DOM.level3.classList.add('active');
        setupLevel3();
    }
}

function nextRoundOrLevel() {
    state.levelRound++;
    updateHUD();
    
    if (state.levelRound >= state.maxRounds) {
        // Superó el nivel actual
        setTimeout(() => {
            playSound('levelup');
            createBurst(window.innerWidth / 2, window.innerHeight / 2, '#fff350', 50);
            
            if (state.currentLevel < 3) {
                const nextLvl = state.currentLevel + 1;
                speak(`¡Increíble! ¡Completaste el nivel ${state.currentLevel}! Ahora vamos al siguiente nivel.`, true);
                setTimeout(() => {
                    startLevel(nextLvl);
                }, 3000);
            } else {
                // Juego finalizado
                showScreen('screen-congrats');
            }
        }, 1200);
    } else {
        // Siguiente ronda dentro del mismo nivel
        setTimeout(() => {
            if (state.currentLevel === 1) {
                setupLevel1Round();
            } else if (state.currentLevel === 2) {
                setupLevel2Round();
            }
        }, 1500);
    }
}

// --- NIVEL 1: ENCUENTRA LA FIGURA ---
let level1Target = null;

function setupLevel1Round() {
    DOM.shapesGrid.innerHTML = '';
    
    // Elegir figura y color correctos al azar
    const targetShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const targetColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    level1Target = { shape: targetShape, color: targetColor };
    
    // Crear opciones (1 correcta y 5 distractores)
    const options = [{ shape: targetShape, color: targetColor }];
    
    // Distractor 1: Misma forma, diferente color
    let diffColor = COLORS.find(c => c !== targetColor);
    options.push({ shape: targetShape, color: diffColor });
    
    // Distractor 2: Diferente forma, mismo color
    let diffShape = SHAPES.find(s => s !== targetShape);
    options.push({ shape: diffShape, color: targetColor });
    
    // Distractores restantes completamente aleatorios sin duplicar la opción exacta
    while (options.length < 6) {
        const rShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        const rColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        
        const exists = options.some(opt => opt.shape === rShape && opt.color === rColor);
        if (!exists) {
            options.push({ shape: rShape, color: rColor });
        }
    }
    
    // Mezclar opciones
    options.sort(() => Math.random() - 0.5);
    
    // Dibujar en pantalla
    options.forEach(opt => {
        const item = document.createElement('div');
        item.className = 'shape-item';
        item.dataset.shape = opt.shape;
        item.dataset.color = opt.color;
        item.innerHTML = getShapeSVG(opt.shape, COLOR_CODES[opt.color]);
        
        item.addEventListener('click', (e) => handleLevel1Click(item, opt));
        DOM.shapesGrid.appendChild(item);
    });
    
    // Preguntar por voz
    const shapeText = SHAPE_NAMES[targetShape];
    const colorText = COLOR_NAMES[targetColor];
    speak(`Clara dice: Busca el ${shapeText} de color ${colorText}.`, true);
}

function handleLevel1Click(element, option) {
    // Evitar múltiples clics rápidos si ya se acertó
    if (element.classList.contains('correct') || DOM.shapesGrid.style.pointerEvents === 'none') return;
    
    const isCorrect = option.shape === level1Target.shape && option.color === level1Target.color;
    
    if (isCorrect) {
        DOM.shapesGrid.style.pointerEvents = 'none'; // Bloquear pantalla
        element.classList.add('correct');
        playSound('success');
        state.score += 10;
        
        // Burst de estrellitas de color correspondiente
        const rect = element.getBoundingClientRect();
        createBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, COLOR_CODES[option.color], 20);
        
        speak("¡Excelente! ¡Lo encontraste!");
        
        setTimeout(() => {
            DOM.shapesGrid.style.pointerEvents = 'auto';
            nextRoundOrLevel();
        }, 1000);
    } else {
        element.classList.add('incorrect');
        playSound('error');
        
        // Quitar la clase sacudida después de la animación para que pueda volver a sacudirse
        setTimeout(() => element.classList.remove('incorrect'), 500);
        
        const shapeTextTarget = SHAPE_NAMES[level1Target.shape];
        const colorTextTarget = COLOR_NAMES[level1Target.color];
        
        const clickedShapeName = SHAPE_NAMES[option.shape];
        const clickedColorName = COLOR_NAMES[option.color];
        
        speak(`¡Uy! Ese es un ${clickedShapeName} de color ${clickedColorName}. Sigue buscando el ${shapeTextTarget} ${colorTextTarget}.`);
    }
}

// --- NIVEL 2: EL MONSTRUO HAMBRIENTO ---
let level2Target = null;

function setupLevel2Round() {
    DOM.monsterPalette.innerHTML = '';
    DOM.monsterMouth.classList.remove('eating');
    
    // Elegir la figura objetivo para alimentar al monstruo
    const targetShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const targetColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    level2Target = { shape: targetShape, color: targetColor };
    
    // Colocar silueta en la boca del monstruo
    DOM.monsterTargetShadow.innerHTML = getShapeSVG(targetShape, '#ffffff');
    
    // Crear la paleta de opciones para arrastrar
    const options = [{ shape: targetShape, color: targetColor }];
    
    // Distractores
    let diffColor = COLORS.find(c => c !== targetColor);
    options.push({ shape: targetShape, color: diffColor });
    
    let diffShape = SHAPES.find(s => s !== targetShape);
    options.push({ shape: diffShape, color: targetColor });
    
    while (options.length < 4) {
        const rShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
        const rColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        const exists = options.some(opt => opt.shape === rShape && opt.color === rColor);
        if (!exists) {
            options.push({ shape: rShape, color: rColor });
        }
    }
    
    options.sort(() => Math.random() - 0.5);
    
    // Mostrar en la paleta
    options.forEach(opt => {
        const item = document.createElement('div');
        item.className = 'draggable-shape';
        item.dataset.shape = opt.shape;
        item.dataset.color = opt.color;
        item.innerHTML = getShapeSVG(opt.shape, COLOR_CODES[opt.color]);
        
        setupDragging(item, opt);
        DOM.monsterPalette.appendChild(item);
    });
    
    const shapeText = SHAPE_NAMES[targetShape];
    const colorText = COLOR_NAMES[targetColor];
    DOM.monsterRequestLabel.textContent = `¡Quiero ${shapeText} ${colorText}!`;
    speak(`¡El monstruo tiene mucha hambre! Aliméntalo arrastrando el ${shapeText} de color ${colorText} a su boca.`, true);
}

// --- LOGICA DE ARRASTRAR Y SOLTAR CON POINTER EVENTS (MOUSE + TÁCTIL) ---
let dragClone = null;
let activeDragData = null;

function setupDragging(element, data) {
    element.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        initAudio();
        
        activeDragData = {
            shape: data.shape,
            color: data.color,
            originElement: element
        };
        
        element.classList.add('dragging');
        playSound('pop');
        
        // Crear clon visual
        dragClone = document.createElement('div');
        dragClone.className = 'drag-clone';
        dragClone.innerHTML = getShapeSVG(data.shape, COLOR_CODES[data.color]);
        dragClone.style.left = `${e.clientX}px`;
        dragClone.style.top = `${e.clientY}px`;
        document.body.appendChild(dragClone);
        
        // Capturar pointer
        dragClone.setPointerCapture(e.pointerId);
        
        dragClone.addEventListener('pointermove', onPointerMove);
        dragClone.addEventListener('pointerup', onPointerUp);
    });
}

function onPointerMove(e) {
    if (!dragClone || !activeDragData) return;
    
    dragClone.style.left = `${e.clientX}px`;
    dragClone.style.top = `${e.clientY}px`;
    
    // Hacer que los ojos del monstruo miren la figura arrastrada
    if (state.currentLevel === 2) {
        animateMonsterEyes(e.clientX, e.clientY);
        
        // Comprobar colisión con el monstruo
        const monsterRect = DOM.monsterDropzone.getBoundingClientRect();
        const pointerOverMonster = (
            e.clientX >= monsterRect.left &&
            e.clientX <= monsterRect.right &&
            e.clientY >= monsterRect.top &&
            e.clientY <= monsterRect.bottom
        );
        
        if (pointerOverMonster) {
            DOM.monsterDropzone.classList.add('hovered');
        } else {
            DOM.monsterDropzone.classList.remove('hovered');
        }
    }
    
    // Comprobar colisión en nivel 3
    if (state.currentLevel === 3) {
        checkLevel3Hover(e.clientX, e.clientY);
    }
}

function onPointerUp(e) {
    if (!dragClone || !activeDragData) return;
    
    const clientX = e.clientX;
    const clientY = e.clientY;
    
    // Limpiar clon y clases
    dragClone.releasePointerCapture(e.pointerId);
    dragClone.remove();
    dragClone = null;
    
    activeDragData.originElement.classList.remove('dragging');
    
    if (state.currentLevel === 2) {
        // Volver a centrar ojos
        resetMonsterEyes();
        
        const monsterRect = DOM.monsterDropzone.getBoundingClientRect();
        DOM.monsterDropzone.classList.remove('hovered');
        
        const droppedInMonster = (
            clientX >= monsterRect.left &&
            clientX <= monsterRect.right &&
            clientY >= monsterRect.top &&
            clientY <= monsterRect.bottom
        );
        
        if (droppedInMonster) {
            handleMonsterFeed(activeDragData);
        }
    }
    
    if (state.currentLevel === 3) {
        handleLevel3Drop(clientX, clientY, activeDragData);
    }
    
    activeDragData = null;
}

// Ojos del monstruo mirando la figura
function animateMonsterEyes(targetX, targetY) {
    DOM.pupils.forEach(pupil => {
        const eyeRect = pupil.parentElement.getBoundingClientRect();
        const eyeCenterX = eyeRect.left + eyeRect.width / 2;
        const eyeCenterY = eyeRect.top + eyeRect.height / 2;
        
        const angle = Math.atan2(targetY - eyeCenterY, targetX - eyeCenterX);
        const maxDist = 6; // Límite de desplazamiento del iris
        
        const pupilX = Math.cos(angle) * maxDist;
        const pupilY = Math.sin(angle) * maxDist;
        
        pupil.style.transform = `translate(${pupilX}px, ${pupilY}px)`;
    });
}

function resetMonsterEyes() {
    DOM.pupils.forEach(pupil => {
        pupil.style.transform = 'translate(0, 0)';
    });
}

function handleMonsterFeed(draggedData) {
    const isCorrect = draggedData.shape === level2Target.shape && draggedData.color === level2Target.color;
    
    if (isCorrect) {
        // Bloquear paleta mientras come
        DOM.monsterPalette.style.pointerEvents = 'none';
        
        DOM.monsterDropzone.classList.add('eating');
        playSound('chomp');
        state.score += 15;
        
        // Burst de comida en la boca
        const mRect = DOM.monsterMouth.getBoundingClientRect();
        createBurst(mRect.left + mRect.width / 2, mRect.top + mRect.height / 2, COLOR_CODES[draggedData.color], 15);
        
        // Ocultar silueta comida
        DOM.monsterTargetShadow.innerHTML = '';
        DOM.monsterRequestLabel.textContent = '¡Ñam Ñam! 😋';
        
        speak("¡Delicioso! ¡Gracias por alimentarme!");
        
        setTimeout(() => {
            DOM.monsterPalette.style.pointerEvents = 'auto';
            nextRoundOrLevel();
        }, 1500);
    } else {
        // Animación monstruo disgustado o alerta
        playSound('error');
        
        const shapeText = SHAPE_NAMES[level2Target.shape];
        const colorText = COLOR_NAMES[level2Target.color];
        
        const clickedShape = SHAPE_NAMES[draggedData.shape];
        const clickedColor = COLOR_NAMES[draggedData.color];
        
        speak(`¡Ouch! El monstruo no quiere comer ${clickedShape} ${clickedColor}. Por favor, dale un ${shapeText} de color ${colorText}.`);
    }
}

// --- NIVEL 3: CONSTRUCTOR MÁGICO ---
let level3DropTargets = [];

function setupLevel3() {
    DOM.builderPalette.innerHTML = '';
    state.level3PlacedCount = 0;
    updateHUD();
    
    // Crear el dibujo de siluetas de una casita usando SVG en HTML
    // Un cielo estrellado, sol, techo, casa, puerta
    const houseSVG = `
        <svg viewBox="0 0 400 300" id="house-svg" width="100%" height="100%">
            <!-- Estrella en el cielo -->
            <polygon id="target-sky-star" class="dropzone-target" data-shape="estrella" data-color="morado" 
                     points="60,60 67,73 82,73 70,82 74,97 60,88 46,97 50,82 38,73 53,73" />
            
            <!-- Sol -->
            <circle id="target-sun" class="dropzone-target" data-shape="circulo" data-color="amarillo" 
                    cx="330" cy="70" r="28" />
            
            <!-- Techo -->
            <polygon id="target-roof" class="dropzone-target" data-shape="triangulo" data-color="rojo" 
                     points="200,60 100,140 300,140" />
            
            <!-- Cuerpo de la casita -->
            <rect id="target-wall" class="dropzone-target" data-shape="cuadrado" data-color="azul" 
                  x="130" y="140" width="140" height="130" rx="8" />
            
            <!-- Puerta -->
            <rect id="target-door" class="dropzone-target" data-shape="rectangulo" data-color="naranja" 
                  x="180" y="200" width="40" height="70" rx="4" />
        </svg>
    `;
    
    DOM.silhouetteWrapper.innerHTML = houseSVG;
    
    // Obtener las coordenadas de cada dropzone en pantalla
    setTimeout(() => {
        const svgEl = document.getElementById('house-svg');
        const targets = svgEl.querySelectorAll('.dropzone-target');
        level3DropTargets = Array.from(targets).map(el => {
            return {
                element: el,
                shape: el.getAttribute('data-shape'),
                color: el.getAttribute('data-color'),
                filled: false
            };
        });
    }, 100);
    
    // Paleta de figuras para construir la casa (5 formas en total)
    const buildPieces = [
        { shape: 'triangulo', color: 'rojo' },
        { shape: 'cuadrado', color: 'azul' },
        { shape: 'rectangulo', color: 'naranja' },
        { shape: 'circulo', color: 'amarillo' },
        { shape: 'estrella', color: 'morado' }
    ];
    
    // Desordenar las piezas para que las busquen
    buildPieces.sort(() => Math.random() - 0.5);
    
    buildPieces.forEach(opt => {
        const item = document.createElement('div');
        item.className = 'draggable-shape';
        item.dataset.shape = opt.shape;
        item.dataset.color = opt.color;
        item.innerHTML = getShapeSVG(opt.shape, COLOR_CODES[opt.color]);
        
        setupDragging(item, opt);
        DOM.builderPalette.appendChild(item);
    });
    
    speak("¡Somos constructores! Arrastra cada una de las figuras geométricas brillantes a su lugar punteado en el dibujo.", true);
}

function checkLevel3Hover(clientX, clientY) {
    level3DropTargets.forEach(target => {
        if (target.filled) return;
        
        const rect = target.element.getBoundingClientRect();
        
        // Comprobar si el puntero está dentro de los límites del elemento SVG en la pantalla
        const isHovered = (
            clientX >= rect.left &&
            clientX <= rect.right &&
            clientY >= rect.top &&
            clientY <= rect.bottom
        );
        
        if (isHovered && target.shape === activeDragData.shape) {
            target.element.classList.add('hovered');
        } else {
            target.element.classList.remove('hovered');
        }
    });
}

function handleLevel3Drop(clientX, clientY, draggedData) {
    let snapped = false;
    
    for (let target of level3DropTargets) {
        if (target.filled) continue;
        
        const rect = target.element.getBoundingClientRect();
        const isOver = (
            clientX >= rect.left &&
            clientX <= rect.right &&
            clientY >= rect.top &&
            clientY <= rect.bottom
        );
        
        // Quitar la clase hover
        target.element.classList.remove('hovered');
        
        // Debe coincidir tipo de forma y estar sobre el elemento
        if (isOver && target.shape === draggedData.shape) {
            // ¡Encajó con éxito!
            target.filled = true;
            target.element.classList.add('filled');
            
            // Pintar la forma en el SVG con su color final
            target.element.style.fill = COLOR_CODES[target.color];
            target.element.style.stroke = 'white';
            
            // Ocultar pieza original de la paleta
            draggedData.originElement.style.visibility = 'hidden';
            draggedData.originElement.style.pointerEvents = 'none';
            
            playSound('pop');
            createBurst(clientX, clientY, COLOR_CODES[target.color], 15);
            
            state.level3PlacedCount++;
            state.score += 20;
            updateHUD();
            
            snapped = true;
            
            const shapeName = SHAPE_NAMES[target.shape];
            speak(`¡Muy bien! Colocaste el ${shapeName}.`);
            
            break;
        }
    }
    
    if (!snapped) {
        playSound('error');
    }
    
    // Comprobar victoria del nivel 3
    if (state.level3PlacedCount === state.level3TotalCount) {
        setTimeout(() => {
            playSound('levelup');
            
            // Pintar cielo y pasto del fondo SVG para completarlo mágicamente
            const svgEl = document.getElementById('house-svg');
            
            // Añadir un fondo degradado al cielo del SVG e iluminar el paisaje
            svgEl.style.transition = 'background-color 1.5s ease';
            svgEl.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            
            speak("¡Fantástico! ¡Has construido una casita mágica con figuras geométricas!", true);
            
            setTimeout(() => {
                showScreen('screen-congrats');
            }, 3000);
        }, 1200);
    }
}

// --- PANTALLA FELICIDADES ---
function triggerCongratsFlow() {
    state.currentLevel = 1;
    state.levelRound = 0;
    
    // Confeti gigante continuo
    setupParticleCanvas();
    triggerConfetti();
    
    playSound('levelup');
    speak("¡Felicidades, amiguito! Eres un súper explorador de las figuras geométricas. ¡Jugaste increíble! ¿Quieres jugar de nuevo?", true);
}

// --- CONTROLES DE VOLUMEN / INTERFAZ ---

function toggleSound() {
    state.isSoundEnabled = !state.isSoundEnabled;
    if (state.isSoundEnabled) {
        DOM.btnSound.classList.remove('muted');
        DOM.btnSound.textContent = '🔊';
        playSound('pop');
    } else {
        DOM.btnSound.classList.add('muted');
        DOM.btnSound.textContent = '🔇';
    }
}

function toggleVoice() {
    state.isVoiceEnabled = !state.isVoiceEnabled;
    if (state.isVoiceEnabled) {
        DOM.btnVoice.classList.remove('muted');
        DOM.btnVoice.textContent = '🗣️';
        speak(state.lastInstruction);
    } else {
        DOM.btnVoice.classList.add('muted');
        DOM.btnVoice.textContent = '🔇';
        if (window.speechSynthesis) window.speechSynthesis.cancel();
    }
}

// --- INICIALIZACIÓN ---
function init() {
    setupParticleCanvas();
    
    // Event Listeners
    DOM.btnStart.addEventListener('click', () => {
        initAudio();
        playSound('pop');
        
        // Desbloquear TTS en navegadores móviles (iOS/Android) con emisión inicial vacía
        if (window.speechSynthesis) {
            try {
                window.speechSynthesis.resume();
                const unlock = new SpeechSynthesisUtterance('');
                unlock.volume = 0;
                window.speechSynthesis.speak(unlock);
            } catch (e) {}
        }
        
        showScreen('screen-play');
    });
    
    DOM.btnReplay.addEventListener('click', () => {
        initAudio();
        playSound('pop');
        
        // Desbloquear TTS al reiniciar
        if (window.speechSynthesis) {
            try {
                window.speechSynthesis.resume();
                const unlock = new SpeechSynthesisUtterance('');
                unlock.volume = 0;
                window.speechSynthesis.speak(unlock);
            } catch (e) {}
        }
        
        showScreen('screen-welcome');
    });
    
    DOM.btnSound.addEventListener('click', toggleSound);
    DOM.btnVoice.addEventListener('click', toggleVoice);
    
    DOM.btnRepeat.addEventListener('click', () => {
        initAudio();
        playSound('pop');
        speak(state.lastInstruction, true);
    });

    // Hacer que el avatar de Clara sea interactivo al hacer clic para repetir la instrucción
    const claraAvatar = document.getElementById('clara-avatar');
    if (claraAvatar) {
        claraAvatar.style.cursor = 'pointer';
        claraAvatar.addEventListener('click', () => {
            initAudio();
            speak(state.lastInstruction, true);
        });
    }

    const welcomeChar = document.querySelector('.character-welcome');
    if (welcomeChar) {
        welcomeChar.style.cursor = 'pointer';
        welcomeChar.addEventListener('click', () => {
            initAudio();
            speak("¡Hola! ¡Soy el hada Clara! Haz clic en jugar para empezar la aventura.", true);
        });
    }
    
    // Clara saluda al cargar la página
    speak("¡Bienvenido al bosque mágico de las figuras geométricas!", true);
}

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);
